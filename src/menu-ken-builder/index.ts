import { KenRequestBody, RequestBody } from "./typings/global";
import languages from "./lang";
import configs from "./configs";
import UssdMenu from "ussd-menu-builder";
import selfMenu from "./menus/selfMenu";
import familyMenu from "./menus/familyMenu";
import faqsMenu from "./menus/faqsMenu";
import termsAndConditions from "./menus/termsMenu";
import othersMenu from "./menus/othersMenu";
import claimMenu from "./menus/claimMenu";
import accountMenu from "./menus/accountMenu";
import hospitalMenu from "./menus/hospitalMenu";
import { Op } from "sequelize";
import {db } from '../models/db'


require("dotenv").config();


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



export default function (args: KenRequestBody, db: any) {
  return new Promise(async (resolve, reject) => {
    try {

      let { msisdn, input, language, location, sessionid, date, new: new_, region, user, password } = args;
      // check if the userinput is '0' and remove 2 responses from the menu starting from the '0'.
      // This is to avoid the user from going back to the main menu when they are in the submenus.
      // check also if the userinput is '00' set the input to empty string
      let response = "";
      let allSteps = input.split("*");
      //*384*14773#

      // if the allsteps array includes '284' and '14773'  remove them from the array and retain the rest
      if (allSteps.includes("384") && allSteps.includes("14773")) {
        allSteps = allSteps.filter((step) => step !== "384" && step !== "14773");
        console.log("KEN allSteps", allSteps)
        // remove empty strings from the array
        allSteps = allSteps.filter((step) => step !== "");
        input = allSteps.join("*").replace("*384*14773#", "");
        console.log("input", input);
      }


      if (allSteps[allSteps.length - 1] == "00") {
        allSteps = [];
        input = "";
      }

      const handleBack = (arr: any) => {
        let index = arr.indexOf("0");
        if (index > -1) {

          console.log("index", index);
          console.log("KEN allSteps", allSteps);

          allSteps.splice(index - 1, 2)
          input = allSteps.join("*");

          return handleBack(allSteps);
        }
        // find the last index of '00' and return the array from that index
        let index2 = arr.lastIndexOf("00");
        if (index2 > -1) {
          return allSteps = allSteps.slice(index2 + 1);
        }
        return allSteps;
      };

      allSteps = handleBack(allSteps);

      let firstStep = allSteps[0];
      let currentStep = allSteps.length;
      let previousStep = currentStep - 1;
      let userText = allSteps[allSteps.length - 1];

      console.log("KEN allStepsAfter", allSteps);
      console.log("KEN firstStep", firstStep);
      console.log("KEN currentStep", currentStep);
      console.log("KEN previousStep", previousStep);
      console.log("KEN userinput", userText);

      const params = {
        msisdn,
        input,
        response,
        currentStep,
        previousStep,
        userText,
        allSteps,
      };
      console.log("KEN params", params);

      // let existingPolicy = await db.policies.findAndCountAll({
      //   where: {
      //       phone_number: msisdn,
      //       partner_id: 3,
      //       policy_status: "paid",
      //      [Op.or]: [
      //         { beneficiary: "FAMILY" },
      //         { beneficiary: "SELF" }
      //       ]},
      //   limit: 1,
      // });

     

      if (input == "") {
        response = "CON " +
          "\n1. Buy for self" +
          "\n2. Buy for family" +
          "\n3. Buy for others" +
          "\n4. Make Claim" +
          "\n5. My Policy" +
          "\n6. View Hospital" +
          "\n7. Terms Conditions" +
          "\n8. FAQs" +
          "\n0. Back 00. Main Menu";

      }
      else if (firstStep == "1") {
        response = await selfMenu(params, db);
      }
      else if (firstStep == "2") {
        response = await familyMenu(params, db);
      }
      else if (firstStep == "3") {
        response = await othersMenu(params, db);
      }
      else if (firstStep == "4") {
        response = await claimMenu(params, db);
      }
      else if (firstStep == "5") {
        response = await accountMenu(params, db);
      }
      else if (firstStep == "6") {
        response = await hospitalMenu(params, db);
      }
      else if (firstStep == "7") {
        response = await termsAndConditions(params);

      } else if (firstStep == "8") {
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
