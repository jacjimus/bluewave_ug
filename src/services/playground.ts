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
//103108563484	29-04-2024 07:27 AM	707123304	14,000
const array_of_phone_numbers = [
  
 // { transaction_id: 102325849438, transaction_date: '11-04-2024 6:18 PM', phone_number: 709225627, premium: 5000 },


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


 let arr_members =[ 
 
 
 
]

// Update member details
async function updateAARpolicyNumber(arr_members) {
  try {

    arr_members.forEach(async (arr_member_number) => {
     
    const policy = await db.policies.findOne({
      where: {
        partner_id: 2,
       policy_status: "paid",
      },
      include: [{
        model: db.users,
        where: {
          partner_id: 2,
          arr_member_number: convertToStandardFormat(arr_member_number)
        }
      }]  
    });
    if(policy){
      policy.user.arr_member_number = arr_member_number
    //await  updateAirtelMoneyId(arr_member_number, (policy.membership_id).toString(), policy.airtel_money_id)
  let updatedPolicyArr = await updatePremium(policy.user, policy)
   console.log(updatedPolicyArr)
   //console.log("Policy found", arr_member_number, policy)
  
   
    }else{
      console.log("Policy not found", arr_member_number)
    } 
    
  })
  } catch (error) { 
    console.log(error)
    throw error
  }
}
    

    // Loop through allPaidPolicies in batches
    // for (let i = 0; i < allPaidPolicies.length; i++) {
    //   const policy = allPaidPolicies[i];
    //   const user = policy.user;

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
    // console.log(`updateAirtelMoneyId: ${i}`, user.name, user.phone_number);

     // console.log(`Policy number updated for policy_no: ${user.name} - ${updatedPolicyNumber}`);
      //await delay(1000);
  
  
 
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let array_of_phone_numbers_to_update_trans_id = [

]

export const playground = async () => {

//policyReconciliation(array_of_phone_numbers)

//updateAARpolicyNumber(arr_members)
}


