import { RequestBody } from "./typings/global";
import languages from "./lang";
import configs from "./configs";
import UssdMenu from "ussd-builder";
import crypto from "crypto";

// import { startMenu } from "./menus/startMenu";
// import { displayInsuranceMenu } from "./menus/displayInsuranceMenu";
import { displayMedicalCoverMenu } from "./menus/displayMedicalCoverMenu";
import { termsAndConditions } from "./menus/termsAndConditions";
import { displayAccount } from "./menus/displayAccount";
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
      //startMenu(menu);
      // displayInsuranceMenu(menu);
      displayMedicalCoverMenu(menu, args, db);

      displayAccount(menu, args, db);
      //=================BUY FOR SELF=================
      buyForSelf(menu, args, db);

      //=================BUY FOR FAMILY=================
      buyForFamily(menu, args, db);

      //=================BUY FOR OTHERS=================
      buyForOthers(menu, args, db);

      //================MY ACCOUNT===================
      myAccount(menu, args, db);

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
