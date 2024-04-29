const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize')
import cron from 'node-cron';
import { createDependant, fetchMemberStatusData, getMemberNumberData, reconciliation, registerDependant, registerPrincipal, updateAirtelMoneyId, updatePremium } from './aarServices';
import SMSMessenger from './sendSMS';
import { db } from '../models/db';
import { getNewPolicies, numberAndValueOfFailedPayments } from './report';
import Queue from 'bull';
import { createTransaction, reconcilationCallback, sendCongratulatoryMessage } from './payment';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import axios from "axios";
import authTokenByPartner from './authorization';
import { createUserIfNotExists } from './getAirtelUserKyc';
// import { google } from 'googleapis';

// const serviceAccountKeyFile = "./aitel-payment-reconciliation-abe90c6ab59e.json"
// const sheetId = '1Q4IB0vzghTIIirbGdU49UY2FPfESViXaY77oGy44J3I'
// const tabName = 'Ddwaliro Care Airtel Payments'
// const range = 'A:R'


//transacactions_id trasaction_date phone_number  premium 
// 102477015331	15-04-2024 07:34 AM	742328939	18,000
// 102456359281	14-04-2024 04:50 PM	704523108	15,000
// 102450898660	14-04-2024 02:53 PM	709151438	14,000
// 102445602491	14-04-2024 12:56 PM	706108867	50,000
// 102444101355	14-04-2024 12:23 PM	756850296	14,000
// 102440038600	14-04-2024 10:52 AM	709054921	5,000
// 102435045932	14-04-2024 08:28 AM	757921800	5,000
// 102432909637	14-04-2024 02:45 AM	701345546	5,000
// 102425085558	13-04-2024 08:39 PM	709225627	5,000
// 102422814255	13-04-2024 08:03 PM	708867818	10,000
// 102421588875	13-04-2024 07:45 PM	709031318	5,000
// 102418212192	13-04-2024 06:56 PM	740304550	5,000
// 102416302816	13-04-2024 06:20 PM	709547024	5,000
// 102416048193	13-04-2024 06:15 PM	753031206	5,000
// 102415313338	13-04-2024 06:00 PM	753031206	5,000
// 102414569742	13-04-2024 05:45 PM	744070887	5,000
// 102412192013	13-04-2024 04:55 PM	706138501	5,000
// 102409213898	13-04-2024 03:51 PM	755740981	5,000
// 102405172046	13-04-2024 02:23 PM	758240120	5,000
// 102391971655	13-04-2024 09:28 AM	740349353	5,000
// 102391860391	13-04-2024 09:25 AM	744386934	5,000
// 102390598532	13-04-2024 08:50 AM	744386934	5,000
// 102388034818	13-04-2024 07:13 AM	708414582	14,000
// 102378322105	12-04-2024 8:25 PM	705780302	5,000
// 102366110140	12-04-2024 4:50 PM	752425802	5,000
// 102365843555	12-04-2024 4:44 PM	740028410	5,000
// 102365518585	12-04-2024 4:36 PM	701415492	5,000
// 102365075722	12-04-2024 4:25 PM	740595557	10,000
// 102364422133	12-04-2024 4:09 PM	758727318	5,000
// 102361207423	12-04-2024 2:51 PM	701415492	5,000
// 102352903308	12-04-2024 11:32 AM	704680493	5,000
// 102349763788	12-04-2024 10:17 AM	75665309	5,000
// 102347010786	12-04-2024 9:07 AM	700383427	5,000
// 102346119979	12-04-2024 8:41 AM	702939057	10,000
// 102341544017	11-04-2024 11:16 PM	744832722	18,000
// 102339458830	11-04-2024 10:02 PM	752315209	5,000
// 102336205284	11-04-2024 8:58 PM	702754449	18,000
// 102335827674	11-04-2024 8:51 PM	754033528	5,000
// 102332112552	11-04-2024 7:56 PM	740959641	5,000
// 102327954756	11-04-2024 6:56 PM	750169177	10,000
// 102325849438	11-04-2024 6:18 PM	709225627	5,000
// 102317983795	11-04-2024 3:19 PM	706574258	5,000
// 102317841828	11-04-2024 3:15 PM	750233140	5,000
// 102317278690	11-04-2024 3:01 PM	708486336	5,000
// 102314586375	11-04-2024 1:56 PM	743171547	5,000
// 102310712189	11-04-2024 12:28 PM	702288631	5,000
// 102309313324	11-04-2024 11:56 AM	753892963	10,000
// 102308110278	11-04-2024 11:28 AM	753892963	5,000
// 102305372602	11-04-2024 10:26 AM	744752522	5,000
// 102302543653	11-04-2024 9:16 AM	709915861	10,000
// 102300466783	11-04-2024 8:12 AM	756169625	5,000
// 102298878817	11-04-2024 6:38 AM	744283085	5,000
// 102296989729	10-04-2024 11:30 PM	752512311	5,000
// 102296636357	10-04-2024 11:07 PM	752590662	5,000
// 102296543218	10-04-2024 11:02 PM	755251695	10,000
// 102291607444	10-04-2024 8:48 PM	754590655	10,000
// 102288641803	10-04-2024 8:00 PM	702407532	5,000
// 102286999807	10-04-2024 7:36 PM	754660409	5,000
// 102279379023	10-04-2024 5:12 PM	740331042	5,000
// 102277464036	10-04-2024 4:28 PM	704509347	14,000
// 102274287346	10-04-2024 3:12 PM	706590624	5,000
// 102273642038	10-04-2024 2:56 PM	705107022	14,000
// 102262602450	10-04-2024 11:19 AM	708120148	10,000
// 102262504944	10-04-2024 11:17 AM	758968695	5,000
// 102260738349	10-04-2024 10:45 AM	700887689	5,000
// 102251456725	10-04-2024 6:43 AM	703771359	5,000
// 102251451086	10-04-2024 6:43 AM	750457410	5,000
// 102251420337	10-04-2024 6:39 AM	753175157	5,000
// 102246766018	09-04-2024 10:22 PM	704497554	10,000
// 102244696160	09-04-2024 9:47 PM	703866714	25,000
// 102231112369	09-04-2024 7:02 PM	756991728	5,000
// 102226057611	09-04-2024 5:53 PM	705100085	5,000
// 102225504260	09-04-2024 5:45 PM	702116686	50,000
// 102224231952	09-04-2024 5:25 PM	706089142	5,000
// 102221736671	09-04-2024 4:43 PM	740946670	5,000
// 102221360687	09-04-2024 4:36 PM	756643578	5,000
// 102217927628	09-04-2024 3:34 PM	756684611	5,000
// 102214518096	09-04-2024 2:30 PM	757351174	35,000
// 102213517183	09-04-2024 2:11 PM	708221250	10,000
// 102204357862	09-04-2024 11:15 AM	702384693	20,000
// 102201288103	09-04-2024 10:11 AM	708414582	18,000
// 102198732596	09-04-2024 9:11 AM	752517849	5,000
// 102196670573	09-04-2024 8:13 AM	755760359	18,000
// 102196663783	09-04-2024 8:13 AM	742664523	5,000
// 102190083289	08-04-2024 10:31 PM	708002408	5,000
// 102189047807	08-04-2024 10:10 PM	704676582	5,000
// 102189032081	08-04-2024 10:09 PM	754728698	10,000
// 102186473133	08-04-2024 9:28 PM	707996021	5,000
// 102183870118	08-04-2024 8:50 PM	707555920	5,000
// 102180504880	08-04-2024 8:07 PM	706754714	5,000
// 102180475989	08-04-2024 8:06 PM	707252302	10,000
// 102177930806	08-04-2024 7:35 PM	743160864	5,000
// 102175397091	08-04-2024 7:01 PM	758896734	93,000
// 102170456431	08-04-2024 5:40 PM	701829613	5,000
// 102169930355	08-04-2024 5:31 PM	701829613	5,000
// 102169778646	08-04-2024 5:28 PM	752395069	5,000
// 102169242388	08-04-2024 5:18 PM	756426077	10,000
// 102167859264	08-04-2024 4:52 PM	700957665	18,000
// 102167067735	08-04-2024 4:36 PM	708468760	5,000
// 102165625965	08-04-2024 4:07 PM	744694661	40,000
// 102164788243	08-04-2024 3:50 PM	705293518	10,000
// 102164186420	08-04-2024 3:38 PM	702476298	5,000
// 102161218019	08-04-2024 2:36 PM	756129388	5,000
// 102160867792	08-04-2024 2:28 PM	702648287	5,000
// 102159078611	08-04-2024 1:51 PM	700267600	5,000
// 102158012132	08-04-2024 1:28 PM	709110287	60,000
// 102157552608	08-04-2024 1:19 PM	757374835	5,000
// 102156767962	08-04-2024 1:02 PM	706359487	10,000
// 102154605989	08-04-2024 12:17 PM	702079803	10,000
// 102152935510	08-04-2024 11:42 AM	752682142	5,000
// 102141512959	08-04-2024 4:07 AM	753382788	18,000
// 102103379872	07-04-2024 1:10 PM	757302726	18,000
// 102096992766	07-04-2024 11:06 AM	758356914	5,000
// 101969641246	04-04-2024 8:06 PM	752825291	5,000
// 101969325940	04-04-2024 8:02 PM	751557769	5,000
// 101967827641	04-04-2024 7:44 PM	751060363	10,000
// 101966857806	04-04-2024 7:33 PM	752322768	10,000
// 101966354616	04-04-2024 7:26 PM	744297629	5,000
// 101964981937	04-04-2024 7:08 PM	759482313	5,000
// 101964924257	04-04-2024 7:07 PM	751066271	5,000
// 101964917716	04-04-2024 7:07 PM	759482313	5,000
// 101962695831	04-04-2024 6:33 PM	741890757	18,000
// 101959959742	04-04-2024 5:45 PM	754239908	5,000
// 101955222995	04-04-2024 3:59 PM	752825291	5,000
// 101954784350	04-04-2024 3:49 PM	701777724	5,000
// 101952463610	04-04-2024 2:55 PM	701994625	5,000
// 101949176964	04-04-2024 1:42 PM	742018204	5,000
// 101949008067	04-04-2024 1:38 PM	742676850	10,000
// 101947858600	04-04-2024 1:12 PM	758034247	5,000
// 101945715539	04-04-2024 12:24 PM	759886550	5,000
// 101944561475	04-04-2024 11:59 AM	708076693	5,000
// 101942722348	04-04-2024 11:19 AM	755300223	5,000
// 101942631827	04-04-2024 11:17 AM	701190117	20,000
// 101939503086	04-04-2024 10:06 AM	759639732	5,000
// 101937160933	04-04-2024 9:06 AM	701419062	10,000
// 101936355202	04-04-2024 8:43 AM	753967219	20,000

const array_of_phone_numbers = [
  
 // { transaction_id: 102325849438, transaction_date: '11-04-2024 6:18 PM', phone_number: 709225627, premium: 5000 },
{ transaction_id: 102899976971, transaction_date: '24-04-2024 03:52 PM', phone_number: 753466926, premium: 10000 },


];


async function policyReconciliation(array_of_phone_numbers) {

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
          //policy_number: null
        },
        include: [{
          model: db.users,
          where: {
            partner_id: 2
          }
        }],
        order: [["createdAt", "DESC"]],
        limit: 1,
      });

      console.log("policy", policy)
if(policy){
      let payment = await db.payments.findOne({
        where: {
          user_id: policy.user_id,
         [Op.or]: [{ payment_status: 'pending' }, { payment_status: 'paid' }],
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
          user_id: policy.user_id,
          // status: 'pending',
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
            airtel_money_id: item.transaction_id,
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

async function getArrMemberNumberData() {
  try {
    const policies = await db.policies.findAll({
      // Policy type is 'S MINI'
      where: {
        //policy_status: 'paid',
        //policy_type: { [db.Sequelize.Op.eq]: 'S MINI' },
        partner_id: 2,
        // policy_start_date: {
          //   [Op.between]: ['2023-10-01', '2024-03-31']
          // },
          
        },
        include: [{
          model: db.users,
          where: {
            arr_member_number: null,
            partner_id: 2
          }
        }]
        
      });
      
      for (let i = 0; i < policies.length; i++) {
        const policy = policies[i];
        const customer = policy.user
        console.log(customer.name, policy.phone_number);
        
        let result = await registerPrincipal(customer, policy);
        console.log(result);
        if (result.code == 608) {
          await getMemberNumberData(customer.phone_number);
        }
        // Introduce a delay of 1 second between each iteration
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.log(error);
    }
  }
  
  let arr_members =[ 
    "UG161076-00"
  ]
  
  // Function to convert the member number to end with '-00' if it doesn't already
  function convertToStandardFormat(memberNumber) {
    if (memberNumber.endsWith('-00')) {
      return memberNumber; // No conversion needed
    } else {
      return memberNumber.replace(/-\d{2}$/, '-00'); // Replace the last two digits with '00'
    }
  }
  
  // updating premium on aar 
  async function updatePremiumArr(policies) {
    try {
      policies.forEach(async (arr_member_number) => {
      console.log("arr_member_number", arr_member_number)
    const policies = await db.policies.findAll({
      where: {
        policy_status: 'paid',
        partner_id: 2,
  
      },
      include: [{
        model: db.users,
        where: {
          partner_id: 2,
          arr_member_number: convertToStandardFormat(arr_member_number)
        }
      }]
    });

    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      const customer = policy.user
      console.log(customer.name, policy.phone_number);
      customer.arr_member_number=arr_member_number
      let result = await updatePremium(customer, policy);
      console.log(result);
    //   const number_of_dependants = parseFloat(policy?.total_member_number.split("")[2]) || 0;
    //   const registerAARUser = await getMemberNumberData(customer.phone_number)
    //   //getMemberNumberData
    //   console.log('registerAARUser', registerAARUser)
    //   //customer.arr_member_number = registerAARUser?.member_no;
    //   console.log(number_of_dependants > 0 , policy.policy_type)
    //   if (number_of_dependants > 0 && (policy.beneficiary == 'FAMILY' || policy.beneficiary == 'OTHER')) {
    //     await createDependant(customer, policy, number_of_dependants);
    //   } 
    //   // Introduce a delay of 1 second between each iteration
    //   await new Promise(resolve => setTimeout(resolve, 6000));
     }

  } )

  } catch (error) {
    console.log(error);
  }
 }

// Update member details
async function updateAARpolicyNumber() {
  try {
    // Find all paid policies without a policy number for a specific partner
    const allPaidPolicies = await db.policies.findAll({
      where: {
        partner_id: 2,
        policy_status: "paid",
       
        // airtel_money_id not null
        [Op.and]: [
          { airtel_money_id: { [Op.ne]: null } },
          { airtel_money_id: { [Op.ne]: "" } },
          { arr_policy_number: { [Op.ne]: null } },
        ],
      },
      include: [{
        model: db.users,
        where: {
          partner_id: 2,
        }
      }]
    });

    // Loop through allPaidPolicies in batches
    for (let i = 0; i < allPaidPolicies.length; i++) {
      const policy = allPaidPolicies[i];
      const user = policy.user;

      // Fetch member status data for the user
      // const memberStatusData = await fetchMemberStatusData({
      //   member_no: user.arr_member_number,
      //   unique_profile_id: user.membership_id + ""
      // });

      // Assuming the fetched data contains the policy number
      // if(!memberStatusData.policy_no){
      //   console.log("Policy number not found",user.name, user.phone_number)
      //   continue
      // }
     // const updatedPolicyNumber = memberStatusData.policy_no;

      // Update the policy number in the database
    // let updatePolicy =  await db.policies.update({
    //     arr_policy_number: updatedPolicyNumber
    //   }, {
    //     where: {
    //       policy_id: policy.policy_id
    //     }
    //   });
    await  updateAirtelMoneyId(policy.user.arr_member_number, (policy.user.membership_id).toString(), policy.airtel_money_id)
    console.log(`updateAirtelMoneyId: ${i}`, user.name, user.phone_number);

     // console.log(`Policy number updated for policy_no: ${user.name} - ${updatedPolicyNumber}`);
      //await delay(1000);
    }
  } catch (e) {
    console.log(e);
  }
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  // check_if_phone_number_has_paid_poicy(array_of_phone_numbers_to_check_paid_policies)
  //findDuplicatePhoneNumbers(array_of_phone_numbers_to_check_paid_policies)
//policyReconciliation(array_of_phone_numbers)
//getArrMemberNumberData()

 // await getAirtelUser('2567041036460', 2)
 //updatePremiumArr(no_renewal_policies)
 //updateAARpolicyNumber()
 //updatePremiumArr(arr_members)
}


