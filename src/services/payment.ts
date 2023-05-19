
import axios from 'axios';
import authToken from './auth';
import { db } from "../models/db";
require('dotenv').config()


const Transaction = db.transactions;


async function airtelMoney(user_id: any, phoneNumber: any, amount: any, reference: any, uuid: any) {
    let status:any ={
        code: 200,
        message: ""
    }
    let token = await authToken();
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
    console.log("INPUT", inputBody)
    const headers = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Authorization': 'Bearer ' + token
    };


    const PAYMENT_URL = process.env.AIRTEL_PAYMENT_URL;
    await axios.post(PAYMENT_URL, inputBody, { headers })
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

                console.log("TRANSACTION", transaction)
                status.result = response.data.status.code

            } else {
                console.log("TRANSACTION FAILED")
                throw new Error("Transaction failed");
            }
            return status;

        }).catch(error => {
            console.error(error)
        })
}


export default airtelMoney;