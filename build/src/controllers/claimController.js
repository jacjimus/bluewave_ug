var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { db } = require("../models/db");
const Claim = db.claims;
const User = db.users;
const Policy = db.policies;
const { Op } = require("sequelize");
const { globalSearch } = require("../services/utils");
const validatePartnerId = (partnerId) => {
    if (!partnerId) {
        throw { code: 400, message: "Please provide a partner_id" };
    }
};
const validateClaimsExistence = (claims) => {
    if (!claims || claims.length === 0) {
        throw { code: 404, message: "No claims found" };
    }
};
/**
 * @swagger
 * /api/v1/claims/all:
 *   get:
 *     tags:
 *       - Claims
 *     description: List all Claims
 *     operationId:  getAllClaims
 *     summary: List all Claims by partner ID
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
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const getAllClaims = (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { partner_id, page = 1, limit = 10, filter, start_date, end_date } = req.query;
        validatePartnerId(partner_id);
        const claimWhere = { partner_id };
        if (start_date && end_date) {
            claimWhere.createdAt = { [Op.between]: [new Date(start_date), new Date(end_date)] };
        }
        else if (start_date) {
            claimWhere.createdAt = { [Op.gte]: new Date(start_date) };
        }
        else if (end_date) {
            claimWhere.createdAt = { [Op.lte]: new Date(end_date) };
        }
        let claims = yield Claim.findAll({
            where: claimWhere,
            order: [["createdAt", "DESC"]],
            include: [{ model: User, as: "user" }, { model: Policy, as: "policy" }],
        });
        if (filter) {
            const search = filter.trim().toLowerCase();
            claims = globalSearch(claims, search);
        }
        validateClaimsExistence(claims);
        const offset = (page - 1) * limit;
        const paginatedClaims = claims.slice(offset, offset + limit);
        return res.status(200).json({
            result: {
                status: "OK",
                code: 200,
                count: claims.length,
                items: paginatedClaims,
            },
        });
    }
    catch (error) {
        console.error("Error fetching claims:", error);
        return res.status(error.code || 500).json({ status: 'FAILED', code: error.code || 500, message: error.message });
    }
});
/**
 * @swagger
 * /api/v1/claims/user/{user_id}:
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
 *         required: true
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
const getUserClaims = (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { partner_id, page = 1, limit = 10, filter, start_date, end_date } = req.query;
        validatePartnerId(partner_id);
        const { user_id } = req.params;
        console.log("GET CLAIMS", req.query);
        console.log("GET CLAIMS", req.params);
        const claimWhere = { partner_id, user_id };
        if (start_date && end_date) {
            claimWhere.createdAt = { [Op.between]: [new Date(start_date), new Date(end_date)] };
        }
        else if (start_date) {
            claimWhere.createdAt = { [Op.gte]: new Date(start_date) };
        }
        else if (end_date) {
            claimWhere.createdAt = { [Op.lte]: new Date(end_date) };
        }
        let claims = yield Claim.findAll({
            where: claimWhere,
            order: [["createdAt", "DESC"]],
            include: [{ model: User, as: "user" }, { model: Policy, as: "policy" }],
        });
        if (filter) {
            const search = filter.trim().toLowerCase();
            claims = globalSearch(claims, search);
        }
        validateClaimsExistence(claims);
        const offset = (page - 1) * limit;
        const paginatedClaims = claims.slice(offset, offset + limit);
        return res.status(200).json({
            result: {
                status: "OK",
                code: 200,
                count: claims.length,
                items: paginatedClaims,
            },
        });
    }
    catch (error) {
        console.error("Error fetching claims:", error);
        return res.status(error.code || 500).json({ status: 'FAILED', code: error.code || 500, message: error.message });
    }
});
/**
* @swagger
* /api/v1/claims/{claim_id}:
*   get:
*     tags:
*       - Claims
*     description: List Claims by Claim ID
*     operationId: listClaimsByClaimId
*     summary: list claims by claim id
*     security:
*       - ApiKeyAuth: []
*     parameters:
*       - name: partner_id
*         in: query
*         required: true
*         schema:
*           type: number
*       - name: claim_id
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
const getClaim = (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        console.log("GET CLAIMS", req.query);
        const claim = yield Claim.findByPk(req.params.claim_id, {
            include: [{ model: User, as: "user" }, { model: Policy, as: "policy" }],
        });
        if (!claim) {
            throw { code: 404, message: "Claim not found" };
        }
        return res.status(200).json({
            result: {
                status: "OK",
                code: 200,
                message: "Claim fetched successfully",
                item: claim,
            },
        });
    }
    catch (error) {
        console.error("Error getting claim:", error);
        return res.status(error.code || 500).json({ code: error.code || 500, message: error.message });
    }
});
const findUserByPhoneNumberClaims = (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { user_id } = req.params;
        const { partner_id, page = 1, limit = 10 } = req.query;
        const claims = yield Claim.findAll({
            where: { user_id, partner_id },
            order: [["createdAt", "DESC"]],
            include: [{ model: User, as: "user" }, { model: Policy, as: "policy" }],
        });
        validateClaimsExistence(claims);
        const offset = (page - 1) * limit;
        const paginatedClaims = claims.slice(offset, offset + limit);
        return res.status(200).json({
            result: {
                code: 200,
                status: "OK",
                message: "Claims fetched successfully",
                count: claims.length,
                items: paginatedClaims,
            },
        });
    }
    catch (error) {
        console.error("Error fetching claims:", error);
        return res.status(error.code || 500).json({ code: error.code || 500, message: error.message });
    }
});
/**
* @swagger
* /api/v1/claims/policy/{policy_id}:
*   get:
*     tags:
*       - Claims
*     description: List Claims by Policy ID
*     operationId: listClaimsByPolicyId
*     summary: list claims by policy id
*     security:
*       - ApiKeyAuth: []
*     parameters:
*       - name: partner_id
*         in: query
*         required: true
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
const getPolicyClaims = (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { policy_id } = req.params;
        const { partner_id, page = 1, limit = 10 } = req.query;
        const claims = yield Claim.findAll({
            where: { policy_id, partner_id },
            order: [["createdAt", "DESC"]],
            include: [{ model: User, as: "user" }, { model: Policy, as: "policy" }],
        });
        validateClaimsExistence(claims);
        const offset = (page - 1) * limit;
        const paginatedClaims = claims.slice(offset, offset + limit);
        return res.status(200).json({
            result: {
                code: 200,
                status: "OK",
                count: claims.length,
                items: paginatedClaims,
            },
        });
    }
    catch (error) {
        console.error("Error fetching claims:", error);
        return res.status(error.code || 500).json({ code: error.code || 500, message: error.message });
    }
});
/**
 * @swagger
 * /api/v1/claims/create:
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
const createClaim = (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { policy_id, user_id, partner_id } = req.query;
        const { claim_date, claim_status, claim_amount, claim_description, claim_type, claim_documents, claim_comments } = req.body;
        const policy = yield Policy.findOne({ where: { policy_id, partner_id } });
        if (!policy)
            throw { code: 404, message: "No policy found" };
        const user = yield User.findByPk(user_id);
        if (!user)
            throw { code: 404, message: "User not found" };
        const userPolicy = yield Policy.findOne({ where: { policy_id, user_id } });
        if (!userPolicy)
            throw { code: 404, message: "User does not have the policy" };
        const existingClaim = yield Claim.findOne({ where: { policy_id } });
        if (existingClaim)
            throw { code: 409, message: "Policy already has an active claim" };
        const newClaim = yield Claim.create({
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
        return res.status(201).json({
            code: 201,
            status: "OK",
            message: "Claim created successfully",
            claim: newClaim,
        });
    }
    catch (error) {
        console.error("Error creating claim:", error);
        return res.status(error.code || 500).json({ code: error.code || 500, message: error.message });
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
const updateClaim = (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { claim_id } = req.params;
        const { claim_date, claim_status, claim_amount, claim_description, claim_type, claim_documents, claim_comments } = req.body;
        const { partner_id, policy_id, user_id } = req.query;
        let claim = yield Claim.findOne({
            where: { claim_id, partner_id },
        });
        if (!claim)
            throw { code: 404, message: "Claim does not exist" };
        yield Claim.update({
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
        }, {
            where: { claim_id },
        });
        return res.status(200).json({
            result: {
                code: 200,
                status: "OK",
                message: "Claim updated successfully",
            },
        });
    }
    catch (error) {
        console.error("Error updating claim:", error);
        return res.status(error.code || 500).json({ code: error.code || 500, message: error.message });
    }
});
/**
* @swagger
* /api/v1/claims/{claim_id}:
*   delete:
*     tags:
*       - Claims
*     description: delete claim by claim id
*     operationId: deleteClaim
*     summary: delete claim by claim id
*     security:
*       - ApiKeyAuth: []
*     parameters:
*       - name: partner_id
*         in: query
*         required: true
*         schema:
*           type: number
*       - name: claim_id
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
const deleteClaim = (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const { claim_id } = req.params;
        const { partner_id } = req.query;
        yield Claim.destroy({
            where: { claim_id, partner_id },
            limit: 100,
        });
        return res.status(200).json({
            code: 200,
            status: "OK",
            message: "Claim deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting claim:", error);
        return res.status(error.code || 500).json({ code: error.code || 500, message: error.message });
    }
});
module.exports = {
    getClaim,
    getAllClaims,
    getUserClaims,
    getPolicyClaims,
    createClaim,
    findUserByPhoneNumberClaims,
    updateClaim,
    deleteClaim,
};
