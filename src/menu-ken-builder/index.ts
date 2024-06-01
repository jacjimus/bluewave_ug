import { KenRequestBody } from "./typings/global";
import languages from "./lang";
import configs from "./configs";
import selfMenu from "./menus/selfMenu";
import familyMenu from "./menus/familyMenu";
import faqsMenu from "./menus/faqsMenu";
import termsAndConditions from "./menus/termsMenu";
import othersMenu from "./menus/othersMenu";
import claimMenu from "./menus/claimMenu";
import accountMenu from "./menus/accountMenu";
import hospitalMenu from "./menus/hospitalMenu";
import { Console } from "winston/lib/winston/transports";
const redisClient = require("../middleware/redis");


require("dotenv").config();


const getSessionData = async (sessionid: string ,key: string) => {
  try {
    const data = await redisClient.hget(sessionid, key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting session data for  key ${key}:`, error);
    return null;
  }
};

const setSessionData = async (sessionId: string, key: string, value: string | boolean, ttl = 180) => {
  try {
    await redisClient.hset(sessionId, key, JSON.stringify(value));
      await redisClient.expire(sessionId, ttl);
  } catch (error) {
    console.error(`Error setting session data for key ${key}:`, error);
  }
};


const deleteSessionData = async (sessionId) => {
  await redisClient.del(sessionId);
};

export default function (args: KenRequestBody, db: any) {
  return new Promise(async (resolve, reject) => {
    try {
      let { msisdn, input, language, location, sessionid, date, new: new_, region, user, password, servicecode } = args;

      console.log("KEN args", args);

      // Start the session
     await setSessionData(sessionid, 'initialized', true);

      // Retrieve the stored input for the session
      let storedInput = await getSessionData(sessionid, 'storedInput');
      console.log("Stored input", storedInput);
      input = storedInput ? `${storedInput}*${input}` : input;

      let allSteps = input.split("*");

      console.log("All steps", allSteps);

      // Store the updated input back to the session
      await setSessionData(sessionid, 'storedInput', input);

      // Check if the user input is '0' and remove 2 responses from the menu starting from the '0'.
      // This is to avoid the user from going back to the main menu when they are in the submenus.
      // Check also if the user input is '00' set the input to an empty string
      let response = "";

      // If the allSteps array includes '284' and '14773' remove them from the array and retain the rest
      if (allSteps.includes(servicecode)) {
        allSteps = allSteps.filter((step) => step !== servicecode);
        // Remove empty strings from the array
        allSteps = allSteps.filter((step) => step !== "");
        input = allSteps.join("*").replace(servicecode, "");
      }

      if (allSteps[allSteps.length - 1] == "00") {
        allSteps = [];
        input = "";
      }

      const handleBack = (arr) => {
        let index = arr.indexOf("0");
        if (index > -1) {
          allSteps.splice(index - 1, 2);
          input = allSteps.join("*");
          return handleBack(allSteps);
        }
        // Find the last index of '00' and return the array from that index
        let index2 = arr.lastIndexOf("00");
        if (index2 > -1) {
          return allSteps = allSteps.slice(index2 + 1);
        }
        return allSteps;
      };

      allSteps = handleBack(allSteps);
      await setSessionData(sessionid, 'storedInput', allSteps.join("*"));

      let firstStep = allSteps[0];
      let currentStep = allSteps.length;
      let previousStep = currentStep - 1;
      let userText = allSteps[allSteps.length - 1];

      const params = {
        msisdn,
        input,
        response,
        currentStep,
        previousStep,
        userText,
        allSteps,
      };

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
      } else if (firstStep == "1") {
        response = await selfMenu(params, db);
      } else if (firstStep == "2") {
        response = await familyMenu(params, db);
      } else if (firstStep == "3") {
        response = await othersMenu(params, db);
      } else if (firstStep == "4") {
        response = await claimMenu(params, db);
      } else if (firstStep == "5") {
        response = await accountMenu(params, db);
      } else if (firstStep == "6") {
        response = await hospitalMenu(params, db);
      } else if (firstStep == "7") {
        response = await termsAndConditions(params);
      } else if (firstStep == "8") {
        response = await faqsMenu(params);
      }
      resolve(response);

      // End the session (if needed)
      ///await deleteSessionData(sessionid);
    } catch (e) {
      console.log(e);
      reject("END " + languages[configs.default_lang].generic.fatal_error);
    }
  });
}
