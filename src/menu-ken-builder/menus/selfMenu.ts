import { airtelMoneyKenya } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
import SMSMessenger from "../../services/sendSMS";
import { calculatePaymentOptionsKenya, parseAmount } from "../../services/utils";
import { getAirtelKenyaUser } from "../../services/getAirtelUser";

const selfMenu = async (args, db) => {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;
    let phone = phoneNumber?.replace('+', "")?.substring(3);


    const coverTypes = [{
        name: "BAMBA",
        sum_insured: "",
        sumInsured: 0,
        premium: "300",
        yearly_premium: "3,294",
        yearPemium: 3294,
        last_expense_insured: "",
        lastExpenseInsured: 0,
        inPatient: 0,
        outPatient: 0,
        maternity: 0,
        hospitalCash: 4500
    },
    {
        name: "ZIDI",
        sum_insured: "",
        sumInsured: 0,
        premium: "650",
        yearly_premium: "7,140",
        yearPemium: 7140,
        last_expense_insured: "",
        lastExpenseInsured: 0,
        inPatient: 300000,
        outPatient: 0,
        maternity: 100000,
        hospitalCash: 0
    },
    {
        name: "SMARTA",
        sum_insured: "",
        sumInsured: 0,
        premium: "1,400",
        yearly_premium: "15,873",
        yearPemium: 15873,
        last_expense_insured: "",
        lastExpenseInsured: 0,
        inPatient: 400000,
        outPatient: 30000,
        maternity: 100000,
        hospitalCash: 0
    }];



    if (currentStep === 1) {
        switch (userText) {
            case "1":

                // create a raw menu with the cover types without looping
                response = "CON " +
                    "\n1. Bamba at KShs 300" +
                    "\n2. Zidi at KShs 650" +
                    "\n3. Smarta at KShs 1,400" +
                    "\n0. Back \n00. Main Menu";

                break;
            default:
                response = "CON Invalid option" + "\n0. Back \n00. Main Menu";
                break;

        }
    } else if (currentStep === 2) {
        let coverType = coverTypes[parseInt(userText) - 1];
        if (!coverType) {
            response = "CON Invalid option" + "\n0. Back \n00. Main Menu";
            return response;
        }
        //let userPhoneNumber = phoneNumber?.replace('+', "")?.substring(3);

        response = `CON You get KShs 4,500 / night of hospitalisation up to a Maximum of 30 days a year ` +
            "\nPAY " +
            `\n1. ${coverType.premium} monthly` +
            `\n2. ${coverType.yearly_premium} yearly` + "\n0. Back \n00. Main Menu";
    }
    else if (currentStep === 3) {
        let paymentOption = parseInt(userText);
        let selectedPolicyType = coverTypes[parseInt(allSteps[1]) - 1];
        let policy_type = selectedPolicyType.name;

        let options = calculatePaymentOptionsKenya(policy_type, paymentOption);

        response = `CON Pay Kshs ${options.premium} ${options.period}. Terms&Conditions - www.airtel.com to Agree and Pay` + "\n1. Confirm \n0. Back  \n00. Main Menu";

    }
    else if (currentStep === 4) {

        if (userText == "1") {

            response = 'END Please wait for Airtel Money Pin prompt to complete the payment'
            console.log("=============== END SCREEN USSD RESPONCE SELF KENYA =======", phoneNumber, new Date());

            let selectedPolicyType = coverTypes[parseInt(allSteps[1]) - 1];
            let fullPhone = !phoneNumber?.startsWith('+') ? `+${phoneNumber}` : phoneNumber;
            let existingUser = await db.users.findOne({
                where: {
                    phone_number: phone,
                    partner_id: 1,
                },
            });

            if (!existingUser) {
                console.log("USER DOES NOT EXIST SELF KENYA ");
                let user = await getAirtelKenyaUser(phoneNumber);

                let membershipId = Math.floor(100000 + Math.random() * 900000);

                existingUser = await db.users.create({
                    user_id: uuidv4(),
                    phone_number: phone,
                    membership_id: membershipId,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    name: `${user.first_name} ${user.last_name}`,
                    total_member_number: "M",
                    partner_id: 1,
                    role: "user",
                    nationality: "KENYA",
                });

                const message = `Dear ${user.first_name}, welcome to AfyaSure Care. Membership ID: ${membershipId} Dial *334*7*3# to access your account.`;
                await SMSMessenger.sendSMS(fullPhone, message);

            }


            // create policy
            let policy_type = selectedPolicyType.name;
            let installment_type = parseInt(allSteps[2]);
            let ultimatePremium = calculatePaymentOptionsKenya(policy_type, installment_type);
            let installment_next_month_date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1)

            let policyObject = {
                policy_id: uuidv4(),
                installment_type: installment_type == 1 ? 2 : 1,
                installment_order: installment_type == 1 ? 0 : 1,
                policy_type: policy_type,
                policy_deduction_amount: ultimatePremium.premium,
                policy_pending_premium:  selectedPolicyType.yearPemium -ultimatePremium.premium,
                sum_insured: selectedPolicyType.sumInsured,
                premium: ultimatePremium.premium,
                yearly_premium: selectedPolicyType.yearPemium,
                last_expense_insured: selectedPolicyType.lastExpenseInsured,
                policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
                policy_start_date: new Date(),
                installment_date: installment_type == 1 ? new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)) : installment_next_month_date,
                membership_id: Math.floor(100000 + Math.random() * 900000),
                beneficiary: "SELF",
                policy_status: "pending",
                policy_deduction_day: new Date().getDate() - 1,
                partner_id: 1,
                country_code: "KE",
                currency_code: "KES",
                product_id: "e18424e6-5316-4f12-9826-302c866b380d",
                user_id: existingUser.user_id,
                phone_number: phoneNumber,
                first_name: existingUser?.first_name,
                last_name: existingUser?.last_name,
                inpatient_cover: selectedPolicyType.inPatient,
                outpatient_cover: selectedPolicyType.outPatient,
                maternity_cover: selectedPolicyType.maternity,
                hospital_cash: selectedPolicyType.hospitalCash,


            }


            let policy = await db.policies.create(policyObject);

            console.log("============== START TIME - SELFKENYA   ================ ", phoneNumber, new Date());

            const airtelMoneyPromise = airtelMoneyKenya(
                existingUser.user_id,
                policy.policy_id,
                phone,
                ultimatePremium.premium,
                existingUser.membership_id,
            );
            //user_id, policy_id, phoneNumber, amount, reference,


            const timeout = 3000;

            Promise.race([
                airtelMoneyPromise,
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error('Airtel Money kenya operation timed out'));
                    }, timeout);
                })
            ]).then((result) => {
                // Airtel Money operation completed successfully
                console.log("============== END TIME - SELF KENYA  ================ ", phoneNumber, new Date());
                response = 'END Payment successful';
                console.log("RESPONSE WAS CALLED KENYA ", result);
                return response;
            }).catch((error) => {
                response = 'END Payment failed';
                console.log("RESPONSE WAS CALLED KENYA ", error);
                return response;
            });

            console.log("============== AFTER CATCH TIME - SELF KENYA  ================ ", phoneNumber, new Date());

        } else {
            response = "END Thank you for using AfyaSure"
        }
    }

    return response;
}

export default selfMenu;


/*

============== START TIME - SELF ======  +256706991200 2023-10-24T21:03:11.440Z
=========== PUSH TO AIRTEL MONEY =========== 706991200 2023-10-24T21:03:11.441Z
=========== AFTER CATCH TIMe==========   +256706991200 2023-10-24T21:03:11.490Z
=== RETURN RESPONSE AIRTEL MONEY =========== 706991200 2023-10-24T21:03:16.115Z

=======END TIME - SELF ================  +256706991200 2023-10-24T21:03:16.122Z

*/

