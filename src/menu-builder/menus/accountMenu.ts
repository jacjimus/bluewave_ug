import SMSMessenger from "../../services/sendSMS";
import { registerDependant, fetchMemberStatusData, updatePremium } from "../../services/aar";
import { v4 as uuidv4 } from 'uuid';
import { airtelMoney } from "../../services/payment";
import { Op } from "sequelize";
import { calculateProrationPercentage, formatAmount } from "../../services/utils";
import moment from "moment";



const accountMenu = async (args: any, db: any) => {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;

    const trimmedPhoneNumber = phoneNumber.replace("+", "").substring(3);
    const smsPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

    const currentUser = await db.users.findOne({
        where: {
            [Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
        },
        limit: 1,
    });
    if (!currentUser) {
        response = "END You are not registered on Dwaliro"
        return response
    }

    let paidPolicies = await db.policies.findAll({
        where: {
            user_id: currentUser?.user_id,
            policy_status: "paid"
        },
        order: [
            ['policy_id', 'DESC'],
        ],
        limit: 6
    });

    let userPolicy = await db.policies.findOne({
        where: {
            user_id: currentUser?.user_id,
            policy_status: "paid"
        },
        order: [
            ['policy_id', 'DESC'],
        ],
        limit: 1
    });

    if (paidPolicies.length == 0) {
        response = "END You have no paid policies"
        return response
    }




    let policyMessages = await paidPolicies.map((policy: any, index: number) => {
        // check if the policy is due for monthly renewal and send a reminder
        let monthly_renewal_date = new Date(policy.policy_paid_date);
        if (policy.installment_type == 2) {
            monthly_renewal_date.setMonth(monthly_renewal_date.getMonth() + 1);
            
            if (monthly_renewal_date < new Date()) {
                // send a reminder
                return `Dwaliro ${policy.policy_type} Inpatient UGX ${policy.premium.toLocaleString()}  is due for renewal on ${monthly_renewal_date.toLocaleString()}`
            } else {
                return `Dwaliro ${policy.policy_type} Inpatient UGX ${policy.premium.toLocaleString()}  is ACTIVE until ${monthly_renewal_date.toLocaleString()}`

            }
        }
        else {
            return `Dwaliro ${policy.policy_type} Inpatient UGX ${policy.premium.toLocaleString()}  is ACTIVE until ${new Date(policy.policy_end_date).toLocaleString()}`
        }


    });

    if (currentStep == 1) {
        response = "CON My Account" +
            "\n1. Policy Status" +
            "\n2. Renew Policy" +
            "\n3. Cancel Policy" +
            "\n4. Add Next of Kin" +
            "\n5. Update Gender and Date of birth" +
            "\n6. Add Dependants";
    }
    else if (currentStep == 2) {
        console.log("allSteps", allSteps)
        console.log('Current step', currentStep);
        console.log('User text', userText)
        switch (userText) {
            case "1":
                response = paidPolicies.length > 0 ? `CON ${policyMessages[0]}\n1. Next` : "END You have no paid policy"
                break;
            case "2":
                // last 6 unpaid policies
                paidPolicies = paidPolicies.slice(-6);
                if (paidPolicies?.length === 0) {
                    response = "END You have no paid policies"
                }
                else {
                    // list all the pending policies
                    response = "CON " + paidPolicies.map((policy: any, index: number) => {
                        return `\n${index + 1}. ${policy.policy_type} at UGX ${policy.premium.toLocaleString()} `
                    }
                    ).join("");
                }
                break;
            case "3":

                if (paidPolicies.length > 0) {
                    response = `CON ${policyMessages[policyMessages.length - 1]}\n1. Cancel Policy` + "\n0. Back \n00. Main Menu"
                }
                else {
                    response = "END You have no policies"
                }
                break;
            case "4":
                response = "CON Enter Full Name of your Next of Kin (Above 0 - 65 years of age)"
                break;
            case "5":
                response = 'CON Choose your Gender ' +
                    "\n1. Male" +
                    "\n2. Female";
                break;
            case "6":
                if (userPolicy.total_member_number == 'M') {
                    response = `END You have reached the maximum number of dependants for your policy type  ${userPolicy.beneficiary} ${userPolicy.policy_type}`
                } else {
                    let dependants = await db.beneficiaries.findAll({
                        where: {
                            principal_phone_number: trimmedPhoneNumber,
                            beneficiary_type: "DEPENDANT"
                        },
                        limit: 6
                    });
                    // list all the dependants and option to add new
                    response = "CON " + dependants.map((dependant: any, index: number) => {
                        return `\n${index + 1}. ${dependant.full_name}`
                    }
                    ).join("") + `\n${99}. Add New Dependant`;
                }

                break;
            default:
                response = "END Invalid option selected"
                break;
        }

    } else if (currentStep == 3) {
        console.log("allSteps", allSteps, allSteps[1])
        console.log('Current step', currentStep);
        console.log('User text', userText)
       if(userText == "1" ){

                if (userText == "1" && paidPolicies.length > 1) {
                    response = `CON ${policyMessages[1]}\n1. Next`

                } else if (userText == "1" && paidPolicies.length == 1 && allSteps[1] == '1') {
                    if (paidPolicies[0].installment_type == 1) {
                        response = `END Your available inpatient limit is UGX ${formatAmount(paidPolicies[0].sum_insured)
                            } and Funeral expense of UGX ${formatAmount(paidPolicies[0].last_expense_insured)
                            }`

                    } else {
                        console.log("POLICIES", paidPolicies[0].policy_id)
                        const payments = await db.payments.findAll({
                            where: {
                                policy_id: paidPolicies[0].policy_id,
                                payment_status: "paid"
                            },
                            limit: 3,
                        });
                        console.log("PAYMENTS", payments.length)
                        let proratedPercentage = calculateProrationPercentage(payments.length)
                        console.log("PRORATED PERCENTAGE", paidPolicies[0].sum_insured / proratedPercentage)

                        // add 3 months to the policy start date
                        let policyStartDate = new Date(paidPolicies[0].policy_start_date)
                        console.log("POLICY START DATE", policyStartDate)
                        policyStartDate.setMonth(policyStartDate.getMonth() + payments.length)
                        console.log("POLICY START DATE", policyStartDate)


                        if (policyStartDate > new Date() && paidPolicies[0].installment_type == 2) {
                            response = `END Your available inpatient limit is UGX ${(paidPolicies[0].sum_insured / proratedPercentage).toLocaleString()
                                } and Funeral expense of UGX ${(paidPolicies[0].last_expense_insured / proratedPercentage).toLocaleString()
                                }`
                        } else {
                            response = `END Your outstanding premium is UGX ${(paidPolicies[0].premium).toLocaleString()
                                }\nYour available inpatient limit is UGX ${(paidPolicies[0].sum_insured / proratedPercentage).toLocaleString()
                                } and Funeral expense of UGX ${(paidPolicies[0].last_expense_insured / proratedPercentage).toLocaleString()
                                }`
                        }
                    }
                }else if(allSteps[1] == '6' && userText =="1" ){
                    response = `END Total dependant number is ${userPolicy.total_member_number}`
                }else if(allSteps[1] == '5' && userText =="1" ){
                    response = 'CON Enter your date of birth (dd/mm/yyyy)';
                }
                
            } else if(userText =="2"){
                console.log("allSteps", allSteps, allSteps[2]);
                response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'

                    if(allSteps[1] == "5"){
                        response = 'CON Enter your date of birth (dd/mm/yyyy)';
                    }else{
                                    // last 6 unpaid policies
                const existingUser = await db.users.findOne({
                    where: {
                        phone_number: phoneNumber.replace("+", "").substring(3),
                    },
                    limit: 1,
                });

                paidPolicies = paidPolicies.slice(-6);
                console.log("paidPolicies", paidPolicies)

                let choosenPolicy = paidPolicies[allSteps[2] - 1];

                console.log("CHOOSEN POLICY", choosenPolicy)
                const airtelMoneyPromise = await airtelMoney(
                    existingUser.user_id,
                    2,
                    choosenPolicy.policy_id,
                    phoneNumber.replace("+", "").substring(3),
                    choosenPolicy.premium,
                    existingUser.membership_id,
                    "UG",
                    "UGX"
                );

                const timeout = 1000;

                Promise.race([
                    airtelMoneyPromise,
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            reject(new Error('Airtel Money operation timed out'));
                        }, timeout);
                    })
                ]).then((result) => {
                    // Airtel Money operation completed successfully
                    console.log("============== END TIME - SELF ================ ", phoneNumber, new Date());
                    response = 'END Payment successful';
                    console.log("RESPONSE WAS CALLED", result);
                    return response;
                }).catch((error) => {
                    response = 'END Payment failed';
                    console.log("RESPONSE WAS CALLED", error);
                    return response;
                });

                console.log("============== AFTER CATCH TIME - SELF ================ ", phoneNumber, new Date());
            }

            }else if(userText =="3"){
                console.log("allSteps", allSteps, allSteps[2]);
                console.log("User text cancel", userText)
                if (userText == "1") {
                    const user = await db.users.findOne({
                        where: {
                            phone_number: phoneNumber.replace("+", "").substring(3),
                        },
                        limit: 1,
                    });
                    await db.policies.update({
                        policy_status: "cancelled",
                        user_id: user.user_id
                    }, {
                        where: {
                            policy_id: paidPolicies[0].policy_id
                        }
                    });
                    response = `END Cancelling, you will no longer be covered as from ${new Date(paidPolicies[0].policy_end_date).toDateString()}`
                }
            }else if(userText =="4"){
                response = "CON Enter Next of Kin Phone number"
            }else if(userText =="5"){

                response = 'CON Enter your date of birth (dd/mm/yyyy)';
            }else if(userText =="99"){
                response = 'CON whats the Dependant full name ';
            
            }else {

                response = 'END Invalid option selected ';


        }
       
    } else if (currentStep == 4) {
        console.log("allSteps", allSteps)
        console.log('Current step', currentStep);
        console.log('User text', userText)
        if (userText == "1") {

            response = paidPolicies.length > 0 ? `CON ${policyMessages[2]}` : "END You have no more paid policy"
            
        } else if (userText == "4") {
            const existingUser = await db.users.findOne({
                where: {
                    [Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
                },
                limit: 1,
            });

            let policies = await db.policies.findAll({
                where: {
                    phone_number: smsPhone.replace("+", ""),
                    policy_status: "paid"
                },
                order: [
                    ['policy_id', 'DESC'],
                ],
                limit: 6
            });
            if (policies.length == 0) {
                response = "END You have no paid policies"
            }
            let myPolicy = policies[policies.length - 1]
            const nextOfKinDetails = {
                beneficiary_id: uuidv4(),
                name: allSteps[2],
                phone_number: userText,
                user_id: existingUser.user_id,
                bonus: allSteps[2],
                beneficiary_type: "KIN",
                principal_phone_number: trimmedPhoneNumber

            }

            await db.beneficiaries.create(nextOfKinDetails);
            const sms = `You have added ${nextOfKinDetails.name} as the next of Kin on your Dddwaliro Cover. Any benefits on the cover will be payable to your next of Kin.`
            await SMSMessenger.sendSMS(smsPhone, sms);
            response = `END ${sms}`
        } else if (allSteps[2]  == "2" || allSteps[2]  == "1") {
            let gender = allSteps[2] == "1" ? 'MALE' : 'FEMALE';
            let dob = moment(allSteps[3], "DD/MM/YYYY").format("YYYY-MM-DD");
            console.log(gender, dob);

            await db.users.update(
                {
                    dob: dob,
                    gender: gender,
                },
                {
                    where: {
                        phone_number: trimmedPhoneNumber,
                    },
                }
            );

            response = "END Your gender and date of birth updated successfully"


        } else if (allSteps[2] == "99") {
            response = 'CON whats the Dependant date of birth (dd/mm/yyyy) ';
        }else if( allSteps[1] == '5'){
            console.log("allSteps", allSteps)
            console.log('Current step', currentStep);
            console.log('User text', userText)
            await db.beneficiaries.create({
                beneficiary_id: uuidv4(),
                full_name: allSteps[3],
                beneficiary_type: "DEPENDANT",
                user_id: currentUser.user_id,
                dob: moment(userText, "DD/MM/YYYY").format("YYYY-MM-DD"),
                principal_phone_number: trimmedPhoneNumber
            })

            SMSMessenger.sendSMS(smsPhone, `You have added ${allSteps[3]} as a dependant on your Dwaliro Cover. Any benefits on the cover will be payable to your dependant.`)
            response = "CON Your dependant name saved successfully"
        }
    } else if (currentStep == 5) {
        if (allSteps[2] == "99") {
            console.log("allSteps", allSteps)
            console.log('Current step', currentStep);
            console.log('DOB User text', userText)
            await db.beneficiaries.create({
                beneficiary_id: uuidv4(),
                full_name: allSteps[3],
                beneficiary_type: "DEPENDANT",
                user_id: currentUser.user_id,
                dob: moment(userText, "DD/MM/YYYY").format("YYYY-MM-DD"),
                principal_phone_number: trimmedPhoneNumber
            })

            SMSMessenger.sendSMS(smsPhone, `You have added ${allSteps[3]} as a dependant on your Dwaliro Cover. Any benefits on the cover will be payable to your dependant.`)
            response = "CON Your dependant name saved successfully"
        }

    }
    return response
}

export default accountMenu;