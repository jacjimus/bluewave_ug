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



export const _sendPolicyRenewalReminder = async (phone_number: string, type: string = 'reminder') => {
  try {
    const policy = await db.policies.findOne({
      where: {
        phone_number: phone_number,
        policy_status: 'paid',
        installment_type: 2,
        //installment_order: 1,
        partner_id: 2,

      }
    });

    if (!policy) {
      return {
        status: false,
        message: "policy not found"
      }
    }

    let message: string
    if (type == 'reminder') {
      const reminder_message = `Dear ${policy.first_name} ${policy.last_name}, your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE. Dial *185*7*6*3# to renew.`
      console.log(reminder_message);
      message = reminder_message

    } else if (type == "policy_number") {
      const customer = await db.users.findOne({
        phone_number: phone_number.substring(3)
      })

      if (!customer.arr_member_number) {
        const arrMember = await getMemberNumberData(phone_number)
        console.log(arrMember)
        if (arrMember.code == 624 || arrMember.code == 400) {
          await registerPrincipal(customer, policy)

          return {
            status: true,
            message: "successfully resent reminder sms"
          }

        } else {
          console.log("arr member number", arrMember.data.member_number);
          const policy_number_message = `Dear customer, your Ddwaliro Care Policy number is ${customer.arr_member_number}. Present this to the hospital whenever you have a claim. To renew, dial *185*7*6*3# and check on My Policy.`

          message = policy_number_message
        }

      } else {
        const policy_number_message = `Dear customer, your Ddwaliro Care Policy number is ${customer.arr_member_number}. Present this to the hospital whenever you have a claim. To renew, dial *185*7*6*3# and check on My Policy.`

        message = policy_number_message
      }
    } else {
      throw new Error("type not recognized")
    }
    if (message == undefined) {
      throw new Error("message not defined")
    }

    SMSMessenger.sendSMS(2, policy.phone_number, message);
    return {
      status: true,
      message: "successfully resent reminder sms"
    }

  } catch (error) {
    console.log(error);
  }
}

// /*
// function to pull data from google sheets and update the database
// Workflow:
// 1. The cron job will run every 24 hours
// 2. The cron job will pull data from the google sheets
// 3. The cron job will update the database with the new data

// */



// async function main() {

//   try {
//     // Generating google sheet client
//     const googleSheetClient = await _getGoogleSheetClient();

//     // Reading Google Sheet from a specific range
//     const data = await _readGoogleSheet(googleSheetClient, sheetId, tabName, range);
//     console.log(data.length);
//     data.forEach(async (row) => {

//       let paymentData = {
//         id: row[0],
//         transaction_id: row[1],
//         external_reference: row[2],
//         transaction_date: row[3],
//         phone_number_mobile_number: row[4],
//         transaction_amount: row[6],
//         payment_status: row[13],
//         buyer_details: row[14],
//       }
//       console.log(paymentData);
//       // check if the data is in the database policy table paid

//       let policies = await db.policies.findAll({
//         where: {
//           phone_number: `+256${paymentData.phone_number_mobile_number}`,
//           policy_status: 'paid',
//           premium: parseInt(paymentData.transaction_amount.replace(/,/g, ''), 10)
//         }
//       })

//       console.log("POLICIES", policies);
//       if (policies.length == 0) {
//         // update the policy table with the transaction id and the external reference
//         //   await db.policies.update({
//         //     transaction_id: paymentData.transaction_id,
//         //     external_reference: paymentData.external_reference,
//         //     payment_status: paymentData.payment_status
//         //   }, {
//         //     where: {
//         //       phone_number:  `+256${paymentData.phone_number_mobile_number}`,
//         //       policy_status: 'paid',
//         //       premium:  parseInt(paymentData.transaction_amount.replace(/,/g, ''), 10)
//         //     }
//         //   })
//         // }

//         // create file with the data
//         let data = JSON.stringify(paymentData);
//         await fs.writeFile('paymentData.json', data);
//         console.log('Data written to file');


//       } else {
//         console.log(" policies found");
//       }

//     })


//   } catch (error) {
//     console.log(error);
//   }

//   // Adding a new row to Google Sheet
//   // const dataToBeInserted = [
//   //    ['11', 'rohith', 'Rohith', 'Sharma', 'Active'],
//   //    ['12', 'virat', 'Virat', 'Kohli', 'Active']
//   // ]
//   //await _writeGoogleSheet(googleSheetClient, sheetId, tabName, range, dataToBeInserted);
// }

// async function _getGoogleSheetClient() {
//   const auth = new google.auth.GoogleAuth({
//     keyFile: serviceAccountKeyFile,
//     scopes: ['https://www.googleapis.com/auth/spreadsheets'],
//   });
//   const authClient = await auth.getClient();
//   return google.sheets({
//     version: 'v4',
//     auth: authClient,
//   });
// }

// async function _readGoogleSheet(googleSheetClient, sheetId, tabName, range) {
//   const res = await googleSheetClient.spreadsheets.values.get({
//     spreadsheetId: sheetId,
//     range: `${tabName}!${range}`,
//   });

//   return res.data.values;
// }

// async function _writeGoogleSheet(googleSheetClient, sheetId, tabName, range, data) {
//   await googleSheetClient.spreadsheets.values.append({
//     spreadsheetId: sheetId,
//     range: `${tabName}!${range}`,
//     valueInputOption: 'USER_ENTERED',
//     insertDataOption: 'INSERT_ROWS',
//     resource: {
//       "majorDimension": "ROWS",
//       "values": data
//     },
//   })
// }


// phone_number premium

// fill in the transaction_id , phone numbers and the premium
// 100224831700	708408574		93,000
// 100224246369	759020160		10,000
// 100223756685	704313101		5,000
// 100223024857	743846893		5,000
// 100222831329	743846893		5,000
// 100221322343	756132671		208,000
// 100220474705	750673544		10,000
// 100219741087	755251695		14,000
// 100219072551	706085566		5,000
// 100218524719	741339351		18,000
// 100216766445	701426813		5,000
// 100215769023	754711355		5,000
// 100214786335	754571088		5,000
// 100213857389	753953135		35,000
// 100213175147	753533274		5,000
// 100212272862	703689550		5,000
// 100212107378	703689550		5,000
// 100212052395	703689550		5,000
// 100211891968	753414072		25,000
// 100211485649	700797264		18,000
// 100210772750	741339351		18,000
// 100210402979	741294042		14,000
// 100210238059	740878624		5,000
// 100210163451	706111601		5,000
// 100210073604	743020546		10,000
// 100209562317	740451024		18,000
// 100208379705	743486475		10,000
// 100207341162	705389214		5,000
// 100206846459	752322768		10,000
// 100205412918	754237029		18,000
// 100205384240	706452629		10,000
// 100203968303	703815693		5,000
// 100202139947	701190117		20,000
// 100200691656	707146440		5,000
// 100199283127	757198144		18,000
// 10019346411	705276969		5,000
// 10019338574	751070547		5,000
// 10019212616	740901229		5,000
// 10019146103	754955701		18,000

const array_of_phone_numbers = [

  //{ airtel_money_id: '100224831700', phone_number: '708408574', premium: 93000 },
  { airtel_money_id: '100224246369', phone_number: '759020160', premium: 10000 },
  { airtel_money_id: '100223756685', phone_number: '704313101', premium: 5000 },
  { airtel_money_id: '100223024857', phone_number: '743846893', premium: 5000 },
  { airtel_money_id: '100222831329', phone_number: '743846893', premium: 5000 },
  { airtel_money_id: '100221322343', phone_number: '756132671', premium: 208000 },
  { airtel_money_id: '100220474705', phone_number: '750673544', premium: 10000 },
  { airtel_money_id: '100219741087', phone_number: '755251695', premium: 14000 },
  { airtel_money_id: '100219072551', phone_number: '706085566', premium: 5000 },
  { airtel_money_id: '100218524719', phone_number: '741339351', premium: 18000 },
  { airtel_money_id: '100216766445', phone_number: '701426813', premium: 5000 },
  { airtel_money_id: '100215769023', phone_number: '754711355', premium: 5000 },
  { airtel_money_id: '100214786335', phone_number: '754571088', premium: 5000 },
  { airtel_money_id: '100213857389', phone_number: '753953135', premium: 35000 },
  { airtel_money_id: '100213175147', phone_number: '753533274', premium: 5000 },
  { airtel_money_id: '100212272862', phone_number: '703689550', premium: 5000 },
  { airtel_money_id: '100212107378', phone_number: '703689550', premium: 5000 },
  { airtel_money_id: '100212052395', phone_number: '703689550', premium: 5000 },
  { airtel_money_id: '100211891968', phone_number: '753414072', premium: 25000 },
  { airtel_money_id: '100211485649', phone_number: '700797264', premium: 18000 },
  { airtel_money_id: '100210772750', phone_number: '741339351', premium: 18000 },
  { airtel_money_id: '100210402979', phone_number: '741294042', premium: 14000 },
  { airtel_money_id: '100210238059', phone_number: '740878624', premium: 5000 },
  { airtel_money_id: '100210163451', phone_number: '706111601', premium: 5000 },
  { airtel_money_id: '100210073604', phone_number: '743020546', premium: 10000 },
  { airtel_money_id: '100209562317', phone_number: '740451024', premium: 18000 },
  { airtel_money_id: '100208379705', phone_number: '743486475', premium: 10000 },
  { airtel_money_id: '100207341162', phone_number: '705389214', premium: 5000 },
  { airtel_money_id: '100206846459', phone_number: '752322768', premium: 10000 },
  { airtel_money_id: '100205412918', phone_number: '754237029', premium: 18000 },
  { airtel_money_id: '100205384240', phone_number: '706452629', premium: 10000 },
  { airtel_money_id: '100203968303', phone_number: '703815693', premium: 5000 },
  { airtel_money_id: '100202139947', phone_number: '701190117', premium: 20000 },
  { airtel_money_id: '100200691656', phone_number: '707146440', premium: 5000 },
  { airtel_money_id: '100199283127', phone_number: '757198144', premium: 18000 },
  { airtel_money_id: '10019346411', phone_number: '705276969', premium: 5000 },
  { airtel_money_id: '10019338574', phone_number: '751070547', premium: 5000 },
  { airtel_money_id: '10019212616', phone_number: '740901229', premium: 5000 },
  { airtel_money_id: '10019146103', phone_number: '754955701', premium: 18000 },
  { airtel_money_id: '10019146103', phone_number: '754955701', premium: 18000 }

]


async function policyReconciliation() {

  try {
  
    let result = {
      message: "error",
      code: 404
    }
    array_of_phone_numbers.forEach(async (item) => {
      
      let transaction_date = moment ('2024-03-01').format('YYYY-MM-DD HH:mm:ss')
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

    console.log("====== PAYMENT =====", payment?.payment_status, payment?.payment_amount, payment?.payment_date, payment?.payment_metadata?.transaction)

    console.log("===== POLICY =====", policy.policy_status, policy.premium, policy.policy_paid_date, policy.policy_paid_amount)

    if (policy.policy_status == 'paid' && payment.payment_status == 'paid' && policy.premium == payment.payment_amount) {
      console.log(" ===== policy paid  and payment match =======")
      
    }

    let transaction = await db.transactions.findOne({
      where: {
        policy_id: policy.policy_id,
      },
      limit: 1,
    });


    if(transaction == null){
      // create transaction
      let user_id = policy.user_id
      let partner_id = policy.partner_id
      let policy_id = policy.policy_id
      let amount = policy.premium
      let transactionId = uuidv4()
      transaction = await createTransaction(user_id, partner_id, policy_id, transactionId, amount)
   
      console.log("create transaction", transaction);
    }
   

    console.log("transaction", transaction)

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
  )
  return result
  }
  catch (error) {
    console.log(error);
  }
}




// 1. get all the policies that are paid and have airtel money id as null
//select * from policies where policy_status = 'paid' and airtel_money_id is null and partner_id =2
// 2. update the airtel money id 

// function updateAirtelMoneyId(array_of_phone_numbers) {
//   array_of_phone_numbers.forEach(async (item) => {
//     const { phone_number, airtel_money_id, premium } = item;
//     let policy = await db.policies.update({
//       airtel_transaction_id: airtel_money_id
//     }, {
//       where: {
//         phone_number: `+256${phone_number}`,
//         policy_status: 'paid',
//         partner_id: 2,
//         premium: premium,
//         airtel_transaction_id: null
//       }
//     })

//     console.log(policy);
//   })
// }



const _checkIfPolicyExists = async (array_of_phone_numbers) => {
  try {
    array_of_phone_numbers.forEach(async (item) => {
      const { phone_number, premium } = item;
      let policy = await db.policies.findAll({
        where: {
          phone_number: `+256${phone_number}`,
          policy_status: 'paid',
          premium: premium,
          partner_id: 2
        }
      })

      if (policy.length == 0) {

        if (premium == 5000) {
          let policyNumber = `BW${phone_number}`

          let existingUser = await db.users.findOne({
            where: {
              phone_number: `${phone_number}`
            }
          })

          console.log(existingUser);
          let policyObject = {
            policy_id: uuidv4(),
            installment_type: 2,
            installment_order: 1,
            policy_type: "S MINI",
            policy_deduction_amount: 5000,
            policy_pending_premium: 55000,
            policy_next_deduction_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            sum_insured: 750000,
            premium: 5000,
            yearly_premium: 120000,
            last_expense_insured: 50000,
            policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
            policy_start_date: new Date(),
            installment_date: new Date().getMonth() + 1,
            membership_id: existingUser.membership_id,
            beneficiary: "SELF",
            policy_status: "paid",
            policy_paid_amount: 5000,
            policy_deduction_day: new Date().getDate() - 1,
            partner_id: 2,
            country_code: "UGA",
            currency_code: "UGX",
            product_id: "d18424d6-5316-4e12-9826-302b866a380c",
            user_id: existingUser.user_id,
            phone_number: `+256${phone_number}`,
            first_name: existingUser?.first_name,
            last_name: existingUser?.last_name,
            policy_number: policyNumber
          }


          await db.policies.create(policyObject);


        }

        else if (premium == 10000) {
          let policyNumber = `BW${phone_number}`

          let existingUser = await db.users.findOne({
            where: {
              phone_number: `${phone_number}`
            }
          })

          console.log(existingUser);
          let policyObject = {
            policy_id: uuidv4(),
            installment_type: 2,
            installment_order: 1,
            policy_type: "MINI",
            policy_deduction_amount: 10000,
            policy_pending_premium: 110000,
            policy_next_deduction_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            sum_insured: 1500000,
            premium: 10000,
            yearly_premium: 120000,
            last_expense_insured: 100000,
            policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
            policy_start_date: new Date(),
            installment_date: new Date().getMonth() + 1,
            membership_id: existingUser.membership_id,
            beneficiary: "SELF",
            policy_status: "paid",
            policy_paid_amount: 10000,
            policy_deduction_day: new Date().getDate() - 1,
            partner_id: 2,
            country_code: "UGA",
            currency_code: "UGX",
            product_id: "d18424d6-5316-4e12-9826-302b866a380c",
            user_id: existingUser.user_id,
            phone_number: `+256${phone_number}`,
            first_name: existingUser?.first_name,
            last_name: existingUser?.last_name,
            policy_number: policyNumber
          }


          await db.policies.create(policyObject);


        } else if (premium == 14000) {
          console.log("14,000");
          let policyNumber = `BW${phone_number}`

          let existingUser = await db.users.findOne({
            where: {
              phone_number: `${phone_number}`
            }
          })

          let policyObject = {
            policy_id: uuidv4(),
            installment_type: 2,
            installment_order: 1,
            policy_type: "MIDI",
            policy_deduction_amount: 14000,
            policy_pending_premium: 153000,
            policy_next_deduction_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            sum_insured: 3000000,
            premium: 14000,
            yearly_premium: 167000,
            last_expense_insured: 1500000,
            policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
            policy_start_date: new Date(),
            installment_date: new Date().getMonth() + 1,
            membership_id: existingUser.membership_id,
            beneficiary: "SELF",
            policy_status: "paid", // undo
            policy_paid_amount: 14000,
            policy_deduction_day: new Date().getDate() - 1,
            partner_id: 2,
            country_code: "UGA",
            currency_code: "UGX",
            product_id: "d18424d6-5316-4e12-9826-302b866a380c",
            user_id: existingUser.user_id,
            phone_number: `+256${phone_number}`,
            first_name: existingUser?.first_name,
            last_name: existingUser?.last_name,
            policy_number: policyNumber
          }
          await db.policies.create(policyObject);
        } else if (premium == 18000) {
          console.log("18,000");
          let policyNumber = `BW${phone_number}`

          let existingUser = await db.users.findOne({
            where: {
              phone_number: `${phone_number}`
            }
          })

          let policyObject = {
            policy_id: uuidv4(),
            installment_type: 2,
            installment_order: 1,
            policy_type: "BIGGIE",
            policy_deduction_amount: 18000,
            policy_pending_premium: 190000,
            policy_next_deduction_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            sum_insured: 5000000,
            premium: 18000,
            yearly_premium: 208000,
            last_expense_insured: 2000000,
            policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
            policy_start_date: new Date(),
            installment_date: new Date().getMonth() + 1,
            membership_id: existingUser.membership_id,
            beneficiary: "SELF",
            policy_status: "paid",
            policy_paid_amount: 18000,
            policy_deduction_day: new Date().getDate() - 1,
            partner_id: 2,
            country_code: "UGA",
            currency_code: "UGX",
            product_id: "d18424d6-5316-4e12-9826-302b866a380c",
            user_id: existingUser.user_id,
            phone_number: `+256${phone_number}`,
            first_name: existingUser?.first_name,
            last_name: existingUser?.last_name,
            policy_number: policyNumber
          }
          await db.policies.create(policyObject);
        }

        else {
          throw new Error("policy not found " + phone_number + " " + premium);
        }

      } else {
        console.log("policy found");
      }
    }
    )
  } catch (error) {
    console.log(error);
  }
}

// async function _updateUserNumberOfPolicies() {
//   try {
//     // Retrieve paid policies and count them per user
//     const userPoliciesCount = await db.policies.findAll({
//       attributes: [
//         'user_id',
//         [db.sequelize.fn('COUNT', 'user_id'), 'policy_count']
//       ],
//       where: {
//         policy_status: 'paid',
//       },
//       group: ['user_id'],
//     })
//     //console.log(userPoliciesCount);
//     // Iterate through each user's policy count and update the corresponding user
//     for (const data of userPoliciesCount) {
//       const user_id = data.user_id;
//       const policy_count = data.dataValues.policy_count;

//       console.log(user_id, policy_count)
//       if (user_id !== null && policy_count !== null) {
//         await updateUserPolicyCount(user_id, policy_count);
//       } else {
//         console.log("Error: Found null user_id for policy count:", policy_count);
//       }
//     }

//     console.log("User policy counts updated successfully");
//   } catch (error) {
//     console.error("Error occurred while updating user policies:", error);
//   }
// }

// async function updateUserPolicyCount(user_id, policy_count) {
//   try {
//     if (policy_count == 0 || policy_count == null || policy_count == undefined) {
//       return;
//     }
//     await db.users.update(
//       { number_of_policies: policy_count },
//       { where: { user_id } }
//     );
//     console.log(`User ${user_id} updated with policy count: ${policy_count}`);
//   } catch (error) {
//     console.error(`Error updating user ${user_id} with policy count: ${policy_count}`, error);
//   }
// }


/* check if the paid policy exists in the database
  on each policy, check if the the users table has a arr_member_number
  if the arr_member_number is not found, error code 624 is returned

*/

// async function _checkIfPolicyExistsInAAR() {
//   try {
//     const policies = await db.policies.findAll({
//       where: {
//         policy_status: 'paid',
//         policy_type: { [db.Sequelize.Op.ne]: 'S MINI' }, // Policy type is not 'S MINI'
//         policy_start_date: {
//           [Op.between]: ['2023-08-01', '2024-01-01']
//         }
//       },
//       include: [{
//         model: db.users,
//         where: {
//           // arr_member_number: null,
//           partner_id: 2
//         }
//       }]
//     });

//     for (let i = 0; i < policies.length; i++) {
//       const policy = policies[i];
//       const customer = policy.user;

//       console.log(customer.name, policy.phone_number);
//       let update_premium = await updatePremium(customer, policy);
//       console.log(update_premium);
//       // let result  = await registerPrincipal(customer, policy);
//       // console.log("register member",result);
//       // if(result.code == 608){
//       //    await getMemberNumberData(customer.phone_number);
//       //  }
//       // Introduce a delay of 1 second between each iteration
//       await new Promise(resolve => setTimeout(resolve, 2000));

//     }
//   } catch (error) {
//     console.log(error);
//   }
// }

// async function _checkIfPolicyExistsInAAR() {
//   try {
//     const policies = await db.policies.findAll({
//       where: {
//         policy_status: 'paid',
//         partner_id: 2,
//       }
//     });

//     for (let i = 0; i < policies.length; i++) {
//       const policy = policies[i];
//       const customer = await db.users.findOne({
//         where: {
//           phone_number: policy.phone_number.substring(4)
//         }
//       });

//       if (!customer.arr_member_number || policy.policy_type !== 'S MINI') {
//         console.log(policy.first_name, policy.last_name, policy.phone_number.substring(4));
//        let result  = await registerPrincipal(customer, policy);
//        console.log(result);
//        if(result.code == 608){
//           await getMemberNumberData(customer.phone_number);
//         }
//       }

//       // Introduce a delay of 1 second between each iteration
//       await new Promise(resolve => setTimeout(resolve, 2000));
//     }
//   } catch (error) {
//     console.log(error);
//   }
// }


// WITHOUT AAR MEMBER NUMBER
// select * from policies 
// join users on policies.user_id = users.user_id
// where policy_status ='paid'  
// and users.arr_member_number is null 
// and policies.policy_type = 'S MINI'  
// AND policies.partner_id =2 -- uganda

async function getaRRMemberNumberData() {
  try {
    const policies = await db.policies.findAll({
      // Policy type is 'S MINI'
      where: {
        policy_status: 'paid',
        //policy_type: { [db.Sequelize.Op.eq]: 'S MINI' },
        partner_id: 2,
        policy_start_date: {
          [Op.between]: ['2024-01-01', '2024-03-31']
        }
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
      // let result = await updatePremium(customer, policy);
      // console.log(result);

      let result  = await registerPrincipal(customer, policy);
      console.log(result);
      if(result.code == 608){
         await getMemberNumberData(customer.phone_number);
       }
      // Introduce a delay of 1 second between each iteration
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    console.log(error);
  }
}

// update polices cancelled_at to update_at that policy status cancelled
//update policies set cancelled_at = updated_at where policy_status = 'cancelled'

// async function updateCancelledAt() {
//   await db.policies.update({
//     cancelled_at: db.Sequelize.col('updatedAt')
//   }, {
//     where: {
//       policy_status: 'cancelled'
//     }
//   })
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
 // getaRRMemberNumberData()
 // policyReconciliation()

  console.log("TESTING GROUND")
}


