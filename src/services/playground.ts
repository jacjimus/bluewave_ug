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
import axios from "axios";
import authTokenByPartner from './authorization';
import { createUserIfNotExists } from './getAirtelUserKyc';
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


let no_renewal_policies = [
  // "UG155285-01",
  // "UG155943-07",
  // "UG155943-08",
  // "UG155943-09",
  // "UG155943-10",
  // "UG155943-11",
  // "UG155943-12",
  // "UG155950-02",
  // "UG155953-02",
  // "UG155962-03",
  // "UG155962-04",
  // "UG157221-00",
  // "UG157222-00",
  // "UG157223-00",
  // "UG157224-00",
  // "UG157225-00",
  // "UG157226-00",
  // "UG157227-00",
  // "UG157228-00",
  // "UG157230-00",
  // "UG157231-00",
  // "UG157232-00",
  // "UG157233-00",
  // "UG157234-00",
  // "UG157235-00",
  // "UG157236-00",
  // "UG157237-00",
  // "UG157245-00",
  // "UG157245-01",
  // "UG157245-02",
  // "UG157245-03",
  // "UG157245-04",
  // "UG157245-05",
  // "UG157245-06",
  // "UG157246-00",
  // "UG157247-00",
  // "UG157248-00",
  // "UG157249-00",
  // "UG157250-00",
  // "UG157263-00",
  // "UG157270-00",
  // "UG157271-00",
  // "UG157272-00",
  // "UG157284-00",
  // "UG157285-00",
  // "UG157285-01",
  // "UG157286-00",
  // "UG157287-00",
  // "UG157288-00",
  // "UG157289-00",
  // "UG157290-00",
  // "UG157290-01",
  // "UG157290-02",
  // "UG157290-03",
  // "UG157290-04",
  // "UG157290-05",
  // "UG157290-06",
  // "UG157291-00",
  // "UG157292-00",
  // "UG157293-00",
  // "UG157294-00",
  // "UG157297-00",
  // "UG157301-00",
  // "UG157302-00",
  // "UG157303-00",
  // "UG157304-00",
  // "UG157308-00",
  // "UG157309-00",
  // "UG157310-00",
  // "UG157311-00",
  // "UG157312-00",
  // "UG157313-00",
  // "UG157315-00",
  // "UG157316-00",
  // "UG157317-00",
  // "UG157322-00",
  // "UG157323-00",
  // "UG157324-00",
  // "UG157325-00",
  // "UG157326-00",
  // "UG157327-00",
  // "UG157328-00",
  // "UG157329-00",
  // "UG157330-00",
  // "UG157331-00",
  // "UG157332-00",
  // "UG157333-00",
  // "UG157335-00",
  // "UG157337-00",
  // "UG157341-01",
  // "UG157342-00",
  // "UG157343-00",
  // "UG157344-00",
  // "UG157344-01",
  // "UG157345-00",
  // "UG157346-00",
  // "UG157347-00",
  // "UG157348-00",
  // "UG157349-00",
  // "UG157350-00",
  // "UG157351-00",
  // "UG157352-00",
  // "UG157353-00",
  // "UG157354-00",
  // "UG157355-00",
  // "UG157356-00",
  // "UG157357-00",
  // "UG157358-00",
  // "UG157359-00",
  // "UG157360-00",
  // "UG157362-00",
  // "UG157363-00",
  // "UG157365-00",
  // "UG157366-00",
  // "UG157367-00",
  // "UG157368-00",
  // "UG157369-00",
  // "UG157370-00",
  // "UG157371-00",
  // "UG157372-00",
  // "UG157373-00",
  // "UG157374-00",
  // "UG157375-00",
  // "UG157375-01",
  // "UG157375-02",
  // "UG157376-00",
  // "UG157382-00",
  // "UG157384-00",
  // "UG157385-00",
  // "UG157386-00",
  // "UG157390-00",
  // "UG157391-00",
  // "UG157392-00",
  // "UG157393-00",
  // "UG157394-00",
  // "UG157395-00",
  // "UG157396-00",
  // "UG157397-00",
  // "UG157401-00",
  // "UG157402-00",
  // "UG157404-00",
  // "UG157406-00",
  // "UG157407-00",
  // "UG157408-00",
  // "UG157409-00",
  // "UG157410-00",
  // "UG157411-00",
  // "UG157412-00",
  // "UG157413-00",
  // "UG157417-00",
  // "UG157418-00",
  // "UG157419-00",
  // "UG157420-00",
  // "UG157421-00",
  // "UG157422-00",
  // "UG157423-00",
  // "UG157424-00",
  // "UG157426-00",
  // "UG157427-00",
  // "UG157428-00",
  // "UG157429-00",
  // "UG157430-00",
  // "UG157458-00",
  // "UG157460-00",
  // "UG157461-00",
  // "UG157462-00",
  // "UG157471-00",
  // "UG157472-00",
  // "UG157473-00",
  // "UG157474-00",
  // "UG157475-00",
  // "UG157476-00",
  // "UG157477-00",
  // "UG157478-00",
  // "UG157479-00",
  // "UG157480-00",
  // "UG157483-00",
  // "UG157483-01",
  // "UG157487-00",
  // "UG157488-00",
  // "UG157489-00",
  // "UG157490-00",
  // "UG157491-00",
  // "UG157492-00",
  // "UG157493-00",
  // "UG157494-00",
  // "UG157495-00",
  // "UG157496-00",
  // "UG157497-00",
  // "UG157498-00",
  // "UG157499-00",
  // "UG157500-01",
  // "UG157502-00",
  // "UG157503-00",
  // "UG157506-00",
  // "UG157507-00",
  // "UG157508-00",
  // "UG157509-00",
  // "UG157510-00",
  // "UG157511-00",
  // "UG157512-00",
  // "UG157515-00",
  // "UG157516-00",
  // "UG157517-00",
  // "UG157519-00",
  // "UG157519-01",
  // "UG157521-00",
  // "UG157522-00",
  // "UG157523-00",
  // "UG157524-00",
  // "UG157525-00",
  // "UG157526-00",
  // "UG157527-00",
  // "UG157528-00",
  // "UG157530-00",
  // "UG157531-00",
  // "UG157531-01",
  // "UG157533-00",
  // "UG157533-01",
  // "UG157533-02",
  // "UG157533-03",
  // "UG157534-00",
  // "UG157535-00",
  // "UG157537-00",
  // "UG157539-00",
  // "UG157542-00",
  // "UG157543-00",
  // "UG157544-00",
  // "UG157545-00",
  // "UG157546-00",
  // "UG157549-00",
  // "UG157550-00",
  // "UG157553-00",
  // "UG157554-00",
  // "UG157570-00",
  // "UG157571-00",
  // "UG157572-00",
  // "UG157573-00",
  // "UG157574-00",
  // "UG157575-00",
  // "UG157576-00",
  // "UG157577-00",
  // "UG157579-00",
  // "UG157580-00",
  // "UG157581-00",
  // "UG157583-00",
  // "UG157584-00",
  // "UG157586-00",
  // "UG157587-00",
  // "UG157588-00",
  // "UG157589-00",
  // "UG157591-00",
  // "UG157592-00",
  // "UG157593-00",
  // "UG157594-00",
  // "UG157598-00",
  // "UG157601-00",
  // "UG157607-00",
  // "UG158305-01",
  // "UG158305-02",
  // "UG158306-00",
  // "UG159639-00",
  // "UG159806-00",
  // "UG159807-00",
  // "UG159808-00",
  // "UG159809-00",
  // "UG159810-00",
  // "UG159811-00",
  // "UG159812-00",
  // "UG159813-00",
  // "UG159816-00",
  // "UG159817-00",
  // "UG159818-00",
  // "UG159820-00",
  // "UG159821-00",
  // "UG159822-00",
  // "UG159823-00",
  // "UG159824-00",
  // "UG159825-00",
  // "UG159826-00",
  // "UG160369-00",
  "UG160370-00",
  "UG160371-00",
  "UG160372-00",
  "UG160373-00",
  "UG160378-00",
  "UG160380-00",
  "UG160386-00",
  "UG160390-00",
  "UG160391-00",
  "UG160397-00",
  "UG160402-00",
  "UG160404-00",
  "UG160407-00",
  "UG160408-00",
  "UG160409-00",
  "UG160410-00",
  "UG160411-00",
  "UG160412-00",
  "UG160413-00",
  "UG160414-00",
  "UG160415-00",
  "UG160416-00",
  "UG160417-00",
  "UG160418-00",
  "UG160419-00",
  "UG160420-00",
  "UG160421-00",
  "UG160461-00",
  "UG160467-00",
  "UG161111-00",
  "UG161115-00",
  "UG161116-00",
  "UG161145-00",
  "UG161146-00",
  "UG161149-00",
  "UG161152-00",
  "UG161153-00",
  "UG161154-00",
  "UG161177-00",
  "UG161182-00",
  "UG161191-00",
  "UG161194-00",
  "UG161203-00",
  "UG161594-00",
  "UG161595-00",
  "UG161596-00",
  "UG161597-00",
  "UG161598-00",
  "UG161599-00",
  "UG161600-00",
  "UG161601-00",
  "UG161602-00",
  "UG161603-00",
  "UG161640-00",
  "UG162293-00",
]
// updating premium on aar 
 async function updatePremiumArr(policies) {
  try {
    // Assuming you're constructing a query object for some ORM or database library

// Function to convert the member number to end with '-00' if it doesn't already
function convertToStandardFormat(memberNumber) {
  if (memberNumber.endsWith('-00')) {
      return memberNumber; // No conversion needed
  } else {
      return memberNumber.replace(/-\d{2}$/, '-00'); // Replace the last two digits with '00'
  }
}



    policies.forEach(async (arr_member_number) => {
      console.log("arr_member_number", arr_member_number)
    const policies = await db.policies.findAll({
      where: {
        policy_status: 'paid',
        partner_id: 2,
       // policy_type: 'S MINI',
      //  beneficiary: 'FAMILY',
      //  installment_order: 3,
      //  arr_policy_number: {
      //     [Op.ne]: null
      //   },
      //   policy_start_date: {
      //     [Op.between]: ['2023-10-01', '2024-04-15']
      //   },
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
      // Introduce a delay of 1 second between each iteration
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

  } )

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
  // check_if_phone_number_has_paid_poicy(array_of_phone_numbers_to_check_paid_policies)
  //findDuplicatePhoneNumbers(array_of_phone_numbers_to_check_paid_policies)
// policyReconciliation()
//getArrMemberNumberData()

 // await getAirtelUser('2567041036460', 2)
 //updatePremiumArr(no_renewal_policies)
}


