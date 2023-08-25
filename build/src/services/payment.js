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
const auth_1 = __importDefault(require("./auth"));
const db_1 = require("../models/db");
require('dotenv').config();
const uuid_1 = require("uuid");
const User = db_1.db.users;
const Transaction = db_1.db.transactions;
const Payment = db_1.db.payments;
function airtelMoney(user_id, partner_id, policy_id, phoneNumber, amount, reference, uuid) {
    return __awaiter(this, void 0, void 0, function* () {
        let status = {
            code: 200,
            result: "Payment succefully innitiated",
            message: ""
        };
        try {
            let token = yield (0, auth_1.default)();
            let user = yield User.findOne({
                where: {
                    user_id: user_id,
                    partner_id: partner_id
                }
            });
            const inputBody = {
                "reference": reference,
                "subscriber": {
                    "country": user.currency_code === "KEN" ? "KE" : "UG",
                    "currency": user.currency_code,
                    "msisdn": phoneNumber,
                },
                "transaction": {
                    "amount": amount,
                    "country": user.currency_code === "KEN" ? "KE" : "UG",
                    "currency": user.currency_code,
                    "id": uuid,
                }
            };
            const headers = {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Authorization': 'Bearer ' + token
            };
            const PAYMENT_URL = process.env.AIRTEL_PAYMENT_URL;
            const response = yield axios_1.default.post(PAYMENT_URL, inputBody, { headers });
            if (response.data.status.code === 200) {
                // Create a transaction
                let transaction = yield Transaction.create({
                    transaction_id: (0, uuid_1.v4)(),
                    amount: amount,
                    status: "pending",
                    user_id: user_id,
                    transaction_reference: response.data.data.transaction.id,
                    policy_id: policy_id,
                    partner_id: partner_id
                });
                console.log("Transaction", transaction);
                return status;
            }
            else {
                throw new Error("Transaction failed");
            }
        }
        catch (error) {
            console.log("ERROR:", error.message);
            status.code = 500;
            status.message = "Sorry, Transaction failed";
            return status;
        }
    });
}
exports.default = airtelMoney;
