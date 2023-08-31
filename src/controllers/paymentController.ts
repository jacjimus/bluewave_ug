import { db } from "../models/db";
const Payment = db.payments;
const Policy = db.policies;
const User = db.users;
const Claim = db.claims;
const Log = db.logs;
import { v4 as uuidv4 } from 'uuid';
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
    const filter = req.query.filter || "";
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
            return res.status(404).json({ message: "No payments found" });
        }
        await Log.create({
            log_id: uuidv4(),
            timestamp: new Date(),
            message: ` ${req?.user_id} performed operation listPayments`,
            level: 'info',
            user: req?.user_id,
            partner_id: req?.partner_id,
        });
        return res.status(200).json({
            result: {
                count: payments.length,
                items: payments,
            },
        });
    } catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({ message: "Internal server error", error: error });
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
            }
        });
        await Log.create({
            log_id: uuidv4(),
            timestamp: new Date(),
            message: ` ${req?.user_id} performed operation getPayment`,
            level: 'info',
            user: req?.user_id,
            partner_id: req?.partner_id,
        });

        if (payment) {
            res.status(200).json({
                result: {
                    item: payment
                }
            });
        } else {
            res.status(404).json({ message: "Payment not found" });
        }
    } catch (error) {
        console.error("ERROR", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
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
            }
        });

        if (payments.length > 0) {
            // Pagination logic
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const results = payments.slice(startIndex, endIndex);

            await Log.create({
                log_id: uuidv4(),
                timestamp: new Date(),
                message: `
 ${req?.user_id} performed operation listPolicyPayments`,
                level: 'info',
                user: req?.user_id,
                partner_id: req?.partner_id,
            });

            res.status(200).json({
                result: {
                    count: payments.length,
                    items: results
                }
            });
        } else {
            res.status(404).json({ message: "No payments found" });
        }
    } catch (error) {
        console.error("ERROR", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
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
const getUserPayments = async (req: any, res: any) => {
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
        });

        if (user_payments.length === 0) {
            return res.status(404).json({ message: "No payments found" });
        }

        // Paginate the response
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedPayments = user_payments.slice(startIndex, endIndex);
        await Log.create({
            log_id: uuidv4(),
            timestamp: new Date(),
            message: ` ${req?.user_id} performed operation listUserPayments`,
            level: 'info',
            user: req?.user_id,
            partner_id: req?.partner_id,
        });

        return res.status(200).json({
            result: {
                count: user_payments.length,
                items: paginatedPayments
            }
        });
    } catch (error) {
        console.error("ERROR", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
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
  *             example: { "claim_id": 1,"user_id": 1,"partner_id":1, "policy_id": 3,"payment_date": "2023-6-22","payment_amount": 1000, "payment_metadata": { "payment_method": "mobile money","payment_reference": "1234567890","payment_phone_number": "256700000000","payment_email": "test@test","payment_country": "uganda","payment_currency": "ugx","payment_amount": 1000},"payment_type": "premium","payment_status": "paid","payment_description": "premium payment for policy 3"}
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */

const createPayment = async (req: any, res: any) => {
    try {
        const payment = await Payment.create(req.body);

        await Log.create({
            log_id: uuidv4(),
            timestamp: new Date(),
            message: ` ${req?.user_id} performed operation createPayment`,
            level: 'info',
            user: req?.user_id,
            partner_id: req?.partner_id,
        });
        return res.status(201).json({
            result: {
                item: payment
            }
        });
    } catch (error) {
        console.error("ERROR", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};



module.exports = {
    getPayments,
    getPayment,
    getPolicyPayments,
    getUserPayments,
    createPayment

}
