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
import familyMenu from "./menus/familyMenu";
import faqsMenu from "./menus/faqsMenu";

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
      }
      else if (firstStep == "2") {
        response = await familyMenu(params, db);
      }else if (firstStep == "8") {
        response = await faqsMenu(params);

      }

      resolve(response);


      return;
    } catch (e) {
      console.log(e);
      reject("END " + languages[configs.default_lang].generic.fatal_error);
      return;
    }
  });
}
