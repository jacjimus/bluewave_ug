import { db } from "../models/db";
const { Op, QueryTypes } = require("sequelize");
const moment = require("moment");
const excelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

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
    const today = req.query.today === "true"; // Convert to a boolean value
    const this_week = req.query.this_week === "true"; // Convert to a boolean value
    const this_month = req.query.this_month === "true"; // Convert to a boolean value

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    let startDate, endDate;

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

    let policy;
    if (partner_id == 1) {
      policy = await Policy.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });
    } else {
      policy = await Policy.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          partner_id: partner_id,
        },
      });
    }

    if (!policy || policy.length === 0) {
      return res.status(404).json({ message: "No policies found" });
    }

     
  
        const allUsers = await User.findAll({
          where: {
            partner_id: partner_id,
            },
          });
  
       
    let summary = {
      total_policies: policy.length,
      total_users: allUsers.length,
      total_policies_pending: policy.filter(
        (policy: any) => policy.policy_status == "pending"
      ).length,
      total_policies_paid: policy.filter(
        (policy: any) => policy.policy_status == "paid"
      ).length,
      total_preimum_amount:  policy
      .filter((policy) => policy.policy_status === 'paid')
      .reduce(
        (a: any, b: any) => a + b.policy_paid_amount * 1,
        0
      ),
    };
    // await Log.create({
    //   log_id: uuidv4(),
    //   timestamp: new Date(),
    //   message: 'Policy summary fetched successfully',
    //   level: 'info',
    //   user: req?.user_id,
    //   partner_id: req?.partner_id,
    // });
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

    // await Log.create({
    //   log_id: uuidv4(),
    //   timestamp: new Date(),
    //   message: 'Claim summary fetched successfully',
    //   level: 'info',
    //   user: req?.user_id,
    //   partner_id: req?.partner_id,
    // });

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
      }),
  
    ]);
    
    // Populate user summary
    summary.user.total_users = users.length;
    summary.user.total_users_with_policy = policies.length;
    // summary.user.total_users_active = countUsersByActivity(users, true);


    // // Populate policy summary
    // summary.policy.total_policies = policies.length;
    // summary.policy.total_policies_pending = countPoliciesByStatus(
    //   policies,
    //   "pending"
    // );
   
    summary.policy.total_policies_paid = countPoliciesByStatus(
      policies,
      "paid"
    );
  
    summary.policy.total_premium_amount = calculateTotalPremiumAmount(policies);
    // summary.policy.total_installment_policies =
    //   countInstallmentPolicies(policies);


    // Return the summary
    res.status(200).json({ summary });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const countPoliciesByStatus = (policies: any[], status: string): number => {
  return policies.filter((policy: any) => policy.policy_status === status)
    .length;
};

const calculateTotalPremiumAmount = (policies: any[]): number => {
  return db.payments.reduce(
    (total: number, payment: any) => total +  parseInt(payment.payment_amount),
    0
  );
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
const getDailyPolicySalesReport = async (req, res) => {
  const { partner_id } = req.query;

  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    // Fetch daily sales data
    const dailyResult = await Policy.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfDay, today],
        },
        partner_id: partner_id,
      },
    });

    console.log("DAILY REPORT", dailyResult);

    // Fetch weekly sales data
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const weeklyResult = await Policy.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfWeek, today],
        },
        partner_id: partner_id,
      },
    });

    console.log("WEEKLY REPORT", weeklyResult);

    // Fetch monthly sales data
    const startOfMonth = new Date(today);
    startOfMonth.setHours(0, 0, 0, 0);
    startOfMonth.setDate(1);

    const monthlyResult = await Policy.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, today],
        },
        partner_id: partner_id,
      },
    });

    console.log("MONTHLY REPORT", monthlyResult);

    // Fetch yearly sales data
    const startOfYear = new Date(today);
    startOfYear.setHours(0, 0, 0, 0);
    startOfYear.setMonth(0, 1);

    const yearlyResult = await Policy.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfYear, today],
        },
        partner_id: partner_id,
      },
    });

    console.log("YEARLY REPORT", yearlyResult);

    const report = {
      daily: countPoliciesByStatus(dailyResult, "paid"),
      weekly: countPoliciesByStatus(weeklyResult, "paid"),
      monthly: countPoliciesByStatus(monthlyResult, "paid"),
      yearly: countPoliciesByStatus(yearlyResult, "paid"),
    };

    // await Log.create({
    //   log_id: uuidv4(),
    //   timestamp: new Date(),
    //   message: 'Daily policy sales fetched successfully',
    //   level: 'info',
    //   user: req?.user_id,
    //   partner_id: req?.partner_id,
    // });

    const partnerCountry = await Partner.findOne({  
      where: {
        partner_id: partner_id,
      },
    });

    res.status(200).json({
      result: {
        code: 200,
        countryCode: partnerCountry.country_code,
        currencyCode: partnerCountry.currency_code,
        items: report,
      },
    });
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).json({ error: "Internal server error" });
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
    limit = 50,
    filter,
    start_date,
    end_date,
  } = req.query;

  try {
    const whereClause: any = {
      partner_id: partner_id,
    };
    // moment().format('YYYY-MM-DD')
  
  
      if (filter)

   filter = filter.trim().toLowerCase(); 

    if (filter) {
      whereClause[Op.or] = [
        // { user_id: { [Op.iLike]: `%${filter}%` } },
        // { policy_id : { [Op.iLike]: `%${filter}%` } },
        { beneficiary: { [Op.iLike]: `%${filter}%` } },
        { policy_type: { [Op.iLike]: `%${filter}%` } },
        { policy_status: { [Op.iLike]: `%${filter}%` } },
        // { sum_insured: { [Op.iLike]: `%${filter}%` } },
        // { premium: { [Op.iLike]: `%${filter}%` } },
        // { policy_deduction_day: { [Op.iLike]: `%${filter}%` } },
       // { installment_order: { [Op.iLike]: `%${filter}%` } },
        { currency_code: { [Op.iLike]: `%${filter}%` } },
        { country_code: { [Op.iLike]: `%${filter}%` } },
     
      ];
    }

    if (start_date && end_date) {
      whereClause.policy_start_date = {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      };
    }

    if(start_date && !end_date){
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
    const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

    // Generate a unique download token
    const downloadToken = Date.now();

    // Create a URL for the download endpoint including the token
    // the file is located at src/uploads/policy_report.xlsx
    const downloadURL = `${BASE_URL}/api/v1/reports/policy/excel/download?token=${downloadToken}`;

    // Store the download token somewhere (e.g., in-memory cache or database)
    // This is needed to verify the download request

    // await Log.create({
    //   log_id: uuidv4(),
    //   timestamp: new Date(),
    //   message: 'Excel policy report generated successfully',
    //   level: 'info',
    //   user: req?.user_id,
    //   partner_id: req?.partner_id,
    // });

    // Return the download URL to the user
    res.status(200).json({ downloadURL });
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Download endpoint handler
const handlePolicyDownload = (req, res) => {
  const { token } = req.query;

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
    { header: "Product Name", key: "product_name", width: 20 },
    { header: "Product ID", key: "product_id", width: 20 },
    { header: "Airtel Transaction ID", key: "airtel_money_id", width: 20 },
    { header: "Bluewave Transaction ID", key: "bluewave_transaction_id", width: 20 },
    { header: "AAR Member Number", key: "arr_member_number", width: 20 },
    { header: "Full Name", key: "full_name", width: 20 },
    { header: "Phone Number", key: "phone_number", width: 20 },
    { header: "Policy Category", key: "beneficiary", width: 20 },
    { header: "Policy Type", key: "policy_type", width: 20 },
    { header: "Family Size", key: "total_member_number", width: 20 },
    { header: "Policy Status", key: "policy_status", width: 20 },
    { header: "Policy Start Date", key: "policy_start_date", width: 20 },
    { header: "Policy End Date", key: "policy_end_date", width: 20 },
    { header: "Policy Paid Date", key: "policy_paid_date", width: 20 },
    { header: "Policy Paid Amount", key: "policy_paid_amount", width: 20 },
    {
      header: "Policy Deduction Amount",
      key: "policy_deduction_amount",
      width: 20,
    },
    { header: "Customer ID", key: "user_id", width: 20 },
    {
      header: "Policy Next Deduction Date",
      key: "policy_next_deduction_date",
      width: 20,
    },
    { header: "Policy Deduction Day", key: "policy_deduction_day", width: 20 },
    { header: "Installment Order", key: "installment_order", width: 20 },
    { header: "Installment Date", key: "installment_date", width: 20 },
    {
      header: "Installment Alert Date",
      key: "installment_alert_date",
      width: 20,
    },
    // { header: "Tax Rate VAT", key: "tax_rate_vat", width: 20 },
    // { header: "Tax Rate EXT", key: "tax_rate_ext", width: 20 },
    { header: "Premium", key: "premium", width: 20 },
    { header: "Sum Insured", key: "sum_insured", width: 20 },
    { header: "Last Expense Insured", key: "last_expense_insured", width: 20 },
    { header: "Excess Premium", key: "excess_premium", width: 20 },
    { header: "Discount Premium", key: "discount_premium", width: 20 },
    { header: "Hospital Details", key: "hospital_details", width: 20 },
    { header: "Currency Code", key: "currency_code", width: 20 },
    { header: "Country Code", key: "country_code", width: 20 },
    { header: "Partner ID", key: "partner_id", width: 20 },
    { header: "Created At", key: "createdAt", width: 20 },
    { header: "Updated At", key: "updatedAt", width: 20 },
  ];

  policies.forEach(async(policy) => {
 
  
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
          policy_paid_date BETWEEN DATE_TRUNC('month', policy_paid_date) AND (DATE_TRUNC('month', policy_paid_date) + INTERVAL '1 month' - INTERVAL '1 day') AND partner_id = :partner_id
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
      total_customers: results.length,
      total_amount: results.reduce((total, item) => total + Number(item.total_amount), 0),
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


///aggregated/annual/sales

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
          SUM(policy_deduction_amount) AS total_amount,
          COUNT(DISTINCT user_id) AS total_users -- Added this line
        FROM
          policies 
        WHERE
          policy_paid_date BETWEEN DATE_TRUNC('month', policy_paid_date) AND (DATE_TRUNC('month', policy_paid_date) + INTERVAL '1 month' - INTERVAL '1 day')   AND policy_status = 'paid' AND partner_id = :partner_id
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
      total_customers: results.length,
      total_amount: results.reduce((total, item) => total + Number(item.total_amount), 0),
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
    const filterMonth = req.query.month; // Get the month filter from the query

    // Validate and sanitize the input
    if (!filterMonth || isNaN(filterMonth) || filterMonth < 1 || filterMonth > 12) {
      return res.status(400).json({ message: 'Invalid or missing month filter' });
    }

    const query = `
        SELECT
          EXTRACT(MONTH FROM policy_paid_date) AS month,
          EXTRACT(DAY FROM policy_paid_date) AS day,
          policy_id,
          SUM(policy_deduction_amount) AS total_amount,
          COUNT(DISTINCT user_id) AS total_users
        FROM
          policies 
        WHERE
          policy_paid_date BETWEEN DATE_TRUNC('month', policy_paid_date) AND (DATE_TRUNC('month', policy_paid_date) + INTERVAL '1 month' - INTERVAL '1 day') 
          AND EXTRACT(MONTH FROM policy_paid_date) = :filterMonth -- Apply the month filter
          AND policy_status = 'paid'
          AND partner_id = :partner_id
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
      replacements: { partner_id: req.query.partner_id, filterMonth: filterMonth },
      type: QueryTypes.SELECT,
    });
    // Prepare the response data
    const labels = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '31',
    ];

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
      total_customers: results.length,
      total_amount: results.reduce((total, item) => total + Number(item.total_amount), 0),
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

    // Store the download token somewhere (e.g., in-memory cache or database)
    // This is needed to verify the download request

    // await Log.create({
    //   log_id: uuidv4(),
    //   timestamp: new Date(),
    //   message: 'Excel claim report generated successfully',
    //   level: 'info',
    //   user: req?.user_id,
    //   partner_id: req?.partner_id,
    // });

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


  console.log("I WAS CALLED 2", claims)
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

    console.log("I WAS CALLED 3", user)

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



module.exports = {
  getPolicySummary,
  getClaimSummary,
  getAllReportSummary,
  getDailyPolicySalesReport,
  getPolicyExcelReportDownload,
  getAggregatedDailyPolicySalesReport,
  getAggregatedAnnuallyPolicySalesReport,
  getAggregatedMonthlySalesReport ,
  handlePolicyDownload,
  handleClaimDownload,
  getClaimExcelReportDownload
};
