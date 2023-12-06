import { db } from "../models/db";
import { processPolicy, updateUserPolicyStatus } from "../routes/ussdRoutes";
import { fetchMemberStatusData } from "../services/aar";
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

    let total_policy_premium_paid = await db.policies.sum("policy_deduction_amount", {
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

    let total_policies_renewed_premium = await db.policies.sum("policy_deduction_amount", {
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
      limit: 1000,
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
    const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

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
      arr_member_number: policy.arr_member_number,
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
      tax_rate_vat: policy.tax_rate_vat,
      tax_rate_ext: policy.tax_rate_ext,
      premium: policy.premium,
      sum_insured: policy.sum_insured,
      last_expense_insured: policy.last_expense_insured,
      excess_premium: policy.excess_premium,
      discount_premium: policy.discount_premium,
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
      product_name: policy.product.product_name,

    });
  });

  return workbook;
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
    console.log("payment_file", payment_file);

    // Read the uploaded Excel file
    const workbook = XLSX.readFile(payment_file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[1]];

    // Convert worksheet data to an array of objects
    const paymentDataArray = XLSX.utils.sheet_to_json(worksheet);

    let userPhoneNumbers = [];
    for (let payment of paymentDataArray) {
      let existingUser = await db.users.findOne({
        where: {
          phone_number: `${payment['Sender Mobile Number']}`,
          partner_id: partner_id,
        },
        limit: 1,
      });
      console.log("existingUser", existingUser.name)
      if (!existingUser) {
        throw new Error("User not found");  
      }


      console.log("payment", payment)
      userPhoneNumbers.push({
        phone_number: payment['Sender Mobile Number'],
        premium: payment['Approved value'],
        airtel_money_id: payment['Transaction ID'],
        payment_id: payment['External Reference'],
        policy_paid_date: payment['Transaction Date'],
      });

      let myPolicy = await db.policies.findOne({
        where: {
          phone_number: `+256${payment['Sender Mobile Number']}`,
          premium: payment['Approved value'],
          policy_status: "pending",
          //airtel_money_id: payment['Transaction ID'].toString(),
        },
        limit: 1,
        order: [["createdAt", "DESC"]],
      });
      console.log("myPolicy", myPolicy)
      let policy_paid_date = new Date(payment['Transaction Date']);

      if (isNaN(policy_paid_date.getTime())) {
        policy_paid_date = myPolicy.policy_start_date;
      }
      
      if(myPolicy) {
        

      let updatePoliciesPaid = await db.policies.update({
        policy_status: "paid",
        policy_paid_amount: payment['Approved value'],
        policy_paid_date: policy_paid_date,
        premium: payment['Approved value'],

      }, {
        where: {
          phone_number: `+256${payment['Sender Mobile Number']}`,
          policy_status: "pending",
          policy_id: myPolicy.policy_id,
        }
      });
      console.log("updatePoliciesPaid", updatePoliciesPaid)
    
      const policyType = myPolicy.policy_type.toUpperCase();
      const period = myPolicy.installment_type == 1 ? "yearly" : "monthly";

      let updatePayment = await db.payments.update({
        payment_status: "paid",
        payment_type: "airtel money stk push for " + policyType + " " + period + " payment",
        message: `PAID UGX ${payment['Approved value']} to AAR Uganda for ${policyType} Cover, TID: ${payment['Transaction ID']}. Date: ${payment['Transaction Date']}`
      }, {
        where: {
         policy_id: myPolicy.policy_id,
          payment_status: "pending",
          payment_amount: payment['Approved value'],
        }
      });

      console.log("updatePayment", updatePayment)

      let updateTransactions = await db.transactions.update({
        transaction_status: "paid",
      }, {
        where: {
          policy_id: myPolicy.policy_id,
          transaction_status: "pending",
          transaction_amount: payment['Approved value'],
        }
      });

      console.log("updateTransactions", updateTransactions)
      const memberStatus = await fetchMemberStatusData({ member_no: existingUser.arr_member_number, unique_profile_id: existingUser.membership_id + "" });

      console.log("memberStatus", memberStatus)

      // if (myPolicy.installment_order >= 1 && myPolicy.installment_order < 12 && myPolicy.installment_type == 2 && myPolicy.policy_status == "paid") {
      //   console.log("INSTALLMENT ORDER", myPolicy.installment_order, myPolicy.installment_type);
      //   const date = myPolicy.policy_start_date
      //   const installment_alert_date = new Date(date.getFullYear(), date.getMonth() + 1);

      //   let installment_order = myPolicy.installment_order + 1;

      //   let installment = await db.installments.create({
      //     installment_id: uuidv4(),
      //     policy_id: myPolicy.policy_id,
      //     installment_order,
      //     installment_date: new Date(),
      //     installment_alert_date,
      //     tax_rate_vat: myPolicy.tax_rate_vat,
      //     tax_rate_ext: myPolicy.tax_rate_ext,
      //     installment_deduction_amount: myPolicy.policy_deduction_amount,
      //     premium: myPolicy.premium,
      //     sum_insured: myPolicy.sum_insured,
      //     excess_premium: myPolicy.excess_premium,
      //     discount_premium: myPolicy.discount_premium,
      //     currency_code: myPolicy.currency_code,
      //     country_code: myPolicy.country_code,
      //   });

      // }
      // let updatedPolicy = await updateUserPolicyStatus(myPolicy, parseInt(myPolicy.premium), myPolicy.installment_order, myPolicy.installment_type, payment, payment['Transaction ID'],);

      // console.log("updatedPolicy", updatedPolicy)

      const members = myPolicy.total_member_number?.match(/\d+(\.\d+)?/g);
      console.log("MEMBERS", members, myPolicy.total_member_number);


      const sumInsured = formatAmount(myPolicy.sum_insured);
      const lastExpenseInsured = formatAmount(myPolicy.last_expense_insured);
      console.log("SUM INSURED", sumInsured);
      console.log("LAST EXPENSE INSURED", lastExpenseInsured);

      const thisDayThisMonth = myPolicy.installment_type === 2 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1) : new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1);

      let congratText = "";

      if (myPolicy.beneficiary == "FAMILY") {
        congratText = `Congratulations! You and ${members} dependent are each covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`
      } else if (myPolicy.beneficiary == "SELF")
        congratText = `Congratulations! You are covered for Inpatient benefit of UGX ${sumInsured} and Funeral benefit of UGX ${lastExpenseInsured}. Cover valid till ${thisDayThisMonth.toDateString()}`;
      else if (myPolicy.beneficiary == "OTHER") {
        congratText = `${existingUser.first_name} has bought for you Ddwaliro Care for Inpatient ${sumInsured} and Funeral benefit of ${lastExpenseInsured}. Dial *185*7*6# on Airtel to enter next of kin & view more details`
      }

     // await SMSMessenger.sendSMS(`+256${payment['Sender Mobile Number']}`, congratText);

      // Call the function with the relevant user, policy, and memberStatus
    //  await processPolicy(existingUser, myPolicy, memberStatus);
    let policyPaidCountOfUser = await db.policies.count({ where: { user_id: myPolicy.user_id, policy_status: "paid" } });
    await db.users.update({ number_of_policies: policyPaidCountOfUser }, { where: { user_id: myPolicy.user_id } });
    await db.policies.update({ policy_paid_date: policy_paid_date  }, { where: { policy_id: myPolicy.policy_id , policy_status: "paid" } });

    }
    }

    return res.status(200).json({ message: "Reconciliation done successfully", data: userPhoneNumbers });
  } catch (error) {
    console.log(error)
  }
}


module.exports = {
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
  handleClaimDownload,
  getClaimExcelReportDownload,
};
