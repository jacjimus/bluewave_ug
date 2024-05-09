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





//transacactions_id trasaction_date phone_number  premium  name instalmmet_count
// 103444987973	06/05/2024 12:07	706250557	5,000	MARK MUGHUMA (706250557)	1
// 103443643167	06/05/2024 11:39	740196979	5,000	ESTHER NABULYA (740196979)	2
// 103442348240	06/05/2024 11:11	758478086	10,000	CHARLES OPIO (758478086)	2
// 103440103740	06/05/2024 10:23	759560238	50,000	MAKUMBI MWAMADI (759560238)	1
// 103431233318	05/05/2024 22:59 PM	755034167	10,000	LOVISA NAMULALAKA (755034167)	1
// 103430114985	05/05/2024 22:17 PM	757874017	5,000	GIMBO ALAYISA HASAHYA (757874017)	1
// 103403547971	05/05/2024 13:13 PM	756303244	5,000	DOROTHY NYACHWO (756303244)	1
// 103400610371	05/05/2024 12:03 PM	701415492	10,000	BETTY NAMBUYA (701415492)	3
// 103395481902	05/05/2024 09:57 AM	744157365	5,000	SIMON MAIDO (744157365)	1
// 103388421721	04/05/2024 23:02 PM	703245258	10,000	POSIANO NSANJA (703245258)	2
// 103369296084	04/05/2024 16:36 PM	753620052	10,000	HADIJAH NANYONGA (753620052)	2
// 103365709192	04/05/2024 15:16 PM	751060363	10,000	kakembo hassan (751060363)	6
// 103365435614	04/05/2024 15:10 PM	758356914	5,000	LAWULE NDAWUKA (758356914)	3
// 103355360361	04/05/2024 11:17 AM	704251023	10,000	KASOZI FRANCIS (704251023)	2
// 103354905841	04/05/2024 11:05 AM	752322768	10,000	NOELYNNE CANDIRU (752322768)	8
// 103248475807	1/5/2024 21:11:00 PM	741689610	5,000	MARY KYOMUGISHA (741689610)	1
// 103241710266	1/5/2024 19:33:00 PM	757660794	5,000	HILDA NABITEKO (757660794)	1
// 103241435838	1/5/2024 19:29:00 PM	750033245	10,000	PATRICK TURYASINGURA (750033245)	1
// 103240159039	1/5/2024 19:13:00 PM	753414072	25,000	PATRICK KIMERA (753414072)	3
// 103236620869	1/5/2024 18:19:00 PM	707426622	5,000	ROBERT YIGA (707426622)	1
// 103233733163	1/5/2024 17:26:00 PM	756388661	10,000	YAKUBU HASAKYA (756388661)	2
// 103233305706	1/5/2024 17:18:00 PM	700331729	5,000	CLEB BAHATI (700331729)	1
// 103227140403	1/5/2024 15:13:00 PM	742729223	5,000	AMINA NAKIBONDWE (742729223)	1
// 103224774151	1/5/2024 14:23:00 PM	741020040	5,000	SUMANI MUTEBE (741020040)	1
// 103207516930	1/5/2024 18:56:00 PM	704413122	5,000	MILLY NALUMANSI (704413122)	1
// 103199273808	30/04/2024 20:52 PM	708480320	10,000	BRIAN KAJUMBA (708480320)	1
// 103194494035	30/04/2024 19:45 PM	706646009	5,000	JULIUS SSEKYEWA (706646009)	1
// 103167939893	30/04/2024 11:41 AM	703166702	5,000	ESTHER ATYANGHA (703166702)	1
// 103167194877	30/04/2024 11:25 AM	701190117	20,000	KAYIWA IVAN (701190117)	3
const array_of_phone_numbers = [

  { transaction_id: 103444987973, transaction_date: '06/05/2024 12:07', phone_number: 706250557, premium: 5000, name: 'MARK MUGHUMA (706250557)', installment_count: 1 },
  { transaction_id: 103443643167, transaction_date: '06/05/2024 11:39', phone_number: 740196979, premium: 5000, name: 'ESTHER NABULYA (740196979)', installment_count: 2 },
  { transaction_id: 103442348240, transaction_date: '06/05/2024 11:11', phone_number: 758478086, premium: 10000, name: 'CHARLES OPIO (758478086)', installment_count: 2 },
  { transaction_id: 103440103740, transaction_date: '06/05/2024 10:23', phone_number: 759560238, premium: 50000, name: 'MAKUMBI MWAMADI (759560238)', installment_count: 1 },
  { transaction_id: 103431233318, transaction_date: '05/05/2024 22:59 PM', phone_number: 755034167, premium: 10000, name: 'LOVISA NAMULALAKA (755034167)', installment_count: 1 },
  { transaction_id: 103430114985, transaction_date: '05/05/2024 22:17 PM', phone_number: 757874017, premium: 5000, name: 'GIMBO ALAYISA HASAHYA (757874017)', installment_count: 1 },
  { transaction_id: 103403547971, transaction_date: '05/05/2024 13:13 PM', phone_number: 756303244, premium: 5000, name: 'DOROTHY NYACHWO (756303244)', installment_count: 1 },
  { transaction_id: 103400610371, transaction_date: '05/05/2024 12:03 PM', phone_number: 701415492, premium: 10000, name: 'BETTY NAMBUYA (701415492)', installment_count: 3 },
  { transaction_id: 103395481902, transaction_date: '05/05/2024 09:57 AM', phone_number: 744157365, premium: 5000, name: 'SIMON MAIDO (744157365)', installment_count: 1 },
  { transaction_id: 103388421721, transaction_date: '04/05/2024 23:02 PM', phone_number: 703245258, premium: 10000, name: 'POSIANO NSANJA (703245258)', installment_count: 2 },
  { transaction_id: 103369296084, transaction_date: '04/05/2024 16:36 PM', phone_number: 753620052, premium: 10000, name: 'HADIJAH NANYONGA (753620052)', installment_count: 2 },
  { transaction_id: 103365709192, transaction_date: '04/05/2024 15:16 PM', phone_number: 751060363, premium: 10000, name: 'kakembo hassan (751060363)', installment_count: 6 },
  { transaction_id: 103365435614, transaction_date: '04/05/2024 15:10 PM', phone_number: 758356914, premium: 5000, name: 'LAWULE NDAWUKA (758356914)', installment_count: 3 },
  { transaction_id: 103355360361, transaction_date: '04/05/2024 11:17 AM', phone_number: 704251023, premium: 10000, name: 'KASOZI FRANCIS (704251023)', installment_count: 2 },
  { transaction_id: 103354905841, transaction_date: '04/05/2024 11:05 AM', phone_number: 752322768, premium: 10000, name: 'NOELYNNE CANDIRU (752322768)', installment_count: 8 },
  { transaction_id: 103248475807, transaction_date: '1/5/2024 21:11:00 PM', phone_number: 741689610, premium: 5000, name: 'MARY KYOMUGISHA (741689610)', installment_count: 1 },
  { transaction_id: 103241710266, transaction_date: '1/5/2024 19:33:00 PM', phone_number: 757660794, premium: 5000, name: 'HILDA NABITEKO (757660794)', installment_count: 1 },
  { transaction_id: 103241435838, transaction_date: '1/5/2024 19:29:00 PM', phone_number: 750033245, premium: 10000, name: 'PATRICK TURYASINGURA (750033245)', installment_count: 1 },
  { transaction_id: 103240159039, transaction_date: '1/5/2024 19:13:00 PM', phone_number: 753414072, premium: 25000, name: 'PATRICK KIMERA (753414072)', installment_count: 3 },
  { transaction_id: 103236620869, transaction_date: '1/5/2024 18:19:00 PM', phone_number: 707426622, premium: 5000, name: 'ROBERT YIGA (707426622)', installment_count: 1 },
  { transaction_id: 103233733163, transaction_date: '1/5/2024 17:26:00 PM', phone_number: 756388661, premium: 10000, name: 'YAKUBU HASAKYA (756388661)', installment_count: 2 },
  { transaction_id: 103233305706, transaction_date: '1/5/2024 17:18:00 PM', phone_number: 700331729, premium: 5000, name: 'CLEB BAHATI (700331729)', installment_count: 1 },
  { transaction_id: 103227140403, transaction_date: '1/5/2024 15:13:00 PM', phone_number: 742729223, premium: 5000, name: 'AMINA NAKIBONDWE (742729223)', installment_count: 1 },
  { transaction_id: 103224774151, transaction_date: '1/5/2024 14:23:00 PM', phone_number: 741020040, premium: 5000, name: 'SUMANI MUTEBE (741020040)', installment_count: 1 },
  { transaction_id: 103207516930, transaction_date: '1/5/2024 18:56:00 PM', phone_number: 704413122, premium: 5000, name: 'MILLY NALUMANSI (704413122)', installment_count: 1 },
  { transaction_id: 103199273808, transaction_date: '30/04/2024 20:52 PM', phone_number: 708480320, premium: 10000, name: 'BRIAN KAJUMBA (708480320)', installment_count: 1 },
  { transaction_id: 103194494035, transaction_date: '30/04/2024 19:45 PM', phone_number: 706646009, premium: 5000, name: 'JULIUS SSEKYEWA (706646009)', installment_count: 1 },
  { transaction_id: 103167939893, transaction_date: '30/04/2024 11:41 AM', phone_number: 703166702, premium: 5000, name: 'ESTHER ATYANGHA (703166702)', installment_count: 1 },
  { transaction_id: 103167194877, transaction_date: '30/04/2024 11:25 AM', phone_number: 701190117, premium: 20000, name: 'KAYIWA IVAN (701190117)', installment_count: 3 },

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
          //result = await reconcilationCallback(paymentCallback.transaction)
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

  //'UG160223-00',
  // 'UG160264-00',
  //'UG160484-00',
  // 'UG160683-00',
  // 'UG161318-00',
  // 'UG162422-00',


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



export const playground = async () => {

  //policyReconciliation(array_of_phone_numbers)


  updateAARpolicyNumber(arr_members)

  //getDataFromSheet();
  //createARRDependants()

  //updateMembershipData()

  //updatePremiumArr(array_of_phone_numbers)
}


