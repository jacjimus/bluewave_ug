import { RequestBody } from "./typings/global";
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
import renewMenu from "./menus/renewMenu";
import { Op } from "sequelize";


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



export default function (args: RequestBody, db: any) {
  return new Promise(async (resolve, reject) => {
    try {
             console.log("args", args);
      let { phoneNumber, text, sessionId, serviceCode } = args;
      // check if the userText is '0' and remove 2 responses from the menu starting from the '0'.
      // This is to avoid the user from going back to the main menu when they are in the submenus.
      // check also if the userText is '00' set the text to empty string
      let response = "";
      let allSteps = text.split("*");

      // if the allsteps array includes '129' and '9902'  remove them from the array and retain the rest
      if (allSteps.includes("129") && allSteps.includes("9902")) {
        allSteps = allSteps.filter((step) => step !== "129" && step !== "9902");
        console.log("allSteps", allSteps)
        // remove empty strings from the array
        allSteps = allSteps.filter((step) => step !== "");
        text = allSteps.join("*").replace("129*9902#", "");
        console.log("text", text);
      }


      if (allSteps[allSteps.length - 1] == "00") {
        allSteps = [];
        text = "";
      }

      const handleBack = (arr: any) => {
        let index = arr.indexOf("0");
        if (index > -1) {

          console.log("index", index);
          console.log("allSteps", allSteps);

          allSteps.splice(index - 1, 2)
          text = allSteps.join("*");

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

      console.log("allStepsAfter", allSteps);

      const params = {
        phoneNumber,
        text,
        response,
        currentStep,
        previousStep,
        userText,
        allSteps,
      };

      let existingPolicy = await db.policies.findAndCountAll({
        where: {
            phone_number: phoneNumber,
            partner_id: 2,
            policy_status: "paid",
           [Op.or]: [
              { beneficiary: "FAMILY" },
              { beneficiary: "SELF" }
            ]},
        limit: 1,
      });

      if (existingPolicy.count > 0) {
        response = "CON Ddwaliro Care" +
          "\n1. Renew Policy" +
          "\n2. Buy for others" +
          "\n3. Make Claim" +
          "\n4. My Policy" +
          "\n5. View Hospital" +
          "\n6. Terms Conditions" +
          "\n7. FAQs"
      }else {
        response = "CON Ddwaliro Care" +
          "\n1. Buy for self" +
          "\n2. Buy for family" +
          "\n3. Buy for others" +
          "\n4. Make Claim" +
          "\n5. My Policy" +
          "\n6. View Hospital" +
          "\n7. Terms Conditions" +
          "\n8. FAQs"
      }

  

      if (text == "") {
        response 
      }
      else if (firstStep == "1" && existingPolicy.count == 0) {
        response = await selfMenu(params, db);
      }
      else if (firstStep == "1" && existingPolicy.count > 0) {
        response = await renewMenu(params, db);
      }
      else if (firstStep == "2" && existingPolicy.count == 0) {
        response = await familyMenu(params, db);
      }else if (firstStep == "2" && existingPolicy.count > 0) {
        response = await othersMenu(params, db);
      }
      else if (firstStep == "3" && existingPolicy.count == 0) {
        response = await othersMenu(params, db);
      }else if (firstStep == "3" && existingPolicy.count > 0) {
        response = await claimMenu(params, db);
      }
      else if (firstStep == "4" && existingPolicy.count == 0) {
        response = await claimMenu(params, db);
      }else if (firstStep == "4" && existingPolicy.count > 0) {
        response = await accountMenu(params, db);
      }
      else if (firstStep == "5" && existingPolicy.count == 0) {
        response = await accountMenu(params, db);
      }
      else if (firstStep == "5" && existingPolicy.count > 0) {
        response = await hospitalMenu(params, db);
      }
      else if (firstStep == "6" && existingPolicy.count == 0) {
        response = await hospitalMenu(params, db);
      }
      else if (firstStep == "6" && existingPolicy.count > 0) {
        response = await termsAndConditions(params);
      }
      else if (firstStep == "7" && existingPolicy.count == 0) {
        response = await termsAndConditions(params);

      }  else if (firstStep == "7" && existingPolicy.count > 0) {
        response = await faqsMenu(params);

      }
      else if (firstStep == "8") {
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
