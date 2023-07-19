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
const Payment = db_1.db.payments;
const Policy = db_1.db.policies;
const User = db_1.db.users;
const Claim = db_1.db.claims;
const { Op } = require("sequelize");
/**
    * @swagger
    * /api/v1/payments:
    *   get:
    *     tags:
    *       - Payments
    *     description: List payments
    *     operationId: listPayments
    *     summary: List payments
    *     security:
    *       - ApiKeyAuth: []
    *     parameters:
    *       - name: partner_id
    *         in: query
    *         required: false
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
    *       - name: limit
    *         in: query
    *         required: false
    *         schema:
    *           type: number
    *     responses:
    *       200:
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const getPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const partner_id = req.query.partner_id;
    const filter = req.query.filter || '';
    try {
        let payments = yield Payment.findAll({
            where: {
                partner_id: partner_id,
                [Op.or]: [
                    {
                        payment_description: {
                            [Op.iLike]: `%${filter}%`
                        }
                    },
                    {
                        payment_type: {
                            [Op.iLike]: `%${filter}%`
                        }
                    }
                ]
            },
            offset: (page - 1) * limit,
            limit: limit,
            order: [
                ['payment_id', 'DESC']
            ],
            include: [
                { model: User, as: 'user' },
                { model: Policy, as: 'policy' },
                { model: Claim, as: 'claim' }
            ],
        });
        console.log(payments);
        if (!payments || payments.length === 0) {
            return res.status(404).json({ message: "No payments found" });
        }
        return res.status(200).json({ result: {
                count: payments.length,
                items: payments,
            } });
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({ message: "Internal server error", error: error });
    }
});
/**
    * @swagger
    * /api/v1/payments/{payment_id}:
    *   get:
    *     tags:
    *       - Payments
    *     description: Get payment
    *     operationId: getPament
    *     summary: Get payment
    *     security:
    *       - ApiKeyAuth: []
    *     parameters:
    *       - name: partner_id
    *         in: query
    *         required: false
    *         schema:
    *           type: number
    *       - name: payment_id
    *         in: path
    *         required: true
    *         schema:
    *           type: string
    *     responses:
    *       200:
    *         description: Information fetched succussfuly
    *       400:
    *         description: Invalid request
    */
const getPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let payment_id = parseInt(req.params.payment_id);
    const partner_id = req.query.partner_id;
    try {
        yield Payment.findAll({
            where: {
                payment_id: payment_id,
                partner_id: partner_id
            }
        }).then((payment) => {
            res.status(200).json({ result: {
                    item: payment
                } });
        });
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({ message: "Internal server error", error: error });
    }
});
/**
    * @swagger
    * /api/v1/payments/policy/{policy_id}:
    *   get:
    *     tags:
    *       - Payments
    *     description: List Policy payments
    *     operationId: listPolicyPayments
    *     summary: List Policy payments
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
    *         required: false
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
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const getPolicyPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const partner_id = req.query.partner_id;
    try {
        let policy_id = parseInt(req.params.policy_id);
        let payments = yield Payment.findAll({
            where: {
                policy_id: policy_id,
                partner_id: partner_id
            }
        });
        if (payments.length > 0) {
            //pagination logic
            //paginate the response
            if (page && limit) {
                let startIndex = (page - 1) * limit;
                let endIndex = page * limit;
                let results = payments.slice(startIndex, endIndex);
                res.status(200).json({ result: {
                        count: payments.length,
                        items: results
                    } });
            }
            else {
                res.status(404).json({ message: "No payments found" });
            }
        }
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({ message: "Internal server error", error: error });
    }
});
/**
    * @swagger
    * /api/v1/payments/user/{user_id}:
    *   get:
    *     tags:
    *       - Payments
    *     description: List User payments
    *     operationId: listUserPayments
    *     summary: List User payments
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
    *         required: false
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
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const getUserPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const partner_id = req.query.partner_id;
    let user_payments = [];
    let user_id = parseInt(req.params.user_id);
    //policies that belong to the user
    let user_policies = yield Policy.findAll({
        where: {
            id: user_id,
            partner_id: partner_id
        }
    });
    console.log("USER POLICIES", user_policies);
    //for each policy, get the payments 
    for (let i = 0; i < user_policies.length; i++) {
        let policy_id = user_policies[i].id;
        let payments = yield Payment.findAll({
            where: {
                policy_id: policy_id,
                partner_id: partner_id
            }
        });
        user_payments.push(payments);
    }
    try {
        if (user_payments.length > 0) {
            //paginate the response
            if (page && limit) {
                let startIndex = (page - 1) * limit;
                let endIndex = page * limit;
                let results = user_payments.slice(startIndex, endIndex);
                res.status(200).json({ result: {
                        count: user_payments.length,
                        items: results
                    } });
            }
        }
        else {
            res.status(404).json({ message: "No payments found" });
        }
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({ message: "Internal server error", error: error });
    }
});
/**
  * @swagger
  * /api/v1/payments/create:
  *   post:
  *     tags:
  *       - Payments
  *     description:
  *     operationId: createPayment
  *     summary:
  *     security:
  *       - ApiKeyAuth: []
  *     parameters:
  *       - name: partner_id
  *         in: query
  *         required: false
  *         schema:
  *           type: number
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             example: { "claim_id": 1,"user_id": 1,"partner_id":1, "policy_id": 3,"payment_date": "2023-6-22","payment_amount": 1000, "payment_metadata": { "payment_method": "mobile money","payment_reference": "1234567890","payment_phone_number": "256700000000","payment_email": "test@test","payment_country": "uganda","payment_currency": "ugx","payment_amount": 1000},"payment_type": "premium","payment_status": "paid","payment_description": "premium payment for policy 3"}
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Payment.create(req.body).then((payment) => {
            res.status(200).json({ result: {
                    item: payment
                } });
        });
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({ message: "Internal server error", error: error });
    }
});
module.exports = {
    getPayments,
    getPayment,
    getPolicyPayments,
    getUserPayments,
    createPayment
};
