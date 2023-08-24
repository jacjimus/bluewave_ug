import express from 'express';
import ussdUgaMenuBuilder from '../menu-builder';
import ussdKenMenuBuilder from '../menu-ken-builder';
import sendSMS from '../services/sendSMS';
import { db } from '../models/db'


const Transaction = db.transactions;
const Payment = db.payments;
const Policy = db.policies;
const Users = db.users


const router = express.Router()


const handleUSSDRequest = async (req: any, res:any, menuBuilder: any) => {
    try {
        console.log(req.body);
        const menu_res = await menuBuilder(req.body, db);
        res.send(menu_res);
    } catch (error) {
        console.log('MENU ERROR', error);
        res.status(500).send(error);
    }
};

router.post('/uga', async (req: any, res: any) => {
    await handleUSSDRequest(req, res, ussdUgaMenuBuilder);
});

router.post('/ken', async (req: any, res:any) => {
    await handleUSSDRequest(req, res, ussdKenMenuBuilder);
});



// Callback endpoint
router.post('/callback', async (req, res) => {
    try {
        console.log(req.body);
        const { id, status_code, message } = req.body;

        const transaction = await Transaction.findOne({
            where: {
                transaction_reference: id
            }
        });

        if (!transaction) {
            console.log('Transaction not found');
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Update the transaction status
        await transaction.update({
            status: 'paid'
        });

        const policy_id = transaction.policy_id;
        const user_id = transaction.user_id;

        const user = await Users.findOne({
            where: {
                user_id: user_id
            }
        });

        const policy = await Policy.findOne({
            where: {
                policy_id: policy_id
            }
        });

        const to = '254' + user.phone_number.substring(1);
        const paymentMessage = `Your monthly auto premium payment of Kes ${policy.policy_deduction_amount} for ${policy.policy_type} Medical cover was SUCCESSFUL. Cover was extended till ${policy.policy_end_date}. Next payment is on DD/MM/YY.`;

        sendSMS(to, paymentMessage);

        await Payment.create({
            payment_amount: transaction.amount,
            payment_type: 'airtel ussd payment',
            user_id: transaction.user_id,
            policy_id: transaction.policy_id,
            payment_status: 'paid',
            payment_description: message,
            payment_date: new Date()
        });

        console.log('Payment record created successfully');
        res.status(200).json({ message: 'Payment record created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;

