import sendSMS from "../../services/sendSMS";
import { registerDependant, fetchMemberStatusData } from "../../services/aar";
import { v4 as uuidv4 } from 'uuid';
import { airtelMoney } from "../../services/payment";
import { Op } from "sequelize";
import { calculateProrationPercentage, formatAmount } from "../../services/utils";

const accountMenu = async (args: any, db: any) => {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;

    const trimmedPhoneNumber = phoneNumber.replace("+", "").substring(3);
    const smsPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

    const policies = await db.policies.findAll({
        where: {
            phone_number: phoneNumber,
            policy_status: "paid"
        }
    });

    let policyMessages = policies.map((policy: any, index: number) => {
        //10000  to 10,000
        
        return `Dwaliro ${policy.policy_type} Inpatient UGX ${policy.premium.toLocaleString()} is ${policy.policy_status.toUpperCase()} to till ${new Date(policy.installment_date).toDateString()}`
    });
  
   
  

    if (currentStep == 1) {
        response = "CON My Account" +
            "\n1. Policy Status" +
            "\n2. Pay Now" +
            "\n3. Cancel Policy" +
            "\n4. Add Next of Kin"
    }
    else if (currentStep == 2) {
        // console.log('Current step', currentStep);
        // console.log('User text', userText)
        switch (userText) {
            case "1":
                response = policies.length > 0 ? `CON ${policyMessages[0]}\n1. Next` : "END You have no policies"
                break;
            case "2":
                const unpaidPolicies = await db.policies.findAll({
                    where: {
                        phone_number: phoneNumber,
                        policy_status: "pending"
                    }
                });
                if (unpaidPolicies?.length === 0) {
                    response = "END You have no pending policies"
                }
                else {
                    response = "CON PAY" +
                        `\n1 UGX ${unpaidPolicies[0].premium.toLocaleString()}  monthly` +
                        `\n2 UGX ${unpaidPolicies[0].yearly_premium.toLocaleString()}  yearly`
                }
                break;
            case "3":
                console.log("Policies", policies);
                const paidPolicies = await db.policies.findAll({
                    where: {
                        phone_number: phoneNumber,
                        policy_status: "paid"
                    }
                });
                if (paidPolicies.length > 0) {
                    response = `CON ${policyMessages[0]}\n1. Cancel Policy`
                }
                else {
                    response = "END You have no policies"
                }
                break;
            case "4":
                response = "CON Enter Name of your Next of Kin (Above 18 years of age)"
                break;
            default:
                response = "END Invalid option selected"
                break;
        }

    } else if (currentStep == 3) {
        switch (allSteps[1]) {
            case "1":

                if (userText == "1" && policies.length > 1) {
                    response = `CON ${policyMessages[1]}\n1. Next`
                } else if (userText == "1" && policies.length == 1) {
                    if(policies[0].installment_type == 1){
                        response = `END Your available inpatient limit is UGX ${formatAmount(policies[0].sum_insured)
                        } and Funeral expense of UGX ${formatAmount(policies[0].last_expense_insured)
                        }`

                    }else{
                          let proratedPercentage = calculateProrationPercentage(policies[0].installment_order)
                    response = `END Your outstanding premium is UGX ${policies[0].premium.toLocaleString()
                        }\nYour available inpatient limit is UGX ${formatAmount(policies[0].sum_insured /  proratedPercentage)
                        } and Funeral expense of UGX ${formatAmount(policies[0].last_expense_insured / proratedPercentage)
                        }`
                    }
                }
                break;
            case "2":

                if (userText == "1") {
                    const user = await db.users.findOne({
                        where: {
                            phone_number: phoneNumber
                        }
                    });
                    const policies = await db.policies.findAll({
                        where: {
                            phone_number: phoneNumber,
                            policy_status: "pending"
                        }
                    });
                    console.log("Policy", policies[0]);
                    await airtelMoney(user.user_id, 2, policies[0].policy_id, smsPhone, policies[0].premium, user.membership_id, "UG", "UGX");
                    response = "END Please wait for the Airtel Money prompt to enter your PIN to complete the payment"
                }
                break;
            case "3":
                if (userText == "1") {
                    const user = await db.users.findOne({
                        where: {
                            phone_number: phoneNumber
                        }
                    });
                    await db.policies.update({
                        policy_status: "cancelled",
                        user_id: user.user_id
                    }, {
                        where: {
                            policy_id: policies[0].policy_id
                        }
                    });
                    response = `END Cancelling, you will no longer be covered as from ${new Date(policies[0].policy_end_date).toDateString()}`
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
        const user = await db.users.findOne({
            where: {
                [Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
            }
        });
        const nextOfKinDetails = {
            beneficiary_id: uuidv4(),
            name: allSteps[2],
            phone_number: userText,
            user_id: user.user_id,
            bonus: allSteps[2],
        }



        await db.beneficiaries.create(nextOfKinDetails);
        const sms = `You have added ${nextOfKinDetails.name} as the next of Kin on your Dddwaliro Cover. Any benefits on the cover will be payable to your next of Kin.`
        await sendSMS(smsPhone, sms);
        response = `END ${sms}`
    }


    return response
}

export default accountMenu;