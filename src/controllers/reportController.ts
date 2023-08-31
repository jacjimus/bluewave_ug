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
    let summary = {
      total_policies: policy.length,
      total_policies_pending: policy.filter(
        (policy: any) => policy.policy_status == "pending"
      ).length,
      total_policies_paid: policy.filter(
        (policy: any) => policy.policy_status == "paid"
      ).length,
      total_policies_unpaid: policy.filter(
        (policy: any) => policy.policy_status == "unpaid"
      ).length,
      total_policies_partially_paid: policy.filter(
        (policy: any) => policy.policy_status == "partially_paid"
      ).length,
      total_preimum_amount: policy.reduce(
        (a: any, b: any) => a + b.policy_deduction_amount * 1,
        0
      ),
    };
    await Log.create({
      log_id: uuidv4(),
      timestamp: new Date(),
      message: 'Policy summary fetched successfully',
      level: 'info',
      user: req?.user_id,
      partner_id: req?.partner_id,
    });
    return res.status(200).json({
      result: {
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

    await Log.create({
      log_id: uuidv4(),
      timestamp: new Date(),
      message: 'Claim summary fetched successfully',
      level: 'info',
      user: req?.user_id,
      partner_id: req?.partner_id,
    });

    return res.status(200).json({
      result: {
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

    let users: any,
      policies: any,
      claims: any,
      payments: any,
      partners: any,
      products: any,
      sessions: any,
      startDate: any,
      endDate: any;

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
      user: {
        total_users: 0,
        total_users_active: 0,
        total_users_inactive: 0,
        total_users_pending: 0,
        total_users_with_policy: 0,
        total_users_with_claim: 0,
        total_users_with_payment: 0,
      },
      policy: {
        total_policies: 0,
        total_policies_pending: 0,
        total_policies_paid: 0,
        total_policies_unpaid: 0,
        total_policies_partially_paid: 0,
        total_premium_amount: 0,
        total_installment_policies: 0,
      },
      claim: {
        total_claims: 0,
        total_claims_approved: 0,
        total_claims_pending: 0,
        total_claims_rejected: 0,
      },
      payment: {
        total_payments: 0,
        total_payments_paid: 0,
        total_payments_unpaid: 0,
        total_payments_pending: 0,
      },
      partner: {
        total_partners: 0,
        total_partners_active: 0,
      },
      product: {
        total_products: 0,
        total_products_active: 0,
        total_products_inactive: 0,
        total_products_pending: 0,
      },
      session: {
        total_sessions: 0,
      },
    };

    if (partner_id == 1) {
      users = await User.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      policies = await Policy.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      claims = await Claim.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      payments = await Payment.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      partners = await Partner.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      products = await Product.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      sessions = await Session.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });
    } else {
      users = await User.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          partner_id: partner_id,
        },
      });

      policies = await Policy.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          partner_id: partner_id,
        },
      });

      claims = await Claim.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          partner_id: partner_id,
        },
      });

      payments = await Payment.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          partner_id: partner_id,
        },
      });

      partners = await Partner.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          partner_id: partner_id,
        },
      });

      products = await Product.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          partner_id: partner_id,
        },
      });

      sessions = await Session.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          partner_id: partner_id,
        },
      });
    }

    // Populate user summary
    summary.user.total_users = users.length;
    summary.user.total_users_active = countUsersByActivity(users, true);
    summary.user.total_users_inactive = countUsersByActivity(users, false);

    // Populate policy summary
    summary.policy.total_policies = policies.length;
    summary.policy.total_policies_pending = countPoliciesByStatus(
      policies,
      "pending"
    );
    summary.policy.total_policies_unpaid = countPoliciesByStatus(
      policies,
      "unpaid"
    );
    summary.policy.total_policies_paid = countPoliciesByStatus(
      policies,
      "paid"
    );
    summary.policy.total_policies_partially_paid = countPoliciesByStatus(
      policies,
      "partially_paid"
    );
    summary.policy.total_premium_amount = calculateTotalPremiumAmount(policies);
    summary.policy.total_installment_policies =
      countInstallmentPolicies(policies);

    // Populate claim summary
    summary.claim.total_claims = claims.length;
    summary.claim.total_claims_approved = countClaimsByStatus(
      claims,
      "approved"
    );
    summary.claim.total_claims_pending = countClaimsByStatus(claims, "pending");
    summary.claim.total_claims_rejected = countClaimsByStatus(
      claims,
      "rejected"
    );

    // Populate payment summary
    summary.payment.total_payments = payments.length;
    summary.payment.total_payments_paid = countPaymentsByStatus(
      payments,
      "paid"
    );
    summary.payment.total_payments_unpaid = countPaymentsByStatus(
      payments,
      "unpaid"
    );
    summary.payment.total_payments_pending = countPaymentsByStatus(
      payments,
      "pending"
    );

    // Populate partner summary
    summary.partner.total_partners = partners.length;
    summary.partner.total_partners_active = countPartnersByActivity(
      partners,
      true
    );

    // Populate product summary
    summary.product.total_products = products.length;
    summary.product.total_products_active = countProductsByStatus(
      products,
      "active"
    );
    summary.product.total_products_inactive = countProductsByStatus(
      products,
      "inactive"
    );
    summary.product.total_products_pending = countProductsByStatus(
      products,
      "pending"
    );

    // Populate session summary
    summary.session.total_sessions = sessions.length;

    await Log.create({
      log_id: uuidv4(),
      timestamp: new Date(),
      message: 'User fetched successfully',
      level: 'info',
      user: req?.user_id,
      partner_id: req?.partner_id,
    });

    // Return the summary
    res.status(200).json({ summary });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const countUsersByActivity = (users: any[], isActive: boolean): number => {
  return users.filter((user: any) => user.is_active === isActive).length;
};

const countPoliciesByStatus = (policies: any[], status: string): number => {
  return policies.filter((policy: any) => policy.policy_status === status)
    .length;
};

const countPoliciesByInstallementOrder = (
  policies: any[],
  installment_order: number
): number => {
  return policies.filter(
    (policy: any) => policy.installment_order === installment_order
  ).length;
};

const calculateTotalPremiumAmount = (policies: any[]): number => {
  return policies.reduce(
    (total: number, policy: any) => total + policy.policy_deduction_amount * 1,
    0
  );
};

const countPaymentsByStatus = (payments: any[], status: string): number => {
  return payments.filter((payment: any) => payment.payment_status === status)
    .length;
};

const countPartnersByActivity = (
  partners: any[],
  isActive: boolean
): number => {
  return partners.filter((partner: any) => partner.is_active === isActive)
    .length;
};

const countProductsByStatus = (products: any[], status: string): number => {
  return products.filter((product: any) => product.product_status === status)
    .length;
};

const countClaimsByStatus = (claims: any[], status: string): number => {
  return claims.filter((claim: any) => claim.claim_status === status).length;
};

const countInstallmentPolicies = (policies: any[]): number => {
  return policies.filter((policy: any) => policy.installment_order !== 1)
    .length;
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

    await Log.create({
      log_id: uuidv4(),
      timestamp: new Date(),
      message: 'Daily policy sales fetched successfully',
      level: 'info',
      user: req?.user_id,
      partner_id: req?.partner_id,
    });

    res.status(200).json(report);
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
  const {
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

    if (filter) {
      whereClause.policy_number = {
        [Op.like]: `%${filter}%`,
      };
    }

    if (start_date && end_date) {
      whereClause.policy_date = {
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

    await Log.create({
      log_id: uuidv4(),
      timestamp: new Date(),
      message: 'Excel policy report generated successfully',
      level: 'info',
      user: req?.user_id,
      partner_id: req?.partner_id,
    });

    // Return the download URL to the user
    res.status(200).json({ downloadURL });
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Download endpoint handler
const handleDownload = (req, res) => {
  const { token } = req.query;

  // Verify the token and get the file path
  // This is where you check if the token is valid and retrieve the file path

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

const generatePolicyExcelReport = async (policies) => {
  const workbook = new excelJS.Workbook(); // Create a new workbook
  const worksheet = workbook.addWorksheet("Policy Report");

  // Define columns for data in Excel. Key must match data key
  worksheet.columns = [
    { header: "Product ID", key: "product_id", width: 20 },
    { header: "Full Name", key: "full_name", width: 20 },
    { header: "Phone Number", key: "phone_number", width: 20 },
    { header: "Product Name", key: "product_name", width: 20 },
    { header: "Policy Type", key: "policy_type", width: 20 },
    { header: "Policy Status", key: "policy_status", width: 20 },
    { header: "Policy Start Date", key: "policy_start_date", width: 20 },
    { header: "Policy End Date", key: "policy_end_date", width: 20 },
    {
      header: "Policy Deduction Amount",
      key: "policy_deduction_amount",
      width: 20,
    },
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
    { header: "Tax Rate VAT", key: "tax_rate_vat", width: 20 },
    { header: "Tax Rate EXT", key: "tax_rate_ext", width: 20 },
    { header: "Premium", key: "premium", width: 20 },
    { header: "Sum Insured", key: "sum_insured", width: 20 },
    { header: "Excess Premium", key: "excess_premium", width: 20 },
    { header: "Discount Premium", key: "discount_premium", width: 20 },
    { header: "Hospital Details", key: "hospital_details", width: 20 },
    { header: "Policy Documents", key: "policy_documents", width: 20 },
    { header: "Policy Paid Date", key: "policy_paid_date", width: 20 },
    { header: "Policy Paid Amount", key: "policy_paid_amount", width: 20 },
    { header: "Currency Code", key: "currency_code", width: 20 },
    { header: "Country Code", key: "country_code", width: 20 },
    { header: "Customer ID", key: "user_id", width: 20 },
    { header: "Partner ID", key: "partner_id", width: 20 },
    { header: "Created At", key: "createdAt", width: 20 },
    { header: "Updated At", key: "updatedAt", width: 20 },
  ];

  policies.forEach((policy) => {
    worksheet.addRow({
      policy_id: policy.policy_id,
      policy_date: moment(policy.policy_date).format("YYYY-MM-DD"),
      policy_number: policy.policy_number,
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
      policy_type: policy.policy_type,
      full_name: `${policy.user.first_name} ${policy.user.last_name}`,
      phone_number: policy.user.phone_number,
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
          EXTRACT(MONTH FROM policy_paid_date) AS month,
          EXTRACT(DAY FROM policy_paid_date) AS day,
          policy_id,
          SUM(policy_deduction_amount) AS total_amount
        FROM
          policies 
        WHERE
          policy_paid_date BETWEEN DATE_TRUNC('month', policy_paid_date) AND (DATE_TRUNC('month', policy_paid_date) + INTERVAL '1 month' - INTERVAL '1 day') AND partner_id = :partner_id
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

    console.log("RESULTS", results);

    await Log.create({
      log_id: uuidv4(),
      timestamp: new Date(),
      message: 'Aggregated daily policy sales fetched successfully',
      level: 'info',
      user: req?.user_id,
      partner_id: req?.partner_id,
    });
    // Send the results as a response
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getPolicySummary,
  getClaimSummary,
  getAllReportSummary,
  getDailyPolicySalesReport,
  getPolicyExcelReportDownload,
  getAggregatedDailyPolicySalesReport,
  handleDownload,
};
