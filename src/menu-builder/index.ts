import { RequestBody } from "./typings/global";
import languages from "./lang";
import configs from "./configs";
import UssdMenu from "ussd-builder";
import crypto from "crypto";
import sendSMS from "../services/sendSMS";

import { termsAndConditions } from "./menus/termsAndConditions";
import { buyForSelf } from "./menus/buyForSelf";
import { displayFaqsMenu } from "./menus/faqs";
import { buyForFamily } from "./menus/buyForFamily";
import { myAccount } from "./menus/myAccount";
import { payNowPremium } from "./menus/payNow";
import { chooseHospital } from "./menus/chooseHospital";
import { buyForOthers } from "./menus/buyForOthers";
import { makeClaim } from "./menus/makeClaim";

import getAirtelUser from "../services/getAirtelUser";



require("dotenv").config();

let menu = new UssdMenu();

export default function (args: RequestBody, db: any) {
  return new Promise(async (resolve, reject) => {
    try {
      const Session = db.sessions;
      const User = db.users;

      //if  args.phoneNumber has a + then remove it
      if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
      }

      console.log("USER PHONE NUMBER", args.phoneNumber)
      let userPhoneNumber = args.phoneNumber;
      //if args.phoneNumber is 12 digit remove the first three country code
      if (args.phoneNumber.length == 12) {
        userPhoneNumber = args.phoneNumber.substring(3);
        args.phoneNumber = userPhoneNumber;
      }


     const userKyc = await getAirtelUser(userPhoneNumber, "UG", "UGX", 2)
      console.log("USER KYC", userKyc)

      async function getUser(phoneNumber: any) {
        return await User.findOne({
          where: {
            phone_number: phoneNumber,
          },
        });
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
        console.log("Updated Session:", session);
      }

      // ===============SET MENU STATES============
      menu.startState({
        run: async () => {
          console.log(" ===========================");
          console.log(" ******** START MENU *******");
          console.log(" ===========================");
      
          menu.con(
            'Insurance ' +
              '\n1. Ddwaliro Care'
          );
        },
        next: {
          '1': 'account',
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
          console.log('ACCOUNT User:', user);
      
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
          // } else {
          //   menu.con('Medical cover' +
          //     '\n00. Update profile(KYC)');
          // }
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
          '00': 'updateProfile',
        },
      });
      

      menu.state("updateProfile", {
        run: async () => {
          console.log("Update Profile");
          menu.con(
            `What's your gender?
            1. Male
            2. Female
            0. Back
            00. Main Menu`
          );
        },
        next: {
          "1": "updateGender",
          "2": "updateGender",
          "0": "account",
          "00": "account",
        },
      });
      
    
      menu.state("updateGender", {
        run: async () => {
          const gender = menu.val === "1" ? "M" : "F";
          const user = await User.update(
            { gender },
            { where: { phone_number: args.phoneNumber } }
          );
      
          console.log("Updated user:", user);
      
          menu.con(`Enter your date of birth in the format DDMMYYYY (e.g., 01011990):
      0. Back
      00. Main Menu`);
        },
        next: {
          "*\\d{8}": "updateDob",
          "0": "account",
          "00": "account",
        },
      });
      
      menu.state("updateDob", {
        run: async () => {
          let dob = menu.val;
          console.log("Input Date of Birth:", dob);
      
          // Remove all non-numeric characters
          dob = dob.replace(/\D/g, "");
          console.log("Cleaned Date of Birth:", dob);
      
          // Convert DDMMYYYY to a valid date
          let day = parseInt(dob.substring(0, 2));
          let month = parseInt(dob.substring(2, 4));
          let year = parseInt(dob.substring(4, 8));
          let date = new Date(year, month - 1, day);
          console.log("Parsed Date of Birth:", date);
      
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
      
          console.log("User DOB Update:", user);
      
          menu.con(`Enter your marital status
            1. Single
            2. Married
            3. Divorced
            4. Widowed
            0. Back
            00. Main Menu`);
        },
        next: {
          "*[0-9]": "updateMaritalStatus",
          "0": "account",
          "00": "account",
        },
      });
      
    
      menu.state("updateMaritalStatus", {
        run: async () => {
          const { gender, first_name } = await User.findOne({
            where: {
              phone_number: args.phoneNumber,
            },
          });
      
          const ben_marital_status = getMenuOption(menu.val);
          const title = getTitle(ben_marital_status, gender);
      
          console.log("ben_marital_status", ben_marital_status);
      
          const user = await User.update(
            {
              marital_status: ben_marital_status,
              title: title,
            },
            {
              where: {
                phone_number: args.phoneNumber,
              },
            }
          );
      
          console.log("User Marital Status Update:", user);
          // Send SMS
          const message = `Dear ${title} ${first_name}, your profile has been updated successfully`;
          await sendSMS(args.phoneNumber, message);
      
          menu.con(`Your profile has been updated successfully
            0. Back
            00. Main Menu`);
        },
        next: {
          "0": "account",
          "00": "account",
        },
      });
      
      function getMenuOption(val) {
        const options = {
          "1": "single",
          "2": "married",
          "3": "divorced",
          "4": "widowed",
        };
        return options[val] || "";
      }
      
      function getTitle(maritalStatus, gender) {
        let title = gender === "M" ? "Mr" : "Ms";
        if (maritalStatus === "married") {
          title = gender === "M" ? "Mr" : "Mrs";
        }
        return title;
      }
      

      myAccount(menu, args, db);
    
      //=================BUY FOR SELF=================
      buyForSelf(menu, args, db);

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
