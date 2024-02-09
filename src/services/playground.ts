const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize')
import cron from 'node-cron';
import { createDependant, fetchMemberStatusData, getMemberNumberData, reconciliation, registerDependant, registerPrincipal, updatePremium } from './aar';
import SMSMessenger from './sendSMS';
import fs from 'fs/promises';
import { db } from '../models/db';
import { getNewPolicies, numberAndValueOfFailedPayments } from './report';
import Queue from 'bull';

// import { google } from 'googleapis';

// const serviceAccountKeyFile = "./aitel-payment-reconciliation-abe90c6ab59e.json"
// const sheetId = '1Q4IB0vzghTIIirbGdU49UY2FPfESViXaY77oGy44J3I'
// const tabName = 'Ddwaliro Care Airtel Payments'
// const range = 'A:R'



export const sendPolicyRenewalReminder = async () => {
    try {
      const policy = await db.policies.findOne({
        where: {
          phone_number: '+256743453012',
          policy_status: 'paid',
          installment_type: 2,
          partner_id: 2,
        }
      });
      console.log(policy);

      const message =`Dear ${policy.first_name} ${policy.last_name}, your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE. Dial *185*7*6*3# to renew.`
      console.log(message);
      SMSMessenger.sendSMS(2,policy.phone_number, message );

    }catch (error) {
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
//         sender_mobile_number: row[4],
//         transaction_amount: row[6],
//         payment_status: row[13],
//         buyer_details: row[14],
//       }
//       console.log(paymentData);
//       // check if the data is in the database policy table paid

//       let policies = await db.policies.findAll({
//         where: {
//           phone_number: `+256${paymentData.sender_mobile_number}`,
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
//         //       phone_number:  `+256${paymentData.sender_mobile_number}`,
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



export const playground = async () => {

   //getNewPolicies(2, '2023-01-01', '2024-02-7')
   //numberAndValueOfFailedPayments(2, '2023-01-01', '2024-02-07')
  //sendPolicyRenewalReminder()

  console.log("TESTING GROUND")
}


