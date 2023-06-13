import { db } from "../models/db";
const Policy = db.policies;
const User = db.users;
const Session = db.sessions;
const Claim = db.claims;


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
        
        return res.status(200).json(summary);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });

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


        return res.status(200).json(summary);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });

    }
}



module.exports = {

    getPolicySummary,
    getClaimSummary


}
