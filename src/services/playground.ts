const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize')
import cron from 'node-cron';
import { createDependant, fetchMemberStatusData, getMemberNumberData, reconciliation, registerDependant, registerPrincipal, updatePremium } from './aar';
import SMSMessenger from './sendSMS';
import fs from 'fs/promises';
import { db } from '../models/db';



export const sendPolicyRenewalReminder = async () => {
    try {
      const policy = await db.policies.findOne({
        where: {
          phone_number: '+256752710537',
          policy_status: 'paid',
          installment_type: 2,
          partner_id: 2,
        }
      });
      console.log(policy);

      const message =`Dear ${policy.first_name} ${policy.last_name}, your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE. Dial *185*7*6*3# to renew.`
      console.log(message);
      SMSMessenger.sendSMS(policy.phone_number, message );

    }catch (error) {
      console.log(error);
    }
  }



export const playground = async () => {


  //sendPolicyRenewalReminder()

  console.log("TESTING GROUND")
}  