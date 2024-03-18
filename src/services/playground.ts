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
// 101098603242	706515677		18,000
// 101098564589	705980408		18,000
// 101098427796	750616148		5,000
// 101098266838	703968511		5,000
// 101098133316	706515677		18,000
// 101098122351	704002784		5,000
// 101098092240	757194153		10,000
// 101097811560	757194153		5,000
// 101097507571	706274417		5,000
// 101097295416	754353963		5,000
// 101097200512	754032073		10,000
// 101097071276	706755114		5,000
// 101096618204	756074715		5,000
// 101096429181	751567557		5,000
// 101096369266	702444336		5,000
// 101096160435	752366925		25,000
// 101096146865	752936760		14,000
// 101096118678	757494762		5,000
// 101096102687	758987544		5,000
// 101095871668	704348196		5,000
// 101095774815	706209746		5,000
// 101095708667	709254552		10,000
// 101095581406	703589317		5,000
// 101095526322	706215255		10,000
// 101093412443	702801365		18,000
// 101093404383	701826854		5,000
// 101093229665	740342681		18,000
// 101092230660	700350154		5,000
// 101091717680	705685335		5,000
// 101086324867	742929965		60,000
// 101085058473	755419563		5,000
// 101084784575	756343626		18,000


const array_of_phone_numbers = [

  //{ phone_number: '740652878',premium: 10000,airtel_money_id: '100915364940' },







]

async function policyReconciliation() {

  try {

    let result
    array_of_phone_numbers.forEach(async (item) => {

      let transaction_date = moment('2024-03-18').format('YYYY-MM-DD HH:mm:ss')
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
          [Op.between]: ['2023-08-01', '2024-02-29']
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

  console.log("TESTING GROUND")
}


