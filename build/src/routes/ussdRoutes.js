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
const Transaction = db_1.db.transactions;
const Payment = db_1.db.payments;
const Policy = db_1.db.policies;
const Users = db_1.db.users;
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
const updateUserPolicyStatus = (policy, transactionAmount, installment_order) => __awaiter(void 0, void 0, void 0, function* () {
    let date = new Date();
    let installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1);
    policy.policy_status = "paid";
    policy.policy_paid_date = new Date();
    console.log("POLICY START", policy);
    if (policy.policy_paid_amount === null) {
        policy.policy_paid_amount = 0;
    }
    if (parseFloat(policy.policy_paid_amount) < parseInt(policy.premium) && parseInt(policy.policy_pending_premium) > 0) {
        policy.policy_next_deduction_date = installment_alert_date;
        policy.installment_date = installment_alert_date;
        policy.installment_alert_date = installment_alert_date;
        policy.installment_order = installment_order;
    }
    else {
        policy.policy_paid_amount = parseInt(policy.premium);
        policy.policy_pending_premium = 0;
    }
    let installment = yield db_1.db.installments.findAll({
        where: {
            policy_id: policy.policy_id,
        },
    });
    console.log("INSTALLMENT", installment);
    //REDUCE AMOUNT FROM INSTALLMENT 
    const installmentAmount = installment.reduce((acc, installment) => {
        return acc + parseInt(installment.installment_deduction_amount);
    }, 0);
    policy.policy_paid_amount = installmentAmount;
    policy.policy_pending_premium = parseInt(policy.premium) - installmentAmount;
    console.log("INSTALLMENT AMOUNT", installmentAmount, policy.policy_pending_premium, policy.policy_paid_amount, policy.premium);
    console.log("POLICY END", policy);
    yield policy.save();
});
// {
//   "transaction": {
//     "id": "BBZMiscxy",
//     "message": "Paid UGX 5,000 to TECHNOLOGIES LIMITED Charge UGX 140, Trans ID MP210603.1234.L06941.",
//     "status_code": "TS",
//     "airtel_money_id": "MP210603.1234.L06941"
//   }
// }
// Callback endpoint
router.all("/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("CALLBACK REQUEST", req.body);
    try {
        let callbackReceived = false;
        // Handle the callback logic
        console.log("CALLBACK REQUEST", req.body);
        if (req.method === "POST") {
            // Handle POST request logic here
            const { id, status_code, message, airtel_money_id } = req.body.transaction;
            const transaction = yield findTransactionById(id);
            if (!transaction) {
                console.log("Transaction not found");
                return res.status(404).json({ message: "Transaction not found" });
            }
            // Update the transaction status
            yield transaction.update({
                status: "paid",
            });
            const policy_id = transaction.policy_id;
            const user_id = transaction.user_id;
            const user = yield Users.findOne({
                where: {
                    user_id: user_id,
                },
            });
            const policy = yield Policy.findOne({
                where: {
                    policy_id: policy_id,
                },
            });
            if (!policy) {
                console.log("Policy not found");
                return res.status(404).json({ message: "Policy not found" });
            }
            //update policy status
            const beneficiary = yield db_1.db.beneficiaries.findOne({
                where: {
                    user_id: user_id,
                },
            });
            let dollarUSLocale = Intl.NumberFormat("en-US");
            let premium = dollarUSLocale.format(policy.policy_deduction_amount);
            // Format date to dd/mm/yyyy
            let formatDate = (date) => {
                const dd = String(date.getDate()).padStart(2, "0");
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const yyyy = date.getFullYear();
                return `${dd}/${mm}/${yyyy}`;
            };
            // Assuming policy.policy_end_date and policy.policy_next_deduction_date are Date objects
            let policy_end_date = formatDate(policy.policy_end_date);
            let policy_next_deduction_date = formatDate(policy.policy_next_deduction_date);
            console.log("POLICY", policy_end_date, policy_next_deduction_date);
            const to = user.phone_number;
            const policyType = policy.policy_type.toUpperCase();
            //`Your monthly auto premium payment of UGX ${premium} for ${policyType} Medical cover was SUCCESSFUL.
            // Cover was extended till ${policy_end_date}. Next payment is on ${policy_next_deduction_date}.`;
            //Medical cover SMS 1: BOUGHT Medical cover for 07XXXXXXXX [FIRST NAME] [LAST NAME]. Inpatient cover 10,000  Go to My Account to ADD details
            const paymentMessage = `Dear ${user.first_name}, you have successfully bought ${policyType} Medical cover for ${user.phone_number}. Inpatient cover UGX ${policy.sum_insured}. Go to My Account to ADD details`;
            // Count characters in the message
            const messageLength = paymentMessage.length;
            console.log("MESSAGE LENGTH", messageLength, paymentMessage);
            if (status_code == "TS") {
                // Send SMS to user
                yield (0, sendSMS_1.default)(to, paymentMessage);
                if (user.arr_member_number == null || user.arr_member_number == "") {
                    const registerAARUser = yield (0, aar_1.registerPrincipal)(user, policy, beneficiary, airtel_money_id);
                    console.log("AAR USER", registerAARUser);
                }
                yield Payment.create({
                    payment_amount: transaction.amount,
                    payment_type: "airtel money payment",
                    user_id: transaction.user_id,
                    policy_id: transaction.policy_id,
                    payment_status: "paid",
                    payment_description: message,
                    payment_date: new Date(),
                    payment_metadata: req.body,
                    partner_id: transaction.partner_id,
                });
                console.log("Payment record created successfully");
                console.log(" =========== INSTALLMENT ========", policy.policy_paid_amount !== parseInt(policy.premium), policy.policy_paid_amount, policy.premium);
                if (policy.installment_order > 0) {
                    // plus one month to today's date
                    let date = new Date();
                    let installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1);
                    let installment_order = yield db_1.db.installments.count({
                        where: {
                            policy_id: policy.policy_id,
                        },
                    });
                    installment_order = installment_order + 1;
                    // create installment
                    yield db_1.db.installments.create({
                        installment_id: (0, uuid_1.v4)(),
                        policy_id: policy.policy_id,
                        installment_order: installment_order,
                        installment_date: new Date(),
                        installment_alert_date: installment_alert_date,
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
                    yield updateUserPolicyStatus(policy, parseInt(transaction.amount), installment_order);
                    //await initiateConsent(policyType,policy.policy_start_date, policy_end_date, user.phone_number, policy.policy_deduction_amount , policy.premium)
                }
                res.status(200).json({ message: "Payment record created successfully" });
            }
            else {
                yield Payment.create({
                    payment_amount: transaction.amount,
                    payment_type: "airtel money payment",
                    user_id: transaction.user_id,
                    policy_id: transaction.policy_id,
                    payment_status: "failed",
                    payment_description: message,
                    payment_date: new Date(),
                    payment_metadata: req.body,
                });
                console.log("Payment record created successfully");
                res.status(200).json({ code: 200, message: "POST request handled successfully" });
            }
        }
        else if (req.method === "GET") {
            // Handle GET request logic here
            console.log(req.body);
            const { id, status_code, message, airtel_money_id } = req.body.transaction;
            const transaction = yield findTransactionById(id);
            if (!transaction) {
                console.log("Transaction not found");
                return res.status(404).json({ message: "Transaction not found" });
            }
            // Update the transaction status
            yield transaction.update({
                status: "paid",
            });
            const policy_id = transaction.policy_id;
            const user_id = transaction.user_id;
            const user = yield Users.findOne({
                where: {
                    user_id: user_id,
                },
            });
            const policy = yield Policy.findOne({
                where: {
                    policy_id: policy_id,
                },
            });
            if (!policy) {
                console.log("Policy not found");
                return res.status(404).json({ message: "Policy not found" });
            }
            //update policy status
            const beneficiary = yield db_1.db.beneficiaries.findOne({
                where: {
                    user_id: user_id,
                },
            });
            let dollarUSLocale = Intl.NumberFormat("en-US");
            let premium = dollarUSLocale.format(policy.policy_deduction_amount);
            // Format date to dd/mm/yyyy
            let formatDate = (date) => {
                const dd = String(date.getDate()).padStart(2, "0");
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const yyyy = date.getFullYear();
                return `${dd}/${mm}/${yyyy}`;
            };
            // Assuming policy.policy_end_date and policy.policy_next_deduction_date are Date objects
            let policy_end_date = formatDate(policy.policy_end_date);
            let policy_next_deduction_date = formatDate(policy.policy_next_deduction_date);
            console.log("POLICY", policy_end_date, policy_next_deduction_date);
            const to = user.phone_number;
            const policyType = policy.policy_type.toUpperCase();
            //`Your monthly auto premium payment of UGX ${premium} for ${policyType} Medical cover was SUCCESSFUL.
            // Cover was extended till ${policy_end_date}. Next payment is on ${policy_next_deduction_date}.`;
            //Medical cover SMS 1: BOUGHT Medical cover for 07XXXXXXXX [FIRST NAME] [LAST NAME]. Inpatient cover 10,000  Go to My Account to ADD details
            const paymentMessage = `Dear ${user.first_name}, you have successfully bought ${policyType} Medical cover for ${user.phone_number}. Inpatient cover UGX ${policy.sum_insured}. Go to My Account to ADD details`;
            // Count characters in the message
            const messageLength = paymentMessage.length;
            console.log("MESSAGE LENGTH", messageLength, paymentMessage);
            if (status_code == "TS") {
                // Send SMS to user
                yield (0, sendSMS_1.default)(to, paymentMessage);
                if (user.arr_member_number == null || user.arr_member_number == "") {
                    const registerAARUser = yield (0, aar_1.registerPrincipal)(user, policy, beneficiary, airtel_money_id);
                    console.log("AAR USER", registerAARUser);
                }
                yield Payment.create({
                    payment_amount: transaction.amount,
                    payment_type: "airtel money payment",
                    user_id: transaction.user_id,
                    policy_id: transaction.policy_id,
                    payment_status: "paid",
                    payment_description: message,
                    payment_date: new Date(),
                    payment_metadata: req.body,
                    partner_id: transaction.partner_id,
                });
                console.log("Payment record created successfully");
                console.log(" =========== INSTALLMENT ========", policy.policy_paid_amount !== parseInt(policy.premium), policy.policy_paid_amount, policy.premium);
                if (policy.installment_order > 0) {
                    // plus one month to today's date
                    let date = new Date();
                    let installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1);
                    let installment_order = yield db_1.db.installments.count({
                        where: {
                            policy_id: policy.policy_id,
                        },
                    });
                    installment_order = installment_order + 1;
                    // create installment
                    yield db_1.db.installments.create({
                        installment_id: (0, uuid_1.v4)(),
                        policy_id: policy.policy_id,
                        installment_order: installment_order,
                        installment_date: new Date(),
                        installment_alert_date: installment_alert_date,
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
                    yield updateUserPolicyStatus(policy, parseInt(transaction.amount), installment_order);
                }
                res.status(200).json({ message: "Payment record created successfully" });
            }
            else {
                yield Payment.create({
                    payment_amount: transaction.amount,
                    payment_type: "airtel money payment",
                    user_id: transaction.user_id,
                    policy_id: transaction.policy_id,
                    payment_status: "failed",
                    payment_description: message,
                    payment_date: new Date(),
                    payment_metadata: req.body,
                });
                // await sendSMS(to, message);
                res.status(200).send("GET request handled successfully");
            }
        }
        else {
            // Handle other HTTP methods (PUT, DELETE, etc.) or return an error
            res.status(405).send("Method Not Allowed");
        }
    }
    catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
}));
module.exports = router;
