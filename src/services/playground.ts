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
// 101144616169	742604375	10,000
// 101144520555	758689181	10,000
// 101144497793	742299370	18,000
// 101144441991	758402719	5,000
// 101144406240	752249036	5,000
// 101144363036	709950150	18,000
// 101144360030	753179867	14,000
// 101144304936	743185537	14,000
// 101144197022	756457667	18,000
// 101144030438	708919180	14,000
// 101143822869	708919180	10,000
// 101143768467	740398344	5,000
// 101143767080	707590787	5,000
// 101143474728	702285341	5,000
// 101143408561	706831304	5,000
// 101143252712	740394217	18,000
// 101142990824	709573447	5,000
// 101142693102	752256422	5,000
// 101141969413	754607844	70,000
// 101141951093	709952747	18,000
// 101141698153	709952747	18,000
// 101138391473	740596066	5,000
// 101138017817	741041175	18,000
// 101137142626	741418757	5,000
// 101136939769	759792202	5,000
// 101136761541	742027802	5,000
// 101136627633	702832923	18,000
// 101135128830	703901609	5,000
// 101135062348	702728345	5,000
// 101132104318	756403929	5,000
// 101132059241	742247391	5,000
// 101131785446	701140053	5,000
// 101131654753	706774234	5,000
// 101131388908	708330773	5,000
// 101130524707	709096038	5,000
// 101130043079	709751243	10,000
// 101129663208	759095476	5,000
// 101128473559	759299381	18,000
// 101127938871	709598662	5,000
// 101127389056	744046900	14,000


const array_of_phone_numbers = [

  //{ phone_number: '740652878',premium: 10000,airtel_money_id: '100915364940' },
  { phone_number: '742604375',premium: 10000,airtel_money_id: '101144616169' },
  { phone_number: '758689181',premium: 10000,airtel_money_id: '101144520555' },
  { phone_number: '742299370',premium: 18000,airtel_money_id: '101144497793' },
  { phone_number: '758402719',premium: 5000,airtel_money_id: '101144441991' },
  { phone_number: '752249036',premium: 5000,airtel_money_id: '101144406240' },
  { phone_number: '709950150',premium: 18000,airtel_money_id: '101144363036' },
  { phone_number: '753179867',premium: 14000,airtel_money_id: '101144360030' },
  { phone_number: '743185537',premium: 14000,airtel_money_id: '101144304936' },
  { phone_number: '756457667',premium: 18000,airtel_money_id: '101144197022' },
  { phone_number: '708919180',premium: 14000,airtel_money_id: '101144030438' },
  { phone_number: '708919180',premium: 10000,airtel_money_id: '101143822869' },
  { phone_number: '740398344',premium: 5000,airtel_money_id: '101143768467' },
  { phone_number: '707590787',premium: 5000,airtel_money_id: '101143767080' },
  { phone_number: '702285341',premium: 5000,airtel_money_id: '101143474728' },
  { phone_number: '706831304',premium: 5000,airtel_money_id: '101143408561' },
  { phone_number: '740394217',premium: 18000,airtel_money_id: '101143252712' },
  { phone_number: '709573447',premium: 5000,airtel_money_id: '101142990824' },
  { phone_number: '752256422',premium: 5000,airtel_money_id: '101142693102' },
  { phone_number: '754607844',premium: 70000,airtel_money_id: '101341969413' },
  { phone_number: '709952747',premium: 18000,airtel_money_id: '101141951093' },
  { phone_number: '709952747',premium: 18000,airtel_money_id: '101141698153' },
  { phone_number: '740596066',premium: 5000,airtel_money_id: '101138391473' },
  { phone_number: '741041175',premium: 18000,airtel_money_id: '101138017817' },
  { phone_number: '741418757',premium: 5000,airtel_money_id: '101137142626' },
  { phone_number: '759792202',premium: 5000,airtel_money_id: '101136939769' },
  { phone_number: '742027802',premium: 5000,airtel_money_id: '101136761541' },
  { phone_number: '702832923',premium: 18000,airtel_money_id: '101136627633' },
  { phone_number: '703901609',premium: 5000,airtel_money_id: '101135128830' },
  { phone_number: '702728345',premium: 5000,airtel_money_id: '101135062348' },
  { phone_number: '756403929',premium: 5000,airtel_money_id: '101132104318' },
  { phone_number: '742247391',premium: 5000,airtel_money_id: '101132059241' },
  { phone_number: '701140053',premium: 5000,airtel_money_id: '101131785446' },
  { phone_number: '706774234',premium: 5000,airtel_money_id: '101131654753' },
  { phone_number: '708330773',premium: 5000,airtel_money_id: '101131388908' },
  { phone_number: '709096038',premium: 5000,airtel_money_id: '101130524707' },
  { phone_number: '709751243',premium: 10000,airtel_money_id: '101130043079' },
  { phone_number: '759095476',premium: 5000,airtel_money_id: '101129663208' },
  { phone_number: '759299381',premium: 18000,airtel_money_id: '101128473559' },
  { phone_number: '709598662',premium: 5000,airtel_money_id: '101127938871' },
  { phone_number: '744046900',premium: 14000,airtel_money_id: '101127389056' },







]

async function policyReconciliation() {

  try {

    let result
    array_of_phone_numbers.forEach(async (item) => {

      let transaction_date = moment('2024-03-19').format('YYYY-MM-DD HH:mm:ss')
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


