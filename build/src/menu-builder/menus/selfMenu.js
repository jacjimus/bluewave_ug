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
    var _a;
    let { phoneNumber, text, response, currentStep, previousStep, userText, allSteps } = args;
    const coverTypes = [{
            name: "MINI",
            sum_insured: "1.5M",
            premium: "10,000",
            yearly_premium: "120,000",
            last_expense_insured: "1M"
        },
        {
            name: "MIDI",
            sum_insured: "3M",
            premium: "14,000",
            yearly_premium: "167,000",
            last_expense_insured: "1.5M"
        },
        {
            name: "BIGGIE",
            sum_insured: "5M",
            premium: "18,000",
            yearly_premium: "208,000",
            last_expense_insured: "2M"
        }];
    // Note: userText is the last item selected by the user
    console.log("ALL STEPS", allSteps);
    if (currentStep === 1) {
        switch (userText) {
            case "1":
                const covers = coverTypes.map((coverType, index) => {
                    return `\n${index + 1}. ${coverType.name} – UGX ${coverType.premium}`;
                }).join("");
                response = "CON Buy for self " + covers;
                break;
        }
    }
    else if (currentStep === 2) {
        let coverType = coverTypes[parseInt(userText) - 1];
        if (!coverType) {
            response = "END Invalid option";
            return response;
        }
        response = `CON Inpatient cover for ${args.phoneNumber}, UGX ${coverType.sum_insured} a year` +
            "\nPAY:" +
            `\n1-UGX ${coverType.premium} monthly` +
            `\n2-UGX ${coverType.yearly_premium} yearly`;
    }
    else if (currentStep === 3) {
        let paymentOption = parseInt(userText);
        let selectedPolicyType = coverTypes[parseInt(allSteps[1]) - 1];
        let policy_type = selectedPolicyType.name;
        let options = (0, utils_1.calculatePaymentOptions)(policy_type, paymentOption);
        switch (userText) {
            case "1":
                response = `CON Pay UGX ${options.premium} payable ${options.period}.
        Terms&Conditions - www.airtel.com
        Enter PIN to Agree and Pay 
        \n0 .Back
         00 .Main Menu`;
                break;
            case "2":
                response = `CON Pay UGX ${options.premium} payable ${options.period}.
        Terms&Conditions - www.airtel.com
        Enter PIN to Agree and Pay 
        \n0 .Back
         00 .Main Menu`;
                break;
            default:
                response = "END Invalid option";
                break;
        }
    }
    else if (currentStep === 4) {
        let existingUser = yield (0, getAirtelUser_1.getAirtelUser)(phoneNumber, "UG", "UGX", 2);
        let selectedPolicyType = coverTypes[parseInt(allSteps[1]) - 1];
        let phone = (_a = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _a === void 0 ? void 0 : _a.substring(3);
        let fullPhone = !(phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.startsWith('+')) ? `+${phoneNumber}` : phoneNumber;
        // create user
        if (existingUser) {
            const user = yield db.users.findOne({
                where: {
                    phone_number: phone,
                },
            });
            if (!user) {
                existingUser = yield db.users.create({
                    user_id: (0, uuid_1.v4)(),
                    phone_number: phone,
                    membership_id: Math.floor(100000 + Math.random() * 900000),
                    pin: Math.floor(1000 + Math.random() * 9000),
                    first_name: existingUser.first_name,
                    last_name: existingUser.last_name,
                    name: `${existingUser.first_name} ${existingUser.last_name}`,
                    total_member_number: "M",
                    partner_id: 2,
                    role: "user",
                });
                console.log("USER DOES NOT EXIST", user);
                const message = `Dear ${existingUser.first_name}, welcome to Ddwaliro Care. Membership ID: ${existingUser.membership_id} and Ddwaliro PIN: ${existingUser.pin}. Dial *185*4*4# to access your account.`;
                yield (0, sendSMS_1.default)(fullPhone, message);
            }
            else {
                existingUser = user;
            }
        }
        else {
            existingUser = yield db.users.create({
                user_id: (0, uuid_1.v4)(),
                phone_number: phone,
                membership_id: Math.floor(100000 + Math.random() * 900000),
                pin: Math.floor(1000 + Math.random() * 9000),
                first_name: "Test",
                last_name: "User",
                name: `Test User`,
                total_member_number: "M",
                partner_id: 2,
                role: "user",
            });
        }
        // create policy
        let policy_type = selectedPolicyType.name;
        let installment_type = parseInt(allSteps[2]);
        let period = installment_type == 1 ? "yearly" : "monthly";
        const parseAmount = (amount) => {
            amount = amount.replace(/,/g, "");
            if (amount.includes("K")) {
                return parseInt(amount) * 1000;
            }
            else if (amount.includes("M")) {
                return parseInt(amount) * 1000000;
            }
            else {
                return parseInt(amount);
            }
        };
        let policyObject = {
            policy_id: (0, uuid_1.v4)(),
            installment_type: installment_type,
            policy_type: policy_type,
            policy_deduction_amount: parseAmount(selectedPolicyType.premium),
            policy_pending_premium: parseAmount(selectedPolicyType.premium),
            sum_insured: parseAmount(selectedPolicyType.sum_insured),
            premium: parseAmount(selectedPolicyType.premium),
            last_expense_insured: installment_type == 1 ? parseAmount(selectedPolicyType.last_expense_insured) : parseAmount(selectedPolicyType.last_expense_insured) / 12,
            policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
            policy_start_date: new Date(),
            membership_id: Math.floor(100000 + Math.random() * 900000),
            beneficiary: "SELF",
            policy_status: "pending",
            policy_deduction_day: new Date().getDate() - 1,
            partner_id: 2,
            country_code: "UGA",
            currency_code: "UGX",
            product_id: "d18424d6-5316-4e12-9826-302b866a380c",
            user_id: existingUser.user_id,
            phone_number: phone,
        };
        let policy = yield db.policies.create(policyObject);
        // create payment
        let paymentStatus = yield (0, payment_1.airtelMoney)(existingUser.user_id, 2, policy.policy_id, phone, policy.policy_deduction_amount, existingUser.membership_id, "UG", "UGX");
        if (paymentStatus.code === 200) {
            let congratText = `Congratulations! You bought Mini cover for Inpatient (UGX ${selectedPolicyType.sum_insured}) and Funeral (UGX ${selectedPolicyType.sum_insured}) for a year. Pay UGX ${selectedPolicyType.premium} every ${period} to stay covered`;
            yield (0, sendSMS_1.default)(fullPhone, congratText);
            response = `END Congratulations! You are now covered for Inpatient benefit of UGX ${selectedPolicyType.sum_insured} and Funeral benefit of UGX ${selectedPolicyType.sum_insured}.
                       Cover valid till ${policy.policy_end_date.toDateString()}`;
        }
        else {
            response = `END Sorry, your payment was not successful. 
                    \n0. Back \n00. Main Menu`;
        }
    }
    return response;
});
exports.default = selfMenu;
