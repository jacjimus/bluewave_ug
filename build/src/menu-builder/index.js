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
const crypto_1 = __importDefault(require("crypto"));
const termsAndConditions_1 = require("./menus/termsAndConditions");
const buyForSelf_1 = require("./menus/buyForSelf");
const faqs_1 = require("./menus/faqs");
const buyForFamily_1 = require("./menus/buyForFamily");
const myAccount_1 = require("./menus/myAccount");
const payNow_1 = require("./menus/payNow");
const chooseHospital_1 = require("./menus/chooseHospital");
const buyForOthers_1 = require("./menus/buyForOthers");
const makeClaim_1 = require("./menus/makeClaim");
const getAirtelUser_1 = __importDefault(require("../services/getAirtelUser"));
require("dotenv").config();
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
            console.log("USER PHONE NUMBER", args.phoneNumber);
            let userPhoneNumber = args.phoneNumber;
            //if args.phoneNumber is 12 digit remove the first three country code
            if (args.phoneNumber.length == 12) {
                userPhoneNumber = args.phoneNumber.substring(3);
                args.phoneNumber = userPhoneNumber;
            }
            const userKyc = yield (0, getAirtelUser_1.default)(userPhoneNumber, "UG", "UGX", 2);
            console.log("USER KYC", userKyc);
            function getUser(phoneNumber) {
                return __awaiter(this, void 0, void 0, function* () {
                    return yield User.findOne({
                        where: {
                            phone_number: phoneNumber,
                        },
                    });
                });
            }
            // Retrieve user using provided phone number
            const user = yield getUser(userPhoneNumber);
            if (!user) {
                throw new Error("User not found");
            }
            // Function to generate a SHA-256 hash
            const generateHash = (data) => {
                const hash = crypto_1.default.createHash('sha256');
                hash.update(data);
                return hash.digest('hex');
            };
            const buildInput = {
                current_input: args.text,
                full_input: args.text,
                masked_input: args.text,
                active_state: configs_1.default.start_state,
                sid: configs_1.default.session_prefix + args.sessionId,
                language: configs_1.default.default_lang,
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
            let session = yield Session.findOne({
                where: {
                    sid: buildInput.sid,
                },
            });
            if (!session) {
                // Create new session
                session = yield Session.create(buildInput);
                console.log("New Session:", session);
            }
            else {
                // Update existing session
                yield Session.update(buildInput, {
                    where: {
                        sid: buildInput.sid,
                    },
                });
                console.log("Updated Session:", session);
            }
            // ===============SET MENU STATES============
            menu.startState({
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log(" ===========================");
                    console.log(" ******** START MENU *******");
                    console.log(" ===========================");
                    menu.con('Insurance ' +
                        '\n1. Ddwaliro Care');
                }),
                next: {
                    '1': 'account',
                },
            });
            //displayAccount(menu, args, db);
            menu.state('account', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const user = yield db.users.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                            gender: {
                                [db.Sequelize.Op.ne]: null,
                            },
                        },
                    });
                    console.log(" ============== USER - ACCOUNT ================ ", user);
                    if (user) {
                        menu.con('Medical cover ' +
                            '\n1. Buy for self' +
                            '\n2. Buy (family)' +
                            '\n3. Buy (others)' +
                            '\n4. Make Claim' +
                            '\n5. My Policy' +
                            '\n6. View Hospital' +
                            '\n7. Terms & Conditions' +
                            '\n8. FAQs'
                        // '\n00.Main Menu'
                        );
                    }
                    else {
                        menu.con('Medical cover ' +
                            '\n0. Update profile(KYC)');
                    }
                }),
                next: {
                    '1': 'buyForSelf',
                    '2': 'buyForFamily',
                    '3': 'buyForOthers',
                    '4': 'makeClaim',
                    '5': 'myAccount',
                    '6': 'chooseHospital',
                    '7': 'termsAndConditions',
                    '8': 'faqs',
                    '0': 'updateProfile',
                    // '00': 'account',
                }
            });
            //=================BUY FOR SELF=================
            (0, buyForSelf_1.buyForSelf)(menu, args, db);
            //=================BUY FOR FAMILY=================
            (0, buyForFamily_1.buyForFamily)(menu, args, db);
            //=================BUY FOR OTHERS=================
            (0, buyForOthers_1.buyForOthers)(menu, args, db);
            //================MY ACCOUNT===================
            (0, myAccount_1.myAccount)(menu, args, db);
            //================== MAKE CLAIM ===================
            (0, makeClaim_1.makeClaim)(menu, args, db);
            //==================PAY NOW===================
            (0, payNow_1.payNowPremium)(menu, args, db);
            //==================FAQS===================
            (0, faqs_1.displayFaqsMenu)(menu);
            //===================TERMS AND CONDITIONS===================
            (0, termsAndConditions_1.termsAndConditions)(menu, args);
            //===================CHOOSE HOSPITAL===================
            (0, chooseHospital_1.chooseHospital)(menu, args, db);
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
