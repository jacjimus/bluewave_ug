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
const { Op } = require("sequelize");
const Policy = db_1.db.policies;
const User = db_1.db.users;
const Session = db_1.db.sessions;
const Claim = db_1.db.claims;
const Product = db_1.db.products;
const Payment = db_1.db.payments;
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
        let policy;
        if (partner_id == 1) {
            policy = yield Policy.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
        }
        else {
            policy = yield Policy.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    partner_id: partner_id
                }
            });
        }
        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policies found" });
        }
        let summary = {
            total_policies: policy.length,
            total_policies_pending: policy.filter((policy) => policy.policy_status == "pending").length,
            total_policies_paid: policy.filter((policy) => policy.policy_status == "paid").length,
            total_policies_unpaid: policy.filter((policy) => policy.policy_status == "unpaid").length,
            total_policies_partially_paid: policy.filter((policy) => policy.policy_status == "partially_paid").length,
            total_preimum_amount: policy.reduce((a, b) => a + b.policy_deduction_amount * 1, 0),
        };
        return res.status(200).json({
            result: {
                items: summary
            }
        });
    }
    catch (error) {
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
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
        }
        else {
            claim = yield Claim.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    partner_id: partner_id
                }
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
            total_claims_dispute_resolved: countClaimsByStatus(claim, "dispute_resolved")
        };
        return res.status(200).json({
            result: {
                items: summary
            }
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", error: error });
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
        let users, policies, claims, payments, partners, products, sessions, startDate, endDate;
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
                total_installment_policies: 0
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
            }
        };
        if (partner_id == 1) {
            users = yield User.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
            policies = yield Policy.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
            claims = yield Claim.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
            payments = yield Payment.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
            partners = yield Partner.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
            products = yield Product.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
            sessions = yield Session.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
        }
        else {
            users = yield User.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    partner_id: partner_id
                }
            });
            policies = yield Policy.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    partner_id: partner_id
                }
            });
            claims = yield Claim.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    partner_id: partner_id
                }
            });
            payments = yield Payment.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    partner_id: partner_id
                }
            });
            partners = yield Partner.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    partner_id: partner_id
                }
            });
            products = yield Product.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    partner_id: partner_id
                }
            });
            sessions = yield Session.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    },
                    partner_id: partner_id
                }
            });
        }
        // Populate user summary
        summary.user.total_users = users.length;
        summary.user.total_users_active = countUsersByActivity(users, true);
        summary.user.total_users_inactive = countUsersByActivity(users, false);
        // Populate policy summary
        summary.policy.total_policies = policies.length;
        summary.policy.total_policies_pending = countPoliciesByStatus(policies, "pending");
        summary.policy.total_policies_unpaid = countPoliciesByStatus(policies, "unpaid");
        summary.policy.total_policies_paid = countPoliciesByStatus(policies, "paid");
        summary.policy.total_policies_partially_paid = countPoliciesByStatus(policies, "partially_paid");
        summary.policy.total_premium_amount = calculateTotalPremiumAmount(policies);
        summary.policy.total_installment_policies = countInstallmentPolicies(policies);
        // Populate claim summary
        summary.claim.total_claims = claims.length;
        summary.claim.total_claims_approved = countClaimsByStatus(claims, "approved");
        summary.claim.total_claims_pending = countClaimsByStatus(claims, "pending");
        summary.claim.total_claims_rejected = countClaimsByStatus(claims, "rejected");
        // Populate payment summary
        summary.payment.total_payments = payments.length;
        summary.payment.total_payments_paid = countPaymentsByStatus(payments, "paid");
        summary.payment.total_payments_unpaid = countPaymentsByStatus(payments, "unpaid");
        summary.payment.total_payments_pending = countPaymentsByStatus(payments, "pending");
        // Populate partner summary
        summary.partner.total_partners = partners.length;
        summary.partner.total_partners_active = countPartnersByActivity(partners, true);
        // Populate product summary
        summary.product.total_products = products.length;
        summary.product.total_products_active = countProductsByStatus(products, "active");
        summary.product.total_products_inactive = countProductsByStatus(products, "inactive");
        summary.product.total_products_pending = countProductsByStatus(products, "pending");
        // Populate session summary
        summary.session.total_sessions = sessions.length;
        // Return the summary
        res.status(200).json({ summary });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
const countUsersByActivity = (users, isActive) => {
    return users.filter((user) => user.is_active === isActive).length;
};
const countPoliciesByStatus = (policies, status) => {
    return policies.filter((policy) => policy.policy_status === status).length;
};
const calculateTotalPremiumAmount = (policies) => {
    return policies.reduce((total, policy) => total + (policy.policy_deduction_amount * 1), 0);
};
const countPaymentsByStatus = (payments, status) => {
    return payments.filter((payment) => payment.payment_status === status).length;
};
const countPartnersByActivity = (partners, isActive) => {
    return partners.filter((partner) => partner.is_active === isActive).length;
};
const countProductsByStatus = (products, status) => {
    return products.filter((product) => product.product_status === status).length;
};
const countClaimsByStatus = (claims, status) => {
    return claims.filter((claim) => claim.claim_status === status).length;
};
const countInstallmentPolicies = (policies) => {
    return policies.filter((policy) => policy.installment_order !== 1).length;
};
// /**
//     * @swagger
//     * /api/v1/reports/summary/daily:
//     *   get:
//     *     tags:
//     *       - Reports
//     *     description: Daily Report summary
//     *     operationId: DailyReportSummary
//     *     summary: Daily Report summary
//     *     security:
//     *       - ApiKeyAuth: []
//     *     parameters:
//     *       - name: partner_id
//     *         in: query
//     *         required: true
//     *         schema:
//     *           type: number
//     *     responses:
//     *       200:
//     *         description: Information fetched successfuly
//     *       400:
//     *         description: Invalid request
//     */
// const getDailyReportSummary = async (req: any, res: any) => {
//     try {
//         const partner_id = req.query.partner_id;
//         const summary = {
//             user: {
//                 total_users: 0,
//                 total_users_active: 0,
//                 total_users_inactive: 0,
//                 total_users_pending: 0,
//                 total_users_with_policy: 0,
//                 total_users_with_claim: 0,
//                 total_users_with_payment: 0,
//             },
//             policy: {
//                 total_policies: 0,
//                 total_policies_pending: 0,
//                 total_policies_paid: 0,
//                 total_policies_unpaid: 0,
//                 total_policies_partially_paid: 0,
//                 total_premium_amount: 0,
//             },
//             claim: {
//                 total_claims: 0,
//                 total_claims_approved: 0,
//                 total_claims_pending: 0,
//                 total_claims_rejected: 0,
//             },
//             payment: {
//                 total_payments: 0,
//                 total_payments_paid: 0,
//                 total_payments_unpaid: 0,
//                 total_payments_pending: 0,
//             },
//             partner: {
//                 total_partners: 0,
//                 total_partners_active: 0,
//             },
//             product: {
//                 total_products: 0,
//                 total_products_active: 0,
//                 total_products_inactive: 0,
//                 total_products_pending: 0,
//             },
//             session: {
//                 total_sessions: 0,
//             }
//         };
//     }catch(err){
//     }
// }
module.exports = {
    getPolicySummary,
    getClaimSummary,
    getAllReportSummary
};
