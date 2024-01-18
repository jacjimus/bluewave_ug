import { db } from "../models/db";
import { processPolicy, updateUserPolicyStatus } from "../routes/ussdRoutes";
import { fetchMemberStatusData, reconciliation } from "../services/aar";
import SMSMessenger from "../services/sendSMS";
import { formatAmount } from "../services/utils";
const { Op, QueryTypes } = require("sequelize");
const moment = require("moment");
const excelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const XLSX = require("xlsx");

const Policy = db.policies;
const User = db.users;
const Session = db.sessions;
const Claim = db.claims;
const Product = db.products;
const Payment = db.payments;
const Partner = db.partners;
const Log = db.logs;

/**
 * @swagger
 * /api/v1/reports/policy/summary:
 *   get:
 *     tags:
 *       - Reports
 *     description: Policy summary
 *     operationId: PolicySummary
 *     summary: Policy summary
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: today
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *       - name: this_week
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *       - name: this_month
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Information fetched successfuly
 *       400:
 *         description: Invalid request
 */
const getPolicySummary = async (req: any, res: any) => {
  console.log("getPolicySummary");

  try {
    const partner_id = req.query.partner_id;
    const today = req.query.today === "true";
    const this_week = req.query.this_week === "true";
    const this_month = req.query.this_month === "true";

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    let startDate, endDate;

    if (today) {
      startDate = new Date(twentyFourHoursAgo);
      endDate = new Date();
    } else if (this_week) {
      startDate = new Date();
      startDate.setDate(twentyFourHoursAgo.getDate() - twentyFourHoursAgo.getDay());
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date();
      endDate.setDate(startDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
    } else if (this_month) {
      startDate = new Date(twentyFourHoursAgo.getFullYear(), twentyFourHoursAgo.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(twentyFourHoursAgo.getFullYear(), twentyFourHoursAgo.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(0);
      endDate = new Date();
    }

    let policyQuery = {
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        ...(partner_id != 1 && { partner_id }),
      },
      limit: 100,
    };

    let policy = await Policy.findAll(policyQuery);


    if (!policy || policy.length === 0) {
      return res.status(404).json({ message: "No policies found" });
    }

    let total_payment_premium = await db.payments.sum("payment_amount", {
      where: {
        payment_status: "paid",
        partner_id,
      },
    });
    // await db.payments.sum("payment_amount", {
    //   where: {
    //     payment_status: "paid",
    //     partner_id,
    //   },
    // });

    let total_policy_premium_paid = await db.policies.sum("policy_paid_amount", {
      where: {
        policy_status: "paid",
        partner_id,
      },
    });
    const renewalsCount = await db.policies.findAndCountAll({
      where: {
        policy_status: "paid",
        installment_order: {
          [Op.gt]: 1,
        },
        partner_id: partner_id,
      },
    });

    let total_policies_renewed_premium = await db.policies.sum("policy_paid_amount", {
      where: {
        policy_status: "paid",
        installment_order: {
          [Op.gt]: 1,
        },
        partner_id,
      },
    });

    let summary = {
      total_users: await db.users.count({ where: { partner_id } }),
      total_policies_paid: await db.policies.count({ where: { policy_status: "paid", partner_id } }),
      total_policies_premium_paid: total_policy_premium_paid,
      total_preimum_amount: total_policy_premium_paid,
      total_paid_payment_amount: await db.payments.count({ where: { payment_status: "paid", partner_id } }),
      total_policies_renewed: renewalsCount.count,
      total_policies_renewed_premium: total_policies_renewed_premium,
    };

    let country_code, currency_code;

    const partnerCountries = {
      1: { country_code: "KE", currency_code: "KES" },
      2: { country_code: "UG", currency_code: "UGX" },
      3: { country_code: "CD", currency_code: "COD" },
      // Add more partner countries as needed
    };

    const selectedPartner = partnerCountries[partner_id];

    if (selectedPartner) {
      country_code = selectedPartner.country_code;
      currency_code = selectedPartner.currency_code;
    } else {
      console.error("Invalid partner_id");
    }

    return res.status(200).json({
      result: {
        code: 200,
        countryCode: country_code,
        currencyCode: currency_code,
        items: summary,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

/**
 * @swagger
 * /api/v1/reports/claims/summary:
 *   get:
 *     tags:
 *       - Reports
 *     description: Claim summary
 *     operationId: ClaimSummary
 *     summary: Claim summary
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: today
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *       - name: this_week
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *       - name: this_month
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Information fetched successfuly
 *       400:
 *         description: Invalid request
 */

const getClaimSummary = async (req: any, res: any) => {
  try {
    console.log("getClaimSummary");

    const partner_id = req.query.partner_id;
    const today = req.query.today === "true"; // Convert to a boolean value
    const this_week = req.query.this_week === "true"; // Convert to a boolean value
    const this_month = req.query.this_month === "true"; // Convert to a boolean value

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    let claim: any, startDate: any, endDate: any;

    if (today) {
      // For today
      startDate = new Date(twentyFourHoursAgo);
      endDate = new Date();
    } else if (this_week) {
      // For this week
      startDate = new Date();
      startDate.setDate(
        twentyFourHoursAgo.getDate() - twentyFourHoursAgo.getDay()
      );
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date();
      endDate.setDate(startDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
    } else if (this_month) {
      // For this month
      startDate = new Date(
        twentyFourHoursAgo.getFullYear(),
        twentyFourHoursAgo.getMonth(),
        1
      );
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(
        twentyFourHoursAgo.getFullYear(),
        twentyFourHoursAgo.getMonth() + 1,
        0
      );
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Handle the case when none of the filtering options are provided
      startDate = new Date(0); // A distant past date (or you can set it to your default start date)
      endDate = new Date(); // Current date
    }

    if (partner_id == 1) {
      claim = await Claim.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });
    } else {
      claim = await Claim.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          partner_id: partner_id,
        },
      });
    }
    if (claim.length === 0) {
      return res.status(404).json({ message: "No claims found" });
    }

    const summary = {
      total_claims: claim.length,
      total_claims_approved: countClaimsByStatus(claim, "approved"),
      total_claims_pending: countClaimsByStatus(claim, "pending"),
      total_claims_rejected: countClaimsByStatus(claim, "rejected"),
      total_claims_cancelled: countClaimsByStatus(claim, "cancelled"),
      total_claims_paid: countClaimsByStatus(claim, "paid"),
      total_claims_unpaid: countClaimsByStatus(claim, "unpaid"),
      total_claims_disputed: countClaimsByStatus(claim, "disputed"),
      total_claims_dispute_resolved: countClaimsByStatus(
        claim,
        "dispute_resolved"
      ),
    };
    const partnerCountry = await Partner.findOne({
      where: {
        partner_id: partner_id,
      },
    });

    return res.status(200).json({
      result: {
        code: 200,
        countryCode: partnerCountry.country_code,
        currencyCode: partnerCountry.currency_code,
        items: summary,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error });
  }
};

/**
 * @swagger
 * /api/v1/reports/summary/all:
 *   get:
 *     tags:
 *       - Reports
 *     description: Report summary
 *     operationId: ReportSummary
 *     summary: Report summary
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: today
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *       - name: this_week
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *       - name: this_month
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Information fetched successfuly
 *       400:
 *         description: Invalid request
 */
const getAllReportSummary = async (req: any, res: any) => {
  try {
    const partner_id = req.query.partner_id;
    const today = req.query.today === "true"; // Convert to a boolean value
    const this_week = req.query.this_week === "true"; // Convert to a boolean value
    const this_month = req.query.this_month === "true"; // Convert to a boolean value

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    let startDate: any, endDate: any;

    if (today) {
      // For today
      startDate = new Date(twentyFourHoursAgo);
      endDate = new Date();
    } else if (this_week) {
      // For this week
      startDate = new Date();
      startDate.setDate(
        twentyFourHoursAgo.getDate() - twentyFourHoursAgo.getDay()
      );
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date();
      endDate.setDate(startDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
    } else if (this_month) {
      // For this month
      startDate = new Date(
        twentyFourHoursAgo.getFullYear(),
        twentyFourHoursAgo.getMonth(),
        1
      );
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(
        twentyFourHoursAgo.getFullYear(),
        twentyFourHoursAgo.getMonth() + 1,
        0
      );
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Handle the case when none of the filtering options are provided
      startDate = new Date(0); // A distant past date (or you can set it to your default start date)
      endDate = new Date(); // Current date
    }

    const partnerCountry = await Partner.findOne({
      where: {
        partner_id: partner_id,
      },
    });


    const summary = {
      countryCode: partnerCountry.country_code,
      currencyCode: partnerCountry.currency_code,
      user: {
        total_users: 0,
        total_users_with_policy: 0,
      },
      policy: {
        total_policies_paid: 0,
        total_premium_amount: 0,
      }
    };

    const [users, policies] = await Promise.all([
      User.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          ...(partner_id !== 1 && { partner_id: partner_id }), // Include partner_id condition if applicable
        },
      }),
      Policy.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          policy_status: "paid",
          ...(partner_id !== 1 && { partner_id: partner_id }), // Include partner_id condition if applicable
        },
        limit: 100,
      }),

    ]);

    // Populate user summary
    summary.user.total_users = users.length;
    summary.user.total_users_with_policy = policies.length;
    // summary.user.total_users_active = countUsersByActivity(users, true);
    summary.policy.total_policies_paid = await db.policies.count({
      where: {
        policy_status: "paid",
        partner_id: partner_id,
      },
    });

    const totalPremiumAmountResult = await db.payments.sum("payment_amount", {
      where: {
        payment_status: "paid",
        partner_id: partner_id,
      },
    });

    const totalPremiumAmount = totalPremiumAmountResult || 0;

    summary.policy.total_premium_amount = totalPremiumAmount;

    // Return the summary
    res.status(200).json({ summary });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};



const countClaimsByStatus = (claims: any[], status: string): number => {
  return claims.filter((claim: any) => claim.claim_status === status).length;
};


/**
 * @swagger
 * /api/v1/reports/daily/sales:
 *   get:
 *     tags:
 *       - Reports
 *     description: Daily policy sales
 *     operationId: DailyPolicySales
 *     summary: Daily policy sales
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const getSalesReportByPeriod = async (req, res, periodType) => {
  const { partner_id } = req.query;

  try {
    const today = new Date();
    const startOfPeriod = new Date(today);
    const report = {};

    switch (periodType) {
      case 'daily':
        startOfPeriod.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startOfPeriod.setHours(0, 0, 0, 0);
        startOfPeriod.setDate(today.getDate() - today.getDay());
        break;
      case 'monthly':
        startOfPeriod.setHours(0, 0, 0, 0);
        startOfPeriod.setDate(1);
        break;
      case 'yearly':
        startOfPeriod.setHours(0, 0, 0, 0);
        startOfPeriod.setMonth(0, 1);
        break;
      default:
        throw new Error('Invalid period type');
    }

    // Fetch sales data based on the specified period
    const result = await db.payments.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfPeriod, today],
        },
        payment_status: 'paid',
        partner_id: partner_id,
      },
    });



    // Count policies by status for the specified period
    report[periodType] = result.length;

    return report;
  } catch (error) {
    console.error(`Error fetching ${periodType} sales report:`, error);
    throw error;
  }
};

const getDailyPolicySalesReport = async (req, res) => {
  try {
    // Fetch sales reports for different periods
    const [dailyReport, weeklyReport, monthlyReport, yearlyReport] = await Promise.all([
      getSalesReportByPeriod(req, res, 'daily'),
      getSalesReportByPeriod(req, res, 'weekly'),
      getSalesReportByPeriod(req, res, 'monthly'),
      getSalesReportByPeriod(req, res, 'yearly'),
    ]);


    const partnerCountry = await Partner.findOne({
      where: {
        partner_id: req.query.partner_id,
      },
    });

    res.status(200).json({
      result: {
        code: 200,
        countryCode: partnerCountry.country_code,
        currencyCode: partnerCountry.currency_code,
        items: { daily: dailyReport, weekly: weeklyReport, monthly: monthlyReport, yearly: yearlyReport },
      },
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


/**
 * @swagger
 * /api/v1/reports/policy/excel:
 *   post:
 *     tags:
 *       - Reports
 *     description: Excel policy report
 *     operationId: ExcelPolicyReport
 *     summary: Excel policy report
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *       - name: filter
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: start_date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: end_date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *       400:
 *         description: Invalid request
 */
const getPolicyExcelReportDownload = async (req, res) => {
  let {
    partner_id,
    page = 1,
    limit = 1000,
    filter,
    start_date,
    end_date,
  } = req.query;

  try {
    const whereClause: any = {
      partner_id: partner_id,
      policy_status: "paid",
    };
    if (filter)
      filter = filter.trim().toLowerCase();
    if (filter) {
      whereClause[Op.or] = [
        { beneficiary: { [Op.iLike]: `%${filter}%` } },
        { policy_type: { [Op.iLike]: `%${filter}%` } },
        { policy_status: { [Op.iLike]: `%${filter}%` } },
        { currency_code: { [Op.iLike]: `%${filter}%` } },
        { country_code: { [Op.iLike]: `%${filter}%` } },

      ];
    }

    if (start_date && end_date) {
      whereClause.policy_start_date = {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      };
    }

    if (start_date && !end_date) {
      whereClause.policy_start_date = {
        [Op.gte]: new Date(start_date),
      };
    }

    const options = {
      where: whereClause,
      // offset: (page - 1) * limit,
      // limit: limit,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["first_name", "last_name", "phone_number", "arr_member_number"],
        },
        {
          model: Product,
          as: "product",
          attributes: ["product_name"],
        },
      ],
      limit: 5000,
    };

    let policies = await Policy.findAll(options);

    if (!policies || policies.length === 0) {
      return res.status(404).json({ message: "No policies found" });
    }

    const workbook = await generatePolicyExcelReport(policies);
    // Save the workbook to a temporary file
    const tempFilePath = path.join(__dirname, "uploads", "policy_report.xlsx");
    await workbook.xlsx.writeFile(tempFilePath);

    // Get the base URL from environment variable or use a default
    const BASE_URL = process.env.ENVIROMENT == 'PROD' ? process.env.BASE_URL : "http://localhost:4000";

    // Generate a unique download token
    const downloadToken = Date.now();

    // Create a URL for the download endpoint including the token
    // the file is located at src/uploads/policy_report.xlsx
    const downloadURL = `${BASE_URL}/api/v1/reports/policy/excel/download?token=${downloadToken}`;

    // Return the download URL to the user
    res.status(200).json({ downloadURL });
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Download endpoint handler
const handleUsersDownload = (req, res) => {
  const filePath = path.join(__dirname, "uploads", "users_report.xlsx");
  // Stream the file for download
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=users_report.xlsx"
  );

  fs.createReadStream(filePath).pipe(res);
};
const handlePolicyDownload = (req, res) => {
  const filePath = path.join(__dirname, "uploads", "policy_report.xlsx");
  // Stream the file for download
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=policy_report.xlsx"
  );

  fs.createReadStream(filePath).pipe(res);
};

const handleClaimDownload = (req, res) => {
  const { token } = req.query;

  const filePath = path.join(__dirname, "uploads", "claim_report.xlsx");

  // Stream the file for download
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=claim_report.xlsx"
  );

  fs.createReadStream(filePath).pipe(res);
};

const generatePolicyExcelReport = async (policies) => {
  const workbook = new excelJS.Workbook(); // Create a new workbook
  const worksheet = workbook.addWorksheet("Policy Report");

  // Define columns for data in Excel. Key must match data key
  worksheet.columns = [
    { header: "Policy Number", key: "policy_number", width: 20 },
    { header: "Full Name", key: "full_name", width: 20 },
    { header: "Phone Number", key: "phone_number", width: 20 },
    { header: "AAR Member Number", key: "arr_member_number", width: 20 },
    { header: "Policy Category", key: "beneficiary", width: 20 },
    { header: "Policy Type", key: "policy_type", width: 20 },
    { header: "Family Size", key: "total_member_number", width: 20 },
    { header: "Policy Status", key: "policy_status", width: 20 },
    { header: "Installment Type", key: "installment_type", width: 20 },
    { header: "Policy End Date", key: "policy_end_date", width: 20 },
    { header: "Policy Paid Date", key: "policy_start_date", width: 20 },
    { header: "Premium", key: "policy_paid_amount", width: 20 },
    { header: "Sum Insured", key: "sum_insured", width: 20 },
    { header: "Last Expense Insured", key: "last_expense_insured", width: 20 },
    { header: "Installment Order", key: "installment_order", width: 20 },
    { header: "Created At", key: "createdAt", width: 20 },


  ];

  policies.forEach(async (policy) => {
    worksheet.addRow({
      policy_id: policy.policy_id,
      airtel_money_id: policy.airtel_money_id,
      bluewave_transaction_id: policy.bluewave_transaction_id,
      arr_member_number: policy.user.dataValues?.arr_member_number,
      policy_number: policy.policy_number,
      policy_type: policy.policy_type,
      beneficiary: policy.beneficiary,
      total_member_number: policy.total_member_number,
      policy_status: policy.policy_status,
      policy_start_date: moment(policy.policy_start_date).format("YYYY-MM-DD"),
      policy_end_date: moment(policy.policy_end_date).format("YYYY-MM-DD"),
      policy_deduction_amount: policy.policy_deduction_amount,
      policy_next_deduction_date: moment(
        policy.policy_next_deduction_date
      ).format("YYYY-MM-DD"),
      policy_deduction_day: policy.policy_deduction_day,
      installment_order: policy.installment_order,
      installment_type: policy.installment_type == 2 ? "Monthly" : "Yearly",
      installment_date: moment(policy.installment_date).format("YYYY-MM-DD"),
      installment_alert_date: moment(policy.installment_alert_date).format(
        "YYYY-MM-DD"
      ),
      premium: policy.premium,
      sum_insured: policy.sum_insured,
      last_expense_insured: policy.last_expense_insured,
      hospital_details: policy.hospital_details,
      policy_documents: policy.policy_documents,
      policy_paid_date: moment(policy.policy_paid_date).format("YYYY-MM-DD"),
      policy_paid_amount: policy.policy_paid_amount,
      currency_code: policy.currency_code,
      country_code: policy.country_code,
      product_id: policy.product_id,
      user_id: policy.user_id,
      partner_id: policy.partner_id,
      createdAt: moment(policy.createdAt).format("YYYY-MM-DD"),
      updatedAt: moment(policy.updatedAt).format("YYYY-MM-DD"),
      full_name: `${policy.user?.dataValues?.first_name} ${policy.user?.dataValues?.last_name}`,
      phone_number: policy.user?.dataValues?.phone_number,

    });
  });

  return workbook;
};

const generateUserExcelReport = async (users) => {

  const workbook = new excelJS.Workbook(); // Create a new workbook
  const worksheet = workbook.addWorksheet("User Report");

  // Define columns for data in Excel. Key must match data key
  worksheet.columns = [
    { header: "Full Name", key: "full_name", width: 20 },
    { header: "Phone Number", key: "phone_number", width: 20 },
    { header: "AAR Member Number", key: "arr_member_number", width: 20 },
    { header: "Membership ID", key: "membership_id", width: 20 },
    { header: "Number of Policies", key: "number_of_policies", width: 20 },
    { header: "Created At", key: "createdAt", width: 20 },

  ];

  users.forEach(async (user) => {
    worksheet.addRow({
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      arr_member_number: user.arr_member_number,
      country_code: user.country_code,
      currency_code: user.currency_code,
      createdAt: moment(user.createdAt).format("YYYY-MM-DD"),
      updatedAt: moment(user.updatedAt).format("YYYY-MM-DD"),
      full_name: `${user.first_name} ${user.last_name}`,
      number_of_policies: user.number_of_policies,
      membership_id: user.membership_id,
    });
  });

  return workbook;


}
/**
 * @swagger
 * /api/v1/reports/users/excel:
 *   post:
 *     tags:
 *       - Reports
 *     description: Excel All user report
 *     operationId: ExcelUserReport
 *     summary: Excel All user report
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *       - name: filter
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: start_date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: end_date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *       400:
 *         description: Invalid request
 */
const getUserExcelReportDownload = async (req, res) => {
  let {
    partner_id,
    page = 1,
    limit = 5000,
    filter,
    start_date,
    end_date,
  } = req.query;

  try {
    const whereClause: any = {
      partner_id: partner_id,
    };
    if (filter)
      filter = filter.trim().toLowerCase();
    if (filter) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${filter}%` } },
        { arr_member_number: { [Op.iLike]: `%${filter}%` } },
        { currency_code: { [Op.iLike]: `%${filter}%` } },
        { country_code: { [Op.iLike]: `%${filter}%` } },

      ];
    }

    // if (start_date && end_date) {
    //   whereClause.policy_start_date = {
    //     [Op.between]: [new Date(start_date), new Date(end_date)],
    //   };
    // }

    // if (start_date && !end_date) {
    //   whereClause.policy_start_date = {
    //     [Op.gte]: new Date(start_date),
    //   };
    // }

    const options = {
      where: whereClause,
    };

    let users = await db.users.findAll(options);

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    const workbook = await generateUserExcelReport(users);
    // Save the workbook to a temporary file
    const tempFilePath = path.join(__dirname, "uploads", "users_report.xlsx");
    await workbook.xlsx.writeFile(tempFilePath);

    // Get the base URL from environment variable or use a default
    const BASE_URL = process.env.ENVIROMENT == 'PROD' ? process.env.BASE_URL : "http://localhost:4000";

    // Generate a unique download token
    const downloadToken = Date.now();

    // Create a URL for the download endpoint including the token
    // the file is located at src/uploads/policy_report.xlsx
    const downloadURL = `${BASE_URL}/api/v1/reports/users/excel/download?token=${downloadToken}`;

    // Return the download URL to the user
    res.status(200).json({ downloadURL });
  } catch (error) {
    console.error("Error generating users Excel report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /api/v1/reports/aggregated/daily/sales:
 *   get:
 *     tags:
 *       - Reports
 *     description: Aggregated daily policy sales
 *     operationId: Aggregated dailyPolicySales
 *     summary: Aggregated daily policy sales
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const getAggregatedDailyPolicySalesReport = async (req, res) => {
  try {
    const query = `
        SELECT
          EXTRACT(DOW FROM policy_paid_date) AS day_of_week,
          SUM(policy_deduction_amount) AS total_amount,
          COUNT(DISTINCT user_id) AS total_users -- Added this line
        FROM
          policies 
        WHERE
          policy_paid_date BETWEEN DATE_TRUNC('month', policy_paid_date) AND (DATE_TRUNC('month', policy_paid_date) + INTERVAL '1 month' - INTERVAL '1 day') AND partner_id = :partner_id AND policy_status = 'paid'
        GROUP BY
          day_of_week
        ORDER BY
          day_of_week;
      `;

    // Execute the query using your database connection
    const results = await db.sequelize.query(query, {
      replacements: { partner_id: req.query.partner_id },
      type: QueryTypes.SELECT,
    });

    // Prepare the response data
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const labels = daysOfWeek;
    const datasets = [
      {
        label: 'Policy Sales',
        data: daysOfWeek.map((day) => {
          const result = results.find((item) => item.day_of_week === daysOfWeek.indexOf(day));
          return result ? result.total_amount.toString() : '0';
        }),
        backgroundColor: '#0073bd',
      },
      {
        label: 'Customers',
        data: daysOfWeek.map((day) => {
          const result = results.find((item) => item.day_of_week === daysOfWeek.indexOf(day));
          return result ? result.total_users.toString() : '0';
        }),
        backgroundColor: '#e40102',
      },
    ];

    const partnerData = await Partner.findOne({
      where: {
        partner_id: req.query.partner_id,
      },
    });
    console.log("RESULTS", results)

    const data = {
      labels: labels,
      datasets: datasets,
      total_policies: results.length,
      total_customers: results[0] ? results[0].total_users : 0, // Adjusted for distinct users
      total_amount: results[results.length - 1] ? results[results.length - 1].total_amount : 0,
      countryCode: partnerData.country_code,
      currencyCode: partnerData.currency_code,
    };

    // Send the results as a response
    res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};



/**
 * @swagger
 * /api/v1/reports/aggregated/annual/sales:
 *   get:
 *     tags:
 *       - Reports
 *     description: Aggregated daily policy sales
 *     operationId: Aggregated dailyPolicySales
 *     summary: Aggregated daily policy sales
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const getAggregatedAnnuallyPolicySalesReport = async (req, res) => {
  try {
    const query = `
      SELECT
        EXTRACT(MONTH FROM policy_paid_date) AS month,
        EXTRACT(DAY FROM policy_paid_date) AS day,
        policy_id,
        SUM(premium) AS total_amount,
        COUNT(DISTINCT user_id) AS total_users
      FROM
        policies 
      WHERE
        policy_paid_date BETWEEN DATE_TRUNC('month', policy_paid_date) AND (DATE_TRUNC('month', policy_paid_date) + INTERVAL '1 month' - INTERVAL '1 day')
        AND policy_status = 'paid' AND partner_id = :partner_id
      GROUP BY
        EXTRACT(MONTH FROM policy_paid_date),
        EXTRACT(DAY FROM policy_paid_date),
        policy_id
      ORDER BY
        month,
        day,
        policy_id;
    `;

    // Execute the query using your database connection
    const results = await db.sequelize.query(query, {
      replacements: { partner_id: req.query.partner_id },
      type: QueryTypes.SELECT,
    });

    // Prepare the response data
    const labels = [
      'Jan',
      'Feb',
      'March',
      'April',
      'May',
      'June',
      'July',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const datasets = [
      {
        label: 'Policy Sales',
        data: labels.map((label) => {
          const result = results.find((item) => item.month === labels.indexOf(label) + 1);
          return result ? result.total_amount.toString() : '0';
        }),
        backgroundColor: '#0073bd',
      },
      {
        label: 'Customers',
        data: labels.map((label) => {
          const result = results.find((item) => item.month === labels.indexOf(label) + 1);
          return result ? result.total_users.toString() : '0';
        }),
        backgroundColor: '#e40102',
      },
    ];

    const partnerData = await Partner.findOne({
      where: {
        partner_id: req.query.partner_id,
      },
    });

    console.log("RESULTS", results);

    const data = {
      labels: labels,
      datasets: datasets,
      total_policies: results.length,
      total_customers: results[0] ? results[0].total_users : 0, // Adjusted for distinct users
      total_amount: results[results.length - 1] ? results[results.length - 1].total_amount : 0,
      countryCode: partnerData.country_code,
      currencyCode: partnerData.currency_code,
    };

    // Send the results as a response
    res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @swagger
 * /api/v1/reports/aggregated/monthly/sales:
 *   get:
 *     tags:
 *       - Reports
 *     description: Aggregated monthly policy sales
 *     operationId: Aggregated monthlyPolicySales
 *     summary: Aggregated monthly policy sales
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: month
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const getAggregatedMonthlySalesReport = async (req, res) => {
  try {
    const filterMonth = req.query.month;

    if (!filterMonth || isNaN(filterMonth) || filterMonth < 1 || filterMonth > 12) {
      return res.status(400).json({ message: 'Invalid or missing month filter' });
    }

    // const query = `
    //   SELECT
    //     EXTRACT(MONTH FROM payment_date) AS month,
    //     EXTRACT(DAY FROM payment_date) AS day,
    //     payment_id,
    //     SUM(payment_amount) AS total_amount,
    //     COUNT(DISTINCT user_id) AS total_users
    //   FROM
    //     public.payments
    //   WHERE
    //     payment_date BETWEEN DATE_TRUNC('month', payment_date) AND (DATE_TRUNC('month', payment_date) + INTERVAL '1 month' - INTERVAL '1 day') 
    //     AND EXTRACT(MONTH FROM payment_date) = :filterMonth 
    //     AND payment_status = 'paid'
    //     AND partner_id = :partner_id
    //   GROUP BY
    //     EXTRACT(MONTH FROM payment_date),
    //     EXTRACT(DAY FROM payment_date),
    //     payment_id
    //   ORDER BY
    //     month,
    //     day,
    //     payment_id;
    // `;
    const query = `
    SELECT
      EXTRACT(MONTH FROM policy_start_date) AS month,
      EXTRACT(DAY FROM policy_start_date) AS day,
      policy_id,
      SUM(policy_paid_amount) AS total_amount,
      COUNT(DISTINCT user_id) AS total_users
    FROM
      public.policies
    WHERE
    policy_start_date BETWEEN DATE_TRUNC('month', policy_start_date) AND (DATE_TRUNC('month', policy_start_date) + INTERVAL '1 month' - INTERVAL '1 day') 
      AND EXTRACT(MONTH FROM policy_start_date) = :filterMonth 
      AND policy_status = 'paid'
      AND partner_id = :partner_id
    GROUP BY
      EXTRACT(MONTH FROM policy_start_date),
      EXTRACT(DAY FROM policy_start_date),
      policy_id
    ORDER BY
      month,
      day,
      policy_id;
  `;

    const results = await db.sequelize.query(query, {
      replacements: { partner_id: req.query.partner_id, filterMonth: filterMonth },
      type: QueryTypes.SELECT,
    });

    const labels = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    const datasets = [
      {
        label: 'Policy Sales',
        data: labels.map((label) => {
          const result = results.find((item) => item.day === parseInt(label));
          return result ? result.total_amount.toString() : '0';
        }),
        backgroundColor: '#0073bd',
      },
      {
        label: 'Customers',
        data: labels.map((label) => {
          const result = results.find((item) => item.day === parseInt(label));
          return result ? result.total_users.toString() : '0';
        }),
        backgroundColor: '#e40102',
      },
    ];

    const partnerData = await Partner.findOne({
      where: {
        partner_id: req.query.partner_id,
      },
    });
    console.log("RESULTS", results)
    const data = {
      labels: labels,
      datasets: datasets,
      total_policies: results.length,
      total_customers: new Set(results.map((item) => item.day)).size, // Adjusted for distinct users
      total_amount: results.reduce((acc, item) => acc + parseInt(item.total_amount), 0),
      countryCode: partnerData.country_code,
      currencyCode: partnerData.currency_code,
    };

    res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



/**
 * @swagger
 * /api/v1/reports/claim/excel:
 *   post:
 *     tags:
 *       - Reports
 *     description: Excel claim report
 *     operationId: ExcelClaimReport
 *     summary: Excel claim report
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *       - name: filter
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: start_date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: end_date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *       400:
 *         description: Invalid request
 */
const getClaimExcelReportDownload = async (req, res) => {

  let {
    partner_id,
    page = 1,
    limit = 50,
    filter,
    start_date,
    end_date,
  } = req.query;

  try {
    const whereClause: any = {
      partner_id: partner_id,
    };

    filter = req.query.filter.trim().toLowerCase();
    if (filter) {
      whereClause.claim_number = {
        [Op.like]: `%${filter}%`,
      };
    }

    if (start_date && end_date) {
      whereClause.claim_date = {
        [Op.between]: [start_date, end_date],
      };
    }

    const options = {
      where: whereClause,
      offset: (page - 1) * limit,
      limit: limit,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["first_name", "last_name", "phone_number"],
        },
        {
          model: Policy,
          as: "policy",
          attributes: ["policy_id", "policy_type", "policy_status"],
        },
      ],
    };

    let claims = await Claim.findAll(options);

    if (!claims || claims.length === 0) {
      return res.status(404).json({ message: "No claims found" });
    }

    console.log("I WAS CALLED  claims", claims)


    const workbook = await generateClaimExcelReport(claims);
    // Save the workbook to a temporary file
    const tempFilePath = path.join(__dirname, "uploads", "claim_report.xlsx");
    await workbook.xlsx.writeFile(tempFilePath);

    // Get the base URL from environment variable or use a default
    const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

    // Generate a unique download token
    const downloadToken = Date.now();

    // Create a URL for the download endpoint including the token
    // the file is located at src/uploads/claim_report.xlsx
    const downloadURL = `${BASE_URL}/api/v1/reports/claim/excel/download?token=${downloadToken}`;


    // Return the download URL to the user
    res.status(200).json({ downloadURL });
  }
  catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Internal server error" });
  }


}

//generateClaimExcelReport

function generateClaimExcelReport(claims: any[]) {
  const workbook = new excelJS.Workbook(); // Create a new workbook
  const worksheet = workbook.addWorksheet("Claim Report");

  // Define columns for data in Excel. Key must match data key
  worksheet.columns = [

    { header: "Claim Number", key: "claim_number", width: 20 },
    { header: "Claim Date", key: "claim_date", width: 20 },
    { header: "Customer Name", key: "full_name", width: 20 },
    { header: "Phone Number", key: "phone_number", width: 20 },
    { header: "Claim Status", key: "claim_status", width: 20 },
    { header: "Claim Amount", key: "claim_amount", width: 20 },
    { header: "Claim Description", key: "claim_description", width: 20 },
    { header: "Claim Type", key: "claim_type", width: 20 },
    { header: "Claim Documents", key: "claim_documents", width: 20 },
    { header: "Claim Comments", key: "claim_comments", width: 20 },
    { header: "Policy ID", key: "policy_id", width: 20 },
    { header: "User ID", key: "user_id", width: 20 },
    { header: "Partner ID", key: "partner_id", width: 20 },
    { header: "Created At", key: "createdAt", width: 20 },
    { header: "Updated At", key: "updatedAt", width: 20 },

  ];

  claims.forEach((claim) => {
    // get user name
    let user = db.users.findOne({
      where: {
        user_id: claim.user_id
      },
      limit: 1,
    })


    worksheet.addRow({
      claim_date: moment(claim.claim_date).format("YYYY-MM-DD"),
      claim_number: claim.claim_id,
      claim_status: claim.claim_status,
      claim_amount: claim.claim_amount,
      claim_description: claim.claim_description,
      claim_type: claim.claim_type,
      claim_documents: claim.claim_documents,
      claim_comments: claim.claim_comments,
      policy_id: claim.policy_id,
      user_id: claim.user_id,
      partner_id: claim.partner_id,
      createdAt: moment(claim.createdAt).format("YYYY-MM-DD"),
      updatedAt: moment(claim.updatedAt).format("YYYY-MM-DD"),
      full_name: `${user.first_name} ${user.last_name}`,
      phone_number: user.phone_number,

    });
  });


  return workbook;



}



/**
 * @swagger
 * /api/v1/reports/reconciliation:
 *   post:
 *     tags:
 *       - Reports
 *     description: Reconciliation
 *     operationId: Reconciliation
 *     summary: Reconciliation
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       content:
 *         multipart/form-data:   # Change content type to multipart/form-data
 *           schema:
 *             type: object
 *             properties:
 *               payment_file:   # Specify the parameter name for the Excel file
 *                 type: file  # Set the type as 'file' to indicate a file upload
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const paymentReconciliation = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const partner_id = req.query.partner_id;
    const payment_file = req.file;


    // Read the uploaded Excel file
    const workbook = XLSX.readFile(payment_file.path, { cellDates: true, dateNF: 'mm/dd/yyyy hh:mm:ss' });
    const worksheet = workbook.Sheets[workbook.SheetNames[1]];

    if (!worksheet) {
      return res.status(400).json({ message: "Empty worksheet in the Excel file" });
    }

    // Convert worksheet data to an array of objects
    const paymentDataArray = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    console.log("+++++paymentDataArray+++++", paymentDataArray.length)

    for (let payment of paymentDataArray) {
      let existingUser = await db.users.findOne({
        where: {
          phone_number: `${payment['Sender Mobile Number']}`,
          partner_id: partner_id,
        },
        limit: 1,
      });


      console.log("PAYMENT", payment)


      // if - replace with / in the date

      payment['Transaction Date'] = payment['Transaction Date'].replace(/-/g, '/');

      // Split the original date into components
      let components = payment['Transaction Date'].split(/[/\s:]/);

      // Rearrange the components to the desired format
      let convertedDate = components[1] + '/' + components[0] + '/' + components[2] + ' ' + components[3] + ':' + components[4];

      console.log(convertedDate);



      let transaction_date = moment(convertedDate)

      let premium = payment['Approved value'].replace(/,/g, '')
      let payment_id = payment['External Reference']
      let airtel_money_id = payment['Transaction ID']
      let phone_number = payment['Sender Mobile Number']

      console.log(`transaction_date, ${transaction_date}`)

      console.log(`premium, ${premium}`)
      console.log(`existingUser,${phone_number}`)

      const paymentData = {
        transaction_date: transaction_date,
        premium: premium,
        payment_id: payment_id,
        airtel_money_id: airtel_money_id,
        phone_number: phone_number,
      }

      // if user does not exist, update the policy policy_paid_date

      if (existingUser) {
        console.log(`existingUser, ${payment['Sender Mobile Number']}`)
        let existingPolicy = await db.policies.findOne({
          where: {
            user_id: existingUser.user_id,
            partner_id: partner_id,
            policy_status: 'pending',
            premium: premium,
          },
          limit: 1,
        });

        if (existingPolicy) {
          console.log(`existingPolicy,  premium, ${premium}  `)
          let policy = await db.policies.update({
            policy_paid_date: transaction_date,
            policy_paid_amount: premium,
            airtel_money_id: airtel_money_id,
            bluewave_transaction_id: payment_id,
            policy_status: 'paid'
          }, {
            where: {
              policy_id: existingPolicy.policy_id,
              partner_id: partner_id,
              premium: premium,

            }
          })



          console.log(`policy, ${payment['Sender Mobile Number']}`)
        } else {


          let Policypayment = await db.payments.findOne({
            where: {
              user_id: existingUser.user_id,
              payment_amount: premium,
              payment_status: 'paid',
            },
            limit: 1,
          });

          console.log("==== Policypayment ==", Policypayment)
          if (Policypayment) {
            console.log("==== Policypayment ==", Policypayment)
            const coverTypes = [{
              name: "MINI",
              sum_insured: "1.5M",
              sumInsured: 1500000,
              premium: "10,000",
              yearly_premium: "120,000",
              yearPemium: 120000,
              last_expense_insured: "1M",
              lastExpenseInsured: 1000000
            },
            {
              name: "MIDI",
              sum_insured: "3M",
              sumInsured: 3000000,
              premium: "14,000",
              yearly_premium: "167,000",
              yearPemium: 167000,
              last_expense_insured: "1.5M",
              lastExpenseInsured: 1500000
            },
            {
              name: "BIGGIE",
              sum_insured: "5M",
              sumInsured: 5000000,
              premium: "18,000",
              yearly_premium: "208,000",
              yearPemium: 208000,
              last_expense_insured: "2M",
              lastExpenseInsured: 2000000
            }];

            const covers = [
              {
                name: "Self+Spouse or Child",
                code_name: "M+1",
                packages: [
                  {
                    name: "Mini",
                    code_name: "MINI",
                    premium: '20,000',
                    sum_insured: '1.5M',
                    sumInsured: 1500000,
                    last_expense_insured: '1M',
                    lastExpenseInsured: 1000000,
                    year_premium: '240,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '20,000',
                        yearly_premium: '240,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '240,000',
                        yearly_premium: '240,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Midi",
                    code_name: "MIDI",
                    premium: '28,000',
                    sum_insured: '3M',
                    sumInsured: 3000000,
                    last_expense_insured: '1.5M',
                    lastExpenseInsured: 1500000,
                    year_premium: '322,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '28,000',
                        yearly_premium: '322,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '322,000',
                        yearly_premium: '322,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Biggie",
                    code_name: "BIGGIE",
                    premium: '35,000',
                    sum_insured: '5M',
                    sumInsured: 5000000,
                    last_expense_insured: '2M',
                    lastExpenseInsured: 2000000,
                    year_premium: '400,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '35,000',
                        yearly_premium: '400,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '400,000',
                        yearly_premium: '400,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  }

                ],
              }, {
                name: "Self+Spouse+1 Child",
                code_name: "M+2",
                packages: [
                  {
                    name: "Mini",
                    code_name: "MINI",
                    premium: '30,000',
                    sum_insured: '1.5M',
                    sumInsured: 1500000,
                    last_expense_insured: '1M',
                    lastExpenseInsured: 1000000,
                    year_premium: '360,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '30,000',
                        yearly_premium: '360,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '360,000',
                        yearly_premium: '360,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Midi",
                    code_name: "MIDI",
                    premium: '40,000',
                    sum_insured: '3M',
                    sumInsured: 3000000,
                    last_expense_insured: '1.5M',
                    lastExpenseInsured: 1500000,
                    year_premium: '467,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '40,000',
                        yearly_premium: '400,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '467,000',
                        yearly_premium: '467,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Biggie",
                    code_name: "BIGGIE",
                    premium: '50,000',
                    sum_insured: '5M',
                    sumInsured: 5000000,
                    last_expense_insured: '2M',
                    lastExpenseInsured: 2000000,
                    year_premium: '577,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '50,000',
                        yearly_premium: '577,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '577,000',
                        yearly_premium: '577,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  }

                ],
              },
              {
                name: "Self+Spouse+2 Children",
                code_name: "M+3",
                packages: [
                  {
                    name: "Mini",
                    code_name: "MINI",
                    premium: '40,000',
                    sum_insured: '1.5M',
                    sumInsured: 1500000,
                    last_expense_insured: '1M',
                    lastExpenseInsured: 1000000,
                    year_premium: '480,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '40,000',
                        yearly_premium: '480,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '480,000',
                        yearly_premium: '480,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Midi",
                    code_name: "MIDI",
                    premium: '50,000',
                    sum_insured: '3M',
                    sumInsured: 3000000,
                    last_expense_insured: '1.5M',
                    lastExpenseInsured: 1500000,
                    year_premium: '590,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '50,000',
                        yearly_premium: '590,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '590,000',
                        yearly_premium: '590,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Biggie",
                    code_name: "BIGGIE",
                    premium: '65,000',
                    sum_insured: '5M',
                    sumInsured: 5000000,
                    last_expense_insured: '2M',
                    lastExpenseInsured: 2000000,
                    year_premium: '740,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '65,000',
                        yearly_premium: '740,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '740,000',
                        yearly_premium: '740,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  }

                ],
              }, {
                name: "Self+Spouse+3 Children",
                code_name: "M+4",
                packages: [
                  {
                    name: "Mini",
                    code_name: "MINI",
                    premium: '50,000',
                    sum_insured: '1.5M',
                    sumInsured: 1500000,
                    last_expense_insured: '1M',
                    lastExpenseInsured: 1000000,
                    year_premium: '600,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '50,000',
                        yearly_premium: '600,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '600,000',
                        yearly_premium: '600,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Midi",
                    code_name: "MIDI",
                    premium: '63,000',
                    sum_insured: '3M',
                    sumInsured: 3000000,
                    last_expense_insured: '1.5M',
                    lastExpenseInsured: 1500000,
                    year_premium: '720,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '63,000',
                        yearly_premium: '720,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '720,000',
                        yearly_premium: '720,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Biggie",
                    code_name: "BIGGIE",
                    premium: '77,000',
                    sum_insured: '5M',
                    sumInsured: 5000000,
                    last_expense_insured: '2M',
                    lastExpenseInsured: 2000000,
                    year_premium: '885,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '77,000',
                        yearly_premium: '885,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '885,000',
                        yearly_premium: '885,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  }

                ],
              }, {
                name: "Self+Spouse+4 Children",
                code_name: "M+5",
                packages: [
                  {
                    name: "Mini",
                    code_name: "MINI",
                    premium: '60,000',
                    sum_insured: '1.5M',
                    sumInsured: 1500000,
                    last_expense_insured: '1M',
                    lastExpenseInsured: 1000000,
                    year_premium: '720,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '60,000',
                        yearly_premium: '720,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '720,000',
                        yearly_premium: '720,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Midi",
                    code_name: "MIDI",
                    premium: '75,000',
                    sum_insured: '3M',
                    sumInsured: 3000000,
                    last_expense_insured: '1.5M',
                    lastExpenseInsured: 1500000,
                    year_premium: '860,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '75,000',
                        yearly_premium: '860,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '860,000',
                        yearly_premium: '860,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Biggie",
                    code_name: "BIGGIE",
                    premium: '93,000',
                    sum_insured: '5M',
                    sumInsured: 5000000,
                    last_expense_insured: '2M',
                    lastExpenseInsured: 2000000,
                    year_premium: '1,060,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '93,000',
                        yearly_premium: '1,060,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '1,060,000',
                        yearly_premium: '1,060,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  }

                ],
              }, {
                name: "Self+Spouse+5 Children",
                code_name: "M+6",
                packages: [
                  {
                    name: "Mini",
                    code_name: "MINI",
                    premium: '70,000',
                    sum_insured: '1.5M',
                    sumInsured: 1500000,
                    last_expense_insured: '1M',
                    lastExpenseInsured: 1000000,
                    year_premium: '840,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '70,000',
                        yearly_premium: '840,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '840,000',
                        yearly_premium: '840,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Midi",
                    code_name: "MIDI",
                    premium: '88,000',
                    sum_insured: '3M',
                    sumInsured: 3000000,
                    last_expense_insured: '1.5M',
                    lastExpenseInsured: 1500000,
                    year_premium: '1,010,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '88,000',
                        yearly_premium: '1,010,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '1,010,000',
                        yearly_premium: '1,010,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  },
                  {
                    name: "Biggie",
                    code_name: "BIGGIE",
                    premium: '108,000',
                    sum_insured: '5M',
                    sumInsured: 5000000,
                    last_expense_insured: '2M',
                    lastExpenseInsured: 2000000,
                    year_premium: '1,238,000',
                    payment_options: [
                      {
                        name: 'Monthly',
                        code_name: 'monthly',
                        premium: '108,000',
                        yearly_premium: '1,238,000',
                        installment_type: 1,
                        period: 'monthly'
                      },
                      {
                        name: 'Yearly',
                        code_name: 'yearly',
                        premium: '1,238,000',
                        yearly_premium: '1,238,000',
                        installment_type: 2,
                        period: 'yearly'
                      }
                    ]
                  }

                ],
              }
            ];
            let policy_end_date = moment(Policypayment.policy_end_date).add(1, 'years').format("YYYY-MM-DD")
            let policy_type: any, beneficiary: any, total_member_number: any, sum_insured: any, last_expense_insured: any, installment_type: any, premium: any,yearly_premium: any, policy_pending_premium: any
            console.log("Policypayment.payment_amount", Policypayment.payment_amount)

            //if premium 10,000 , 14000, 18000 are included in the coverTypes array
            if (Policypayment.payment_amount == 10000 || Policypayment.payment_amount == 14000 || Policypayment.payment_amount == 18000 || Policypayment.payment_amount == 208000 || Policypayment.payment_amount == 167000 || Policypayment.payment_amount == 120000 ){
              coverTypes.forEach((cover) => {

                policy_type = cover.name;
                beneficiary = "SELF"
                total_member_number = 'M'
                sum_insured = cover.sumInsured;
                last_expense_insured = cover.lastExpenseInsured;
                premium = cover.premium.replace(/,/g, '');
                installment_type = 2;
                yearly_premium = cover.yearPemium;
                policy_pending_premium=cover.yearPemium - parseInt(cover.premium.replace(/,/g, ''))
                


              });

              if(Policypayment.payment_amount == 208000 || Policypayment.payment_amount == 167000 || Policypayment.payment_amount == 120000){
                installment_type = 1;
                policy_pending_premium=0
              }
            } else  {
              covers.forEach((cover) => {

                console.log("COVER", cover)
                cover.packages.forEach((pack) => {
                  console.log("PACK", pack)
                  pack.payment_options.forEach((option) => {
                    console.log("option", option)
                    if (parseInt(option.premium.replace(/,/g, ''))== Policypayment.payment_amount) {
                      policy_type = pack.code_name;
                      beneficiary = "FAMILY"
                      total_member_number = cover.code_name;
                      sum_insured = pack.sumInsured;
                      last_expense_insured = pack.lastExpenseInsured;
                      premium = pack.premium.replace(/,/g, '');
                      installment_type = option.installment_type;
                      yearly_premium = pack.year_premium.replace(/,/g, '');
                      policy_pending_premium=parseInt(pack.year_premium.replace(/,/g, '')) - parseInt(pack.premium.replace(/,/g, ''))
                    }
                  });
                });
              });

            }
            console.log("Policypayment.payment_amount", Policypayment.payment_amount)
            console.log("policy_type", policy_type)
            console.log("beneficiary", beneficiary)
            console.log("total_member_number", total_member_number)
            console.log("sum_insured", sum_insured)
            console.log("last_expense_insured", last_expense_insured)
            console.log("premium", premium)

            let excistingPolicy = await db.policies.findAll({
              where: {
                policy_id: Policypayment.policy_id,

              }
            })
            console.log("excistingPolicy", excistingPolicy)
            if (excistingPolicy.length == 0) {
              let policy = await db.policies.create({
                policy_id: Policypayment.policy_id,
                policy_number: `BW${phone_number}`,
                premium: premium,
                policy_paid_date: transaction_date,
                policy_paid_amount: premium,
                airtel_money_id: airtel_money_id,
                bluewave_transaction_id: payment_id,
                policy_status: 'paid',
                user_id: existingUser.user_id,
                phone_number: `+256${phone_number}`,
                policy_start_date: transaction_date,
                policy_end_date: policy_end_date,
                policy_type: policy_type,
                total_member_number: total_member_number,
                beneficiary: beneficiary,
                sum_insured: sum_insured,
                last_expense_insured: last_expense_insured,
                yearly_premium:yearly_premium,
                policy_pending_premium: policy_pending_premium,
                installment_type: installment_type,
                installment_order: 1,
                partner_id: 2,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: "d18424d6-5316-4e12-9826-302b866a380c",
              }
              )
              console.log("POLICY CREATED", policy)
            } else (
              console.log("POLICY ALREADY EXIST")
            )
          }
        }
      } else {
        console.log(`No user found for ${payment['Sender Mobile Number']}`)
      }

    }

    return res.status(200).json({ message: "Reconciliation done successfully" });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}


/**
 * @swagger
 * /api/v1/reports/policy/reconciliation:
 *   post:
 *     tags:
 *       - Reports
 *     description: Policy Reconciliation
 *     operationId: Policy Reconciliation
 *     summary: Policy Reconciliation
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: transaction_date
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: phone_number
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: premium
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
async function policyReconciliation(req, res) {

  try {
    let { partner_id, phone_number, transaction_date, premium } = req.query;

    // convert  10/1/2024 21:17:00 to 01/10/2024 21:17:00
    transaction_date = moment(transaction_date, "DD/MM/YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss")

    const policy = await db.policies.findOne({
      where: {
        phone_number: `+256${phone_number}`,
        premium: premium,


      },
      limit: 1,
    });
    console.log("policy", policy)

    if (policy) {

      await db.policies.update(
        {
          policy_status: "paid",
          policy_paid_date: new Date(transaction_date),
          policy_paid_amount: premium,
          policy_start_date: new Date(transaction_date),


        },
        { where: { policy_id: policy.policy_id } }
      );

      await db.payments.update(
        { payment_status: "paid" },
        { where: { policy_id: policy.policy_id } }
      );

      // update number of policies paid for user
      const user = await db.users.findOne({
        where: {
          user_id: policy.user_id,
        },
        limit: 1,
      });

      // count number of policies paid for user

      let policies = await Policy.findAndCountAll({
        where: {
          user_id: policy.user_id,
          policy_status: "paid",
        },
        limit: 30,
      });

      await db.users.update(
        { number_of_policies: policies.count },
        { where: { user_id: user.user_id } }
      );
    }

    if (!policy) {
      return res.status(404).json({ message: `No paid policy found for ${phone_number}` });
    }

    return res.status(200).json({ message: "Policy Reconciliation done successfully" });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}


module.exports = {
  policyReconciliation,
  paymentReconciliation,
  getPolicySummary,
  getClaimSummary,
  getAllReportSummary,
  getDailyPolicySalesReport,
  getPolicyExcelReportDownload,
  getAggregatedDailyPolicySalesReport,
  getAggregatedAnnuallyPolicySalesReport,
  getAggregatedMonthlySalesReport,
  handlePolicyDownload,
  handleUsersDownload,
  handleClaimDownload,
  getClaimExcelReportDownload,
  getUserExcelReportDownload
};
