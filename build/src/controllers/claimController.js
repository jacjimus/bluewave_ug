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
    *     responses:
    *       200:
    *         description: Information fetched successfully
    *       400:
    *         description: Invalid request
    */
const getClaims = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const claim = yield Claim.findAll();
        if (!claim || claim.length === 0) {
            return res.status(404).json({ message: "No claims found" });
        }
        return res.status(200).json(claim);
    }
    catch (error) {
        console.log(error);
        return res.status(404).json({ message: "Error fetching claims" });
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
        const claim = yield Claim.findByPk(claim_id);
        if (!claim) {
            return res.status(404).json({ message: "Claim not found" });
        }
        return res.status(200).json(claim);
    }
    catch (error) {
        console.log(error);
        return res.status(404).json({ message: "Error getting claim" });
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
 *       - name: user_id
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
const getUserClaims = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = parseInt(req.params.user_id);
        const claim = yield Claim.findAll({
            where: {
                user_id: user_id
            }
        });
        if (!claim || claim.length === 0) {
            return res.status(404).json({ message: "No claims found" });
        }
        return res.status(200).json(claim);
    }
    catch (error) {
        console.log(error);
        return res.status(404).json({ message: "Error fetching claims" });
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
*       - name: policy_id
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
const getPolicyClaims = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const policy_id = parseInt(req.params.policy_id);
        const claim = yield Claim.findAll({
            where: {
                policy_id: policy_id
            }
        });
        if (!claim || claim.length === 0) {
            return res.status(404).json({ message: "No claims found" });
        }
        return res.status(200).json(claim);
    }
    catch (error) {
        console.log(error);
        return res.status(404).json({ message: "Error fetching claims" });
    }
});
/**
 * @swagger
 * /api/v2/claims:
 *   post:
 *     tags:
 *       - Claims
 *     description: Create Claim
 *     operationId: createClaim
 *     summary: Create a Claim
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: policy_id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:   {"claim_date": "2021-05-05","claim_status": "pending","claim_amount": 5000,"claim_description": "I need to claim hospita lcash", "claim_type": "hospital cash","claim_documents": "https://www.google.com","claim_comments": "I need to claim my money","user_id": 1,"policy_id": 1}
 *     responses:
 *       200:
 *         description: Information posted successfully
 *       400:
 *         description: Invalid request
 */
const createClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const policy_id = parseInt(req.query.policy_id);
        const { claim_date, claim_status, claim_amount, claim_description, claim_type, claim_documents, claim_comments, user_id, } = req.body;
        let claim = yield Claim.findOne({
            where: {
                policy_id: policy_id
            }
        });
        if (claim || claim.length !== 0) {
            return res.status(404).json({ message: "Claim already exists" });
        }
        const newClaim = yield Claim.create({
            claim_date: claim_date,
            claim_status: claim_status,
            claim_amount: claim_amount,
            claim_description: claim_description,
            claim_type: claim_type,
            claim_documents: claim_documents,
            claim_comments: claim_comments,
            user_id: user_id,
            policy_id: policy_id
        });
        if (newClaim !== null) {
            return res.status(200).json({
                message: 'Claim created successfully'
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(404).json({ message: "Error creating claim" });
    }
});
/**
 * @swagger
 * /api/v2/claims/{claim_id}:
 *   patch:
 *     tags:
 *       - Claims
 *     description: Edit Claim Status
 *     operationId: editClaimStatus
 *     summary: Edit Claim Status
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: claim_id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: {"claim_date": "2021-05-05","claim_status": "approved","claim_amount": 5000,"claim_description": "I need to claim hospita lcash", "claim_type": "hospital cash","claim_documents": "https://www.google.com","claim_comments": "I need to claim my money","user_id": 1,"policy_id": 1}
 *     responses:
 *       200:
 *         description: Information posted successfully
 *       400:
 *         description: Invalid request
 */
const updateClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { claim_date, claim_status, claim_amount, claim_description, claim_type, claim_documents, claim_comments, user_id, policy_id } = req.body;
        const claim_id = parseInt(req.params.claim_id);
        let claim = yield Claim.findOne({
            where: {
                claim_id: claim_id
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
            policy_id: policy_id
        }, {
            where: {
                claim_id: claim_id
            }
        });
        if (updateClaim) {
            return res.status(200).json({
                message: 'Claim updated successfully'
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(404).json({ message: "Error updating claim" });
    }
});
//deleting a claim
const deleteClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const claim_id = parseInt(req.params.claim_id);
        const deleteClaim = yield Claim.destroy({
            where: {
                claim_id: claim_id
            }
        });
        if (deleteClaim) {
            return res.status(200).json({
                message: 'Claim deleted successfully'
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(404).json({ message: "Error deleting claim" });
    }
});
module.exports = {
    getClaims,
    createClaim,
    getClaim,
    getUserClaims,
    getPolicyClaims,
    updateClaim,
    deleteClaim
};
