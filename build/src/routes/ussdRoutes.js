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
        console.log('MENU ERROR', error);
        res.status(500).send(error);
    }
});
router.post('/uga', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleUSSDRequest(req, res, menu_builder_1.default);
}));
router.post('/ken', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleUSSDRequest(req, res, menu_ken_builder_1.default);
}));
// Callback endpoint
router.post('/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req.body);
        const { id, status_code, message, airtel_money_id } = req.body;
        const transaction = yield Transaction.findOne({
            where: {
                transaction_reference: id
            }
        });
        if (!transaction) {
            console.log('Transaction not found');
            return res.status(404).json({ message: 'Transaction not found' });
        }
        // Update the transaction status
        yield transaction.update({
            status: 'paid'
        });
        const policy_id = transaction.policy_id;
        const user_id = transaction.user_id;
        const user = yield Users.findOne({
            where: {
                user_id: user_id
            }
        });
        const policy = yield Policy.findOne({
            where: {
                policy_id: policy_id
            }
        });
        if (!policy) {
            console.log('Policy not found');
            return res.status(404).json({ message: 'Policy not found' });
        }
        const to = '254' + user.phone_number.substring(1);
        const paymentMessage = `Your monthly auto premium payment of Kes ${policy.policy_deduction_amount} for ${policy.policy_type} Medical cover was SUCCESSFUL. Cover was extended till ${policy.policy_end_date}. Next payment is on DD/MM/YY.`;
        if (status_code == 'TS') {
            // Send SMS to user
            yield (0, sendSMS_1.default)(to, paymentMessage);
            yield Payment.create({
                payment_amount: transaction.amount,
                payment_type: 'airtel money payment',
                user_id: transaction.user_id,
                policy_id: transaction.policy_id,
                payment_status: 'paid',
                payment_description: message,
                payment_date: new Date(),
                payment_metadata: req.body
            });
            console.log('Payment record created successfully');
            res.status(200).json({ message: 'Payment record created successfully' });
        }
        else {
            yield Payment.create({
                payment_amount: transaction.amount,
                payment_type: 'airtel money payment',
                user_id: transaction.user_id,
                policy_id: transaction.policy_id,
                payment_status: 'failed',
                payment_description: message,
                payment_date: new Date(),
                payment_metadata: req.body
            });
            console.log('Payment record created successfully');
            res.status(200).json({ message: 'Payment record created successfully' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}));
module.exports = router;
