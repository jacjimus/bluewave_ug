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
const sendSMS_1 = __importDefault(require("../services/sendSMS"));
const uuid_1 = require("uuid");
const bcrypt_1 = __importDefault(require("bcrypt"));
const utils_1 = require("../services/utils");
const aar_1 = require("../services/aar");
//import { buyForSelf } from "./menus/buyForSelf";
//import { buyForFamily } from "./menus/buyForFamily";
// import { chooseHospital } from "./menus/chooseHospital";
// import { buyForOthers } from "./menus/buyForOthers";
const myAccount_1 = require("./menus/myAccount");
const termsAndConditions_1 = require("./menus/termsAndConditions");
const faqs_1 = require("./menus/faqs");
const getAirtelUser_1 = require("../services/getAirtelUser");
const payment_1 = require("../services/payment");
const db_1 = require("../models/db");
require("dotenv").config();
const Session = db_1.db.sessions;
const User = db_1.db.users;
const Policy = db_1.db.policies;
const Beneficiary = db_1.db.beneficiaries;
const Transaction = db_1.db.transactions;
const Payment = db_1.db.payments;
const Hospitals = db_1.db.hospitals;
const Claim = db_1.db.claims;
const UserHospital = db_1.db.user_hospitals;
function findUserByPhoneNumber(phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    });
}
const findPolicyByUser = (phone_number) => __awaiter(void 0, void 0, void 0, function* () {
    let policies = yield Policy.findAll({
        where: {
            phone_number: phone_number
        },
    });
    return policies[policies.length - 1];
});
const findPendingPolicyByUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Policy.findOne({
        where: {
            user_id: user === null || user === void 0 ? void 0 : user.user_id,
            policy_status: "pending",
        },
    });
});
let menu = new ussd_builder_1.default();
function default_1(args, db) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            let user, user_policy, userHospital, hospitalList, pending_policy;
            if (args.phoneNumber.charAt(0) == "+") {
                args.phoneNumber = args.phoneNumber.substring(1);
            }
            if (args.phoneNumber.length > 9) {
                args.phoneNumber = args.phoneNumber.substring(3);
            }
            const buildInput = {
                current_input: args.text,
                full_input: args.text,
                masked_input: args.text,
                active_state: configs_1.default.start_state,
                sid: configs_1.default.session_prefix + args.sessionId,
                language: configs_1.default.default_lang,
                phone_number: args.phoneNumber,
                hash: "",
                partner_id: 2,
            };
            // Check if session exists
            let session = yield Session.findOne({
                where: {
                    sid: buildInput.sid,
                },
            });
            if (!session) {
                // Create new session
                session = yield Session.create(buildInput);
            }
            else {
                // Update existing session
                yield Session.update(buildInput, {
                    where: {
                        sid: buildInput.sid,
                    },
                });
            }
            // ===============SET MENU STATES============
            // user = await getUserByPhoneNumber( args.phoneNumber, 2);
            // userHospital = await UserHospital.findOne({
            //   where: {
            //     user_id: user.user_id,
            //   },
            // });
            //hospitalList = await Hospitals.findAll();
            // pending_policy = findPendingPolicyByUser(user);
            menu.startState({
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log(" ===========================");
                    console.log(" ******** START MENU *******");
                    console.log(" ===========================");
                    menu.con("Ddwaliro Care" +
                        "\n1. Buy for self" +
                        "\n2. Buy (family)" +
                        "\n3. Buy (others)" +
                        "\n4. Make Claim" +
                        "\n5. My Policy" +
                        "\n6. View Hospital" +
                        "\n7. Terms & Conditions" +
                        "\n8. FAQs");
                }),
                next: {
                    "1": "buyForSelf",
                    "2": "buyForFamily",
                    "3": "buyForOthers",
                    "4": "makeClaim",
                    "5": "myAccount",
                    "6": "chooseHospital",
                    "7": "termsAndConditions",
                    "8": "faqs",
                },
            });
            menu.state("account", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Medical cover" +
                        "\n1. Buy for self" +
                        "\n2. Buy (family)" +
                        "\n3. Buy (others)" +
                        "\n4. Make Claim" +
                        "\n5. My Policy" +
                        "\n6. View Hospital" +
                        "\n7. Terms & Conditions" +
                        "\n8. FAQs");
                }),
                next: {
                    "1": "buyForSelf",
                    "2": "buyForFamily",
                    "3": "buyForOthers",
                    "4": "makeClaim",
                    "5": "myAccount",
                    "6": "chooseHospital",
                    "7": "termsAndConditions",
                    "8": "faqs",
                },
            });
            //=================BUY FOR SELF=================
            menu.state("buyForSelf", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log("* BUY FOR SELF", user);
                    menu.con("Buy for self " +
                        "\n1. Mini – UGX 10,000" +
                        "\n2. Midi - UGX 14,000" +
                        "\n3. Biggie – UGX 18,000" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "*\\d+": "buyForSelf.coverType",
                    "0": "",
                },
            });
            menu.state("buyForSelf.coverType", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let coverType = menu.val;
                    let userData = yield (0, getAirtelUser_1.getAirtelUser)(args.phoneNumber, "UG", "UGX", 2);
                    console.log("USER", userData);
                    const date = new Date();
                    const day = date.getDate() - 1;
                    let sum_insured, premium, yearly_premium;
                    if (coverType == "1") {
                        coverType = "MINI";
                        sum_insured = "1.5M";
                        premium = "10,000";
                        yearly_premium = "120,000";
                    }
                    else if (coverType == "2") {
                        coverType = "MIDI";
                        sum_insured = "3M";
                        premium = "14,000";
                        yearly_premium = "167,000";
                    }
                    else if (coverType == "3") {
                        coverType = "BIGGIE";
                        sum_insured = "5M";
                        premium = "18,000";
                        yearly_premium = "208,000";
                    }
                    const { msisdn, first_name, last_name } = userData;
                    console.log(" ======= USER =========", userData);
                    let policy = yield Policy.create({
                        user_id: (0, uuid_1.v4)(),
                        first_name: first_name,
                        last_name: last_name,
                        phone_number: msisdn,
                        membership_id: Math.floor(100000 + Math.random() * 900000),
                        policy_id: (0, uuid_1.v4)(),
                        policy_type: coverType,
                        beneficiary: "SELF",
                        policy_status: "pending",
                        policy_start_date: new Date(),
                        policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                        policy_deduction_day: day * 1,
                        partner_id: 2,
                        country_code: "UGA",
                        currency_code: "UGX",
                        product_id: "d18424d6-5316-4e12-9826-302b866a380c",
                    });
                    user_policy = policy;
                    if (premium && yearly_premium) {
                        menu.con(`Inpatient cover for ${msisdn},${first_name.toUpperCase()} ${last_name.toUpperCase()} UGX ${sum_insured} a year 
                PAY
                1-UGX ${premium} monthly
                2-UGX ${yearly_premium} yearly
                
                0. Back 00. Main Menu`);
                    }
                }),
                next: {
                    "*\\d+": "buyForSelf.paymentOption",
                    "0": "account",
                    "00": "insurance",
                },
            });
            function calculatePaymentOptions(policyType, paymentOption) {
                let period, installmentType, sumInsured, premium;
                if (policyType === "MINI") {
                    period = "yearly";
                    installmentType = 1;
                    sumInsured = 1500000;
                    premium = 120000;
                    if (paymentOption === 1) {
                        period = "monthly";
                        premium = 10000;
                        installmentType = 2;
                    }
                }
                else if (policyType === "MIDI") {
                    period = "yearly";
                    installmentType = 1;
                    sumInsured = 3000000;
                    premium = 167000;
                    if (paymentOption === 1) {
                        period = "monthly";
                        premium = 14000;
                        installmentType = 2;
                    }
                }
                else if (policyType === "BIGGIE") {
                    period = "yearly";
                    installmentType = 1;
                    sumInsured = 5000000;
                    premium = 208000;
                    if (paymentOption === 1) {
                        period = "monthly";
                        premium = 18000;
                        installmentType = 2;
                    }
                    return { period, installmentType, sumInsured, premium };
                }
            }
            menu.state("buyForSelf.paymentOption", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const paymentOption = parseInt(menu.val);
                    if (user) {
                        const { policy_type } = yield findPolicyByUser(args.phoneNumber);
                        let { period, installmentType, sumInsured, premium } = calculatePaymentOptions(policy_type, paymentOption);
                        if (premium) {
                            menu.con(`Pay UGX ${premium} payable ${period}.
            Terms&Conditions - www.airtel.com
            Enter PIN to Agree and Pay 
            \n0 .Back
             00 .Main Menu`);
                        }
                    }
                }),
                next: {
                    "*\\d+": "buyForSelf.confirm",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("buyForSelf.confirm", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const userPin = Number(menu.val);
                        const selected = args.text;
                        const input = selected.trim();
                        const digits = input.split("*").map((digit) => parseInt(digit, 10));
                        let paymentOption = Number(digits[digits.length - 2]);
                        console.log("PAYMENT OPTION", paymentOption);
                        // if (user) {
                        //   const { user_id, phone_number, partner_id, membership_id, pin } =
                        //     user;
                        //   if (userPin != pin && userPin != membership_id) {
                        //     menu.end("Invalid PIN");
                        //   }
                        const { user_id, phone_number, policy_type, policy_id, membership_id } = yield findPolicyByUser(args.phoneNumber);
                        if (policy_id == null) {
                            menu.end("Sorry, you have no policy to buy for self");
                        }
                        let sum_insured, premium = 0, installment_type = 0, period = "monthly", last_expense_insured = 0, si, lei, frequency;
                        if (policy_type == "MINI") {
                            period = "yearly";
                            installment_type = 1;
                            sum_insured = 1500000;
                            si = "1.5M";
                            premium = 120000;
                            last_expense_insured = 1000000;
                            lei = "1M";
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 10000;
                                installment_type = 2;
                            }
                        }
                        else if (policy_type == "MIDI") {
                            period = "yearly";
                            installment_type = 1;
                            sum_insured = 3000000;
                            si = "3M";
                            premium = 167000;
                            last_expense_insured = 1500000;
                            lei = "1.5M";
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 14000;
                                installment_type = 2;
                            }
                        }
                        else if (policy_type == "BIGGIE") {
                            period = "yearly";
                            installment_type = 1;
                            sum_insured = 5000000;
                            si = "5M";
                            premium = 208000;
                            last_expense_insured = 2000000;
                            lei = "2M";
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 18000;
                                installment_type = 2;
                            }
                        }
                        if (paymentOption == 1) {
                            frequency = "month";
                        }
                        else {
                            frequency = "year";
                        }
                        const policy_end_date = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
                        let policy = yield Policy.update({
                            policy_deduction_amount: premium,
                            policy_pending_premium: premium,
                            sum_insured: sum_insured,
                            premium: premium,
                            installment_type: installment_type,
                            installment_order: 1,
                            last_expense_insured: last_expense_insured,
                            policy_end_date: policy_end_date,
                            policy_start_date: new Date(),
                        }, { where: { phone_number: args.phoneNumber } });
                        let paymentStatus = yield (0, payment_1.airtelMoney)(user_id, 2, policy_id, phone_number, premium, membership_id, "UG", "UGX");
                        console.log("PAYMENT STATUS", paymentStatus);
                        if (paymentStatus.code === 200) {
                            let congratText = `Congratulations! You bought Mini cover for Inpatient (UGX ${si}) and Funeral (UGX ${lei}) for a year. 
                        Pay UGX ${premium} every ${frequency} to stay covered`;
                            yield (0, sendSMS_1.default)(phone_number, congratText);
                            menu.end(`Congratulations! You are now covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                           Cover valid till ${policy_end_date.toDateString()}`);
                        }
                        else {
                            menu.end(`Sorry, your payment was not successful. 
                        \n0. Back \n00. Main Menu`);
                        }
                    }
                    catch (error) {
                        console.error("Confirmation Error:", error);
                        menu.end("An error occurred. Please try again later.");
                    }
                }),
            });
            //=================BUY FOR FAMILY=================
            //============  BUY FOR FAMILY ===================
            menu.state("buyForFamily", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log("* BUY FOR FAMILY", user.phoneNumber);
                    menu.con("Buy for family " +
                        "\n1. Self + Spouse or Child" +
                        "\n2. Self + Spouse + 1 Child" +
                        "\n3. Self + Spouse + 2 Children" +
                        "\n01. Next" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "1": "buyForFamily.selfSpouseCover",
                    "2": "buyForFamily.selfSpouseCover",
                    "3": "buyForFamily.selfSpouseCover",
                    "0": "account",
                    "00": "account",
                    "01": "buyForFamily.next",
                },
            });
            menu.state("buyForFamily.next", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Buy for family " +
                        "\n4. Self + Spouse + 3 Child" +
                        "\n5. Self + Spouse + 4 Child" +
                        "\n6. Self + Spouse + 5 Children" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "4": "buyForFamily.selfSpouseCover",
                    "5": "buyForFamily.selfSpouseCover",
                    "6": "buyForFamily.selfSpouseCover",
                    "0": "buyForFamily",
                    "00": "account",
                },
            });
            menu.state("buyForFamily.selfSpouseCover", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let member_number = menu.val;
                    console.log("MEMBER NUMBER", member_number);
                    if (member_number == "1") {
                        member_number = "M+1";
                    }
                    else if (member_number == "2") {
                        member_number = "M+2";
                    }
                    else if (member_number == "3") {
                        member_number = "M+3";
                    }
                    else if (member_number == "4") {
                        member_number = "M+4";
                    }
                    else if (member_number == "5") {
                        member_number = "M+5";
                    }
                    else if (member_number == "6") {
                        member_number = "M+6";
                    }
                    else {
                        menu.end("Invalid option");
                    }
                    console.log("MEMBER NUMBER", member_number);
                    yield User.update({ total_member_number: member_number }, { where: { phone_number: args.phoneNumber } });
                    if (member_number == "M+1") {
                        menu.con(`
              1. Mini – UGX 20,000
              2. Midi – UGX 28,000
              3. Biggie – UGX 35,000
              0. Back
              00. Main Menu`);
                    }
                    else if (member_number == "M+2") {
                        menu.con(`
              1. Mini – UGX 30,000
              2. Midi – UGX 40,000
              3. Biggie – UGX 50,000
              0. Back
              00. Main Menu`);
                    }
                    else if (member_number == "M+3") {
                        menu.con(`
              1. Mini – UGX 40,000
              2. Midi – UGX 50,000
              3. Biggie – UGX 65,000
              0. Back
              00. Main Menu`);
                    }
                    else if (member_number == "M+4") {
                        menu.con(`
              1. Mini – UGX 50,000
              2. Midi – UGX 63,000
              3. Biggie – UGX 77,000
              0. Back
              00. Main Menu`);
                    }
                    else if (member_number == "M+5") {
                        menu.con(`
              1. Mini – UGX 60,000
              2. Midi – UGX 75,000
              3. Biggie – UGX 93,000
              0. Back
              00. Main Menu`);
                    }
                    else if (member_number == "M+6") {
                        menu.con(`
              1. Mini – UGX 70,000
              2. Midi – UGX 88,000
              3. Biggie – UGX 108,000
              0. Back
              00. Main Menu`);
                    }
                    else {
                        menu.con(`
                  1. Mini – UGX 20,000
                  2. Midi – UGX 28,000
                  3. Biggie – UGX 35,000
                  0. Back
                  00. Main Menu`);
                    }
                }),
                next: {
                    "*\\d+": "buyForFamily.selfSpouseCoverType",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("buyForFamily.selfSpouseCoverType", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let coverType = menu.val;
                    console.log("FAMILY COVER TYPE", coverType);
                    if (user) {
                        //let { user_id, partner_id } = user;
                        let date = new Date();
                        let day = date.getDate() - 1;
                        if (coverType == "1") {
                            coverType = "MINI";
                        }
                        else if (coverType == "2") {
                            coverType = "MIDI";
                        }
                        else if (coverType == "3") {
                            coverType = "BIGGIE";
                        }
                        yield Policy.create({
                            user_id: (0, uuid_1.v4)(),
                            policy_id: (0, uuid_1.v4)(),
                            policy_type: coverType,
                            beneficiary: "FAMILY",
                            policy_status: "pending",
                            policy_start_date: new Date(),
                            policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                            policy_deduction_day: day * 1,
                            partner_id: 2,
                            country_code: "UGA",
                            currency_code: "UGX",
                            product_id: "d18424d6-5316-4e12-9826-302b866a380c",
                        });
                        // await User.update(
                        //   { cover_type: coverType },
                        //   { where: { phone_number: args.phoneNumber } }
                        // );
                        menu.con("\nEnter atleast Name of spouse or 1 child" +
                            "\n0.Back" +
                            "\n00.Main Menu");
                    }
                }),
                next: {
                    "*[a-zA-Z]+": "buyForFamily.selfSpouseName",
                    "0": "buyForFamily",
                    "00": "account",
                },
            });
            menu.state("buyForFamily.selfSpouseName", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let spouse = menu.val;
                    console.log("SPOUSE NAME", spouse);
                    // if (user) {
                    //   let { user_id, total_member_number } = user;
                    let beneficiary = {
                        beneficiary_id: (0, uuid_1.v4)(),
                        full_name: spouse,
                        first_name: spouse.split(" ")[0],
                        middle_name: spouse.split(" ")[1],
                        last_name: spouse.split(" ")[2] || spouse.split(" ")[1],
                        relationship: "SPOUSE",
                        member_number: "M+1",
                        user_id: (0, uuid_1.v4)(),
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary selfSpouse", newBeneficiary);
                    menu.con("\nEnter Phone of spouse (or Main member, if dependent is child)" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "*\\d+": "buyForFamily.selfSpousePhoneNumber",
                    "0": "buyForFamily",
                    "00": "account",
                },
            });
            menu.state("buyForFamily.selfSpousePhoneNumber", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let spousePhone = menu.val;
                    console.log("SPOUSE Phone", spousePhone);
                    if (spousePhone.charAt(0) == "+") {
                        spousePhone = spousePhone.substring(1);
                    }
                    const current_beneficiary = yield Beneficiary.findOne({
                        where: { phone_number: spousePhone },
                    });
                    if (current_beneficiary) {
                        menu.con("Beneficiary already exists");
                    }
                    const { user_id, partner_id, cover_type, phone_number, first_name, last_name, total_member_number, } = user;
                    console.log(" ========= USER total_member_number========", total_member_number);
                    yield Beneficiary.update({ phone_number: spousePhone }, { where: { user_id: user_id, relationship: "SPOUSE" } });
                    console.log(" ==========  COVER TYPE ==========", cover_type);
                    const { policy_type, beneficiary, bought_for } = yield findPolicyByUser(user === null || user === void 0 ? void 0 : user.user_id);
                    console.log(" ========= USER policy_type========", policy_type, beneficiary, bought_for);
                    if (bought_for !== null) {
                        yield User.update({ phone_number: spousePhone }, { where: { user_id: bought_for } });
                    }
                    let sum_insured, period, installment_type, si, premium = 0, yearly_premium = 0, last_expense_insured = 0, lei;
                    let paymentOption = 1;
                    let coverType = cover_type;
                    if (coverType == "MINI") {
                        lei = "1M";
                        si = "1.5M";
                        if (paymentOption == 1) {
                            period = "monthly";
                            installment_type = 1;
                        }
                        else {
                            period = "yearly";
                            installment_type = 2;
                        }
                        if (total_member_number == "M") {
                            sum_insured = 1500000;
                            premium = 120000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 10000;
                                yearly_premium = 240000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+1") {
                            sum_insured = 1500000;
                            premium = 240000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 20000;
                                yearly_premium = 240000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+2") {
                            sum_insured = 1500000;
                            premium = 360000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 30000;
                                yearly_premium = 360000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+3") {
                            sum_insured = 1500000;
                            premium = 480000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 40000;
                                yearly_premium = 480000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+4") {
                            sum_insured = 1500000;
                            premium = 600000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 50000;
                                yearly_premium = 600000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+5") {
                            sum_insured = 1500000;
                            premium = 720000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 60000;
                                yearly_premium = 7200000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+6") {
                            sum_insured = 1500000;
                            premium = 840000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 70000;
                                yearly_premium = 840000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else {
                            sum_insured = 1500000;
                            premium = 240000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 20000;
                                yearly_premium = 240000;
                                last_expense_insured = 1000000;
                            }
                        }
                    }
                    else if (coverType == "MIDI") {
                        si = "3M";
                        lei = "1.5M";
                        if (paymentOption == 1) {
                            period = "monthly";
                            installment_type = 1;
                        }
                        else {
                            period = "yearly";
                            installment_type = 2;
                        }
                        if (total_member_number == "M") {
                            sum_insured = 3000000;
                            premium = 167000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 14000;
                                yearly_premium = 167000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+1") {
                            sum_insured = 3000000;
                            premium = 322000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 28000;
                                yearly_premium = 322000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+2") {
                            sum_insured = 3000000;
                            premium = 467000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 40000;
                                yearly_premium = 467000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+3") {
                            sum_insured = 3000000;
                            premium = 590000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 50000;
                                yearly_premium = 590000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+4") {
                            sum_insured = 3000000;
                            premium = 720000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 63000;
                                yearly_premium = 720000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+5") {
                            sum_insured = 3000000;
                            premium = 860000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 75000;
                                yearly_premium = 860000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+6") {
                            sum_insured = 3000000;
                            premium = 1010000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 88000;
                                yearly_premium = 1010000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else {
                            sum_insured = 3000000;
                            premium = 322000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 28000;
                                yearly_premium = 322000;
                                last_expense_insured = 1500000;
                            }
                        }
                    }
                    else if (coverType == "BIGGIE") {
                        si = "5M";
                        lei = "2M";
                        if (paymentOption == 1) {
                            period = "monthly";
                            installment_type = 1;
                        }
                        else {
                            period = "yearly";
                            installment_type = 2;
                        }
                        if (total_member_number == "M") {
                            sum_insured = 5000000;
                            premium = 208000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 18000;
                                yearly_premium = 208000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+1") {
                            sum_insured = 5000000;
                            premium = 400000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 35000;
                                yearly_premium = 400000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+2") {
                            sum_insured = 5000000;
                            premium = 577000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 50000;
                                yearly_premium = 577000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+3") {
                            sum_insured = 5000000;
                            premium = 740000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 65000;
                                yearly_premium = 740000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+4") {
                            sum_insured = 5000000;
                            premium = 885000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 77000;
                                yearly_premium = 885000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+5") {
                            sum_insured = 5000000;
                            premium = 1060000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 93000;
                                yearly_premium = 1060000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+6") {
                            sum_insured = 5000000;
                            premium = 1238000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 108000;
                                yearly_premium = 1238000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else {
                            sum_insured = 5000000;
                            premium = 400000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 35000;
                                yearly_premium = 400000;
                                last_expense_insured = 2000000;
                            }
                        }
                    }
                    else {
                        menu.end("Invalid option");
                    }
                    console.log("SUM INSURED", sum_insured);
                    console.log("PREMIUM", premium);
                    console.log("LAST EXPENSE INSURED", last_expense_insured);
                    console.log("YEARLY PREMIUM", yearly_premium);
                    menu.con(`Inpatient Family cover for ${first_name.toUpperCase()} ${last_name.toUpperCase()} ${phone_number}, UGX ${si} 
                PAY
                1-UGX ${new Intl.NumberFormat().format(premium)} monthly
                2-UGX ${new Intl.NumberFormat().format(yearly_premium)} yearly
                0.Back
                00.Main Menu`);
                }),
                next: {
                    "*\\d+": "buyForFamilyPin",
                    "0": "buyForFamily",
                    "00": "account",
                },
            });
            menu.state("buyForFamilyPin", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const paymentOption = Number(menu.val);
                    console.log("PAYMENT OPTION", paymentOption);
                    const { user_id, cover_type, total_member_number } = user;
                    let coverType = cover_type;
                    const { policy_id } = yield findPolicyByUser(user === null || user === void 0 ? void 0 : user.user_id);
                    console.log("COVER TYPE", coverType);
                    console.log("====== Total_member_number ====  ", total_member_number);
                    if (policy_id == null) {
                        menu.end("Sorry, you have no policy to buy for family");
                    }
                    let sum_insured, si, premium = 0, installment_type = 0, period = "monthly", last_expense_insured = 0, lei, yearly_premium = 0;
                    if (coverType == "MINI") {
                        lei = "1M";
                        si = "1.5M";
                        if (paymentOption == 1) {
                            period = "monthly";
                            installment_type = 1;
                        }
                        else {
                            period = "yearly";
                            installment_type = 2;
                        }
                        if (total_member_number == "M") {
                            sum_insured = 1500000;
                            premium = 120000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 10000;
                                yearly_premium = 240000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+1") {
                            sum_insured = 1500000;
                            premium = 240000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 20000;
                                yearly_premium = 240000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+2") {
                            sum_insured = 1500000;
                            premium = 360000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 30000;
                                yearly_premium = 360000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+3") {
                            sum_insured = 1500000;
                            premium = 480000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 40000;
                                yearly_premium = 480000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+4") {
                            sum_insured = 1500000;
                            premium = 600000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 50000;
                                yearly_premium = 600000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+5") {
                            sum_insured = 1500000;
                            premium = 720000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 60000;
                                yearly_premium = 7200000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+6") {
                            sum_insured = 1500000;
                            premium = 840000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 70000;
                                yearly_premium = 840000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else {
                            sum_insured = 1500000;
                            premium = 240000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 20000;
                                yearly_premium = 240000;
                                last_expense_insured = 1000000;
                            }
                        }
                    }
                    else if (coverType == "MIDI") {
                        si = "3M";
                        lei = "1.5M";
                        if (paymentOption == 1) {
                            period = "monthly";
                            installment_type = 1;
                        }
                        else {
                            period = "yearly";
                            installment_type = 2;
                        }
                        if (total_member_number == "M") {
                            sum_insured = 3000000;
                            premium = 167000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 14000;
                                yearly_premium = 167000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+1") {
                            sum_insured = 3000000;
                            premium = 322000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 28000;
                                yearly_premium = 322000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+2") {
                            sum_insured = 3000000;
                            premium = 467000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 40000;
                                yearly_premium = 467000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+3") {
                            sum_insured = 3000000;
                            premium = 590000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 50000;
                                yearly_premium = 590000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+4") {
                            sum_insured = 3000000;
                            premium = 720000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 63000;
                                yearly_premium = 720000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+5") {
                            sum_insured = 3000000;
                            premium = 860000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 75000;
                                yearly_premium = 860000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+6") {
                            sum_insured = 3000000;
                            premium = 1010000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 88000;
                                yearly_premium = 1010000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else {
                            sum_insured = 3000000;
                            premium = 322000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 28000;
                                yearly_premium = 322000;
                                last_expense_insured = 1500000;
                            }
                        }
                    }
                    else if (coverType == "BIGGIE") {
                        si = "5M";
                        lei = "2M";
                        if (paymentOption == 1) {
                            period = "monthly";
                            installment_type = 1;
                        }
                        else {
                            period = "yearly";
                            installment_type = 2;
                        }
                        if (total_member_number == "M") {
                            sum_insured = 5000000;
                            premium = 208000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 18000;
                                yearly_premium = 208000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+1") {
                            sum_insured = 5000000;
                            premium = 400000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 35000;
                                yearly_premium = 400000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+2") {
                            sum_insured = 5000000;
                            premium = 577000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 50000;
                                yearly_premium = 577000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+3") {
                            sum_insured = 5000000;
                            premium = 740000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 65000;
                                yearly_premium = 740000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+4") {
                            sum_insured = 5000000;
                            premium = 885000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 77000;
                                yearly_premium = 885000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+5") {
                            sum_insured = 5000000;
                            premium = 1060000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 93000;
                                yearly_premium = 1060000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+6") {
                            sum_insured = 5000000;
                            premium = 1238000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 108000;
                                yearly_premium = 1238000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else {
                            menu.end("Invalid option");
                        }
                    }
                    else {
                        menu.end("Invalid option");
                    }
                    console.log("SUM INSURED", sum_insured);
                    console.log("PREMIUM", premium);
                    console.log("LAST EXPENSE INSURED", last_expense_insured);
                    console.log("YEARLY PREMIUM", yearly_premium);
                    menu.con(`Pay UGX ${premium} payable ${period}.
                  Terms&Conditions - www.airtel.com
                  Enter PIN to Agree and Pay 
                  0.Back
                  00.Main Menu`);
                }),
                next: {
                    "*\\d+": "family.confirmation",
                    "0": "buyForFamily",
                    "00": "account",
                },
            });
            //buyForFamily.selfSpouse.pay.yearly
            menu.state("family.confirmation", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const userKyc = yield (0, getAirtelUser_1.getAirtelUser)(args.phoneNumber, "UG", "UGX", 2);
                        console.log("=========  USER KYC ===========", userKyc);
                        const userPin = Number(menu.val);
                        const selected = args.text;
                        const input = selected.trim();
                        const digits = input.split("*").map((digit) => parseInt(digit, 10));
                        let paymentOption = Number(digits[digits.length - 2]);
                        const { user_id, phone_number, partner_id, membership_id, pin, total_member_number, cover_type, } = user;
                        let coverType = cover_type;
                        if (userPin != pin && userPin != membership_id) {
                            menu.end("Invalid PIN");
                        }
                        const { policy_type, policy_id, beneficiary, bought_for } = yield findPolicyByUser(user === null || user === void 0 ? void 0 : user.user_id);
                        if (policy_id == null) {
                            menu.end("Sorry, you have no policy to buy for family");
                        }
                        let otherMember;
                        if (bought_for !== null && beneficiary == "OTHERS") {
                            otherMember = yield User.findOne({
                                where: { user_id: bought_for },
                            });
                            console.log("OTHER MEMBER", otherMember);
                        }
                        let sum_insured, premium = 0, installment_type = 0, period = "monthly", last_expense_insured = 0, si = "", lei, yearly_premium = 0, members = "";
                        if (coverType == "MINI") {
                            lei = "1M";
                            si = "1.5M";
                            if (paymentOption == 1) {
                                period = "monthly";
                                installment_type = 1;
                            }
                            else {
                                period = "yearly";
                                installment_type = 2;
                            }
                            if (total_member_number == "M") {
                                sum_insured = 1500000;
                                premium = 120000;
                                last_expense_insured = 1000000;
                                members = "other";
                                if (paymentOption == 1) {
                                    premium = 10000;
                                    yearly_premium = 240000;
                                    last_expense_insured = 1000000;
                                }
                            }
                            else if (total_member_number == "M+1") {
                                sum_insured = 1500000;
                                premium = 240000;
                                last_expense_insured = 1000000;
                                members = "You and 1 dependent";
                                if (paymentOption == 1) {
                                    premium = 20000;
                                    yearly_premium = 240000;
                                    last_expense_insured = 1000000;
                                }
                            }
                            else if (total_member_number == "M+2") {
                                sum_insured = 1500000;
                                premium = 360000;
                                last_expense_insured = 1000000;
                                members = "You and 2 dependent";
                                if (paymentOption == 1) {
                                    premium = 30000;
                                    yearly_premium = 360000;
                                    last_expense_insured = 1000000;
                                }
                            }
                            else if (total_member_number == "M+3") {
                                sum_insured = 1500000;
                                premium = 480000;
                                last_expense_insured = 1000000;
                                members = "You and 3 dependent";
                                if (paymentOption == 1) {
                                    premium = 40000;
                                    yearly_premium = 480000;
                                    last_expense_insured = 1000000;
                                }
                            }
                            else if (total_member_number == "M+4") {
                                sum_insured = 1500000;
                                premium = 600000;
                                last_expense_insured = 1000000;
                                members = "You and 4 dependent";
                                if (paymentOption == 1) {
                                    period = "monthly";
                                    premium = 50000;
                                    yearly_premium = 600000;
                                    last_expense_insured = 1000000;
                                }
                            }
                            else if (total_member_number == "M+5") {
                                sum_insured = 1500000;
                                premium = 720000;
                                last_expense_insured = 1000000;
                                members = "You and 5 dependent";
                                if (paymentOption == 1) {
                                    period = "monthly";
                                    premium = 60000;
                                    yearly_premium = 7200000;
                                    last_expense_insured = 1000000;
                                }
                            }
                            else if (total_member_number == "M+6") {
                                sum_insured = 1500000;
                                premium = 840000;
                                last_expense_insured = 1000000;
                                members = "You and 6 dependent";
                                if (paymentOption == 1) {
                                    period = "monthly";
                                    premium = 70000;
                                    yearly_premium = 840000;
                                    last_expense_insured = 1000000;
                                }
                            }
                            else {
                                sum_insured = 1500000;
                                premium = 240000;
                                last_expense_insured = 1000000;
                                members = "You";
                                if (paymentOption == 1) {
                                    period = "monthly";
                                    premium = 20000;
                                    yearly_premium = 240000;
                                    last_expense_insured = 1000000;
                                }
                            }
                        }
                        else if (coverType == "MIDI") {
                            si = "3M";
                            lei = "1.5M";
                            if (paymentOption == 1) {
                                period = "monthly";
                                installment_type = 1;
                            }
                            else {
                                period = "yearly";
                                installment_type = 2;
                            }
                            if (total_member_number == "M") {
                                sum_insured = 3000000;
                                premium = 167000;
                                last_expense_insured = 1500000;
                                members = "other";
                                if (paymentOption == 1) {
                                    premium = 14000;
                                    yearly_premium = 167000;
                                    last_expense_insured = 1500000;
                                }
                            }
                            else if (total_member_number == "M+1") {
                                sum_insured = 3000000;
                                premium = 322000;
                                last_expense_insured = 1500000;
                                members = "You and 1 dependent";
                                if (paymentOption == 1) {
                                    premium = 28000;
                                    yearly_premium = 322000;
                                    last_expense_insured = 1500000;
                                }
                            }
                            else if (total_member_number == "M+2") {
                                sum_insured = 3000000;
                                premium = 467000;
                                last_expense_insured = 1500000;
                                members = "You and 2 dependent";
                                if (paymentOption == 1) {
                                    premium = 40000;
                                    yearly_premium = 467000;
                                    last_expense_insured = 1500000;
                                }
                            }
                            else if (total_member_number == "M+3") {
                                sum_insured = 3000000;
                                premium = 590000;
                                last_expense_insured = 1500000;
                                members = "You and 3 dependent";
                                if (paymentOption == 1) {
                                    premium = 50000;
                                    yearly_premium = 590000;
                                    last_expense_insured = 1500000;
                                }
                            }
                            else if (total_member_number == "M+4") {
                                sum_insured = 3000000;
                                premium = 720000;
                                last_expense_insured = 1500000;
                                members = "You and 4 dependent";
                                if (paymentOption == 1) {
                                    period = "monthly";
                                    premium = 63000;
                                    yearly_premium = 720000;
                                    last_expense_insured = 1500000;
                                }
                            }
                            else if (total_member_number == "M+5") {
                                sum_insured = 3000000;
                                premium = 860000;
                                last_expense_insured = 1500000;
                                members = "You and 5 dependent";
                                if (paymentOption == 1) {
                                    period = "monthly";
                                    premium = 75000;
                                    yearly_premium = 860000;
                                    last_expense_insured = 1500000;
                                }
                            }
                            else if (total_member_number == "M+6") {
                                sum_insured = 3000000;
                                premium = 1010000;
                                last_expense_insured = 1500000;
                                members = "You and 6 dependent";
                                if (paymentOption == 1) {
                                    period = "monthly";
                                    premium = 88000;
                                    yearly_premium = 1010000;
                                    last_expense_insured = 1500000;
                                }
                            }
                            else {
                                sum_insured = 3000000;
                                premium = 322000;
                                last_expense_insured = 1500000;
                                members = "You";
                                if (paymentOption == 1) {
                                    premium = 28000;
                                    yearly_premium = 322000;
                                    last_expense_insured = 1500000;
                                }
                            }
                        }
                        else if (coverType == "BIGGIE") {
                            si = "5M";
                            lei = "2M";
                            if (paymentOption == 1) {
                                period = "monthly";
                                installment_type = 1;
                            }
                            else {
                                period = "yearly";
                                installment_type = 2;
                            }
                            if (total_member_number == "M") {
                                sum_insured = 5000000;
                                premium = 208000;
                                last_expense_insured = 2000000;
                                members = "other";
                                if (paymentOption == 1) {
                                    premium = 18000;
                                    yearly_premium = 208000;
                                    last_expense_insured = 2000000;
                                }
                            }
                            else if (total_member_number == "M+1") {
                                sum_insured = 5000000;
                                premium = 400000;
                                last_expense_insured = 2000000;
                                members = "You and 1 dependent";
                                if (paymentOption == 1) {
                                    premium = 35000;
                                    yearly_premium = 400000;
                                    last_expense_insured = 2000000;
                                }
                            }
                            else if (total_member_number == "M+2") {
                                sum_insured = 5000000;
                                premium = 577000;
                                last_expense_insured = 2000000;
                                members = "You and 2 dependent";
                                if (paymentOption == 1) {
                                    period = "monthly";
                                    premium = 50000;
                                    yearly_premium = 577000;
                                    last_expense_insured = 2000000;
                                }
                            }
                            else if (total_member_number == "M+3") {
                                sum_insured = 5000000;
                                premium = 740000;
                                last_expense_insured = 2000000;
                                members = "You and 3 dependent";
                                if (paymentOption == 1) {
                                    premium = 65000;
                                    yearly_premium = 740000;
                                    last_expense_insured = 2000000;
                                }
                            }
                            else if (total_member_number == "M+4") {
                                sum_insured = 5000000;
                                premium = 885000;
                                last_expense_insured = 2000000;
                                members = "You and 4 dependent";
                                if (paymentOption == 1) {
                                    premium = 77000;
                                    yearly_premium = 885000;
                                    last_expense_insured = 2000000;
                                }
                            }
                            else if (total_member_number == "M+5") {
                                sum_insured = 5000000;
                                premium = 1060000;
                                last_expense_insured = 2000000;
                                members = "You and 5 dependent";
                                if (paymentOption == 1) {
                                    period = "monthly";
                                    premium = 93000;
                                    yearly_premium = 1060000;
                                    last_expense_insured = 2000000;
                                }
                            }
                            else if (total_member_number == "M+6") {
                                sum_insured = 5000000;
                                premium = 1238000;
                                last_expense_insured = 2000000;
                                if (paymentOption == 1) {
                                    period = "monthly";
                                    premium = 108000;
                                    yearly_premium = 1238000;
                                    last_expense_insured = 2000000;
                                }
                            }
                            else {
                                sum_insured = 5000000;
                                premium = 400000;
                                last_expense_insured = 2000000;
                                members = "You";
                                if (paymentOption == 1) {
                                    period = "monthly";
                                    premium = 35000;
                                    yearly_premium = 400000;
                                    last_expense_insured = 2000000;
                                }
                            }
                        }
                        else {
                            menu.end("Invalid option");
                        }
                        let policy_end_date = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
                        // minus 1 day
                        policy_end_date.setDate(policy_end_date.getDate() - 1);
                        yield Policy.update({
                            policy_type: policy_type,
                            policy_deduction_amount: premium,
                            policy_pending_premium: premium,
                            sum_insured: sum_insured,
                            premium: premium,
                            installment_type: installment_type,
                            installment_order: 1,
                            last_expense_insured: last_expense_insured,
                            policy_start_date: new Date(),
                            policy_end_date: policy_end_date,
                        }, { where: { user_id: user_id } });
                        let paymentStatus = yield (0, payment_1.airtelMoney)(user_id, partner_id, policy_id, phone_number, premium, membership_id, "UG", "UGX");
                        //let paymentStatus =  await initiateConsent(newPolicy.policy_type,newPolicy.policy_start_date, newPolicy.policy_end_date, phone_number, newPolicy.policy_deduction_amount , newPolicy.premium)
                        let members_covered, congratSms, congratText, frequency = "monthly";
                        if (paymentOption == 1) {
                            frequency = "month";
                        }
                        else {
                            frequency = "year";
                        }
                        if (beneficiary == "FAMILY") {
                            members_covered = "Your family";
                            congratSms = `Congratulations! Your family is now covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                  Cover valid till ${policy_end_date.toDateString()}.`;
                            congratText = `Congratulations! ${members} are each covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                   Cover valid till ${policy_end_date.toDateString()} `;
                        }
                        else if (beneficiary == "OTHERS") {
                            members_covered = members;
                            congratSms = `Congratulations! You have bought cover for ${otherMember === null || otherMember === void 0 ? void 0 : otherMember.name.toUpperCase()} for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                  Cover valid till ${policy_end_date.toDateString()}.  `;
                            congratText = `Congratulations! You have  bought Mini cover for ${otherMember === null || otherMember === void 0 ? void 0 : otherMember.name.toUpperCase()} . 
                  Pay UGX ${premium} every ${frequency} to stay covered`;
                        }
                        else {
                            members_covered = "You";
                            congratSms = `Congratulations! You are now covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                  Cover valid till ${policy_end_date.toDateString()}`;
                            congratText = `Congratulations! You bought Mini cover for Inpatient (UGX ${si}) and Funeral (UGX ${lei}) for a year. 
                  Pay UGX ${premium} every ${frequency} to stay covered`;
                        }
                        console.log("PAYMENT STATUS", paymentStatus);
                        if (paymentStatus.code === 200) {
                            yield user.update({
                                cover_type: null,
                                total_member_number: null,
                            });
                            yield (0, sendSMS_1.default)(phone_number, congratSms);
                            menu.end(congratText);
                        }
                        else {
                            menu.end(`Sorry, your payment was not successful. 
                      \n0. Back \n00. Main Menu`);
                        }
                    }
                    catch (error) {
                        console.error("Confirmation Error:", error);
                        menu.end("An error occurred. Please try again later.");
                    }
                }),
            });
            (0, myAccount_1.myAccount)(menu, args, db);
            //=================BUY FOR OTHERS=================
            //buyForOthers
            menu.state("buyForOthers", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log("* BUY FOR OTHERS", user.phone_number);
                    menu.con("Buy for others " +
                        "\n1. Other " +
                        "\n2. Other + Spouse or Child" +
                        "\n3. Other + Spouse + 1 Children" +
                        "\n01. Next" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "1": "buyForOthers.member",
                    "2": "buyForOthers.member",
                    "3": "buyForOthers.member",
                    "01": "buyForOthers.next",
                    "0": "account",
                },
            });
            menu.state("buyForOthers.next", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Buy for others " +
                        "\n4. Other + Spouse + 2 Children" +
                        "\n5. Other + Spouse + 3 Children" +
                        "\n6. Other + Spouse + 4 Children" +
                        "\n7. Other + Spouse + 5 Children" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "4": "buyForOthers.member",
                    "5": "buyForOthers.member",
                    "6": "buyForOthers.member",
                    "7": "buyForOthers.member",
                    "0": "buyForOthers",
                    "00": "insurance",
                },
            });
            menu.state("buyForOthers.member", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let member_number = menu.val.toString();
                    console.log("MEMBER NUMBER", member_number);
                    if (member_number == "1") {
                        member_number = "M";
                    }
                    else if (member_number == "2") {
                        member_number = "M+1";
                    }
                    else if (member_number == "3") {
                        member_number = "M+2";
                    }
                    else if (member_number == "4") {
                        member_number = "M+3";
                    }
                    else if (member_number == "5") {
                        member_number = "M+4";
                    }
                    else if (member_number == "6") {
                        member_number = "M+5";
                    }
                    else if (member_number == "7") {
                        member_number = "M+6";
                    }
                    else {
                        menu.end("Invalid option");
                    }
                    yield User.update({ total_member_number: member_number }, { where: { phone_number: args.phoneNumber } });
                    if (member_number == "M") {
                        menu.con("Buy for Other" +
                            "\n1. Mini – UGX 10,000" +
                            "\n2. Midi - UGX 14,000" +
                            "\n3. Biggie – UGX 18,000" +
                            "\n0.Back" +
                            "\n00.Main Menu");
                    }
                    else if (member_number == "M+1") {
                        menu.con(`
              1. Mini – UGX 20,000
              2. Midi – UGX 28,000
              3. Biggie – UGX 35,000
              0. Back
              00. Main Menu`);
                    }
                    else if (member_number == "M+2") {
                        menu.con(`
              1. Mini – UGX 30,000
              2. Midi – UGX 40,000
              3. Biggie – UGX 50,000
              0. Back
              00. Main Menu`);
                    }
                    else if (member_number == "M+3") {
                        menu.con(`
              1. Mini – UGX 40,000
              2. Midi – UGX 50,000
              3. Biggie – UGX 65,000
              0. Back
              00. Main Menu`);
                    }
                    else if (member_number == "M+4") {
                        menu.con(`
              1. Mini – UGX 50,000
              2. Midi – UGX 63,000
              3. Biggie – UGX 77,000
              0. Back
              00. Main Menu`);
                    }
                    else if (member_number == "M+5") {
                        menu.con(`
              1. Mini – UGX 60,000
              2. Midi – UGX 75,000
              3. Biggie – UGX 93,000
              0. Back
              00. Main Menu`);
                    }
                    else if (member_number == "M+6") {
                        menu.con(`
              1. Mini – UGX 70,000
              2. Midi – UGX 88,000
              3. Biggie – UGX 108,000
              0. Back
              00. Main Menu`);
                    }
                    else {
                        menu.end("Invalid option");
                    }
                }),
                next: {
                    "*\\d+": "buyForOthers.coverType",
                    "0": "account",
                    "00": "insurance",
                },
            });
            //ask for phone number and name of person to buy for
            menu.state("buyForOthers.coverType", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let coverType = menu.val.toString();
                    console.log("COVER TYPE", coverType);
                    let { user_id, partner_id, total_member_number } = user;
                    let date = new Date();
                    let day = date.getDate() - 1;
                    if (coverType == "1") {
                        coverType = "MINI";
                    }
                    else if (coverType == "2") {
                        coverType = "MIDI";
                    }
                    else if (coverType == "3") {
                        coverType = "BIGGIE";
                    }
                    yield Policy.create({
                        user_id: user_id,
                        policy_id: (0, uuid_1.v4)(),
                        policy_type: coverType,
                        beneficiary: "OTHERS",
                        policy_status: "pending",
                        policy_start_date: new Date(),
                        policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                        policy_deduction_day: day * 1,
                        partner_id: partner_id,
                        country_code: "UGA",
                        currency_code: "UGX",
                        product_id: "d18424d6-5316-4e12-9826-302b866a380c",
                    });
                    yield User.update({ cover_type: coverType }, { where: { phone_number: args.phoneNumber } });
                    console.log("TOTAL MEMBER NUMBER", total_member_number);
                    menu.con("\nEnter atleast Name of spouse or 1 child" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "*[a-zA-Z]+": "buyForOthersName",
                },
            });
            menu.state("buyForOthersName", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let name = menu.val;
                    console.log("NAME", name);
                    menu.con("Enter Phone number for Other");
                }),
                next: {
                    "*\\d+": "buyForOthersPhoneNumber",
                },
            });
            menu.state("buyForOthersPhoneNumber", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let otherPhone = menu.val;
                    console.log("SPOUSE Phone", otherPhone);
                    //uganda phone number validation
                    if (otherPhone.charAt(0) == "0") {
                        otherPhone = otherPhone.substring(1);
                    }
                    if (otherPhone.charAt(0) == "+") {
                        otherPhone = otherPhone.substring(1);
                    }
                    if (otherPhone.charAt(0) == "256") {
                        otherPhone = otherPhone.substring(3);
                    }
                    if (otherPhone.length != 9) {
                        menu.con("Invalid Phone Number, please try again");
                        return;
                    }
                    // second last input text
                    let otherName = menu.args.text.split("*")[menu.args.text.split("*").length - 2];
                    let uniqueId = (0, uuid_1.v4)();
                    const newUser = yield User.create({
                        user_id: uniqueId,
                        name: otherName,
                        first_name: otherName.split(" ")[0],
                        middle_name: otherName.split(" ")[1],
                        last_name: otherName.split(" ")[2] || otherName.split(" ")[1],
                        password: yield bcrypt_1.default.hash(`${otherName}`, 10),
                        createdAt: new Date(),
                        membership_id: Math.floor(100000 + Math.random() * 900000),
                        pin: Math.floor(1000 + Math.random() * 9000),
                        nationality: "UGANDA",
                        phone_number: otherPhone,
                        role: "user",
                        partner_id: user.partner_id,
                    });
                    console.log("NEW USER", newUser);
                    const message = `Dear ${newUser.first_name}, Welcome to Ddwaliro Care. Membership ID: ${newUser.membership_id} and Ddwaliro PIN: ${newUser.pin}. Dial *187*7*6# to access your account.`;
                    yield (0, sendSMS_1.default)(otherPhone, message);
                    let otherPolicy = yield Policy.findOne({
                        where: { user_id: user === null || user === void 0 ? void 0 : user.user_id, beneficiary: "OTHERS" },
                    });
                    console.log("OTHER POLICY", otherPolicy);
                    otherPolicy.bought_for = newUser.user_id;
                    yield otherPolicy.save();
                    const { user_id, phone_number, first_name, last_name, total_member_number, } = user;
                    console.log(" ========= USER total_member_number========", total_member_number);
                    const { policy_type, beneficiary, bought_for } = otherPolicy;
                    console.log(" ========= USER policy_type========", policy_type, beneficiary, bought_for);
                    let sum_insured, period, installment_type, si, premium = 0, yearly_premium = 0, last_expense_insured = 0, lei;
                    let paymentOption = 1;
                    if (policy_type == "MINI") {
                        lei = "1M";
                        si = "1.5M";
                        if (paymentOption == 1) {
                            period = "monthly";
                            installment_type = 1;
                        }
                        else {
                            period = "yearly";
                            installment_type = 2;
                        }
                        if (total_member_number == "M") {
                            sum_insured = 1500000;
                            premium = 120000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 10000;
                                yearly_premium = 240000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+1") {
                            sum_insured = 1500000;
                            premium = 240000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 20000;
                                yearly_premium = 240000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+2") {
                            sum_insured = 1500000;
                            premium = 360000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 30000;
                                yearly_premium = 360000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+3") {
                            sum_insured = 1500000;
                            premium = 480000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                premium = 40000;
                                yearly_premium = 480000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+4") {
                            sum_insured = 1500000;
                            premium = 600000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 50000;
                                yearly_premium = 600000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+5") {
                            sum_insured = 1500000;
                            premium = 720000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 60000;
                                yearly_premium = 7200000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else if (total_member_number == "M+6") {
                            sum_insured = 1500000;
                            premium = 840000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 70000;
                                yearly_premium = 840000;
                                last_expense_insured = 1000000;
                            }
                        }
                        else {
                            sum_insured = 1500000;
                            premium = 240000;
                            last_expense_insured = 1000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 20000;
                                yearly_premium = 240000;
                                last_expense_insured = 1000000;
                            }
                        }
                    }
                    else if (policy_type == "MIDI") {
                        si = "3M";
                        lei = "1.5M";
                        if (paymentOption == 1) {
                            period = "monthly";
                            installment_type = 1;
                        }
                        else {
                            period = "yearly";
                            installment_type = 2;
                        }
                        if (total_member_number == "M") {
                            sum_insured = 3000000;
                            premium = 167000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 14000;
                                yearly_premium = 167000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+1") {
                            sum_insured = 3000000;
                            premium = 322000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 28000;
                                yearly_premium = 322000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+2") {
                            sum_insured = 3000000;
                            premium = 467000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 40000;
                                yearly_premium = 467000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+3") {
                            sum_insured = 3000000;
                            premium = 590000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 50000;
                                yearly_premium = 590000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+4") {
                            sum_insured = 3000000;
                            premium = 720000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 63000;
                                yearly_premium = 720000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+5") {
                            sum_insured = 3000000;
                            premium = 860000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 75000;
                                yearly_premium = 860000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else if (total_member_number == "M+6") {
                            sum_insured = 3000000;
                            premium = 1010000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 88000;
                                yearly_premium = 1010000;
                                last_expense_insured = 1500000;
                            }
                        }
                        else {
                            sum_insured = 3000000;
                            premium = 322000;
                            last_expense_insured = 1500000;
                            if (paymentOption == 1) {
                                premium = 28000;
                                yearly_premium = 322000;
                                last_expense_insured = 1500000;
                            }
                        }
                    }
                    else if (policy_type == "BIGGIE") {
                        si = "5M";
                        lei = "2M";
                        if (paymentOption == 1) {
                            period = "monthly";
                            installment_type = 1;
                        }
                        else {
                            period = "yearly";
                            installment_type = 2;
                        }
                        if (total_member_number == "M") {
                            sum_insured = 5000000;
                            premium = 208000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 18000;
                                yearly_premium = 208000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+1") {
                            sum_insured = 5000000;
                            premium = 400000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 35000;
                                yearly_premium = 400000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+2") {
                            sum_insured = 5000000;
                            premium = 577000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 50000;
                                yearly_premium = 577000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+3") {
                            sum_insured = 5000000;
                            premium = 740000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 65000;
                                yearly_premium = 740000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+4") {
                            sum_insured = 5000000;
                            premium = 885000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                premium = 77000;
                                yearly_premium = 885000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+5") {
                            sum_insured = 5000000;
                            premium = 1060000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 93000;
                                yearly_premium = 1060000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else if (total_member_number == "M+6") {
                            sum_insured = 5000000;
                            premium = 1238000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 108000;
                                yearly_premium = 1238000;
                                last_expense_insured = 2000000;
                            }
                        }
                        else {
                            sum_insured = 5000000;
                            premium = 400000;
                            last_expense_insured = 2000000;
                            if (paymentOption == 1) {
                                period = "monthly";
                                premium = 35000;
                                yearly_premium = 400000;
                                last_expense_insured = 2000000;
                            }
                        }
                    }
                    else {
                        menu.end("Invalid option");
                    }
                    console.log("SUM INSURED", sum_insured);
                    console.log("PREMIUM", premium);
                    console.log("LAST EXPENSE INSURED", last_expense_insured);
                    console.log("YEARLY PREMIUM", yearly_premium);
                    menu.con(`Inpatient Family cover for ${first_name.toUpperCase()} ${last_name.toUpperCase()} ${phone_number}, UGX ${si} 
                PAY
                1-UGX ${new Intl.NumberFormat().format(premium)} monthly
                2-UGX ${new Intl.NumberFormat().format(yearly_premium)} yearly
                0.Back
                00.Main Menu`);
                }),
                next: {
                    "*\\d+": "buyForFamilyPin",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //================MY ACCOUNT===================
            menu.state("myAccount", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log("* MY ACCOUNT ", user.phone_number);
                    menu.con("My Account" +
                        "\n1. Policy Status" +
                        "\n2. Pay Now" +
                        "\n3. Renew Policy" +
                        "\n4. Update My Profile (KYC)" +
                        "\n5. Cancel Policy" +
                        "\n6. Add Dependant" +
                        "\n7. My Hospital" +
                        "\n0. Back" +
                        "\n00. Main Menu");
                }),
                next: {
                    "1": "myInsurancePolicy",
                    "2": "payNow",
                    "3": "renewPolicy",
                    "4": "updateProfile",
                    "5": "cancelPolicy",
                    "6": "addDependant",
                    "7": "myHospitalOption",
                    "0": "account",
                    "00": "account",
                },
            });
            //update profile ( user dob and gender)
            menu.state("updateProfile", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log("Update Profile");
                    menu.con(`What's your gender?
        1. Male
        2. Female
        0. Back
        00. Main Menu`);
                }),
                next: {
                    "1": "updateGender",
                    "2": "updateGender",
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("updateGender", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const gender = menu.val === "1" ? "M" : "F";
                    const user = yield User.update({ gender }, { where: { phone_number: args.phoneNumber } });
                    console.log("Updated user:", user);
                    menu.con(`Enter your date of birth in the format DDMMYYYY (e.g., 01011990):
  0. Back
  00. Main Menu`);
                }),
                next: {
                    "*\\d{8}": "updateDob",
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("updateDob", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let dob = menu.val;
                    console.log("Input Date of Birth:", dob);
                    // Remove all non-numeric characters
                    dob = dob.replace(/\D/g, "");
                    console.log("Cleaned Date of Birth:", dob);
                    // Convert DDMMYYYY to a valid date
                    let day = parseInt(dob.substring(0, 2));
                    let month = parseInt(dob.substring(2, 4));
                    let year = parseInt(dob.substring(4, 8));
                    let date = new Date(year, month - 1, day);
                    console.log("Parsed Date of Birth:", date);
                    const user = yield User.update({
                        dob: date,
                    }, {
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    console.log("User DOB Update:", user);
                    menu.con(`Enter your marital status
        1. Single
        2. Married
        3. Divorced
        4. Widowed
        0. Back
        00. Main Menu`);
                }),
                next: {
                    "*[0-9]": "updateMaritalStatus",
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("updateMaritalStatus", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const { gender, first_name } = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    const ben_marital_status = getMenuOption(menu.val);
                    const title = getTitle(ben_marital_status, gender);
                    console.log("ben_marital_status", ben_marital_status);
                    const user = yield User.update({
                        marital_status: ben_marital_status,
                        title: title,
                    }, {
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    console.log("User Marital Status Update:", user);
                    // Send SMS
                    const message = `Dear ${title} ${first_name}, your profile has been updated successfully`;
                    yield (0, sendSMS_1.default)(args.phoneNumber, message);
                    menu.con(`Your profile has been updated successfully
        0. Back
        00. Main Menu`);
                }),
                next: {
                    "0": "account",
                    "00": "account",
                },
            });
            function getMenuOption(val) {
                const options = {
                    "1": "single",
                    "2": "married",
                    "3": "divorced",
                    "4": "widowed",
                };
                return options[val] || "";
            }
            function getTitle(maritalStatus, gender) {
                let title = gender === "M" ? "Mr" : "Ms";
                if (maritalStatus === "married") {
                    title = gender === "M" ? "Mr" : "Mrs";
                }
                return title;
            }
            // ======= ADD SPOUSE DEPENDANT =========
            menu.state("addDependant", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Add Dependant " +
                        "\n1. Update Spouse" +
                        "\n2. Add Child" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "1": "updateSpouse",
                    "2": "addChild",
                    "0": "myAccount",
                    "00": "account",
                },
            });
            menu.state("updateSpouse", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Enter gender of spouse: " + "\n1. Male" + "\n2. Female");
                }),
                next: {
                    "*[0-9]": "updateBeneficiaryGender",
                },
            });
            menu.state("updateBeneficiaryGender", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const gender = menu.val.toString() == "1" ? "M" : "F";
                    console.log("GENDER", gender);
                    let beneficiary = yield Beneficiary.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            relationship: "SPOUSE",
                        },
                    });
                    if (!beneficiary) {
                        return menu.end("You have not added a spouse, please buy family cover first");
                    }
                    console.log("BENEFICIARY: ", beneficiary);
                    beneficiary.gender = gender;
                    yield beneficiary.save();
                    console.log("USER: ", user);
                    menu.con(`Enter your spouse's date of birth in the format DDMMYYYY e.g 01011990
            0. Back
            00. Main Menu
             `);
                }),
                next: {
                    "*[0-9]": "updateBeneficiaryDob",
                    "0": "myAccount",
                    "00": "account",
                },
            });
            menu.state("updateBeneficiaryDob", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const spouse_dob = menu.val;
                    // convert ddmmyyyy to valid date
                    let day = spouse_dob.substring(0, 2);
                    let month = spouse_dob.substring(2, 4);
                    let year = spouse_dob.substring(4, 8);
                    let date = new Date(Number(year), Number(month) - 1, Number(day));
                    console.log("DATE OF BIRTH", date);
                    let beneficiary = yield Beneficiary.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            relationship: "SPOUSE",
                        },
                    });
                    beneficiary.dob = date;
                    beneficiary.age = new Date().getFullYear() - date.getFullYear();
                    yield beneficiary.save();
                    console.log("BENEFICIARY: ", beneficiary);
                    const policy = yield Policy.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            beneficiary: "FAMILY",
                        },
                    });
                    console.log("POLICY: ", policy);
                    let arr_member = yield (0, aar_1.fetchMemberStatusData)({
                        member_no: user.arr_member_number,
                        unique_profile_id: user.membership_id + "",
                    });
                    console.log("arr_member", arr_member);
                    if (arr_member.code == 200) {
                        yield (0, aar_1.registerDependant)({
                            member_no: user.arr_member_number,
                            surname: beneficiary.last_name,
                            first_name: beneficiary.first_name,
                            other_names: beneficiary.middle_name || beneficiary.last_name,
                            gender: beneficiary.gender == "M" ? "1" : "2",
                            dob: date.toISOString().split("T")[0],
                            email: "dependant@bluewave.insure",
                            pri_dep: "25",
                            family_title: "4",
                            tel_no: beneficiary.phone_number,
                            next_of_kin: {
                                surname: "",
                                first_name: "",
                                other_names: "",
                                tel_no: "",
                            },
                            member_status: "1",
                            health_option: "63",
                            health_plan: "AIRTEL_" + (policy === null || policy === void 0 ? void 0 : policy.policy_type),
                            policy_start_date: policy.policy_start_date,
                            policy_end_date: policy.policy_end_date,
                            unique_profile_id: user.membership_id + "-01",
                        });
                    }
                    menu.con(`Your spouse ${beneficiary.full_name} profile has been updated successfully
                0. Back
                00. Main Menu
                 `);
                }),
                next: {
                    "0": "myAccount",
                    "00": "account",
                },
            });
            // ======= ADD CHILD DEPENDANT =========
            menu.state("addChild", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Enter child's name: ");
                }),
                next: {
                    "*[a-zA-Z]": "addChildGender",
                },
            });
            menu.state("addChildGender", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let child_name = menu.val;
                    console.log("CHILD NAME", child_name);
                    let beneficiary = yield Beneficiary.findAll({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            relationship: "CHILD",
                        },
                    });
                    console.log("BENEFICIARY CHILD GENDER: ", beneficiary);
                    let newChildDep = yield Beneficiary.create({
                        beneficiary_id: (0, uuid_1.v4)(),
                        user_id: user === null || user === void 0 ? void 0 : user.user_id,
                        full_name: child_name,
                        first_name: child_name.split(" ")[0],
                        middle_name: child_name.split(" ")[1],
                        last_name: child_name.split(" ")[2] || child_name.split(" ")[1],
                        relationship: "CHILD",
                    });
                    console.log("NEW CHILD BENEFICIARY: ", newChildDep);
                    menu.con("Enter gender of child: " + "\n1. Male" + "\n2. Female");
                }),
                next: {
                    "*[0-9]": "updateChildGender",
                },
            });
            menu.state("updateChildGender", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const gender = menu.val.toString() == "1" ? "M" : "F";
                    console.log("GENDER", gender);
                    let beneficiary = yield Beneficiary.findAll({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            relationship: "CHILD",
                        },
                    });
                    beneficiary = beneficiary[beneficiary.length - 1];
                    if (!beneficiary) {
                        return menu.end("You have not added a spouse, please buy family cover first");
                    }
                    console.log("BENEFICIARY: ", beneficiary);
                    beneficiary.gender = gender;
                    yield beneficiary.save();
                    console.log("USER: ", user);
                    menu.con(`Enter child's date of birth in the format DDMMYYYY e.g 01011990`);
                }),
                next: {
                    "*[0-9]": "addChildDob",
                    "0": "myAccount",
                    "00": "account",
                },
            });
            menu.state("addChildDob", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let child_dob = menu.val;
                    console.log("CHILD DOB", child_dob);
                    // convert ddmmyyyy to valid date
                    let day = child_dob.substring(0, 2);
                    let month = child_dob.substring(2, 4);
                    let year = child_dob.substring(4, 8);
                    let date = new Date(Number(year), Number(month) - 1, Number(day));
                    console.log("DATE OF BIRTH", date);
                    const user = yield (0, getAirtelUser_1.getUserByPhoneNumber)(args.phoneNumber, 2);
                    let beneficiary = yield Beneficiary.findAll({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            relationship: "CHILD",
                        },
                    });
                    console.log("CHILD DOB BENEFICIARY: ", beneficiary);
                    beneficiary = beneficiary[beneficiary.length - 1];
                    beneficiary.dob = date;
                    beneficiary.age = new Date().getFullYear() - date.getFullYear();
                    yield beneficiary.save();
                    console.log("BENEFICIARY: ", beneficiary);
                    const policy = yield Policy.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            beneficiary: "FAMILY",
                        },
                    });
                    console.log("POLICY: ", policy);
                    let arr_member = yield (0, aar_1.fetchMemberStatusData)({
                        member_no: user.arr_member_number,
                        unique_profile_id: user.membership_id + "",
                    });
                    console.log("arr_member", arr_member);
                    let arr_dep_reg;
                    if (arr_member.code == 200) {
                        arr_dep_reg = yield (0, aar_1.registerDependant)({
                            member_no: user.arr_member_number,
                            surname: beneficiary.last_name,
                            first_name: beneficiary.first_name,
                            other_names: beneficiary.middle_name || beneficiary.last_name,
                            gender: beneficiary.gender == "M" ? "1" : "2",
                            dob: date.toISOString().split("T")[0],
                            email: "dependant@bluewave.insure",
                            pri_dep: "25",
                            family_title: "25",
                            tel_no: user.phone_number,
                            next_of_kin: {
                                surname: "",
                                first_name: "",
                                other_names: "",
                                tel_no: "",
                            },
                            member_status: "1",
                            health_option: "63",
                            health_plan: "AIRTEL_" + (policy === null || policy === void 0 ? void 0 : policy.policy_type),
                            policy_start_date: policy.policy_start_date,
                            policy_end_date: policy.policy_end_date,
                            unique_profile_id: user.membership_id + "-02",
                        });
                        beneficiary.dependant_member_number = arr_dep_reg.member_no;
                        yield beneficiary.save();
                    }
                    menu.con(`Your child ${beneficiary.full_name} profile has been updated successfully
                0. Back
                00. Main Menu
                 `);
                }),
                next: {
                    "0": "myAccount",
                    "00": "account",
                },
            });
            //============CANCEL POLICY=================
            menu.state("cancelPolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    if (user) {
                        const policy = user_policy || (yield findPolicyByUser(user.user_id));
                        console.log("POLICY: ", policy);
                        if (policy) {
                            // 1. Cancel Policy
                            menu.con(`Hospital cover ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
                                // `   Inpatient limit: UGX ${policy.sum_insured}\n` +
                                // `   Remaining: UGX ${policy.sum_insured}\n` +
                                // `   Last Expense Per Person Benefit: ${policy.last_expense_insured}\n\n` +
                                "\n1. Cancel Policy");
                        }
                        else {
                            menu.con("Your policy is INACTIVE\n0 Buy cover");
                        }
                    }
                    else {
                        menu.end("User not found");
                    }
                }),
                next: {
                    "0": "account",
                    "1": "cancelPolicyPin",
                },
            });
            //cancel policy pin
            menu.state("cancelPolicyPin", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const policy = yield Policy.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                        },
                    });
                    let today = new Date();
                    console.log("POLICY: ", policy);
                    menu.con(`By cancelling, you will no longer be covered for ${policy.policy_type.toUpperCase()} Insurance as of ${today}.
            '\nEnter PIN or Membership ID to  Confirm cancellation
                0.Back
                00.Main Menu`);
                }),
                next: {
                    "*[0-9]": "cancelPolicyConfirm",
                },
            });
            //cancel policy confirm
            menu.state("cancelPolicyConfirm", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const to = args.phoneNumber;
                    let today = new Date();
                    let policy;
                    if (user) {
                        policy = yield Policy.findOne({
                            where: {
                                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            },
                        });
                    }
                    console.log("POLICY: ", policy);
                    if (policy) {
                        // 1. Cancel Policy
                        policy.policy_status = "cancelled";
                        policy.policy_end_date = today;
                        yield policy.save();
                    }
                    const message = `You CANCELLED your Medical cover cover. Your Policy will expire on ${today} and you will not be covered. Dial *187*7*1# to reactivate.`;
                    const sms = yield (0, sendSMS_1.default)(to, message);
                    menu.con(`Your policy will expire on ${today}  and will not be renewed. Dial *185*7*6# to reactivate.
            0.Back     00.Main Menu`);
                }),
                next: {
                    "0": "myAccount",
                    "00": "account",
                },
            });
            //my insurance policy
            menu.state("myInsurancePolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let policies = yield Policy.findAll({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                        },
                    });
                    console.log("====USER ===  ", user === null || user === void 0 ? void 0 : user.user_id);
                    let otherPolicies = yield Policy.findAll({
                        where: {
                            bought_for: user === null || user === void 0 ? void 0 : user.user_id,
                        },
                    });
                    console.log("OTHER POLICIES: ", otherPolicies);
                    policies = policies.concat(otherPolicies);
                    console.log("POLICIES: ", policies);
                    function formatNumberToM(value) {
                        return (value / 1000000).toFixed(1) + "M";
                    }
                    if (policies.length === 0) {
                        menu.con("You have no policies\n" +
                            "1. Buy cover\n" +
                            "0. Back\n" +
                            "00. Main Menu");
                        return;
                    }
                    let policyInfo = "";
                    for (let i = 0; i < policies.length; i++) {
                        let policy = policies[i];
                        //         Bronze cover ACTIVE up to DD/MM/YYYY
                        // Inpatient limit L: UGX 3,000,000. Balance remaining UGX 2,300,000
                        //format date to dd/mm/yyyy
                        let formatDate = (date) => {
                            const dd = String(date.getDate()).padStart(2, "0");
                            const mm = String(date.getMonth() + 1).padStart(2, "0");
                            const yyyy = date.getFullYear();
                            return `${dd}/${mm}/${yyyy}`;
                        };
                        policy.policy_end_date = formatDate(policy.policy_end_date);
                        policyInfo += ` Dwaliro Inpatient UGX ${formatNumberToM(policy.sum_insured)} and Funeral benefit UGX ${formatNumberToM(policy.last_expense_insured)} is active and paid to ${policy.policy_end_date.toDateString()}.
        `;
                    }
                    policyInfo += "Dial *185*7*6# to renew";
                    policyInfo += "\n0. Back\n00. Main Menu";
                    menu.end(`My Insurance Policies:\n\n${policyInfo}`);
                }),
                next: {
                    "1": "account",
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("manageAutoRenew", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Manage auto-renew " +
                        "\n1. Activate auto-renew" +
                        "\n2. Deactivate auto-renew" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
            });
            //renewPolicy
            menu.state("renewPolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const policy = yield Policy.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            installment: "2",
                        },
                    });
                    console.log("POLICY: ", policy);
                    if (!policy) {
                        menu.con("You have no policy to renew\n1. Buy cover\n0. Back\n00. Main Menu");
                        return;
                    }
                    menu.con(`Your ${policy.policy_type.toUpperCase()} cover expires on ${policy.policy_end_date.toDateString()}.\n` +
                        `   Pending amount : UGX ${policy.policy_pending_premium}\n` +
                        "\n1. Renew Policy");
                }),
                next: {
                    "1": "renewPolicyPin",
                    "0": "myAccount",
                    "00": "account",
                },
            });
            //================== MAKE CLAIM ===================
            menu.state("makeClaim", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log("* MAKE CLAIM", args.phoneNumber);
                    menu.con("Make Claim " +
                        "\n1. Inpatient Claim" +
                        "\n2. Death Claim" +
                        "\n0. Back" +
                        "\n00. Main Menu");
                }),
                next: {
                    "1": "inpatientClaim",
                    "2": "deathClaim",
                    "0": "account",
                    "00": "insurance",
                },
            });
            //==================INPATIENT CLAIM===================
            menu.state("inpatientClaim", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let claim_type = menu.val.toString();
                    let user = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    console.log("USER", user);
                    const { policy_id, policy_type, beneficiary, sum_insured, last_expense_insured, } = yield Policy.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            policy_status: "paid",
                        },
                    });
                    const claimId = (0, utils_1.generateClaimId)();
                    console.log(claimId);
                    let claim_amount;
                    if (claim_type == "1") {
                        claim_type = "Inpatient Claim";
                        claim_amount = sum_insured;
                    }
                    else {
                        claim_type = "Death Claim";
                        claim_amount = last_expense_insured;
                    }
                    let userClaim = yield Claim.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            claim_type: claim_type,
                            claim_status: "paid",
                        },
                    });
                    if (userClaim) {
                        menu.end(`Discharge Claim already made for this policy`);
                        return;
                    }
                    const newClaim = yield Claim.create({
                        claim_number: claimId,
                        policy_id: policy_id,
                        user_id: user === null || user === void 0 ? void 0 : user.user_id,
                        claim_date: new Date(),
                        claim_status: "pending",
                        partner_id: user.partner_id,
                        claim_description: `${claim_type} ID: ${claimId} for Member ID: ${user.membership_id}  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} policy`,
                        claim_type: claim_type,
                        claim_amount: claim_amount,
                    });
                    console.log("CLAIM", newClaim);
                    menu.end(`Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service`);
                }),
                next: {
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("deathClaim", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con(`Enter phone of next of Kin `);
                }),
                next: {
                    "*\\d+": "deathClaimPhoneNumber",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("deathClaimPhoneNumber", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const nextOfKinPhoneNumber = menu.val;
                    const nextOfKin = yield Beneficiary.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            beneficiary_type: "NEXTOFKIN",
                        },
                    });
                    const newKin = yield Beneficiary.create({
                        beneficiary_id: (0, uuid_1.v4)(),
                        user_id: user === null || user === void 0 ? void 0 : user.user_id,
                        phone_number: nextOfKinPhoneNumber,
                        beneficiary_type: "NEXTOFKIN",
                    });
                    console.log("NEXT OF KIN PHONE NUMBER", nextOfKinPhoneNumber);
                    console.log("NEW KIN", newKin);
                    menu.con(`Enter Name of deceased
                    0.Back 00.Main Menu  `);
                }),
                next: {
                    "*\\w+": "deathClaimName",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("deathClaimName", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const deceasedName = menu.val;
                    console.log("DECEASED NAME", deceasedName);
                    const firstName = deceasedName.split(" ")[0];
                    const middleName = deceasedName.split(" ")[1];
                    const lastName = deceasedName.split(" ")[2] || deceasedName.split(" ")[1];
                    yield Beneficiary.update({
                        full_name: deceasedName,
                        first_name: firstName,
                        middle_name: middleName,
                        last_name: lastName,
                    }, { where: { user_id: user === null || user === void 0 ? void 0 : user.user_id, beneficiary_type: "NEXTOFKIN" } });
                    menu.con(`Enter your Relationship to the deceased
                   0.Back 00.Main Menu `);
                }),
                next: {
                    "*\\w+": "deathClaimRelationship",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("deathClaimRelationship", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const relationship = menu.val;
                    console.log("RELATIONSHIP", relationship);
                    yield Beneficiary.update({ relationship: relationship }, { where: { user_id: user === null || user === void 0 ? void 0 : user.user_id, beneficiary_type: "NEXTOFKIN" } });
                    menu.con(`Enter Date of death in the format DDMMYYYY e.g 01011990"


          0.Back 00.Main Menu
           `);
                }),
                next: {
                    "*\\w+": "deathClaimDate",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("deathClaimDate", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let dateOfDeath = menu.val;
                    console.log("DATE OF DEATH", dateOfDeath);
                    // convert ddmmyyyy to valid date
                    let day = dateOfDeath.substring(0, 2);
                    let month = dateOfDeath.substring(2, 4);
                    let year = dateOfDeath.substring(4, 8);
                    let date = new Date(Number(year), Number(month) - 1, Number(day));
                    console.log("date", date);
                    let thisYear = new Date().getFullYear();
                    dateOfDeath = date.toISOString().split("T")[0];
                    yield Beneficiary.update({ date_of_death: dateOfDeath, age: thisYear - date.getFullYear() }, { where: { user_id: user === null || user === void 0 ? void 0 : user.user_id, beneficiary_type: "NEXTOFKIN" } });
                    menu.con(`Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107
                   0.Back 00.Main Menu
          `);
                    const sms = `Your claim have been submitted. Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107 `;
                    yield (0, sendSMS_1.default)(user.phone_number, sms);
                }),
                next: {
                    "0": "account",
                    "00": "insurance",
                },
            });
            //==================PAY NOW===================
            menu.state("payNow", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log("* PAY NOW", args.phoneNumber);
                    if (!user) {
                        menu.end("User not found");
                        return;
                    }
                    const policy = yield findPendingPolicyByUser(user);
                    if (!policy) {
                        menu.end("You have no pending policies");
                        return;
                    }
                    const outstandingPremiumMessage = `Your outstanding premium is UGX ${policy.policy_pending_premium}`;
                    const enterPinMessage = "Enter PIN to Pay Now\n0. Back\n00. Main Menu";
                    menu.con(`${outstandingPremiumMessage}\n${enterPinMessage}`);
                }),
                next: {
                    "*\\d+": "payNowPremiumPin",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("payNowPremiumPin", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const pin = parseInt(menu.val);
                    if (isNaN(pin)) {
                        menu.end("Invalid PIN");
                        return;
                    }
                    const selectedPolicy = pending_policy || (yield findPendingPolicyByUser(user));
                    if (!selectedPolicy) {
                        menu.end("You have no pending policies");
                        return;
                    }
                    const { user_id, phone_number, partner_id, policy_id, policy_deduction_amount, membership_id, } = user;
                    let paymentStatus = yield (0, payment_1.airtelMoney)(user_id, partner_id, selectedPolicy.policy_id, phone_number, selectedPolicy.premium, membership_id, "UG", "UGX");
                    if (paymentStatus.code === 200) {
                        const message = `Paid UGX ${selectedPolicy.policy_deduction_amount} for ${selectedPolicy.policy_type.toUpperCase()} cover. Your next payment will be due on ${selectedPolicy.policy_end_date.toDateString()}`;
                        menu.end(message);
                    }
                    else {
                        menu.end("Payment failed. Please try again");
                    }
                }),
            });
            menu.state("renewPolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const bronzeLastExpenseBenefit = "UGX 1,000,000";
                    const silverLastExpenseBenefit = "UGX 1,500,000";
                    const goldLastExpenseBenefit = "UGX 2,000,000";
                    try {
                        if (user) {
                            const policies = yield Policy.findAll({
                                where: {
                                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                                },
                            });
                            if (policies.length === 0) {
                                menu.con("You have no policies\n" +
                                    "1. Buy cover\n" +
                                    "0. Back\n" +
                                    "00. Main Menu");
                                return;
                            }
                            let policyInfo = "";
                            for (let i = 0; i < policies.length; i++) {
                                let policy = policies[i];
                                let benefit;
                                switch (policy.policy_type) {
                                    case "MINI":
                                        benefit = bronzeLastExpenseBenefit;
                                        break;
                                    case "MIDI":
                                        benefit = silverLastExpenseBenefit;
                                        break;
                                    case "BIGGIE":
                                        benefit = goldLastExpenseBenefit;
                                        break;
                                    default:
                                        break;
                                }
                                policyInfo += `${i + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n`;
                                // `   Inpatient limit: UGX ${policy.sum_insured}\n` +
                                // `   Remaining: UGX ${policy.sum_insured}\n` +
                                // `   Last Expense Per Person Benefit: ${benefit}\n\n`;
                            }
                            menu.con(`Choose policy to pay for
          ${policyInfo}
          00.Main Menu`);
                        }
                    }
                    catch (error) {
                        console.error("Error:", error);
                        menu.end("An error occurred while fetching policies");
                    }
                }),
                next: {
                    "*\\d+": "choosePolicy",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("choosePolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const policyIndex = Number(menu.val) - 1;
                    try {
                        const policies = user_policy || (yield findPolicyByUser(user.user_id));
                        const selectedPolicy = policies[policyIndex];
                        if (!selectedPolicy) {
                            throw new Error("Invalid policy selection");
                        }
                        if (selectedPolicy.policy_status === "paid") {
                            console.log("Policy already paid for");
                            console.log("Policy", selectedPolicy, selectedPolicy.policy_paid_amount, selectedPolicy.premium, selectedPolicy.policy_paid_amount == selectedPolicy.premium);
                            if (selectedPolicy.policy_paid_amount == selectedPolicy.sum_insured) {
                                menu.end(`Your ${selectedPolicy.policy_type.toUpperCase()} cover is already paid for`);
                            }
                        }
                        selectedPolicy.policy_pending_premium =
                            selectedPolicy.premium - selectedPolicy.policy_paid_amount;
                        const updatedPolicy = yield selectedPolicy.save();
                        if (!updatedPolicy) {
                            menu.end("Failed to update policy");
                        }
                        const userId = user === null || user === void 0 ? void 0 : user.user_id;
                        const phoneNumber = user.phone_number;
                        const partner_id = user.partner_id;
                        const policy_id = selectedPolicy.policy_id;
                        const amount = selectedPolicy.policy_deduction_amount;
                        const reference = user.membership_id;
                        const payment = yield (0, payment_1.airtelMoney)(userId, partner_id, policy_id, phoneNumber, amount, reference, "UG", "UGX");
                        if (payment.code === 200) {
                            const message = `Your request for ${selectedPolicy.policy_type.toUpperCase()} ${selectedPolicy.beneficiary.toUpperCase()}, UGX ${selectedPolicy.premium} has been received and will be processed shortly. Please enter your Airtel Money PIN when asked.`;
                            menu.end(message);
                        }
                        else {
                            menu.end("Payment failed. Please try again");
                        }
                    }
                    catch (error) {
                        console.error("Error:", error);
                        menu.end("An error occurred while processing the payment");
                    }
                }),
            });
            //==================FAQS===================
            (0, faqs_1.displayFaqsMenu)(menu);
            //===================TERMS AND CONDITIONS===================
            (0, termsAndConditions_1.termsAndConditions)(menu, args);
            //===================CHOOSE HOSPITAL===================
            menu.state("chooseHospital", {
                run: () => {
                    console.log("* CHOOSE HOSPITAL", user.phone_number);
                    const regions = [
                        "Central Region",
                        "Western Region",
                        "Eastern Region",
                        "Karamoja Region",
                        "West Nile Region",
                        "Northern Region",
                    ];
                    let message = "Select Region\n";
                    regions.forEach((region, index) => {
                        message += `${index + 1}. ${region}\n`;
                    });
                    message += "0. Back";
                    menu.con(message);
                },
                next: {
                    "*\\d+": "chooseHospital.distict",
                    "0": "chooseHospital",
                },
            });
            menu.state("chooseHospital.distict", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const region = parseInt(menu.val);
                    const regions = [
                        "Central Region",
                        "Western Region",
                        "Eastern Region",
                        "Karamoja Region",
                        "West Nile Region",
                        "Northern Region",
                    ];
                    console.log("REGION", region, regions[region - 1]);
                    if (userHospital) {
                        yield UserHospital.update({
                            hospital_region: regions[region - 1],
                        }, {
                            where: {
                                user_id: user.user_id,
                            },
                        });
                    }
                    else {
                        yield UserHospital.create({
                            user_hospital_id: (0, uuid_1.v4)(),
                            user_id: user.user_id,
                            hospital_region: regions[region - 1],
                        });
                    }
                    const user_hospital_region = userHospital.hospital_region;
                    console.log("HOSPITAL LIST", hospitalList.length);
                    //console.log("HOSPITAL LIST", hospitalList)
                    const hospitalListByRegion = hospitalList.filter((hospital) => hospital.region === user_hospital_region);
                    console.log("HOSPITAL LIST BY REGION", hospitalListByRegion);
                    // if district exists, list district for user to choose
                    let districtList = hospitalListByRegion.map((hospital) => hospital.district);
                    districtList = [...new Set(districtList)];
                    //randomize district list
                    districtList.sort(() => Math.random() - 0.5);
                    menu.con(`Type your District to search e.g ${districtList[0]}
         0.Back 00.Main Menu`);
                }),
                next: {
                    "*\\w+": "chooseHospital.search",
                    "0": "chooseHospital",
                },
            });
            menu.state("chooseHospital.search", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const district = menu.val;
                    console.log("DISTRICT val", district);
                    const user_hospital_region = userHospital.hospital_region;
                    const hospitalListByRegion = hospitalList.filter((hospital) => hospital.region
                        .toLowerCase()
                        .includes(user_hospital_region.toLowerCase()));
                    //console.log("HOSPITAL LIST BY REGION", hospitalListByRegion)
                    // check if district exists in hospitalListByRegion
                    const hospitalListByDistrict = hospitalListByRegion.filter((hospital) => hospital.district.toLowerCase().includes(district.toLowerCase()));
                    //console.log("HOSPITAL LIST BY DISTRICT", hospitalListByDistrict)
                    if (hospitalListByDistrict.length === 0) {
                        menu.con("No hospital found in this district. Please try again.");
                    }
                    // if district exists, list district for user to choose
                    let districtList = hospitalListByDistrict.map((hospital) => hospital.district);
                    districtList = [...new Set(districtList)];
                    menu.con(`Confirm your District
${districtList.map((district, index) => `${district}`).join("\n")}

   0.Back 00.Main Menu`);
                }),
                next: {
                    "*\\w+": "searchHospital.hospital",
                    "0": "chooseHospital",
                },
            });
            menu.state("searchHospital.hospital", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const distictInput = menu.val;
                    console.log("DISTRICT INPUT", distictInput);
                    const user_hospital_region = userHospital.hospital_region;
                    console.log("USER HOSPITAL REGION", user_hospital_region);
                    // SAVE DISTRICT TO DATABASE
                    userHospital.hospital_district = distictInput;
                    yield userHospital.save();
                    const user_hospital_district = userHospital.hospital_district;
                    const hospitalsByRegion = hospitalList.filter((hospital) => hospital.region.toLowerCase() ===
                        user_hospital_region.toLowerCase());
                    console.log("hospitalsByRegion", hospitalsByRegion);
                    const hospitalsByDistrict = hospitalsByRegion.filter((hospital) => hospital.district.toLowerCase() ===
                        user_hospital_district.toLowerCase());
                    console.log("hospitalsByDistrict", hospitalsByDistrict);
                    // RANDOM HOSPITAL
                    const randomHospital = hospitalsByDistrict[Math.floor(Math.random() * hospitalsByDistrict.length)];
                    menu.con(`Type your Hospital to search e.g ${randomHospital.hospital_name}`);
                }),
                next: {
                    "*[a-zA-Z]+": "selectHospital.search",
                    "0": "selectRegion",
                },
            });
            menu.state("selectHospital.search", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const hospitalName = menu.val;
                    const user_hospital_region = userHospital.hospital_region;
                    const user_hospital_district = userHospital.hospital_district;
                    const hospitalsByRegion = hospitalList.filter((hospital) => hospital.region.toLowerCase() ===
                        user_hospital_region.toLowerCase());
                    //console.log('hospitalsByRegion', hospitalsByRegion);
                    const hospitalsByDistrict = hospitalsByRegion.filter((hospital) => hospital.district.toLowerCase() ===
                        user_hospital_district.toLowerCase());
                    console.log("hospitalsByDistrict", hospitalsByDistrict);
                    const hospitalSearchList = hospitalsByDistrict.find((hospital) => hospital.hospital_name
                        .toLowerCase()
                        .includes(hospitalName.toLowerCase()));
                    console.log("hospitalSearchList", hospitalSearchList);
                    if (typeof hospitalSearchList === "undefined") {
                        return menu.end("Sorry, we could not find a hospital with that name. Please try again.");
                    }
                    console.log(typeof hospitalSearchList === "undefined");
                    const { hospital_name, hospital_address, hospital_contact_person, hospital_contact, } = hospitalSearchList;
                    userHospital.hospital_name = hospital_name;
                    userHospital.hospital_address = hospital_address;
                    userHospital.hospital_contact_person = hospital_contact_person;
                    userHospital.hospital_contact = hospital_contact;
                    yield userHospital.save();
                    const hospitalInfo = `
          You have selected ${hospital_name}\n as your preferred facility.Below are the Hospital details
          \nAddress: ${hospital_address}\nContact Person: ${hospital_contact_person}\nContact: ${hospital_contact}`;
                    menu.con(hospitalInfo);
                }),
                next: {
                    "00": "account",
                },
            });
            menu.state("myHospitalOption", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    //ask if they want to change hospital or see details
                    menu.con(`1. See Details
                2. Change Hospital

                0. Back
                00. Main Menu`);
                }),
                next: {
                    "1": "myHospital",
                    "2": "chooseHospital",
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("myHospital", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    if (!UserHospital) {
                        menu.end(`Sorry, you have not selected a hospital yet.
                      \nPlease select a hospital first.
                      \n1. Select Hospital`);
                    }
                    console.log("hospitalDetails", UserHospital);
                    const { hospital_name, hospital_address, hospital_contact_person, hospital_contact, } = UserHospital;
                    const hospitalInfo = `Hospital: ${hospital_name}\nAddress: ${hospital_address}\nContact Person: ${hospital_contact_person}\nContact: ${hospital_contact}`;
                    const message = `Congratulations, you have selected ${hospital_name} as your preferred Inpatient Hospital. Below are the Hospital details:
                        Hospital Name: ${hospital_name}
                        Contact Number: ${hospital_contact}
                        Location: ${hospital_address}
                        Contact Person: ${hospital_contact_person}
                        `;
                    yield (0, sendSMS_1.default)(args.phoneNumber, message);
                    menu.end(hospitalInfo);
                }),
                next: {
                    "1": "chooseHospital",
                    "00": "account",
                },
            });
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
