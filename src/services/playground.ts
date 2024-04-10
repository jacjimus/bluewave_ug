const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize')
import cron from 'node-cron';
import { createDependant, fetchMemberStatusData, getMemberNumberData, reconciliation, registerDependant, registerPrincipal, updatePremium } from './aarServices';
import SMSMessenger from './sendSMS';
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

// 102190083289	08-04-2024 10:31 PM	708002408	5,000	GODFREY KAFUUKO (708002408)	1
// 102189047807	08-04-2024 10:10 PM	704676582	5,000	PATRICK LUBULWA (704676582)	1
// 102189032081	08-04-2024 10:09 PM	754728698	10,000	GRACE WAVA (754728698)	1
// 102186473133	08-04-2024 9:28 PM	707996021	5,000	MALIZA NAGAMYA (707996021)	1
// 102183870118	08-04-2024 8:50 PM	707555920	5,000	YAZIDI SSENGOOBA (707555920)	1
// 102180504880	08-04-2024 8:07 PM	706754714	5,000	YEKO MULIGISA (706754714)	1
// 102180475989	08-04-2024 8:06 PM	707252302	10,000	HAFISHA NANFUKA (707252302)	1
// 102177930806	08-04-2024 7:35 PM	743160864	5,000	GENEVIEVE BABIRYE (743160864)	1
// 102175397091	08-04-2024 7:01 PM	758896734	93,000	BARNABAS RWAKATALE (758896734)	1
// 102170456431	08-04-2024 5:40 PM	701829613	5,000	ZAITUNAH NANGOBI (701829613)	2
// 102169930355	08-04-2024 5:31 PM	701829613	5,000	ZAITUNAH NANGOBI (701829613)	2
// 102169778646	08-04-2024 5:28 PM	752395069	5,000	JOHN SSALI (752395069)	1
// 102169242388	08-04-2024 5:18 PM	756426077	10,000	PATRICK LUWAGA (756426077)	1
// 102167859264	08-04-2024 4:52 PM	700957665	18,000	BOB MUGISHA (700957665)	1
// 102167067735	08-04-2024 4:36 PM	708468760	5,000	SAMALI NAZALA (708468760)	1
// 102165625965	08-04-2024 4:07 PM	744694661	40,000	NELSON TUGUME (744694661)	2
// 102164788243	08-04-2024 3:50 PM	705293518	10,000	ROSE NASSIMBWA (705293518)	1
// 102164186420	08-04-2024 3:38 PM	702476298	5,000	DIANAH NAMUSISI (702476298)	1
// 102161218019	08-04-2024 2:36 PM	756129388	5,000	EMMANUEL WAISWA (756129388)	1
// 102160867792	08-04-2024 2:28 PM	702648287	5,000	isaac LULE (702648287)	1
// 102159078611	08-04-2024 1:51 PM	700267600	5,000	OLIVIA NALWADDA (700267600)	1
// 102158012132	08-04-2024 1:28 PM	709110287	60,000	EMMANUEL KAIJA (709110287)	1
// 102157552608	08-04-2024 1:19 PM	757374835	5,000	MUNIKA TUHIRIRWE (757374835)	1
// 102156767962	08-04-2024 1:02 PM	706359487	10,000	Kadama Kasifa (706359487)	2
// 102154605989	08-04-2024 12:17 PM	702079803	10,000	JOSEPHINE NAKABUGO (702079803)	1
// 102152935510	08-04-2024 11:42 AM	752682142	5,000	JESCA NAMUKASA (752682142)	1
// 102141512959	08-04-2024 4:07 AM	753382788	18,000	GERALD MUGISHA (753382788)	1

const array_of_phone_numbers = [







]

async function policyReconciliation() {

  try {

    let result
    array_of_phone_numbers.forEach(async (item) => {

     //let transaction_date = moment('2024-03-24').format('YYYY-MM-DD HH:mm:ss')
      const transaction_date = moment(item.transaction_date, "YYYY-MM-DD h:mm A");
     // console.log("transaction_date_str", transaction_date)
      let policy = await db.policies.findOne({
        where: {
          phone_number: `+256${item.phone_number}`,
          premium: item.premium,
          policy_status: 'pending',
        },
        include: [{
          model: db.users,
          where: {
            partner_id: 2
          }
        }],
        limit: 1,
      });

      console.log("policy", policy)
if(policy){
      let payment = await db.payments.findOne({
        where: {
          user_id: policy.user_id,
         [Op.or]: [{ payment_status: 'pending' }, { payment_status: 'failed' }],
          payment_amount: item.premium,
        },
        limit: 1,
      });
      
      console.log("payment", payment)

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
       console.log("====== PAYMENT =====", payment?.payment_amount, payment?.payment_status, payment?.payment_date, payment?.payment_id)

       console.log("===== POLICY =====", policy.policy_id,policy.policy_status, policy.premium, policy.policy_paid_date, policy.policy_paid_amount)

      let transaction = await db.transactions.findOne({
        where: {
          policy_id: policy.policy_id,
         // status: 'pending',
          amount: item.premium,
        },
        limit: 1,

      });

      console.log("===== TRANSACTION =====", transaction)

      // if (transaction.status == null && policy.policy_status !== 'paid') {
      //   // create transaction
      //   let user_id = policy.user_id
      //   let partner_id = policy.partner_id
      //   let policy_id = policy.policy_id
      //   let amount = policy.premium
      //   let transactionId = uuidv4()
      //   transaction = await createTransaction(user_id, partner_id, policy_id, transactionId, amount)

      //   //console.log("create transaction", transaction);
      // }


      console.log("transaction", transaction)

      if (transaction) {

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

      }else{
        console.log("Transaction not found")
      }
    }else{
      console.log("Policy not found")
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

// async function getArrMemberNumberData() {
//   try {
//     const policies = await db.policies.findAll({
//       // Policy type is 'S MINI'
//       where: {
//         policy_status: 'paid',
//         //policy_type: { [db.Sequelize.Op.eq]: 'S MINI' },
//         partner_id: 2,
//         // policy_start_date: {
//         //   [Op.between]: ['2023-10-01', '2024-03-31']
//         // },

//       },
//       include: [{
//         model: db.users,
//         where: {
//          arr_member_number: null,
//           partner_id: 2
//         }
//       }]

//     });

//     for (let i = 0; i < policies.length; i++) {
//       const policy = policies[i];
//       const customer = policy.user
//       console.log(customer.name, policy.phone_number);
   
//       let result = await registerPrincipal(customer, policy);
//       console.log(result);
//       if (result.code == 608) {
//         await getMemberNumberData(customer.phone_number);
//       }
//       // Introduce a delay of 1 second between each iteration
//       await new Promise(resolve => setTimeout(resolve, 2000));
//     }

//   } catch (error) {
//     console.log(error);
//   }
// }

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
  // check_if_phone_number_has_paid_poicy(array_of_phone_numbers_to_check_paid_policies)
  //findDuplicatePhoneNumbers(array_of_phone_numbers_to_check_paid_policies)
// policyReconciliation()
//getArrMemberNumberData()

  //console.log("TESTING GROUND")
}


