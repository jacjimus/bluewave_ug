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
const Policy = db_1.db.policies;
/**
    * @swagger
    * /api/v1/policies:
    *   get:
    *     tags:
    *       - Policies
    *     description: List policies
    *     operationId: listPolicies
    *     summary: List policies
    *     security:
    *       - ApiKeyAuth: []
    *     responses:
    *       200:
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const getPolicies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const policy = yield Policy.findAll().then((policies) => {
            return res.status(200).json(policies);
        });
        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policies found" });
        }
        return res.status(200).json(policy);
    }
    catch (error) {
        return res.status(404).json({ message: "Error fetching policies" });
    }
});
/**
  * @swagger
  * /api/v1/policies/{policy_id}:
  *   get:
  *     tags:
  *       - Policies
  *     description: List policies by agreement_id
  *     operationId: listPoliciesByAgreementID
  *     summary: List policies
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
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const getPolicy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const policy_id = parseInt(req.params.policy_id);
        const policy = yield Policy.findOne({
            where: {
                policy_id: policy_id
            }
        });
        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policy found" });
        }
        return res.status(200).json(policy);
    }
    catch (error) {
        console.log(error);
        return res.status(404).json({ message: "error getting policy" });
    }
});
/* * @swagger
   * /api/v1/policies/user/{user_id}:
   *   get:
   *     tags:
   *       - Policies
   *     description: List policies by user_id
   *     operationId:  ListPoliciesByUserID
   *     summary: List user policies
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
   *         description: Information fetched succussfuly
   *       400:
   *         description: Invalid request
   */
const getUserPolicies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = parseInt(req.params.user_id);
        let user = yield Policy.findAll({
            where: {
                user_id: user_id
            }
        });
        if (!user || user.length === 0) {
            return res.status(404).json({ message: "No user found" });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.log(error);
        return res.status(404).json({ message: "No policy found" });
    }
});
/* * @swagger
   * /api/v1/policies/{policy_id}:
   *   put:
   *     tags:
   *       - Policies
   *     description: Update policies by policy_id
   *     operationId:  UpdatePoliciesByPolicyID
   *     summary: List user policies
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
   *         description: Information fetched succussfuly
   *       400:
   *         description: Invalid request
   */
const updatePolicy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { policy_start_date, policy_status, beneficiary, policy_type, policy_end_date, policy_deduction_amount, policy_next_deduction_date } = req.body;
        let policy = yield Policy.findOne({
            where: {
                policy_id: req.params.policy_id
            }
        });
        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policy found" });
        }
        const data = {
            policy_start_date,
            policy_status,
            beneficiary,
            policy_type,
            policy_end_date,
            policy_deduction_amount,
            policy_next_deduction_date,
            updatedAt: new Date(),
        };
        //saving the policy
        const updatedPolicy = yield Policy.update(data, {
            where: {
                policy_id: req.params.policy_id,
            },
        });
        //send policy details
        return res.status(201).send(updatedPolicy);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Details are not correct" });
    }
});
//deleting a policy
const deletePolicy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const policy = yield Policy.destroy({
            where: {
                policy_id: req.params.policy_id,
            },
        });
        //send policy details
        return res.status(201).send(policy);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Details are not correct" });
    }
});
module.exports = {
    getPolicies,
    getPolicy,
    getUserPolicies,
    // getPolicyPayments,
    updatePolicy,
    deletePolicy
};
