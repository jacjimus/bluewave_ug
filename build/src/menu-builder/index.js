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
const ussd_builder_1 = __importDefault(require("ussd-builder"));
const getUser_1 = __importDefault(require("../services/getUser"));
const startMenu_1 = require("./menus/startMenu");
const displayInsuranceMenu_1 = require("./menus/displayInsuranceMenu");
const displayMedicalCoverMenu_1 = require("./menus/displayMedicalCoverMenu");
const termsAndConditions_1 = require("./menus/termsAndConditions");
const displayAccount_1 = require("./menus/displayAccount");
const buyForSelf_1 = require("./menus/buyForSelf");
const faqs_1 = require("./menus/faqs");
const buyForFamily_1 = require("./menus/buyForFamily");
const myAccount_1 = require("./menus/myAccount");
const payNow_1 = require("./menus/payNow");
require('dotenv').config();
let menu = new ussd_builder_1.default();
function default_1(args, db) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const Session = db.sessions;
            const User = db.users;
            //if  args.phoneNumber has a + then remove it
            if (args.phoneNumber.charAt(0) == "+") {
                args.phoneNumber = args.phoneNumber.substring(1);
            }
            // CHECK IF USER EXISTS
            let user = (yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            })) || (yield (0, getUser_1.default)(args.phoneNumber));
            // console.log("USER===", user);
            // BUILD INPUT VARIABLE
            let buildInput = {
                current_input: args.text,
                full_input: args.text,
                masked_input: args.text,
                active_state: configs_1.default.start_state,
                sid: configs_1.default.session_prefix + args.sessionId,
                language: configs_1.default.default_lang,
                phone: args.phoneNumber,
                hash: "",
                user_id: user === null || user === void 0 ? void 0 : user.id
            };
            // CHECK IF SESSION EXISTS
            let session = yield Session.findAll({
                where: {
                    sid: buildInput.sid
                }
            });
            if (session) {
                //console.log("session2", session);
                const [firstSession] = session;
                buildInput.active_state = firstSession === null || firstSession === void 0 ? void 0 : firstSession.active_state;
                buildInput.language = firstSession === null || firstSession === void 0 ? void 0 : firstSession.language;
                buildInput.full_input = firstSession === null || firstSession === void 0 ? void 0 : firstSession.full_input;
                buildInput.masked_input = firstSession === null || firstSession === void 0 ? void 0 : firstSession.masked_input;
                buildInput.hash = firstSession === null || firstSession === void 0 ? void 0 : firstSession.hash;
                buildInput.phone = firstSession === null || firstSession === void 0 ? void 0 : firstSession.phone;
                buildInput.user_id = firstSession === null || firstSession === void 0 ? void 0 : firstSession.user_id;
            }
            else {
                // CREATE NEW SESSION
                yield Session.create({
                    sid: buildInput.sid,
                    active_state: buildInput.active_state,
                    language: buildInput.language,
                    full_input: buildInput.full_input,
                    masked_input: buildInput.masked_input,
                    hash: buildInput.hash,
                    phone_number: buildInput.phone,
                    user_id: buildInput.user_id
                });
            }
            // ===============SET MENU STATES============
            (0, startMenu_1.startMenu)(menu);
            (0, displayInsuranceMenu_1.displayInsuranceMenu)(menu);
            (0, displayMedicalCoverMenu_1.displayMedicalCoverMenu)(menu);
            (0, displayAccount_1.displayAccount)(menu, args, db);
            //=================BUY FOR SELF=================
            (0, buyForSelf_1.buyForSelf)(menu, args, db);
            //=================BUY FOR FAMILY=================
            (0, buyForFamily_1.buyForFamily)(menu, args, db);
            //================MY ACCOUNT===================
            (0, myAccount_1.myAccount)(menu, args, db);
            //==================PAY NOW===================
            (0, payNow_1.payNow)(menu, args, db);
            //==================FAQS===================
            (0, faqs_1.displayFaqsMenu)(menu);
            //===================TERMS AND CONDITIONS===================
            (0, termsAndConditions_1.termsAndConditions)(menu, buildInput);
            // RUN THE MENU
            let menu_res = yield menu.run(args);
            // RETURN THE MENU RESPONSE
            resolve(menu_res);
            return;
        }
        catch (e) {
            console.log(e);
            // SOMETHING WENT REALLY WRONG
            reject("END " + lang_1.default[configs_1.default.default_lang].generic.fatal_error);
            return;
        }
    }));
}
exports.default = default_1;
