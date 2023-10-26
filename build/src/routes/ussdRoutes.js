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
const express_1 = __importDefault(require("express"));
const menu_builder_1 = __importDefault(require("../menu-builder"));
const menu_ken_builder_1 = __importDefault(require("../menu-ken-builder"));
const sendSMS_1 = __importDefault(require("../services/sendSMS"));
const db_1 = require("../models/db");
const uuid_1 = require("uuid");
const aar_1 = require("../services/aar");
const utils_1 = require("../services/utils");
const Transaction = db_1.db.transactions;
const Payment = db_1.db.payments;
const Policy = db_1.db.policies;
const Users = db_1.db.users;
const Beneficiary = db_1.db.beneficiaries;
const PolicySchedule = db_1.db.policy_schedules;
const router = express_1.default.Router();
const handleUSSDRequest = (req, res, menuBuilder) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req.body);
        const menu_res = yield menuBuilder(req.body, db_1.db);
        res.send(menu_res);
    }
    catch (error) {
        console.log("MENU ERROR", error);
        res.status(500).send(error);
    }
});
router.post("/uga", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleUSSDRequest(req, res, menu_builder_1.default);
}));
router.post("/uat/uga", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleUSSDRequest(req, res, menu_builder_1.default);
}));
router.post("/ken", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleUSSDRequest(req, res, menu_ken_builder_1.default);
}));
const findTransactionById = (transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Transaction.findOne({
        where: {
            transaction_reference: transactionId,
        },
    });
});
const updateUserPolicyStatus = (policy, amount, installment_order, installment_type, payment, airtel_money_id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("UPDATE STATUS WAS CALLED", policy, amount, installment_order, installment_type);
    let date = new Date();
    amount = parseInt(amount);
    let installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1, date.getDay() - 3);
    policy.policy_status = "paid";
    policy.policy_paid_date = new Date();
    if (installment_order == 12) {
        policy.policy_end_date = new Date(date.getFullYear() + 1, date.getMonth(), date.getDate());
    }
    if (installment_type == 2) {
        policy.policy_next_deduction_date = new Date(date.getFullYear(), date.getMonth() + 1, policy.policy_deduction_day);
        policy.installment_order = installment_order;
        policy.installment_alert_date = installment_alert_date;
    }
    if (policy.policy_paid_amount !== policy.premium) {
        policy.policy_paid_amount += amount;
        policy.policy_pending_premium -= amount;
    }
    policy.bluewave_transaction_id = payment.payment_id;
    policy.airtel_transaction_id = airtel_money_id;
    console.log("UPDATE STATUS WAS CALLED", policy);
    yield policy.save();
    return policy;
});
// {
//   "transaction": {
//     "id": "BBZMiscxy",
//     "message": "Paid UGX 5,000 to TECHNOLOGIES LIMITED Charge UGX 140, Trans ID MP210603.1234.L06941.",
//     "status_code": "TS",
//     "airtel_money_id": "MP210603.1234.L06941"
//   }
// }
// POST and GET request handler
router.all("/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        if (req.method === "POST" || req.method === "GET") {
            const { transaction } = req.body;
            console.log("AIRTEL CALLBACK", transaction);
            const { id, status_code, message, airtel_money_id } = transaction;
            const transactionData = yield findTransactionById(id);
            if (!transactionData) {
                console.log("Transaction not found");
                return res.status(404).json({ message: "Transaction not found" });
            }
            const { policy_id, user_id, amount, partner_id } = transactionData;
            console.log("TRANSACTION DATA", transactionData);
            const user = yield Users.findOne({ where: { user_id } });
            let policy = yield db_1.db.policies.findOne({ where: { policy_id } });
            // policy.sort((a, b) => a.policy_start_date - b.policy_start_date);
            policy.airtel_money_id = airtel_money_id;
            if (!user) {
                console.log("User not found");
                return res.status(404).json({ message: "User not found" });
            }
            // latest policy
            // policy = policy[policy.length - 1];
            console.log("======= POLICY =========", policy);
            if (!policy || !policy.airtel_money_id) {
                console.log("Policy not found");
                return res.status(404).json({ message: "Policy not found" });
            }
            const beneficiary = policy.beneficiary;
            const to = ((_a = user.phone_number) === null || _a === void 0 ? void 0 : _a.startsWith("7")) ? `+256${user.phone_number}` : ((_b = user.phone_number) === null || _b === void 0 ? void 0 : _b.startsWith("0")) ? `+256${user.phone_number.substring(1)}` : ((_c = user.phone_number) === null || _c === void 0 ? void 0 : _c.startsWith("+")) ? user.phone_number : `+256${user.phone_number}`;
            const policyType = policy.policy_type.toUpperCase();
            const period = policy.installment_type == 1 ? "yearly" : "monthly";
            if (status_code === "TS") {
                yield transactionData.update({
                    status: "paid",
                });
                let registerAARUser, updatePremiumData, updatedPolicy, installment;
                const memberStatus = yield (0, aar_1.fetchMemberStatusData)({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
                if (memberStatus.code !== 200) {
                    registerAARUser = yield (0, aar_1.registerPrincipal)(user, policy);
                    //console.log("AAR USER", registerAARUser);
                    if (registerAARUser.code == 200 || memberStatus.code == 200) {
                        user.arr_member_number = registerAARUser.member_no;
                        yield user.save();
                        updatePremiumData = yield (0, aar_1.updatePremium)(user, policy);
                        // await createDependant(user.phone_number,policy.policy_id) 
                        console.log("AAR UPDATE PREMIUM", updatePremiumData);
                    }
                }
                if (memberStatus.code == 200) {
                    console.log("MEMBER STATUS", memberStatus);
                    policy.arr_policy_number = memberStatus === null || memberStatus === void 0 ? void 0 : memberStatus.policy_no;
                    updatePremiumData = yield (0, aar_1.updatePremium)(user, policy);
                    console.log("AAR UPDATE PREMIUM -member found", updatePremiumData);
                }
                const payment = yield Payment.create({
                    payment_amount: amount,
                    payment_type: "airtel money stk push for " + policyType + " " + period + " payment",
                    user_id,
                    policy_id,
                    payment_status: "paid",
                    payment_description: message,
                    payment_date: new Date(),
                    payment_metadata: req.body,
                    partner_id,
                });
                // policy schedule
                //find policy schedule with policy id 
                //if not found create new policy schedule
                let policySchedule = yield db_1.db.policy_schedules.findOne({ where: { policy_id } });
                console.log("POLICY SCHEDULE", policySchedule);
                function calculateOutstandingPremiumForMonth(premium, month) {
                    // Calculate the outstanding premium for the month
                    // eg jan 10,000, feb 20, 000, march 30,000
                    const outstandingPremium = premium * (12 - month);
                    // Return the outstanding premium
                    return outstandingPremium;
                }
                if (!policySchedule) {
                    // If policy installment type is monthly, create 12 policy schedules
                    if (policy.installment_type == 2) {
                        // Get the policy start date
                        const policyStartDate = new Date(policy.policy_start_date);
                        // Define an array to store the 12 policy schedules
                        const policySchedules = [];
                        // Loop to create 12 monthly policy schedules
                        for (let i = 0; i < 12; i++) {
                            // Calculate the next due date
                            const nextDueDate = new Date(policyStartDate);
                            nextDueDate.setMonth(policyStartDate.getMonth() + i);
                            // Calculate the reminder date (e.g., 5 days before the due date)
                            const reminderDate = new Date(nextDueDate);
                            reminderDate.setDate(reminderDate.getDate() - 5);
                            // Create a new policy schedule object
                            const newPolicySchedule = {
                                policy_schedule_id: (0, uuid_1.v4)(),
                                policy_id,
                                payment_frequency: period,
                                policy_start_date: policyStartDate,
                                next_payment_due_date: nextDueDate,
                                reminder_date: reminderDate,
                                premium: policy.premium,
                                outstanding_premium: calculateOutstandingPremiumForMonth(policy.premium, i)
                            };
                            // Push the new policy schedule into the array
                            policySchedules.push(newPolicySchedule);
                        }
                        // Insert all 12 policy schedules into your database
                        yield PolicySchedule.bulkCreate(policySchedules);
                        // Now you have 12 policy schedules for the monthly installment.
                    }
                    else if (policy.installment_type == 1) {
                        // If the policy installment type is not monthly, create a single policy schedule
                        const newPolicySchedule = {
                            policy_schedule_id: (0, uuid_1.v4)(),
                            policy_id,
                            payment_frequency: period,
                            policy_start_date: policy.policy_start_date,
                            next_payment_due_date: policy.policy_end_date,
                            reminder_date: policy.policy_end_date,
                            premium: policy.premium,
                            outstanding_premium: policy.premium
                        };
                        // Insert the single policy schedule into your database
                        yield PolicySchedule.create(newPolicySchedule);
                    }
                    else {
                        console.log("POLICY INSTALLMENT TYPE NOT FOUND");
                    }
                }
                console.log("Payment record created successfully");
                if (policy.installment_order > 0 && policy.installment_order < 12 && policy.installment_type == 2) {
                    console.log("INSTALLMENT ORDER", policy.installment_order, policy.installment_type);
                    const date = new Date();
                    const installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1);
                    let installment_order = yield db_1.db.installments.count({ where: { policy_id } });
                    installment_order++;
                    installment = yield db_1.db.installments.create({
                        installment_id: (0, uuid_1.v4)(),
                        policy_id,
                        installment_order,
                        installment_date: new Date(),
                        installment_alert_date,
                        tax_rate_vat: policy.tax_rate_vat,
                        tax_rate_ext: policy.tax_rate_ext,
                        installment_deduction_amount: policy.policy_deduction_amount,
                        premium: policy.premium,
                        sum_insured: policy.sum_insured,
                        excess_premium: policy.excess_premium,
                        discount_premium: policy.discount_premium,
                        currency_code: policy.currency_code,
                        country_code: policy.country_code,
                    });
                }
                updatedPolicy = yield updateUserPolicyStatus(policy, parseInt(amount), policy.installment_order, policy.installment_type, payment, airtel_money_id);
                console.log("=== PAYMENT ===", payment);
                console.log("=== TRANSACTION === ", transactionData);
                console.log("=== UPDATED POLICY ===", updatedPolicy);
                console.log("=== INSTALLMENT ===", installment);
                console.log("=== REGISTERED AAR USER ===", registerAARUser);
                console.log("=== UPDATED PREMIUM DATA ===", updatePremiumData);
                const members = (_d = policy.total_member_number) === null || _d === void 0 ? void 0 : _d.match(/\d+(\.\d+)?/g);
                console.log("MEMBERS", members, policy.total_member_number);
                const sumInsured = (0, utils_1.formatAmount)(policy.sum_insured);
                const lastExpenseInsured = (0, utils_1.formatAmount)(policy.last_expense_insured);
                console.log("SUM INSURED", sumInsured);
                console.log("LAST EXPENSE INSURED", lastExpenseInsured);
                const thisDayThisMonth = policy.installment_type === 2 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1) : new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1);
                let congratText = "";
                if (policy.beneficiary == "FAMILY") {
                    congratText = `Congratulations! You and ${members} dependent are each covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`;
                }
                else if (policy.beneficiary == "SELF")
                    congratText = `Congratulations! You are covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`;
                else if (policy.beneficiary == "OTHER") {
                    congratText = `${user.first_name} has bought for you Ddwaliro Care for Inpatient ${sumInsured} and Funeral benefit of ${lastExpenseInsured}. Dial *185*7*6# on Airtel to enter next of kin & view more details`;
                }
                yield (0, sendSMS_1.default)(to, congratText);
                return res.status(200).json({
                    code: 200,
                    message: "Payment record created successfully"
                });
            }
            else {
                yield Payment.create({
                    payment_amount: amount,
                    payment_type: "airtel money payment",
                    user_id,
                    policy_id,
                    payment_status: "failed",
                    payment_description: message,
                    payment_date: new Date(),
                    payment_metadata: req.body,
                });
                console.log("Payment  for failed record created");
                return res.status(200).json({ code: 200, message: "POST/GET request handled successfully" });
            }
        }
        else {
            return res.status(405).send("Method Not Allowed");
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}));
module.exports = router;
