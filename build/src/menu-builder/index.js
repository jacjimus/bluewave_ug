"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = __importDefault(require("./lang"));
const configs_1 = __importDefault(require("./configs"));
const ussd_menu_builder_1 = __importDefault(require("ussd-menu-builder"));
const db_1 = require("../models/db");
const selfMenu_1 = __importDefault(require("./menus/selfMenu"));
const familyMenu_1 = __importDefault(require("./menus/familyMenu"));
const faqsMenu_1 = __importDefault(require("./menus/faqsMenu"));
const termsMenu_1 = __importDefault(require("./menus/termsMenu"));
const othersMenu_1 = __importDefault(require("./menus/othersMenu"));
const claimMenu_1 = __importDefault(require("./menus/claimMenu"));
const accountMenu_1 = __importDefault(require("./menus/accountMenu"));
const hospitalMenu_1 = __importDefault(require("./menus/hospitalMenu"));
require("dotenv").config();
const Session = db_1.db.sessions;
const User = db_1.db.users;
const Policy = db_1.db.policies;
const Beneficiary = db_1.db.beneficiaries;
const Hospitals = db_1.db.hospitals;
const Claim = db_1.db.claims;
const UserHospital = db_1.db.user_hospitals;
let sessions = {};
let menu = new ussd_menu_builder_1.default();
menu.sessionConfig({
    start: (sessionId, callback) => {
        if (!(sessionId in sessions))
            sessions[sessionId] = {};
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
function default_1(args, db) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            let { phoneNumber, text, sessionId, serviceCode } = args;
            // check if the userText is '0' and remove 2 responses from the menu starting from the '0'.
            // This is to avoid the user from going back to the main menu when they are in the submenus.
            // check also if the userText is '00' set the text to empty string
            let response = "";
            let allSteps = text.split("*");
            // if the allsteps array includes '129' and '9902'  remove them from the array and retain the rest
            if (allSteps.includes("129") && allSteps.includes("9902#")) {
                allSteps = allSteps.filter((step) => step !== "129" && step !== "9902#");
                console.log("allSteps", allSteps);
                // remove empty strings from the array
                allSteps = allSteps.filter((step) => step !== "");
                text = allSteps.join("*").replace("129*9902#", "");
                console.log("text", text);
            }
            if (allSteps[allSteps.length - 1] == "00") {
                allSteps = [];
                text = "";
            }
            const handleBack = (arr) => {
                let index = arr.indexOf("0");
                if (index > -1) {
                    allSteps.splice(index - 1, 2);
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
            if (text == "") {
                response = "CON Ddwaliro Care" +
                    "\n1. Buy for self" +
                    "\n2. Buy family" +
                    "\n3. Buy others" +
                    "\n4. Make Claim" +
                    "\n5. My Policy" +
                    "\n6. View Hospital" +
                    "\n7. Terms Conditions" +
                    "\n8. FAQs";
            }
            else if (firstStep == "1") {
                response = yield (0, selfMenu_1.default)(params, db);
            }
            else if (firstStep == "2") {
                response = yield (0, familyMenu_1.default)(params, db);
            }
            else if (firstStep == "3") {
                response = yield (0, othersMenu_1.default)(params, db);
            }
            else if (firstStep == "4") {
                response = yield (0, claimMenu_1.default)(params, db);
            }
            else if (firstStep == "5") {
                response = yield (0, accountMenu_1.default)(params, db);
            }
            else if (firstStep == "6") {
                response = yield (0, hospitalMenu_1.default)(params, db);
            }
            else if (firstStep == "7") {
                response = yield (0, termsMenu_1.default)(params);
            }
            else if (firstStep == "8") {
                response = yield (0, faqsMenu_1.default)(params);
            }
            resolve(response);
            return;
        }
        catch (e) {
            console.log(e);
            reject("END " + lang_1.default[configs_1.default.default_lang].generic.fatal_error);
            return;
        }
    }));
}
exports.default = default_1;
