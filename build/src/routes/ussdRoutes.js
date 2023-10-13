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
const menu_uat_builder_1 = __importDefault(require("../menu-uat-builder"));
const menu_ken_builder_1 = __importDefault(require("../menu-ken-builder"));
const sendSMS_1 = __importDefault(require("../services/sendSMS"));
const db_1 = require("../models/db");
const uuid_1 = require("uuid");
const aar_1 = require("../services/aar");
const Transaction = db_1.db.transactions;
const Payment = db_1.db.payments;
const Policy = db_1.db.policies;
const Users = db_1.db.users;
const Beneficiary = db_1.db.beneficiaries;
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
    yield handleUSSDRequest(req, res, menu_uat_builder_1.default);
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
const updateUserPolicyStatus = (policy, amount, installment_order, installment_type) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("UPDATE STATUS WAS CALLED", policy, amount, installment_order, installment_type);
    let date = new Date();
    amount = parseInt(amount);
    let installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1);
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
    policy.policy_paid_amount += amount;
    policy.policy_pending_premium -= amount;
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
    try {
        if (req.method === "POST" || req.method === "GET") {
            const { transaction } = req.body;
            const { id, status_code, message, airtel_money_id } = transaction;
            const transactionData = yield findTransactionById(id);
            if (!transactionData) {
                console.log("Transaction not found");
                return res.status(404).json({ message: "Transaction not found" });
            }
            yield transactionData.update({
                status: "paid",
            });
            const { policy_id, user_id, amount, partner_id } = transactionData;
            const user = yield Users.findOne({ where: { user_id } });
            let policy = yield Policy.findAll({ where: { policy_id } });
            // latest policy
            policy = policy[policy.length - 1];
            console.log("======= POLICY =========", policy);
            if (!policy) {
                console.log("Policy not found");
                return res.status(404).json({ message: "Policy not found" });
            }
            const beneficiary = yield Beneficiary.findOne({ where: { user_id } });
            const to = user.phone_number;
            const policyType = policy.policy_type.toUpperCase();
            const paymentMessage = `Dear ${user.first_name}, you have successfully bought ${policyType} Medical cover for ${user.phone_number}. Inpatient cover UGX ${policy.sum_insured}. Go to My Account to ADD details`;
            if (status_code === "TS") {
                yield (0, sendSMS_1.default)(to, paymentMessage);
                let registerAARUser, updatePremiumData, updatedPolicy, installment;
                if (!user.arr_member_number) {
                    registerAARUser = yield (0, aar_1.registerPrincipal)(user, policy, beneficiary, airtel_money_id);
                    console.log("AAR USER", registerAARUser);
                    if (registerAARUser.code == 200) {
                        user.arr_member_number = registerAARUser.member_no;
                        yield user.save();
                        updatePremiumData = yield (0, aar_1.updatePremium)(user, policy, airtel_money_id);
                        console.log("AAR UPDATE PREMIUM", updatePremiumData);
                    }
                }
                if (user.arr_member_number) {
                    const memberStatus = yield (0, aar_1.fetchMemberStatusData)({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
                    console.log("MEMBER STATUS", memberStatus);
                    policy.arr_policy_number = memberStatus.policy_no;
                }
                const payment = yield Payment.create({
                    payment_amount: amount,
                    payment_type: "airtel money stk push",
                    user_id,
                    policy_id,
                    payment_status: "paid",
                    payment_description: message,
                    payment_date: new Date(),
                    payment_metadata: req.body,
                    partner_id,
                });
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
                updatedPolicy = yield updateUserPolicyStatus(policy, parseInt(amount), policy.installment_order, policy.installment_type);
                // AAR renewal
                console.log("=== PAYMENT ===", payment);
                console.log("=== TRANSACTION === ", transactionData);
                console.log("=== UPDATED POLICY ===", updatedPolicy);
                console.log("=== INSTALLMENT ===", installment);
                console.log("=== REGISTERED AAR USER ===", registerAARUser);
                console.log("=== UPDATED PREMIUM DATA ===", updatePremiumData);
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
