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
                    "\n8. FAQs";
            }
            else if (firstStep == "1") {
                response = yield (0, selfMenu_1.default)(params, db);
            }
            else if (firstStep == "2") {
                response = yield (0, familyMenu_1.default)(params, db);
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
