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
import fs from 'fs';

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
        partner_id: 2,

      },

      order: [["createdAt", "ASC"]],

      attributes: ['policy_id', 'airtel_money_id', 'airtel_transaction_ids'], // Select only necessary fields
    });

 

    if (policy.policy_status == 'pending' || policy.policy_status == 'failed') {
      // compile pending policies and send to email

      await singlePolicyReconciliation(transaction)


    }
    if (policy.airtel_money_id !== null && policy.policy_status === 'paid') {
      //update airtel money id
      const updatedPolicy = await db.policies.update({
        airtel_money_id: transaction.transaction_id,
      }, {
        where: {
          policy_id: policy.policy_id,
          premium: transaction.premium,
          policy_status: 'paid',
          partner_id: 2,
        }
      });
      console.log("Updated policy without airtel money id", updatedPolicy);
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

    }

    console.log("POLICY FOUND", policy.policy_id, transaction);


    // const existingTransactionIds = policy.airtel_transaction_ids || [];
    // if (!existingTransactionIds.includes(transaction.transaction_id)) {
    //   existingTransactionIds.push(transaction.transaction_id);
    // }

    //console.log("TransactionIds", transaction.transaction_id, policy.policy_id, transaction.premium)
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

    console.log("Recxonciliation processed successfully");

  } catch (error) {
    console.error("Error processing transaction:", error);
  }
}

export async function getDataFromSheet() {
  try {
    const data = await getSheetData();
    await Promise.all(data.map(async (row) => {
      //console.log("Row", row)
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

async function singlePolicyReconciliation (pending_policies) {
  
  const transaction_date = moment(pending_policies.transaction_date, "YYYY-MM-DD h:mm A");
  try {
   
    let policy = await db.policies.findOne({
      where: {
        phone_number: pending_policies.phone_number,
        premium: pending_policies.premium,
        policy_status: 'paid',
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

    if (!policy) {
      console.log("Policy not found", pending_policies.phone_number, pending_policies.premium)
      return
    }

    let payment = await db.payments.findOne({
      where: {
        policy_id: policy.policy_id,
        payment_amount: pending_policies.premium,
      },
      limit: 1,

    });

    if (!payment) {
      console.log("Payment not found")
      return
    }

   
    let transaction = await db.transactions.findOne({
      where: {
        user_id: policy.user_id,
        amount: pending_policies.premium,
      },
      limit: 1,

    });



    if (!transaction) {
      console.log("Transaction not found")
      return
    }

    console.log("===== TRANSACTION =====", transaction)

      let paymentCallback = {
        transaction: {
          id: pending_policies.transaction_id,
          message: `PAID UGX ${pending_policies.premium} to AAR Uganda for ${policy.beneficiary} ${policy.policy_status} Cover Charge UGX 0. Bal UGX ${transaction.premium}. TID: ${pending_policies.airtel_money_id}. Date: ${transaction_date}`,
          status_code: "TS",
          airtel_money_id: pending_policies.transaction_id,
          payment_date: transaction.createdAt,

        }
      }

      // console.log("paymentCallback", paymentCallback)
     let result = await reconcilationCallback(paymentCallback.transaction)
     console.log("RECONCILIATION RESULT ", result);
      // slow down the loop
      await new Promise(resolve => setTimeout(resolve, 2000));



  }
  catch (error) {
    console.log(error);
  }

}







// //transaction_id transaction_date	phone_number	premium	full_name
// 104246811742	23-05-2024 10:00 PM	743460967	10,000	BETTY NAKABUGO (743460967)	2
// 104246053526	23-05-2024 09:42 PM	743460967	10,000	BETTY NAKABUGO (743460967)	2
// 104242977350	23/05/2024 20:44	742607836	10,000	MOSES MATOVU (742607836)	1
// 104239401714	23/05/2024 19:50	742021186	5,000	CHRISTINE TWIJUKYE (742021186)	2
// 104239207104	23/05/2024 19:47	743174762	18,000	MAXENSIA NAMPEBWA (743174762)	1
// 104229906146	23/05/2024 16:54	702217718	10,000	KIVIIRI BENJAMIN (702217718)	4
// 104224547928	23/05/2024 14:47	702031133	77,000	IBRAHIM KAMULEGEYA (702031133)	3
// 104222176506	23/05/2024 13:52	702767220	15,000	JIM MATSIKO (702767220)	2
// 104221718519	23/05/2024 13:42	702598206	18,000	MARIA NAKATOOGO (702598206)	2
// 104219146425	23/05/2024 12:44	743605818	14,000	YUDA SEKAJJA (743605818)	3
// 104219109489	23/05/2024 12:43	743605818	14,000	YUDA SEKAJJA (743605818)	3
// 104212444192	23/05/2024 10:16	708075003	5,000	JOHN JJUMBA (708075003)	1
// 104184837323	22-05-2024 04:58 PM	743225383	5,000	MOUREEN NAMUGGA (743225383)	1
// 104175081081	22-05-2024 01:17 PM	743505894	5,000	AGNESI GIMBO (743505894)	2
// 104160491680	22/05/2024 07:02	759940397	5,000	JALIA NABATANZI (759940397)	5
// 104160287602	22/05/2024 06:40	759098494	5,000	JANE NAKANDI (759098494)	2
// 104133847241	21/05/2024 15:25	709375625	10,000	SAMUEL SSEMBOGGA (709375625)	4
// 104130841090	21/05/2024 14:17	743773764	5,000	FATUMAH NELIMA (743773764)	2
// 104127876289	21/05/2024 13:12	742060847	5,000	MOHAMMADI LWANGA (742060847)	1
// 104123826725	21/05/2024 11:46	750555263	18,000	DAVID KALEMEERA (750555263)	2
// 104122541933	21/05/2024 11:19	756965041	5,000	RONALD ASIIMWE (756965041)	1
// 104121427034	21/05/2024 10:55	708357953	10,000	JOSHUA KANDI (708357953)	1
// 104117336114	21-05-2024 09:22 AM	754169557	5,000	ISSA MUDUNGU (754169557)	1
// 104114945142	21/05/2024 08:17	750849852	5,000	EVERLYN NANDUDU (750849852)	1


//103988584561	18/05/2024 12:44	744207264	5,000	JOSEPH KATONGOLE (744207264)
const array_of_phone_numbers = [
 
  { transaction_id: 104246811742, transaction_date: '23-05-2024 10:00 PM2', phone_number: 743460967, premium: 10000, installment_count: 1 },
  { transaction_id: 104246053526, transaction_date: '23-05-2024 09:42 PM', phone_number: 743460967, premium: 10000, installment_count: 1 },
  { transaction_id: 104242977350, transaction_date: '23/05/2024 20:44', phone_number: 742607836, premium: 10000, installment_count: 1 },
  { transaction_id: 104239401714, transaction_date: '23/05/2024 19:50', phone_number: 742021186, premium: 5000, installment_count: 1 },
  { transaction_id: 104239207104, transaction_date: '23/05/2024 19:47', phone_number: 743174762, premium: 18000, installment_count: 1 },
  { transaction_id: 104229906146, transaction_date: '23/05/2024 16:54', phone_number: 702217718, premium: 10000, installment_count: 1 },
  { transaction_id: 104224547928, transaction_date: '23/05/2024 14:47', phone_number: 702031133, premium: 77000, installment_count: 1 },
  { transaction_id: 104222176506, transaction_date: '23/05/2024 13:52', phone_number: 702767220, premium: 15000, installment_count: 1 },
  { transaction_id: 104221718519, transaction_date: '23/05/2024 13:42', phone_number: 702598206, premium: 18000, installment_count: 1 },
  { transaction_id: 104219146425, transaction_date: '23/05/2024 12:44', phone_number: 743605818, premium: 14000, installment_count: 1 },
  { transaction_id: 104219109489, transaction_date: '23/05/2024 12:43', phone_number: 743605818, premium: 14000, installment_count: 1 },
  { transaction_id: 104212444192, transaction_date: '23/05/2024 10:16', phone_number: 708075003, premium: 5000, installment_count: 1 },
  { transaction_id: 104184837323, transaction_date: '22-05-2024 04:58 PM', phone_number: 743225383, premium: 5000, installment_count: 1 },
  { transaction_id: 104175081081, transaction_date: '22-05-2024 01:17 PM', phone_number: 743505894, premium: 5000, installment_count: 1 },
  { transaction_id: 104160491680, transaction_date: '22/05/2024 07:02', phone_number: 759940397, premium: 5000, installment_count: 1 },
  { transaction_id: 104160287602, transaction_date: '22/05/2024 06:40', phone_number: 759098494, premium: 5000, installment_count: 1 },
  { transaction_id: 104133847241, transaction_date: '21/05/2024 15:25', phone_number: 709375625, premium: 10000, installment_count: 1 },
  { transaction_id: 104130841090, transaction_date: '21/05/2024 14:17', phone_number: 743773764, premium: 5000, installment_count: 1 },
  { transaction_id: 104127876289, transaction_date: '21/05/2024 13:12', phone_number: 742060847, premium: 5000, installment_count: 1 },
  { transaction_id: 104123826725, transaction_date: '21/05/2024 11:46', phone_number: 750555263, premium: 18000, installment_count: 1 },
  { transaction_id: 104122541933, transaction_date: '21/05/2024 11:19', phone_number: 756965041, premium: 5000, installment_count: 1 },
  { transaction_id: 104121427034, transaction_date: '21/05/2024 10:55', phone_number: 708357953, premium: 10000, installment_count: 1 },
  { transaction_id: 104117336114, transaction_date: '21-05-2024 09:22 AM', phone_number: 754169557, premium:  5000, installment_count: 1 },
  { transaction_id: 104114945142, transaction_date: '21/05/2024 08:17', phone_number: 750849852, premium: 5000, installment_count: 1 },

  
  
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

async function getArrMemberNumberData(array_of_phone_numbers) {
  try {
    
    array_of_phone_numbers.forEach(async (item) => {
      const transaction_date = moment(item.transaction_date, "YYYY-MM-DD h:mm A");
      // console.log("transaction_date_str", transaction_date)
      let policy = await db.policies.findOne({
        where: {
          phone_number: `+256${item.phone_number}`,
          premium: item.premium,
          policy_status: 'paid',
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
     

      const customer = policy.user
      console.log(customer.name, policy.phone_number);

       await db.policies.update({
        airtel_money_id: item.transaction_id,
        policy_paid_date: transaction_date,
      }, {
        where: {
          policy_id: policy.policy_id,
          premium: item.premium,
          policy_status: 'paid',
          partner_id: 2,
        }
      });

      

      // let result = await registerPrincipal(customer, policy);
      // console.log(result);
      // if (result.code !== 200) {
      //   await getMemberNumberData(customer.phone_number);
      // }
      // Introduce a delay of 1 second between each iteration
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    })

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
        order: [["createdAt", "ASC"]]
      });


      if (policy && policy.user) {
        policy.user.arr_member_number = memberNumber;
        console.log("arr_member", memberNumber, policy.user.name, policy.phone_number, policy.premium);
        // Update Airtel Money ID (assuming updateAirtelMoneyId is implemented)
        // await updateAirtelMoneyId(memberNumber, policy.membership_id.toString(), policy.airtel_money_id);

        // Update premium if implemented
        if (policy.user.arr_member_number !== null) {
          const updatedPolicy = await updatePremium(policy.user, policy); // Pass a copy to avoid data race
          console.log("POLICY found and updated", updatedPolicy);
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

    //       select  p.phone_number from policies p where p.partner_id =2 and p.policy_status ='paid' 
    // and p.policy_paid_date <= '2024-02-28' and p.policy_start_date <= '2024-02-28'and p.installment_type = 2 and p.installment_order< 4

    const policies = await db.policies.findAll({
      where: {
        partner_id: 2,
        policy_status: 'paid',
        policy_paid_date: {
          [Op.lte]: '2024-02-28'
        },
        policy_start_date: {
          [Op.lte]: '2024-02-28'
        },
        installment_type: 2,
        installment_order: {
          [Op.lt]: 4
        }
      },

    });
    // order by  policy_paid_date desc
    // const customers = await db.users.findAll({
    //   where: {
    //     partner_id: 2,
    //     arr_member_number: null,
    //     phone_number: {
    //       [Op.not]: null
    //     },
    //     email: null
    //   },
    //   limit : 10000,
    //   order : [["createdAt", "DESC"]]
    // });

    let message = `Gyebaleko! Have you renewed your Ddwaliro care this month? Dial *185*7*6*3# today to renew, osigale ku cover.`

    // customers.forEach(async (customer) => {
    //  // console.log("customer", customer)
    //   let phone_number = `+256${customer.phone_number}`
    //  console.log("phone_number", phone_number, customer.name)
    // //  Send SMS
    //   await SMSMessenger.sendSMS(2, phone_number, message);
    // });

    policies.forEach(async (policy) => {
      let phone_number = policy.phone_number
      console.log("phone_number", phone_number, policy.first_name, policy.last_name)
      //  Send SMS
      await SMSMessenger.sendSMS(2, phone_number, message);
    }
    )

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
  //_sendPolicyRenewalReminder()

  //updateAARpolicyNumber(arr_members)

  //getDataFromSheet()
  //createARRDependants()

  getArrMemberNumberData(array_of_phone_numbers)

  //updatePremiumArr(array_of_phone_numbers)
}


