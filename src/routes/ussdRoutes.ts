import express from "express";
import ussdUgaMenuBuilder from "../menu-builder";
import ussdKenMenuBuilder from "../menu-ken-builder";
import sendSMS from "../services/sendSMS";
import { db } from "../models/db";
import { v4 as uuidv4 } from "uuid";
import { initiateConsent } from "../services/payment"
import { registerPrincipal, updatePremium , fetchMemberStatusData} from "../services/aar"

const Transaction = db.transactions;
const Payment = db.payments;
const Policy = db.policies;
const Users = db.users;
const Beneficiary = db.beneficiaries;

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

router.post("/ken", async (req: any, res: any) => {
  await handleUSSDRequest(req, res, ussdKenMenuBuilder);
});

const findTransactionById = async (transactionId) => {
  return await Transaction.findOne({
    where: {
      transaction_reference: transactionId,
    },
  });
};

const updateUserPolicyStatus = async (policy, amount, installment_order, installment_type) => {
  console.log("UPDATE STATUS WAS CALLED", policy, amount, installment_order, installment_type)
  let date = new Date();

  amount = parseInt(amount);

  let installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1);
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

  policy.policy_paid_amount += amount;
  policy.policy_pending_premium -= amount;

  console.log("UPDATE STATUS WAS CALLED", policy)
  await policy.save();

  return policy;

};
// {
//   "transaction": {
//     "id": "BBZMiscxy",
//     "message": "Paid UGX 5,000 to TECHNOLOGIES LIMITED Charge UGX 140, Trans ID MP210603.1234.L06941.",
//     "status_code": "TS",
//     "airtel_money_id": "MP210603.1234.L06941"
//   }
// }


// POST and GET request handler
router.all("/callback", async (req, res) => {
  try {
    if (req.method === "POST" || req.method === "GET") {
      const { transaction } = req.body;
      const { id, status_code, message, airtel_money_id } = transaction;

      const transactionData = await findTransactionById(id);

      if (!transactionData) {
        console.log("Transaction not found");
        return res.status(404).json({ message: "Transaction not found" });
      }

      await transactionData.update({
        status: "paid",
      });

      const { policy_id, user_id, amount, partner_id } = transactionData;

      const user = await Users.findOne({ where: { user_id } });
      const policy = await Policy.findOne({ where: { policy_id } });

      if (!policy) {
        console.log("Policy not found");
        return res.status(404).json({ message: "Policy not found" });
      }

      const beneficiary = await Beneficiary.findOne({ where: { user_id } });
      const to = user.phone_number;
      const policyType = policy.policy_type.toUpperCase();
      
      const paymentMessage = `Dear ${user.first_name}, you have successfully bought ${policyType} Medical cover for ${user.phone_number}. Inpatient cover UGX ${policy.sum_insured}. Go to My Account to ADD details`;

      if (status_code === "TS") {
        await sendSMS(to, paymentMessage);
        let registerAARUser:any, updatePremiumData:any, updatedPolicy:any, installment:any;
        if (!user.arr_member_number) {
          registerAARUser = await registerPrincipal(user, policy, beneficiary, airtel_money_id);
          console.log("AAR USER", registerAARUser);
          if (registerAARUser.code == 200) {
                 user.arr_member_number = registerAARUser.member_no;
               await  user.save();
            updatePremiumData = await updatePremium(user, policy, airtel_money_id);
           console.log("AAR UPDATE PREMIUM", updatePremiumData);
          }
         
        }
        if (user.arr_member_number) {
          const memberStatus = await fetchMemberStatusData({ member_no: user.arr_member_number , unique_profile_id: user.membership_id + ""});
          console.log("MEMBER STATUS", memberStatus);
          policy.arr_policy_number = memberStatus.policy_no;
        }

      const payment = await Payment.create({
          payment_amount: amount,
          payment_type: "airtel money stk push",
          user_id,
          policy_id,
          payment_status: "paid",
          payment_description: message,
          payment_date: new Date(),
          payment_metadata: req.body,
          partner_id,
        });

        console.log("Payment record created successfully");

        if (policy.installment_order > 0 && policy.installment_order < 12 && policy.installment_type == 2) {
          console.log("INSTALLMENT ORDER", policy.installment_order, policy.installment_type);
          const date = new Date();
          const installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1);

          let installment_order = await db.installments.count({ where: { policy_id } });
          installment_order++;

          installment =await db.installments.create({
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
        updatedPolicy = await updateUserPolicyStatus(policy, parseInt(amount), policy.installment_order, policy.installment_type);
       
        console.log("=== PAYMENT ===",payment)
        console.log("=== TRANSACTION === ",transactionData)
        console.log("=== UPDATED POLICY ===",updatedPolicy)
        console.log("=== INSTALLMENT ===",installment)
        console.log("=== REGISTERED AAR USER ===",registerAARUser)
        console.log("=== UPDATED PREMIUM DATA ===",updatePremiumData)


        return res.status(200).json({ 
          code: 200,
          message: "Payment record created successfully" });
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
