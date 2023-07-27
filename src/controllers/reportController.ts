import { db } from "../models/db";
const { Op } = require("sequelize");
const Policy = db.policies;
const User = db.users;
const Session = db.sessions;
const Claim = db.claims;
const Product = db.products;
const Payment = db.payments;
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
    *     responses:
    *       200:
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const getPolicySummary = async (req: any, res: any) => {
    console.log("getPolicySummary")
    try {
        const partner_id = req.query.partner_id;
        const policy = await Policy.findAll(
            {
                where: {
                    partner_id: partner_id
                }
            }

        )

        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policies found" });
        }
        let summary = {
            total_policies: policy.length,
            total_policies_pending: policy.filter((policy: any) => policy.policy_status == "pending").length,
            total_policies_paid: policy.filter((policy: any) => policy.policy_status == "paid").length,
            total_policies_unpaid: policy.filter((policy: any) => policy.policy_status == "unpaid").length,
            total_policies_partially_paid: policy.filter((policy: any) => policy.policy_status == "partially_paid").length,
            total_preimum_amount: policy.reduce((a: any, b: any) => a + b.policy_deduction_amount * 1, 0),
        }

        return res.status(200).json({
            result: {
                items: summary
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });

    }

}

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
        let claim: any;

        if (partner_id == 1) {
            claim = await Claim.findAll();

            if (claim.length === 0) {
                return res.status(404).json({ message: "No claims found" });
            }
        } else {
            claim = await Claim.findAll({
                where: {
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
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", error: error });
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
    *         required: true
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
        const today = req.query.today
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        console.log(typeof today,today, twentyFourHoursAgo)

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
                total_installment_policies:0
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

        let users, policies, claims, payments, partners, products, sessions;

        if (partner_id != 1) {
            
           if(today == "true"){
            
            policies = await Policy.findAll({
                where: {
                    partner_id: partner_id,
                    createdAt: { [Op.gte]: twentyFourHoursAgo }, // Filter by 'createdAt' timestamp
                }
            });
            users = await User.findAll({
                 where: {
                     partner_id: partner_id,
                     createdAt: { [Op.gte]: twentyFourHoursAgo }
            } });
            claims = await Claim.findAll({ where: { partner_id: partner_id,createdAt: { [Op.gte]: twentyFourHoursAgo }} });
            payments = await Payment.findAll({ where: { partner_id: partner_id, createdAt: { [Op.gte]: twentyFourHoursAgo } }});
            partners = await Partner.findAll({ where: { partner_id: partner_id , createdAt: { [Op.gte]: twentyFourHoursAgo} }});
            products = await Product.findAll({ where: { partner_id: partner_id , createdAt: { [Op.gte]: twentyFourHoursAgo} }});
            sessions = await Session.findAll({ where: { partner_id: partner_id , createdAt: { [Op.gte]: twentyFourHoursAgo} }});
           }else{
            policies = await Policy.findAll({ where: { partner_id: partner_id } });
            users = await User.findAll({ where: { partner_id: partner_id } });
            claims = await Claim.findAll({ where: { partner_id: partner_id } });
            payments = await Payment.findAll({ where: { partner_id: partner_id } });
            partners = await Partner.findAll({ where: { partner_id: partner_id } });
            products = await Product.findAll({ where: { partner_id: partner_id } });
            sessions = await Session.findAll({ where: { partner_id: partner_id } });
           }
        } else {
            
            if(today == "true" ){
                
                policies = await Policy.findAll({
                    where: {
                       
                        createdAt: { [Op.gte]: twentyFourHoursAgo }, // Filter by 'createdAt' timestamp
                    }
                });
                users = await User.findAll({
                     where: {
                         createdAt: { [Op.gte]: twentyFourHoursAgo }
                } });
                claims = await Claim.findAll({ where: { createdAt: { [Op.gte]: twentyFourHoursAgo }} });
                payments = await Payment.findAll({ where: {  createdAt: { [Op.gte]: twentyFourHoursAgo } }});
                partners = await Partner.findAll({ where: {  createdAt: { [Op.gte]: twentyFourHoursAgo} }});
                products = await Product.findAll({ where: {  createdAt: { [Op.gte]: twentyFourHoursAgo} }});
                sessions = await Session.findAll({ where: { createdAt: { [Op.gte]: twentyFourHoursAgo} }});
               }else{
                users = await User.findAll();
                policies = await Policy.findAll();
                claims = await Claim.findAll();
                payments = await Payment.findAll();
                partners = await Partner.findAll();
                products = await Product.findAll();
                sessions = await Session.findAll();
               }
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
        summary.policy.total_installment_policies = countInstallmentPolicies(policies)

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
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const countUsersByActivity = (users: any[], isActive: boolean): number => {
    return users.filter((user: any) => user.is_active === isActive).length;
};

const countPoliciesByStatus = (policies: any[], status: string): number => {
    return policies.filter((policy: any) => policy.policy_status === status).length;
};

const calculateTotalPremiumAmount = (policies: any[]): number => {
    return policies.reduce((total: number, policy: any) => total + (policy.policy_deduction_amount * 1), 0);
};

const countPaymentsByStatus = (payments: any[], status: string): number => {
    return payments.filter((payment: any) => payment.payment_status === status).length;
};

const countPartnersByActivity = (partners: any[], isActive: boolean): number => {
    return partners.filter((partner: any) => partner.is_active === isActive).length;
};

const countProductsByStatus = (products: any[], status: string): number => {
    return products.filter((product: any) => product.product_status === status).length;
};

const countClaimsByStatus = (claims: any[], status: string): number => {
    return claims.filter((claim: any) => claim.claim_status === status).length;
};

const countInstallmentPolicies =(policies:any[]): number=>{
    return policies.filter((policy:any)=> policy.installment_order !== 1).length
}


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


}
