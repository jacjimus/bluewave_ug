import { airtelMoney } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
import sendSMS from "../../services/sendSMS";
import { calculatePaymentOptions, parseAmount } from "../../services/utils";
import { getAirtelUser } from "../../services/getAirtelUser";

const selfMenu = async (args, db) => {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;

    const coverTypes = [{
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
        sumInsured: 1500000,
        premium: "14,000",
        yearly_premium: "167,000",
        yearPemium: 167000,
        last_expense_insured: "1.5M",
        lastExpenseInsured: 1500000
    },
    {
        name: "BIGGIE",
        sum_insured: "5M",
        sumInsured: 1500000,
        premium: "18,000",
        yearly_premium: "208,000",
        yearPemium: 208000,
        last_expense_insured: "2M",
        lastExpenseInsured: 2000000
    }];

    if (currentStep === 1) {
        switch (userText) {
            case "1":
                // const covers = coverTypes.map((coverType, index) => {
                //     return `\n${index + 1}. ${coverType.name} at UGX ${coverType.premium}`
                // }
                // ).join("");
                
                
                // response = "CON Buy for self " + covers + "\n0. Back \n00. Main Menu";

                // create a raw menu with the cover types without looping
                response = "CON Buy for self " +
                    "\n1. MINI at UGX 10,000" +
                    "\n2. MIDI at UGX 14,000" +
                    "\n3. BIGGIE at UGX 18,000" +
                    "\n0. Back \n00. Main Menu";

                break;

            }
    }
    else if (currentStep === 2) {
        let coverType = coverTypes[parseInt(userText) - 1];
        if (!coverType) {
            response = "CON Invalid option" + "\n0. Back \n00. Main Menu";
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

        response = `CON Pay UGX ${options.premium} ${options.period}. Terms&Conditions - www.airtel.com\nConfirm to Agree and Pay` + "\n1. Confirm \n0. Back";

    }
    else if (currentStep === 4) {
        if (userText == "1") {
            let existingUser = await getAirtelUser(phoneNumber, "UG", "UGX", 2);
            let selectedPolicyType = coverTypes[parseInt(allSteps[1]) - 1];
            let phone = phoneNumber?.replace('+', "")?.substring(3);
            let fullPhone = !phoneNumber?.startsWith('+') ? `+${phoneNumber}` : phoneNumber;

            // create user
            if (existingUser) {



                const user = await db.users.findOne({
                    where: {
                        phone_number: phone,
                    },
                });

                console.log("USER FOUND", user, phone);

                if (!user) {
                    existingUser = await db.users.create({
                        user_id: uuidv4(),
                        phone_number: phone,
                        membership_id: Math.floor(100000 + Math.random() * 900000),
                        pin: Math.floor(1000 + Math.random() * 9000),
                        first_name: existingUser.first_name,
                        last_name: existingUser.last_name,
                        name: `${existingUser.first_name} ${existingUser.last_name}`,
                        total_member_number: "M",
                        partner_id: 2,
                        role: "user",
                    });
                    console.log("USER DOES NOT EXIST", user);
                    const message = `Dear ${existingUser.first_name}, welcome to Ddwaliro Care. Membership ID: ${existingUser.membership_id} Dial *185*7*6# to access your account.`;
                    await sendSMS(fullPhone, message);
                }
                else {
                    existingUser = user;
                }
            } else {
             existingUser = await db.users.findOne({
                    where: {
                      phone_number: phone,
                    },
                  });
                  console.log("USER FOUND", existingUser, phone)
                 if(!existingUser){
                  existingUser = await db.users.create({
                    user_id: uuidv4(),
                    phone_number: phone,
                    membership_id: Math.floor(100000 + Math.random() * 900000),
                    pin: Math.floor(1000 + Math.random() * 9000),
                    first_name: "Test",
                    last_name: "User",
                    name: `Test User`,
                    total_member_number: "M",
                    partner_id: 2,
                    role: "user",
                  });
                }
                
            }

            // create policy
            let policy_type = selectedPolicyType.name;
            let installment_type = parseInt(allSteps[2]);
            let period = installment_type == 1 ? "yearly" : "monthly";

            let ultimatePremium = calculatePaymentOptions(policy_type, installment_type);
            console.log("ULTIMATE PREMIUM", ultimatePremium);
 //next month minus 1 day
             let installment_next_month_date =  new Date(new Date().getFullYear(), new Date().getMonth() + 1,  new Date().getDate() - 1)



            let policyObject = {
                policy_id: uuidv4(),
                installment_type: installment_type == 1 ? 2 : 1,
                policy_type: policy_type,
                policy_deduction_amount: ultimatePremium.premium,
                policy_pending_premium: ultimatePremium.premium,
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
                partner_id: 2,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: "d18424d6-5316-4e12-9826-302b866a380c",
                user_id: existingUser.user_id,
                phone_number: phoneNumber,
                
            }
            console.log("POLICY OBJECT", policyObject);

            let policy = await db.policies.create(policyObject);

            // create payment
            let paymentStatus = await airtelMoney(
                existingUser.user_id,
                2,
                policy.policy_id,
                phone,
                ultimatePremium.premium,
                existingUser.membership_id,
                "UG",
                "UGX"
            );

            if (paymentStatus.code === 200) {
                response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'
                // response = `END Congratulations! You are now covered for Inpatient benefit of UGX ${selectedPolicyType.sum_insured} and Funeral benefit of UGX ${selectedPolicyType.last_expense_insured}.
                //        Cover valid till ${policy.policy_end_date.toDateString()}`;
            } else {
                response = `CON Sorry, your payment was not successful. 
                    \n0. Back \n00. Main Menu`;
            }
        } else {
            response = "END Sorry to see you go. Dial *185*7*6# to access your account.";
        }
    }

    return response;
}

export default selfMenu;

