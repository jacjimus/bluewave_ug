import { db } from "../models/db";
const Payment = db.payments;
const Policy = db.policies;
const User = db.users;
const Claim = db.claims;
const Log = db.logs;
import { v4 as uuid_v4 } from "uuid";
import { airtelMoney, airtelMoneyKenya } from "../services/payment";
uuid_v4()
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
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const getPayments = async (req: any, res: any) => {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const partner_id = req.query.partner_id;
    let filter = req.query.filter// Filter string
    const start_date = req.query.start_date; // Start date as string, e.g., "2023-07-01"
    const end_date = req.query.end_date; // End date as string, e.g., "2023-07-31"

    try {
        let payments: any;
        const paymentWhere: any = { partner_id: partner_id };

        // Add date filters to the 'paymentWhere' object based on the provided start_date and end_date
        if (start_date && end_date) {
            paymentWhere.createdAt = { [Op.between]: [new Date(start_date), new Date(end_date)] };
        } else if (start_date) {
            paymentWhere.createdAt = { [Op.gte]: new Date(start_date) };
        } else if (end_date) {
            paymentWhere.createdAt = { [Op.lte]: new Date(end_date) };
        }

        // Check if a filter is provided to include additional search criteria
        if (filter) {
            filter = filter?.trim().toLowerCase();

            paymentWhere[Op.or] = [
                { payment_description: { [Op.iLike]: `%${filter}%` } },
                { payment_type: { [Op.iLike]: `%${filter}%` } },
            ];
        }

        // Retrieve payments based on the 'paymentWhere' filter object
        payments = await Payment.findAll({
            where: paymentWhere,
            offset: (page - 1) * limit,
            limit: limit,
            order: [["payment_id", "DESC"]],
            include: [{ model: User, as: "user" }, { model: Policy, as: "policy" }, { model: Claim, as: "claim" }],
        });

        if (!payments || payments.length === 0) {
            return res.status(404).json({
                code: 404,
                message: "No payments found"
            });
        }

        return res.status(200).json({
            result: {
                code: 200,
                status: "OK",
                count: payments.length,
                items: payments,
            },
        });
    } catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({
            code: 500,
            status: "FAILED",
            message: "Internal server error", error: error
        });
    }
};



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
const getPayment = async (req: any, res: any) => {
    const payment_id = parseInt(req.params.payment_id);
    const partner_id = req.query.partner_id;

    try {
        const payment = await Payment.findOne({
            where: {
                payment_id: payment_id,
                partner_id: partner_id
            },
            include: [{ model: User, as: "user" }, { model: Policy, as: "policy" }, { model: Claim, as: "claim" }],
            limit: 1
        });


        if (payment) {
            return res.status(200).json({
                result: {
                    code: 200,
                    status: "OK",
                    item: payment
                }
            });
        } else {
            return   res.status(404).json({
                code: 404, message: "Payment not found"
            });
        }
    } catch (error) {
        console.error("ERROR", error);
        res.status(500).json({
            code: 500,
            status: "FAILED", message: "Internal server error", error: error.message
        });
    }
};


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
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const getPolicyPayments = async (req: any, res: any) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const partner_id = req.query.partner_id;

    try {
        const policy_id = parseInt(req.params.policy_id);
        const payments = await Payment.findAll({
            where: {
                policy_id: policy_id,
                partner_id: partner_id
            },
            include: [{ model: User, as: "user" }, { model: Policy, as: "policy" }, { model: Claim, as: "claim" }],
            limit: 100,
        });

        if (payments.length > 0) {
            // Pagination logic
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const results = payments.slice(startIndex, endIndex);

            return res.status(200).json({
                result: {
                    count: payments.length,
                    items: results
                }
            });
        } else {
            res.status(404).json({ code: 404, message: "No payments found" });
        }
    } catch (error) {
        console.error("ERROR", error);
        res.status(500).json({
            code: 500,
            status: "FAILED", message: "Internal server error", error: error.message
        });
    }
};



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
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const findUserByPhoneNumberPayments = async (req: any, res: any) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const partner_id = req.query.partner_id;
        const user_id = req.params.user_id;

        const user_payments = await Payment.findAll({
            where: {
                user_id: user_id,
                partner_id: partner_id

            }
            , limit: 100,
        });

        if (user_payments.length === 0) {
            return res.status(404).json({ message: "No payments found" });
        }

        // Paginate the response
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedPayments = user_payments.slice(startIndex, endIndex);

        return res.status(200).json({
            result: {
                code: 200,
                status: "OK",
                count: user_payments.length,
                items: paginatedPayments
            }
        });
    } catch (error) {
        console.error("ERROR", error);
        res.status(500).json({
            code: 500,
            status: "FAILED",
            message: "Internal server error", error: error.message
        });
    }
};

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
  *             example: {partner_id : 2, "policy_id":"ea3f7e1b-8699-4a7e-a362-bfbd598ccdb1" ,"premium": 10000}
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */

const createPayment = async (req, res) => {
    try {
        const { policy_id, premium, partner_id } = req.body;

        console.log(partner_id, typeof partner_id);

        const policy = await db.policies.findOne({
            where: {
                policy_status: 'pending',
                premium,
                partner_id,
                policy_id
            },
            include: [{
                model: db.users,
                where: {
                    partner_id
                }
            }]
        });

        console.log("POLICY", policy);

        if (!policy) {
            return res.status(404).json({
                status: "FAILED",
                message: "No customer or policy found"
            });
        }

        const existingUser = await db.users.findOne({
            where: {
                partner_id,
                user_id: policy.user_id
            }
        });

        let airtelMoneyPromise;
        let timeout = 1000;
        if (partner_id === 1) {
            airtelMoneyPromise = airtelMoneyKenya(
                existingUser.user_id,
                policy.policy_id,
                existingUser.phone_number,
                policy.premium,
                existingUser.membership_id,
                existingUser.partner_id
            );
        } else if (partner_id === 2) {
            airtelMoneyPromise = airtelMoney(
                existingUser.user_id,
                2,
                policy.policy_id,
                existingUser.phone_number,
                policy.premium,
                existingUser.membership_id,
                "UG",
                "UGX"
            );
        } else if (partner_id === 3) {
            // vodacom - cooming soon
            airtelMoneyPromise = airtelMoneyKenya(
                existingUser.user_id,
                policy.policy_id,
                existingUser.phone_number,
                policy.premium,
                existingUser.membership_id,
                existingUser.partner_id
            );
        } else {
            return res.status(404).json({
                status: 'FAILED',
                error: "Partner not available"
            });
        }

        const paymentResult = await Promise.race([
            airtelMoneyPromise,
            new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('Airtel Money operation timed out'));
                }, timeout);
            })
        ]);

        console.log(paymentResult);

        return res.status(201).json({
            result: {
                status: "OK",
                data: {
                    customer_name: existingUser.name,
                    cover_option: policy.beneficiary,
                    policy_type: policy.policy_type,
                    members: policy.total_member_number,
                    premium,
                },
                message: "Payment prompt triggered to the customer phone number"
            }
        });
    } catch (error) {
        console.error("ERROR", error);
        res.status(500).json({
            status: "FAILED",
            message: "Internal server error",
            error: error.message
        });
    }
};





module.exports = {
    getPayments,
    getPayment,
    getPolicyPayments,
    findUserByPhoneNumberPayments,
    createPayment

}
