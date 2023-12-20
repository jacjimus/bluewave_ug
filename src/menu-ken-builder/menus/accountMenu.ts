import SMSMessenger from "../../services/sendSMS";
import { registerDependant, fetchMemberStatusData, updatePremium } from "../../services/aar";
import { v4 as uuidv4 } from 'uuid';
import { airtelMoney, airtelMoneyKenya } from "../../services/payment";
import { Op } from "sequelize";
import { calculateProrationPercentage, formatAmount } from "../../services/utils";


const accountMenu = async (args: any, db: any) => {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;

    const trimmedPhoneNumber = phoneNumber.replace("+", "").substring(3);
    const smsPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
    console.log("============== PHONE ================ ", smsPhone)

    const currentUser = await db.users.findOne({
        where: {
            [Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
        },
        limit: 1,
    });

    let paidPolicies = await db.policies.findAll({
        where: {
            user_id: currentUser.user_id,
            policy_status: "paid"
        },
        order: [
            ['policy_id', 'DESC'],
        ],
        limit: 6
    });

    console.log("PAID POLICIES", paidPolicies.length)

    let policyMessages = await paidPolicies.map((policy: any, index: number) => {

        //  ATTENTION HERE ON MERTERNITY AND INPATIENT
        return `AfyaShua ${policy.policy_type} Inpatient Kshs ${policy?.inpatient_cover || 0} and Maternity benefit Kshs ${policy?.maternity_cover || 0} is ${policy.policy_status.toUpperCase()} and paid to ${new Date(policy.installment_date).toDateString()}`
    });




    if (currentStep == 1) {
        response = "CON My Account" +
            "\n1. Policy Status" +
            "\n2. Pay Now" +
            "\n3. Cancel Policy" +
            "\n4. Add Next of Kin" +
            "\n5. Update Gender and Date of birth"+
            "\n6. Add Dependants" ;

    }
    else if (currentStep == 2) {
        // console.log('Current step', currentStep);
         console.log('User text', userText)
        switch (userText) {
            case "1":
                response = paidPolicies.length > 0 ? `CON ${policyMessages[0]}\n1. Next` : "END You have no paid policy"
                break;
            case "2":
                console.log("phoneNumber", smsPhone);
                paidPolicies = await db.policies.findAll({
                    where: {
                        phone_number: smsPhone,
                        policy_status: "paid"
                    }
                });
                // last 6 unpaid policies
                paidPolicies = paidPolicies.slice(-6);
                if (paidPolicies?.length === 0) {
                    response = "END You have no paid policies"
                }
                else {
                    // response = "CON PAY " +
                    //     `\n1 Kshs ${unpaidPolicies[0].premium.toLocaleString()}  monthly` +
                    //     `\n2 Kshs ${unpaidPolicies[0].yearly_premium.toLocaleString()}  yearly`


                    // list all the pending policies
                    response = "CON " + paidPolicies.map((policy: any, index: number) => {
                        return `\n${index + 1}. ${policy.policy_type} ${policy.beneficiary.toUpperCase()}  at Kshs ${policy.premium.toLocaleString()} `
                    }
                    ).join("");
                }
                break;
            case "3":


                console.log("paidPolicies", paidPolicies)
                console.log("policyMessages", policyMessages)



                if (paidPolicies.length > 0) {
                    response = `CON ${policyMessages[policyMessages.length - 1]}\n1. Cancel Policy` + "\n0. Back \n00. Main Menu"
                }
                else {
                    response = "END You have no policies"
                }
                break;
            case "4":
                response = "CON Enter Name of your Next of Kin (Above 18 years of age)"
                break;
            case "5":
                response = 'CON Choose your Gender ' +
                 "\n1. Male" +
                 "\n2. Female" ;
                break;
            case "6":
                response = 'CON Dependant full name ' ;
                break;
            default:
                response = "END Invalid option selected"
                break;
        }

    } else if (currentStep == 3) {
        switch (allSteps[1]) {
            case "1":

                if (userText == "1" && paidPolicies.length > 1) {
                    response = `CON ${policyMessages[1]}\n1. Next`
                } else if (userText == "1" && paidPolicies.length == 1) {
                    if (paidPolicies[0].installment_type == 1) {
                        response = `END Your available inpatient limit is Kshs ${formatAmount(paidPolicies[0].inpatient_cover)
                            } and Maternity expense of Kshs ${formatAmount(paidPolicies[0].maternity_cover)
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
                        console.log("PRORATED PERCENTAGE", paidPolicies[0].inpatient_cover / proratedPercentage)

                        // add 3 months to the policy start date
                        let policyStartDate = new Date(paidPolicies[0].policy_start_date)
                        console.log("POLICY START DATE", policyStartDate)
                        policyStartDate.setMonth(policyStartDate.getMonth() + payments.length)
                        console.log("POLICY START DATE", policyStartDate)


                        if (policyStartDate > new Date() && paidPolicies[0].installment_type == 2) {
                            response = `END Your available inpatient limit is Kshs ${(paidPolicies[0].inpatient_cover / proratedPercentage).toLocaleString()
                                } and Maternity  expense of Kshs ${(paidPolicies[0].last_expense_insured / proratedPercentage).toLocaleString()
                                }`
                        } else {
                            response = `END Your outstanding premium is Kshs ${(paidPolicies[0].premium).toLocaleString()
                                }\nYour available inpatient limit is Kshs ${(paidPolicies[0].inpatient_cover / proratedPercentage).toLocaleString()
                                } and Maternity  expense of Kshs ${(paidPolicies[0].inpatient_cover / proratedPercentage).toLocaleString()
                                }`
                        }


                    }
                }
                break;
            case "2":
                console.log("allSteps", allSteps, allSteps[2]);
                response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'
                paidPolicies = await db.policies.findAll({
                    where: {
                        phone_number: smsPhone.replace("+", ""),
                        policy_status: "paid"
                    },
                    order: [
                        ['policy_id', 'DESC'],
                    ],
                    limit: 6
                });
                // last 6 unpaid policies
                const existingUser = await db.users.findOne({
                    where: {
                        phone_number: phoneNumber.replace("+", "").substring(3),
                    },
                    limit: 1,
                });

                paidPolicies = paidPolicies.slice(-6);

                let choosenPolicy = paidPolicies[allSteps[2] - 1];
                await db.policies.update({
                    renewal_status: "pending",
                    user_id: existingUser.user_id
                }, {
                    where: {
                        policy_id: choosenPolicy.policy_id
                    }
                });
                console.log("CHOOSEN POLICY", choosenPolicy)


                const airtelMoneyPromise = airtelMoneyKenya(
                    existingUser.user_id,
                    choosenPolicy.policy_id,
                    phoneNumber.replace("+", "").substring(3),
                    choosenPolicy.premium,
                    existingUser.membership_id,
                );



                const timeout = 3000;

                Promise.race([
                    airtelMoneyPromise,
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            reject(new Error('Airtel Money operation timed out'));
                        }, timeout);
                    }),
                ]).then((result) => {
                    console.log("============== END TIME - FAMIY ================ ", phoneNumber, new Date());
                    response = 'END Payment successful';
                    console.log("RESPONSE WAS CALLED", result);
                    return response;
                })
                    .catch((error) => {
                        response = 'END Payment failed';
                        console.log("RESPONSE WAS CALLED EER", error);
                        return response;
                    })

                console.log("============== AFTER CATCH  TIME - FAMILY ================ ", phoneNumber, new Date());


                break;
            case "3":

                if (userText == "1") {
                    const user = await db.users.findOne({
                        where: {
                            phone_number: phoneNumber
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
                break;
            case "4":
                response = "CON Enter Next of Kin Phone number"
                break;
            default:
                response = "END Invalid option selected"
                break;
        }
    } else if (currentStep == 4) {
        switch (userText) {
            case "1":
                response = paidPolicies.length > 0 ? `CON ${policyMessages[2]}\n1. Next` : "END You have no more paid policy"
                break;
            case "4":
                const existingUser = await db.users.findOne({
                    where: {
                        [Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
                    },
                    limit: 1,
                });

                let policies = await db.policies.findAll({
                    where: {
                        phone_number: smsPhone,
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
                    category : "KIN"
                }


                await db.beneficiaries.create(nextOfKinDetails);
                const sms = `You have added ${nextOfKinDetails.name} as the next of Kin on your AfyaShua Cover. Any benefits on the cover will be payable to your next of Kin.`
                await SMSMessenger.sendSMS(smsPhone, sms);
                response = `END ${sms}`
                break;
            default:
                response = "END Invalid option selected"
                break;
        }


    } else if (currentStep == 5){
        console.log('==5 userText',userText)
        console.log(" ===5 ALLSTEPS", allSteps)
      // update gender and dob
      const existingUser = await db.users.findOne({
        where: {
            [Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
        },
        limit: 1,
    });
   response = 'CON whats your date of birth in the format YYYY-MM-DD'

    }else if(currentStep == 6){

        console.log('==6 userText',userText)
        console.log(" ===6 ALLSTEPS", allSteps)
        //update dependant

        response = 'CON whats your dependant date of birth in the format YYYY-MM-DD'

    }


    return response
}

export default accountMenu;


// [4:27 pm, 01/12/2023] Kennedy Nyosro: On the USSD, it is agent to add the update Gender and Date of birth so that the SMS are sent to the customers
// [4:27 pm, 01/12/2023] Kennedy Nyosro: Under my Policy, they should update next of kin, then add Gender then Date of Birth
// [4:28 pm, 01/12/2023] Kennedy Nyosro: The add details of dependents if they have for family, then that data can always be sent to AAR