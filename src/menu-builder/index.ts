import { RequestBody } from "./typings/global";
import languages from "./lang";
import configs from "./configs";
import UssdMenu from "ussd-builder";
import crypto from "crypto";
import sendSMS from "../services/sendSMS"
import { v4 as uuidv4 } from "uuid";

import { termsAndConditions } from "./menus/termsAndConditions";
//import { buyForSelf } from "./menus/buyForSelf";
import { displayFaqsMenu } from "./menus/faqs";
import { buyForFamily } from "./menus/buyForFamily";
import { myAccount } from "./menus/myAccount";
import { payNowPremium } from "./menus/payNow";
import { chooseHospital } from "./menus/chooseHospital";
import { buyForOthers } from "./menus/buyForOthers";
import { makeClaim } from "./menus/makeClaim";

import getAirtelUser from "../services/getAirtelUser";
import { airtelMoney } from "../services/payment";



require("dotenv").config();

let menu = new UssdMenu();

export default function (args: RequestBody, db: any) {
  return new Promise(async (resolve, reject) => {
    try {
      const Session = db.sessions;
      const User = db.users;
      const Policy = db.policies;
      const Beneficiary = db.beneficiaries;
      const Transaction = db.transactions;
      const Payment = db.payments;
      const Claim = db.claims;
    

      //if  args.phoneNumber has a + then remove it
      if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
      }

      console.log("====== USER PHONE NUMBER ===", args.phoneNumber)
      let userPhoneNumber = args.phoneNumber;
      //if args.phoneNumber is 12 digit remove the first three country code
      if (args.phoneNumber.length == 12) {
        userPhoneNumber = args.phoneNumber.substring(3);
        args.phoneNumber = userPhoneNumber;
      }


   

      async function getUser(phoneNumber: any) {
        return await User.findOne({
          where: {
            phone_number: phoneNumber,
          },
        });
      }

      const findUserByPhoneNumber = async (phoneNumber: any) => {
        return await User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    };

    const findPaidPolicyByUser = async (user: any) => {
        let policies = await Policy.findAll({
            where: {
                user_id: user.user_id,
                policy_status: 'paid'
            },
        });
        return policies[policies.length - 1];
    };

    const findPolicyByUser = async (user_id: any) => {
        let policies = await Policy.findAll({
            where: {
                user_id: user_id,
            },
        });

        return policies[policies.length - 1];
    }

      

      // Retrieve user using provided phone number
      const user = await getUser(userPhoneNumber);

      if (!user) {
        throw new Error("User not found");
      }

      // Function to generate a SHA-256 hash
      const generateHash = (data) => {
        const hash = crypto.createHash('sha256');
        hash.update(data);
        return hash.digest('hex');
      };

      const buildInput = {
        current_input: args.text,
        full_input: args.text,
        masked_input: args.text,
        active_state: configs.start_state,
        sid: configs.session_prefix + args.sessionId,
        language: configs.default_lang,
        phone_number: args.phoneNumber,
        hash: "",
        user_id: user.user_id,
        partner_id: user.partner_id,
      };

      const hashData = `${buildInput.sid}${buildInput.user_id}${buildInput.partner_id}`;
      const generatedHash = generateHash(hashData);

      // Set the generated hash in the buildInput object
      //buildInput.hash = generatedHash;
      // Check if session exists
      let session = await Session.findOne({
        where: {
          sid: buildInput.sid,
        },
      });

      if (!session) {
        // Create new session
        session = await Session.create(buildInput);
        console.log("New Session:", session);
      } else {
        // Update existing session
        await Session.update(buildInput, {
          where: {
            sid: buildInput.sid,
          },
        });
        
      }

      // ===============SET MENU STATES============
  
      
      menu.startState({
        run: async () => {
          console.log(" ===========================");
          console.log(" ******** START MENU *******");
          console.log(" ===========================");
      
            menu.con(
              'Ddwaliro Care' +
                '\n1. Buy for self' +
                '\n2. Buy (family)' +
                '\n3. Buy (others)' +
                '\n4. Make Claim' +
                '\n5. My Policy' +
                '\n6. View Hospital' +
                '\n7. Terms & Conditions' +
                '\n8. FAQs'
            );
       
        },
        next: {
          '1': 'buyForSelf',
          '2': 'buyForFamily',
          '3': 'buyForOthers',
          '4': 'makeClaim',
          '5': 'myAccount',
          '6': 'chooseHospital',
          '7': 'termsAndConditions',
          '8': 'faqs',
     
        },
      });

      menu.state("account", {
        run: async () => {
            menu.con(
              'Medical cover' +
                '\n1. Buy for self' +
                '\n2. Buy (family)' +
                '\n3. Buy (others)' +
                '\n4. Make Claim' +
                '\n5. My Policy' +
                '\n6. View Hospital' +
                '\n7. Terms & Conditions' +
                '\n8. FAQs'
            );
        
        },
        next: {
          '1': 'buyForSelf',
          '2': 'buyForFamily',
          '3': 'buyForOthers',
          '4': 'makeClaim',
          '5': 'myAccount',
          '6': 'chooseHospital',
          '7': 'termsAndConditions',
          '8': 'faqs',
     
        },
      });

      

    
      myAccount(menu, args, db);
    
      //=================BUY FOR SELF=================
      menu.state('buyForSelf', {
        run: async () => {
            console.log("* BUY FOR SELF", args.phoneNumber)

            const user = await findUserByPhoneNumber(args.phoneNumber);
            const policy = await findPaidPolicyByUser(user);

            // if (policy) {
            //     menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
            //     return;
            // }
            menu.con('Buy for self ' +
                '\n1. Mini – UGX 10,000' +
                '\n2. Midi - UGX 14,000' +
                '\n3. Biggie – UGX 18,000' +
                '\n0.Back' +
                '\n00.Main Menu'
            )

        },
        next: {
            '*\\d+': 'buyForSelf.coverType',

            '0': ""
        }
    });
    menu.state('buyForSelf.coverType', {
        run: async () => {
            let coverType = menu.val;

            const { user_id, phone_number, first_name, last_name, partner_id } = await findUserByPhoneNumber(args.phoneNumber);
            const date = new Date();
            const day = date.getDate() - 1;
            let sum_insured: any, premium: any, yearly_premium: any;
            if (coverType == "1") {
                coverType = 'MINI';
                sum_insured = "1.5M"
                premium = "10,000"
                yearly_premium = "120,000"

            } else if (coverType == "2") {
                coverType = 'MIDI';
                sum_insured = "3M"
                premium = "14,000"
                yearly_premium = "167,000"
            } else if (coverType == "3") {
                coverType = 'BIGGIE';
                sum_insured = "5M"
                premium = "18,000"
                yearly_premium = "208,000"
            }

            await Policy.create({
                user_id: user_id,
                policy_id: uuidv4(),
                policy_type: coverType,
                beneficiary: 'SELF',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                partner_id: partner_id,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',

            })


            menu.con(`Inpatient cover for ${phone_number},${first_name.toUpperCase()} ${last_name.toUpperCase()} UGX ${sum_insured} a year 
                    PAY
                    1-UGX ${premium} monthly
                    2-UGX ${yearly_premium} yearly
                    
                    0. Back 00. Main Menu`);
        },
        next: {
            '*\\d+': 'buyForSelf.paymentOption',
            '0': 'account',
            '00': 'insurance'
        }
    });

    menu.state('buyForSelf.paymentOption', {
        run: async () => {
            const paymentOption = parseInt(menu.val);
            const { user_id } = await findUserByPhoneNumber(args.phoneNumber)
            const { policy_type } = await findPolicyByUser(user_id)
            let sum_insured: number, premium: number = 0, period: string, installment_type: number


            if (policy_type == 'MINI') {
                period = 'yearly'
                installment_type = 1;
                sum_insured = 1500000;
                premium = 120000;

                if (paymentOption == 1) {
                    period = 'monthly'
                    premium = 10000;
                    installment_type = 2;
                }

            } else if (policy_type == 'MIDI') {
                period = 'yearly'
                installment_type = 1;
                sum_insured = 3000000
                premium = 167000
                if (paymentOption == 1) {
                    period = 'monthly'
                    premium = 14000;
                    installment_type = 2;

                }

            }
            else if (policy_type == 'BIGGIE') {
                period = 'yearly'
                installment_type = 1;
                sum_insured = 5000000;
                premium = 208000;


                if (paymentOption == 1) {
                    period = 'monthly'
                    premium = 18000;
                    installment_type = 2;

                }
            }
            menu.con(`Pay UGX ${premium} payable ${period}.
            Terms&Conditions - www.airtel.com
            Enter PIN to Agree and Pay 
            \n0 .Back
             00 .Main Menu`
            )
        },
        next: {
            '*\\d+': 'buyForSelf.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });


    menu.state('buyForSelf.confirm', {
        run: async () => {
            try {
                const userKyc = await getAirtelUser(args.phoneNumber, "UG", "UGX", 2)
                const userPin = Number(menu.val)

                const selected = args.text;


                const input = selected.trim();
                const digits = input.split("*").map((digit) => parseInt(digit, 10));

                let paymentOption = Number(digits[digits.length - 2]);
                console.log("PAYMENT OPTION", paymentOption)

                const { user_id, phone_number, partner_id, membership_id, pin } = await findUserByPhoneNumber(args.phoneNumber);

                if (userPin != pin && userPin != membership_id) {
                    menu.end('Invalid PIN');
                }

                const { policy_type, policy_id } = await findPolicyByUser(user_id);

                if (policy_id == null) {
                    menu.end('Sorry, you have no policy to buy for self');
                }
                let sum_insured: number, premium: number = 0, installment_type: number = 0, period: string = 'monthly', last_expense_insured: number = 0, si: string, lei: string, frequency: string;
                if (policy_type == 'MINI') {
                    period = 'yearly'
                    installment_type = 1;
                    sum_insured = 1500000;
                    si = '1.5M'
                    premium = 120000;
                    last_expense_insured = 1000000;
                    lei = '1M'
                    if (paymentOption == 1) {
                        period = 'monthly'
                        premium = 10000;
                        installment_type = 2;
                    }

                } else if (policy_type == 'MIDI') {
                    period = 'yearly'
                    installment_type = 1;
                    sum_insured = 3000000;
                    si = '3M'
                    premium = 167000;
                    last_expense_insured = 1500000;
                    lei = '1.5M'

                    if (paymentOption == 1) {
                        period = 'monthly'
                        premium = 14000;
                        installment_type = 2;

                    }
                }
                else if (policy_type == 'BIGGIE') {
                    period = 'yearly'
                    installment_type = 1;
                    sum_insured = 5000000;
                    si = '5M'
                    premium = 208000;
                    last_expense_insured = 2000000;
                    lei = '2M'
                    if (paymentOption == 1) {
                        period = 'monthly'
                        premium = 18000;
                        installment_type = 2;

                    }

                }

                if (paymentOption == 1) {
                    frequency = 'month'
                } else {
                    frequency = 'year'
                }

                const policy_end_date = new Date(new Date().setFullYear(new Date().getFullYear() + 1));


                await Policy.update({
                    policy_deduction_amount: premium,
                    policy_pending_premium: premium,
                    sum_insured: sum_insured,
                    premium: premium,
                    installment_type: installment_type,
                    installment_order: 1,
                    last_expense_insured: last_expense_insured,
                    policy_end_date: policy_end_date,
                    policy_start_date: new Date(),
                }, { where: { user_id: user_id } });



                let paymentStatus = await airtelMoney(user_id, partner_id, policy_id, phone_number, premium, membership_id, "UG", "UGX");

                console.log("PAYMENT STATUS", paymentStatus)
                if (paymentStatus.code === 200) {
                    let congratText = `Congratulations! You bought Mini cover for Inpatient (UGX ${si}) and Funeral (UGX ${lei}) for a year. 
                        Pay UGX ${premium} every ${frequency} to stay covered`
                    await sendSMS(phone_number, congratText);

                    menu.end(`Congratulations! You are now covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                           Cover valid till ${policy_end_date.toDateString()}`)

                } else {
                    menu.end(`Sorry, your payment was not successful. 
                        \n0. Back \n00. Main Menu`);
                }

            } catch (error) {
                console.error('Confirmation Error:', error);
                menu.end('An error occurred. Please try again later.');
            }
        }

    });


      //=================BUY FOR FAMILY=================
      buyForFamily(menu, args, db);

      //=================BUY FOR OTHERS=================
      buyForOthers(menu, args, db);

      //================MY ACCOUNT===================
     
      //================== MAKE CLAIM ===================
      makeClaim(menu, args, db);

      //==================PAY NOW===================
      payNowPremium(menu, args, db);

      //==================FAQS===================
      displayFaqsMenu(menu);

      //===================TERMS AND CONDITIONS===================
      termsAndConditions(menu, args);

      //===================CHOOSE HOSPITAL===================
      chooseHospital(menu, args, db);


      // RUN THE MENU
      let menu_res = await menu.run(args);
      // RETURN THE MENU RESPONSE
      resolve(menu_res);
      return;
    } catch (e) {
      console.log(e);
      // SOMETHING WENT REALLY WRONG
      reject("END " + languages[configs.default_lang].generic.fatal_error);
      return;
    }
  });
}
