import { RequestBody } from "./typings/global";
import languages from "./lang";
import configs from "./configs";
import UssdMenu from "ussd-builder";
import { airtelMoney } from "../services/payment";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import getAirtelUser from "../services/getAirtelUser";

require("dotenv").config();

async function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const menu = new UssdMenu();

export default function handleUssd(args: RequestBody, db: any) {
  return new Promise(async (resolve, reject) => {
    try {
      const Session = db.sessions;
      const User = db.users;
      const Policy = db.policies;
      const Claim = db.claims;
      const Partner = db.partners;
      const Product = db.products;
      const Beneficiary = db.beneficiaries;

      //if  args.phoneNumber has a + then remove it
      if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
      }


      console.log(args.phoneNumber)
      let userPhoneNumber = args.phoneNumber;
      //if args.phoneNumber is 12 digit remove the first three country code
      if (args.phoneNumber.length == 12) {
        userPhoneNumber = args.phoneNumber.substring(3);
        args.phoneNumber = userPhoneNumber;
      }


      const userKyc = await getAirtelUser(userPhoneNumber, "KE", "KES", 1)
      // console.log("USER KYC KENYA ", userKyc)

      async function getUser(phoneNumber: any) {
        return await User.findOne({
          where: {
            phone_number: phoneNumber,
          },
        });
      }

      // Retrieve user using provided phone number
      const user = await getUser(userPhoneNumber);
      // console.log("USER KENYA: ", user);

      if (!user) {
        throw new Error("User not found");
      }

      // Function to generate a SHA-256 hash
      const generateHash = (data: any) => {
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

      const hashData = `${buildInput.sid}${buildInput.user_id}`;
      const generatedHash = generateHash(hashData);

      // Set the generated hash in the buildInput object
      //buildInput.hash = generatedHash;

      console.log("========  buildInput ===========", buildInput);
      // Check if session exists
      let session = await Session.findOne({
        where: {
          sid: buildInput.sid,
        },
      });

      if (!session) {
        // Create new session
        session = await Session.create(buildInput);
        //console.log("New Session:", session);
      } else {
        // Update existing session
        await Session.update(buildInput, {
          where: {
            sid: buildInput.sid,
          },
        });
        //console.log("Updated Session:", session);
      }
      // ===============SET START MENU STATES============
      // Set the start state for the menu
      // menu.startState({
      //   run: async () => {
      //     menu.con(
      //       "Welcome. Choose option:" +
      //       "\n1. Send Money" +
      //       "\n2. Airtime/Bundles" +
      //       "\n3. Withdraw Cash" +
      //       "\n4. Pay Bill" +
      //       "\n5. Payments" +
      //       "\n6. School Fees" +
      //       "\n7. Financial Services" +
      //       "\n8. Wewole" +
      //       "\n9. AirtelMoney Pay" +
      //       "\n10. My account" +
      //       "\n11. BiZ Wallet"
      //     );
      //   },
      //   next: {
      //     "7": "account",
      //   },
      // });

      // menu.state("account", {
      //   run: () => {
      //     menu.con(
      //       "Financial Services" +
      //       "\n1. Banks" +
      //       "\n2. Group Collections" +
      //       "\n3. M-SACCO" +
      //       "\n4. ATM Withdraw" +
      //       "\n5. NSSF Savings" +
      //       "\n6. Insurance" +
      //       "\n7. Yassako Loans" +
      //       "\n8. SACCO" +
      //       "\n9. AirtelMoney MasterCard" +
      //       "\n10. Loans" +
      //       "\n11. Savings" +
      //       "\nn  Next"
      //     );
      //   },
      //   next: {
      //     "6": "medical_cover",
      //   },
      // });


      menu.startState({
        run: async () => {
          menu.con(
            "Insurance " +
            "\n1. Medical cover" +
            "\n2. Auto Insurance" +
            "\n0. Back" +
            "\n00. Main Menu"
          );
        },
        next: {
          "1": "account",
        },
      });

      menu.state('account', {
        run: async () => {
          const user = await db.users.findOne({
            where: {
              phone_number: args.phoneNumber,
              gender: {
                [db.Sequelize.Op.ne]: null,
              },
            },
          });

          console.log(" ============== USER ================ ", user);
          if (user) {
            menu.con('Medical cover ' +
              '\n1. Buy for self' +
              '\n2. Buy for family' +
              '\n3. Buy for others' +
              '\n4. Admission Claim' +
              '\n5. My Account' +
              '\n6. Choose Hospital' +
              '\n7. Terms & Conditions' +
              '\n8. FAQs' +
              '\n00.Main Menu'
            )

          } else {
            menu.con('Medical cover ' +
              '\n0. Update profile(KYC)')

          }
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
          '0': 'updateProfile',
          '00': 'insurance',
        }
      });
      //=================BUY FOR SELF=================

      menu.state("buyForSelf", {
        run: () => {
          menu.con(
            "Buy for self " +
            "\n1. Bronze  – KES 300" +
            "\n2. Silver – KES 650" +
            "\n3. Gold – KES 14,000" +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
        next: {
          "1": "buyForSelf.bronze",
          "2": "buyForSelf.silver",
          "3": "buyForSelf.gold",
          "0": "account",
          "00": "account",
        },
      });

      // TO BE DONE
      menu.state("buyForSelf.bronze", {
        run: async () => {
          try {
            let { name } = await getUser(args.phoneNumber);
            console.log("USER NAME: ", name);
            const policy = await Policy.findOne({ where: { partner_id: 1 } });
            console.log("POLICY: ", policy);
            // if (policy) {
            //   menu.con("You already have a policy. \n 0. Back \n 00. Main Menu");

            // }


            const full_name = name.toUpperCase();


            menu.con(`Hospital cover for ${full_name}, ${args.phoneNumber} KES 1M a year 
                          PAY
                          1. KES 300 deducted monthly
                          2. KES 3,292 yearly
                          0. Back
                          00. Main Menu`);
          } catch (error) {
            console.error("Error in buyForSelf.bronze:", error);
            menu.con("An error occurred. Please try again later.");
          }
        },
        next: {
          "1": "buyForSelf.bronze.pay",
          "2": "buyForSelf.bronze.pay.yearly",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.silver", {
        run: async () => {
          try {
            let { name } = await getUser(args.phoneNumber);
            console.log("USER NAME: ", name);
            const policy = await Policy.findOne({ where: { partner_id: 1 } });
            console.log("POLICY: ", policy);
            // if (policy) {
            //   menu.con("You already have a policy. \n 0. Back \n 00. Main Menu");

            // }


            const full_name = name.toUpperCase();


            menu.con(`Hospital cover for ${full_name}, ${args.phoneNumber} KES 3M a year 
                          PAY
                          1. KES 650 deducted monthly
                          2. KES 7,142 yearly
                          0. Back
                          00. Main Menu`);
          } catch (error) {
            console.error("Error in buyForSelf.silver:", error);
            menu.con("An error occurred. Please try again later.");
          }
        },
        next: {
          "1": "buyForSelf.silver.pay",
          "2": "buyForSelf.silver.pay.yearly",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.gold", {
        run: async () => {
          try {
            let { name } = await getUser(args.phoneNumber);
            console.log("USER NAME: ", name);
            const policy = await Policy.findOne({ where: { partner_id: 1 } });
            console.log("POLICY: ", policy);
            // if (policy) {
            //   menu.con("You already have a policy. \n 0. Back \n 00. Main Menu");

            // }


            const full_name = name.toUpperCase();


            menu.con(`Hospital cover for ${full_name}, ${args.phoneNumber} KES 5M a year 
                          PAY
                          1. KES 14,000 deducted monthly
                          2. KES 154,000 yearly
                          0. Back
                          00. Main Menu`);
          } catch (error) {
            console.error("Error in buyForSelf.gold:", error);
            menu.con("An error occurred. Please try again later.");
          }
        },
        next: {
          "1": "buyForSelf.bronze.pay",
          "2": "buyForSelf.bronze.pay.yearly",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.bronze.pay", {
        run: () => {
          menu.con(
            "Pay KES 300 deducted monthly." +
            "\nTerms&Conditions - www.airtel.com" +
            '\nEnter PIN or Membership ID to Agree and Pay' +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
        next: {
          "*\\d+": "buyForSelf.bronze.pin",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.silver.pay", {
        run: () => {
          menu.con(
            "Pay KES 650 deducted monthly." +
            "\nTerms&Conditions - www.airtel.com" +
            '\nEnter PIN or Membership ID to Agree and Pay' +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
        next: {
          "*\\d+": "buyForSelf.silver.pin",
          "0": "account",
          "00": "account",
        },
      });


      menu.state("buyForSelf.gold.pay", {
        run: () => {
          menu.con(
            "Pay KES 14,000 deducted monthly." +
            "\nTerms&Conditions - www.airtel.com" +
            '\nEnter PIN or Membership ID to Agree and Pay' +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
        next: {
          "*\\d+": "buyForSelf.gold.pin",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.bronze.pay.yearly", {
        run: () => {
          menu.con(
            "Pay KES 3,292 deducted yearly." +
            "\nTerms&Conditions - www.airtel.com" +
            '\nEnter PIN or Membership ID to Agree and Pay' +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
        next: {
          "*\\d+": "buyForSelf.bronze.yearly.confirm",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.bronze.pin", {
        run: async () => {
          // use menu.val to access user input value
          let user_pin = Number(menu.val);
          const { pin, membership_id } = await getUser(args.phoneNumber);
          // check if pin is correct
          if (user_pin == pin || membership_id == user_pin
          ) {
            menu.con(
              "SCHEDULE" +
              "\n Enter day of month to deduct KES 300 premium monthly (e.g. 1, 2, 3…31)" +
              "\n0.Back" +
              "\n00.Main Menu"
            );
          } else {
            menu.con("PIN incorrect. Try again");
          }
        },

        next: {
          "*\\d+": "buyForSelf.bronze.confirm",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.silver.pin", {
        run: async () => {
          // use menu.val to access user input value
          let user_pin = Number(menu.val);
          const { pin, membership_id } = await getUser(args.phoneNumber);
          // check if pin is correct
          if (user_pin == pin || membership_id == user_pin
          ) {
            menu.con(
              "SCHEDULE" +
              "\n Enter day of month to deduct KES 650 premium monthly (e.g. 1, 2, 3…31)" +
              "\n0.Back" +
              "\n00.Main Menu"
            );
          } else {
            menu.con("PIN incorrect. Try again");
          }
        },

        next: {
          "*\\d+": "buyForSelf.silver.confirm",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.gold.pin", {
        run: async () => {
          // use menu.val to access user input value
          let user_pin = Number(menu.val);
          const { pin, membership_id } = await getUser(args.phoneNumber);
          // check if pin is correct
          if (user_pin == pin || membership_id == user_pin
          ) {
            menu.con(
              "SCHEDULE" +
              "\n Enter day of month to deduct KES 14,000 premium monthly (e.g. 1, 2, 3…31)" +
              "\n0.Back" +
              "\n00.Main Menu"
            );
          } else {
            menu.con("PIN incorrect. Try again");
          }
        },

        next: {
          "*\\d+": "buyForSelf.gold.confirm",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.bronze.yearly.pin", {
        run: async () => {
          let user_pin = Number(menu.val);
          const { pin, membership_id } = await getUser(args.phoneNumber);
          if (
            user_pin !== 1234 ||
            user_pin == pin ||
            membership_id == user_pin
          ) {
            menu.con(
              "SCHEDULE" +
              "\n Enter day of month to deduct KES 3,294 premium yearly (e.g. 1, 2, 3…31)" +
              "\n0.Back" +
              "\n00.Main Menu"
            );
          } else {
            menu.con("PIN incorrect. Try again");
          }
        },

        next: {
          "*\\d+": "buyForSelf.bronze.yearly.confirm",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.silver.yearly.pin", {
        run: async () => {
          let user_pin = Number(menu.val);
          const { pin, membership_id } = await getUser(args.phoneNumber);
          if (
            user_pin !== 1234 ||
            user_pin == pin ||
            membership_id == user_pin
          ) {
            menu.con(
              "SCHEDULE" +
              "\n Enter day of month to deduct KES 7,152 premium yearly (e.g. 1, 2, 3…31)" +
              "\n0.Back" +
              "\n00.Main Menu"
            );
          } else {
            menu.con("PIN incorrect. Try again");
          }
        },

        next: {
          "*\\d+": "buyForSelf.silver.yearly.confirm",
          "0": "account",
          "00": "account",
        },
      });


      menu.state("buyForSelf.gold.yearly.pin", {
        run: async () => {
          let user_pin = Number(menu.val);
          const { pin, membership_id } = await getUser(args.phoneNumber);
          if (
            user_pin !== 1234 ||
            user_pin == pin ||
            membership_id == user_pin
          ) {
            menu.con(
              "SCHEDULE" +
              "\n Enter day of month to deduct KES 154,000 premium yearly (e.g. 1, 2, 3…31)" +
              "\n0.Back" +
              "\n00.Main Menu"
            );
          } else {
            menu.con("PIN incorrect. Try again");
          }
        },

        next: {
          "*\\d+": "buyForSelf.gold.yearly.confirm",
          "0": "account",
          "00": "account",
        },
      });



      menu.state("buyForSelf.bronze.confirm", {
        run: async () => {
          let deduction_day = Number(menu.val);
          const { pin, user_id, partner_id } = await getUser(args.phoneNumber);

          let date = new Date();
          let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, deduction_day);
          console.log("NEXT DEDUCTION", nextDeduction);
          //today day of month
          let day = date.getDate();

          let policy = {
            policy_id: uuidv4(),
            policy_type: "bronze",
            beneficiary: "self",
            policy_status: "pending",
            policy_start_date: new Date(),
            policy_end_date: new Date(
              date.getFullYear() + 1,
              date.getMonth(),
              day
            ),
            policy_deduction_day: day * 1,
            policy_deduction_amount: 300,
            policy_next_deduction_date: nextDeduction,
            user_id: user_id,
            product_id: 'e18424e6-5316-4f12-9826-302c866b380d',
            premium: 300,
            installment_order: 1,
            installment_type: 1,
            installment_date: new Date(),
            installment_alert_date: new Date(),
            tax_rate_vat: "0.2",
            tax_rate_ext: "0.25",
            sum_insured: "300000",
            excess_premium: "0",
            discount_premium: "0",
            partner_id: partner_id,
            country_code: "KEN",
            currency_code: "KES",
          };

          let newPolicy = await Policy.create(policy);

          console.log(newPolicy);
          console.log("NEW POLICY BRONZE SELF", newPolicy);

          //SEND SMS TO USER
          //  '+2547xxxxxxxx';
          //const to = args.phoneNumber + "".replace('+', '');
          const to = "254" + args.phoneNumber.substring(1);

          const message = `PAID KES 300 to AAR KENYA for Bronze Cover Cover Charge KES 0. Bal KES 300. TID: 715XXXXXXXX. Date: ${new Date().toLocaleDateString()}. `;

          //send SMS
          //const sms = await sendSMS(to, message);

          menu.con(
            "Confirm \n" +
            ` Deduct KES 300, Next deduction will be on ${nextDeduction} 
         1.Confirm 
         0.Back 
         00.Main Menu`
          );
        },
        next: {
          "1": "confirmation",
          "0": "account",
          "00": "account",
        },
      });


      menu.state("buyForSelf.silver.confirm", {
        run: async () => {
          let deduction_day = Number(menu.val);
          const { pin, user_id, partner_id } = await getUser(args.phoneNumber);

          let date = new Date();
          let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, deduction_day);
          console.log("NEXT DEDUCTION", nextDeduction);
          //today day of month
          let day = date.getDate();

          let policy = {
            policy_id: uuidv4(),
            policy_type: "silver",
            beneficiary: "self",
            policy_status: "pending",
            policy_start_date: new Date(),
            policy_end_date: new Date(
              date.getFullYear() + 1,
              date.getMonth(),
              day
            ),
            policy_deduction_day: day * 1,
            policy_deduction_amount: 650,
            policy_next_deduction_date: nextDeduction,
            user_id: user_id,
            product_id: 'e18424e6-5316-4f12-9826-302c866b380d',
            premium: 650,
            installment_order: 1,
            installment_type: 1,
            installment_date: new Date(),
            installment_alert_date: new Date(),
            tax_rate_vat: "0.2",
            tax_rate_ext: "0.25",
            sum_insured: "300000",
            excess_premium: "0",
            discount_premium: "0",
            partner_id: partner_id,
            country_code: "KEN",
            currency_code: "KES",
          };

          let newPolicy = await Policy.create(policy);

          console.log(newPolicy);
          console.log("NEW POLICY BRONZE SELF", newPolicy);

          //SEND SMS TO USER
          //  '+2547xxxxxxxx';
          //const to = args.phoneNumber + "".replace('+', '');
          const to = "254" + args.phoneNumber.substring(1);

          const message = `PAID KES 650 to AAR KENYA for SILVER Cover Cover Charge KES 0. Bal KES 300. TID: 715XXXXXXXX. Date: ${new Date().toLocaleDateString()}. `;

          //send SMS
          //const sms = await sendSMS(to, message);

          menu.con(
            "Confirm \n" +
            ` Deduct KES 650, Next deduction will be on ${nextDeduction} 
         1.Confirm 
         0.Back 
         00.Main Menu`
          );
        },
        next: {
          "1": "confirmation",
          "0": "account",
          "00": "account",
        },
      });


      menu.state("buyForSelf.gold.confirm", {
        run: async () => {
          let deduction_day = Number(menu.val);
          const { pin, user_id, partner_id } = await getUser(args.phoneNumber);

          let date = new Date();
          let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, deduction_day);
          console.log("NEXT DEDUCTION", nextDeduction);
          //today day of month
          let day = date.getDate();

          let policy = {
            policy_id: uuidv4(),
            policy_type: "gold",
            beneficiary: "self",
            policy_status: "pending",
            policy_start_date: new Date(),
            policy_end_date: new Date(
              date.getFullYear() + 1,
              date.getMonth(),
              day
            ),
            policy_deduction_day: day * 1,
            policy_deduction_amount: 14000,
            policy_next_deduction_date: nextDeduction,
            user_id: user_id,
            product_id: 'e18424e6-5316-4f12-9826-302c866b380d',
            premium: 14000,
            installment_order: 1,
            installment_type: 1,
            installment_date: new Date(),
            installment_alert_date: new Date(),
            tax_rate_vat: "0.2",
            tax_rate_ext: "0.25",
            sum_insured: "300000",
            excess_premium: "0",
            discount_premium: "0",
            partner_id: partner_id,
            country_code: "KEN",
            currency_code: "KES",
          };

          let newPolicy = await Policy.create(policy);

          console.log(newPolicy);
          console.log("NEW POLICY BRONZE SELF", newPolicy);

          //SEND SMS TO USER
          //  '+2547xxxxxxxx';
          //const to = args.phoneNumber + "".replace('+', '');
          const to = "254" + args.phoneNumber.substring(1);

          const message = `PAID KES 140000 to AAR KENYA for GOLD Cover Cover Charge KES 0. Bal KES 300. TID: 715XXXXXXXX. Date: ${new Date().toLocaleDateString()}. `;

          //send SMS
          //const sms = await sendSMS(to, message);

          menu.con(
            "Confirm \n" +
            ` Deduct KES 14,000, Next deduction will be on ${nextDeduction} 
         1.Confirm 
         0.Back 
         00.Main Menu`
          );
        },
        next: {
          "1": "confirmation",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.bronze.yearly.confirm", {
        run: async () => {
          try {
            let user_pin = Number(menu.val);
            const { pin, user_id, partner_id, membership_id } = await getUser(args.phoneNumber);
            if (user_pin !== pin && user_pin !== membership_id) {
              menu.con('Sorry incorrect PIN or Membership ID. Please Try again');
            }
            const date = new Date();
            const day = date.getDate();
            const nextDeduction = new Date(
              date.getFullYear() + 1,
              date.getMonth(),
              day
            );

            const policy = {
              policy_id: uuidv4(),
              policy_type: "bronze",
              beneficiary: "self",
              policy_status: "pending",
              policy_start_date: new Date(),
              policy_end_date: nextDeduction,
              policy_deduction_day: day,
              policy_deduction_amount: 3292,
              policy_next_deduction_date: nextDeduction,
              product_id: 'e18424e6-5316-4f12-9826-302c866b380d',
              premium: 3292,
              installment_order: 1,
              installment_type: 2,
              installment_date: nextDeduction,
              installment_alert_date: nextDeduction,
              tax_rate_vat: "0.2",
              tax_rate_ext: "0.25",
              sum_insured: "300000",
              excess_premium: "0",
              discount_premium: "0",
              user_id: user_id,
              partner_id: partner_id,
              country_code: "KEN",
              currency_code: "KES",
            };

            const newPolicy = await Policy.create(policy);

            const to = args.phoneNumber.replace("+", "");
            const message = `PAID KES 3,294 to AAR KENYA for Bronze Cover. Cover Charge KES 0. Bal KES 3,294. TID: 715XXXXXXXX. 
    Date: ${new Date().toLocaleDateString()}.`;

            // Send SMS to user
            // const sms = await sendSMS(to, message);

            menu.con(
              `Confirm\nDeduct KES 3,294, Next deduction will be on ${policy.policy_end_date}\n` +
              "\n1.Confirm\n" +
              "\n0.Back\n00.Main Menu"
            );
          } catch (error) {
            console.error("Error in buyForSelf.bronze.yearly.confirm:", error);
            menu.con("An error occurred. Please try again later.");
          }
        },
        next: {
          "1": "confirmation",
          "0": "account",
          "00": "account",
        },
      });


      menu.state("buyForSelf.silver.yearly.confirm", {
        run: async () => {
          try {
            let user_pin = Number(menu.val);
            const { pin, user_id, partner_id, membership_id } = await getUser(args.phoneNumber);
            if (user_pin !== pin && user_pin !== membership_id) {
              menu.con('Sorry incorrect PIN or Membership ID. Please Try again');
            }
            const date = new Date();
            const day = date.getDate();
            const nextDeduction = new Date(
              date.getFullYear() + 1,
              date.getMonth(),
              day
            );

            const policy = {
              policy_id: uuidv4(),
              policy_type: "silver",
              beneficiary: "self",
              policy_status: "pending",
              policy_start_date: new Date(),
              policy_end_date: nextDeduction,
              policy_deduction_day: day,
              policy_deduction_amount: 7142,
              policy_next_deduction_date: nextDeduction,
              product_id: 'e18424e6-5316-4f12-9826-302c866b380d',
              premium: 7142,
              installment_order: 1,
              installment_type: 2,
              installment_date: nextDeduction,
              installment_alert_date: nextDeduction,
              tax_rate_vat: "0.2",
              tax_rate_ext: "0.25",
              sum_insured: "300000",
              excess_premium: "0",
              discount_premium: "0",
              user_id: user_id,
              partner_id: partner_id,
              country_code: "KEN",
              currency_code: "KES",
            };

            const newPolicy = await Policy.create(policy);

            const to = args.phoneNumber.replace("+", "");
            const message = `PAID KES 7142 to AAR KENYA for  Silver Cover. Cover Charge KES 0. Bal KES 3,294. TID: 715XXXXXXXX. 
    Date: ${new Date().toLocaleDateString()}.`;

            // Send SMS to user
            // const sms = await sendSMS(to, message);

            menu.con(
              `Confirm\nDeduct KES 7,412, Next deduction will be on ${policy.policy_end_date}\n` +
              "\n1.Confirm\n" +
              "\n0.Back\n00.Main Menu"
            );
          } catch (error) {
            console.error("Error in buyForSelf.silver.yearly.confirm:", error);
            menu.con("An error occurred. Please try again later.");
          }
        },
        next: {
          "1": "confirmation",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("buyForSelf.gold.yearly.confirm", {
        run: async () => {
          try {
            let user_pin = Number(menu.val);
            const { pin, user_id, partner_id, membership_id } = await getUser(args.phoneNumber);
            if (user_pin !== pin && user_pin !== membership_id) {
              menu.con('Sorry incorrect PIN or Membership ID. Please Try again');
            }
            const date = new Date();
            const day = date.getDate();
            const nextDeduction = new Date(
              date.getFullYear() + 1,
              date.getMonth(),
              day
            );

            const policy = {
              policy_id: uuidv4(),
              policy_type: "gold",
              beneficiary: "self",
              policy_status: "pending",
              policy_start_date: new Date(),
              policy_end_date: nextDeduction,
              policy_deduction_day: day,
              policy_deduction_amount: 154000,
              policy_next_deduction_date: nextDeduction,
              product_id: 'e18424e6-5316-4f12-9826-302c866b380d',
              premium: 154000,
              installment_order: 1,
              installment_type: 2,
              installment_date: nextDeduction,
              installment_alert_date: nextDeduction,
              tax_rate_vat: "0.2",
              tax_rate_ext: "0.25",
              sum_insured: "300000",
              excess_premium: "0",
              discount_premium: "0",
              user_id: user_id,
              partner_id: partner_id,
              country_code: "KEN",
              currency_code: "KES",
            };

            const newPolicy = await Policy.create(policy);

            const to = args.phoneNumber.replace("+", "");
            const message = `PAID KES 154,000 to AAR KENYA for  Silver Cover. Cover Charge KES 0. Bal KES 3,294. TID: 715XXXXXXXX. 
    Date: ${new Date().toLocaleDateString()}.`;

            // Send SMS to user
            // const sms = await sendSMS(to, message);

            menu.con(
              `Confirm\nDeduct KES 154,0000, Next deduction will be on ${policy.policy_end_date}\n` +
              "\n1.Confirm\n" +
              "\n0.Back\n00.Main Menu"
            );
          } catch (error) {
            console.error("Error in buyForSelf.silver.yearly.confirm:", error);
            menu.con("An error occurred. Please try again later.");
          }
        },
        next: {
          "1": "confirmation",
          "0": "account",
          "00": "account",
        },
      });
      //===============CONFIRMATION=================

      menu.state("confirmation", {
        run: async () => {
          try {
            const { user_id, phone_number, partner_id, membership_id } = await getUser(
              args.phoneNumber
            );
            const { policy_id, policy_deduction_day, policy_deduction_amount } = await Policy.findOne({
              where: {
                user_id: user_id,
              },
            });

            if (policy_id) {
              // Call the airtelMoney function and handle payment status
              const paymentStatus = await airtelMoney(
                user_id,
                partner_id,
                policy_id,
                phone_number,
                policy_deduction_amount,
                membership_id,
                "KE",
                "KES"
              );

              if (paymentStatus.code === 200) {
                menu.end(
                  `Congratulations, you are now covered.\n` +
                  `To stay covered KES ${policy_deduction_amount} will be deducted on day ${policy_deduction_day} of every month`
                );
              } else {
                menu.end(
                  `Sorry, your payment was not successful.\n` +
                  "\n0.Back\n00.Main Menu"
                );
              }
            } else {
              menu.end("You do not have an active policy.");
            }
          } catch (error) {
            console.error("confirmation Error:", error);
            menu.end("An error occurred. Please try again later.");
          }
        },
      });

      // ================ BUY FOR OTHERS =================

      //ask for phone number and name of person to buy for
      menu.state("buyForOthers", {
        run: async () => {
          menu.con("Enter full name of person to buy for");
        },
        next: {
          "*[a-zA-Z]+": "buyForOthersOptionsPhoneNumber",
        },
      });

      menu.state("buyForOthersOptionsPhoneNumber", {
        run: async () => {

          const user = await getUser(args.phoneNumber);

          let updateBeneficiary = await Beneficiary.create({
            beneficiary_id: uuidv4(),
            user_id: user.user_id,
            relationship: "other",
            full_name: menu.val,
            first_name: menu.val.split(" ")[0],
            last_name: menu.val.split(" ")[1],
          });


          menu.con("Enter phone number of person to buy for");
        },
        next: {
          "*[0-9]": "buyForOthersOptions",
        },
      });

      menu.state("buyForOthersOptions", {
        run: async () => {
          const phoneNumber = menu.val;


          // save beneficiary phone number to user
          const user = await getUser(args.phoneNumber);

          let updateBeneficiary = await Beneficiary.update(
            {
              phone_number: phoneNumber,
            },
            {
              where: {
                user_id: user.user_id,
                relationship: "other",
              },
            }
          );

          console.log("updateBeneficiary", updateBeneficiary);



          try {
            const user = await User.findOne({
              where: {
                phone_number: args.phoneNumber,
              },
            });



            menu.con(
              "Buy for others" +
              "\n1. Bronze – KES 300" +
              "\n2. Silver – KES 650" +
              "\n3. Gold – KES 14,000" +
              "\n0. Back" +
              "\n00. Main Menu"
            );

          } catch (error) {
            console.error("Error:", error);
            menu.con("An error occurred. Please try again.");
          }
        },
        next: {
          "1": "buyForSelf.bronze",
          "2": "buyForSelf.silver",
          "3": "buyForSelf.gold",
          "0": "account",
          "00": "account",
        },
      });

      //================MY ACCOUNT===================

      menu.state("myAccount", {
        run: async () => {
          menu.con(
            "My Account " +
            "\n1. Pay Now" +
            "\n2. Manage auto-renew" +
            "\n3. My insurance policy" +
            "\n4. Update profile" +
            "\n5. Cancel policy" +
            "\n6. My Hospital" +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
        next: {
          "1": "payNow",
          "2": "manageAutoRenew",
          "3": "myInsurancePolicy",
          "4": "updateProfile",
          "5": "cancelPolicy",
          "6": "myHospital",
          "0": "account",
          "00": "account",
        },
      });

      //update profile ( user dob and gender)
      menu.state("updateProfile", {
        run: async () => {
          menu.con(`Whats your gender
          1.  Male
          2. Female
          0. Back
          00. Main Menu
           `);
        },
        next: {
          "1": "updateGender",
          "2": "updateGender",
          "0": "myAccount",
          "00": "account",
        },
      });

      menu.state("updateGender", {
        run: async () => {
          const gender = menu.val == "1" ? "M" : "F";
          const user = await User.update(
            {
              gender: gender,
            },
            {
              where: {
                phone_number: args.phoneNumber,
              },
            }
          );

          console.log("USER: ", user);

          menu.con(`Enter your date of birth in the format DDMMYYYY
          0. Back
          00. Main Menu
           `);
        },
        next: {
          "*[0-9]": "updateDob",
          "0": "myAccount",
          "00": "account",
        },
      });

      menu.state("updateDob", {
        run: async () => {
          let dob = menu.val;
          console.log("dob", dob);

          // remove all whitespace and non-numeric characters
          dob = dob.replace(/\D/g, "");
          console.log("dob", dob);
          // convert ddmmyyyy to valid date
          let day = dob.substring(0, 2);
          let month = dob.substring(2, 4);
          let year = dob.substring(4, 8);
          let date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
          console.log("date", date);

          const user = await User.update(
            {
              dob: date,
            },
            {
              where: {
                phone_number: args.phoneNumber,
              },
            }
          );

          console.log("USER DOB UPDATE: ", user);

          menu.con(`Your profile has been updated successfully
          1. Buy cover
          00. Main Menu
           `);
        },
        next: {
          "1": "account",
          "00": "account",
        },
      });

      //==================PAY NOW===================

      menu.state("payNow", {
        run: async () => {
          const benefitsByPolicyType = {
            bronze: "KES 100,000",
            silver: "KES 100,000",
            gold: "KES 100,000",
          };

          try {
            const user = await User.findOne({
              where: {
                phone_number: args.phoneNumber,
              },
            });

            const policies = await Policy.findAll({
              where: {
                user_id: user?.user_id,
              },
            });

            if (policies.length === 0) {
              menu.con(
                "You have no policies\n" +
                "1. Buy cover\n" +
                "0. Back\n" +
                "00. Main Menu"
              );
              return;
            }

            let policyInfo = "";

            policies.forEach((policy: any, index: any) => {
              const benefit = benefitsByPolicyType[policy.policy_type] || "Unknown Benefit";

              policyInfo +=
                `${index + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
                `   Inpatient limit: KES ${policy.sum_insured}\n` +
                `   Remaining: KES ${policy.sum_insured}\n` +
                `   Maternity Benefit: ${benefit}\n\n`;
            });

            menu.con(`Choose policy to pay for\n${policyInfo}\n00. Main Menu`);
          } catch (error) {
            console.error("Error:", error);
            menu.con("An error occurred. Please try again later.");
          }
        },
        next: {
          "*\\d+": "choosePolicy",
          "0": "account",
          "00": "account",
        },
      });


      menu.state("choosePolicy", {
        run: async () => {
          let policy = Number(menu.val);

          let user = await User.findOne({
            where: {
              phone_number: args.phoneNumber,
            },
          });
          let policies = await Policy.findAll({
            where: {
              user_id: user?.user_id,
            },
          });

          policies = policies[policy - 1];
          console.log("POLICIES: ", policies);

          let { premium, policy_type, beneficiary } = policies;

          const payment = 200;

          if (payment == 200) {
            //Paid Kes 5,000 for Medical cover. Your next payment will be due on day # of [NEXT MONTH]
            //     menu.end(`Paid Kes ${amount} for Medical cover.
            // Your next payment will be due on day ${policy_deduction_day} of ${nextMonth}`)

            menu.end(
              `Your request for ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()}, KES ${premium} has been received and will be processed shortly.Please enter your Airtel Money PIN when asked.`
            );
          } else {
            menu.end("Payment failed. Please try again");
          }
        },
      });

      //============CANCEL POLICY=================

      menu.state("cancelPolicy", {
        run: async () => {
          const user = await User.findOne({
            where: {
              phone_number: args.phoneNumber,
            },
          });
          if (user) {
            const policy = await Policy.findOne({
              where: {
                user_id: user?.user_id,
              },
            });

            console.log("POLICY: ", policy);
            if (policy) {
              // 1. Cancel Policy
              menu.con(
                "Hospital cover of Kes 1M a year(100k per night, max 10 nights)" +
                "Life cover of Kes 4M Funeral Benefit" +
                "\n1. Cancel Policy"
              );
            } else {
              menu.con("Your policy is INACTIVE\n0 Buy cover");
            }
          } else {
            menu.end("User not found");
          }
        },
        next: {
          "0": "account",
          "1": "cancelPolicyPin",
        },
      });

      //cancel policy pin

      menu.state("cancelPolicyPin", {
        run: async () => {
          const user = await User.findOne({
            where: {
              phone_number: args.phoneNumber,
            },
          });
          const policy = await Policy.findOne({
            where: {
              user_id: user?.user_id,
            },
          });
          let today = new Date();

          console.log("POLICY: ", policy);
          menu.con(`By cancelling, you will no longer be covered for ${policy.policy_type.toUpperCase()} Insurance as of ${today}.
            E'\nEnter PIN or Membership ID to Confirm cancellation
            0.Back
            00.Main Menu`);
        },
        next: {
          "*[0-9]": "cancelPolicyConfirm",
        },
      });

      //cancel policy confirm
      menu.state("cancelPolicyConfirm", {
        run: async () => {
          //const to = '256' + args.phoneNumber.substring(1);
          const message =
            " You CANCELLED your Medical cover cover. Your Policy will expire on DD/MM/YYYY and you will not be covered. Dial *187*7*1# to reactivate.";

          //const sms = await sendSMS(to, message);
          let today = new Date();

          //update policy status to cancelled
          const user = await User.findOne({
            where: {
              phone_number: args.phoneNumber,
            },
          });
          let policy: any;
          if (user) {
            policy = await Policy.findOne({
              where: {
                user_id: user?.user_id,
              },
            });
          }

          console.log("POLICY: ", policy);
          if (policy) {
            // 1. Cancel Policy
            policy.policy_status = "cancelled";
            policy.policy_end_date = today;
            await policy.save();
          }

          menu.con(`Your policy will expire on ${today}  and will not be renewed. Dial *185*7*6# to reactivate.
            0.Back     00.Main Menu`);
        },
        next: {
          "0": "myAccount",
          "00": "account",
        },
      });

      // ============== MY INSURANCE POLICY ==========================
      menu.state("myInsurancePolicy", {
        run: async () => {
          const bronzeLastExpenseBenefit = "KES 1,000,000";
          const silverLastExpenseBenefit = "KES 1,500,000";
          const goldLastExpenseBenefit = "KES 2,000,000";

          const user = await User.findOne({
            where: {
              phone_number: args.phoneNumber,
            },
          });

          console.log("USER: ", user);

          if (!user) {
            menu.con("User not found");
            return;
          }

          let policies = await Policy.findAll({
            where: {
              user_id: user?.user_id,
            },
          });

          console.log("POLICIES: ", policies);

          if (policies.length === 0) {
            menu.con(
              "You have no policies\n" +
              "1. Buy cover\n" +
              "0. Back\n" +
              "00. Main Menu"
            );
            return;
          }

          let policyInfo = "";

          for (let i = 0; i < policies.length; i++) {
            let policy = policies[i];
            let benefit;

            if (policy.policy_type == "bronze") {
              benefit = bronzeLastExpenseBenefit;
            } else if (policy.policy_type == "silver") {
              benefit = silverLastExpenseBenefit;
            } else if (policy.policy_type == "gold") {
              benefit = goldLastExpenseBenefit;
            }

            policyInfo +=
              `${i + 1
              }. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date
              }\n` +
              `   Inpatient limit: KES ${policy.sum_insured}\n` +
              `   Remaining: KES ${policy.sum_insured}\n` +
              `   Last Expense Per Person Benefit: ${benefit}\n\n`;
          }

          menu.end(`My Insurance Policies:\n\n${policyInfo}`);
        },
        next: {
          "1": "account",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("manageAutoRenew", {
        run: async () => {
          menu.con(
            "Manage auto-renew " +
            "\n1. Activate auto-renew" +
            "\n2. Deactivate auto-renew" +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
      });

      //=============== CLAIMS ===================

      menu.state("makeClaim", {
        run: async () => {
          const bronzeLastExpenseBenefit = "KES 1,000,000";
          const silverLastExpenseBenefit = "KES 1,500,000";
          const goldLastExpenseBenefit = "KES 2,000,000";
          let user = await User.findOne({
            where: {
              phone_number: args.phoneNumber,
            },
          });

          let policies = await Policy.findAll({
            where: {
              user_id: user?.user_id,
            },
          });

          console.log("POLICIES: ", policies);

          if (policies.length === 0) {
            menu.con(
              "You have no policies\n" +
              "1. Buy cover\n" +
              "0. Back\n" +
              "00. Main Menu"
            );
            return;
          }

          let policyInfo = "";

          for (let i = 0; i < policies.length; i++) {
            let policy = policies[i];
            let benefit: any;

            if (policy.policy_type == "bronze") {
              benefit = bronzeLastExpenseBenefit;
            } else if (policy.policy_type == "silver") {
              benefit = silverLastExpenseBenefit;
            } else if (policy.policy_type == "gold") {
              benefit = goldLastExpenseBenefit;
            }

            policyInfo +=
              `${i + 1
              }. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date
              }\n` +
              `   Inpatient limit: KES ${policy.sum_insured}\n` +
              `   Remaining: KES ${policy.sum_insured}\n` +
              `   Last Expense Per Person Benefit: ${benefit}\n\n`;
          }

          // menu.end(`My Insurance Policies:\n\n${policyInfo}`);
          menu.con(`Choose policy to make a claim for
        ${policyInfo}
       
        00.Main Menu`);
        },
        next: {
          "*\\d+": "choosePolicyTomakeClaim",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("choosePolicyTomakeClaim", {
        run: async () => {
          let policy = Number(menu.val);

          let user = await User.findOne({
            where: {
              phone_number: args.phoneNumber,
            },
          });
          let policies = await Policy.findAll({
            where: {
              user_id: user?.user_id,
            },
          });

          policies = policies[policy - 1];
          console.log("POLICIES: ", policies);

          let {
            user_id,
            policy_id,
            premium,
            policy_type,
            beneficiary,
            sum_insured,
          } = policies;

          const claim = await Claim.create({
            policy_id: policy_id,
            user_id: user.user_id,
            claim_date: new Date(),
            claim_status: "pending",
            partner_id: user.partner_id,
            claim_description: "Admission of Claim",
            claim_type: "medical claim",
            claim_amount: sum_insured,
          });

          console.log("CLAIM", claim);
          if (claim) {
            //Paid Kes 5,000 for Medical cover. Your next payment will be due on day # of [NEXT MONTH]
            //     menu.end(`Paid Kes ${amount} for Medical cover.
            // Your next payment will be due on day ${policy_deduction_day} of ${nextMonth}`)

            menu.end(
              `Admission Claim - CLAIM ID: ${claim.claim_id
              },  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} - Premium: KES ${premium}, SUM INSURED: KES ${sum_insured} \nProceed to the reception to verify your details\n0. Back\n00. Main Menu"`
            );
          } else {
            menu.end("Claim failed. Please try again");
          }
        },
      });

      //==================CHOOSE HOSPITAL===================

      // Define hospital data based on regions
      const hospitalsData = {
        nairobi: [
          {
            "REGION": "BURUBURU\/EASTLEIGH",
            "PROVIDER": "Bliss GVS Healthcare - Buruburu",
            "LOCATION": "ACK Saint James Church, Buru Buru ",
            "CONTACTS": "0712 768806",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "City Point Group of Hospitals",
            "LOCATION": "Eastleigh",
            "CONTACTS": "0755 818868",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Ngara Comprehensive Health services Ltd",
            "LOCATION": "Ngara, Off Park Rd, Mogira Rd",
            "CONTACTS": "0722 528022",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Mother & Child Hospital",
            "LOCATION": "First Avenue, Eastleigh",
            "CONTACTS": "0722 570363",
            "SPECIALITY": "IP, OP"
          },
          {
            "REGION": "CBD",
            "PROVIDER": "Bliss GVS Healthcare - Haile Selassie",
            "LOCATION": "Along Haile Selasie Road, next to Barclays Bank, Behind Nakumatt Haile Sellasie ",
            "CONTACTS": "0712 849650",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Bliss GVS Healthcare - College House",
            "LOCATION": "College House, Koinange Street ",
            "CONTACTS": "0722 994768",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Penda Medical Centre Kimathi Street (CBD)",
            "LOCATION": "Ground Floor, Old Mutual Building, Kimathi Street, Opposite The Stanley Hotel",
            "CONTACTS": "0772 905756 or 0722 674189",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Bliss GVS Healthcare - Moi Avenue",
            "LOCATION": "Stanbank House Along Moi Avenue ",
            "CONTACTS": "0765 000050",
            "SPECIALITY": "OP"
          },
          // Add more hospitals for Nairobi region
        ],
        eastern: [
          {
            "REGION": "EMBU",
            "PROVIDER": "Bliss GVS Healthcare - Embu",
            "LOCATION": "Tujenge Plaza, Embu Town",
            "CONTACTS": 780100074,
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Embu Childrens Hospital (Tenri) Town clinic",
            "LOCATION": "Embu Kiritiri\/Kiambere Rd",
            "CONTACTS": "0722-891560",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Embu Children Clinic, Tenri. Majimbo",
            "LOCATION": "Majimbo near cerals board. Off Embu-Kiritiri road",
            "CONTACTS": "0723 386706",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Imara Hospital",
            "LOCATION": "Rwika Stage, Embu",
            "CONTACTS": "0790 726339",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Imara Medi Plus Centre",
            "LOCATION": "Njue Plaza, 2nd Flr, Kenyatta Avenue. Embu Town",
            "CONTACTS": "0722 353250 or 0780 353250",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "County Medical Centre Embu Ltd",
            "LOCATION": "Majengo, along Nairobi Embu Highway",
            "CONTACTS": "0712 275242 or 0705 351441",
            "SPECIALITY": "IP, OP"
          },
          {
            "REGION": "ISIOLO",
            "PROVIDER": "St. John Paul II Avi Matercare Hospital",
            "LOCATION": "Airport Road, Opp. Isiolo International Airport, Isiolo",
            "CONTACTS": "0708 296492",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Isiolo Medical Centre",
            "LOCATION": "Behind Bomen Hotel, Opp post office, Isiolo",
            "CONTACTS": "0729 536775 or 0722 678401",
            "SPECIALITY": "OP"
          },
          // Add more hospitals for Eastern region
        ],
        central: [
          {
            "REGION": "KIAMBU\/GITHUNGURI",
            "PROVIDER": "AIC Kijabe Hospital",
            "LOCATION": "Kijabe Road, Kijabe, Nairobi - Nakuru Highway",
            "CONTACTS": "020-3246500 or 0712 504056 or 0789 721756 or 0787 145122",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Bliss GVS Healthcare - Kiambu",
            "LOCATION": "Ground Floor Telkom Building, Opp Kiambu Level 4 Hospital",
            "CONTACTS": 780328415,
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Kiambu Medical Centre",
            "LOCATION": "Kiambu Town, Biashara Street, Opp. Kiambu District Hospital",
            "CONTACTS": "020-2019515 or 0722-311890   ",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Ivory Health Solutions",
            "LOCATION": "Githunguri town centre",
            "CONTACTS": "0796 769819",
            "SPECIALITY": "IP, OP"
          },
          {
            "REGION": "THIKA",
            "PROVIDER": "Bliss GVS Healthcare - Thika",
            "LOCATION": "KRA Building, Thika Town",
            "CONTACTS": 780100925,
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Thika Nursing Homes Ltd",
            "LOCATION": "Next to Section 9 Estate, Thika",
            "CONTACTS": "0728 929256",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Mary Help of the Sick",
            "LOCATION": "Thika",
            "CONTACTS": "TBA",
            "SPECIALITY": "IP, OP"
          },
        ],

        centralrift: [
          {
            "REGION": "NAKURU",
            "PROVIDER": "Optimum Current Health Care Limited",
            "LOCATION": "Tamoh Plaza, 1st Flr, Kijabe Row & Section 58 Kinuthia Mbugua Road, Nakuru",
            "CONTACTS": "0724 265848 or 0726 245848",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "The Nakuru Specialist Hospital",
            "LOCATION": "Lanet area, nextto DOD, along Nakuru-Nairobi Highway",
            "CONTACTS": "0700 907000",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "FHOK - Family Care Medical Centre Nakuru",
            "LOCATION": "Junction of Oginga\/Market rd",
            "CONTACTS": "0717 590806",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Medicross - Nakuru MC",
            "LOCATION": "George Morara Road, next to CMC Motors",
            "CONTACTS": "0717 118737",
            "SPECIALITY": "OP"
          },
          {
            "REGION": "NAIVASHA\/GILGIL",
            "PROVIDER": "Bliss GVS Healthcare - Naivasha",
            "LOCATION": "Maryland Building, Mbariakanui Road, next to Kenya Power Office",
            "CONTACTS": 780100036,
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Flamingo Medical Centre- Naivasha",
            "LOCATION": "Moi South Lake Road, Kingfisher Farm, Naivasha",
            "CONTACTS": "0722 204831",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Ndonyo Healthcare - Naivasha",
            "LOCATION": "0719 342059 or 0777 394203",
            "CONTACTS": "0719 342059 or 0777 394203",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "St Marys Hospital, Gilgil",
            "LOCATION": "Gilgil",
            "CONTACTS": "TBA",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Mt. Longonot Medical Services Ltd",
            "LOCATION": "0708-372858 or 050-2021196",
            "CONTACTS": "Kenyatta Avenue, opposite Milimani Primary School, Naivasha",
            "SPECIALITY": "IP, OP"
          },
          // Add more hospitals for Embakasi region
        ],
        northrift: [
          {
            "REGION": "MARSABIT",
            "PROVIDER": "Beehive Medical Services (Dr. Wolde Jama)",
            "LOCATION": "Beehive Building, Shauri Yako Road, Marsabit",
            "CONTACTS": "0718 277212 or 0721 107107",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "ISMC Services Hospital",
            "LOCATION": "Marsabit, the Road opposite the District Hospital",
            "CONTACTS": "020 2631525 or 0718 135110",
            "SPECIALITY": "IP, OP"
          },
          {
            "REGION": "MANDERA",
            "PROVIDER": "Mandera West Nursing Home",
            "LOCATION": "Off Isiolo-Mandera Road, Mandera West",
            "CONTACTS": "0720 756788",
            "SPECIALITY": "IP, OP"
          },
          {
            "REGION": "NORTH RIFT"
          },
          {
            "PROVIDER": "Meswo Medical Services",
            "LOCATION": "Nandi Hills ",
            "CONTACTS": "TBA",
            "SPECIALITY": "IP, OP"
          },
          {
            "REGION": "NANDI",
            "PROVIDER": "Bliss GVS Healthcare - Kapsabet",
            "LOCATION": "Safari Hotel Building, Kapsabet Town",
            "CONTACTS": 780100912,
            "SPECIALITY": "OP"
          },
          {
            "REGION": "ELGEYO MARAKWET",
            "PROVIDER": "AIC Kapsowar Mission Hospital",
            "LOCATION": "Elgeyo Marakwet",
            "CONTACTS": "0788 149983",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Bliss GVS Healthcare - Iten",
            "LOCATION": "Mango House Iten Next to Equity Bank",
            "CONTACTS": 780622637,
            "SPECIALITY": "OP"
          },
          {
            "REGION": "TRANS NZOIA\/BUSIA",
            "PROVIDER": "Crystal Cottage Hospital and Medical Clinic Ltd",
            "LOCATION": "Kitale",
            "CONTACTS": "0779 727050 or 0777 761460",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Bliss GVS Healthcare - Kitale",
            "LOCATION": "Mega City Mall - Kitale Town",
            "CONTACTS": 780622129,
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "PESI Medical Centre",
            "LOCATION": "Kisumu - Busia Road, opposite Baptist Church, Busia Town",
            "CONTACTS": "0729 610404 or 0721 244511",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Bacasavi (Counselling & Wellness Services) Hospital",
            "LOCATION": "Kitale",
            "CONTACTS": "TBA",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Bliss GVS Healthcare - Busia",
            "LOCATION": "Opposite, Busia Police Station main highway and Behind Family Bank, Busia",
            "CONTACTS": 780622634,
            "SPECIALITY": "OP"
          },
          {
            "REGION": "LODWAR\/KAKUMA",
            "PROVIDER": "Lodwar County Referral Hospital",
            "LOCATION": "Lodwar",
            "CONTACTS": "0758 722023",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Lodwar Hills Hospital",
            "LOCATION": "Nawoitorong Road Near Office of the Governo, Lodwar, 3Km from town",
            "CONTACTS": "0798 933332 or 0779333325",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Loima Medical Clinic ",
            "LOCATION": "Njiwa Traders Building, Salama Road, Lodwar Township",
            "CONTACTS": "020 8023266 or 0721 916255 ",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Bliss GVS Healthcare - Kakuma",
            "LOCATION": "Opposite KCB bank,kakuma",
            "CONTACTS": 780100157,
            "SPECIALITY": "OP"
          },
        ],
        southrift: [
          {
            "REGION": "KERICHO",
            "PROVIDER": "Siloam Hospital - Kipkelion Branch",
            "LOCATION": "Kipkelion Town, Directly opp Agricultural Finance Corporation Office - Next to Kipkelion Police Station.",
            "CONTACTS": "0757 700750 or 0729 692010",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Siloam Hospital - Main",
            "LOCATION": "Next to District Hospital, Kericho",
            "CONTACTS": "0728 881121 or 0729-692010",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Greenview Nursing Home",
            "LOCATION": "Kericho, along James Finlay inlet Road, close to Kericho Tea Boys",
            "CONTACTS": "0745 315600 or 0777 315600",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Southrift Hospital Limited",
            "LOCATION": "Kericho Sotik road",
            "CONTACTS": "0780 888880 or 0110 142711",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "St. Leonard’s Hospital Ltd",
            "LOCATION": "Nyagacho Estate, Kipchimchim - Matabo Road, Kericho",
            "CONTACTS": "0722 770667",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Bliss GVS Healthcare - Kericho",
            "LOCATION": "Greenspan Square Mall on Nakuru-Bomet Road",
            "CONTACTS": 780100929,
            "SPECIALITY": "OP"
          },
          {
            "REGION": "NAROK",
            "PROVIDER": "Medicatia Hospital",
            "LOCATION": "Narok- Njoro Road Narok",
            "CONTACTS": "0746 869867",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Narok Cottage Hospital",
            "LOCATION": "Narok Town, the road opposite Narok Post Office",
            "CONTACTS": "0739-368605",
            "SPECIALITY": "IP, OP"
          },
        ],

        coast: [
          {
            "REGION": "MOMBASA  ",
            "PROVIDER": "Tudor Health Care - Bamburi",
            "LOCATION": "Next to Fisheries, bamburi",
            "CONTACTS": "0731 532104",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Tudor Health Care - Magongo",
            "LOCATION": "Next to Hakika Estate ",
            "CONTACTS": "0739 097493",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Tudor Health Care - Main",
            "LOCATION": "Ishara Avenue, Tudor next to KAG Church",
            "CONTACTS": "0735 436727 or 0723 272683",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Tudor Health Care - Mikindani",
            "LOCATION": "Behind White Castle Hotel",
            "CONTACTS": "0735 769596",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Tudor Health Care - Kengeleni",
            "LOCATION": "Kengeleni Complex",
            "CONTACTS": "0738 826917",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Tudor Health Care - Likoni",
            "LOCATION": "Rafiki Bank Building",
            "CONTACTS": "0739 363820",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "City Health Hospital -Mombasa",
            "LOCATION": "Nkurumah Road, Mombasa",
            "CONTACTS": "0741 095581",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Mikindani Hospital",
            "LOCATION": "Mikindani, Jomvu",
            "CONTACTS": "0759 777777",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Ganjoni Hospital - Mombasa",
            "LOCATION": "Liwatoni Rd, Off Bishop Makarios Rd, Ganjoni",
            "CONTACTS": "0797 088865",
            "SPECIALITY": "IP, OP"
          },
        ],
        nyanza: [
          {
            "REGION": "HOMABAY",
            "PROVIDER": "Bliss GVS Healthcare - Homabay",
            "LOCATION": "Next to Mwalimu National Sacco, Rongo- Homa Bay Road (Main highway), Homa Bay Town",
            "CONTACTS": 786412303,
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Tudor Healthcare - Mbita",
            "LOCATION": "Mbita, near ICIPE",
            "CONTACTS": "0723 272683",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Tudor Healthcare - Sindo",
            "LOCATION": "Sindo Business Centre",
            "CONTACTS": "0723 272683",
            "SPECIALITY": "IP, OP"
          },
          {
            "REGION": "KISUMU",
            "PROVIDER": "Bliss GVS Healthcare - Kisumu (Al Imran)",
            "LOCATION": "Almiran Plaza",
            "CONTACTS": 786412426,
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Bliss GVS Healthcare - Kisumu (Mega)",
            "LOCATION": "Nakumatt Mega Mall",
            "CONTACTS": 780622615,
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Maxcure Hospitals Limited",
            "LOCATION": "Mega City Mall, Nairobi highway ,Kisumu",
            "CONTACTS": "0114 333 333 ",
            "SPECIALITY": "IP,OP"
          },
          {
            "PROVIDER": "St Jairus Hospital -Kisumu",
            "LOCATION": "Kisumu",
            "CONTACTS": "0716 258129",
            "SPECIALITY": "IP, OP"
          },
          {
            "PROVIDER": "Port Florence Community Hospital - Main",
            "LOCATION": "Kisumu - Busia Road, Otonglo",
            "CONTACTS": "0720 091232",
            "SPECIALITY": "IP,OP"
          },
          {
            "PROVIDER": "Port Florence Community Hospital - ACK",
            "LOCATION": "CBD, behind Central Police, Kisumu",
            "CONTACTS": "721 091232",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Port Florence Community Hospital - Mega",
            "LOCATION": "Mega Plaza, Kisumu",
            "CONTACTS": "722 091232",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Africa Inuka Hospital Ltd - Kisumu",
            "LOCATION": "Mahavir Mall, along Odera street, Kisumu",
            "CONTACTS": "0716 173299",
            "SPECIALITY": "OP"
          },
          {
            "PROVIDER": "Africa Inuka Hospital Ltd - Milimani",
            "LOCATION": "Amrit Nivas Building,Milimani along Awuor - Oieno Road",
            "CONTACTS": "0768 784498",
            "SPECIALITY": "IP,OP"
          },
        ]



      };



      menu.state("chooseHospital", {
        run: () => {
          menu.con(`Welcome to My USSD Hospital Finder!
          Please select your region:
          1. Nairobi
          2. Eastern
          3. Central
          4. Central Rift
          5. North Rift
          6. South Rift
          7. Coast
          8. Nyanza`
          );
        },
        next: {
          "*\\d+": "selectRegion",
        },
      });

      // Define the state to select a region
      menu.state('selectRegion', {
        run: () => {
          const selectedRegion = menu.val;

          let region = {
            "1": "nairobi",
            "2": "eastern",
            "3": "central",
            "4": "centralrift",
            "5": "northrift",
            "6": "southrift",
            "7": "coast",
            "8": "nyanza",
          }
          let theRegion = region[selectedRegion];
          const hospitalsInRegion = hospitalsData[theRegion];
          console.log('hospitalsInRegion', hospitalsInRegion);
          if (hospitalsInRegion) {
            menu.con(`Please search for hospital e.g. Nairobi Hospital`);
          } else {
            menu.end(`Invalid region selected.`);
          }
        },
        next: {
          '*': 'selectHospital'
        }
      });

      // Define the state to select a hospital
      menu.state('selectHospital', {
        run: async () => {
          const selectedHospital = menu.val;
          console.log('selectedHospital', selectedHospital);
          console.log(menu.args.text)
          //get the secondlast input
          const secondLastInput = menu.args.text.split('*')[menu.args.text.split('*').length - 2];
          console.log('secondLastInput', secondLastInput);
          //get the region
          const region = {
            "1": "nairobi",
            "2": "eastern",
            "3": "central",
            "4": "centralrift",
            "5": "northrift",
            "6": "southrift",
            "7": "coast",
            "8": "nyanza",
          }

          let theRegion = region[secondLastInput];
          console.log('theRegion', theRegion);
          const hospitalsInRegion = hospitalsData[theRegion];
          console.log('hospitalsInRegion', hospitalsInRegion);
          const selectedHospitalDetails = hospitalsInRegion.filter(hospital => hospital.PROVIDER.toLowerCase().includes(selectedHospital.toLowerCase()));

          const newUserHospital = await db.user_hospitals.create({
            user_hospital_id: uuidv4(),
            user_id: user?.user_id,
            hospital_name: selectedHospitalDetails[0].PROVIDER,
            hospital_address: selectedHospitalDetails[0].LOCATION,
            // hospital_contact_person: contactPerson,
            hospital_phone_number: selectedHospitalDetails[0].CONTACTS,
            hospital_contact_person_phone_number: selectedHospitalDetails[0].CONTACTS
          });
          console.log(newUserHospital)

          if (selectedHospitalDetails.length > 0) {
            menu.con(`Hospital Information:\nProvider: ${selectedHospitalDetails[0].PROVIDER}\nLocation: ${selectedHospitalDetails[0].LOCATION}\nContacts: ${selectedHospitalDetails[0].CONTACTS}\nSpeciality: ${selectedHospitalDetails[0].SPECIALITY}`);
            menu.end(`Press 0 to go back to the main menu.`);
          } else {
            menu.end(`No hospital found with the given name. Please try a different name.`);
          }
        }
      });




      // ================== HOSPITAL DETAILS ===================


      menu.state("hospitalDetails", {
        run: async () => {
          //ask if they want to change hospital or see details
          menu.con(`1. See Details
          2. Change Hospital

          0. Back
          00. Main Menu`);
        },
        next: {
          "1": "myHospital",
          "2": "chooseHospital",
          "0": "account",
          "00": "account",
        },
      });

      menu.state("myHospital", {
        run: async () => {
          let user = await User.findOne({
            where: {
              phone_number: args.phoneNumber,
            },
          });

          const hospitalDetails = await db.user_hospitals.findOne({
            where: {
              user_id: user?.user_id,
            },
          });
          console.log("hospitalDetails", hospitalDetails);
          menu.end(
            `Hospital: ${hospitalDetails.hospital_name}\nAddress: ${hospitalDetails.hospital_address}\nContact: ${hospitalDetails.hospital_contact}`
          );
        },
      });

      //=================BUY FOR FAMILY=================


      // menu.state("buyForFamily", {
      //   run: () => {
      //     menu.con(
      //       "Buy for family " +
      //       "\n1. Self + Spouse – KES 1,040" +
      //       "\n2. Self + Spouse + 1 Child - KES 1,300" +
      //       "\n3. Self + Spouse + 2 children – KES 1,456" +
      //       "\n4. Self + Spouse + 3 children – KES 1,612" +
      //       "\n5. Self + Spouse + 4 children – KES 1,768" +
      //       "\n6. Self + Spouse + 5 children – KES 1,924" +
      //       "\n0.Back" +
      //       "\n00.Main Menu"
      //     );
      //   },
      //   next: {
      //     "1": "buyForFamily.selfSpouse",
      //     "2": "buyForFamily.selfSpouse1Child",
      //     "3": "buyForFamily.selfSpouse2Children",
      //     "4": "buyForFamily.selfSpouse3Children",
      //     "5": "buyForFamily.selfSpouse4Children",
      //     "6": "buyForFamily.selfSpouse5Children",
      //     "0": "account",
      //     "00": "account",
      //   },
      // });

      // First Screen
      menu.state("buyForFamily", {
        run: () => {
          menu.con(
            "Buy for family " +
            "\n1. Self + Spouse – KES 1,040" +
            "\n2. Self + Spouse + 1 Child - KES 1,300" +
            "\n3. Self + Spouse + 2 children – KES 1,456" +
            "\n0. More" +
            "\n00.Main Menu"
          );
        },
        next: {
          "1": "buyForFamily.selfSpouse",
          "2": "buyForFamily.selfSpouse1Child",
          "3": "buyForFamily.selfSpouse2Children",
          "0": "buyForFamilyScreen2", // Go to the next screen for additional options
          "00": "account",
        },
      });

      // Second Screen (Add more options after the third option)
      menu.state("buyForFamilyScreen2", {
        run: () => {
          menu.con(
            "Buy for family " +
            "\n1. Self + Spouse + 3 children – KES 1,612" +
            "\n2. Self + Spouse + 4 children – KES 1,768" +
            "\n3. Self + Spouse + 5 children – KES 1,924" +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
        next: {
          "4": "buyForFamily.selfSpouse3Children",
          "5": "buyForFamily.selfSpouse4Children",
          "6": "buyForFamily.selfSpouse5Children",
          "0": "buyForFamily",
          "00": "account",
        },
      });



      //=============BUY FOR FAMILY SELF SPOUSE================

      menu.state("buyForFamily.selfSpouse", {
        run: () => {
          //save policy details to db

          menu.con("\nEnter Spouse name" + "\n0.Back" + "\n00.Main Menu");
        },
        next: {
          "*[a-zA-Z]+": "buyForFamily.selfSpouse.spouse",
          "0": "buyForFamily",
          "00": "account",
        },
      });

      //buyForFamily.selfSpouse.spouse
      menu.state("buyForFamily.selfSpouse.spouse", {
        run: async () => {
          let spouse = menu.val;
          const { user_id, partner_id } = await getUser(args.phoneNumber);
          let date = new Date();
          let nextDeduction = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            1
          );

          const policy = {
            policy_id: uuidv4(),
            policy_type: "bronze",
            beneficiary: "selfSpouse",
            policy_status: "pending",
            policy_start_date: new Date(),
            policy_end_date: new Date(
              date.getFullYear() + 1,
              date.getMonth(),
              date.getDate()
            ),
            policy_deduction_amount: 1040,
            policy_deduction_day: date.getDate(),
            policy_next_deduction_date: nextDeduction,
            policy_pending_preminum: 1040,
            premium: 1040,
            installment_order: 1,
            installment_type: 1,
            installment_date: nextDeduction,
            installment_alert_date: nextDeduction,
            tax_rate_vat: "0.2",
            tax_rate_ext: "0.25",
            sum_insured: "300000",
            excess_premium: "0",
            discount_premium: "0",
            partner_id: partner_id,
            user_id: user_id,
            country_code: "KEN",
            currency_code: "KES",
            product_id: 'e18424e6-5316-4f12-9826-302c866b380d',
          };

          let newPolicy = await Policy.create(policy).catch((err) =>
            console.log(err)
          );
          console.log("NEW POLICY FAMILY SELFSPOUSE", newPolicy);

          let beneficiary = {
            beneficiary_id: uuidv4(),
            full_name: spouse,
            relationship: "spouse",
            user_id: user_id,
          };

          let newBeneficiary = await Beneficiary.create(beneficiary);
          console.log("new beneficiary 1", newBeneficiary);
          menu.con(
            "\nEnter day of the month you want to deduct premium" +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
        next: {
          "*[0-9]+": "buyForFamily.selfSpouse.confirm",
          "0": "buyForFamily",
          "00": "account",
        },
      });


      //buyForFamily.selfSpouse.confirm
      menu.state("buyForFamily.selfSpouse.confirm", {
        run: async () => {
          const day: any = Number(menu.val);
          const date = new Date();
          const nextDeduction = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            day
          );
          const { user_id, partner_id } = await getUser(args.phoneNumber);
          let policy = await Policy.findOne({
            where: {
              user_id: user_id,
              partner_id: partner_id,
            },
          });
          console.log("==== FAMILY selfSpouse ======", policy);

          if (policy) {
            policy.policy_deduction_day = day;
            policy.policy_next_deduction_date = nextDeduction;
            policy.save();
          }

          menu.con(
            "Confirm \n" +
            ` Deduct KES 1,040 on day ${day} of each month. Next deduction will be on ${nextDeduction} \n` +
            "\n1.Confirm \n" +
            "\n0.Back " +
            " 00.Main Menu"
          );
        },
        next: {
          "1": "confirmation",
          "0": "buyForFamily",
          "00": "account",
        },
      });

      //=============BUY FOR FAMILY SELF SPOUSE 1 CHILD================
      menu.state("buyForFamily.selfSpouse1Child", {
        run: () => {
          menu.con("\nEnter Spouse name" + "\n0.Back" + "\n00.Main Menu");
        },
        next: {
          "*[a-zA-Z]+": "buyForFamily.selfSpouse1Child.spouse",
          "0": "buyForFamily",
          "00": "account",
        },
      });

      //buy for family selfSpouse1Child spouse
      menu.state("buyForFamily.selfSpouse1Child.spouse", {
        run: async () => {
          let spouse = menu.val;
          console.log("SPOUSE NAME 1", spouse);
          const { user_id, partner_id } = await getUser(args.phoneNumber);
          let date = new Date();
          let nextDeduction = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            1
          );


          const policy = {
            policy_id: uuidv4(),
            policy_type: "bronze",
            beneficiary: "selfSpouse1Child",
            policy_status: "pending",
            policy_start_date: new Date(),
            policy_end_date: new Date(
              date.getFullYear() + 1,
              date.getMonth(),
              date.getDate()
            ),
            policy_deduction_amount: 1300,
            policy_deduction_day: 1,
            policy_next_deduction_date: nextDeduction,
            policy_pending_preminum: 1300,
            premium: 1300,
            installment_order: 1,
            installment_type: 1,
            installment_date: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              new Date().getDate()
            ),
            installment_alert_date: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              new Date().getDate()
            ),
            tax_rate_vat: "0.2",
            tax_rate_ext: "0.25",
            sum_insured: "300000",
            excess_premium: "0",
            discount_premium: "0",
            partner_id: partner_id,
            user_id: user_id,
            country_code: "KEN",
            currency_code: "KES",
            product_id: 'e18424e6-5316-4f12-9826-302c866b380d',
          };

          let newPolicy = await Policy.create(policy).catch((err) =>
            console.log(err)
          );
          console.log("NEW POLICY FAMILY SELFSPOUSE1CHILD", newPolicy);

          let beneficiary = {
            beneficiary_id: uuidv4(),
            full_name: spouse,
            relationship: "spouse",
            user_id: user_id,
          };

          let newBeneficiary = await Beneficiary.create(beneficiary);
          console.log("new beneficiary 1", newBeneficiary);
          menu.con(
            "\nEnter day of the month you want to deduct premium" +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
        next: {
          "*[0-9]+": "buyForFamily.selfSpouse1Child.confirm",
          "0": "buyForFamily",
          "00": "account",
        },
      });



      //buy for family selfSpouse1Child confirm
      menu.state("buyForFamily.selfSpouse1Child.confirm", {
        run: async () => {
          const day: any = Number(menu.val);
          const date = new Date();
          const nextDeduction = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            day
          );
          const { user_id, partner_id } = await getUser(args.phoneNumber);
          let policy = await Policy.findOne({
            where: {
              user_id: user_id,
              partner_id: partner_id,
            },
          });
          console.log("==== FAMILY selfSpouse1Child ======", policy);


          menu.con(
            "Confirm \n" +
            ` Deduct KES 1,300, Next deduction will be on  ${nextDeduction} \n` +
            "\n1.Confirm \n" +
            "\n0.Back " +
            " 00.Main Menu"
          );
        },
        next: {
          "1": "confirmation",
          "0": "buyForFamily",
          "00": "account",
        },
      });

      //===========BUY FOR FAMILY SELF SPOUSE 2 CHILDREN==================
      menu.state("buyForFamily.selfSpouse2Children", {
        run: async () => {
          menu.con("\nEnter Spouse name" + "\n0.Back" + "\n00.Main Menu");
        },
        next: {
          "*[a-zA-Z]+": "buyForFamily.selfSpouse2Child.spouse",
          "0": "buyForFamily",
          "00": "account",
        },
      });

      //buyForFamily.selfSpouse2Children spouse
      menu.state("buyForFamily.selfSpouse2Child.spouse", {
        run: async () => {
          let spouse = menu.val;
          console.log("SPOUSE NAME 1", spouse);
          const { user_id, partner_id } = await getUser(args.phoneNumber);

          const policy = {
            policy_id: uuidv4(),
            policy_type: "bronze",
            beneficiary: "selfSpouse2Child",
            policy_status: "pending",
            policy_start_date: new Date(),
            policy_end_date: new Date(
              new Date().getFullYear() + 1,
              new Date().getMonth(),
              new Date().getDate()
            ),
            policy_deduction_amount: 1456,
            policy_pending_preminum: 1456,
            policy_deduction_day: 1,
            policy_next_deduction_date: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              new Date().getDate()
            ),
            premium: 1456,
            installment_order: 1,
            installment_type: 1,
            installment_date: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              new Date().getDate()
            ),
            installment_alert_date: new Date(
              new Date().getFullYear() + 1,
              new Date().getMonth() + 1,
              new Date().getDate()
            ),
            tax_rate_vat: "0.2",
            tax_rate_ext: "0.25",
            sum_insured: "300000",
            excess_premium: "0",
            discount_premium: "0",
            partner_id: partner_id,
            user_id: user_id,
            country_code: "KEN",
            currency_code: "KES",
            product_id: 'e18424e6-5316-4f12-9826-302c866b380d',
          };

          let newPolicy = await Policy.create(policy);
          console.log("NEW POLICY FAMILY SELFSPOUSE2CHILD", newPolicy);

          let beneficiary = {
            beneficiary_id: uuidv4(),
            full_name: spouse,
            relationship: "spouse",
            user_id: user_id,
          };

          let newBeneficiary = await Beneficiary.create(beneficiary);
          console.log("new beneficiary 1", newBeneficiary);

          menu.con(
            "\nEnter day of the month you want to deduct premium" +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
        next: {
          "*\\d+": "buyForFamily.selfSpouse2Child.confirm",
          "0": "buyForFamily",
          "00": "account",
        },
      });

      //buyForFamily.selfSpouse2Children child2
      menu.state("buyForFamily.selfSpouse2Child.confirm", {
        run: async () => {
          try {

            const day: any = Number(menu.val);
            const date = new Date();
            const nextDeduction = new Date(
              date.getFullYear(),
              date.getMonth() + 1,
              day
            );

            const { user_id, partner_id, premium } = await getUser(
              args.phoneNumber
            );

            let policy = await Policy.update(
              {
                policy_deduction_day: day,
                policy_next_deduction_date: nextDeduction,
              },
              {
                where: {
                  user_id: user_id,
                  partner_id: partner_id,
                },
              }
            );

            menu.con(`Pay KES 1,456 deducted monthly.
                    Terms&Conditions - www.airtel.com
                    '\nEnter PIN or Membership ID to Agree and Pay' +
                    0.Back
                    00.Main Menu`);
          } catch (error) {
            console.error(
              "buyForFamily.selfSpouse2Child.child2.name Error:",
              error
            );
            menu.end("An error occurred. Please try again later.");
          }
        },
        next: {
          "*\\d+": "buyForFamily.selfSpouse2Child.pin",
          "0": "buyForFamily",
          "00": "account",
        },
      });

      //buyForFamily.selfSpouse2Children pin
      menu.state("buyForFamily.selfSpouse2Child.pin", {
        run: () => {
          menu.con(`Pay KES 1,456 deducted monthly.
                            Terms&Conditions - www.airtel.com
                            '\nEnter PIN or Membership ID to Agree and Pay' +
                            n0.Back
                            00.Main Menu`);
        },
        next: {
          "*\\d+": "buyForFamilySChedule",
          "0": "buyForFamily",
          "00": "account",
        },
      });

      menu.state("buyForFamilyPin", {
        run: () => {
          console.log("buyForFamilyPin");

          menu.con(`Pay 1, deducted monthly.
                    Terms&Conditions - www.airtel.com
                    Enter PIN or Membership Number to Agree and Pay
                    n0.Back
                    00.Main Menu`);
        },
        next: {
          "*\\d+": "confirmation",
          "0": "buyForFamily",
          "00": "account",
        },
      });

      menu.state("buyForFamilySchedule", {
        run: async () => {
          try {
            const user_pin = Number(menu.val);
            const { user_id, pin, membership_id } = await getUser(
              args.phoneNumber
            );

            if (user_pin === pin || user_pin === membership_id) {
              const policy = await Policy.findOne({
                where: {
                  user_id: user_id,
                },
              });

              const policy_deduction_amount = policy.policy_deduction_amount;

              menu.con(`SCHEDULE
                        Enter day of month to deduct KES ${policy_deduction_amount} premium monthly (e.g. 1, 2, 3…31)
                        0.Back
                        00.Main Menu`);
            } else {
              menu.con("PIN incorrect. Try again");
            }
          } catch (error) {
            console.error("buyForFamilySchedule Error:", error);
            menu.end("An error occurred. Please try again later.");
          }
        },
        next: {
          "*\\d+": "confirmation",
          "0": "buyForFamily",
          "00": "account",
        },
      });

      //===================TERMS AND CONDITIONS===================
      menu.state("termsAndConditions", {
        run: async () => {
          //change to kenya phone number format if not make to kenya format
          // if (!isValidKenyanPhoneNumber(buildInput.phone)) {
          //     buildInput.phone = `254${buildInput.phone.substring(1)}`;

          // }

          const to = `+${args.phoneNumber}`;

          // console.log(buildIt.phoneNumber, to)
          const message =
            "Visit [LINK TBC] to Terms & Conditions. A link will also be sent by SMS";
          console.log(to);

          //const sms = await sendSMS(to, message);

          menu.end(
            "Visit [LINK TBC] to Terms & Conditions. A link will also be sent by SMS"
          );
        },
      });

      //==================FAQS===================
      menu.state("faqs", {
        run: async () => {
          menu.con(
            "FAQs " +
            "\n1. Eligibility" +
            "\n2. Bronze cover" +
            "\n3. Silver Cover" +
            "\n4. Gold cover" +
            "\n5. Auto-renew" +
            "\n6. Waiting period" +
            "\n7. When to make claim" +
            "\n8. Claim Payment" +
            "\n9. Change Name" +
            "\n0.Back" +
            "\n00.Main Menu"
          );
        },
        next: {
          "1": "eligibility",
          "2": "bronzeCover",
          "3": "silverCover",
          "4": "goldCover",
          "5": "autoRenew",
          "6": "waitingPeriod",
          "7": "whenToMakeClaim",
          "8": "claimPayment",
          "9": "changeName",
        },
      });

      menu.state("eligibility", {
        run: async () => {
          menu.end(
            "Persons between the age of 18 and 65 are eligible to purchase Medical cover Policy" +
            "\nTs&Cs apply"
          );
        },
      });

      menu.state("bronzeCover", {
        run: async () => {
          menu.end(
            "Get Free Cover for Bronze Hospitalization cover for 30 nights / year " +
            "\nPays keys 4,500 per night from 2nd night. Payout for ICU is Kes9,000 for max 10 nights" +
            "\nTs&Cs apply"
          );
        },
      });

      menu.state("silverCover", {
        run: async () => {
          menu.end(
            "Outpatient limit of Kes 300,000" +
            "\nMaternity covered up to Kes 100,000" +
            "\nCan cover up to 6 dependents" +
            "\nTs&Cs apply"
          );
        },
      });

      menu.state("goldCover", {
        run: async () => {
          menu.end(
            "Outpatient limit of Kes 400,000" +
            "\nMaternity covered up to Kes 100,000" +
            "\nCan cover up to 6 dependents" +
            "\nTs&Cs apply"
          );
        },
      });

      menu.state("autoRenew", {
        run: async () => {
          menu.end(
            "To stay covered, the premium amount will be deducted automatically from your Airtel Money account on the selected day per month" +
            "\nTs&Cs apply"
          );
        },
      });

      menu.state("waitingPeriod", {
        run: async () => {
          menu.end(
            "This means the days before benefits become fully active. For the first 30 DAYS, only hospitalizations due to ACCIDENT will be covered. " +
            "\n10 month waiting period for pre-existing conditions." +
            "\nTs&Cs apply"
          );
        },
      });

      menu.state("whenToMakeClaim", {
        run: async () => {
          menu.end(
            "Make Hospital claim when you spend MORE THAN 1 NIGHT in the hospital. " +
            "\nA" +
            "\nTs&Cs apply"
          );
        },
      });

      menu.state("claimPayment", {
        run: async () => {
          menu.end(
            "Claims will be paid to customer’s Airtel  wallet (Bronze) or to the hospital for Silver and Gold" +
            "\nTs&Cs apply"
          );
        },
      });

      menu.state("changeName", {
        run: async () => {
          menu.end(
            "Policy will cover person whose name SIM is registered in. To change, visit Airtel Service Center with your National ID to Register this SIM Card in your name" +
            "\nTs&Cs apply"
          );
        },
      });

      // RUN THE MENU
      const menuRes = await menu.run(args);

      // RETURN THE MENU RESPONSE
      resolve(menuRes);
    } catch (error) {
      console.error(error);
      // SOMETHING WENT REALLY WRONG
      reject("END " + languages[configs.default_lang].generic.fatal_error);
    }
  });
}
