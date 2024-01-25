import SMSMessenger from "../../services/sendSMS";
import { registerDependant, fetchMemberStatusData, updatePremium } from "../../services/aar";
import { v4 as uuidv4 } from 'uuid';
import { airtelMoney } from "../../services/payment";
import { Op } from "sequelize";
import { calculateProrationPercentage, formatAmount } from "../../services/utils";
import moment from "moment";



const renewMenu = async (args: any, db: any) => {
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

    // let userPolicy = await db.policies.findOne({
    //     where: {
    //         user_id: currentUser?.user_id,
    //         policy_status: "paid"
    //     },
    //     order: [
    //         ['policy_id', 'DESC'],
    //     ],
    //     limit: 1
    // });

    if (paidPolicies.length == 0) {
        response = "END Sorry you have no active policy"
        return response
    }


   if (currentStep == 1) {
        console.log("allSteps", allSteps)
        console.log('Current step', currentStep);
        console.log('User text', userText)

    
                paidPolicies = paidPolicies.slice(-6);
                if (paidPolicies?.length === 0) {
                    response = "END Sorry you have no active policy"
                }
                else {
                    // list all the paid policies
                    response = "CON " + paidPolicies.map((policy: any, index: number) => {
                        return `\n${index + 1}. ${policy.beneficiary} ${policy.policy_type} at UGX ${policy.premium.toLocaleString()} , pending premium of UGX ${policy.policy_pending_premium.toLocaleString()}`
                    }
                    ).join("");
                }
      


    } else if (currentStep == 2) {
      
        console.log("allSteps", allSteps)
        console.log('Current step', currentStep);
        console.log('User text', userText)
        if(userText *1 > 3){
            response = "END Invalid option"
            return response
        }

                console.log("allSteps", allSteps, allSteps[1]);
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

                let choosenPolicy = paidPolicies[allSteps[1] - 1];

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
     }else{
        response = "END Invalid option"
     }

        


       
 
    return response
}

export default renewMenu;