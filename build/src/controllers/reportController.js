"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../models/db");
const payment_1 = require("../services/payment");
const { Op, QueryTypes } = require("sequelize");
const moment = require("moment");
const excelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const Policy = db_1.db.policies;
const User = db_1.db.users;
const Claim = db_1.db.claims;
const Product = db_1.db.products;
const Partner = db_1.db.partners;
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
const getPolicySummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        }
        else if (this_week) {
            startDate = new Date();
            startDate.setDate(twentyFourHoursAgo.getDate() - twentyFourHoursAgo.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setDate(startDate.getDate() + 7);
            endDate.setHours(23, 59, 59, 999);
        }
        else if (this_month) {
            startDate = new Date(twentyFourHoursAgo.getFullYear(), twentyFourHoursAgo.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(twentyFourHoursAgo.getFullYear(), twentyFourHoursAgo.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
        }
        else {
            startDate = new Date(0);
            endDate = new Date();
        }
        let policyQuery = {
            where: Object.assign({ createdAt: {
                    [Op.between]: [startDate, endDate],
                } }, (partner_id != 1 && { partner_id })),
            limit: 100,
        };
        let policy = yield Policy.findAll(policyQuery);
        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policies found" });
        }
        let total_payment_premium = yield db_1.db.payments.sum("payment_amount", {
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
        let total_policy_premium_paid = yield db_1.db.policies.sum("policy_paid_amount", {
            where: {
                policy_status: "paid",
                partner_id,
            },
        });
        const renewalsCount = yield db_1.db.policies.findAndCountAll({
            where: {
                policy_status: "paid",
                installment_order: {
                    [Op.gt]: 1,
                },
                partner_id: partner_id,
            },
        });
        let total_policies_renewed_premium = yield db_1.db.policies.sum("policy_paid_amount", {
            where: {
                policy_status: "paid",
                installment_order: {
                    [Op.gt]: 1,
                },
                partner_id,
            },
        });
        let summary = {
            total_users: yield db_1.db.users.count({ where: { partner_id } }),
            total_policies_paid: yield db_1.db.policies.count({ where: { policy_status: "paid", partner_id } }),
            total_policies_premium_paid: total_policy_premium_paid,
            total_preimum_amount: total_policy_premium_paid,
            total_paid_payment_amount: yield db_1.db.payments.count({ where: { payment_status: "paid", partner_id } }),
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
        }
        else {
            console.error("Invalid partner_id");
        }
        return res.status(200).json({
            result: {
                code: 200,
                status: "OK",
                countryCode: country_code,
                currencyCode: currency_code,
                items: summary,
            },
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", error });
    }
});
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
const getClaimSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("getClaimSummary");
        const partner_id = req.query.partner_id;
        const today = req.query.today === "true"; // Convert to a boolean value
        const this_week = req.query.this_week === "true"; // Convert to a boolean value
        const this_month = req.query.this_month === "true"; // Convert to a boolean value
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        let claim, startDate, endDate;
        if (today) {
            // For today
            startDate = new Date(twentyFourHoursAgo);
            endDate = new Date();
        }
        else if (this_week) {
            // For this week
            startDate = new Date();
            startDate.setDate(twentyFourHoursAgo.getDate() - twentyFourHoursAgo.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setDate(startDate.getDate() + 7);
            endDate.setHours(23, 59, 59, 999);
        }
        else if (this_month) {
            // For this month
            startDate = new Date(twentyFourHoursAgo.getFullYear(), twentyFourHoursAgo.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(twentyFourHoursAgo.getFullYear(), twentyFourHoursAgo.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
        }
        else {
            // Handle the case when none of the filtering options are provided
            startDate = new Date(0); // A distant past date (or you can set it to your default start date)
            endDate = new Date(); // Current date
        }
        if (partner_id == 1) {
            claim = yield Claim.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate],
                    },
                },
            });
        }
        else {
            claim = yield Claim.findAll({
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
            total_claims_dispute_resolved: countClaimsByStatus(claim, "dispute_resolved"),
        };
        const partnerCountry = yield Partner.findOne({
            where: {
                partner_id: partner_id,
            },
        });
        return res.status(200).json({
            result: {
                code: 200,
                status: "OK",
                countryCode: partnerCountry.country_code,
                currencyCode: partnerCountry.currency_code,
                items: summary,
            },
        });
    }
    catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ message: "Internal server error", error: error });
    }
});
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
const getAllReportSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        }
        else if (this_week) {
            // For this week
            startDate = new Date();
            startDate.setDate(twentyFourHoursAgo.getDate() - twentyFourHoursAgo.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setDate(startDate.getDate() + 7);
            endDate.setHours(23, 59, 59, 999);
        }
        else if (this_month) {
            // For this month
            startDate = new Date(twentyFourHoursAgo.getFullYear(), twentyFourHoursAgo.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(twentyFourHoursAgo.getFullYear(), twentyFourHoursAgo.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
        }
        else {
            // Handle the case when none of the filtering options are provided
            startDate = new Date(0); // A distant past date (or you can set it to your default start date)
            endDate = new Date(); // Current date
        }
        const partnerCountry = yield Partner.findOne({
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
        const [users, policies] = yield Promise.all([
            User.findAll({
                where: Object.assign({ createdAt: {
                        [Op.between]: [startDate, endDate],
                    } }, (partner_id !== 1 && { partner_id: partner_id })),
            }),
            Policy.findAll({
                where: Object.assign({ createdAt: {
                        [Op.between]: [startDate, endDate],
                    }, policy_status: "paid" }, (partner_id !== 1 && { partner_id: partner_id })),
                limit: 100,
            }),
        ]);
        // Populate user summary
        summary.user.total_users = users.length;
        summary.user.total_users_with_policy = policies.length;
        // summary.user.total_users_active = countUsersByActivity(users, true);
        summary.policy.total_policies_paid = yield db_1.db.policies.count({
            where: {
                policy_status: "paid",
                partner_id: partner_id,
            },
        });
        const totalPremiumAmountResult = yield db_1.db.payments.sum("payment_amount", {
            where: {
                payment_status: "paid",
                partner_id: partner_id,
            },
        });
        const totalPremiumAmount = totalPremiumAmountResult || 0;
        summary.policy.total_premium_amount = totalPremiumAmount;
        // Return the summary
        return res.status(200).json({ summary });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
const countClaimsByStatus = (claims, status) => {
    return claims.filter((claim) => claim.claim_status === status).length;
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
const getSalesReportByPeriod = (req, periodType) => __awaiter(void 0, void 0, void 0, function* () {
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
        const result = yield db_1.db.payments.findAll({
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
    }
    catch (error) {
        console.error(`Error fetching ${periodType} sales report:`, error);
        throw error;
    }
});
const getDailyPolicySalesReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch sales reports for different periods
        const [dailyReport, weeklyReport, monthlyReport, yearlyReport] = yield Promise.all([
            getSalesReportByPeriod(req, 'daily'),
            getSalesReportByPeriod(req, 'weekly'),
            getSalesReportByPeriod(req, 'monthly'),
            getSalesReportByPeriod(req, 'yearly'),
        ]);
        const partnerCountry = yield Partner.findOne({
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
    }
    catch (error) {
        console.error('Error fetching sales report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
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
const getPolicyExcelReportDownload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { partner_id, page = 1, limit = 1000, filter, start_date, end_date, } = req.query;
    try {
        const whereClause = {
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
        let policies = yield Policy.findAll(options);
        if (!policies || policies.length === 0) {
            return res.status(404).json({ message: "No policies found" });
        }
        const workbook = yield generatePolicyExcelReport(policies);
        // Save the workbook to a temporary file
        const tempFilePath = path.join(__dirname, "uploads", "policy_report.xlsx");
        yield workbook.xlsx.writeFile(tempFilePath);
        // Get the base URL from environment variable or use a default
        const BASE_URL = process.env.ENVIROMENT == 'PROD' ? process.env.BASE_URL : "http://localhost:4000";
        // Generate a unique download token
        const downloadToken = Date.now();
        // Create a URL for the download endpoint including the token
        // the file is located at src/uploads/policy_report.xlsx
        const downloadURL = `${BASE_URL}/api/v1/reports/policy/excel/download?token=${downloadToken}`;
        // Return the download URL to the user
        return res.status(200).json({ downloadURL });
    }
    catch (error) {
        console.error("Error generating Excel report:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Download endpoint handler
const handleUsersDownload = (req, res) => {
    const filePath = path.join(__dirname, "uploads", "users_report.xlsx");
    // Stream the file for download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=users_report.xlsx");
    fs.createReadStream(filePath).pipe(res);
};
const handlePolicyDownload = (req, res) => {
    const filePath = path.join(__dirname, "uploads", "policy_report.xlsx");
    // Stream the file for download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=policy_report.xlsx");
    fs.createReadStream(filePath).pipe(res);
};
const handleClaimDownload = (req, res) => {
    const { token } = req.query;
    const filePath = path.join(__dirname, "uploads", "claim_report.xlsx");
    // Stream the file for download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=claim_report.xlsx");
    fs.createReadStream(filePath).pipe(res);
};
const generatePolicyExcelReport = (policies) => __awaiter(void 0, void 0, void 0, function* () {
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
    policies.forEach((policy) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        worksheet.addRow({
            policy_id: policy.policy_id,
            airtel_money_id: policy.airtel_money_id,
            bluewave_transaction_id: policy.bluewave_transaction_id,
            arr_member_number: (_a = policy.user.dataValues) === null || _a === void 0 ? void 0 : _a.arr_member_number,
            policy_number: policy.policy_number,
            policy_type: policy.policy_type,
            beneficiary: policy.beneficiary,
            total_member_number: policy.total_member_number,
            policy_status: policy.policy_status,
            policy_start_date: moment(policy.policy_start_date).format("YYYY-MM-DD"),
            policy_end_date: moment(policy.policy_end_date).format("YYYY-MM-DD"),
            policy_deduction_amount: policy.policy_deduction_amount,
            policy_next_deduction_date: moment(policy.policy_next_deduction_date).format("YYYY-MM-DD"),
            policy_deduction_day: policy.policy_deduction_day,
            installment_order: policy.installment_order,
            installment_type: policy.installment_type == 2 ? "Monthly" : "Yearly",
            installment_date: moment(policy.installment_date).format("YYYY-MM-DD"),
            installment_alert_date: moment(policy.installment_alert_date).format("YYYY-MM-DD"),
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
            full_name: `${(_c = (_b = policy.user) === null || _b === void 0 ? void 0 : _b.dataValues) === null || _c === void 0 ? void 0 : _c.first_name} ${(_e = (_d = policy.user) === null || _d === void 0 ? void 0 : _d.dataValues) === null || _e === void 0 ? void 0 : _e.last_name}`,
            phone_number: (_g = (_f = policy.user) === null || _f === void 0 ? void 0 : _f.dataValues) === null || _g === void 0 ? void 0 : _g.phone_number,
        });
    }));
    return workbook;
});
const generateUserExcelReport = (users) => __awaiter(void 0, void 0, void 0, function* () {
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
    users.forEach((user) => __awaiter(void 0, void 0, void 0, function* () {
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
    }));
    return workbook;
});
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
const getUserExcelReportDownload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { partner_id, page = 1, limit = 5000, filter, start_date, end_date, } = req.query;
    try {
        const whereClause = {
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
        let users = yield db_1.db.users.findAll(options);
        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        const workbook = yield generateUserExcelReport(users);
        // Save the workbook to a temporary file
        const tempFilePath = path.join(__dirname, "uploads", "users_report.xlsx");
        yield workbook.xlsx.writeFile(tempFilePath);
        // Get the base URL from environment variable or use a default
        const BASE_URL = process.env.ENVIROMENT == 'PROD' ? process.env.BASE_URL : "http://localhost:4000";
        // Generate a unique download token
        const downloadToken = Date.now();
        // Create a URL for the download endpoint including the token
        // the file is located at src/uploads/policy_report.xlsx
        const downloadURL = `${BASE_URL}/api/v1/reports/users/excel/download?token=${downloadToken}`;
        // Return the download URL to the user
        return res.status(200).json({ downloadURL });
    }
    catch (error) {
        console.error("Error generating users Excel report:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
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
const getAggregatedDailyPolicySalesReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const results = yield db_1.db.sequelize.query(query, {
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
        const partnerData = yield Partner.findOne({
            where: {
                partner_id: req.query.partner_id,
            },
        });
        console.log("RESULTS", results);
        const data = {
            labels: labels,
            datasets: datasets,
            total_policies: results.length,
            total_customers: results[0] ? results[0].total_users : 0,
            total_amount: results[results.length - 1] ? results[results.length - 1].total_amount : 0,
            countryCode: partnerData.country_code,
            currencyCode: partnerData.currency_code,
        };
        // Send the results as a response
        return res.status(200).json({ data });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
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
const getAggregatedAnnuallyPolicySalesReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const results = yield db_1.db.sequelize.query(query, {
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
        const partnerData = yield Partner.findOne({
            where: {
                partner_id: req.query.partner_id,
            },
        });
        console.log("RESULTS", results);
        const data = {
            labels: labels,
            datasets: datasets,
            total_policies: results.length,
            total_customers: results[0] ? results[0].total_users : 0,
            total_amount: results[results.length - 1] ? results[results.length - 1].total_amount : 0,
            countryCode: partnerData.country_code,
            currencyCode: partnerData.currency_code,
        };
        // Send the results as a response
        return res.status(200).json({ data });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
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
const getAggregatedMonthlySalesReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const results = yield db_1.db.sequelize.query(query, {
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
        const partnerData = yield Partner.findOne({
            where: {
                partner_id: req.query.partner_id,
            },
        });
        console.log("RESULTS", results);
        const data = {
            labels: labels,
            datasets: datasets,
            total_policies: results.length,
            total_customers: new Set(results.map((item) => item.day)).size,
            total_amount: results.reduce((acc, item) => acc + parseInt(item.total_amount), 0),
            countryCode: partnerData.country_code,
            currencyCode: partnerData.currency_code,
        };
        return res.status(200).json({ data });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
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
const getClaimExcelReportDownload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { partner_id, page = 1, limit = 50, filter, start_date, end_date, } = req.query;
    try {
        const whereClause = {
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
        let claims = yield Claim.findAll(options);
        if (!claims || claims.length === 0) {
            return res.status(404).json({ message: "No claims found" });
        }
        console.log("I WAS CALLED  claims", claims);
        const workbook = yield generateClaimExcelReport(claims);
        // Save the workbook to a temporary file
        const tempFilePath = path.join(__dirname, "uploads", "claim_report.xlsx");
        yield workbook.xlsx.writeFile(tempFilePath);
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
});
//generateClaimExcelReport
function generateClaimExcelReport(claims) {
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
        let user = db_1.db.users.findOne({
            where: {
                user_id: claim.user_id
            },
            limit: 1,
        });
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
const paymentReconciliation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        let result = {
            message: "error",
            code: 404
        };
        const payment_file = req.file;
        // Read the uploaded Excel file
        const workbook = XLSX.readFile(payment_file.path, { cellDates: true, dateNF: 'mm/dd/yyyy hh:mm:ss' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        //console.log sheetNames
        // console.log("============ WORKSHEET ========", workbook.Sheets)
        if (!worksheet) {
            return res.status(400).json({ message: "Empty worksheet in the Excel file" });
        }
        // Convert worksheet data to an array of objects
        const paymentDataArray = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        console.log("+++++paymentDataArray+++++", paymentDataArray.length);
        for (let payment of paymentDataArray) {
            //  console.log("PAYMENT", payment)
            // if - replace with / in the date
            payment['Transaction Date'] = payment['Transaction Date'].replace(/-/g, '/');
            // Split the original date into components
            let components = payment['Transaction Date'].split(/[/\s:]/);
            // Rearrange the components to the desired format
            let convertedDate = components[1] + '/' + components[0] + '/' + components[2] + ' ' + components[3] + ':' + components[4];
            // console.log(convertedDate);
            let transaction_date = moment(convertedDate);
            let premium = payment['Transaction Amount'].replace(/,/g, '');
            let ext_ref = payment['External Reference'];
            let airtel_money_id = payment['Transaction ID'];
            let phone_number = payment['Sender Mobile Number'];
            console.log(`transaction_date, ${transaction_date}`);
            console.log(`premium, ${premium}`);
            console.log(`airtel_money_id,${airtel_money_id}`);
            let policies = yield db_1.db.policies.findAll({
                where: {
                    phone_number: `+256${phone_number}`,
                    premium: premium,
                },
                include: [
                    {
                        model: db_1.db.transactions,
                        as: "transactions",
                    },
                ],
                limit: 1,
            });
            if (policies.length == 0) {
                return res.status(400).json({ message: "No policy found", phone_number: phone_number, premium: premium });
            }
            policies.forEach((policy) => __awaiter(void 0, void 0, void 0, function* () {
                // update air_tel_money_id
                // console.log("TRANSACTION",policy.transactions)
                console.log("POLICY", policy.first_name, policy.last_name, policy.policy_number, policy.policy_status, policy.premium, policy.policy_paid_date, policy.policy_paid_amount, policy.airtel_money_id);
                if (policy.policy_status !== 'paid' && policy.premium == premium) {
                    let transaction = yield db_1.db.transactions.findOne({
                        where: {
                            policy_id: policy.policy_id,
                            amount: premium,
                        },
                        limit: 1,
                    });
                    let transactionData = {
                        id: transaction.transaction_id,
                        status_code: "TS",
                        message: `PAID UGX ${premium} to AAR Uganda for ${policy.beneficiary} ${policy.policy_type} Cover Charge UGX 0. Bal UGX ${premium}. TID: ${airtel_money_id}. Date: ${transaction_date}`,
                        airtel_money_id: airtel_money_id,
                        payment_date: transaction.createdAt
                    };
                    console.log("TRANSACTION RECONCILIATION", transactionData);
                    result = yield (0, payment_1.reconcilationCallback)(transactionData);
                }
                else if (policy.policy_status == 'paid' && policy.airtel_money_id == null) {
                    console.log("AIRTEL MONEY UPDATE ", policy.first_name, policy.last_name, policy.policy_number);
                    policy.airtel_money_id = airtel_money_id;
                    policy.airtel_transaction_id = airtel_money_id;
                    policy.save();
                }
                else {
                    console.log("policy HAS airtel money", policy.first_name, policy.last_name, policy.policy_number, policy.policy_status, policy.premium, policy.policy_paid_date, policy.policy_paid_amount, policy.airtel_money_id);
                }
            }));
        }
        return res.status(200).json({ status: "OK", message: "Payment Reconciliation done successfully", result });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ status: "FAILED", message: "Internal server error", error: error.message });
    }
});
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
 *       - name: airtel_money_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
function policyReconciliation(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let { partner_id, airtel_money_id, phone_number, transaction_date, premium } = req.query;
            let result = {
                message: "error",
                code: 404
            };
            //4/2/2024 = 4th Feb 2024
            transaction_date = moment(transaction_date, "DD/MM/YYYY").format("YYYY-MM-DD");
            console.log(`transaction_date, ${transaction_date}`);
            console.log(`premium, ${premium}`);
            console.log(`existingUser,${phone_number}`);
            let policy = yield db_1.db.policies.findOne({
                where: {
                    phone_number: `+256${phone_number}`,
                    premium: premium,
                },
                limit: 1,
            });
            let payment = yield db_1.db.payments.findOne({
                where: {
                    policy_id: policy.policy_id,
                    payment_status: 'paid',
                    payment_amount: premium,
                },
                limit: 1,
            });
            console.log("====== PAYMENT =====", payment === null || payment === void 0 ? void 0 : payment.payment_status, payment === null || payment === void 0 ? void 0 : payment.payment_amount, payment === null || payment === void 0 ? void 0 : payment.payment_date, (_a = payment === null || payment === void 0 ? void 0 : payment.payment_metadata) === null || _a === void 0 ? void 0 : _a.transaction);
            console.log("===== POLICY =====", policy.policy_status, policy.premium, policy.policy_paid_date, policy.policy_paid_amount);
            if (policy.policy_status == 'paid' && payment.payment_status == 'paid' && policy.premium == payment.payment_amount) {
                return res.status(400).json({ status: "FAILED", message: "Policy already paid" });
            }
            let transactionId = yield db_1.db.transactions.findOne({
                where: {
                    policy_id: policy.policy_id,
                },
                limit: 1,
            });
            // console.log("transactionId", transactionId)
            let paymentCallback = {
                transaction: {
                    id: transactionId.transaction_id,
                    message: `PAID UGX ${premium} to AAR Uganda for ${policy.beneficiary} ${policy.policy_status} Cover Charge UGX 0. Bal UGX ${premium}. TID: ${airtel_money_id}. Date: ${transaction_date}`,
                    status_code: "TS",
                    airtel_money_id: airtel_money_id,
                    payment_date: transactionId.createdAt
                }
            };
            // console.log("paymentCallback", paymentCallback)
            result = yield (0, payment_1.reconcilationCallback)(paymentCallback.transaction);
            return res.status(200).json({ status: "OK", message: "Policy Reconciliation done successfully", result });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ status: "FAILED", message: "Internal server error", error: error.message });
        }
    });
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
