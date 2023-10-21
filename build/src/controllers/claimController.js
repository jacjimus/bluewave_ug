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
const Claim = db_1.db.claims;
const User = db_1.db.users;
const Policy = db_1.db.policies;
const Partner = db_1.db.partners;
const { Op } = require("sequelize");
const Log = db_1.db.logs;
const uuid_1 = require("uuid");
const utils_1 = require("../services/utils");
/**
    * @swagger
    * /api/v1/claims:
    *   get:
    *     tags:
    *       - Claims
    *     description: List Claims
    *     operationId: listClaims
    *     summary: List Claims
    *     security:
    *       - ApiKeyAuth: []
    *     parameters:
    *       - name: partner_id
    *         in: query
    *         required: false
    *         schema:
    *           type: number
    *       - name: filter
    *         in: query
    *         required: false
    *         schema:
    *           type: string
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
    *         description: Information fetched successfully
    *       400:
    *         description: Invalid request
    */
const getClaims = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const partner_id = req.query.partner_id;
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    const filter = req.query.filter;
    const start_date = req.query.start_date; // Start date as string, e.g., "2023-07-01"
    const end_date = req.query.end_date; // End date as string, e.g., "2023-07-31"
    try {
        if (!partner_id) {
            return res.status(400).json({
                code: 400, message: "Please provide a partner_id"
            });
        }
        let claim;
        const claimWhere = { partner_id: partner_id };
        // Add date filters to the 'claimWhere' object based on the provided start_date and end_date
        if (start_date && end_date) {
            claimWhere.createdAt = { [Op.between]: [new Date(start_date), new Date(end_date)] };
        }
        else if (start_date) {
            claimWhere.createdAt = { [Op.gte]: new Date(start_date) };
        }
        else if (end_date) {
            claimWhere.createdAt = { [Op.lte]: new Date(end_date) };
        }
        // Check if a filter is provided to include additional search criteria
        if (filter) {
            // Convert the filter to lowercase for case-insensitive search
            const search = filter.toLowerCase();
            // Use the filter() method to find objects matching the search term
            claim = yield Claim.findAll({
                where: claimWhere,
                order: [["createdAt", "DESC"]],
                include: [{ model: User, as: "user" }, { model: Policy, as: "policy" }],
            });
            // Use the globalSearch() method to find objects matching the search term
            claim = (0, utils_1.globalSearch)(claim, search);
        }
        else {
            // Retrieve claims based on the 'claimWhere' filter object
            claim = yield Claim.findAll({
                where: claimWhere,
                order: [["createdAt", "DESC"]],
                include: [{ model: User, as: "user" }, { model: Policy, as: "policy" }],
            });
        }
        console.log("CLAIM", claim);
        if (!claim || claim.length === 0) {
            return res.status(404).json({ message: "No claims found" });
        }
        if (page && limit) {
            let offset = page * limit - limit;
            let paginatedClaims = claim.slice(offset, offset + limit);
            return res.status(200).json({
                result: {
                    code: 200,
                    count: claim.length,
                    items: paginatedClaims,
                },
            });
        }
        yield Log.create({
            log_id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            message: `Claims fetched successfully`,
            level: 'info',
            user: req === null || req === void 0 ? void 0 : req.user_id,
            partner_id: req === null || req === void 0 ? void 0 : req.partner_id,
        });
        return res.status(200).json({
            code: 200,
            result: claim
        });
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({
            code: 200,
            message: "Error fetching claims", error: error
        });
    }
});
/**
  * @swagger
  * /api/v1/claims/{claim_id}:
  *   get:
  *     tags:
  *       - Claims
  *     description: Claim Details
  *     operationId: getClaim
  *     summary: Claim Details
  *     security:
  *       - ApiKeyAuth: []
  *     parameters:
  *       - name: partner_id
  *         in: query
  *         required: false
  *         schema:
  *           type: number
  *       - name: claim_id
  *         in: path
  *         required: true
  *         schema:
  *           type: number
  *     responses:
  *       200:
  *         description: Information fetched successfully
  *       400:
  *         description: Invalid request
  */
const getClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const claim_id = parseInt(req.params.claim_id);
        const claim = yield Claim.findByPk(claim_id, {
            include: [
                { model: User, as: 'user' },
                { model: Policy, as: 'policy' }
            ]
        });
        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }
        yield Log.create({
            log_id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            message: `Claim fetched successfully`,
            level: 'info',
            user: req === null || req === void 0 ? void 0 : req.user_id,
            partner_id: req === null || req === void 0 ? void 0 : req.partner_id,
        });
        return res.status(200).json({
            result: {
                code: 200,
                message: 'Claim fetched successfully',
                item: claim
            }
        });
    }
    catch (error) {
        console.error('Error getting claim:', error);
        return res.status(500).json({
            code: 500, message: 'Internal server error', error: error.message
        });
    }
});
/**
 * @swagger
 * /api/v1/claims/{user_id}:
 *   get:
 *     tags:
 *       - Claims
 *     description: List Claims by user ID
 *     operationId: ListClaimsByUser
 *     summary: List Claims by user ID
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *       - name: user_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const findUserByPhoneNumberClaims = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const partner_id = req.query.partner_id;
    try {
        const user_id = parseInt(req.params.user_id);
        const claims = yield Claim.findAll({
            where: {
                user_id: user_id,
                partner_id: partner_id,
            },
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'user' },
                { model: Policy, as: 'policy' }
            ]
        });
        if (!claims || claims.length === 0) {
            return res.status(404).json({ message: 'No claims found' });
        }
        if (page && limit) {
            const offset = (page - 1) * limit;
            const paginatedClaims = claims.slice(offset, offset + limit);
            return res.status(200).json({
                result: {
                    code: 200,
                    message: 'Claims fetched successfully',
                    count: claims.length,
                    items: paginatedClaims
                }
            });
        }
        yield Log.create({
            log_id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            message: `User Claims fetched successfully`,
            level: 'info',
            user: req === null || req === void 0 ? void 0 : req.user_id,
            partner_id: req === null || req === void 0 ? void 0 : req.partner_id,
        });
        return res.status(200).json(claims);
    }
    catch (error) {
        console.error('Error fetching claims:', error);
        return res.status(500).json({
            code: 500, message: 'Internal server error', error: error.message
        });
    }
});
/**
* @swagger
* /api/v1/claims/{policy_id}:
*   get:
*     tags:
*       - Claims
*     description: list claims by policy id
*     operationId: listClaimsByPolicyId
*     summary: list claims by policy id
*     security:
*       - ApiKeyAuth: []
*     parameters:
*       - name: partner_id
*         in: query
*         required: false
*         schema:
*           type: number
*       - name: policy_id
*         in: path
*         required: true
*         schema:
*           type: string
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
*     responses:
*       200:
*         description: Information fetched successfully
*       400:
*         description: Invalid request
*/
const getPolicyClaims = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const partner_id = req.query.partner_id;
    try {
        const policy_id = parseInt(req.params.policy_id);
        const claims = yield Claim.findAll({
            where: {
                policy_id: policy_id,
                partner_id: partner_id
            },
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'user' },
                { model: Policy, as: 'policy' }
            ]
        });
        if (!claims || claims.length === 0) {
            return res.status(404).json({
                code: 404, message: 'No claims found'
            });
        }
        if (page && limit) {
            const offset = (page - 1) * limit;
            const paginatedClaims = claims.slice(offset, offset + limit);
            return res.status(200).json({
                result: {
                    code: 200,
                    count: claims.length,
                    items: paginatedClaims
                }
            });
        }
        yield Log.create({
            log_id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            message: `Policy Claims fetched successfully`,
            level: 'info',
            user: req === null || req === void 0 ? void 0 : req.user_id,
            partner_id: req === null || req === void 0 ? void 0 : req.partner_id,
        });
        return res.status(200).json(claims);
    }
    catch (error) {
        console.error('Error fetching claims:', error);
        return res.status(500).json({
            code: 500, message: 'Internal server error', error: error.message
        });
    }
});
/**
 * @swagger
 * /api/v1/claims:
 *   post:
 *     tags:
 *       - Claims
 *     description: Create Claim
 *     operationId: createClaim
 *     summary: Create a Claim
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: policy_id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: user_id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:   { "claim_date": "2021-05-05","claim_status": "pending","claim_amount": 5000,"claim_description": "I need to claim hospita lcash", "claim_type": "hospital cash","claim_documents": ["https://www.google.com"],"claim_comments": "I need to claim my money"}
 *     responses:
 *       200:
 *         description: Information posted successfully
 *       400:
 *         description: Invalid request
 */
const createClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const policy_id = parseInt(req.query.policy_id);
        const user_id = parseInt(req.query.user_id);
        const partner_id = parseInt(req.query.partner_id);
        const { claim_date, claim_status, claim_amount, claim_description, claim_type, claim_documents, claim_comments, } = req.body;
        // Check if policy exists
        const policy = yield Policy.findOne({
            where: {
                policy_id: policy_id,
                partner_id: partner_id,
            }
        });
        if (!policy) {
            return res.status(404).json({
                code: 404, message: "No policy found"
            });
        }
        // Check if user exists
        const user = yield User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({
                code: 404, message: "User not found"
            });
        }
        // Check if user has the policy
        const userPolicy = yield Policy.findOne({
            where: {
                policy_id: policy_id,
                user_id: user_id,
            }
        });
        if (!userPolicy) {
            return res.status(404).json({
                code: 404, message: "User does not have the policy"
            });
        }
        // Check if the policy already has an active claim
        const existingClaim = yield Claim.findOne({
            where: {
                policy_id: policy_id,
            }
        });
        if (existingClaim) {
            return res.status(409).json({
                code: 400, message: "Policy already has an active claim"
            });
        }
        // Create the new claim
        let newClaim = yield Claim.create({
            claim_date,
            claim_status,
            claim_amount,
            claim_description,
            claim_type,
            claim_documents,
            claim_comments,
            user_id,
            policy_id,
            partner_id,
        });
        console.log("NEW CLAIM", newClaim);
        yield Log.create({
            log_id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            message: `Claim created successfully`,
            level: 'info',
            user: req === null || req === void 0 ? void 0 : req.user_id,
            partner_id: req === null || req === void 0 ? void 0 : req.partner_id,
        });
        return res.status(201).json({
            code: 201, message: "Claim created successfully", claim: newClaim
        });
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({
            code: 500, message: "Error creating claim", error: error.message
        });
    }
});
/**
 * @swagger
 * /api/v1/claims/{claim_id}:
 *   put:
 *     tags:
 *       - Claims
 *     description: Edit Claim Status
 *     operationId: editClaimStatus
 *     summary: Edit Claim Status
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *       - name: claim_id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *       - name: policy_id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: user_id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: {"claim_date": "2021-05-05","claim_status": "approved","claim_amount": 5000,"claim_description": "I need to claim hospita lcash", "claim_type": "hospital cash","claim_documents": "https://www.google.com","claim_comments": "I need to claim my money"}
 *     responses:
 *       200:
 *         description: Information posted successfully
 *       400:
 *         description: Invalid request
 */
const updateClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { claim_date, claim_status, claim_amount, claim_description, claim_type, claim_documents, claim_comments } = req.body;
        const claim_id = parseInt(req.params.claim_id);
        const policy_id = parseInt(req.query.policy_id);
        const user_id = parseInt(req.query.user_id);
        const partner_id = req.query.partner_id;
        let claim = yield Claim.findAll({
            where: {
                claim_id: claim_id,
                partner_id: partner_id
            }
        });
        if (!claim || claim.length === 0) {
            return res.status(404).json({ message: "Claims dont exists" });
        }
        const updateClaim = yield Claim.update({
            claim_date: claim_date,
            claim_status: claim_status,
            claim_amount: claim_amount,
            claim_description: claim_description,
            claim_type: claim_type,
            claim_documents: claim_documents,
            claim_comments: claim_comments,
            user_id: user_id,
            policy_id: policy_id,
            partner_id: partner_id
        }, {
            where: {
                claim_id: claim_id
            }
        });
        // //update policy pendng premium
        // const updatePolicy = await Policy.update({
        //     policy_pending_premium: claim_amount,
        // }, {
        //     where: {
        //         policy_id: policy_id
        //     }
        // });
        if (updateClaim) {
            return res.status(200).json({
                result: {
                    code: 200,
                    message: 'Claim updated successfully'
                }
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            code: 500, message: "Error updating claim", error: error
        });
    }
});
//deleting a claim
const deleteClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const claim_id = parseInt(req.params.claim_id);
        const partner_id = req.query.partner_id;
        const deleteClaim = yield Claim.destroy({
            where: {
                claim_id: claim_id,
                partner_id: partner_id
            }
        });
        yield Log.create({
            log_id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            message: `Claim deleted successfully`,
            level: 'info',
            user: req === null || req === void 0 ? void 0 : req.user_id,
            partner_id: req === null || req === void 0 ? void 0 : req.partner_id,
        });
        if (deleteClaim) {
            return res.status(200).json({
                code: 200,
                message: 'Claim deleted successfully'
            });
        }
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({
            code: 500, message: "Error deleting claim", error: error
        });
    }
});
module.exports = {
    getClaims,
    createClaim,
    getClaim,
    findUserByPhoneNumberClaims,
    getPolicyClaims,
    updateClaim,
    deleteClaim
};
