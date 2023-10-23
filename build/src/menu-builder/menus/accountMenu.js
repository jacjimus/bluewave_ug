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
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const uuid_1 = require("uuid");
const payment_1 = require("../../services/payment");
const sequelize_1 = require("sequelize");
const utils_1 = require("../../services/utils");
const accountMenu = (args, db) => __awaiter(void 0, void 0, void 0, function* () {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;
    const trimmedPhoneNumber = phoneNumber.replace("+", "").substring(3);
    const smsPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
    const currentUser = yield db.users.findOne({
        where: {
            [sequelize_1.Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
        }
    });
    const paidPolicies = yield db.policies.findAll({
        where: {
            phone_number: smsPhone,
            policy_status: "paid"
        }
    });
    let policyMessages = yield paidPolicies.map((policy, index) => {
        return `Dwaliro ${policy.policy_type} Inpatient UGX ${policy.premium.toLocaleString()} is ${policy.policy_status.toUpperCase()} to till ${new Date(policy.installment_date).toDateString()}`;
    });
    if (currentStep == 1) {
        response = "CON My Account" +
            "\n1. Policy Status" +
            "\n2. Pay Now" +
            "\n3. Cancel Policy" +
            "\n4. Add Next of Kin";
    }
    else if (currentStep == 2) {
        // console.log('Current step', currentStep);
        // console.log('User text', userText)
        switch (userText) {
            case "1":
                response = paidPolicies.length > 0 ? `CON ${policyMessages[0]}\n1. Next` : "END You have no paid policy";
                break;
            case "2":
                console.log("phoneNumber", smsPhone);
                let unpaidPolicies = yield db.policies.findAll({
                    where: {
                        phone_number: smsPhone.replace("+", ""),
                        policy_status: "pending"
                    }
                });
                // last 6 unpaid policies
                unpaidPolicies = unpaidPolicies.slice(-6);
                if ((unpaidPolicies === null || unpaidPolicies === void 0 ? void 0 : unpaidPolicies.length) === 0) {
                    response = "END You have no pending policies";
                }
                else {
                    // response = "CON PAY " +
                    //     `\n1 UGX ${unpaidPolicies[0].premium.toLocaleString()}  monthly` +
                    //     `\n2 UGX ${unpaidPolicies[0].yearly_premium.toLocaleString()}  yearly`
                    // list all the pending policies
                    response = "CON " + unpaidPolicies.map((policy, index) => {
                        return `\n${index + 1}. ${policy.policy_type} at UGX ${policy.premium.toLocaleString()} `;
                    }).join("");
                }
                break;
            case "3":
                console.log("paidPolicies", paidPolicies);
                console.log("policyMessages", policyMessages);
                if (paidPolicies.length > 0) {
                    response = `CON ${policyMessages}\n1. Cancel Policy` + "\n0. Back \n00. Main Menu";
                }
                else {
                    response = "END You have no policies";
                }
                break;
            case "4":
                response = "CON Enter Name of your Next of Kin (Above 18 years of age)";
                break;
            default:
                response = "END Invalid option selected";
                break;
        }
    }
    else if (currentStep == 3) {
        switch (allSteps[1]) {
            case "1":
                if (userText == "1" && paidPolicies.length > 1) {
                    response = `CON ${policyMessages[1]}\n1. Next`;
                }
                else if (userText == "1" && paidPolicies.length == 1) {
                    if (paidPolicies[0].installment_type == 1) {
                        response = `END Your available inpatient limit is UGX ${(0, utils_1.formatAmount)(paidPolicies[0].sum_insured)} and Funeral expense of UGX ${(0, utils_1.formatAmount)(paidPolicies[0].last_expense_insured)}`;
                    }
                    else {
                        console.log("POLICIES", paidPolicies[0].policy_id);
                        const payments = yield db.payments.findAll({
                            where: {
                                policy_id: paidPolicies[0].policy_id,
                                payment_status: "paid"
                            }
                        });
                        console.log("PAYMENTS", payments.length);
                        let proratedPercentage = (0, utils_1.calculateProrationPercentage)(payments.length);
                        console.log("PRORATED PERCENTAGE", paidPolicies[0].sum_insured / proratedPercentage);
                        // add 3 months to the policy start date
                        let policyStartDate = new Date(paidPolicies[0].policy_start_date);
                        console.log("POLICY START DATE", policyStartDate);
                        policyStartDate.setMonth(policyStartDate.getMonth() + payments.length);
                        console.log("POLICY START DATE", policyStartDate);
                        if (policyStartDate > new Date() && paidPolicies[0].installment_type == 2) {
                            response = `END Your available inpatient limit is UGX ${(paidPolicies[0].sum_insured / proratedPercentage).toLocaleString()} and Funeral expense of UGX ${(paidPolicies[0].last_expense_insured / proratedPercentage).toLocaleString()}`;
                        }
                        else {
                            response = `END Your outstanding premium is UGX ${(paidPolicies[0].premium).toLocaleString()}\nYour available inpatient limit is UGX ${(paidPolicies[0].sum_insured / proratedPercentage).toLocaleString()} and Funeral expense of UGX ${(paidPolicies[0].last_expense_insured / proratedPercentage).toLocaleString()}`;
                        }
                    }
                }
                break;
            case "2":
                console.log("allSteps", allSteps, allSteps[2]);
                let unpaidPolicies = yield db.policies.findAll({
                    where: {
                        phone_number: smsPhone.replace("+", ""),
                        policy_status: "pending"
                    }
                });
                // last 6 unpaid policies
                const existingUser = yield db.users.findOne({
                    where: {
                        phone_number: phoneNumber.replace("+", "").substring(3),
                    }
                });
                unpaidPolicies = unpaidPolicies.slice(-6);
                let choosenPolicy = unpaidPolicies[allSteps[2] - 1];
                console.log("CHOOSEN POLICY", choosenPolicy);
                yield (0, payment_1.airtelMoney)(existingUser.user_id, 2, choosenPolicy.policy_id, phoneNumber.replace("+", "").substring(3), choosenPolicy.premium, existingUser.membership_id, "UG", "UGX");
                response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment';
                break;
            case "3":
                if (userText == "1") {
                    const user = yield db.users.findOne({
                        where: {
                            phone_number: phoneNumber
                        }
                    });
                    yield db.policies.update({
                        policy_status: "cancelled",
                        user_id: user.user_id
                    }, {
                        where: {
                            policy_id: paidPolicies[0].policy_id
                        }
                    });
                    response = `END Cancelling, you will no longer be covered as from ${new Date(paidPolicies[0].policy_end_date).toDateString()}`;
                }
                break;
            case "4":
                response = "CON Enter Next of Kin Phone number";
                break;
            default:
                response = "END Invalid option selected";
                break;
        }
    }
    else if (currentStep == 4) {
        const existingUser = yield db.users.findOne({
            where: {
                [sequelize_1.Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
            }
        });
        let policies = yield db.policies.findAll({
            where: {
                phone_number: smsPhone.replace("+", ""),
                policy_status: "paid"
            }
        });
        if (policies.length == 0) {
            response = "END You have no paid policies";
        }
        let myPolicy = policies[policies.length - 1];
        const nextOfKinDetails = {
            beneficiary_id: (0, uuid_1.v4)(),
            name: allSteps[2],
            phone_number: userText,
            user_id: existingUser.user_id,
            bonus: allSteps[2],
        };
        yield db.beneficiaries.create(nextOfKinDetails);
        const sms = `You have added ${nextOfKinDetails.name} as the next of Kin on your Dddwaliro Cover. Any benefits on the cover will be payable to your next of Kin.`;
        yield (0, sendSMS_1.default)(smsPhone, sms);
        response = `END ${sms}`;
    }
    return response;
});
exports.default = accountMenu;
