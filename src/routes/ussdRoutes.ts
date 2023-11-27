import express from "express";
import ussdUgaMenuBuilder from "../menu-builder";
import ussdKenMenuBuilder from "../menu-ken-builder"

import SMSMessenger from "../services/sendSMS";
import { db } from "../models/db";
import { v4 as uuidv4 } from "uuid";
import { initiateConsent } from "../services/payment"
import { registerPrincipal, updatePremium, fetchMemberStatusData, createDependant } from "../services/aar"
import { formatAmount } from "../services/utils";

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

const findTransactionById = async (transactionId) => {
  return await Transaction.findOne({
    where: {
      transaction_reference: transactionId,
    },
  });
};

const updateUserPolicyStatus = async (policy, amount, installment_order, installment_type, payment, airtel_money_id) => {
  console.log("UPDATE STATUS WAS CALLED", policy, amount, installment_order, installment_type)
  let date = new Date();

  amount = parseInt(amount);

  let installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1, date.getDay() - 3);
  policy.policy_status = "paid";
  policy.policy_paid_date = new Date();

  if (installment_order == 12) {
    policy.policy_end_date = new Date(date.getFullYear() + 1, date.getMonth(), date.getDate());
  }

  if (installment_type == 2) {
    policy.policy_next_deduction_date = new Date(date.getFullYear(), date.getMonth() + 1, policy.policy_deduction_day);
    policy.installment_order = installment_order;
    policy.installment_alert_date = installment_alert_date;
  }


  if (policy.policy_paid_amount !== policy.premium) {

    policy.policy_paid_amount += amount;
    policy.policy_pending_premium -= amount;
  }

  policy.bluewave_transaction_id = payment.payment_id;
  policy.airtel_transaction_id = airtel_money_id

  console.log("UPDATE STATUS WAS CALLED", policy)

  if (policy.renewal_status == "pending") {
    policy.renewal_status = "renewed";
    policy.renewal_date = new Date();
    policy.renewal_order = parseInt(policy.renewal_order) + 1;
  }
  await policy.save();

  return policy;

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
      console.log("TRANSACTION DATA", transactionData);

      const user = await Users.findOne({ where: { user_id } });
      let policy = await db.policies.findOne({ where: { policy_id } });
      // policy.sort((a, b) => a.policy_start_date - b.policy_start_date);
      policy.airtel_money_id = airtel_money_id;

      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: "User not found" });
      }

      // latest policy
      // policy = policy[policy.length - 1];

      console.log("======= POLICY =========", policy);

      if (!policy || !policy.airtel_money_id) {
        console.log("Policy not found");
        return res.status(404).json({ message: "Policy not found" });
      }

      const beneficiary = policy.beneficiary
      const to = user.phone_number?.startsWith("7") ? `+256${user.phone_number}` : user.phone_number?.startsWith("0") ? `+256${user.phone_number.substring(1)}` : user.phone_number?.startsWith("+") ? user.phone_number : `+256${user.phone_number}`;
      const policyType = policy.policy_type.toUpperCase();
      const period = policy.installment_type == 1 ? "yearly" : "monthly";


      if (status_code === "TS") {

        await transactionData.update({
          status: "paid",
        });

        const payment = await Payment.create({
          payment_amount: amount,
          payment_type: "airtel money stk push for " + policyType + " " + period + " payment",
          user_id,
          policy_id,
          payment_status: "paid",
          payment_description: message,
          payment_date: new Date(),
          payment_metadata: req.body,
          partner_id,
        });


        let registerAARUser: any, updatePremiumData: any, updatedPolicy: any, installment: any;
        const memberStatus = await fetchMemberStatusData({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });


        // policy schedule
        //find policy schedule with policy id 
        //if not found create new policy schedule

        let policySchedule = await db.policy_schedules.findOne({ where: { policy_id } });
        console.log("POLICY SCHEDULE", policySchedule);

        function calculateOutstandingPremiumForMonth(premium, month) {
          // Calculate the outstanding premium for the month

          // eg jan 10,000, feb 20, 000, march 30,000
          const outstandingPremium = premium * (12 - month);

          // Return the outstanding premium
          return outstandingPremium;

        }

        if (!policySchedule) {
          // If policy installment type is monthly, create 12 policy schedules
          if (policy.installment_type == 2) {
            // Get the policy start date
            const policyStartDate = new Date(policy.policy_start_date);

            // Define an array to store the 12 policy schedules
            const policySchedules = [];

            // Loop to create 12 monthly policy schedules
            for (let i = 0; i < 12; i++) {
              // Calculate the next due date
              const nextDueDate = new Date(policyStartDate);
              nextDueDate.setMonth(policyStartDate.getMonth() + i);

              // Calculate the reminder date (e.g., 5 days before the due date)
              const reminderDate = new Date(nextDueDate);
              reminderDate.setDate(reminderDate.getDate() - 5);

              // Create a new policy schedule object
              const newPolicySchedule = {
                policy_schedule_id: uuidv4(),
                policy_id,
                payment_frequency: period,
                policy_start_date: policyStartDate,
                next_payment_due_date: nextDueDate,
                reminder_date: reminderDate,
                premium: policy.premium,
                outstanding_premium: calculateOutstandingPremiumForMonth(policy.premium, i)
              };

              // Push the new policy schedule into the array
              policySchedules.push(newPolicySchedule);
            }

            // Insert all 12 policy schedules into your database
            await PolicySchedule.bulkCreate(policySchedules);

            // Now you have 12 policy schedules for the monthly installment.
          } else if (policy.installment_type == 1) {
            // If the policy installment type is not monthly, create a single policy schedule
            const newPolicySchedule = {
              policy_schedule_id: uuidv4(),
              policy_id,
              payment_frequency: period,
              policy_start_date: policy.policy_start_date,
              next_payment_due_date: policy.policy_end_date,
              reminder_date: policy.policy_end_date,
              premium: policy.premium,
              outstanding_premium: policy.premium
            };

            // Insert the single policy schedule into your database
            await PolicySchedule.create(newPolicySchedule);
          } else {
            console.log("POLICY INSTALLMENT TYPE NOT FOUND")
          }
        }


        console.log("Payment record created successfully");

        if (policy.installment_order >= 1 && policy.installment_order < 12 && policy.installment_type == 2 && policy.policy_status == "paid") {
          console.log("INSTALLMENT ORDER", policy.installment_order, policy.installment_type);
          const date = new Date();
          const installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1);

          let installment_order = await db.installments.count({ where: { policy_id } });
          installment_order++;

          installment = await db.installments.create({
            installment_id: uuidv4(),
            policy_id,
            installment_order,
            installment_date: new Date(),
            installment_alert_date,
            tax_rate_vat: policy.tax_rate_vat,
            tax_rate_ext: policy.tax_rate_ext,
            installment_deduction_amount: policy.policy_deduction_amount,
            premium: policy.premium,
            sum_insured: policy.sum_insured,
            excess_premium: policy.excess_premium,
            discount_premium: policy.discount_premium,
            currency_code: policy.currency_code,
            country_code: policy.country_code,
          });

        }
        updatedPolicy = await updateUserPolicyStatus(policy, parseInt(amount), policy.installment_order, policy.installment_type, payment, airtel_money_id);

        console.log("=== PAYMENT ===", payment)
        console.log("=== TRANSACTION === ", transactionData)
        console.log("=== UPDATED POLICY ===", updatedPolicy)
        console.log("=== INSTALLMENT ===", installment)
        console.log("=== REGISTERED AAR USER ===", registerAARUser)
        console.log("=== UPDATED PREMIUM DATA ===", updatePremiumData)

        const members = policy.total_member_number?.match(/\d+(\.\d+)?/g);
        console.log("MEMBERS", members, policy.total_member_number);



        const sumInsured = formatAmount(policy.sum_insured);
        const lastExpenseInsured = formatAmount(policy.last_expense_insured);
        console.log("SUM INSURED", sumInsured);
        console.log("LAST EXPENSE INSURED", lastExpenseInsured);

        const thisDayThisMonth = policy.installment_type === 2 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1) : new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1);

        let congratText = "";

        if (policy.beneficiary == "FAMILY") {
          congratText = `Congratulations! You and ${members} dependent are each covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`
        } else if (policy.beneficiary == "SELF")
          congratText = `Congratulations! You are covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`;
        else if (policy.beneficiary == "OTHER") {
          congratText = `${user.first_name} has bought for you Ddwaliro Care for Inpatient ${sumInsured} and Funeral benefit of ${lastExpenseInsured}. Dial *185*7*6# on Airtel to enter next of kin & view more details`
        }

        await SMSMessenger.sendSMS(to, congratText);

        // Call the function with the relevant user, policy, and memberStatus
        await processPolicy(user, policy, memberStatus);

        return res.status(200).json({
          code: 200,
          message: "Payment record created successfully"
        });
      } else {
        await Payment.create({
          payment_amount: amount,
          payment_type: "airtel money payment",
          user_id,
          policy_id,
          payment_status: "failed",
          payment_description: message,
          payment_date: new Date(),
          payment_metadata: req.body,
          partner_id: partner_id,
        });

        console.log("Payment  for failed record created");
        return res.status(200).json({ code: 200, message: "POST/GET request handled successfully" });
      }
    } else {
      return res.status(405).send("Method Not Allowed");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


async function processPolicy(user: any, policy: any, memberStatus: any) {
  // Determine the number of dependants
  const number_of_dependants = parseFloat(policy?.total_member_number.split("")[2]) || 0;
  console.log("Number of dependants:", number_of_dependants);

  if (memberStatus.code === 200) {
    // If the member status is 200, proceed with processing the policy
    console.log("MEMBER STATUS:", memberStatus);
    policy.arr_policy_number = memberStatus?.policy_no;
  } else {
    // If the member status is not 200, register the AAR user
    const registerAARUser = await registerPrincipal(user, policy);

    if (registerAARUser.code === 200) {
      // If the AAR user registration is successful
      user.arr_member_number = registerAARUser.member_no;
      await user.save();
    }

    if (number_of_dependants > 0) {
      // If there are dependants, create them
      await createDependant(user, policy);
    } else {
      // If there are no dependants, update the premium
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
      console.log("TRANSACTION DATA", transactionData);

      const user = await Users.findOne({ where: { user_id } });
      let policy = await db.policies.findOne({ where: { policy_id } });
      // policy.sort((a, b) => a.policy_start_date - b.policy_start_date);
      policy.airtel_money_id = airtel_money_id;

      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: "User not found" });
      }

      // latest policy
      // policy = policy[policy.length - 1];

      console.log("======= POLICY =========", policy);

      if (!policy || !policy.airtel_money_id) {
        console.log("Policy not found");
        return res.status(404).json({ message: "Policy not found" });
      }

      const beneficiary = policy.beneficiary
      const to = user.phone_number?.startsWith("7") ? `+254${user.phone_number}` : user.phone_number?.startsWith("0") ? `+254${user.phone_number.substring(1)}` : user.phone_number?.startsWith("+") ? user.phone_number : `+254${user.phone_number}`;
      const policyType = policy.policy_type.toUpperCase();
      const period = policy.installment_type == 1 ? "yearly" : "monthly";


      if (status_code === "TS") {

        await transactionData.update({
          status: "paid",
        });

        const payment = await Payment.create({
          payment_amount: amount,
          payment_type: "airtel money kenya stk push for " + policyType + " " + period + " payment",
          user_id,
          policy_id,
          payment_status: "paid",
          payment_description: message,
          payment_date: new Date(),
          payment_metadata: req.body,
          partner_id,
        });


        let registerAARUser: any, updatePremiumData: any, updatedPolicy: any, installment: any;
        //const memberStatus = await fetchMemberStatusData({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });


        // policy schedule
        //find policy schedule with policy id 
        //if not found create new policy schedule

        let policySchedule = await db.policy_schedules.findOne({ where: { policy_id } });
        console.log("POLICY SCHEDULE", policySchedule);

        function calculateOutstandingPremiumForMonth(premium, month) {
          // Calculate the outstanding premium for the month

          // eg jan 10,000, feb 20, 000, march 30,000
          const outstandingPremium = premium * (12 - month);

          // Return the outstanding premium
          return outstandingPremium;

        }

        if (!policySchedule) {
          // If policy installment type is monthly, create 12 policy schedules
          if (policy.installment_type == 2) {
            // Get the policy start date
            const policyStartDate = new Date(policy.policy_start_date);

            // Define an array to store the 12 policy schedules
            const policySchedules = [];

            // Loop to create 12 monthly policy schedules
            for (let i = 0; i < 12; i++) {
              // Calculate the next due date
              const nextDueDate = new Date(policyStartDate);
              nextDueDate.setMonth(policyStartDate.getMonth() + i);

              // Calculate the reminder date (e.g., 5 days before the due date)
              const reminderDate = new Date(nextDueDate);
              reminderDate.setDate(reminderDate.getDate() - 5);

              // Create a new policy schedule object
              const newPolicySchedule = {
                policy_schedule_id: uuidv4(),
                policy_id,
                payment_frequency: period,
                policy_start_date: policyStartDate,
                next_payment_due_date: nextDueDate,
                reminder_date: reminderDate,
                premium: policy.premium,
                outstanding_premium: calculateOutstandingPremiumForMonth(policy.premium, i)
              };

              // Push the new policy schedule into the array
              policySchedules.push(newPolicySchedule);
            }

            // Insert all 12 policy schedules into your database
            await PolicySchedule.bulkCreate(policySchedules);

            // Now you have 12 policy schedules for the monthly installment.
          } else if (policy.installment_type == 1) {
            // If the policy installment type is not monthly, create a single policy schedule
            const newPolicySchedule = {
              policy_schedule_id: uuidv4(),
              policy_id,
              payment_frequency: period,
              policy_start_date: policy.policy_start_date,
              next_payment_due_date: policy.policy_end_date,
              reminder_date: policy.policy_end_date,
              premium: policy.premium,
              outstanding_premium: policy.premium
            };

            // Insert the single policy schedule into your database
            await PolicySchedule.create(newPolicySchedule);
          } else {
            console.log("POLICY INSTALLMENT TYPE NOT FOUND")
          }
        }


        console.log("Payment record created successfully");

        if (policy.installment_order >= 1 && policy.installment_order < 12 && policy.installment_type == 2 && policy.policy_status == "paid") {
          console.log("INSTALLMENT ORDER", policy.installment_order, policy.installment_type);
          const date = new Date();
          const installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1);

          let installment_order = await db.installments.count({ where: { policy_id } });
          installment_order++;

          installment = await db.installments.create({
            installment_id: uuidv4(),
            policy_id,
            installment_order,
            installment_date: new Date(),
            installment_alert_date,
            tax_rate_vat: policy.tax_rate_vat,
            tax_rate_ext: policy.tax_rate_ext,
            installment_deduction_amount: policy.policy_deduction_amount,
            premium: policy.premium,
            sum_insured: policy.sum_insured,
            excess_premium: policy.excess_premium,
            discount_premium: policy.discount_premium,
            currency_code: policy.currency_code,
            country_code: policy.country_code,
          });

        }
        updatedPolicy = await updateUserPolicyStatus(policy, parseInt(amount), policy.installment_order, policy.installment_type, payment, airtel_money_id);

        console.log("=== PAYMENT ===", payment)
        console.log("=== TRANSACTION === ", transactionData)
        console.log("=== UPDATED POLICY ===", updatedPolicy)
        console.log("=== INSTALLMENT ===", installment)
        console.log("=== REGISTERED AAR USER ===", registerAARUser)
        console.log("=== UPDATED PREMIUM DATA ===", updatePremiumData)

        const members = policy.total_member_number?.match(/\d+(\.\d+)?/g);
        console.log("MEMBERS", members, policy.total_member_number);



        const inPatientCover = formatAmount(policy.inpatient_cover);
        const outPatientCover = formatAmount(policy.outpatient_cover);
        const maternityCover = formatAmount(policy.maternity_cover);


        const thisDayThisMonth = policy.installment_type === 2 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1) : new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1);

        let congratText = "";



        if (policy.beneficiary == "FAMILY") {
          congratText = `Congratulations! You and ${members} dependent are each covered for Inpatient benefit of  Kshs ${policy.inpatient_cover}  and Maternity benefit of  Kshs ${policy.maternity_cover} . Cover valid till ${thisDayThisMonth.toDateString()}`
        } else if (policy.beneficiary == "SELF") {
          if (policy.policy_type.toUpperCase() == "BAMBA") {
            congratText = `Congratulations! You are bought AfyaShua Mamba cover for Kshs 4,500/night  of hospitalisation up to a Maximum of 30 days.  Pay KShs ${policy.premium} every ${policy.policy_deduction_day} to stay covered `;

          } else if (policy.policy_type.toUpperCase() == "ZIDI") {
            congratText = ` Congratulations! You bought AfyaShua Zidi cover for Inpatient KShs ${policy.inpatient_cover} and Maternity for KShs ${policy.maternity_cover} Pay KShs ${policy.premium} every ${policy.policy_deduction_day} to stay covered`
          } else {
            congratText = `Congratulations! You bought AfyaShua Smarta cover for Inpatient ${policy.inpatient_cover} Outpatient for ${policy.outpatient_cover} and Maternity for Kshs ${policy.maternity_cover}. Pay KShs ${policy.premium} every ${policy.policy_deduction_day} to stay covered`
          }
        } else if (policy.beneficiary == "OTHER") {
          if (policy.policy_type.toUpperCase() == "BAMBA") {
            congratText = `${user.first_name} has bought for you AfyaShua cover for Kshs 4,500 per night up to a Maximum of 30 days after one day of being hospitalized.
               Dial *334*7*3# on Airtel  to enter next of kin & view more details`
          } else if (policy.policy_type.toUpperCase() == "ZIDI") {
            congratText = `${user.first_name} has bought for you AfyaShua cover for Inpatient ${inPatientCover} and Maternity benefit of ${maternityCover}. Dial *185*7*6# on Airtel to enter next of kin & view more details`

          }
        }

        await SMSMessenger.sendSMS(to, congratText);

        // Call the function with the relevant user, policy, and memberStatus
        // await processPolicy(user, policy, memberStatus);

        return res.status(200).json({
          code: 200,
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
        return res.status(200).json({ code: 200, message: "POST/GET request handled successfully" });
      }
    } else {
      return res.status(405).send("Method Not Allowed");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});






module.exports = router;
