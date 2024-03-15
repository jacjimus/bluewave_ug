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
// 100876731056	703827792		5,000
// 100871558241	703652496		5,000
// 100871556829	750454417		10,000
// 100871433692	750748532		18,000


const array_of_phone_numbers = [


  




]


async function policyReconciliation() {

  try {

    let result
    array_of_phone_numbers.forEach(async (item) => {

      let transaction_date = moment('2024-03-11').format('YYYY-MM-DD HH:mm:ss')
      let policy = await db.policies.findOne({
        where: {
          phone_number: `+256${item.phone_number}`,
          premium: item.premium,
        },
        limit: 1,
      });

      let payment = await db.payments.findOne({
        where: {
          policy_id: policy.policy_id,
          payment_status: 'paid',
          payment_amount: item.premium,

        },
        limit: 1,
      });


      if (policy.policy_status == 'paid' && payment.payment_status == 'paid' && policy.premium == payment.payment_amount) {
        console.log(" ===== policy paid  and payment match =======", policy.first_name, policy.last_name, policy.phone_number, policy.premium, policy.policy_status, payment.payment_status)

      }
      // console.log("====== PAYMENT =====", payment?.payment_status, payment?.payment_amount, payment?.payment_date, payment?.payment_metadata?.transaction)

      // console.log("===== POLICY =====", policy.policy_status, policy.premium, policy.policy_paid_date, policy.policy_paid_amount)

      let transaction = await db.transactions.findOne({
        where: {
          policy_id: policy.policy_id,
        },
        limit: 1,
      });


      if (transaction == null && policy.policy_status !== 'paid') {
        // create transaction
        let user_id = policy.user_id
        let partner_id = policy.partner_id
        let policy_id = policy.policy_id
        let amount = policy.premium
        let transactionId = uuidv4()
        transaction = await createTransaction(user_id, partner_id, policy_id, transactionId, amount)

        //console.log("create transaction", transaction);
      }


      //console.log("transaction", transaction)

      if (transaction.transaction_id !== null && policy.policy_status !== 'paid') {

        let paymentCallback = {
          transaction: {
            id: transaction.transaction_id,
            message: `PAID UGX ${item.premium} to AAR Uganda for ${policy.beneficiary} ${policy.policy_status} Cover Charge UGX 0. Bal UGX ${item.premium}. TID: ${item.airtel_money_id}. Date: ${transaction_date}`,
            status_code: "TS",
            airtel_money_id: item.airtel_money_id,
            payment_date: transaction.createdAt
          }
        }

        // console.log("paymentCallback", paymentCallback)
        result = await reconcilationCallback(paymentCallback.transaction)

      }
      console.log("RESULT ", result);

    }
    )
    console.log(result);
  }
  catch (error) {
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
  policyReconciliation()

  console.log("TESTING GROUND")
}


