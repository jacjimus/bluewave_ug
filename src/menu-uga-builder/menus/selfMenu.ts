import { airtelMoney } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
import SMSMessenger from "../../services/sendSMS";
import { calculatePaymentOptions, parseAmount } from "../../services/utils";
import { getAirtelUser } from  "../../services/getAirtelUserKyc"
import { Op } from "sequelize";

const selfMenu = async (args, db) => {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;
    let phone = phoneNumber?.replace("+", "")?.substring(3);
    let existingUser = await db.users.findOne({
        where: {
            phone_number: phone,
        },
        limit: 1
    });

    const coverTypes = [
        {
            name: "S MINI",
            sum_insured: "750,000",
            sumInsured: 750000,
            premium: "5,000",
            yearly_premium: "60,000",
            yearPemium: 60000,
            last_expense_insured: "500,000",
            lastExpenseInsured: 500000
        }, {
            name: "MINI",
            sum_insured: "1.5M",
            sumInsured: 1500000,
            premium: "10,000",
            yearly_premium: "120,000",
            yearPemium: 120000,
            last_expense_insured: "1M",
            lastExpenseInsured: 1000000
        },
        {
            name: "MIDI",
            sum_insured: "3M",
            sumInsured: 3000000,
            premium: "14,000",
            yearly_premium: "167,000",
            yearPemium: 167000,
            last_expense_insured: "1.5M",
            lastExpenseInsured: 1500000
        },
        {
            name: "BIGGIE",
            sum_insured: "5M",
            sumInsured: 5000000,
            premium: "18,000",
            yearly_premium: "208,000",
            yearPemium: 208000,
            last_expense_insured: "2M",
            lastExpenseInsured: 2000000
        }];

    if (currentStep === 1) {
        switch (userText) {
            case "1":

                response = "CON Buy for self " +
                    "\n1. S MINI at UGX 5,000" +
                    "\n2. MINI at UGX 10,000" +
                    "\n3. MIDI at UGX 14,000" +
                    "\n4. BIGGIE at UGX 18,000" +
                    "\n0. Back \n00. Main Menu";

                break;
            default:
                response = "CON Invalid option" + "\n0. Back \n00. Main Menu";
                break;
        }
    }
    else if (currentStep === 2) {
        let coverType = coverTypes[parseInt(userText) - 1];
        if (!coverType) {
            response = "CON Invalid option" + "\n0. Back \n00. Main Menu";
            return response;
        }

        let existingPolicy = await db.policies.findAndCountAll({
            where: {
                phone_number: `+256${phone}`,
                policy_status: "paid",
                [Op.or]: [
                    { beneficiary: "FAMILY" },
                    { beneficiary: "SELF" }
                ]
            },
            limit: 1,
        });

        if (existingPolicy.count > 0) {
            response = "END You already have an active policy"
            return response;
        }


        let userPhoneNumber = phoneNumber?.replace('+', "")?.substring(3);
        response = `CON Inpatient cover for 0${userPhoneNumber}, UGX ${coverType.sum_insured} a year` +
            "\nPAY " +
            `\n1. UGX ${coverType.premium} monthly` +
            `\n2. UGX ${coverType.yearly_premium} yearly` + "\n0. Back \n00. Main Menu";
    }
    else if (currentStep === 3) {
        let paymentOption = parseInt(userText);
        let selectedPolicyType = coverTypes[parseInt(allSteps[1]) - 1];
        let policy_type = selectedPolicyType.name;

        let options = calculatePaymentOptions(policy_type, paymentOption);

        response = `CON Pay UGX ${options.premium} ${options.period}. Terms&Conditions https://rb.gy/g4hyk\nConfirm to Agree and Pay \nAge 0 - 65 Years` + "\n1. Confirm \n0. Back";

    }
    else if (currentStep === 4) {

        if (userText == "1") {

            response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'
            console.log("=============== END SCREEN USSD RESPONCE -  SELF =======", phoneNumber, new Date());

            let selectedPolicyType = coverTypes[parseInt(allSteps[1]) - 1];
            let fullPhone = !phoneNumber?.startsWith('+') ? `+${phoneNumber}` : phoneNumber;

            if (!existingUser) {
                console.log("USER DOES NOT EXIST SELF");
                let user = await getAirtelUser(phoneNumber, 2);

                let membershipId = Math.floor(100000 + Math.random() * 900000);

                existingUser = await db.users.create({
                    user_id: uuidv4(),
                    phone_number: phone,
                    membership_id: membershipId,
                    pin: Math.floor(1000 + Math.random() * 9000),
                    first_name: user.first_name,
                    last_name: user.last_name,
                    name: `${user.first_name} ${user.last_name}`,
                    total_member_number: "M",
                    partner_id: 2,
                    role: "user",
                    nationality: "UGANDA",
                });

                const message = `Dear ${existingUser?.first_name || 'Customer'}, welcome to Ddwaliro Care. Membership ID: ${membershipId} Dial *185*7*6# to access your account.`;
                await SMSMessenger.sendSMS(2, fullPhone, message);

            }


            // create policy
            let policy_type = selectedPolicyType.name;
            let installment_type = parseInt(allSteps[2]);
            let ultimatePremium = calculatePaymentOptions(policy_type, installment_type);
            let installment_next_month_date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1)

            let checkPaidPolicy = await db.policies.findAndCountAll({
                where: {
                    user_id: existingUser.user_id,
                    policy_status: 'paid',
                },
            });

            let policyNumber =
                checkPaidPolicy.count > 0
                    ? `BW${phoneNumber?.replace('+', '')?.substring(3)}_${checkPaidPolicy.count + 1}`
                    : `BW${phoneNumber?.replace('+', '')?.substring(3)}`;

            let policyObject = {
                policy_id: uuidv4(),
                installment_type: installment_type == 1 ? 2 : 1,
                installment_order: 1,
                policy_type: policy_type,
                policy_deduction_amount: ultimatePremium.premium,
                policy_pending_premium: selectedPolicyType.yearPemium - ultimatePremium.premium,
                policy_next_deduction_date: installment_type == 1 ? new Date(new Date().setMonth(new Date().getMonth() + 1)) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                sum_insured: selectedPolicyType.sumInsured,
                premium: installment_type == 1 ? ultimatePremium.premium : selectedPolicyType.yearPemium,
                yearly_premium: selectedPolicyType.yearPemium,
                last_expense_insured: selectedPolicyType.lastExpenseInsured,
                policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
                policy_start_date: new Date(),
                installment_date: installment_type == 1 ? new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)) : installment_next_month_date,
                membership_id: existingUser.membership_id,
                beneficiary: "SELF",
                policy_status: "pending",
                policy_deduction_day: new Date().getDate() - 1,
                partner_id: 2,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: "d18424d6-5316-4e12-9826-302b866a380c",
                user_id: existingUser.user_id,
                phone_number: phoneNumber,
                first_name: existingUser?.first_name,
                last_name: existingUser?.last_name,
                policy_number: policyNumber
            }


            let policy = await db.policies.create(policyObject);

           // console.log("=========== SELF POLICY ===========", policy);

            console.log("============== START TIME - SELF ================ ", phoneNumber, new Date());

            const airtelMoneyPromise = airtelMoney(
                existingUser.user_id,
                2,
                policy.policy_id,
                phone,
                ultimatePremium.premium,
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
                console.log(" SELF RESPONSE WAS CALLED", result);
                return response;
            }).catch((error) => {
                response = 'END Payment failed';
                console.log("SELF RESPONSE WAS CALLED", error);
                return response;
            });

            console.log("============== AFTER CATCH TIME - SELF ================ ", phoneNumber, new Date());

        } else {
            response = "END Thank you for using Ddwaliro Care"
        }
    }

    return response;
}

export default selfMenu;


/*

============== START TIME - SELF ======  +256706991200 2023-10-24T21:03:11.440Z
=========== PUSH TO AIRTEL MONEY =========== 706991200 2023-10-24T21:03:11.441Z
=========== AFTER CATCH TIME==========   +256706991200 2023-10-24T21:03:11.490Z
=== RETURN RESPONSE AIRTEL MONEY =========== 706991200 2023-10-24T21:03:16.115Z

=======END TIME - SELF ================  +256706991200 2023-10-24T21:03:16.122Z

*/

