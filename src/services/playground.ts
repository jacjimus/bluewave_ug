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


//transacactions_id phone_number premium
// 101218305593		756397323		10,000
// 101216819283		740908849		5,000
// 101216073305		741766299		14,000
// 101215607810		752313357		10,000
// 101214115466		709849481		5,000
// 101212924400		751135621		18,000
// 101210926195		756836565		5,000
// 101210067782		701674627		5,000
// 101207521079		700990835		5,000
// 101207075221		757413568		5,000
// 101204496653		705490445		10,000
// 101203083760		743115641		5,000
// 101202856654		702927265		10,000
// 101200150842		709669204		5,000
// 101199096180		709397577		5,000
// 101198033157		705452546		18,000
// 101196969788		742359110		5,000
// 101194842378		752045756		5,000
// 101194776961		759169126		10,000
// 101189743724		709656472		5,000
// 101183768941		740543909		5,000
// 101183074378		751912602		10,000
// 101181312922		752969155		5,000
// 101179047067		753958367		18,000
// 101176763034		741000021		5,000
// 101176544184		742009761		20,000
// 101176315128		754298782		18,000
// 101174278265		757917247		5,000

const array_of_phone_numbers = [

  //{ phone_number: '740652878',premium: 10000,airtel_money_id: '100915364940' },
{ phone_number: '756397323', premium: 10000, airtel_money_id: '101218305593' },
{ phone_number: '740908849', premium: 5000, airtel_money_id: '101216819283' },
{ phone_number: '741766299', premium: 14000, airtel_money_id: '101216073305' },
{ phone_number: '752313357', premium: 10000, airtel_money_id: '101215607810' },
{ phone_number: '709849481', premium: 5000, airtel_money_id: '101214115466' },
{ phone_number: '751135621', premium: 18000, airtel_money_id: '101212924400' },
{ phone_number: '756836565', premium: 5000, airtel_money_id: '101210926195' },
{ phone_number: '701674627', premium: 5000, airtel_money_id: '101210067782' },
{ phone_number: '700990835', premium: 5000, airtel_money_id: '101207521079' },
{ phone_number: '757413568', premium: 5000, airtel_money_id: '101207075221' },
{ phone_number: '705490445', premium: 10000, airtel_money_id: '101204496653' },
{ phone_number: '743115641', premium: 5000, airtel_money_id: '101203083760' },
{ phone_number: '702927265', premium: 10000, airtel_money_id: '101202856654' },
{ phone_number: '709669204', premium: 5000, airtel_money_id: '101200150842' },
{ phone_number: '709397577', premium: 5000, airtel_money_id: '101199096180' },
{ phone_number: '705452546', premium: 18000, airtel_money_id: '101198033157' },
{ phone_number: '742359110', premium: 5000, airtel_money_id: '101196969788' },
{ phone_number: '752045756', premium: 5000, airtel_money_id: '101194842378' },
{ phone_number: '759169126', premium: 10000, airtel_money_id: '101194776961' },
{ phone_number: '709656472', premium: 5000, airtel_money_id: '101189743724' },
{ phone_number: '740543909', premium: 5000, airtel_money_id: '101183768941' },
{ phone_number: '751912602', premium: 10000, airtel_money_id: '101183074378' },
{ phone_number: '752969155', premium: 5000, airtel_money_id: '101181312922' },
{ phone_number: '753958367', premium: 18000, airtel_money_id: '101179047067' },
{ phone_number: '741000021', premium: 5000, airtel_money_id: '101176763034' },
{ phone_number: '742009761', premium: 20000, airtel_money_id: '101176544184' },
{ phone_number: '754298782', premium: 18000, airtel_money_id: '101176315128' },
{ phone_number: '757917247', premium: 5000, airtel_money_id: '101174278265' }







]

async function policyReconciliation() {

  try {

    let result
    array_of_phone_numbers.forEach(async (item) => {

      let transaction_date = moment('2024-03-20').format('YYYY-MM-DD HH:mm:ss')
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


      if (policy.policy_status == 'paid' && payment.payment_status == 'paid' && policy.premium == payment.payment_amount) {
        console.log(" ===== policy paid  and payment match =======", policy.first_name, policy.last_name, policy.phone_number, policy.premium, policy.policy_status, payment.payment_status)
       let  user = policy.user
        const memberStatus = await fetchMemberStatusData({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
        console.log(memberStatus)
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
   //policyReconciliation()

  //console.log("TESTING GROUND")
}


