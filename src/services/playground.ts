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


//transacactions_id trasaction_date phone_number  premium 
//99458339221	15-02-2024 12:20 PM	704036045	5,000

const array_of_phone_numbers = [

  //{ airtel_money_id: '100915364940',transaction_date: "24-03-2024 10:31 PM", phone_number: '740652878',premium: 10000},

  // { airtel_money_id: '101433338446', transaction_date: "25-03-2024 05:02 PM", phone_number: '703962963', premium: 18000 },
  // { airtel_money_id: '101431613103', transaction_date: "25-03-2024 04:23 PM", phone_number: '759761564', premium: 10000 },
  // { airtel_money_id: '101430931356', transaction_date: "25-03-2024 04:07 PM", phone_number: '706451196', premium: 5000 },
  // { airtel_money_id: '101428603263', transaction_date: "25-03-2024 03:09 PM", phone_number: '704599076', premium: 5000 },
  // { airtel_money_id: '101425513198', transaction_date: "25-03-2024 01:54 PM", phone_number: '744080344', premium: 10000 },
  // { airtel_money_id: '101425343098', transaction_date: "25-03-2024 01:50 PM", phone_number: '702446362', premium: 5000 },
  // { airtel_money_id: '101420321143', transaction_date: "25-03-2024 11:53 AM", phone_number: '702507012', premium: 5000 },
  // { airtel_money_id: '101420310167', transaction_date: "25-03-2024 11:53 AM", phone_number: '752862263', premium: 5000 },
  //{ airtel_money_id: '101420060651', transaction_date: "25-03-2024 11:47 AM", phone_number: '700904628', premium: 5000 },
  //{ airtel_money_id: '101418711540', transaction_date: "25-03-2024 11:15 AM", phone_number: '740042971', premium: 10000 },
  //{ airtel_money_id: '101418173211', transaction_date: "25-03-2024 11:02 AM", phone_number: '740042971', premium: 10000 },
  // { airtel_money_id: '101415043394', transaction_date: "25-03-2024 09:46 AM", phone_number: '703619277', premium: 15000 },
  // { airtel_money_id: '101411775872', transaction_date: "25-03-2024 08:09 AM", phone_number: '750131788', premium: 14000 },
  // { airtel_money_id: '101411305259', transaction_date: "25-03-2024 07:51 AM", phone_number: '753757802', premium: 5000 },
  // { airtel_money_id: '101410242367', transaction_date: "25-03-2024 06:47 AM", phone_number: '703485624', premium: 60000 },
 








]

async function policyReconciliation() {

  try {

    let result
    array_of_phone_numbers.forEach(async (item) => {

     //let transaction_date = moment('2024-03-24').format('YYYY-MM-DD HH:mm:ss')
      const transaction_date = moment(item.transaction_date, "YYYY-MM-DD h:mm A");
      console.log("transaction_date_str", transaction_date)
      let policy = await db.policies.findAll({
        where: {
          phone_number: `+256${item.phone_number}`,
          premium: item.premium,
        },
        include: [{
          model: db.users,
          where: {
            partner_id: 2
          }
        }],
        limit: 1,
      });


      policy = policy[0]

      let payment = await db.payments.findOne({
        where: {
          policy_id: policy.policy_id,
          payment_status: 'paid',
          payment_amount: item.premium,

        },
        limit: 1,
      });


      // if (policy.policy_status == 'paid' && payment.payment_status == 'paid' && policy.premium == payment.payment_amount && item.installment_count > 1) {
      //   console.log(" ===== policy paid  and payment match =======", policy.first_name, policy.last_name, policy.phone_number, policy.premium, policy.policy_status, payment.payment_status)
      //  let  user = policy.user
      //   const memberStatus = await fetchMemberStatusData({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
      //   console.log(memberStatus)
      //   if(item.installment_count > 1){
      //     result= 'Payment already reconciled'
      //     //result = await reconciliation({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "", amount: item.premium, transaction_date: transaction_date, installment_count: item.installment_count });
      //   }
      // }
       console.log("====== PAYMENT =====", payment?.payment_status, payment?.payment_amount, payment?.payment_date, payment?.payment_metadata)

       console.log("===== POLICY =====", policy.policy_id,policy.policy_status, policy.premium, policy.policy_paid_date, policy.policy_paid_amount)

      let transaction = await db.transactions.findOne({
        where: {
          policy_id: policy.policy_id,
        },
        limit: 1,
      });

      console.log("===== TRANSACTION =====", transaction)

      if (transaction.status == null && policy.policy_status !== 'paid') {
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

      if (transaction.transaction_id !== null) {

        let paymentCallback = {
          transaction: {
            id: transaction.transaction_id,
            message: `PAID UGX ${item.premium} to AAR Uganda for ${policy.beneficiary} ${policy.policy_status} Cover Charge UGX 0. Bal UGX ${item.premium}. TID: ${item.airtel_money_id}. Date: ${transaction_date}`,
            status_code: "TS",
            airtel_money_id: item.airtel_money_id,
            payment_date: transaction.createdAt,
           
          }
        }

        // console.log("paymentCallback", paymentCallback)
        result = await reconcilationCallback(paymentCallback.transaction)
        // slow down the loop
        await new Promise(resolve => setTimeout(resolve, 2000));

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

async function getaRRMemberNumberData() {
  try {
    const policies = await db.policies.findAll({
      // Policy type is 'S MINI'
      where: {
        policy_status: 'paid',
        //policy_type: { [db.Sequelize.Op.eq]: 'S MINI' },
        partner_id: 2,
        policy_start_date: {
          [Op.between]: ['2024-03-18', '2024-03-19']
        },

      },
      include: [{
        model: db.users,
        where: {
          // arr_member_number: null,
          partner_id: 2
        }
      }]

    });

    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      const customer = policy.user
      console.log(customer.name, policy.phone_number);
      let result = await updatePremium(customer, policy);
      console.log(result);

      // let result = await registerPrincipal(customer, policy);
      // console.log(result);
      // if (result.code == 608) {
      //   await getMemberNumberData(customer.phone_number);
      // }
      // Introduce a delay of 1 second between each iteration
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

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
  // policyReconciliation()

  //console.log("TESTING GROUND")
}


