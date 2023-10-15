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
const accountMenu = (args, db) => __awaiter(void 0, void 0, void 0, function* () {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;
    const trimmedPhoneNumber = phoneNumber.replace("+", "").substring(3);
    const smsPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
    const policies = yield db.policies.findAll({
        where: {
            phone_number: phoneNumber,
            policy_status: "paid"
        }
    });
    let policyMessages = policies.map((policy, index) => {
        return `Dwaliro ${policy.policy_type} Inpatient UGX ${policy.premium} is ${policy.policy_status} and paid to ${new Date(policy.installment_date).toDateString()}`;
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
                response = policies.length > 0 ? `CON ${policyMessages[0]}\n1. Next` : "END You have no policies";
                break;
            case "2":
                const unpaidPolicies = yield db.policies.findAll({
                    where: {
                        phone_number: phoneNumber,
                        policy_status: "pending"
                    }
                });
                if ((unpaidPolicies === null || unpaidPolicies === void 0 ? void 0 : unpaidPolicies.length) === 0) {
                    response = "END You have no pending policies";
                }
                else {
                    response = "CON PAY" +
                        `\n1-UGX ${unpaidPolicies[0].premium}  monthly` +
                        `\n2-UGX ${unpaidPolicies[0].yearly_premium}  yearly`;
                }
                break;
            case "3":
                console.log("Policies", policies);
                const paidPolicies = yield db.policies.findAll({
                    where: {
                        phone_number: phoneNumber,
                        policy_status: "paid"
                    }
                });
                if (paidPolicies.length > 0) {
                    response = `CON ${policyMessages[0]}\n1. Cancel Policy`;
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
                if (userText == "1" && policies.length > 1) {
                    response = `CON ${policyMessages[1]}\n1. Next`;
                }
                else if (userText == "1" && policies.length == 1) {
                    response = `END Your outstanding premium is UGX ${policies[0].premium}\nYour available inpatient limit is UGX ${policies[0].sum_insured} and Funeral expense of UGX ${policies[0].last_expense_insured}`;
                }
                break;
            case "2":
                if (userText == "1") {
                    const user = yield db.users.findOne({
                        where: {
                            phone_number: phoneNumber
                        }
                    });
                    const policies = yield db.policies.findAll({
                        where: {
                            phone_number: phoneNumber,
                            policy_status: "pending"
                        }
                    });
                    console.log("Policy", policies[0]);
                    yield (0, payment_1.airtelMoney)(user.user_id, 2, policies[0].policy_id, smsPhone, policies[0].premium, user.membership_id, "UG", "UGX");
                    response = "END Please wait for the Airtel Money prompt to enter your PIN to complete the payment";
                }
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
                            policy_id: policies[0].policy_id
                        }
                    });
                    response = `END Cancelling, you will no longer be covered as from ${new Date(policies[0].policy_end_date).toDateString()}`;
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
        const user = yield db.users.findOne({
            where: {
                [sequelize_1.Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
            }
        });
        const nextOfKinDetails = {
            beneficiary_id: (0, uuid_1.v4)(),
            name: allSteps[2],
            phone_number: userText,
            user_id: user.user_id,
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
