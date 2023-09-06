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
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const db_1 = require("../models/db");
const User = db_1.db.users;
const Transaction = db_1.db.transactions;
function getAuthToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post('https://openapiuat.airtel.africa/merchant/v1/payments/oauth2/token', {
                client_id: process.env.AIRTEL_CLIENT_ID,
                client_secret: process.env.AIRTEL_CLIENT_SECRET,
                grant_type: 'client_credentials',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 200) {
                const { access_token } = response.data;
                return access_token;
            }
            else {
                throw new Error(`Failed to get authentication token: ${response.statusText}`);
            }
        }
        catch (error) {
            throw new Error(`An error occurred while getting the authentication token: ${error.message}`);
        }
    });
}
function createTransaction(user_id, partner_id, policy_id, transactionId, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('TRANSACTION ID', transactionId, 'AMOUNT', amount, 'USER ID', user_id, 'POLICY ID', policy_id, 'PARTNER ID', partner_id);
            const transaction = yield Transaction.create({
                transaction_id: (0, uuid_1.v4)(),
                amount: amount,
                status: 'pending',
                user_id: user_id,
                transaction_reference: transactionId,
                policy_id: policy_id,
                partner_id: partner_id,
            });
            console.log('TRANSACTION', transaction);
            return transaction;
        }
        catch (error) {
            throw new Error(`Failed to create a transaction: ${error.message}`);
        }
    });
}
function airtelMoney(user_id, partner_id, policy_id, phoneNumber, amount, reference) {
    return __awaiter(this, void 0, void 0, function* () {
        const status = {
            code: 200,
            result: "",
            message: 'Payment successfully initiated'
        };
        try {
            const token = yield getAuthToken();
            const PAYMENT_URL = process.env.AIRTEL_PAYMENT_URL;
            const paymentData = {
                reference: reference,
                subscriber: {
                    country: 'UG',
                    currency: 'UGX',
                    msisdn: phoneNumber,
                },
                transaction: {
                    amount: amount,
                    country: 'UG',
                    currency: 'UGX',
                    id: (0, uuid_1.v4)(),
                },
            };
            const headers = {
                'Content-Type': 'application/json',
                Accept: '/',
                'X-Country': 'UG',
                'X-Currency': 'UGX',
                Authorization: `Bearer ${token}`,
            };
            const response = yield axios_1.default.post(PAYMENT_URL, paymentData, { headers });
            console.log('RESPONCE AIRTEL MONEY', response.data);
            if (response.data.status.code == '200') {
                const transaction = response.data.data.transaction;
                console.log('TRANSACTION', transaction);
                yield createTransaction(user_id, partner_id, policy_id, transaction.id, amount);
                status.result = response.data.status;
                return status;
            }
            else {
                status.code = 500;
                throw new Error('Transaction failed');
            }
        }
        catch (error) {
            console.error('ERROR:', error);
            status.code = 500;
            status.message = 'Sorry, Transaction failed';
            return status;
        }
    });
}
exports.default = airtelMoney;
