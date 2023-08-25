
import axios from 'axios';
import authToken from './auth';
import { db } from "../models/db";
require('dotenv').config();
import { v4 as uuidv4 } from 'uuid';

const User = db.users;
const Transaction = db.transactions;
const Payment = db.payments;

async function airtelMoney(user_id: any, partner_id: any, policy_id: any, phoneNumber: any, amount: any, reference: any, uuid: any) {
    let status: any = {
        code: 200,
        result: "Payment succefully innitiated",
        message: ""
    };

    try {
        let token = await authToken();

        let user = await User.findOne({
            where: {
                user_id: user_id,
                partner_id: partner_id
            }
        })

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
        const response = await axios.post(PAYMENT_URL, inputBody, { headers });

        if (response.data.status.code === 200) {
            // Create a transaction
            let transaction = await Transaction.create({
                transaction_id: uuidv4(),
                amount: amount,
                status: "pending",
                user_id: user_id,
                transaction_reference: response.data.data.transaction.id,
                policy_id: policy_id,
                partner_id: partner_id
            });

            console.log("Transaction", transaction)

            return status;
        } else {
            throw new Error("Transaction failed");
        }
    } catch (error) {
        console.log("ERROR:", error.message);
        status.code = 500;
        status.message = "Sorry, Transaction failed";
        return status;
    }
}

export default airtelMoney;
