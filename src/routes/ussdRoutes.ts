import express from "express";
import ussdUgaMenuBuilder from "../menu-uga-builder";
import ussdKenMenuBuilder from "../menu-ken-builder"
import ussdVodacomMenuBuilder from "../menu-vodacom-builder";
import moment from "moment";

import SMSMessenger from "../services/sendSMS";
import { db } from "../models/db";
import { v4 as uuidv4 } from "uuid";
import { initiateConsent } from "../services/payment"
import { registerPrincipal, updatePremium, fetchMemberStatusData, createDependant } from "../services/aarServices"
import { calculateProrationPercentage, formatAmount, formatPhoneNumber } from "../services/utils";
import { Op } from 'sequelize';

const Transaction = db.transactions;
const Payment = db.payments;
const Policy = db.policies;
const Users = db.users;
const Beneficiary = db.beneficiaries;
const PolicySchedule = db.policy_schedules;

const router = express.Router();

const handleUSSDRequest = async (req: any, res: any, menuBuilder: any) => {
  try {
    console.log(req.body);
    const menu_res = await menuBuilder(req.body, db);
    res.send(menu_res);
  } catch (error) {
    console.log("MENU ERROR", error);
    res.status(500).send(error);
  }
};

router.post("/uga", async (req: any, res: any) => {

  await handleUSSDRequest(req, res, ussdUgaMenuBuilder);
});
router.post("/uat/uga", async (req: any, res: any) => {

  await handleUSSDRequest(req, res, ussdUgaMenuBuilder);
});

router.post("/uat/ken", async (req: any, res: any) => {

  await handleUSSDRequest(req, res, ussdKenMenuBuilder);
});

router.post("/uat/vodacom", async (req: any, res: any) => {

  await handleUSSDRequest(req, res, ussdVodacomMenuBuilder);
});

export const findTransactionById = async (transactionId) => {
  return await Transaction.findOne({
    where: {
      [db.Sequelize.Op.or]: [
        { transaction_id: transactionId },
        { transaction_reference: transactionId },
      ],

    },
  });
};



const updatePolicyDetails = async (policy, amount, payment, airtel_money_id) => {
  try {
    amount = parseInt(amount);

    policy.policy_status = "paid";
    policy.bluewave_transaction_id = payment.payment_id;
    policy.airtel_transaction_id = airtel_money_id;
    policy.policy_deduction_amount = amount;

    await policy.save();

    console.log("Policy details updated successfully");

    return policy;
  } catch (error) {
    console.error("Error updating policy details:", error);
    throw error;
  }
};

const updateInstallmentLogic = async (policy, amount) => {
  try {
      let date = new Date();
      let installment_alert_date = new Date(date.getFullYear(), date.getMonth(), policy.policy_deduction_day - 3);

      // Handle negative dates by rolling back to the previous month's end
      if (installment_alert_date.getDate() < 1) {
          installment_alert_date.setDate(0);
      }

      policy.policy_paid_date = new Date();

      if (policy.installment_type === 2) {
          policy.policy_next_deduction_date = new Date(date.getFullYear(), date.getMonth() + 1, policy.policy_deduction_day);
          policy.installment_order = policy.policy_paid_amount === amount ? 1 : parseInt(policy.installment_order) + 1;
          policy.installment_alert_date = installment_alert_date;

          // Adjust policy amounts
          if (parseInt(policy.policy_paid_amount) !== parseInt(policy.premium)) {

              policy.policy_paid_amount  = parseInt(policy.installment_order) * parseInt(policy.premium);
              policy.policy_pending_premium -= parseInt(amount);

              console.log("Updated policy:", policy.policy_pending_premium, policy.policy_paid_amount, policy.yearly_premium);
          }

          if (parseInt(policy.policy_pending_premium) + parseInt(policy.policy_paid_amount) === parseInt(policy.yearly_premium)) {
              policy.policy_pending_premium = parseInt(policy.yearly_premium) - parseInt(policy.policy_paid_amount);
          }

          console.log("Updated policy:", policy);
      } else {
          policy.policy_next_deduction_date = new Date(date.getFullYear() + 1, date.getMonth(), date.getDate());

          if (policy.installment_order === 12) {
              policy.policy_status = "expired";
          }

          console.log("Updated policy:", policy);
      }

      await policy.save();
  } catch (error) {
      console.error("Error updating installment logic:", error);
      throw error;
  }
};


const updateUserInformation = async (policy) => {
  try {
    const policyPaidCountOfUser = await db.policies.count({
      where: { user_id: policy.user_id, policy_status: "paid" }
    });

    await db.users.update({ number_of_policies: policyPaidCountOfUser }, {
      where: { user_id: policy.user_id }
    });


    console.log("User information updated successfully");

  } catch (error) {
    console.error("Error updating user information:", error);
    throw error;
  }
};


export const updateUserPolicyStatus = async (policy, amount, payment, airtel_money_id) => {
  console.log("UPDATE STATUS WAS CALLED");

  try {
    await updatePolicyDetails(policy, amount, payment, airtel_money_id);
    await updateInstallmentLogic(policy, amount);
    await updateUserInformation(policy);

    console.log("===========POLICY PAID =======", policy);

    return policy;
  } catch (error) {
    console.error("Error updating policy status:", error);
    throw error;
  }
};

// POST and GET request handler
router.all("/callback", async (req, res) => {
  try {
    if (req.method === "POST" || req.method === "GET") {
      const { transaction } = req.body;
      console.log("AIRTEL CALLBACK", transaction)
      const { id, status_code, message, airtel_money_id } = transaction;

      const transactionData = await findTransactionById(id);

      if (!transactionData) {
        console.log("Transaction not found");
        return res.status(404).json({ message: "Transaction not found" });
      }

      const { policy_id, user_id, amount, partner_id } = transactionData;

      if (status_code === "TS") {
        await transactionData.update({ status: "paid" });

        const user = await Users.findOne({ where: { user_id } });

        let policy = await db.policies.findOne({
          where: {
            policy_id,
            user_id,
          }
        });

        console.log("POLICY", policy);

        if (!policy) {
          return res.status(404).json({ message: "Policy not found" });
        }

        policy.airtel_money_id = airtel_money_id;

        const to = formatPhoneNumber(user.phone_number);
        //const period = policy.installment_type === 1 ? "yearly" : "monthly";

        const payment = await createPaymentRecord(policy, amount, user_id, policy_id, message, req.body, partner_id);
        console.log("Payment record created successfully");

        let updatedPolicy = await updateUserPolicyStatus(policy, amount, payment, airtel_money_id);
        console.log("=== PAYMENT ===", payment);
        console.log("=== UPDATED POLICY ===", updatedPolicy);

        const members = policy.total_member_number?.match(/\d+(\.\d+)?/g);
        console.log("MEMBERS", members, policy.total_member_number);


        const thisDayThisMonth = policy.installment_type === 2 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1) : new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1);


        let sum_insured = policy.sum_insured;
        let last_expense_insured = policy.last_expense_insured;

        policy.policy_status = "paid";
        policy.save();

        let congratText = generateCongratulatoryText(policy, user, members, sum_insured, last_expense_insured, thisDayThisMonth);
         await sendSMSNotification(to, congratText);

        const memberStatus = await fetchMemberStatusData({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
        await processPolicy(user, policy, memberStatus);

        return res.status(200).json({
          code: 200,
          status: "OK", message: "Payment record created successfully"
        });
      } else {
        await handleFailedPaymentRecord(amount, user_id, policy_id, message, req.body, partner_id);
        console.log("Payment record for failed transaction created");
        return res.status(200).json({
          code: 200,
          status: "OK", message: "POST/GET request handled successfully"
        });
      }
    } else {
      return res.status(405).send("Method Not Allowed");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});



const createPaymentRecord = async (policy, amount, user_id, policy_id, description, metadata, partner_id) => {
  return await Payment.create({
    payment_amount: amount,
    payment_type: `Airtel Money Uganda STK Push for ${policy.beneficiary.toUpperCase()} ${policy.policy_type.toUpperCase()} ${policy.installment_type === 1 ? "yearly" : "monthly"} payment`,
    user_id,
    policy_id,
    payment_status: "paid",
    payment_description: description,
    payment_date: new Date(),
    payment_metadata: metadata,
    partner_id,
  });
};

const calculateInsuredAmounts = (policy, proratedPercentage) => {
  const sumInsured = policy.sum_insured
  //* (proratedPercentage / 100);
  const lastExpenseInsured = policy.last_expense_insured
  //* (proratedPercentage / 100);
  return { sumInsured, lastExpenseInsured };
};

const generateCongratulatoryText = (policy, user, members, sumInsured, lastExpenseInsured, thisDayThisMonth) => {
  if (policy.beneficiary === "FAMILY") {
    return `Congratulations! You and ${members} dependent are each covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`;
  } else if (policy.beneficiary === "SELF") {
    return `Congratulations! You bought ${policy.policy_type} cover for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`;
  } else if (policy.beneficiary === "OTHER")
    return `${user.first_name} has bought for you Ddwaliro Care for Inpatient ${sumInsured} and Funeral benefit of ${lastExpenseInsured}. Dial *185*7*6# on Airtel to enter next of kin & view more details`;
}

const sendSMSNotification = async (to, congratText) => {
  await SMSMessenger.sendSMS(2, to, congratText);
};


const handleFailedPaymentRecord = async (amount, user_id, policy_id, description, metadata, partner_id) => {
  await Payment.create({
    payment_amount: amount,
    payment_type: "airtel money payment",
    user_id,
    policy_id,
    payment_status: "failed",
    payment_description: description,
    payment_date: new Date(),
    payment_metadata: metadata,
    partner_id,
  });
};




export async function processPolicy(user: any, policy: any, memberStatus: any) {

  const number_of_dependants = parseFloat(policy?.total_member_number.split("")[2]) || 0;
  console.log("Number of dependants:", number_of_dependants);

  if (memberStatus?.code === 200) {
    await db.policies.update({ arr_policy_number: memberStatus.policy_no }, { where: { policy_id: policy.policy_id } });

    console.log("AAR POLICY NUMBER UPDATED", user.phone_number, user.name, memberStatus.policy_no);

  } else {
    const registerAARUser = await registerPrincipal(user, policy);
    user.arr_member_number = registerAARUser?.member_no;
    if (number_of_dependants > 0) {
      await createDependant(user, policy);
    } else {
      console.log("AAR NUMBER- member found", user.phone_number, user.name, user.arr_member_number);
      const updatePremiumData = await updatePremium(user, policy);
      console.log("AAR UPDATE PREMIUM - member found", updatePremiumData);
    }
  }
}


// POST and GET request handler
router.all("/callback/kenya", async (req, res) => {
  try {
    if (req.method === "POST" || req.method === "GET") {
      const { transaction } = req.body;
      console.log("AIRTEL CALLBACK", transaction)
      const { id, status_code, message, airtel_money_id } = transaction;

      const transactionData = await findTransactionById(id);

      if (!transactionData) {
        console.log("Transaction not found");
        return res.status(404).json({ message: "Transaction not found" });
      }

      const { policy_id, user_id, amount, partner_id } = transactionData;

      const user = await db.users.findOne({ where: { user_id } });
      let policy = await db.policies.findOne({ where: { policy_id } });
      policy.airtel_money_id = airtel_money_id;

      if (!user || !policy) {
        return res.status(404).json({ message: "user or policy not found" });
      }


      const period = policy.installment_type == 1 ? "yearly" : "monthly";

      if (status_code == "TS") {

        await transactionData.update({
          status: "paid",
        });

        const payment = await Payment.create({
          payment_amount: amount,
          payment_type: `Airtel Money Kenya Stk Push for ${policy.beneficiary.toUpperCase()} ${policy.policy_type.toUpperCase()} ${policy.installment_type === 1 ? "yearly" : "monthly"} payment`,
          user_id,
          policy_id,
          payment_status: "paid",
          payment_description: message,
          payment_date: new Date(),
          payment_metadata: req.body,
          partner_id,
        });

        console.log("Payment record created successfully");


        let updatedPolicy = await updateUserPolicyStatus(policy, parseInt(amount), payment, airtel_money_id);

        console.log("=== PAYMENT ===", payment)
        console.log("=== TRANSACTION === ", transactionData)
        console.log("=== UPDATED POLICY ===", updatedPolicy)


        const members = policy.total_member_number?.match(/\d+(\.\d+)?/g)
        console.log("MEMBERS", members, policy.total_member_number);


        const inPatientCover = formatAmount(policy.inpatient_cover);
        const outPatientCover = formatAmount(policy.outpatient_cover);
        const maternityCover = formatAmount(policy.maternity_cover);

        const thisDayThisMonth = policy.installment_type === 2 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1) : new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1);


        let congratText = "";
        const to = `+256${user.phone_number}`;

        if (policy.beneficiary == "FAMILY") {
          congratText = `Congratulations! You and ${members} dependent are each covered for Inpatient benefit of  Kshs ${inPatientCover}  and Maternity benefit of  Kshs ${maternityCover} . Cover valid till ${thisDayThisMonth.toDateString()}`
        } else if (policy.beneficiary == "SELF") {
          if (policy.policy_type.toUpperCase() == "BAMBA") {
            congratText = `Congratulations! You are bought AfyaShua Mamba cover for Kshs 4,500/night  of hospitalisation up to a Maximum of 30 days.  Pay KShs ${policy.premium} every ${policy.policy_deduction_day} to stay covered `;

          } else if (policy.policy_type.toUpperCase() == "ZIDI") {
            congratText = ` Congratulations! You bought AfyaShua Zidi cover for Inpatient KShs ${inPatientCover} and Maternity for KShs ${maternityCover} Pay KShs ${policy.premium} every ${policy.policy_deduction_day} to stay covered`
          } else {
            congratText = `Congratulations! You bought AfyaShua Smarta cover for Inpatient ${inPatientCover} Outpatient for ${outPatientCover} and Maternity for Kshs ${maternityCover}. Pay KShs ${policy.premium} every ${policy.policy_deduction_day} to stay covered`
          }
        } else if (policy.beneficiary == "OTHER") {
          if (policy.policy_type.toUpperCase() == "BAMBA") {
            congratText = `${user.first_name} has bought for you AfyaShua cover for Kshs 4,500 per night up to a Maximum of 30 days after one day of being hospitalized.
               Dial *334*7*3# on Airtel  to enter next of kin & view more details`
          } else if (policy.policy_type.toUpperCase() == "ZIDI") {
            congratText = `${user.first_name} has bought for you AfyaShua cover for Inpatient ${inPatientCover} and Maternity benefit of ${maternityCover}. Dial *185*7*6# on Airtel to enter next of kin & view more details`

          }
        }

        await SMSMessenger.sendSMS(2, to, congratText);

        return res.status(200).json({
          code: 200,
          status: "OK",
          message: "Payment record created successfully"
        });
      } else {
        await Payment.create({
          payment_amount: amount,
          payment_type: "airtel money payment kenya",
          user_id,
          policy_id,
          payment_status: "failed",
          payment_description: message,
          payment_date: new Date(),
          payment_metadata: req.body,
          partner_id: partner_id,
        });

        console.log("Payment  for failed record created");
        return res.status(200).json({
          code: 200,
          status: "OK", message: "POST/GET request handled successfully"
        });
      }
    } else {
      return res.status(405).send("Method Not Allowed");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});





export default router;
