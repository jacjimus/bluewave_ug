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
    let { phoneNumber, response, currentStep, userText, allSteps } = args;
    let phone = (_a = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _a === void 0 ? void 0 : _a.substring(3);
    const coverTypes = [{
            name: "BAMBA",
            sum_insured: "",
            sumInsured: 0,
            premium: "300",
            yearly_premium: "3,294",
            yearPemium: 3294,
            last_expense_insured: "",
            lastExpenseInsured: 0,
            inPatient: 0,
            outPatient: 0,
            maternity: 0,
            hospitalCash: 4500
        },
        {
            name: "ZIDI",
            sum_insured: "",
            sumInsured: 0,
            premium: "650",
            yearly_premium: "7,140",
            yearPemium: 7140,
            last_expense_insured: "",
            lastExpenseInsured: 0,
            inPatient: 300000,
            outPatient: 0,
            maternity: 100000,
            hospitalCash: 0
        },
        {
            name: "SMARTA",
            sum_insured: "",
            sumInsured: 0,
            premium: "1,400",
            yearly_premium: "15,873",
            yearPemium: 15873,
            last_expense_insured: "",
            lastExpenseInsured: 0,
            inPatient: 400000,
            outPatient: 30000,
            maternity: 100000,
            hospitalCash: 0
        }];
    if (currentStep === 1) {
        switch (userText) {
            case "1":
                // create a raw menu with the cover types without looping
                response = "CON " +
                    "\n1. Bamba at KShs 300" +
                    "\n2. Zidi at KShs 650" +
                    "\n3. Smarta at KShs 1,400" +
                    "\n0. Back \n00. Main Menu";
                break;
            default:
                response = "CON Invalid option" + "\n0. Back \n00. Main Menu";
                break;
        }
    }
    else if (currentStep === 2) {
        let coverType = coverTypes[parseInt(userText) - 1];
        if (!coverType) {
            response = "CON Invalid option" + "\n0. Back \n00. Main Menu";
            return response;
        }
        //let userPhoneNumber = phoneNumber?.replace('+', "")?.substring(3);
        response = `CON You get KShs 4,500 per night of hospitalisation up to a Maximum of 30 days a year ` +
            "\nPAY " +
            `\n1. ${coverType.premium} monthly` +
            `\n2. ${coverType.yearly_premium} yearly` + "\n0. Back \n00. Main Menu";
    }
    else if (currentStep === 3) {
        let paymentOption = parseInt(userText);
        let selectedPolicyType = coverTypes[parseInt(allSteps[1]) - 1];
        let policy_type = selectedPolicyType.name;
        let options = (0, utils_1.calculatePaymentOptionsKenya)(policy_type, paymentOption);
        response = `CON Pay Kshs ${options.premium} ${options.period}. Terms Conditions - www.airtel.com to Agree and Pay \nAge 0 - 65 Years` + "\n1. Confirm \n0. Back  \n00. Main Menu";
    }
    else if (currentStep === 4) {
        if (userText == "1") {
            response = 'END Please wait for Airtel Money PIN prompt to complete the payment';
            console.log("=============== END SCREEN USSD RESPONCE SELF KENYA =======", phoneNumber, new Date());
            yield handleAirtelMoneyPayment(allSteps, phoneNumber, coverTypes, db);
        }
        else {
            response = "END Thank you for using AfyaSure";
        }
    }
    return response;
});
function handleAirtelMoneyPayment(allSteps, phoneNumber, coverTypes, db) {
    return __awaiter(this, void 0, void 0, function* () {
        let selectedPolicyType = coverTypes[parseInt(allSteps[1]) - 1];
        let fullPhone = !(phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.startsWith('+')) ? `+${phoneNumber}` : phoneNumber;
        let existingUser = yield findExistingUser(phoneNumber, 2, db);
        if (!existingUser) {
            console.log("USER DOES NOT EXIST SELF KENYA ");
            let user = yield (0, getAirtelUser_1.getAirtelKenyaUser)(phoneNumber);
            let membershipId = Math.floor(100000 + Math.random() * 900000);
            if ((user === null || user === void 0 ? void 0 : user.first_name) && (user === null || user === void 0 ? void 0 : user.last_name)) {
                existingUser = yield createNewUser(phoneNumber, user, membershipId, db);
                const message = `Dear ${user.first_name}, welcome to AfyaSure Care. Membership ID: ${membershipId} Dial *334*7*3# to access your account.`;
                yield sendSMS_1.default.sendSMS(3, fullPhone, message);
            }
        }
        let policyObject = createPolicyObject(selectedPolicyType, allSteps, existingUser, phoneNumber);
        let policy = yield createPolicy(policyObject, db);
        console.log("============== START TIME - SELFKENYA   ================ ", phoneNumber, new Date());
        const airtelMoneyPromise = (0, payment_1.airtelMoneyKenya)(existingUser.user_id, policy.policy_id, phoneNumber, policy.policy_deduction_amount, existingUser.membership_id);
        yield handleAirtelMoneyPromise(airtelMoneyPromise, phoneNumber);
    });
}
function findExistingUser(phoneNumber, partner_id, db) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield db.users.findOne({
            where: {
                phone_number: phoneNumber,
                partner_id,
            },
        });
    });
}
function createNewUser(phoneNumber, user, membershipId, db) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield db.users.create({
            user_id: (0, uuid_1.v4)(),
            phone_number: phoneNumber,
            membership_id: membershipId,
            first_name: user === null || user === void 0 ? void 0 : user.first_name,
            last_name: user === null || user === void 0 ? void 0 : user.last_name,
            name: `${user === null || user === void 0 ? void 0 : user.first_name} ${user === null || user === void 0 ? void 0 : user.last_name}`,
            total_member_number: "M",
            partner_id: 1,
            role: "user",
            nationality: "KENYA",
        });
    });
}
function createPolicyObject(selectedPolicyType, allSteps, existingUser, phoneNumber) {
    var _a;
    let policy_type = selectedPolicyType.name;
    let installment_type = parseInt(allSteps[2]);
    let ultimatePremium = (0, utils_1.calculatePaymentOptionsKenya)(policy_type, installment_type);
    let installment_next_month_date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1);
    let policyObject = {
        policy_id: (0, uuid_1.v4)(),
        installment_type: installment_type == 1 ? 2 : 1,
        installment_order: 1,
        policy_type: policy_type,
        policy_deduction_amount: ultimatePremium.premium,
        policy_pending_premium: selectedPolicyType.yearPemium - ultimatePremium.premium,
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
        partner_id: 1,
        country_code: "KE",
        currency_code: "KES",
        product_id: "e18424e6-5316-4f12-9826-302c866b380d",
        user_id: existingUser.user_id,
        phone_number: phoneNumber,
        first_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.first_name,
        last_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.last_name,
        inpatient_cover: selectedPolicyType.inPatient,
        outpatient_cover: selectedPolicyType.outPatient,
        maternity_cover: selectedPolicyType.maternity,
        hospital_cash: selectedPolicyType.hospitalCash,
        policy_number: "BW" + ((_a = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _a === void 0 ? void 0 : _a.substring(3))
    };
    return policyObject;
}
function createPolicy(policyObject, db) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield db.policies.create(policyObject);
    });
}
function handleAirtelMoneyPromise(airtelMoneyPromise, phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const timeout = 3000;
        try {
            yield Promise.race([
                airtelMoneyPromise,
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error('Airtel Money Kenya operation timed out'));
                    }, timeout);
                })
            ]);
            console.log("============== END TIME - SELF KENYA  ================ ", phoneNumber, new Date());
            console.log("RESPONSE WAS CALLED KENYA ");
            return 'END Payment successful';
        }
        catch (error) {
            console.log("RESPONSE WAS CALLED KENYA ", error);
            return 'END Payment failed';
        }
        finally {
            console.log("============== AFTER CATCH TIME - SELF KENYA  ================ ", phoneNumber, new Date());
        }
    });
}
exports.default = selfMenu;
/*

============== START TIME - SELF ======  +256706991200 2023-10-24T21:03:11.440Z
=========== PUSH TO AIRTEL MONEY =========== 706991200 2023-10-24T21:03:11.441Z
=========== AFTER CATCH TIMe==========   +256706991200 2023-10-24T21:03:11.490Z
=== RETURN RESPONSE AIRTEL MONEY =========== 706991200 2023-10-24T21:03:16.115Z

=======END TIME - SELF ================  +256706991200 2023-10-24T21:03:16.122Z

*/
