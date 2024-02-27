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
exports.processPolicy = exports.updateUserPolicyStatus = exports.findTransactionById = void 0;
const express_1 = __importDefault(require("express"));
const menu_uga_builder_1 = __importDefault(require("../menu-uga-builder"));
const menu_ken_builder_1 = __importDefault(require("../menu-ken-builder"));
const menu_vodacom_builder_1 = __importDefault(require("../menu-vodacom-builder"));
const sendSMS_1 = __importDefault(require("../services/sendSMS"));
const db_1 = require("../models/db");
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
    yield handleUSSDRequest(req, res, menu_uga_builder_1.default);
}));
router.post("/uat/uga", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleUSSDRequest(req, res, menu_uga_builder_1.default);
}));
router.post("/uat/ken", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleUSSDRequest(req, res, menu_ken_builder_1.default);
}));
router.post("/uat/vodacom", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleUSSDRequest(req, res, menu_vodacom_builder_1.default);
}));
const findTransactionById = (transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Transaction.findOne({
        where: {
            [db_1.db.Sequelize.Op.or]: [
                { transaction_id: transactionId },
                { transaction_reference: transactionId },
            ],
        },
    });
});
exports.findTransactionById = findTransactionById;
const updatePolicyDetails = (policy, amount, payment, airtel_money_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        amount = parseInt(amount);
        policy.policy_status = "paid";
        policy.bluewave_transaction_id = payment.payment_id;
        policy.airtel_transaction_id = airtel_money_id;
        policy.policy_paid_amount = amount;
        policy.policy_deduction_amount = amount;
        policy.premium = amount;
        yield policy.save();
        return policy;
    }
    catch (error) {
        console.error("Error updating policy details:", error);
        throw error;
    }
});
const updateInstallmentLogic = (policy, amount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let date = new Date();
        let installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1, policy.policy_deduction_day - 3);
        if (policy.policy_deduction_day - 3 < 1) {
            installment_alert_date = new Date(date.getFullYear(), date.getMonth(), 28);
        }
        policy.policy_paid_date = new Date();
        if (policy.installment_type === 2) {
            policy.policy_next_deduction_date = new Date(date.getFullYear(), date.getMonth() + 1, policy.policy_deduction_day);
            policy.installment_order = policy.policy_paid_amount == amount ? 1 : parseInt(policy.installment_order) + 1;
            policy.installment_alert_date = installment_alert_date;
            if (policy.policy_paid_amount !== policy.premium) {
                policy.policy_paid_amount = policy.policy_paid_amount + amount;
                policy.policy_pending_premium = policy.policy_pending_amount - amount;
            }
            if (policy.policy_pending_premium + policy.policy_paid_amount !== policy.yearly_premium) {
                policy.policy_pending_premium = policy.yearly_premium - policy.policy_paid_amount;
            }
            yield policy.save();
        }
        else {
            policy.policy_next_deduction_date = new Date(date.getFullYear() + 1, date.getMonth(), date.getDate());
            if (policy.installment_order == 12) {
                policy.policy_status = "expired";
            }
            yield policy.save();
        }
    }
    catch (error) {
        console.error("Error updating installment logic:", error);
        throw error;
    }
});
const updateUserInformation = (policy) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const policyPaidCountOfUser = yield db_1.db.policies.count({
            where: { user_id: policy.user_id, policy_status: "paid" }
        });
        yield db_1.db.users.update({ number_of_policies: policyPaidCountOfUser }, {
            where: { user_id: policy.user_id }
        });
    }
    catch (error) {
        console.error("Error updating user information:", error);
        throw error;
    }
});
const updateUserPolicyStatus = (policy, amount, payment, airtel_money_id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("UPDATE STATUS WAS CALLED", policy);
    try {
        yield updatePolicyDetails(policy, amount, payment, airtel_money_id);
        yield updateInstallmentLogic(policy, amount);
        yield updateUserInformation(policy);
        console.log("===========POLICY PAID =======", policy);
        return policy;
    }
    catch (error) {
        console.error("Error updating policy status:", error);
        throw error;
    }
});
exports.updateUserPolicyStatus = updateUserPolicyStatus;
// POST and GET request handler
router.all("/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (req.method === "POST" || req.method === "GET") {
            const { transaction } = req.body;
            console.log("AIRTEL CALLBACK", transaction);
            const { id, status_code, message, airtel_money_id } = transaction;
            const transactionData = yield (0, exports.findTransactionById)(id);
            if (!transactionData) {
                console.log("Transaction not found");
                return res.status(404).json({ message: "Transaction not found" });
            }
            const { policy_id, user_id, amount, partner_id } = transactionData;
            if (status_code === "TS") {
                yield transactionData.update({ status: "paid" });
                const user = yield Users.findOne({ where: { user_id } });
                let policy = yield db_1.db.policies.findOne({
                    where: {
                        policy_id,
                        user_id,
                    }
                });
                if (!policy) {
                    return res.status(404).json({ message: "Policy not found" });
                }
                policy.airtel_money_id = airtel_money_id;
                const to = (0, utils_1.formatPhoneNumber)(user.phone_number);
                //const period = policy.installment_type === 1 ? "yearly" : "monthly";
                const payment = yield createPaymentRecord(policy, amount, user_id, policy_id, message, req.body, partner_id);
                console.log("Payment record created successfully");
                let updatedPolicy = yield (0, exports.updateUserPolicyStatus)(policy, amount, payment, airtel_money_id);
                console.log("=== PAYMENT ===", payment);
                console.log("=== UPDATED POLICY ===", updatedPolicy);
                const members = (_a = policy.total_member_number) === null || _a === void 0 ? void 0 : _a.match(/\d+(\.\d+)?/g);
                console.log("MEMBERS", members, policy.total_member_number);
                //let proratedPercentage = calculateProrationPercentage(parseInt(policy.installment_order));
                const thisDayThisMonth = policy.installment_type === 2 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1) : new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1);
                let sum_insured = policy.sum_insured;
                let last_expense_insured = policy.last_expense_insured;
                policy.policy_status = "paid";
                policy.save();
                let congratText = generateCongratulatoryText(policy, user, members, sum_insured, last_expense_insured, thisDayThisMonth);
                yield sendSMSNotification(to, congratText);
                const memberStatus = yield (0, aar_1.fetchMemberStatusData)({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
                yield processPolicy(user, policy, memberStatus);
                return res.status(200).json({
                    code: 200,
                    status: "OK", message: "Payment record created successfully"
                });
            }
            else {
                yield handleFailedPaymentRecord(amount, user_id, policy_id, message, req.body, partner_id);
                console.log("Payment record for failed transaction created");
                return res.status(200).json({
                    code: 200,
                    status: "OK", message: "POST/GET request handled successfully"
                });
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
const createPaymentRecord = (policy, amount, user_id, policy_id, description, metadata, partner_id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Payment.create({
        payment_amount: amount,
        payment_type: `Airtel Money Uganda STK Push for ${policy.beneficiary.toUpperCase()} ${policy.policy_type.toUpperCase()} ${policy.installment_type === 1 ? "yearly" : "monthly"} payment`,
        user_id,
        policy_id,
        payment_status: "paid",
        payment_description: description,
        payment_date: new Date(),
        payment_metadata: metadata,
        partner_id,
    });
});
const calculateInsuredAmounts = (policy, proratedPercentage) => {
    const sumInsured = policy.sum_insured;
    //* (proratedPercentage / 100);
    const lastExpenseInsured = policy.last_expense_insured;
    //* (proratedPercentage / 100);
    return { sumInsured, lastExpenseInsured };
};
const generateCongratulatoryText = (policy, user, members, sumInsured, lastExpenseInsured, thisDayThisMonth) => {
    if (policy.beneficiary === "FAMILY") {
        return `Congratulations! You and ${members} dependent are each covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`;
    }
    else if (policy.beneficiary === "SELF") {
        return `Congratulations! You bought ${policy.policy_type} cover for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`;
    }
    else if (policy.beneficiary === "OTHER")
        return `${user.first_name} has bought for you Ddwaliro Care for Inpatient ${sumInsured} and Funeral benefit of ${lastExpenseInsured}. Dial *185*7*6# on Airtel to enter next of kin & view more details`;
};
const sendSMSNotification = (to, congratText) => __awaiter(void 0, void 0, void 0, function* () {
    yield sendSMS_1.default.sendSMS(2, to, congratText);
});
const handleFailedPaymentRecord = (amount, user_id, policy_id, description, metadata, partner_id) => __awaiter(void 0, void 0, void 0, function* () {
    yield Payment.create({
        payment_amount: amount,
        payment_type: "airtel money payment",
        user_id,
        policy_id,
        payment_status: "failed",
        payment_description: description,
        payment_date: new Date(),
        payment_metadata: metadata,
        partner_id,
    });
});
function processPolicy(user, policy, memberStatus) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(policy === null || policy === void 0 ? void 0 : policy.total_member_number);
        const number_of_dependants = parseFloat(policy === null || policy === void 0 ? void 0 : policy.total_member_number.split("")[2]) || 0;
        console.log("Number of dependants:", number_of_dependants);
        if ((memberStatus === null || memberStatus === void 0 ? void 0 : memberStatus.code) === 200) {
            console.log("", memberStatus);
            yield db_1.db.policies.update({ arr_policy_number: memberStatus.policy_no }, { where: { policy_id: policy.policy_id } });
        }
        else {
            const registerAARUser = yield (0, aar_1.registerPrincipal)(user, policy);
            user.arr_member_number = registerAARUser === null || registerAARUser === void 0 ? void 0 : registerAARUser.member_no;
            if (number_of_dependants > 0) {
                yield (0, aar_1.createDependant)(user, policy);
            }
            else {
                console.log("AAR NUMBER- member found", user.phone_number, user.name, user.arr_member_number);
                const updatePremiumData = yield (0, aar_1.updatePremium)(user, policy);
                console.log("AAR UPDATE PREMIUM - member found", updatePremiumData);
            }
        }
    });
}
exports.processPolicy = processPolicy;
// POST and GET request handler
router.all("/callback/kenya", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        if (req.method === "POST" || req.method === "GET") {
            const { transaction } = req.body;
            console.log("AIRTEL CALLBACK", transaction);
            const { id, status_code, message, airtel_money_id } = transaction;
            const transactionData = yield (0, exports.findTransactionById)(id);
            if (!transactionData) {
                console.log("Transaction not found");
                return res.status(404).json({ message: "Transaction not found" });
            }
            const { policy_id, user_id, amount, partner_id } = transactionData;
            const user = yield db_1.db.users.findOne({ where: { user_id } });
            let policy = yield db_1.db.policies.findOne({ where: { policy_id } });
            policy.airtel_money_id = airtel_money_id;
            if (!user || !policy) {
                return res.status(404).json({ message: "user or policy not found" });
            }
            const period = policy.installment_type == 1 ? "yearly" : "monthly";
            if (status_code == "TS") {
                yield transactionData.update({
                    status: "paid",
                });
                const payment = yield Payment.create({
                    payment_amount: amount,
                    payment_type: `Airtel Money Kenya Stk Push for ${policy.beneficiary.toUpperCase()} ${policy.policy_type.toUpperCase()} ${policy.installment_type === 1 ? "yearly" : "monthly"} payment`,
                    user_id,
                    policy_id,
                    payment_status: "paid",
                    payment_description: message,
                    payment_date: new Date(),
                    payment_metadata: req.body,
                    partner_id,
                });
                console.log("Payment record created successfully");
                let updatedPolicy = yield (0, exports.updateUserPolicyStatus)(policy, parseInt(amount), payment, airtel_money_id);
                console.log("=== PAYMENT ===", payment);
                console.log("=== TRANSACTION === ", transactionData);
                console.log("=== UPDATED POLICY ===", updatedPolicy);
                const members = (_b = policy.total_member_number) === null || _b === void 0 ? void 0 : _b.match(/\d+(\.\d+)?/g);
                console.log("MEMBERS", members, policy.total_member_number);
                const inPatientCover = (0, utils_1.formatAmount)(policy.inpatient_cover);
                const outPatientCover = (0, utils_1.formatAmount)(policy.outpatient_cover);
                const maternityCover = (0, utils_1.formatAmount)(policy.maternity_cover);
                const thisDayThisMonth = policy.installment_type === 2 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1) : new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1);
                let congratText = "";
                const to = `+256${user.phone_number}`;
                if (policy.beneficiary == "FAMILY") {
                    congratText = `Congratulations! You and ${members} dependent are each covered for Inpatient benefit of  Kshs ${inPatientCover}  and Maternity benefit of  Kshs ${maternityCover} . Cover valid till ${thisDayThisMonth.toDateString()}`;
                }
                else if (policy.beneficiary == "SELF") {
                    if (policy.policy_type.toUpperCase() == "BAMBA") {
                        congratText = `Congratulations! You are bought AfyaShua Mamba cover for Kshs 4,500/night  of hospitalisation up to a Maximum of 30 days.  Pay KShs ${policy.premium} every ${policy.policy_deduction_day} to stay covered `;
                    }
                    else if (policy.policy_type.toUpperCase() == "ZIDI") {
                        congratText = ` Congratulations! You bought AfyaShua Zidi cover for Inpatient KShs ${inPatientCover} and Maternity for KShs ${maternityCover} Pay KShs ${policy.premium} every ${policy.policy_deduction_day} to stay covered`;
                    }
                    else {
                        congratText = `Congratulations! You bought AfyaShua Smarta cover for Inpatient ${inPatientCover} Outpatient for ${outPatientCover} and Maternity for Kshs ${maternityCover}. Pay KShs ${policy.premium} every ${policy.policy_deduction_day} to stay covered`;
                    }
                }
                else if (policy.beneficiary == "OTHER") {
                    if (policy.policy_type.toUpperCase() == "BAMBA") {
                        congratText = `${user.first_name} has bought for you AfyaShua cover for Kshs 4,500 per night up to a Maximum of 30 days after one day of being hospitalized.
               Dial *334*7*3# on Airtel  to enter next of kin & view more details`;
                    }
                    else if (policy.policy_type.toUpperCase() == "ZIDI") {
                        congratText = `${user.first_name} has bought for you AfyaShua cover for Inpatient ${inPatientCover} and Maternity benefit of ${maternityCover}. Dial *185*7*6# on Airtel to enter next of kin & view more details`;
                    }
                }
                yield sendSMS_1.default.sendSMS(2, to, congratText);
                return res.status(200).json({
                    code: 200,
                    status: "OK",
                    message: "Payment record created successfully"
                });
            }
            else {
                yield Payment.create({
                    payment_amount: amount,
                    payment_type: "airtel money payment kenya",
                    user_id,
                    policy_id,
                    payment_status: "failed",
                    payment_description: message,
                    payment_date: new Date(),
                    payment_metadata: req.body,
                    partner_id: partner_id,
                });
                console.log("Payment  for failed record created");
                return res.status(200).json({
                    code: 200,
                    status: "OK", message: "POST/GET request handled successfully"
                });
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
exports.default = router;
