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
const payment_1 = require("../../services/payment");
const uuid_1 = require("uuid");
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const utils_1 = require("../../services/utils");
const getAirtelUser_1 = require("../../services/getAirtelUser");
const selfMenu = (args, db) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let { phoneNumber, response, currentStep, userText, allSteps } = args;
    let phone = (_a = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _a === void 0 ? void 0 : _a.substring(3);
    let existingUser = yield db.users.findOne({
        where: {
            phone_number: phone,
        },
    });
    const coverTypes = [{
            name: "MINI",
            sum_insured: "1.5M",
            sumInsured: 1500000,
            premium: "10,000",
            yearly_premium: "120,000",
            yearPemium: 120000,
            last_expense_insured: "1M",
            lastExpenseInsured: 1000000
        },
        {
            name: "MIDI",
            sum_insured: "3M",
            sumInsured: 3000000,
            premium: "14,000",
            yearly_premium: "167,000",
            yearPemium: 167000,
            last_expense_insured: "1.5M",
            lastExpenseInsured: 1500000
        },
        {
            name: "BIGGIE",
            sum_insured: "5M",
            sumInsured: 5000000,
            premium: "18,000",
            yearly_premium: "208,000",
            yearPemium: 208000,
            last_expense_insured: "2M",
            lastExpenseInsured: 2000000
        }];
    if (currentStep === 1) {
        switch (userText) {
            case "1":
                // const covers = coverTypes.map((coverType, index) => {
                //     return `\n${index + 1}. ${coverType.name} at UGX ${coverType.premium}`
                // }
                // ).join("");
                // response = "CON Buy for self " + covers + "\n0. Back \n00. Main Menu";
                // create a raw menu with the cover types without looping
                response = "CON Buy for self " +
                    "\n1. MINI at UGX 10,000" +
                    "\n2. MIDI at UGX 14,000" +
                    "\n3. BIGGIE at UGX 18,000" +
                    "\n0. Back \n00. Main Menu";
                break;
        }
    }
    else if (currentStep === 2) {
        let coverType = coverTypes[parseInt(userText) - 1];
        if (!coverType) {
            response = "CON Invalid option" + "\n0. Back \n00. Main Menu";
            return response;
        }
        let userPhoneNumber = (_b = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _b === void 0 ? void 0 : _b.substring(3);
        response = `CON Inpatient cover for 0${userPhoneNumber}, UGX ${coverType.sum_insured} a year` +
            "\nPAY " +
            `\n1. UGX ${coverType.premium} monthly` +
            `\n2. UGX ${coverType.yearly_premium} yearly` + "\n0. Back \n00. Main Menu";
    }
    else if (currentStep === 3) {
        let paymentOption = parseInt(userText);
        let selectedPolicyType = coverTypes[parseInt(allSteps[1]) - 1];
        let policy_type = selectedPolicyType.name;
        let options = (0, utils_1.calculatePaymentOptions)(policy_type, paymentOption);
        response = `CON Pay UGX ${options.premium} ${options.period}. Terms&Conditions https://rb.gy/g4hyk\nConfirm to Agree and Pay` + "\n1. Confirm \n0. Back";
    }
    else if (currentStep === 4) {
        if (userText == "1") {
            response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment';
            console.log("=============== END SCREEN USSD RESPONCE WAS CALLED=======", response);
        }
        if (userText == "1") {
            // response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'
            console.log("RESPONCE WAS CALLED", response);
            let selectedPolicyType = coverTypes[parseInt(allSteps[1]) - 1];
            let fullPhone = !(phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.startsWith('+')) ? `+${phoneNumber}` : phoneNumber;
            if (!existingUser) {
                console.log("USER DOES NOT EXIST SELF");
                let user = yield (0, getAirtelUser_1.getAirtelUser)(phoneNumber, "UG", "UGX", 2);
                console.log("AIRTEL USER", user);
                let membershipId = Math.floor(100000 + Math.random() * 900000);
                existingUser = yield db.users.create({
                    user_id: (0, uuid_1.v4)(),
                    phone_number: phone,
                    membership_id: membershipId,
                    pin: Math.floor(1000 + Math.random() * 9000),
                    first_name: user.first_name,
                    last_name: user.last_name,
                    name: `${user.first_name} ${user.last_name}`,
                    total_member_number: "M",
                    partner_id: 2,
                    role: "user",
                    nationality: "UGANDA",
                });
                const message = `Dear ${user.first_name}, welcome to Ddwaliro Care. Membership ID: ${membershipId} Dial *185*7*6# to access your account.`;
                yield (0, sendSMS_1.default)(fullPhone, message);
            }
            // console.log("EXISTING USER", existingUser);
            // create policy
            let policy_type = selectedPolicyType.name;
            let installment_type = parseInt(allSteps[2]);
            // let period = installment_type == 1 ? "yearly" : "monthly";
            let ultimatePremium = (0, utils_1.calculatePaymentOptions)(policy_type, installment_type);
            //console.log("ULTIMATE PREMIUM", ultimatePremium);
            //next month minus 1 day
            let installment_next_month_date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1);
            let policyObject = {
                policy_id: (0, uuid_1.v4)(),
                installment_type: installment_type == 1 ? 2 : 1,
                policy_type: policy_type,
                policy_deduction_amount: ultimatePremium.premium,
                policy_pending_premium: ultimatePremium.premium,
                sum_insured: selectedPolicyType.sumInsured,
                premium: ultimatePremium.premium,
                yearly_premium: selectedPolicyType.yearPemium,
                last_expense_insured: selectedPolicyType.lastExpenseInsured,
                policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
                policy_start_date: new Date(),
                installment_date: installment_type == 1 ? new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)) : installment_next_month_date,
                membership_id: Math.floor(100000 + Math.random() * 900000),
                beneficiary: "SELF",
                policy_status: "pending",
                policy_deduction_day: new Date().getDate() - 1,
                partner_id: 2,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: "d18424d6-5316-4e12-9826-302b866a380c",
                user_id: existingUser.user_id,
                phone_number: phoneNumber,
            };
            console.log("POLICY OBJECT", policyObject);
            let policy = yield db.policies.create(policyObject);
            try {
                yield (0, payment_1.airtelMoney)(existingUser.user_id, 2, policy.policy_id, phone, ultimatePremium.premium, existingUser.membership_id, "UG", "UGX");
            }
            catch (error) {
                console.log("AIRTEL MONEY ERROR", error);
            }
            // create payment
        }
        else {
            response = "END Thank you for using Ddwaliro Care";
        }
    }
    return response;
});
exports.default = selfMenu;
