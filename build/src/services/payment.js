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
const Transaction = db_1.db.transactions;
function airtelMoney(user_id, phoneNumber, amount, reference, uuid) {
    return __awaiter(this, void 0, void 0, function* () {
        let status = {
            code: 200,
            message: ""
        };
        let token = yield (0, auth_1.default)();
        const inputBody = {
            "reference": reference,
            "subscriber": {
                "country": "UG",
                "currency": "UGX",
                "msisdn": phoneNumber,
            },
            "transaction": {
                "amount": amount,
                "country": "UG",
                "currency": "UGX",
                "id": uuid,
            }
        };
        console.log("INPUT", inputBody);
        const headers = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Authorization': 'Bearer ' + token
        };
        const PAYMENT_URL = process.env.AIRTEL_PAYMENT_URL;
        yield axios_1.default.post(PAYMENT_URL, inputBody, { headers })
            .then(response => {
            console.log(response.data);
            //     {
            //         "data": {
            //           "transaction": {
            //             "id": "ASDJBEJB4KRN5",
            //             "status": "SUCCESS"
            //           }
            //         },
            //         "status": {
            //           "code": "200",
            //           "message": "SUCCESS",
            //           "result_code": "ESB000010",
            //           "response_code": "DP00800001006",
            //           "success": true
            //         }
            //   }
            //
            if (response.data.status.code == 200) {
                //create a transaction
                let transaction = Transaction.create({
                    amount: amount,
                    status: "pending",
                    user_id: user_id,
                    transaction_reference: response.data.data.transaction.id,
                });
                console.log("TRANSACTION", transaction);
                status.result = response.data.status.code;
            }
            else {
                console.log("TRANSACTION FAILED");
                throw new Error("Transaction failed");
            }
            return status;
        }).catch(error => {
            console.error(error);
        });
    });
}
exports.default = airtelMoney;
