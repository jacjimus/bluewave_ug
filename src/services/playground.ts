const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize')
import cron from 'node-cron';
import { createDependant, fetchMemberStatusData, getMemberNumberData, reconciliation, registerDependant, registerPrincipal, updatePremium } from './aarServices';
import SMSMessenger from './sendSMS';
import fs from 'fs/promises';
import { db } from '../models/db';
import { getNewPolicies, numberAndValueOfFailedPayments } from './report';
import Queue from 'bull';
import { createTransaction, reconcilationCallback, sendCongratulatoryMessage } from './payment';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
// import { google } from 'googleapis';

// const serviceAccountKeyFile = "./aitel-payment-reconciliation-abe90c6ab59e.json"
// const sheetId = '1Q4IB0vzghTIIirbGdU49UY2FPfESViXaY77oGy44J3I'
// const tabName = 'Ddwaliro Care Airtel Payments'
// const range = 'A:R'


// transacactions_id phone_number premium
// 100915364940	740652878		10,000
// 100912573629	758287730		20,000
// 100911621416	756376193		5,000
// 100910946759	703708188		18,000
// 100908502544	750645461		5,000
// 100908320058	701734676		5,000
// 100908175553	750645461		5,000
// 100907190212	750645461		5,000
// 100906971906	756303480		5,000
// 100906846857	707149608		18,000
// 100906423448	756303480		5,000
// 100904668221	704221883		14,000
// 100904317742	752331734		5,000
// 100900414639	755837732		5,000
// 100900137885	752746276		5,000
// 100899428590	753213526		5,000
// 100892591546	740587580		18,000
// 100891264531	751097925		14,000
// 100889183982	706466554		5,000
// 100888123237	708050493		5,000
// 100887245895	751639729		5,000
// 100885286238	759326434		5,000
// 100885160479	759326434		5,000
// 100883318846	751639729		10,000
// 100882315099	741616002		5,000
// 100881644246	751000781		5,000
// 100881268297	755400599		5,000
// 100880723356	759858691		5,000
// 100880691339	750713069		10,000
// 100880556432	759597004		208,000
// 100879170654	706600201		5,000
// 100876731056	703827792		5,000
// 100871558241	703652496		5,000
// 100871556829	750454417		10,000
// 100871433692	750748532		18,000


const array_of_phone_numbers = [

  { phone_number: '740652878',premium: 10000,airtel_money_id: '100915364940' },
  { phone_number: '758287730',premium: 20000,airtel_money_id: '100912573629' },
  { phone_number: '756376193',premium: 5000,airtel_money_id: '100911621416' },
  { phone_number: '703708188',premium: 18000,airtel_money_id: '100910946759' },
  { phone_number: '750645461',premium: 5000,airtel_money_id: '100908502544' },
  { phone_number: '701734676',premium: 5000,airtel_money_id: '100908320058' },
  { phone_number: '750645461',premium: 5000,airtel_money_id: '100908175553' },
  { phone_number: '750645461',premium: 5000,airtel_money_id: '100907190212' },
  { phone_number: '756303480',premium: 5000,airtel_money_id: '100906971906' },
  { phone_number: '707149608',premium: 18000,airtel_money_id: '100906846857' },
  { phone_number: '756303480',premium: 5000,airtel_money_id: '100906423448' },
  { phone_number: '704221883',premium: 14000,airtel_money_id: '100904668221' },
  { phone_number: '752331734',premium: 5000,airtel_money_id: '100904317742' },
  { phone_number: '755837732',premium: 5000,airtel_money_id: '100900414639' },
  { phone_number: '752746276',premium: 5000,airtel_money_id: '100900137885' },
  { phone_number: '753213526',premium: 5000,airtel_money_id: '100899428590' },
  { phone_number: '740587580',premium: 18000,airtel_money_id: '100892591546' },
  { phone_number: '751097925',premium: 14000,airtel_money_id: '100891264531' },
  { phone_number: '706466554',premium: 5000,airtel_money_id: '100889183982' },
  { phone_number: '708050493',premium: 5000,airtel_money_id: '100888123237' },
  { phone_number: '751639729',premium: 5000,airtel_money_id: '100887245895' },
  { phone_number: '759326434',premium: 5000,airtel_money_id: '100885286238' },
  { phone_number: '759326434',premium: 5000,airtel_money_id: '100885160479' },
  { phone_number: '751639729',premium: 10000,airtel_money_id: '100883318846' },
  { phone_number: '741616002',premium: 5000,airtel_money_id: '100882315099' },
  { phone_number: '751000781',premium: 5000,airtel_money_id: '100881644246' },
  { phone_number: '755400599',premium: 5000,airtel_money_id: '100881268297' },
  { phone_number: '759858691',premium: 5000,airtel_money_id: '100880723356' },
  { phone_number: '750713069',premium: 10000,airtel_money_id: '100880691339' },
  { phone_number: '759597004',premium: 208000,airtel_money_id: '100880556432' },
  { phone_number: '706600201',premium: 5000,airtel_money_id: '100879170654' },
  { phone_number: '703827792',premium: 5000,airtel_money_id: '100876731056' },
  { phone_number: '703652496',premium: 5000,airtel_money_id: '100871558241' },
  { phone_number: '750454417',premium: 10000,airtel_money_id: '100871556829' },
  { phone_number: '750748532',premium: 18000,airtel_money_id: '100871433692' },

 



]

async function policyReconciliation() {
  try {
    const result = await Promise.all(array_of_phone_numbers.map(async (item) => {
      const transaction_date = moment('2024-03-14').format('YYYY-MM-DD HH:mm:ss');
      const phoneNumber = `+256${item.phone_number}`;

      const policy = await db.policies.findOne({
        where: {
          phone_number: phoneNumber,
          premium: item.premium,
        },
        include: [{
          model: db.payments,
          where: {
            payment_status: 'paid',
            payment_amount: item.premium,
          },
          required: false,
          limit: 1,
        }],
      });

      if (!policy) {
        console.log(`Policy not found for phone number ${phoneNumber}`);
        throw new Error(`Policy not found for phone number ${phoneNumber}`);
      }

      const payment = policy.payments[0];

      if (!payment) {
        console.log(`Payment not found for policy ID ${policy.policy_id}`);
        return null;
      }

      if (policy.policy_status === 'paid' && payment.payment_status === 'paid' && policy.premium === payment.payment_amount) {
        console.log("Policy paid and payment match", policy.first_name, policy.last_name, policy.phone_number, policy.premium, policy.policy_status, payment.payment_status);
      }

      console.log(" ======== PAYMENT =======", payment?.payment_status, payment?.payment_amount);
      console.log(" ======= POLICY =============", policy.policy_status, policy.premium, policy.policy_paid_amount);

      let transaction = await db.transactions.findOne({
        where: {
          policy_id: policy.policy_id,
        },
        limit: 1,
      });

      
      if (!transaction && policy.policy_status !== 'paid') {
        transaction = await createTransaction(policy.user_id, policy.partner_id, policy.policy_id, uuidv4(), policy.premium);
        console.log("Created transaction", transaction?.transaction_id, transaction?.transaction_status, transaction?.transaction_amount);
      }
      console.log("=============== TRANSACTION ==============", transaction?.transaction_id, transaction?.transaction_status, transaction?.transaction_amount);
      
      if(!transaction) {
        throw new Error(`Transaction not found for policy ID ${policy.policy_id}`);
      }
      if (transaction && policy.policy_status !== 'paid') {
        const paymentCallback = {
          transaction: {
            id: transaction.transaction_id,
            message: `PAID UGX ${item.premium} to AAR Uganda for ${policy.beneficiary} ${policy.policy_status} Cover Charge UGX 0. Bal UGX ${item.premium}. TID: ${item.airtel_money_id}. Date: ${transaction_date}`,
            status_code: "TS",
            airtel_money_id: item.airtel_money_id,
            payment_date: transaction.createdAt,
          },
        };
        console.log("paymentCallback", paymentCallback);
        return reconcilationCallback(paymentCallback.transaction);
      } else {
        console.log("Payment or transaction not found for policy ID", policy.policy_id);
        return null;
      }
    }));

    console.log(result);
  } catch (error) {
    console.log(error);
  }
}




export const playground = async () => {

  //getNewPolicies(2, '2023-01-01', '2024-02-7')
  //numberAndValueOfFailedPayments(2, '2023-01-01', '2024-02-07')
  // sendCongratulatoryMessage(policy, user)
  // _sendPolicyRenewalReminder('757998947')
  //_checkIfPolicyExists(array_of_phone_numbers)
  //_updateUserNumberOfPolicies()
  // _checkIfPolicyExistsInAAR()
  // _updateUserNumberOfPolicies()
  //updateAirtelMoneyId(array_of_phone_numbers);
  // getaRRMemberNumberData()
  // check_if_phone_number_has_paid_poicy(array_of_phone_numbers_to_check_paid_policies)
  //findDuplicatePhoneNumbers(array_of_phone_numbers_to_check_paid_policies)
  //policyReconciliation()

  console.log("TESTING GROUND")
}


