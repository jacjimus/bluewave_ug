import { db } from "../models/db";
import { reconcilationCallback } from "../services/payment";

const { Op, QueryTypes, Sequelize } = require("sequelize");
const moment = require("moment");
const excelJS = require("exceljs");
const fs = require("fs");
const path = require("path")
const XLSX = require("xlsx");
const redisClient = require("../middleware/redis");

const Policy = db.policies;
const User = db.users;
const Claim = db.claims;
const Product = db.products;
const Partner = db.partners;


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

    endDate = new Date(moment(endDate).add(1, 'days').format("YYYY-MM-DD"))

    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD hh:mm');
    const endOfMonth = moment().endOf('month').format('YYYY-MM-DD hh:mm');

    const total_policies_renewal = await db.policies.findAll({
      attributes: [
        [db.sequelize.fn('count', db.sequelize.col('*')), 'total_renewals'],
        [db.sequelize.fn('sum', db.sequelize.col('policy_paid_amount')), 'total_renewals_premium']
      ],
      where: {
        partner_id,
        policy_status: "paid",
        [Op.or]: [
          { installment_order: { [Op.gt]: 1 } },
          {
            policy_status: 'paid',
            policy_paid_date: { [Op.between]: [startOfMonth, endOfMonth] }
          }
        ]
      }
    });

    const total_policies_renewed_count = total_policies_renewal[0].dataValues.total_renewals;
    const total_policies_renewed_premium = total_policies_renewal[0].dataValues.total_renewals_premium;

    const [total_users_count, total_users_with_policy, total_policies_paid_count, total_policy_premium_paid, total_paid_payments_count] = await Promise.all([
      // Total Users Count
      db.users.count({
        where: {
          partner_id,
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      }),
      // Total Users with Policy Count
      db.users.count({
        where: {
          partner_id,
          createdAt: {
            [Op.between]: [startDate, endDate]
          },
          arr_member_number: {
            [Op.not]: null
          }
        }
      }),

      // Total Policies Paid Count
      db.sequelize.query(
        `SELECT COUNT(*) AS count 
     FROM (SELECT DISTINCT airtel_money_id, phone_number, premium 
           FROM policies 
           WHERE partner_id = :partner_id 
             AND policy_status = 'paid' 
             AND policy_paid_date BETWEEN :startDate AND :endDate) AS distinct_policies`,
        {
          replacements: { partner_id, startDate, endDate },
          type: QueryTypes.SELECT
        }
      ).then(result => result[0].count),

      // Total Policy Premium Paid
      db.sequelize.query(
        `SELECT SUM(policy_paid_amount) AS total_premium 
     FROM (SELECT DISTINCT ON (airtel_money_id, phone_number, premium) policy_paid_amount 
           FROM policies 
           WHERE partner_id = :partner_id 
             AND policy_status = 'paid' 
             AND policy_paid_date BETWEEN :startDate AND :endDate) AS distinct_policies`,
        {
          replacements: { partner_id, startDate, endDate },
          type: QueryTypes.SELECT
        }
      ).then(result => result[0].total_premium),

      // Total Paid Payments Count
      db.sequelize.query(
        `SELECT COUNT(*) AS count 
     FROM (SELECT DISTINCT policy_id, payment_amount 
           FROM payments 
           WHERE payment_status = 'paid' 
             AND partner_id = :partner_id) AS distinct_payments`,
        {
          replacements: { partner_id },
          type: QueryTypes.SELECT
        }
      ).then(result => result[0].count)
    ]);


    let summary = {
      total_users: total_users_count,
      total_users_with_policy: total_users_with_policy,
      total_policies_paid: total_policies_paid_count,
      total_policies_premium_paid: total_policy_premium_paid,
      total_preimum_amount: total_policy_premium_paid,
      total_paid_payment_amount: total_paid_payments_count,
      total_policies_renewed: total_policies_renewed_count,
      total_policies_renewed_premium: total_policies_renewed_premium,

    };

    console.log("Summary", summary);

    let country_code, currency_code;

    const partnerCountries = {
      1: { country_code: "KE", currency_code: "KES" },
      2: { country_code: "UG", currency_code: "UGX" },
      3: { country_code: "CD", currency_code: "COD" },
      4: { country_code: "KE", currency_code: "KES" },
      // Add more partner countries as needed
    };

    const selectedPartner = partnerCountries[partner_id];

    if (selectedPartner) {
      country_code = selectedPartner.country_code;
      currency_code = selectedPartner.currency_code;
    } else {
      console.error("Invalid partner_id");
    }

    // await redisClient.set(cacheKey, JSON.stringify({
    //   result: {
    //     code: 200,
    //     status: "OK",
    //     countryCode: country_code,
    //     currencyCode: currency_code,
    //     items: summary,
    //   },
    // }), 'EX', 3600);

    return res.status(200).json({
      result: {
        code: 200,
        status: "OK",
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


    return res.status(200).json({
      result: {
        code: 200,
        status: "OK",
        countryCode: partner_id === 1 ? "KE" : "UG",
        currencyCode: partner_id === 1 ? "KES" : "UGX",
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




    const summary = {
      countryCode: partner_id === 1 ? "KE" : "UG",
      currencyCode: partner_id === 1 ? "KES" : "UGX",
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
    return res.status(200).json({ summary });
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
const getSalesReportByPeriod = async (req: any, periodType: string) => {
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

/*
 help function  for daily tracker

 1. Daily successful payment 
2. ⁠daily failed payment 
3. ⁠daily wrong pin failed payment 
4. ⁠daily insufficient funds failed payment 
5. ⁠daily number of policies paid 
6. ⁠daily number of product type sold “biggie, s mini, mini”
This should come in an array of objects, each object representing day of the month let’s say 1,2 to 31
each day has the above data for that day

sample of response
 { “data”:
 "1": { 
 "Successful_payment": 100303, 
 "Failed_payment": "2", 
 "Wrong_pin_failed_payment": "2", 
 "insufficinet_funds_failed_payament": 2069, 
 "Total_paid_policies": "16" ,
“Product_types_sold”: products:{
“biggie”:”13”,
“Mini”:”10”,
“S Mini”:”12”
 } 
}
*/

const getDailyPolicySalesReport = async (req: any, res: any) => {
  try {
    // Fetch sales reports for different periods
    const [dailyReport, weeklyReport, monthlyReport, yearlyReport] = await Promise.all([
      getSalesReportByPeriod(req, 'daily'),
      getSalesReportByPeriod(req, 'weekly'),
      getSalesReportByPeriod(req, 'monthly'),
      getSalesReportByPeriod(req, 'yearly'),
    ]);


    const partnerCountry = await Partner.findOne({
      where: {
        partner_id: req.query.partner_id,
      },
    });

    return res.status(200).json({
      result: {
        code: 200,
        status: "OK",
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
const getPolicyExcelReportDownload = async (req: any, res: any) => {
  let {
    partner_id,
    page = 1,
    limit = 10000,
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
        { arr_member_number: { [Op.iLike]: `%${filter}%` } }

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
    console.log("BASE_URL:", BASE_URL, process.env.ENVIROMENT);

    // Generate a unique download token
    const downloadToken = Date.now();

    // Create a URL for the download endpoint including the token
    // the file is located at src/uploads/policy_report.xlsx
    const downloadURL = `${BASE_URL}/api/v1/reports/policy/excel/download?token=${downloadToken}`;
    console.log("Download URL:", downloadURL);

    // Return the download URL to the user
    return res.status(200).json({ downloadURL });
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Download endpoint handler
const handlePolicyDownload = (req: any, res: any) => {
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
const handleUsersDownload = (req: any, res: any) => {
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

const handleClaimDownload = (req: any, res: any) => {
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
    //{ header: "Policy Number", key: "policy_number", width: 20 },
    { header: "Full Name", key: "full_name", width: 20 },
    { header: "Phone Number", key: "phone_number", width: 20 },
    { header: "AAR Member Number", key: "arr_member_number", width: 20 },
    { header: "Policy Category", key: "beneficiary", width: 20 },
    { header: "Policy Type", key: "policy_type", width: 20 },
    { header: "Family Size", key: "total_member_number", width: 20 },
    { header: "Total Lives Covered", key: "total_lives_covered", width: 20 },
    { header: "Policy Status", key: "policy_status", width: 20 },
    { header: "Installment Type", key: "installment_type", width: 20 },
    { header: "Installment Order", key: "installment_order", width: 20 },
    { header: "Policy End Date", key: "policy_end_date", width: 20 },
    { header: "Policy Paid Date", key: "policy_start_date", width: 20 },
    { header: "Premium", key: "premium", width: 20 },
    { header: "Policy Paid Amount", key: "policy_paid_amount", width: 20 },
    { header: "Policy Pending Amount", key: "policy_pending_premium", width: 20 },
    { header: "Airtel Money ID", key: "airtel_money_id", width: 20 },
    { header: "Sum Insured", key: "sum_insured", width: 20 },
    { header: "Last Expense Insured", key: "last_expense_insured", width: 20 },
    { header: "Created At", key: "createdAt", width: 20 },


  ];

  function calculateTotalLivesCovered(memberNumberString: string) {

    let memberNumber = parseInt(memberNumberString.replace('M', ''), 10);
    memberNumber = isNaN(memberNumber) ? 1 : memberNumber + 1

    return memberNumber
  }

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
      total_lives_covered: calculateTotalLivesCovered(policy.total_member_number),
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
      policy_paid_amount: policy.policy_paid_amount,
      policy_pending_premium: policy.policy_pending_premium,
      sum_insured: policy.sum_insured,
      last_expense_insured: policy.last_expense_insured,
      hospital_details: policy.hospital_details,
      policy_documents: policy.policy_documents,
      policy_paid_date: moment(policy.policy_paid_date).format("YYYY-MM-DD"),
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
const getUserExcelReportDownload = async (req: any, res: any) => {
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
    return res.status(200).json({ downloadURL });
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
const getAggregatedDailyPolicySalesReport = async (req: any, res: any) => {
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
    return res.status(200).json({ data });
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
const getAggregatedAnnuallyPolicySalesReport = async (req: any, res: any) => {
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
    return res.status(200).json({ data });
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
const getAggregatedMonthlySalesReport = async (req: any, res: any) => {
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
    const data = {
      labels: labels,
      datasets: datasets,
      total_policies: results.length,
      total_customers: new Set(results.map((item) => item.day)).size, // Adjusted for distinct users
      total_amount: results.reduce((acc, item) => acc + parseInt(item.total_amount), 0),
      countryCode: partnerData.country_code,
      currencyCode: partnerData.currency_code,
    };

    return res.status(200).json({ data });
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
const getClaimExcelReportDownload = async (req: any, res: any) => {

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
    return res.status(200).json({ downloadURL });
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
 *         multipart/form-data: 
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
    // Check if a file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const payment_file = req.file;

    // Read the uploaded Excel file
    const workbook = XLSX.readFile(payment_file.path, { cellDates: true, dateNF: 'mm/dd/yyyy hh:mm:ss' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Check if worksheet exists
    if (!worksheet) {
      return res.status(400).json({ message: "Empty worksheet in the Excel file" });
    }

    // Convert worksheet data to an array of objects
    const paymentDataArray = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    for (let payment of paymentDataArray) {
      // Replace '-' with '/' in the date
      payment['Transaction Date'] = payment['Transaction Date'].replace(/-/g, '/');

      // Split the date into components and rearrange them
      let components = payment['Transaction Date'].split(/[/\s:]/);
      let convertedDate = `${components[1]}/${components[0]}/${components[2]} ${components[3]}:${components[4]}`;

      // Parse the date using moment.js
      let transaction_date = moment(convertedDate);

      // Remove commas from the payment amount
      let premium = payment['Transaction Amount'].replace(/,/g, '');

      // Construct data object
      let data = {
        phone_number: `+256${payment['Sender Mobile Number']}`,
        airtel_money_id: payment['Transaction ID'],
        premium: premium
      };

      // Retrieve policy from the database
      let policy = await db.policies.findOne({
        where: {
          phone_number: data.phone_number,
          premium: premium,
          policy_status: 'paid',
          partner_id: 2

        },

        limit: 1,
      });

      // Update policy if it's paid and airtel money details are missing
      if (policy && (policy.airtel_money_id === null)) {
        await db.policies.update({
          airtel_money_id: data.airtel_money_id,

        }, {
          where: {
            policy_id: policy.policy_id,
          },
        });
      } else {

      }
    }

    return res.status(200).json({ status: "OK", message: "Payment Reconciliation done successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "FAILED", message: "Internal server error", error: error.message });
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
 *       - name: airtel_money_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: renewal
 *         in: query
 *         required: true
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
async function policyReconciliation(req: any, res: any) {

  try {
    let { renewal, airtel_money_id, phone_number, transaction_date, premium } = req.query;
    let result = {
      message: "error",
      code: 404
    }
    //4/2/2024 = 4th Feb 2024

    transaction_date = moment(transaction_date, "YYYY-MM-DD h:mm A");

    console.log(`transaction_date, ${transaction_date}`)
    console.log(`premium, ${premium}`)
    console.log(`existingUser,${phone_number}`)

    let policy_status = renewal ? 'paid' : 'pending';

    let policy = await db.policies.findOne({
      where: {
        partner_id: 2,
        policy_status: policy_status,
        phone_number: `+256${phone_number}`,
        policy_deduction_amount: premium,      },
      include: [{
        model: db.users,
        where: {
          partner_id: 2
        }
      }],
      limit: 1,
    });

    let payment = await db.payments.findOne({
      where: {
        policy_id: policy.policy_id,
        payment_amount: premium,

      },
      limit: 1,
    });
    

    console.log("====== PAYMENT - RECON =====", payment?.payment_status, payment?.payment_amount, payment?.payment_date, payment?.payment_metadata?.transaction)

    console.log("===== POLICY  - RECON =====", policy.policy_status, policy.premium, policy.policy_paid_date, policy.policy_paid_amount)

    if (!policy || !payment) {
      return res.status(400).json({ status: "FAILED", message: "Policy already reconciled" });
    }

    let transactionId = await db.transactions.findOne({
      where: {
        policy_id: policy.policy_id,
      },
      limit: 1,
    });


    let paymentCallback = {
      transaction: {
        id: transactionId.transaction_id,
        message: `PAID UGX ${premium} to AAR Uganda for ${policy.beneficiary} ${policy.policy_status} Cover Charge UGX 0. Bal UGX ${premium}. TID: ${airtel_money_id}. Date: ${transaction_date}`,
        status_code: "TS",
        airtel_money_id: airtel_money_id,
        payment_date: transaction_date
      }
    }

    result = await reconcilationCallback(paymentCallback.transaction)



    return res.status(200).json({ status: "OK", message: "Policy Reconciliation done successfully", result });
  } catch (error) {
    console.log(error)
    res.status(500).json({ status: "FAILED", message: "Internal server error", error: error.message });
  }
}


/**
 * @swagger
 * /api/v1/reports/policy/summary/snapshot:
 *   get:
 *     tags:
 *       - Reports
 *     description: Policy Summary Snapshot
 *     operationId: Policy Summary Snapshot
 *     summary: Policy Summary Snapshot
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
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
 *       - name: category
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: policy_type
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: policy_duration
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */

async function getPolicySummarySnapshot(req, res) {
  try {

    console.log(" ====== GetPolicySummarySnapshot =======")
    let { partner_id, start_date, end_date, category, policy_type, policy_duration } = req.query;

    if (!start_date) {
      start_date = moment().startOf('year').format("YYYY-MM-DD");
    }

    if (!end_date) {
      end_date = moment().endOf('year').format("YYYY-MM-DD");
    }

    if (start_date > end_date) {
      return res.status(400).json({
        code: 400,
        status: "FAILED",
        message: "Start date cannot be after end date",
      });
    }


    const cacheKey = `policy_summary_snapshot_${partner_id}_${start_date}_${end_date}_${category}_${policy_type}_${policy_duration}`;
    console.log("cacheKey", cacheKey)
    // Check Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("cachedData", cachedData)
      return res.status(200).json(JSON.parse(cachedData));
    }

    const startDate = moment(start_date).startOf('quarter');
    const endDate = moment(end_date).endOf('quarter');
    const quarterRanges = [];

    for (let quarterStart = moment(startDate); quarterStart.isBefore(endDate); quarterStart.add(3, 'months')) {
      const quarterEnd = moment(quarterStart).endOf('quarter');
      console.log("quarterStart", quarterStart)
      quarterRanges.push({ start: quarterStart.clone(), end: quarterEnd.clone() });
    }

    const fetchPromises = quarterRanges.map(async (quarter) => {
      const months = [];
      for (let monthStart = quarter.start.clone(); monthStart.isBefore(quarter.end); monthStart.add(1, 'month')) {
        const monthEnd = monthStart.clone().endOf('month');
        const monthData = await fetchMonthData(partner_id, monthStart, monthEnd, category, policy_type, policy_duration);
        months.push(monthData);
      }

      const accumulated_report = months.reduce((acc, month) => {
        acc.free_policies += month.free_policies;
        acc.active_policies += month.active_policies;
        acc.first_time_policies += month.first_time_policies;
        acc.renewals += month.renewals;
        acc.free_policy_expiration += month.free_policy_expiration;
        acc.paid_policy_expiration += month.paid_policy_expiration;
        acc.cancelled_policies += month.cancelled_policies;
        acc.retention_rate += parseFloat(month.retention_rate);
        acc.conversion_rate += parseFloat(month.conversion_rate);
        acc.total_premium += month.total_premium;
        return acc;
      }, {
        free_policies: 0,
        active_policies: 0,
        first_time_policies: 0,
        renewals: 0,
        free_policy_expiration: 0,
        paid_policy_expiration: 0,
        cancelled_policies: 0,
        retention_rate: 0,
        conversion_rate: 0,
        total_premium: 0
      });

      console.log("accumulated_report.retention_rate", accumulated_report.retention_rate)
      accumulated_report.retention_rate = (accumulated_report.retention_rate / months.length).toFixed(2);
      accumulated_report.conversion_rate = (accumulated_report.conversion_rate / months.length).toFixed(2);

      return {
        quarter: quarter.start.format('Q YYYY'),
        accumulated_report,
        months
      };
    });


    console.log("fetchPromises", fetchPromises)
    const quarterData = await Promise.all(fetchPromises);
    console.log("quarterData", quarterData)

    const annualReport = quarterData.reduce((acc, quarter) => {
      for (const key in acc) {
        if (Object.prototype.hasOwnProperty.call(acc, key)) {
          acc[key] += quarter.accumulated_report[key];
        }
      }
      return acc;
    }, {
      free_policies: 0,
      active_policies: 0,
      first_time_policies: 0,
      renewals: 0,
      free_policy_expiration: 0,
      paid_policy_expiration: 0,
      cancelled_policies: 0,
      retention_rate: 0,
      conversion_rate: 0,
      total_premium: 0,

    });

    console.log("annualReport", annualReport)
    annualReport.retention_rate = Number((annualReport.retention_rate / quarterData.length).toFixed(2))
    annualReport.conversion_rate = Number((annualReport.conversion_rate / quarterData.length).toFixed(2))

    // Store result in Redis cache with an expiration time (e.g., 1 hour)
    await redisClient.set(cacheKey, JSON.stringify({
      status: "OK",
      message: "Policy Summary snapshot fetched successfully",
      annualReport,
      quarterData,
    }), 'EX', 3600);

    return res.status(200).json({ status: "OK", message: "Policy Summary snapshot fetched successfully", annualReport, quarterData });
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ status: "FAILED", message: "Internal server error" });
  }
}

// async function getPolicySummarySnapshot(req, res) {
//   try {
//     let { partner_id, start_date, end_date, category, policy_type, policy_duration } = req.query;

//     // if date is not provided, use the this year
//     // Set default start and end dates if not provided
//     if (!start_date) {
//       start_date = moment().startOf('year').format("YYYY-MM-DD");
//     }

//     if (!end_date) {
//       end_date = moment().endOf('year').format("YYYY-MM-DD");
//     }

//     // Validate start date and end date
//     if (start_date > end_date) {
//       return res.status(400).json({
//         code: 400,
//         status: "FAILED",
//         message: "Start date cannot be after end date",
//       });
//     }


//     // Initialize quarterData array to hold data for each quarter
//     const quarterData = [];

//     // Split the date range into quarters
//     const quarterStartDate = moment(start_date).startOf('quarter');
//     const quarterEndDate = moment(end_date).endOf('quarter');

//     // Loop through each quarter
//     for (let quarterStart = moment(quarterStartDate); quarterStart.isBefore(quarterEndDate); quarterStart.add(1, 'quarter')) {
//       const quarterEnd = moment(quarterStart).endOf('quarter');

//       // Initialize months array to hold data for each month within the quarter
//       const months = [];

//       // Loop through each month within the quarter
//       for (let monthStart = moment(quarterStart); monthStart.isBefore(quarterEnd); monthStart.add(1, 'month')) {
//         const monthEnd = moment(monthStart).endOf('month');

//         // Fetch data for each month
//         const monthData = await fetchMonthData(partner_id, monthStart, monthEnd, category, policy_type, policy_duration)

//         months.push(monthData);
//       }


//       // Construct data object for the quarter
//       const quarterDataObject = {
//         quarter: quarterStart.format('Q YYYY'),
//         accumulated_report: {
//           free_policies: months.reduce((acc, month) => acc + month.free_policies, 0),
//           active_policies: months.reduce((acc, month) => acc + month.active_policies, 0),
//           first_time_policies: months.reduce((acc, month) => acc + month.first_time_policies, 0),
//           renewals: months.reduce((acc, month) => acc + month.renewals, 0),
//           free_policy_expiration: months.reduce((acc, month) => acc + month.free_policy_expiration, 0),
//           paid_policy_expiration: months.reduce((acc, month) => acc + month.paid_policy_expiration, 0),
//           cancelled_policies: months.reduce((acc, month) => acc + month.cancelled_policies, 0),
//           retention_rate: (months.reduce((acc, month) => acc + month.retention_rate, 0) / months.length).toFixed(2),
//           conversion_rate: (months.reduce((acc, month) => acc + month.conversion_rate, 0) / months.length).toFixed(2),
//           total_premium: months.reduce((acc, month) => acc + month.total_premium, 0),
//         },
//         months: months

//       };


//       // Push the quarter data object to quarterData array
//       quarterData.push(quarterDataObject);
//     }


//     // Construct annual report
//     const annualReport = {
//       accumulated_report: {
//         free_policies: quarterData.reduce((acc, quarter) => acc + quarter.accumulated_report.free_policies, 0),
//         active_policies: quarterData.reduce((acc, quarter) => acc + quarter.accumulated_report.active_policies, 0),
//         first_time_policies: quarterData.reduce((acc, quarter) => acc + quarter.accumulated_report.first_time_policies, 0),
//         renewals: quarterData.reduce((acc, quarter) => acc + quarter.accumulated_report.renewals, 0),
//         free_policy_expiration: quarterData.reduce((acc, quarter) => acc + quarter.accumulated_report.free_policy_expiration, 0),
//         paid_policy_expiration: quarterData.reduce((acc, quarter) => acc + quarter.accumulated_report.paid_policy_expiration, 0),
//         cancelled_policies: quarterData.reduce((acc, quarter) => acc + quarter.accumulated_report.cancelled_policies, 0),
//         retention_rate: (quarterData.reduce((acc, quarter) => acc + parseFloat(quarter.accumulated_report.retention_rate), 0) / quarterData.length).toFixed(2),
//         conversion_rate: (quarterData.reduce((acc, quarter) => acc + parseFloat(quarter.accumulated_report.conversion_rate), 0) / quarterData.length).toFixed(2),
//         total_premium: quarterData.reduce((acc, quarter) => acc + quarter.accumulated_report.total_premium, 0),
//       }
//     };


//     // Return the quarterData in the response
//     return res.status(200).json({ status: "OK", message: "Policy Summary snapshot fetched successfully", annualReport, quarterData });
//   }
//   catch (error) {
//     console.log(error)
//     res.status(500).json({ status: "FAILED", message: "Internal server error" });
//   }
// }

async function fetchMonthData(partner_id, monthStart, monthEnd, category, policy_type, policy_duration) {
  const startDate = new Date(monthStart);
  const endDate = new Date(moment(monthEnd).add(1, 'days').format("YYYY-MM-DD"));

  const whereConditions = {
    partner_id: partner_id,
    policy_start_date: { [Op.gte]: startDate, [Op.lt]: endDate },
    ...(category && { beneficiary: category }),
    ...(policy_type && { policy_type }),
    ...(policy_duration && { installment_type: policy_duration })
  };

  const [freePolicies, policyRenewals, freePoliciesExpirations, policyExpirations, totalPremium, firstTimePolicies, activePolicies, cancelledPolicies] = await Promise.all([
    db.policies.findAndCountAll({ where: { ...whereConditions, policy_status: 'pending' } }),
    db.policies.findAndCountAll({ where: { ...whereConditions, policy_status: 'paid', installment_order: { [Op.gt]: 1 } } }),
    db.policies.findAndCountAll({ where: { ...whereConditions, policy_status: 'pending', policy_end_date: { [Op.gte]: startDate, [Op.lt]: endDate } } }),
    db.policies.findAndCountAll({ where: { ...whereConditions, policy_status: 'expired', policy_end_date: { [Op.gte]: startDate, [Op.lt]: endDate } } }),
    db.policies.findAll({
      where: { ...whereConditions, policy_status: 'paid', policy_paid_date: { [Op.gte]: startDate, [Op.lt]: endDate } },
      attributes: [[Sequelize.fn('sum', Sequelize.col('policy_paid_amount')), 'total_premium']]
    }),
    db.policies.findAndCountAll({
      where: { ...whereConditions, policy_status: 'paid', installment_order: 1 },
      attributes: [[Sequelize.fn('count', Sequelize.col('policy_id')), 'first_time_policies']]
    }),
    db.policies.findAndCountAll({ where: { ...whereConditions, policy_status: 'paid' }, attributes: [[Sequelize.fn('count', Sequelize.col('policy_id')), 'active_policies']] }),
    db.policies.findAndCountAll({ where: { ...whereConditions, policy_status: 'cancelled' }, attributes: [[Sequelize.fn('count', Sequelize.col('policy_id')), 'cancelled_policies']] })
  ]);

  const retentionRate = ((policyRenewals.count / (activePolicies.count + policyExpirations.count)) * 100).toFixed(2);
  const conversionRate = ((firstTimePolicies.count / freePolicies.count) * 100).toFixed(2);

  return {
    month: monthStart.format('MMMM YYYY'),
    month_number: Number(monthStart.format('MM')),
    free_policies: freePolicies.count,
    active_policies: activePolicies.count,
    first_time_policies: firstTimePolicies.count,
    renewals: policyRenewals.count,
    free_policy_expiration: freePoliciesExpirations.count,
    paid_policy_expiration: policyExpirations.count,
    cancelled_policies: cancelledPolicies.count,
    retention_rate: parseInt(retentionRate) || 0,
    conversion_rate: parseInt(conversionRate) || 0,
    total_premium: parseInt(totalPremium[0].dataValues.total_premium) || 0
  };
}



/**
 * @swagger
 * /api/v1/reports/daily/policy/sales/stat:
 *   get:
 *     tags:
 *       - Reports
 *     description: Daily policy sales stat
 *     operationId: DailyPolicySalesStat
 *     summary: Daily policy sales stat
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: filterMonth
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
async function getDailySalesReport(req, res) {

  try {
    // let filterMonth = moment().format('MM');
    // CHECK RANGE OF MONTH
    if (req.query.filterMonth < 1 || req.query.filterMonth > 12) {
      return res.status(400).json({ message: 'Invalid or missing month filter' });
    }
    let filterMonth = req.query.filterMonth.toString() || moment().format('MM');

    const query = `
    SELECT
      EXTRACT(DAY FROM policy_paid_date) AS day,
      COUNT(CASE WHEN policies.policy_status = 'paid' THEN 1 END) AS total_paid_policies,
      COUNT(CASE WHEN policies.policy_status = 'failed' THEN 1 END) AS failed_payment,
      COUNT(CASE WHEN policies.policy_status = 'failed' AND payments.payment_metadata->>'error' = 'wrong pin' THEN 1 END) AS wrong_pin_failed_payment,
      COUNT(CASE WHEN policies.policy_status = 'failed' AND payments.payment_metadata->>'error' = 'insufficient funds' THEN 1 END) AS insufficient_funds_failed_payment,
      COUNT(CASE WHEN payments.payment_status = 'paid' THEN 1 END) AS successful_payment,
      COUNT(CASE WHEN  policies.policy_status = 'paid'  AND policies.policy_type = 'BIGGIE' THEN 1 END) AS biggie,
      COUNT(CASE WHEN  policies.policy_status = 'paid'  AND policies.policy_type = 'MIDI' THEN 1 END) AS midi,
      COUNT(CASE WHEN  policies.policy_status = 'paid'  AND policies.policy_type = 'MINI' THEN 1 END) AS mini,
      COUNT(CASE WHEN  policies.policy_status = 'paid'  AND policies.policy_type = 'S MINI' THEN 1 END) AS s_mini
    FROM
      public.policies
      join public.payments on policies.policy_id = payments.policy_id
    WHERE
      EXTRACT(MONTH FROM policies.policy_paid_date) = :filterMonth
      AND policies.partner_id = :partner_id
    GROUP BY
      EXTRACT(DAY FROM policies.policy_paid_date)
    ORDER BY
      day;
  `;

    const results = await db.sequelize.query(query, {
      replacements: { partner_id: req.query.partner_id, filterMonth: filterMonth },
      type: QueryTypes.SELECT,
    });

    console.log("RESULT => ", results);

    const labels = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    const datasets = results.map((item) => {
      return {
        day: item.day,
        successful_payment: item.successful_payment,
        failed_payment: item.failed_payment,
        wrong_pin_failed_payment: item.wrong_pin_failed_payment,
        insufficient_funds_failed_payment: item.insufficient_funds_failed_payment,
        total_paid_policies: item.total_paid_policies,
        products: {
          biggie: item.biggie,
          midi: item.midi,
          mini: item.mini,
          s_mini: item.s_mini,
        },
      };
    });

    const data = {
      labels: labels,
      datasets: datasets,
    };

    return res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }

}






module.exports = {
  policyReconciliation,
  paymentReconciliation,
  getPolicySummary,
  getClaimSummary,
  getAllReportSummary,
  getDailySalesReport,
  getDailyPolicySalesReport,
  getPolicyExcelReportDownload,
  getAggregatedDailyPolicySalesReport,
  getAggregatedAnnuallyPolicySalesReport,
  getAggregatedMonthlySalesReport,
  handlePolicyDownload,
  handleUsersDownload,
  handleClaimDownload,
  getClaimExcelReportDownload,
  getUserExcelReportDownload,
  getPolicySummarySnapshot
};
