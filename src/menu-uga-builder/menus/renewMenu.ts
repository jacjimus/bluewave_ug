import { v4 as uuidv4 } from 'uuid';
import { airtelMoney, createTransaction } from "../../services/payment";
import { Op } from "sequelize";
import moment from "moment";



const renewMenu = async (args: any, db: any) => {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;

    const trimmedPhoneNumber = phoneNumber.replace("+", "").substring(3);
    // const smsPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

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
            phone_number: phoneNumber,
            policy_status: "paid",
            installment_type: 2,
        },
        order: [
            ['policy_start_date', 'DESC'],
        ],
        limit: 4
    });


    if (paidPolicies.length == 0) {
        response = "END Sorry you have no active policy"
        return response
    }



    if (currentStep == 1) {
        console.log("allSteps", allSteps)
        console.log('Current step', currentStep);
        console.log('User text', userText)


        if (paidPolicies?.length === 0) {
            response = "END Sorry you have no active policy"
        }
        else {
            // list all the paid policies
            response = "CON " + paidPolicies.map((policy: any, index: number) => {
                return `\n${index + 1}. ${policy.beneficiary} ${policy.policy_type} at UGX ${policy.premium.toLocaleString()}, Pending Premium: UGX ${policy.policy_pending_premium.toLocaleString()}`
            }
            ).join("");
        }

    } else if (currentStep == 2) {

        console.log("allSteps ", allSteps)
        console.log('Current step 2', currentStep);
        console.log('User text', userText)
        if ((userText * 1) > 3) {
            response = "END Invalid option"
            return response
        }

        response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'

        // last 6 unpaid policies
        const existingUser = await db.users.findOne({
            where: {
                phone_number: phoneNumber.replace("+", "").substring(3),
            },
            limit: 1,
        });


        let choosenPolicy = paidPolicies[allSteps[1] - 1];
        const preGeneratedTransactionId = uuidv4(); // Generate UUID once outside
        // Create transaction
        await createTransaction(existingUser.user_id, existingUser.partner_id, choosenPolicy.policy_id, preGeneratedTransactionId, choosenPolicy.premium);


        const timeout = parseInt(process.env.AIRTEL_MONEY_TIMEOUT) || 500;


        setTimeout(async () => {


            const airtelMoneyPromise = await airtelMoney(
                phoneNumber.replace("+", "").substring(3),
                choosenPolicy.premium,
                existingUser.phone_number.toString(),
                preGeneratedTransactionId
            );

            const race_timeout = parseInt(process.env.AIRTEL_MONEY_RACE_TIMEOUT) || 3000;


            Promise.race([
                airtelMoneyPromise,
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error('Airtel Money operation timed out'));
                    }, race_timeout);
                })
            ]).then((result) => {
                // Airtel Money operation completed successfully
                console.log("============== END TIME - SELF ================ ", phoneNumber, moment().toDate());
                //response = 'END Payment successful';
                console.log("SELF RESPONSE WAS CALLED", result);
                return response;
            }).catch((error) => {
                // Airtel Money operation failed
                //response = 'END Payment failed';
                console.log("SELF RESPONSE WAS CALLED", error);
                return response;
            });

            console.log("============== AFTER CATCH TIME - SELF ================ ", phoneNumber, moment().toDate());
        }, timeout);
        console.log("============== AFTER CATCH TIME - SELF ================ ", phoneNumber, moment().toDate());
    } else {
        response = "END Invalid option"
    }

    return response
}

export default renewMenu;