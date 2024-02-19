const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize')
import cron from 'node-cron';
import { createDependant, fetchMemberStatusData, getMemberNumberData, reconciliation, registerDependant, registerPrincipal, updatePremium } from './aar';
import SMSMessenger from './sendSMS';
import fs from 'fs/promises';
import { db } from '../models/db';
import { getNewPolicies, numberAndValueOfFailedPayments } from './report';
import Queue from 'bull';
import { sendCongratulatoryMessage } from './payment';
import { v4 as uuidv4 } from 'uuid';
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

// fill in the phone numbers and the premium

const array_of_phone_numbers = [
  { phone_number: "708389895", premium: 10000 },

 



];
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

        if (premium == 10000) {
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

async function _updateUserNumberOfPolicies() {
  try {
    // Retrieve paid policies and count them per user
    const userPoliciesCount = await db.policies.findAll({
      attributes: ['user_id', [db.sequelize.fn('COUNT', 'user_id'), 'policy_count']],
      where: {
        policy_status: 'paid',
      },
      group: ['user_id'],
    });

    // Filter out any records with null user_id values
    const filteredUserPoliciesCount = userPoliciesCount.filter(record => record.user_id !== null);

    // Check if there are any null user_id values
    const nullUserIds = userPoliciesCount.filter(record => record.user_id === null);

    if (nullUserIds.length > 0) {
      console.log("Error: Found null user_ids:", nullUserIds.map(record => record.user_id));
      return; // Abort the operation if there are null user_ids
    }

    // Prepare data for bulk update
    const bulkUpdates = filteredUserPoliciesCount.map(({ user_id, policy_count }) => ({
      user_id,
      number_of_policies: policy_count,
    }));

    // Perform bulk update

    await db.users.bulkCreate(bulkUpdates, {
      updateOnDuplicate: ['number_of_policies'],
      fields: ['number_of_policies'],
    });

    console.log("Bulk update completed successfully");

  } catch (error) {
    console.log(error);
  }
}


/* check if the paid policy exists in the database
  on each policy, check if the the users table has a arr_member_number
  if the arr_member_number is not found, error code 624 is returned

*/

async function _checkIfPolicyExistsInAAR() {
  try {
    const policies = await db.policies.findAll({
      where: {
        policy_status: 'paid',
        policy_type: { [db.Sequelize.Op.ne]: 'S MINI' }, // Policy type is not 'S MINI'
        policy_start_date: {
          [Op.between]: ['2023-08-01', '2024-01-01']
        }
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
      const customer = policy.user;

      console.log(customer.name, policy.phone_number);
      let update_premium = await updatePremium(customer, policy);
      console.log(update_premium);
      // let result  = await registerPrincipal(customer, policy);
      // console.log("register member",result);
      // if(result.code == 608){
      //    await getMemberNumberData(customer.phone_number);
      //  }
     // Introduce a delay of 1 second between each iteration
     await new Promise(resolve => setTimeout(resolve, 2000));
    
    }
  } catch (error) {
    console.log(error);
  }
}

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


export const playground = async () => {

  //getNewPolicies(2, '2023-01-01', '2024-02-7')
  //numberAndValueOfFailedPayments(2, '2023-01-01', '2024-02-07')
  // sendCongratulatoryMessage(policy, user)
  // _sendPolicyRenewalReminder('757998947')
 // _checkIfPolicyExists(array_of_phone_numbers)
  //_updateUserNumberOfPolicies()
 // _checkIfPolicyExistsInAAR()

  console.log("TESTING GROUND")
}


