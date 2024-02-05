import SMSMessenger from "../../services/sendSMS";
import { registerDependant, fetchMemberStatusData, updatePremium, updateMember } from "../../services/aar";
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
        response = "END You are not registered on Dwaliro Care"
        return response
    }

    let paidPolicies = await db.policies.findAll({
        where: {
            phone_number: phoneNumber,
            policy_status: "paid"
        },
        limit: 6
    });

    console.log("PAID POLICIES", paidPolicies)

    let userPolicy = await db.policies.findOne({
        where: {
            phone_number: phoneNumber,
            policy_status: "paid"
        },
        order: [
            ['policy_id', 'DESC'],
        ],
        limit: 1
    });

    if (paidPolicies.length == 0) {
        response = "END Sorry you have no active policy"
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
        response = "CON My Policy" +
            "\n1. Policy Status" +
            "\n2. Renew Policy" +
            "\n3. Cancel Policy" +
            "\n4. Add Next of Kin" +
            "\n5. Update Gender and Date of birth" +
            "\n6. Add Dependants" +
            "\n7. View Details";
    } else if (currentStep == 2) {
        console.log("allSteps", allSteps)
        console.log('Current step', currentStep);
        console.log('User text', userText)
        switch (userText) {
            case "1":
                response = paidPolicies.length > 0 ? `CON ${policyMessages[0]}\n1. Next` : "END Sorry you have no active policy"
                break;
            case "2":
                // last 6 unpaid policies
                paidPolicies = paidPolicies.slice(-6);
                if (paidPolicies?.length === 0) {
                    response = "END Sorry you have no active policy"
                }
                else {
                    // list all the pending policies
                    response = "CON " + paidPolicies.map((policy: any, index: number) => {
                        return `\n${index + 1}. ${policy.policy_type} at UGX ${policy.premium.toLocaleString()},  pending premium of UGX ${policy.policy_pending_premium.toLocaleString()}`
                    }
                    ).join("");
                }
                break;
            case "3":

                if (paidPolicies.length > 0) {

                    response = `CON ${policyMessages[policyMessages.length - 1]}.\n Enter PIN to Confirm cancellation` + "\n0. Back \n00. Main Menu"
                }
                else {
                    response = "END Sorry you have no active policy"
                }
                break;
            case "4":

                // list beneficiaries where beneficiary_type = KIN
                console.log('trimmedPhoneNumber', trimmedPhoneNumber)
                let beneficiaries = await db.beneficiaries.findAll({
                    where: {
                        principal_phone_number: trimmedPhoneNumber,
                        beneficiary_type: "KIN"
                    },
                    limit: 6
                });

                //console.log("BENEFICIARIES", beneficiaries)

                if (beneficiaries.length > 5) {
                    response = `END You have reached the maximum number of next of kin for your policy type  ${userPolicy.beneficiary} ${userPolicy.policy_type}`
                }
                else {
                    // Enter Name of your Next of Kin (Above 18 years of age) 0.Back 00.Main Menu
                    response = `CON Enter Full Name of your Next of Kin (Above 18 years of age) 0.Back 00.Main Menu`
                }


                break;
            case "5":
                response = 'CON Choose your Gender ' +
                    "\n1. Male" +
                    "\n2. Female";
                break;
            case "6":
                let dependants = await db.beneficiaries.findAll({
                    where: {
                        principal_phone_number: trimmedPhoneNumber,
                        beneficiary_type: "DEPENDANT"
                    },
                    limit: 6
                });
                if (userPolicy.total_member_number == 'M' || dependants.length > 5) {
                    response = `END You have reached the maximum number of dependants for your policy type  ${userPolicy.beneficiary} ${userPolicy.policy_type}`
                }
                else {

                    response = `CON Please enter the dependant full name \n e.g John Mukasa \n 0.Back 00.Main Menu`
                }

                break;

            case "7":
                response = `END You will receive an SMS confirming your personal and dependent details`
                //Dear XXX, your Date of birth is XX, Gender XX, and dependents are. Please dial *185*7*6*3# to add any additional dependant.
                let user_dependants = await db.beneficiaries.findAll({
                    where: {
                        principal_phone_number: trimmedPhoneNumber,
                        beneficiary_type: "DEPENDANT"
                    },
                    limit: 6
                });
                // list all the dependants and option to add new
                let dependants_name = user_dependants.map((dependant: any, index: number) => {
                    return `${dependant.full_name} `
                }
                ).join("");
                const details_message = `Dear ${currentUser.first_name}, your Date of birth is ${currentUser.dob}, Gender ${currentUser.gender}, and dependents are ${dependants_name}. Please dial *185*7*6*3# to add any additional dependant.`
                console.log("DETAILS MESSAGE", details_message)
                SMSMessenger.sendSMS(smsPhone, details_message)

                break;
            default:
                response = "END Invalid option selected"
                break;
        }

    } else if (currentStep == 3) {
        console.log("allSteps", allSteps, allSteps[1])
        console.log('Current step', currentStep);
        console.log('User text', userText)
        if (userText == "1" && allSteps[1] == '1') {

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


            } else if (allSteps[1] == '6' && userText == "1") {
                response = `END Total dependant number is ${userPolicy.total_member_number}`
            } else if (allSteps[1] == '5' && userText == "1") {
                response = 'CON Enter your date of birth (dd/mm/yyyy)';
            }

        } else if (allSteps[1] == '2' && allSteps[0] == '4') {
            console.log("allSteps", allSteps, allSteps[2]);
            response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'
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


        } else if (allSteps[1] == "5" && allSteps[0] == "4") {

            response = 'CON Enter your date of birth (dd/mm/yyyy)';
        } else if (allSteps[1] == '3' && userText.length == 4) {
            console.log("allSteps", allSteps, allSteps[1]);
            console.log("User text cancel", userText, userText.length == 4)
            const user = await db.users.findOne({
                where: {
                    phone_number: phoneNumber.replace("+", "").substring(3),
                },
                limit: 1,
            });
            await db.policies.update({
                //policy_status: "cancelled",
                user_id: user.user_id
            }, {
                where: {
                    policy_id: paidPolicies[0].policy_id
                }
            });
            response = `END Cancelling, you will no longer be covered as from ${new Date(paidPolicies[0].policy_end_date).toDateString()}`
            // You have CANCELLED your Ddwaliror cover. Your Policy will expire on DD/MM/YYYY. Dial *185*7*6# to reactivate. (138 char)                
            const claim_message = `You have CANCELLED your Dwaliro cover. Your Policy will expire on ${new Date(paidPolicies[0].policy_end_date).toDateString()}. Dial *185*7*6# to reactivate.`
            SMSMessenger.sendSMS(smsPhone, claim_message)


        } else if (allSteps[1] == '4') {

            response = "CON Enter Next of Kin Phone number (e.g 07XXXXXXXX)"
        } else if (allSteps[1] == '6') {
            console.log("allSteps", allSteps)
            console.log('Current step', currentStep);
            console.log('User text', userText)
            await db.beneficiaries.create({
                beneficiary_id: uuidv4(),
                full_name: allSteps[2],
                beneficiary_type: "DEPENDANT",
                user_id: currentUser.user_id,
                dob: moment('01/01/1990', "DD/MM/YYYY").format("YYYY-MM-DD"),
                principal_phone_number: trimmedPhoneNumber
            })

            let dependant_message = `You have added successfully added ${allSteps[2]} as your dependant. Please dial *185*7*6*3# to add any additional dependant.`

            SMSMessenger.sendSMS(smsPhone, dependant_message)
            response = "Your dependant name saved successfully"
        }

    } else if (currentStep == 4) {
        console.log("allSteps", allSteps)
        console.log('Current step', currentStep);
        console.log('User text', userText)
        if (userText == "1") {

            response = paidPolicies.length > 0 ? `CON ${policyMessages[2]}` : "END You have no more paid policy"

        } else if (allSteps[2] == "2" || allSteps[2] == "1") {
            let gender = allSteps[2] == "1" ? "MALE" : "FEMALE";
            let dob = moment(allSteps[3], "DD/MM/YYYY").format("YYYY-MM-DD");
            console.log(gender, dob);

            const user = await db.users.findOne({
                where: {
                    phone_number: trimmedPhoneNumber,
                },
                limit: 1,
            });

            user.dob = dob;
            user.gender = gender;
            user.save();

            const data = {
                member_no: user.arr_member_number,
                surname: user.last_name,
                first_name: user.first_name,
                other_names: user.middle_names || "",
                gender: allSteps[2] || '1',
                dob: dob || '1990-01-01',
                tel_no: `256${user.phone_number}`,
                email: user.email || "admin@bluewave.insure",
                next_of_kin: {
                    surname: '',
                    first_name: '',
                    other_names: '',
                    tel_no: '',
                },
                member_status: "1",
                reason_for_member_status: "gender and dob update",
            }

            await updateMember(data)

            // You have successfully added your Gender as XXX and Date of birth as dd/mm/yyyy

            response = `END You have successfully added your Gender as ${gender} and Date of birth as ${allSteps[3]}`
            const dob_message = `You have successfully added your Gender as ${gender} and Date of birth as ${allSteps[3]}`
            SMSMessenger.sendSMS(smsPhone, dob_message)

        } else if (allSteps[2] == "99") {
            response = 'CON whats the Dependant date of birth (dd/mm/yyyy) ';
        } else if (allSteps[1] == '4' && allSteps[0] == '4') {
            console.log("allSteps", allSteps)
            console.log('Current step', currentStep);
            console.log('User text', userText)

            await db.beneficiaries.create({
                beneficiary_id: uuidv4(),
                full_name: allSteps[3],
                first_name: allSteps[3].split(" ")[0],
                last_name: allSteps[3].split(" ")[1],
                beneficiary_type: "KIN",
                phone_number: userText,
                user_id: currentUser.user_id,
                principal_phone_number: trimmedPhoneNumber
            })
            let gender = currentUser.gender == "MALE" ? "1" : "2";
            const data = {
                member_no: currentUser.arr_member_number,
                surname: currentUser.last_name,
                first_name: currentUser.first_name,
                other_names: currentUser.middle_names || "",
                gender: gender || '1',
                dob: currentUser.dob || '1990-01-01',
                tel_no: `256${currentUser.phone_number}`,
                email: currentUser.email || "admin@bluewave.insure",
                next_of_kin: {
                    surname: allSteps[3].split(" ")[1],
                    first_name: allSteps[3].split(" ")[0],
                    other_names: allSteps[3].split(" ")[1],
                    tel_no: userText,
                },
                member_status: "1",
                reason_for_member_status: "next of kin update",
            }

            await updateMember(data)

            SMSMessenger.sendSMS(smsPhone, `You have added ${allSteps[3]} as a next of kin on your Dwaliro Cover. Any benefits on the cover will be payable to your next of kin.`)
            response = "END Your next of kin details saved successfully"

        }
    } else if (currentStep == 5) {
        if (allSteps[2] == "99") {
            console.log("allSteps", allSteps)
            console.log('Current step', currentStep);
            console.log('DOB User text', userText)
            await db.beneficiaries.create({
                beneficiary_id: uuidv4(),
                full_name: allSteps[3],
                first_name: allSteps[3].split(" ")[0],
                last_name: allSteps[3].split(" ")[1],
                beneficiary_type: "DEPENDANT",
                user_id: currentUser.user_id,
                dob: moment(userText, "DD/MM/YYYY").format("YYYY-MM-DD"),
                principal_phone_number: trimmedPhoneNumber
            })

            SMSMessenger.sendSMS(smsPhone, `You have added ${allSteps[3]} as a dependant on your Dwaliro Cover. Any benefits on the cover will be payable to your dependant.`)
            response = "CON Your dependant name saved successfully"

            console.log("allSteps", allSteps)
            console.log('Current step', currentStep);
            console.log('User text', userText)

            await db.beneficiaries.create({
                beneficiary_id: uuidv4(),
                full_name: allSteps[2],
                first_name: allSteps[2].split(" ")[0],
                last_name: allSteps[2].split(" ")[1],
                beneficiary_type: "KIN",
                phone_number: userText,
                user_id: currentUser.user_id,
                principal_phone_number: trimmedPhoneNumber
            })
            let gender = currentUser.gender == "MALE" ? "1" : "2";
            const data = {
                member_no: currentUser.arr_member_number,
                surname: currentUser.last_name,
                first_name: currentUser.first_name,
                other_names: currentUser.middle_names || "other name",
                gender: gender || '1',
                dob: currentUser.dob || '1990-01-01',
                tel_no: `256${currentUser.phone_number}`,
                email: currentUser.email || "admin@bluewave.insure",
                next_of_kin: {
                    surname: allSteps[2].split(" ")[1] || "",
                    first_name: allSteps[2].split(" ")[0],
                    other_names: allSteps[2].split(" ")[1] || "",
                    tel_no: userText,
                },
                member_status: "1",
                reason_for_member_status: "next of kin update",
            }

            await updateMember(data)

            // You have added <name> as the next of Kin on your Dddwaliro Cover. Any benefits on the cover will be payable to your next of Kin.        
            const kin_message = `You have added ${allSteps[2]} as the next of Kin on your Dwaliro Cover. Any benefits on the cover will be payable to your next of Kin.`
            SMSMessenger.sendSMS(smsPhone, kin_message)
            response = `END You have added ${allSteps[2]} as a next of kin on your Dwaliro Cover. Any benefits on the cover will be payable to your next of kin.`
        }
    }
    return response
}

export default accountMenu;

