import { RequestBody } from "./typings/global";
import languages from "./lang";
import configs from "./configs";
import UssdMenu from "ussd-menu-builder";
import sendSMS from "../services/sendSMS";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { generateClaimId } from "../services/utils";
import { registerDependant, fetchMemberStatusData } from "../services/aar";

import { myAccount } from "./menus/myAccount";

import { termsAndConditions } from "./menus/termsAndConditions";
import { displayFaqsMenu } from "./menus/faqs";
import { buyForSelf } from "./menus/buyForSelf";
import { buyForFamily } from "./menus/buyForFamily";
import { getAirtelUser, getUserByPhoneNumber } from "../services/getAirtelUser";
import { airtelMoney } from "../services/payment";
import { db } from "../models/db";
import { buyForOthers } from "./menus/buyForOthers";
import selfMenu from "./menus/selfMenu";

require("dotenv").config();

const Session = db.sessions;
const User = db.users;
const Policy = db.policies;
const Beneficiary = db.beneficiaries;
const Hospitals = db.hospitals;
const Claim = db.claims;
const UserHospital = db.user_hospitals;




let sessions = {};

let menu = new UssdMenu();
menu.sessionConfig({
  start: (sessionId, callback) => {
    if (!(sessionId in sessions)) sessions[sessionId] = {};
    callback();
  },
  end: (sessionId, callback) => {
    delete sessions[sessionId];
    callback();
  },
  set: (sessionId, key, value, callback) => {
    sessions[sessionId][key] = value;
    callback();
  },
  get: (sessionId, key, callback) => {
    let value = sessions[sessionId][key];
    callback(null, value);

  }
});



export default function (args: RequestBody, db: any) {
  return new Promise(async (resolve, reject) => {
    try {

      const { phoneNumber, text, sessionId, serviceCode } = args;
      let response = "";
      let allSteps = text.split("*");
      let firstStep = allSteps[0];
      let currentStep = allSteps.length;
      let previousStep = currentStep - 1;
      let userText = allSteps[allSteps.length - 1];

      const params = {
        phoneNumber,
        text,
        response,
        currentStep,
        previousStep,
        userText,
        allSteps,
      };


      if (text == "") {
        response = "CON Ddwaliro Care" +
          "\n1. Buy for self" +
          "\n2. Buy (family)" +
          "\n3. Buy (others)" +
          "\n4. Make Claim" +
          "\n5. My Policy" +
          "\n6. View Hospital" +
          "\n7. Terms & Conditions" +
          "\n8. FAQs"
      }
      else if (firstStep == "1") {
          response = await selfMenu(params, db);


        //     break;
        //   case "2":
        //     response = "Buy for family " +
        //       "\n1. Self + Spouse or Child" +
        //       "\n2. Self + Spouse + 1 Child" +
        //       "\n3. Self + Spouse + 2 Children" +
        //       "\n01. Next"
        //     break;
        //   case "3":
        //     response = "CON Buy for others " +
        //       "\n1. Other " +
        //       "\n2. Other + Spouse or Child" +
        //       "\n3. Other + Spouse + 1 Children" +
        //       "\n01. Next"
        //     break;
        //   case "4":
        //     response = "CON Make Claim " +
        //       "\n1. Inpatient Claim" +
        //       "\n2. Death Claim"
        //     break;
        //   case "5":
        //     response = "CON My Account" +
        //       "\n1. Policy Status" +
        //       "\n2. Pay Now" +
        //       "\n3. Renew Policy" +
        //       "\n4. Update My Profile (KYC)" +
        //       "\n5. Cancel Policy" +
        //       "\n6. Add Dependant" +
        //       "\n7. My Hospital"
        //     break;
        //   case "6":
        //     const regions = [
        //       "Central Region",
        //       "Western Region",
        //       "Eastern Region",
        //       "Karamoja Region",
        //       "West Nile Region",
        //       "Northern Region",
        //     ];
        //     response = "CON "
        //     regions.forEach((region, index) => {
        //       response += `${index + 1}. ${region}\n`;
        //     });
        //     break;
        //   case "7":
        //     response = 'END To view Medical cover Terms &Conditions Visit www.tclink.com '
        //     break;
        //   case "8":
        //     response = "CON FAQs " +
        //       "\n1. Eligibility" +
        //       "\n2. Mini cover" +
        //       "\n3. Midi Cover" +
        //       "\n4. Biggie cover" +
        //       "\n5. Waiting period" +
        //       '\n6. Waiting period meaning' +
        //       "\n7. When to make claim" +
        //       "\n8. Claim Payment" +
        //       '\n9. Renewal' +
        //       "\n99. Insured Name";
        //     break;
        //   default:
        //     response = "END " + languages[configs.default_lang].generic.invalid_option;
        //     break;
        // }
      }
      // else if (currentStep == 2) {
      //   let coverType = "";
      //   let sum_insured = "";
      //   let premium = "";
      //   let yearly_premium = "";
      //   switch (userText) {
      //     case "1":
      //       coverType = "MINI";
      //       sum_insured = "1.5M"
      //       premium = "10,000";
      //       yearly_premium = "120,000";
      //       response = `CON Inpatient cover for ${args.phoneNumber}, UGX ${sum_insured} a year` +
      //         "\nPAY:" +
      //         `\n1-UGX ${premium} monthly` +
      //         `\n2-UGX ${yearly_premium} yearly`
      //       break;
      //     case "2":
      //       coverType = "MIDI";
      //       sum_insured = "3M"
      //       premium = "14,000";
      //       yearly_premium = "167,000";
      //       response = `CON Inpatient cover for ${args.phoneNumber}, UGX ${sum_insured} a year` +
      //         "\nPAY" +
      //         `\n1-UGX ${premium} monthly` +
      //         `\n2-UGX ${yearly_premium} yearly`
      //       break;
      //     case "3":
      //       coverType = "BIGGIE";
      //       sum_insured = "5M"
      //       premium = "18,000";
      //       yearly_premium = "208,000";
      //       response = `CON Inpatient cover for ${args.phoneNumber}, UGX ${sum_insured} a year` +
      //         "\nPAY" +
      //         `\n1-UGX ${premium} monthly` +
      //         `\n2-UGX ${yearly_premium} yearly`
      //       break;
      //     default:
      //       response = "END Invalid option";
      //       break;
      //   }
      // }

      resolve(response);


      return;
    } catch (e) {
      console.log(e);
      reject("END " + languages[configs.default_lang].generic.fatal_error);
      return;
    }
  });
}
