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
            let currentStep = allSteps.length;
            let previousStep = currentStep - 1;
            if (args.phoneNumber.charAt(0) == "+") {
                args.phoneNumber = args.phoneNumber.substring(1);
            }
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
            else if (currentStep == 1) {
                switch (text) {
                    case "1":
                        response = "Buy for self " +
                            "\n1. Mini – UGX 10,000" +
                            "\n2. Midi - UGX 14,000" +
                            "\n3. Biggie – UGX 18,000";
                        break;
                    case "2":
                        response = "Buy for family " +
                            "\n1. Self + Spouse or Child" +
                            "\n2. Self + Spouse + 1 Child" +
                            "\n3. Self + Spouse + 2 Children" +
                            "\n01. Next";
                        break;
                    case "3":
                        response = (yield "Buy for others ") +
                            "\n1. Other " +
                            "\n2. Other + Spouse or Child" +
                            "\n3. Other + Spouse + 1 Children" +
                            "\n01. Next";
                        break;
                    case "4":
                        response = "Make Claim " +
                            "\n1. Inpatient Claim" +
                            "\n2. Death Claim";
                        break;
                    case "5":
                        response = "My Account" +
                            "\n1. Policy Status" +
                            "\n2. Pay Now" +
                            "\n3. Renew Policy" +
                            "\n4. Update My Profile (KYC)" +
                            "\n5. Cancel Policy" +
                            "\n6. Add Dependant" +
                            "\n7. My Hospital";
                        break;
                    case "6":
                        const regions = [
                            "Central Region",
                            "Western Region",
                            "Eastern Region",
                            "Karamoja Region",
                            "West Nile Region",
                            "Northern Region",
                        ];
                        regions.forEach((region, index) => {
                            response += `${index + 1}. ${region}\n`;
                        });
                        break;
                    case "7":
                        response = 'To view Medical cover Terms &Conditions Visit www.tclink.com ';
                        break;
                    case "8":
                        response = "FAQs " +
                            "\n1. Eligibility" +
                            "\n2. Mini cover" +
                            "\n3. Midi Cover" +
                            "\n4. Biggie cover" +
                            "\n5. Waiting period" +
                            '\n6. Waiting period meaning' +
                            "\n7. When to make claim" +
                            "\n8. Claim Payment" +
                            '\n9. Renewal' +
                            "\n99. Insured Name";
                        break;
                    default:
                        response = "END " + lang_1.default[configs_1.default.default_lang].generic.invalid_option;
                        break;
                }
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
