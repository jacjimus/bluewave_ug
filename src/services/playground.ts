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
  
  let arr_members =[ 
    'UG155848-05',
    'UG155848-06',
    'UG155848-07',
    'UG155848-08',
    'UG155903-03',
    'UG155903-04',
    'UG156252-00',
    'UG156253-00',
    'UG156255-00',
    'UG156256-00',
    'UG156257-00',
    'UG156259-00',
    'UG156261-00',
    'UG156262-00',
    'UG156263-00',
    'UG156264-00',
    'UG156265-00',
    'UG156267-00',
    'UG156269-00',
    'UG156270-00',
    'UG156272-00',
    'UG156273-00',
    'UG156274-00',
    'UG156275-00',
    'UG156276-00',
    'UG156277-00',
    'UG156278-00',
    'UG156279-00',
    'UG156280-00',
    'UG156281-00',
    'UG156282-00',
    'UG156283-00',
    'UG156284-00',
    'UG156285-00',
    'UG156285-01',
    'UG156286-00',
    'UG156286-01',
    'UG156287-00',
    'UG156288-00',
    'UG156288-01',
    'UG156288-02',
    'UG156293-00',
    'UG156293-01',
    'UG156293-02',
    'UG156294-00',
    'UG155821-00',
    'UG155822-00',
    'UG155823-00',
    'UG155824-00',
    'UG155825-00',
    'UG155826-00',
    'UG155827-00',
    'UG155828-00',
    'UG155829-00',
    'UG155830-00',
    'UG155831-00',
    'UG155832-00',
    'UG155833-00',
    'UG155834-00',
    'UG155835-00',
    'UG155836-00',
    'UG155837-00',
    'UG155838-00',
    'UG155839-00',
    'UG155840-00',
    'UG155841-00',
    'UG155842-00',
    'UG155843-00',
    'UG155844-00',
    'UG155845-00',
    'UG155846-00',
    'UG155847-00',
    'UG155848-00',
    'UG155849-00',
    'UG155850-00',
    'UG155851-00',
    'UG155852-00',
    'UG155853-00',
    'UG155854-00',
    'UG155855-00',
    'UG155857-00',
    'UG155858-00',
    'UG155859-00',
    'UG155860-00',
    'UG155861-00',
    'UG155862-00',
    'UG155863-00',
    'UG155864-00',
    'UG155865-00',
    'UG155866-00',
    'UG155867-00',
    'UG155868-00',
    'UG155869-00',
    'UG155870-00',
    'UG155871-00',
    'UG155872-00',
    'UG155873-00',
    'UG155874-00',
    'UG155875-00',
    'UG155876-00',
    'UG155877-00',
    'UG155878-00',
    'UG155879-00',
    'UG155880-00',
    'UG155881-00',
    'UG155883-00',
    'UG155885-00',
    'UG155886-00',
    'UG155887-00',
    'UG155888-00',
    'UG155889-00',
    'UG155890-00',
    'UG155891-00',
    'UG155892-00',
    'UG155893-00',
    'UG155894-00',
    'UG155895-00',
    'UG155896-00',
    'UG155897-00',
    'UG155898-00',
    'UG155899-00',
    'UG155900-00',
    'UG155901-00',
    'UG155902-00',
    'UG155903-00',
    'UG155904-00',
    'UG155905-00',
    'UG155906-00',
    'UG155907-00',
    'UG155908-00',
    'UG155909-00',
    'UG155910-00',
    'UG155911-00',
    'UG155912-00',
    'UG155913-00',
    'UG155914-00',
    'UG155915-00',
    'UG155916-00',
    'UG155917-00',
    'UG155918-00',
    'UG155919-00',
    'UG155920-00',
    'UG155921-00',
    'UG155922-00',
    'UG155923-00',
    'UG155924-00',
    'UG155925-00',
    'UG155926-00',
    'UG155927-00',
    'UG155928-00',
    'UG155929-00',
    'UG155930-00',
    'UG155931-00',
    'UG155932-00',
    'UG155933-00',
    'UG155934-00',
    'UG155936-00',
    'UG155937-00',
    'UG155938-00',
    'UG155939-00',
    'UG155940-00',
    'UG155941-00',
    'UG155951-00',
    'UG155952-00',
    'UG155955-00',
    'UG155972-00',
    'UG155974-00',
    'UG155975-00',
    'UG155976-00',
    'UG155977-00',
    'UG155978-00',
    'UG155979-00',
    'UG155980-00',
    'UG155981-00',
    'UG155982-00',
    'UG155983-00',
    'UG155984-00',
    'UG155985-00',
    'UG155986-00',
    'UG155987-00',
    'UG155988-00',
    'UG155989-00',
    'UG155990-00',
    'UG155991-00',
    'UG155992-00',
    'UG155993-00',
    'UG155994-00',
    'UG155995-00',
    'UG155996-00',
    'UG155997-00',
    'UG155998-00',
    'UG155999-00',
    'UG156000-00',
    'UG156001-00',
    'UG156002-00',
    'UG156003-00',
    'UG156004-00',
    'UG156006-00',
    'UG156007-00',
    'UG156008-00',
    'UG156009-00',
    'UG156010-00',
    'UG156011-00',
    'UG156013-00',
    'UG156014-00',
    'UG156015-00',
    'UG156016-00',
    'UG156017-00',
    'UG156018-00',
    'UG156019-00',
    'UG156020-00',
    'UG156021-00',
    'UG156023-00',
    'UG156024-00',
    'UG156025-00',
    'UG156026-00',
    'UG156027-00',
    'UG156028-00',
    'UG156029-00',
    'UG156030-00',
    'UG156031-00',
    'UG156032-00',
    'UG156033-00',
    'UG156034-00',
    'UG156035-00',
    'UG156036-00',
    'UG156037-00',
    'UG156038-00',
    'UG156039-00',
    'UG156040-00',
    'UG156041-00',
    'UG156042-00',
    'UG156043-00',
    'UG156044-00',
    'UG156045-00',
    'UG156046-00',
    'UG156047-00',
    'UG156048-00',
    'UG156049-00',
    'UG156050-00',
    'UG156051-00',
    'UG156053-00',
    'UG156055-00',
    'UG156056-00',
    'UG156057-00',
    'UG156058-00',
    'UG156059-00',
    'UG156060-00',
    'UG156061-00',
    'UG156062-00',
    'UG156063-00',
    'UG156064-00',
    'UG156065-00',
    'UG156066-00',
    'UG156067-00',
    'UG156068-00',
    'UG156069-00',
    'UG156070-00',
    'UG156071-00',
    'UG156072-00',
    'UG156073-00',
    'UG156074-00',
    'UG156076-00',
    'UG156077-00',
    'UG156078-00',
    'UG156079-00',
    'UG156081-00',
    'UG156082-00',
    'UG156083-00',
    'UG156084-00',
    'UG156085-00',
    'UG156086-00',
    'UG156087-00',
    'UG156088-00',
    'UG156089-00',
    'UG156090-00',
    'UG156091-00',
    'UG156092-00',
    'UG156093-00',
    'UG156095-00',
    'UG156096-00',
    'UG156097-00',
    'UG156098-00',
    'UG156099-00',
    'UG156100-00',
    'UG156101-00',
    'UG156102-00',
    'UG156103-00',
    'UG156104-00',
    'UG156105-00',
    'UG156106-00',
    'UG156107-00',
    'UG156108-00',
    'UG155848-01',
    'UG155848-02',
    'UG155848-03',
    'UG155848-04',
    'UG155857-01',
    'UG155863-01',
    'UG155863-02',
    'UG155872-01',
    'UG155903-01',
    'UG155903-02',
    'UG155916-01',
    'UG155916-02',
    'UG155916-03',
    'UG155919-01',
    'UG155919-02',
    'UG155919-03',
    'UG155919-04',
    'UG155919-05',
    'UG155919-06',
    'UG155955-01',
    'UG156122-00',
    'UG156129-00',
    'UG156129-01',
    'UG156129-02',
    'UG156132-00',
    'UG156134-00',
    'UG156134-01',
    'UG156148-00',
    'UG156149-01',
    'UG156149-02',
    'UG156150-00',
    'UG156150-01',
    'UG156150-02',
    'UG156151-00',
    'UG156151-01',
    'UG156151-02',
    'UG156152-01',
    'UG156152-02',
    'UG156152-03',
    'UG156159-00',
    'UG156174-00',
    'UG156176-00',
    'UG156177-00',
    'UG156178-00',
    'UG156178-01',
    'UG156179-00',
    'UG156179-01',
    'UG156180-00',
    'UG156180-01',
    'UG156180-02',
    'UG156180-03',
    'UG156180-04',
    'UG156180-05',
    'UG156187-00',
    'UG156188-00',
    'UG156188-01',
    'UG156188-02',
    'UG156189-00',
    'UG156190-01',
    'UG156224-00',
    'UG156224-01',
    'UG156225-00',
    'UG156225-01',
    'UG156225-02',
    'UG156225-03',
    'UG156225-04',
    'UG156225-05',
    'UG156225-06',
    'UG156226-00',
    'UG156227-00',
    'UG156232-00',
    'UG156232-01',
    'UG156233-00',
    'UG156234-00',
    'UG156645-00',
    'UG156645-01',
    'UG156645-02',
    'UG156669-00',
    'UG156670-00',
    'UG156671-00',
    'UG156672-00',
    'UG156673-00',
    'UG156674-00',
    'UG156675-00',
    'UG156676-00',
    'UG156677-00',
    'UG156678-00',
    'UG156679-00',
    'UG156680-00',
    'UG156682-00',
    'UG156683-00',
    'UG156684-00',
    'UG156685-00',
    'UG156686-00',
    'UG156687-00',
    'UG156689-00',
    'UG156690-00',
    'UG156691-00',
    'UG156692-00',
    'UG156693-00',
    'UG156694-00',
    'UG156695-00',
    'UG156696-00',
    'UG156697-00',
    'UG156698-00',
    'UG156699-00',
    'UG156700-00',
    'UG156701-00',
    'UG156702-00',
    'UG156703-00',
    'UG156704-00',
    'UG156705-00',
    'UG156706-00',
    'UG156707-00',
    'UG156708-00',
    'UG156709-00',
    'UG156710-00',
    'UG156711-00',
    'UG156712-00',
    'UG156713-00',
    'UG156716-00',
    'UG156717-00',
    'UG156718-00',
    'UG156719-00',
    'UG156720-00',
    'UG156721-00',
    'UG156722-00',
    'UG156723-00',
    'UG156724-00',
    'UG156725-00',
    'UG156726-00',
    'UG156727-00',
    'UG156728-00',
    'UG156729-00',
    'UG156730-00',
    'UG156731-00',
    'UG156732-00',
    'UG156733-00',
    'UG156734-00',
    'UG156735-00',
    'UG156736-00',
    'UG156737-00',
    'UG156738-00',
    'UG156739-00',
    'UG156740-00',
    'UG156741-00',
    'UG156742-00',
    'UG156743-00',
    'UG156744-00',
    'UG156745-00',
    'UG156746-00',
    'UG156747-00',
    'UG156748-00',
    'UG156749-00',
    'UG156750-00',
    'UG156751-00',
    'UG156752-00',
    'UG156753-00',
    'UG156754-00',
    'UG156755-00',
    'UG156756-00',
    'UG156757-00',
    'UG156758-00',
    'UG156759-00',
    'UG156760-00',
    'UG156761-00',
    'UG156762-00',
    'UG156763-00',
    'UG156764-00',
    'UG156765-00',
    'UG156766-00',
    'UG156767-00',
    'UG156768-00',
    'UG156769-00',
    'UG156770-00',
    'UG156771-00',
    'UG156772-00',
    'UG156773-00',
    'UG156774-00',
    'UG156775-00',
    'UG156776-00',
    'UG156777-00',
    'UG156778-00',
    'UG156779-00',
    'UG156780-00',
    'UG156781-00',
    'UG156782-00',
    'UG156783-00',
    'UG156784-00',
    'UG156785-00',
    'UG156786-00',
    'UG156787-00',
    'UG156788-00',
    'UG156789-00',
    'UG156790-00',
    'UG156791-00',
    'UG156792-00',
    'UG156793-00',
    'UG156794-00',
    'UG156795-00',
    'UG156796-00',
    'UG156797-00',
    'UG156798-00',
    'UG156799-00',
    'UG156800-00',
    'UG156801-00',
    'UG156802-00',
    'UG156803-00',
    'UG156804-00',
    'UG156805-00',
    'UG156806-00',
    'UG156807-00',
    'UG156808-00',
    'UG156809-00',
    'UG156810-00',
    'UG156811-00',
    'UG156812-00',
    'UG156813-00',
    'UG156814-00',
    'UG156815-00',
    'UG156816-00',
    'UG156817-00',
    'UG156818-00',
    'UG156819-00',
    'UG156820-00',
    'UG156821-00',
    'UG156822-00',
    'UG156823-00',
    'UG156824-00',
    'UG156825-00',
    'UG156826-00',
    'UG156827-00',
    'UG156828-00',
    'UG156829-00',
    'UG156830-00',
    'UG156831-00',
    'UG156832-00',
    'UG156833-00',
    'UG156834-00',
    'UG156835-00',
    'UG156837-00',
    'UG156838-00',
    'UG156839-00',
    'UG156840-00',
    'UG156841-00',
    'UG156842-00',
    'UG156843-00',
    'UG156844-00',
    'UG156845-00',
    'UG156847-00',
    'UG156848-00',
    'UG156849-00',
    'UG156850-00',
    'UG156851-00',
    'UG156852-00',
    'UG156853-00',
    'UG156854-00',
    'UG156855-00',
    'UG156856-00',
    'UG156857-00',
    'UG156858-00',
    'UG156859-00',
    'UG156860-00',
    'UG156861-00',
    'UG156862-00',
    'UG156863-00',
    'UG156864-00',
    'UG156865-00',
    'UG156866-00',
    'UG156867-00',
    'UG156868-00',
    'UG156869-00',
    'UG156870-00',
    'UG156871-00',
    'UG156872-00',
    'UG156873-00',
    'UG156874-00',
    'UG156875-00',
    'UG156876-00',
    'UG156877-00',
    'UG156880-00',
    'UG156881-00',
    'UG156882-00',
    'UG156884-00',
    'UG156885-00',
    'UG156886-00',
    'UG156887-00',
    'UG156888-00',
    'UG156889-00',
    'UG156890-00',
    'UG156891-00',
    'UG156892-00',
    'UG156893-00',
    'UG156894-00',
    'UG156895-00',
    'UG156896-00',
    'UG156897-00',
    'UG156898-00',
    'UG156899-00',
    'UG156900-00',
    'UG156901-00',
    'UG156902-00',
    'UG156903-00',
    'UG156904-00',
    'UG156905-00',
    'UG156906-00',
    'UG156907-00',
    'UG156908-00',
    'UG156909-00',
    'UG156910-00',
    'UG156911-00',
    'UG156912-00',
    'UG156913-00',
    'UG156914-00',
    'UG156915-00',
    'UG156916-00',
    'UG156917-00',
    'UG156918-00',
    'UG156920-00',
    'UG156921-00',
    'UG156922-00',
    'UG156923-00',
    'UG156924-00',
    'UG156925-00',
    'UG156926-00',
    'UG156927-00',
    'UG156928-00',
    'UG156929-00',
    'UG156930-00',
    'UG156931-00',
    'UG156932-00',
    'UG156933-00',
    'UG156934-00',
    'UG156935-00',
    'UG156936-00',
    'UG156937-00',
    'UG156938-00',
    'UG156939-00',
    'UG156940-00',
    'UG156941-00',
    'UG156942-00',
    'UG156943-00',
    'UG156944-00',
    'UG156945-00',
    'UG156946-00',
    'UG156947-00',
    'UG156948-00',
    'UG156949-00',
    'UG156950-00',
    'UG156951-00',
    'UG156952-00',
    'UG156953-00',
    'UG156954-00',
    'UG156955-00',
    'UG156956-00',
    'UG156957-00',
    'UG156959-00',
    'UG156960-00',
    'UG156961-00',
    'UG156962-00',
    'UG156964-00',
    'UG156965-00',
    'UG156966-00',
    'UG156967-00',
    'UG156968-00',
    'UG156969-00',
    'UG156970-00',
    'UG156971-00',
    'UG156972-00',
    'UG156974-00',
    'UG156975-00',
    'UG156976-00',
    'UG156977-00',
    'UG156978-00',
    'UG156979-00',
    'UG156980-00',
    'UG156981-00',
    'UG156982-00',
    'UG156983-00',
    'UG156984-00',
    'UG156985-00',
    'UG156986-00',
    'UG156987-00',
    'UG156988-00',
    'UG156989-00',
    'UG156990-00',
    'UG156991-00',
    'UG156992-00',
    'UG156993-00',
    'UG156994-00',
    'UG156995-00',
    'UG156996-00',
    'UG156997-00',
    'UG156998-00',
    'UG157000-00',
    'UG157001-00',
    'UG157002-00',
    'UG157003-00',
    'UG157004-00',
    'UG157005-00',
    'UG157006-00',
    'UG157007-00',
    'UG157008-00',
    'UG157009-00',
    'UG157010-00',
    'UG157011-00',
    'UG157012-00',
    'UG157013-00',
    'UG157014-00',
    'UG157015-00',
    'UG157016-00',
    'UG157017-00',
    'UG157018-00',
    'UG157019-00',
    'UG157020-00',
    'UG157021-00',
    'UG157022-00',
    'UG157023-00',
    'UG157024-00',
    'UG157025-00',
    'UG157026-00',
    'UG157027-00',
    'UG157028-00',
    'UG157029-00',
    'UG157030-00',
    'UG157031-00',
    'UG157032-00',
    'UG157033-00',
    'UG157034-00',
    'UG157035-00',
    'UG157036-00',
    'UG157037-00',
    'UG157038-00',
    'UG157039-00',
    'UG157040-00',
    'UG157041-00',
    'UG157042-00',
    'UG157043-00',
    'UG157044-00',
    'UG157045-00',
    'UG157046-00',
    'UG157047-00',
    'UG157048-00',
    'UG157050-00',
    'UG157051-00',
    'UG157052-00',
    'UG157053-00',
    'UG157054-00',
    'UG157055-00',
    'UG157056-00',
    'UG157057-00',
    'UG157058-00',
    'UG157059-00',
    'UG157060-00',
    'UG157061-00',
    'UG157062-00',
    'UG157063-00',
    'UG157064-00',
    'UG157065-00',
    'UG157067-00',
    'UG157068-00',
    'UG157069-00',
    'UG157070-00',
    'UG157071-00',
    'UG157072-00',
    'UG157074-00',
    'UG157075-00',
    'UG157076-00',
    'UG157077-00',
    'UG157078-00',
    'UG157079-00',
    'UG157080-00',
    'UG157081-00',
    'UG157082-00',
    'UG157083-00',
    'UG157084-00',
    'UG157085-00',
    'UG157086-00',
    'UG157087-00',
    'UG157088-00',
    'UG157089-00',
    'UG157090-00',
    'UG157091-00',
    'UG157092-00',
    'UG157093-00',
    'UG157094-00',
    'UG157095-00',
    'UG157096-00',
    'UG157097-00',
    'UG157098-00',
    'UG157099-00',
    'UG157100-00',
    'UG157102-00',
    'UG157104-00',
    'UG157105-00',
    'UG157106-00',
    'UG157107-00',
    'UG157108-00',
    'UG157109-00',
    'UG157110-00',
    'UG157111-00',
    'UG157112-00',
    'UG157113-00',
    'UG157114-00',
    'UG157115-00',
    'UG157117-00',
    'UG157118-00',
    'UG157119-00',
    'UG157120-00',
    'UG157121-00',
    'UG157122-00',
    'UG157123-00',
    'UG157124-00',
    'UG157125-00',
    'UG157126-00',
    'UG157127-00',
    'UG157128-00',
    'UG157129-00',
    'UG157130-00',
    'UG157131-00',
    'UG157132-00',
    'UG157133-00',
    'UG157134-00',
    'UG157135-00',
    'UG157136-00',
    'UG157137-00',
    'UG157138-00',
    'UG157139-00',
    'UG157140-00',
    'UG157141-00',
    'UG157142-00',
    'UG157143-00',
    'UG157144-00',
    'UG157147-00',
    'UG157148-00',
    'UG157149-00',
    'UG157150-00',
    'UG157151-00',
    'UG157152-00',
    'UG157153-00',
    'UG157154-00',
    'UG157155-00',
    'UG157156-00',
    'UG157157-00',
    'UG157158-00',
    'UG157159-00',
    'UG157160-00',
    'UG157161-00',
    'UG157164-00',
    'UG157164-01',
    'UG157165-00',
    'UG157169-00',
    'UG157170-00',
    'UG157171-00',
    'UG157172-00',
    'UG157173-00',
    'UG157174-00',
    'UG157175-00',
    'UG157176-00',
    'UG157177-00',
    'UG157178-00',
    'UG157179-00',
    'UG157180-00',
    'UG157181-00',
    'UG157182-00',
    'UG157183-00',
    'UG157184-00',
    'UG157199-00',
    'UG157200-00',
    'UG157201-00',
    'UG157215-00',
    'UG157216-00',
    'UG157217-00',
    'UG157218-00',
    'UG157245-00',
    'UG157245-01',
    'UG157245-02',
    'UG157245-03',
    'UG157245-04',
    'UG157245-05',
    'UG157245-06',
    'UG157265-00',
    'UG157266-00',
    'UG157267-00',
    'UG157268-00',
    'UG157269-00',
    'UG157285-01',
    'UG157290-01',
    'UG157290-02',
    'UG157290-03',
    'UG157290-04',
    'UG157290-05',
    'UG157290-06',
    'UG157318-00',
    'UG157319-00',
    'UG157320-00',
    'UG157321-00',
    'UG157344-01',
    'UG157375-01',
    'UG157375-02',
    'UG157483-01',
    'UG157504-00',
    'UG157505-00',
    'UG157513-00',
    'UG157514-00',
    'UG157519-01',
    'UG157520-00',
    'UG157531-01',
    'UG157533-00',
    'UG157533-01',
    'UG157533-02',
    'UG157533-03',
    'UG157547-00',
    'UG157548-00',
    'UG157551-00',
    'UG157552-00',
    'UG157555-00',
    'UG157556-00',
    'UG157557-00',
    'UG157558-00',
    'UG157559-00',
    'UG157560-00',
    'UG157561-00',
    'UG157562-00',
    'UG157563-00',
    'UG157564-00',
    'UG157565-00',
    'UG157566-00',
    'UG157567-00',
    'UG157568-00',
    'UG157569-00',
    'UG157601-00',
    'UG157602-00',
    'UG157603-00',
    'UG157604-00',
    'UG157605-00',
    'UG157609-00',
    'UG157905-00',
    'UG157906-00',
    'UG157942-00',
    'UG157956-00',
    'UG157979-00',
    'UG157980-00',
    'UG157981-00',
    'UG158006-00',
    'UG158007-00',
    'UG158022-00',
    'UG158306-00',
    'UG159809-00',
    'UG159812-00',
    'UG159813-00',
    'UG162725-00',
    'UG189098-00',
    'UG189099-00',
    'UG189132-00',
    'UG189133-00',
    'UG189134-00',
    'UG189135-00',


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
async function updateAARpolicyNumber(arr_members) {
  try {
    // Find all paid policies without a policy number for a specific partner

    arr_members.forEach(async (arr_member_number) => {

      console.log(convertToStandardFormat(arr_member_number))

      const user = await db.users.findOne({
        where: {
          arr_member_number: convertToStandardFormat(arr_member_number),
          partner_id: 2
        }
      });

      if (!user) {
        console.log("User not found", arr_member_number)
        return;
      }
    
    const policy = await db.policies.findOne({
      where: {
        partner_id: 2,
        policy_status: "paid",
        user_id: user.user_id
      },
    });

    await  updateAirtelMoneyId(user.arr_member_number, (user.membership_id).toString(), policy.airtel_money_id)
  })
  } catch (error) { 
    console.log(error)
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


