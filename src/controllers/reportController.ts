import { db } from "../models/db";
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
        const policy = await Policy.findAll()

        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policies found" });
        }
        let summary = {
            total_policies: policy.length,
            total_policies_active: policy.filter((policy: any) => policy.policy_status === "active").length,
            total_policies_inactive: policy.filter((policy: any) => policy.policy_status !== "active").length,
            total_policies_pending: policy.filter((policy: any) => policy.policy_status === "pending").length,
            total_policies_cancelled: policy.filter((policy: any) => policy.policy_status === "cancelled").length,
            total_policies_expired: policy.filter((policy: any) => policy.policy_status === "expired").length,
            total_policies_terminated: policy.filter((policy: any) => policy.policy_status === "terminated").length,
            total_preimum_amount: policy.reduce((a: any, b: any) => a + b.policy_deduction_amount * 1, 0),
        }
        
        return res.status(200).json({result:{
            items: summary
        }});
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
    *     responses:
    *       200:
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */

const getClaimSummary = async (req: any, res: any) => {
    console.log("getClaimSummary")
    try {
        const claim = await Claim.findAll()

        if (!claim || claim.length === 0) {
            return res.status(404).json({ message: "No claims found" });
        }
        let summary = {
            total_claims: claim.length,
            total_claims_approved: claim.filter((claim: any) => claim.claim_status === "approved").length,
            total_claims_pending: claim.filter((claim: any) => claim.claim_status === "pending").length,
            total_claims_rejected: claim.filter((claim: any) => claim.claim_status === "rejected").length,
            total_claims_cancelled: claim.filter((claim: any) => claim.claim_status === "cancelled").length,
            total_claims_paid: claim.filter((claim: any) => claim.claim_status === "paid").length,
            total_claims_unpaid: claim.filter((claim: any) => claim.claim_status === "unpaid").length,
            total_claims_disputed: claim.filter((claim: any) => claim.claim_status === "disputed").length,
            total_claims_dispute_resolved: claim.filter((claim: any) => claim.claim_status === "dispute_resolved").length
        }


        return res.status(200).json({result:{
            items: summary
            }});
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error });

    }
}

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
    *     responses:
    *       200:
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const getAllReportSummary = async (req: any, res: any) => {
    let summary = {
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
            total_policies_active: 0,
            total_premium_amount: 0,    
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
    }

    try {
        let users = await User.findAll();
        let policies = await Policy.findAll();
        let claims = await Claim.findAll();
        let payments = await Payment.findAll();
        let partners = await Partner.findAll();
        let products = await Product.findAll();
        let sessions = await Session.findAll();

        // Populate user summary
        summary.user.total_users = users.length;
        summary.user.total_users_active = users.filter((user:any) => user.is_active == true).length;
        summary.user.total_users_inactive = users.filter((user:any) => user.is_active == false).length;
       

        // Populate policy summary
        summary.policy.total_policies = policies.length;
        summary.policy.total_policies_active = policies.filter(policy => policy.policy_status === 'active').length;
        summary.policy.total_premium_amount = policies.reduce((a: any, b: any) => a + b.policy_deduction_amount * 1, 0);

        // Populate claim summary
        summary.claim.total_claims = claims.length;
        summary.claim.total_claims_approved = claims.filter((claim:any) => claim.claim_status === 'approved').length;
        summary.claim.total_claims_pending = claims.filter((claim:any) => claim.claim_status === 'pending').length;
        summary.claim.total_claims_rejected = claims.filter((claim:any) => claim.claim_status === 'rejected').length;

        // Populate payment summary
        summary.payment.total_payments = payments.length;
        summary.payment.total_payments_paid = payments.filter((payment:any) => payment.paymant_status === 'paid').length;
        summary.payment.total_payments_unpaid = payments.filter((payment:any) => payment.payment_status === 'unpaid').length;
        summary.payment.total_payments_pending = payments.filter((payment:any) => payment.payment_status === 'pending').length;

        // Populate partner summary
        summary.partner.total_partners = partners.length;
        summary.partner.total_partners_active = partners.filter((partner:any) => partner.is_active == true).length;

        // Populate product summary
        summary.product.total_products = products.length;
        summary.product.total_products_active = products.filter((product:any) => product.product_status === 'active').length;
        summary.product.total_products_inactive = products.filter((product:any) => product.product_status === 'inactive').length;
        summary.product.total_products_pending = products.filter((product:any) => product.product_status === 'pending').length;

        // Populate session summary
        summary.session.total_sessions = sessions.length;

        // Return the summary
        res.status(200).json({ summary });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
}




module.exports = {

    getPolicySummary,
    getClaimSummary,
    getAllReportSummary


}
