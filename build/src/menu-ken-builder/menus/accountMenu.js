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
    console.log("============== PHONE ================ ", smsPhone);
    const currentUser = yield db.users.findOne({
        where: {
            [sequelize_1.Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
        },
        limit: 1,
    });
    let paidPolicies = yield db.policies.findAll({
        where: {
            user_id: currentUser.user_id,
            policy_status: "paid"
        },
        order: [
            ['policy_id', 'DESC'],
        ],
        limit: 6
    });
    //console.log("PAID POLICIES", paidPolicies.length)
    let policyMessages = yield paidPolicies.map((policy, index) => {
        //  ATTENTION HERE ON MERTERNITY AND INPATIENT
        return `AfyaShua ${policy.policy_type} Inpatient Kshs ${(policy === null || policy === void 0 ? void 0 : policy.inpatient_cover) || 0} and Maternity benefit Kshs ${(policy === null || policy === void 0 ? void 0 : policy.maternity_cover) || 0} is ${policy.policy_status.toUpperCase()} and paid to ${new Date(policy.installment_date).toDateString()}`;
    });
    if (currentStep == 1) {
        response = "CON My Account" +
            "\n1. Policy Status" +
            "\n2. Renew Cover" +
            "\n3. Cancel Policy" +
            "\n4. Add Next of Kin" +
            "\n5. Update Gender and Date of birth" +
            "\n6. Add Dependants";
    }
    else if (currentStep == 2) {
        // console.log('Current step', currentStep);
        console.log('User text', userText);
        switch (userText) {
            case "1":
                response = paidPolicies.length > 0 ? `CON ${policyMessages[0]}\n1. Next` : "END You have no paid policy";
                break;
            case "2":
                console.log("phoneNumber", smsPhone);
                paidPolicies = yield db.policies.findAll({
                    where: {
                        user_id: currentUser.user_id,
                        policy_status: "paid"
                    }
                });
                // last 6 unpaid policies
                paidPolicies = paidPolicies.slice(-6);
                if ((paidPolicies === null || paidPolicies === void 0 ? void 0 : paidPolicies.length) === 0) {
                    response = "END Sorry you have no active policy";
                }
                else {
                    // response = "CON PAY " +
                    //     `\n1 Kshs ${unpaidPolicies[0].premium.toLocaleString()}  monthly` +
                    //     `\n2 Kshs ${unpaidPolicies[0].yearly_premium.toLocaleString()}  yearly`
                    // list all the pending policies
                    response = "CON " + paidPolicies.map((policy, index) => {
                        return `\n${index + 1}. ${policy.policy_type} ${policy.beneficiary.toUpperCase()}  at Kshs ${policy.premium.toLocaleString()} `;
                    }).join("");
                }
                break;
            case "3":
                console.log("paidPolicies", paidPolicies);
                console.log("policyMessages", policyMessages);
                if (paidPolicies.length > 0) {
                    response = `CON ${policyMessages[policyMessages.length - 1]}\n1. Cancel Policy` + "\n0. Back \n00. Main Menu";
                }
                else {
                    response = "END You have no policies";
                }
                break;
            case "4":
                response = "CON Enter Name of your Next of Kin (Above 18 years of age)";
                break;
            case "5":
                response = 'CON Choose your Gender ' +
                    "\n1. Male" +
                    "\n2. Female";
                break;
            case "6":
                response = 'CON Dependant full name ';
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
                        response = `END Your available inpatient limit is Kshs ${(0, utils_1.formatAmount)(paidPolicies[0].inpatient_cover)} and Maternity expense of Kshs ${(0, utils_1.formatAmount)(paidPolicies[0].maternity_cover)}`;
                    }
                    else {
                        console.log("POLICIES", paidPolicies[0].policy_id);
                        const payments = yield db.payments.findAll({
                            where: {
                                policy_id: paidPolicies[0].policy_id,
                                payment_status: "paid"
                            },
                            limit: 3,
                        });
                        console.log("PAYMENTS", payments.length);
                        let proratedPercentage = (0, utils_1.calculateProrationPercentage)(payments.length);
                        console.log("PRORATED PERCENTAGE", paidPolicies[0].inpatient_cover / proratedPercentage);
                        // add 3 months to the policy start date
                        let policyStartDate = new Date(paidPolicies[0].policy_start_date);
                        console.log("POLICY START DATE", policyStartDate);
                        policyStartDate.setMonth(policyStartDate.getMonth() + payments.length);
                        console.log("POLICY START DATE", policyStartDate);
                        if (policyStartDate > new Date() && paidPolicies[0].installment_type == 2) {
                            response = `END Your available inpatient limit is Kshs ${(paidPolicies[0].inpatient_cover / proratedPercentage).toLocaleString()} and Maternity  expense of Kshs ${(paidPolicies[0].last_expense_insured / proratedPercentage).toLocaleString()}`;
                        }
                        else {
                            response = `END Your outstanding premium is Kshs ${(paidPolicies[0].premium).toLocaleString()}\nYour available inpatient limit is Kshs ${(paidPolicies[0].inpatient_cover / proratedPercentage).toLocaleString()} and Maternity  expense of Kshs ${(paidPolicies[0].inpatient_cover / proratedPercentage).toLocaleString()}`;
                        }
                    }
                }
                break;
            case "2":
                console.log("allSteps", allSteps, allSteps[2]);
                response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment';
                paidPolicies = yield db.policies.findAll({
                    where: {
                        phone_number: smsPhone.replace("+", ""),
                        policy_status: "paid"
                    },
                    order: [
                        ['policy_id', 'DESC'],
                    ],
                    limit: 6
                });
                // last 6 unpaid policies
                const existingUser = yield db.users.findOne({
                    where: {
                        phone_number: phoneNumber.replace("+", "").substring(3),
                    },
                    limit: 1,
                });
                paidPolicies = paidPolicies.slice(-6);
                let choosenPolicy = paidPolicies[allSteps[2] - 1];
                console.log("CHOOSEN POLICY", choosenPolicy);
                const airtelMoneyPromise = (0, payment_1.airtelMoneyKenya)(existingUser.user_id, choosenPolicy.policy_id, phoneNumber.replace("+", "").substring(3), choosenPolicy.premium, existingUser.membership_id);
                const timeout = 3000;
                Promise.race([
                    airtelMoneyPromise,
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            reject(new Error('Airtel Money operation timed out'));
                        }, timeout);
                    }),
                ]).then((result) => {
                    console.log("============== END TIME - FAMIY ================ ", phoneNumber, new Date());
                    response = 'END Payment successful';
                    console.log("RESPONSE WAS CALLED", result);
                    return response;
                })
                    .catch((error) => {
                    response = 'END Payment failed';
                    console.log("RESPONSE WAS CALLED EER", error);
                    return response;
                });
                console.log("============== AFTER CATCH  TIME - FAMILY ================ ", phoneNumber, new Date());
                break;
            case "3":
                if (userText == "1") {
                    const user = yield db.users.findOne({
                        where: {
                            phone_number: phoneNumber
                        },
                        limit: 1,
                    });
                    yield db.policies.update({
                        policy_status: "cancelled",
                        cancelled_at: new Date(),
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
        switch (userText) {
            case "1":
                response = paidPolicies.length > 0 ? `CON ${policyMessages[2]}\n1. Next` : "END Sorry you have no active policy";
                break;
            case "4":
                const existingUser = yield db.users.findOne({
                    where: {
                        [sequelize_1.Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
                    },
                    limit: 1,
                });
                let policies = yield db.policies.findAll({
                    where: {
                        phone_number: smsPhone,
                        policy_status: "paid"
                    },
                    order: [
                        ['policy_id', 'DESC'],
                    ],
                    limit: 6
                });
                if (policies.length == 0) {
                    response = "END Sorry you have no active policy";
                }
                let myPolicy = policies[policies.length - 1];
                const nextOfKinDetails = {
                    beneficiary_id: (0, uuid_1.v4)(),
                    name: allSteps[2],
                    phone_number: userText,
                    user_id: existingUser.user_id,
                    bonus: allSteps[2],
                    category: "KIN"
                };
                yield db.beneficiaries.create(nextOfKinDetails);
                const sms = `You have added ${nextOfKinDetails.name} as the next of Kin on your AfyaShua Cover. Any benefits on the cover will be payable to your next of Kin.`;
                yield sendSMS_1.default.sendSMS(3, smsPhone, sms);
                response = `END ${sms}`;
                break;
            default:
                response = "END Invalid option selected";
                break;
        }
    }
    else if (currentStep == 5) {
        console.log('==5 userText', userText);
        console.log(" ===5 ALLSTEPS", allSteps);
        // update gender and dob
        const existingUser = yield db.users.findOne({
            where: {
                [sequelize_1.Op.or]: [{ phone_number: phoneNumber }, { phone_number: trimmedPhoneNumber }]
            },
            limit: 1,
        });
        response = 'CON whats your date of birth in the format YYYY-MM-DD';
    }
    else if (currentStep == 6) {
        console.log('==6 userText', userText);
        console.log(" ===6 ALLSTEPS", allSteps);
        //update dependant
        response = 'CON whats your dependant date of birth in the format YYYY-MM-DD';
    }
    return response;
});
exports.default = accountMenu;
// [4:27 pm, 01/12/2023] Kennedy Nyosro: On the USSD, it is agent to add the update Gender and Date of birth so that the SMS are sent to the customers
// [4:27 pm, 01/12/2023] Kennedy Nyosro: Under my Policy, they should update next of kin, then add Gender then Date of Birth
// [4:28 pm, 01/12/2023] Kennedy Nyosro: The add details of dependents if they have for family, then that data can always be sent to AAR
