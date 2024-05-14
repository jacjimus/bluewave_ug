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
import { google } from 'googleapis';

const serviceAccountKeyFile = "./aitel-payment-reconciliation-abe90c6ab59e.json"
const sheetId = '1UcDCCRGLWqZ4LQZPztJ50-YYxzbkuLa6U4RVvvgJ1tQ'//'1Q4IB0vzghTIIirbGdU49UY2FPfESViXaY77oGy44J3I'
const tabName = 'BackendPool'//'Ddwaliro Care Airtel Payments'
const range = 'A:R'


const auth = new google.auth.GoogleAuth({
  keyFile: serviceAccountKeyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const getSheetData = async () => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: tabName + '!' + range,
    });
    return response.data.values;
  } catch (error) {
    console.log(error);
  }
}



async function processTransaction(transaction) {
  try {
    if (transaction.premium <= 0 || transaction.premium === null || transaction.transaction_id == null) {
      console.log("Invalid premium amount");
      return;
    }

    const policy = await db.policies.findOne({
      where: {
        phone_number: transaction.phone_number,
        premium: transaction.premium,
        policy_status: 'paid',
        partner_id: 2,

      },

      order: [["createdAt", "ASC"]],

      attributes: ['policy_id', 'airtel_transaction_ids'], // Select only necessary fields
    });

    if (!policy) {
      console.log("Policy not found", transaction);
      return;
    }

    console.log("POLICY FOUND", policy.policy_id, transaction);

    const updatedPayment = await db.payments.update({
      payment_status: 'paid',
      airtel_transaction_id: transaction.transaction_id,
    }, {
      where: {
        policy_id: policy.policy_id,
        payment_amount: transaction.premium,
      }
    });

    console.log("Updated payment", updatedPayment);

    // const existingTransactionIds = policy.airtel_transaction_ids || [];
    // if (!existingTransactionIds.includes(transaction.transaction_id)) {
    //   existingTransactionIds.push(transaction.transaction_id);
    // }

    console.log("TransactionIds", transaction.transaction_id, policy.policy_id, transaction.premium)
    // const updatedPolicy = await db.policies.update({
    //   airtel_transaction_ids: existingTransactionIds,
    //   // Sequelize.fn('array_append', Sequelize.col('airtel_transaction_ids'), transaction.transaction_id),
    //   where: {
    //     id: policy.id,
    //     premium: transaction.premium,
    //     policy_status: 'paid',
    //     partner_id: 2,
    //     airtel_transaction_ids: {
    //       [Sequelize.Op.notContains]: [transaction.transaction_id]
    //     }
    //   }
    // });

    //     const updatedPolicy = await db.sequelize.query(`
    //   UPDATE policies
    //   SET airtel_transaction_ids = array_append(airtel_transaction_ids, $1)
    //   WHERE policy_id = $2
    //     AND premium = $3
    //     AND policy_status = 'paid'
    //     AND partner_id = 2
    //     AND NOT ($1 = ANY (airtel_transaction_ids))
    // `, {
    //   bind: [transaction.transaction_id, policy.policy_id, transaction.premium],
    //   type: db.sequelize.QueryTypes.UPDATE
    // });


    // console.log("Updated policy", updatedPolicy);

  } catch (error) {
    console.error("Error processing transaction:", error);
  }
}

export async function getDataFromSheet() {
  try {
    const data = await getSheetData();
    await Promise.all(data.map(async (row) => {
      const transaction = {
        transaction_id: row[2],
        transaction_date: row[3],
        phone_number: `+256${row[4]}`,
        premium: parseInt(row[5].replace(/,/g, ''), 10),
        full_name: row[6],
      };
      await processTransaction(transaction);
    }));
  } catch (error) {
    console.error("Error getting sheet data:", error);
  }
}



// 103751932785	13/05/2024 08:15	754403188	5,000
// 103751039401	13/05/2024 07:42	703280824	5,000
// 103749093711	13/05/2024 00:33	709336289	10,000
// 103748517289	12-05-2024 11:30 PM	758405473	10,000
// 103717780396	12-05-2024 11:32 AM	708655691	5,000
// 103714381526	12-05-2024 10:10 AM	758356914	5,000
// 103706220612	11-05-2024 11:16 PM	751816886	5,000
// 103706076028	11-05-2024 11:09 PM	751816886	5,000
// 103704621049	11-05-2024 10:16 PM	758684283	5,000
// 103703049759	11-05-2024 9:39 PM	700894457	5,000
// 103693822957	11-05-2024 7:15 PM	705900037	30,000
// 103677900834	11-05-2024 1:32 PM	759956278	14,000
// 103663061536	11-05-2024 7:38 AM	706879885	5,000
// 103662104881	11-05-2024 6:21 AM	744310013	10,000
// 103655040032	10-05-2024 8:57 PM	702554860	5,000
// 103624855939	10-05-2024 10:53 AM	753001715	5,000
// 103616469009	10-05-2024 4:46 AM	757318788	18,000
// 103612746829	09-05-2024 10:01 PM	709032828	5,000
// 103611040336	09-05-2024 9:23 PM	706266888	5,000
// 103609048496	09-05-2024 8:46 PM	705566031	5,000
// 103607730371	09-05-2024 8:25 PM	707362958	5,000
// 103604002676	09-05-2024 7:33 PM	705241566	10,000
// 103603983451	09-05-2024 7:32 PM	757351174	35,000
// 103593693160	09-05-2024 4:22 PM	752603065	5,000
// 103593126804	09-05-2024 4:09 PM	706279282	18,000
// 103592745082	09-05-2024 4:01 PM	750192578	10,000
// 103588812736	09-05-2024 2:31 PM	742664905	5,000
// 103588673656	09-05-2024 2:28 PM	757333078	5,000
// 103583642535	09-05-2024 12:38 PM	757288608	5,000
// 103576153221	09-05-2024 9:56 AM	752682142	5,000
// 103571260347	09-05-2024 7:22 AM	753175157	5,000
// 103545497752	08-05-2024 3:06 PM	757181061	5,000
// 103531601959	08-05-2024 9:53 AM	750563312	10,000
// 103512048413	07/05/2024 19:15	708125442	5,000
// 103501449915	07/05/2024 15:42	708331142	10,000
// 103479221344	07/05/2024 02:35	758992429	18,000
const array_of_phone_numbers = [

  { transaction_id: 102225504260, transaction_date: '09-04-2024 5:45 PM', phone_number: '702116686', premium: 50000 },

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
          policy_status: 'paid',

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


      if (policy) {
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

        console.log("===== POLICY =====", policy.policy_id, policy.policy_status, policy.premium, policy.policy_paid_date, policy.policy_paid_amount)

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

        } else {
          console.log("Transaction not found")
        }
      } else {
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
    // policies.forEach(async (arr_member_number) => {
    // console.log("arr_member_number", arr_member_number)
    const policies = await db.policies.findAll({
      where: {
        policy_status: 'paid',
        partner_id: 2,
        installment_order: 6,
        installment_type: 2,
        policy_start_date: {
          [Op.between]: ['2023-10-01', '2024-05-03']
        }

      },
      include: [{
        model: db.users,
        where: {
          partner_id: 2,
          //arr_member_number: convertToStandardFormat(arr_member_number)
        }
      }],
      order: [["createdAt", "DESC"]],
    });

    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      const customer = policy.user
      console.log(customer.name, policy.phone_number);
      //customer.arr_member_number = arr_member_number
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

    // })

  } catch (error) {
    console.log(error);
  }
}
const membershipData = [
  //{ membership_id: 612994, arr_member_number: 'UG155848-01' },

];


// Iterate over the membership data and update the corresponding records in the users table
async function updateMembershipData() {
  for (const data of membershipData) {
    await db.users.update(
      { membership_id: data.membership_id },
      { where: { arr_member_number: convertToStandardFormat(data.arr_member_number) } }
    );
  }
}



let arr_members = [

  "UG162422-00",
  "UG160223-00",
  "UG160264-00",
  "UG160484-00",
  "UG160683-00",
  "UG161318-00",
  "UG162727-00"


]

// Update member details
async function updateAARpolicyNumber(arr_members: any) {
  try {
    for (const memberNumber of arr_members) {
      console.log("arr_member", memberNumber)

      const policy = await db.policies.findOne({
        where: {
          partner_id: 2,
          policy_status: "paid",
        },
        include: [{
          model: db.users,
          where: {
            partner_id: 2,
            arr_member_number: memberNumber,
          },
        }],
        order : [["createdAt", "ASC"]]
      });

   
      if (policy && policy.user) {
        policy.user.arr_member_number = memberNumber;
        console.log("arr_member", memberNumber, policy.user.name, policy.phone_number, policy.premium);
        // Update Airtel Money ID (assuming updateAirtelMoneyId is implemented)
        // await updateAirtelMoneyId(memberNumber, policy.membership_id.toString(), policy.airtel_money_id);

        // Update premium if implemented
        if ( policy.user.arr_member_number !== null ) {
          const updatedPolicy = await updatePremium(policy.user, policy); // Pass a copy to avoid data race
          console.log("POLICY found and updated",updatedPolicy);
        }
      } else {
        console.log("Policy not found", memberNumber);
      }
    }
  } catch (error) {
    console.error(error);

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

async function createARRDependants() {
  try {
    // GET ALL POLICIES WHERE POLICY STATUS IS PAID AND BENEFACTOR IS FAMILY OR OTHER AND TOTAL MEMBER NUMBER IS NOT M
    // ADD DELAY TO AVOID RATE LIMITING
    const policies = await db.policies.findAll({
      where: {
        policy_status: 'paid',
        partner_id: 2,
        [Op.or]: [{ beneficiary: 'FAMILY' }, { beneficiary: 'OTHER' }],
        total_member_number: {
          [Op.not]: 'M'
        }
      },
      include: [{
        model: db.users,
        where: {
          partner_id: 2,
          arr_member_number: ''//
        }
      }]
    });

    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      const user = policy.user;
      const number_of_dependants = parseFloat(policy?.total_member_number.split("")[2]) || 0;

      if (number_of_dependants > 0) {

        await createDependant(user, policy, number_of_dependants);
        delay(5000);
      }
    }

  } catch (error) {
    console.log(error)
  }

}



export const _sendPolicyRenewalReminder = async () => {
  try {
      //  has no arr_member_number and partner_id is 2 and policy_status is pending
    const customers = await db.users.findAll({
      where: {
        partner_id: 2,
        arr_member_number: null,
        phone_number: {
          [Op.not]: null
        },
        email: null
      },
      limit : 10000,
      order : [["createdAt", "DESC"]]
    });
       
    let message =`Dear Customer, May is here with us but getting health insurance has never been easier. Ddwaliro Care is just a few taps away. Dial *185*7*6*3# now to purchase and enjoy peace of mind. Act today, protect tomorrow!`

    customers.forEach(async (customer) => {
     // console.log("customer", customer)
      let phone_number = `+256${customer.phone_number}`
     console.log("phone_number", phone_number, customer.name)
    //  Send SMS
      await SMSMessenger.sendSMS(2, phone_number, message);
    });
    
    return {
      status: true,
      message: "successfully resent reminder sms"
    }

  } catch (error) {
    console.log(error);
  }
}



export const playground = async () => {

//policyReconciliation(array_of_phone_numbers)
 // _sendPolicyRenewalReminder()

 //updateAARpolicyNumber(arr_members)

  //getDataFromSheet();
  //createARRDependants()

  //updateMembershipData()

  //updatePremiumArr(array_of_phone_numbers)
}


