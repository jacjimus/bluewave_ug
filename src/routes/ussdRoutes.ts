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


const handleUSSDRequest = async (req: any, res: any, menuBuilder: any) => {
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

router.post('/ken', async (req: any, res: any) => {
    await handleUSSDRequest(req, res, ussdKenMenuBuilder);
});



// Callback endpoint
router.post('/callback', async (req, res) => {
    try {
        console.log(req.body);
        const { id, status_code, message, airtel_money_id } = req.body;

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

        if (!policy) {
            console.log('Policy not found');
            return res.status(404).json({ message: 'Policy not found' });
        }
//update policy status
        await policy.update({
            policy_status: 'paid'
        });
        

        let dollarUSLocale = Intl.NumberFormat('en-US');
        let premium = dollarUSLocale.format(policy.policy_deduction_amount);
// Format date to dd/mm/yyyy
let formatDate = (date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  
  // Assuming policy.policy_end_date and policy.policy_next_deduction_date are Date objects
  let policy_end_date = formatDate(policy.policy_end_date);
  let policy_next_deduction_date = formatDate(policy.policy_next_deduction_date);
  
  console.log("POLICY", policy_end_date, policy_next_deduction_date);
  
  const to = user.phone_number;

  const policyType = policy.policy_type.toUpperCase();
  const paymentMessage = `Your monthly auto premium payment of UGX ${premium} for ${policyType} Medical cover was SUCCESSFUL. Cover was extended till ${policy_end_date}. Next payment is on ${policy_next_deduction_date}.`;
  
  // Count characters in the message
  const messageLength = paymentMessage.length;
  console.log("MESSAGE LENGTH", messageLength, paymentMessage);
 

        if (status_code == 'TS') {
            // Send SMS to user
         await sendSMS(to, paymentMessage);

            await Payment.create({
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
        } else {
            await Payment.create({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

module.exports = router;

