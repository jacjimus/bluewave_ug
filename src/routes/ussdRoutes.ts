import express from 'express';
import ussdMenuBuilder from '../menu-builder';
import ussdKenMenuBuilder from '../menu-ken-builder';
import sendSMS from '../services/sendSMS';
import { db } from '../models/db'


const Transaction = db.transactions;
const Payment = db.payments;
const Policy = db.policies;
const Users = db.users


const router = express.Router()



router.post('/UGA', async (req, res) => {
    console.log(req.body)
    let menu_res: any;

    try {

        // RUN THE MENU BUILDER
        // PASS REQ BODY AND REDIS CLIENT
        menu_res = await ussdMenuBuilder(req.body, db);

    } catch (e) {
        console.log("MENU ERROR", e);
        return res.send(e)

    }
    res.send(menu_res);
})

router.post('/KEN', async (req, res) => {
    console.log(req.body)
    let menu_res: any;

    try {

        // RUN THE MENU BUILDER
        // PASS REQ BODY AND REDIS CLIENT
        menu_res = await ussdKenMenuBuilder(req.body, db);

    } catch (e) {
        console.log("MENU ERROR", e);
        return res.send(e)

    }
    res.send(menu_res);
})

//call back endpoint
router.post('/callback', async (req: any, res: any) => {
    console.log(req.body)
    let { id, status_code , message} = req.body

    try {
       
            // transaction: {
            //     "id": "BBZMiscxy",
            //     "message": "Paid UGX 5,000 to TECH LIMITED, Trans ID MP210603.1234.L06941.",
            //     "status_code": "TS",
            //     "airtel_money_id": "MP210603.1234.L06941"
            //   },

            //find the transaction in the database
            await Transaction.findOne({
                where: {
                    transaction_reference: id
                }
            }).then((transaction: any) => {
                    //update the transaction status
                    transaction.update({
                        status: "paid",

                    })

                    //get policy details from the transaction
                    const policy_id = transaction.policy_id;
                    //get user details from the transaction
                    const user_id = transaction.user_id;

                    // get user and policy details from db

                    let user = Users.findOne({
                        where: {
                            user_id: user_id
                        }
                    })

                    //get policy details from db
                    let policy = Policy.findOne({
                        where: {
                            policy_id: policy_id
                        }
                    })


                     //send sms

                     const to = '254' + user.phone_number.substring(1);
                     const message = `Your monthly auto premium payment of Kes ${policy.policy_deduction_amount} for ${policy.policy_type} Medical cover was SUCCESSFUL. Cover was extended till ${policy.policy_end_date}. Next payment is on DD/MM/YY
                     `;
                   

                    sendSMS(to, message);

                    //create a payment record
                    Payment.create({
                        payment_amount: transaction.amount,
                        payment_type: "airtel ussd payment",
                        user_id: transaction.user_id,
                        policy_id: transaction.policy_id,
                        payment_status: "paid",
                        //payment_status_code: status_code,
                        payment_description: message,
                        payment_date: new Date(),
                    })
                        .then((payment: any) => {
                            console.log(payment)

                            
                        })
                        .catch((error: any) => {
                            console.log(error)
                        })
                })
        }catch (error) {
        console.log(error)
        
    }       
})


module.exports = router