import { db } from "../models/db";
const Payment = db.payments;
const Policy = db.policies;
const User = db.users;
const Claim = db.claims;
const Log = db.logs;
import { v4 as uuidv4 } from "uuid";
import { airtelMoney, airtelMoneyKenya, createTransaction } from "../services/payment";
const { Op, Sequelize } = require("sequelize");
import moment from "moment";


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
            include: [{ model: User, as: "user" }, { model: Policy, as: "policy" }],
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
            return res.status(404).json({
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
        
              
            let preGeneratedTransactionId = uuidv4();

            await createTransaction(existingUser.user_id, existingUser.partner_id, policy.policy_id, preGeneratedTransactionId, policy.premium);

            airtelMoneyPromise = airtelMoney(
            
                existingUser.phone_number,
                policy.premium,
                existingUser.membership_id,
                preGeneratedTransactionId
               
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

        await Promise.race([
            airtelMoneyPromise,
            new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('Airtel Money operation timed out'));
                }, timeout);
            })
        ]);


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


/**
 * @swagger
 * /api/v1/payments/customer/payment_attempts:
 *   get:
 *     tags:
 *       - Payments
 *     description:  Get customer payment attempts
 *     operationId: customerPaymentAttempts
 *     summary: Get customer payment attempts
 *     security:
 *      - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
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
 *       - name: category
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: policy_type
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: policy_duration
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfuly
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
async function customerPaymentAttempts(req, res) {
    try {
        const { partner_id, start_date, end_date, category, policy_type, policy_duration } = req.query;

        // Validation
        if (!partner_id) {
            return res.status(400).json({
                code: 400,
                status: "FAILED",
                message: "Partner ID is required",
            });
        }

        // Handle optional start_date and end_date parameters
        const startDate = start_date ? moment(start_date).startOf('day').toDate() : moment().startOf('year').toDate();
        const endDate = end_date ? moment(end_date).endOf('day').toDate() : moment().endOf('year').toDate();

        console.log('startDate', startDate, 'endDate', endDate);
        // Ensure start date is before or equal to end date
        if (startDate > endDate) {
            return res.status(400).json({
                code: 400,
                status: "FAILED",
                message: "Start date cannot be after end date",
            });
        }

        // Initialize quarterData array to hold data for each quarter
        const quarterData = [];

        // Split the date range into quarters
        const quarterStartDate = moment(startDate).startOf('quarter');
        const quarterEndDate = moment(endDate).endOf('quarter');

        // Loop through each quarter
        for (let quarterStart = moment(quarterStartDate); quarterStart.isBefore(quarterEndDate); quarterStart.add(1, 'quarter')) {
            const quarterEnd = moment(quarterStart).endOf('quarter');

            // Fetch data for each quarter in parallel
            const months = await Promise.all([...Array(3)].map((_, index) => {
                const monthStart = moment(quarterStart).add(index, 'month');
                const monthEnd = moment(monthStart).endOf('month');
                return fetchMonthData(partner_id, monthStart, monthEnd, category, policy_type, policy_duration);
            }));

            console.log('months', months);

            // Construct data object for the quarter
            const quarterDataObject = {
                quarter: quarterStart.format('Q YYYY'),
                accumulated_report: {
                    payment_attempts: months.reduce((acc, item) => acc + parseInt(item.paymentAttempts), 0),
                    successful_payments: months.reduce((acc, item) => acc + parseInt(item.successfulPayments), 0),
                    qwp_paid: months.reduce((acc, item) => acc + parseInt(item.qwpPaid), 0),
                    wrong_pin_failures: months.reduce((acc, item) => acc + parseInt(item.wrongPinFailures), 0),
                    insufficient_funds_failures: months.reduce((acc, item) => acc + parseInt(item.insufficientFundsFailures), 0),
                },
                months: months
            };

            // Push the quarter data object to quarterData array
            quarterData.push(quarterDataObject);
        }

        // Return the quarter data
        return res.status(200).json({
            code: 200,
            status: "OK",
            data: quarterData,
        });
    } catch (error) {
        console.error("ERROR", error);
        return res.status(500).json({
            code: 500,
            status: "FAILED",
            message: "Internal server error",
            error: error.message,
        });
    }
}
        // // Split the date range into quarters
        // const quarterStartDate = moment(startDate).startOf('quarter');
        // const quarterEndDate = moment(endDate).endOf('quarter');



        // // Loop through each quarter
        // for (let quarterStart = moment(quarterStartDate); quarterStart.isBefore(quarterEndDate); quarterStart.add(1, 'quarter')) {
        //     const quarterEnd = moment(quarterStart).endOf('quarter');


        //     // Initialize months array to hold data for each month within the quarter
        //     const months = [];

        //     // Loop through each month within the quarter
        //     for (let monthStart = moment(quarterStart); monthStart.isBefore(quarterEnd); monthStart.add(1, 'month')) {
        //         const monthEnd = moment(monthStart).endOf('month');

        //         // Fetch data for each month
        //         let monthData = await fetchMonthData(partner_id, monthStart, monthEnd, category, policy_type, policy_duration);


        //         months.push(monthData);
        //     }



async function fetchMonthData(partner_id, monthStart, monthEnd, category, policy_type, policy_duration) {
    // Fetch all metrics for the month with a single query
    const monthData = await getPaymentAttemptsByPartner(partner_id, monthStart, monthEnd, category, policy_type, policy_duration);
    // Payment.findAll({
    //     attributes: [
    //         [Sequelize.fn('COUNT', Sequelize.col('payment.payment_status')), 'paymentAttempts'],
    //         [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN payment.payment_status = 'paid' THEN 1 ELSE 0 END")), 'successfulPayments'],
    //         [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN payment.payment_status = 'paid' THEN payment.payment_amount ELSE 0 END")), 'qwpPaid'],
    //         [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN payment.payment_status = 'failed' AND payment.payment_description LIKE '%invalid PIN length%' THEN 1 ELSE 0 END")), 'wrongPinFailures'],
    //         [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN payment.payment_status = 'failed' AND payment.payment_description LIKE '%insufficient money%' THEN 1 ELSE 0 END")), 'insufficientFundsFailures']
    //     ],
    //     where: {
    //         partner_id,
    //         createdAt: {
    //             [Op.gte]: monthStart.toDate(),
    //             [Op.lt]: monthEnd.toDate()
    //         }
    //     },
    //     include: [{
    //         model: Policy,
    //         as: "policy",
    //         where: {
    //             ...(category && { beneficiary: category }),
    //             ...(policy_type && { policy_type }),
    //             ...(policy_duration && { installment_type: policy_duration })
    //         }
    //     }],
    //     raw: true
    // });

    return {
        month: monthStart.format('MMMM YYYY'),
        paymentAttempts: monthData[0].paymentAttempts || 0,
        successfulPayments: monthData[0].successfulPayments || 0,
        qwpPaid: monthData[0].qwpPaid || 0,
        wrongPinFailures: monthData[0].wrongPinFailures || 0,
        insufficientFundsFailures: monthData[0].insufficientFundsFailures || 0
    };
}
async function getPaymentAttemptsByPartner(partnerId, startDate, endDate, category, policy_type, policy_duration) {
    let filterClause = '';

    if (category) {
        filterClause += `AND "policy"."beneficiary" = '${category}' `;
    }
    if (policy_type) {
        filterClause += `AND "policy"."policy_type" = '${policy_type}' `;
    }
    if (policy_duration) {
        filterClause += `AND "policy"."installment_type" = '${policy_duration}' `;
    }

    const paymentQuery = `
        SELECT
            COUNT(*) AS "paymentAttempts", 
            SUM(CASE WHEN policy.policy_status = 'paid' THEN 1 ELSE 0 END) AS "successfulPayments",
            SUM(CASE WHEN policy.policy_status = 'paid' THEN policy.policy_paid_amount ELSE 0 END) AS "qwpPaid",
            SUM(CASE WHEN payment.payment_status = 'failed' AND payment_description LIKE '%invalid PIN length%' THEN 1 ELSE 0 END) AS "wrongPinFailures",
            SUM(CASE WHEN payment.payment_status = 'failed' AND payment_description LIKE '%insufficient money%' THEN 1 ELSE 0 END) AS "insufficientFundsFailures"
        FROM "payments" AS "payment"
        INNER JOIN "policies" AS "policy" ON "payment"."policy_id" = "policy"."policy_id"
        WHERE "payment"."partner_id" = ${partnerId}
        AND "payment"."createdAt" >= '${startDate.toISOString()}'
        AND "payment"."createdAt" < '${endDate.toISOString()}'
        ${filterClause}
    `;

    const results = await db.sequelize.query(paymentQuery, {
        type: Sequelize.QueryTypes.SELECT
    });

    return results;
}


// async function customerPaymentAttempts(req, res) {
//     try {
//         const { partner_id, start_date, end_date, category, policy_type, policy_duration } = req.query;

//         // Validation
//         if (!partner_id) {
//             return res.status(400).json({
//                 code: 400,
//                 status: "FAILED",
//                 message: "Partner ID is required",
//             });
//         }

//         // Handle optional start_date and end_date parameters
//         const startDate = start_date ? moment(start_date).startOf('day').toDate() : moment().startOf('year').toDate();
//         const endDate = end_date ? moment(end_date).endOf('day').toDate() : moment().endOf('year').toDate();

//         // Ensure start date is before or equal to end date
//         if (startDate > endDate) {
//             return res.status(400).json({
//                 code: 400,
//                 status: "FAILED",
//                 message: "Start date cannot be after end date",
//             });
//         }

//         // Initialize quarterData array to hold data for each quarter
//         const quarterData = [];

//         // Split the date range into quarters
//         const quarterStartDate = moment(startDate).startOf('quarter');
//         const quarterEndDate = moment(endDate).endOf('quarter');

//         // Loop through each quarter
//         for (let quarterStart = moment(quarterStartDate); quarterStart.isBefore(quarterEndDate); quarterStart.add(1, 'quarter')) {
//             const quarterEnd = moment(quarterStart).endOf('quarter');

//             // Fetch data for each quarter in parallel
//             const months = await Promise.all([...Array(3)].map((_, index) => {
//                 const monthStart = moment(quarterStart).add(index, 'month');
//                 const monthEnd = moment(monthStart).endOf('month');
//                 return fetchMonthData(partner_id, monthStart, monthEnd, category, policy_type, policy_duration);
//             }));

//             // Construct data object for the quarter
//             const quarterDataObject = {
//                 quarter: quarterStart.format('Q YYYY'),
//                 accumulated_report: {
//                     payment_attempts: months.reduce((acc, item) => acc + item.paymentAttempts, 0),
//                     successful_payments: months.reduce((acc, item) => acc + item.successfulPayments, 0),
//                     qwp_paid: months.reduce((acc, item) => acc + item.qwpPaid, 0),
//                     wrong_pin_failures: months.reduce((acc, item) => acc + item.wrongPinFailures, 0),
//                     insufficient_funds_failures: months.reduce((acc, item) => acc + item.insufficientFundsFailures, 0),
//                 },
//                 months: months
//             };

//             // Push the quarter data object to quarterData array
//             quarterData.push(quarterDataObject);
//         }

//         // Return the quarter data
//         return res.status(200).json({
//             code: 200,
//             status: "OK",
//             data: quarterData,
//         });
//     } catch (error) {
//         console.error("ERROR", error);
//         return res.status(500).json({
//             code: 500,
//             status: "FAILED",
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// }



// Function to get start and end months for a quarter
function getQuarterBoundaries(quarter) {
    const month = parseInt(quarter.slice(1)) - 1; // Extract quarter number (1-based) and subtract 1 for zero-based indexing
    const year = parseInt(quarter.slice(-4)); // Extract year

    const startMonth = month * 3; // Months start from 0 (January), so multiply by 3
    const endMonth = startMonth + 2; // Add 2 to get the last month of the quarter

    return { startMonth, endMonth };
}

// Function to fetch payment data for a specific month range (implementation details depend on your data source)

// async function fetchMonthData(partner_id, monthStart, monthEnd, category, policy_type, policy_duration) {
//     const [
//         paymentAttempts,
//         successfulPayments,
//         qwpPaid,
//         wrongPinFailures,
//         insufficientFundsFailures
//     ] = await Promise.all([
//         getPaymentAttempts(partner_id, monthStart, monthEnd, category, policy_type, policy_duration),
//         getSuccessfulPayments(partner_id, monthStart, monthEnd, category, policy_type, policy_duration),
//         getQwpPaid(partner_id, monthStart, monthEnd, category, policy_type, policy_duration),
//         getWrongPinFailures(partner_id, monthStart, monthEnd, category, policy_type, policy_duration),
//         getInsufficientFundsFailures(partner_id, monthStart, monthEnd, category, policy_type, policy_duration)
//     ]);

//     return {
//         month: monthStart.format('MMMM YYYY'),
//         paymentAttempts,
//         successfulPayments,
//         qwpPaid,
//         wrongPinFailures,
//         insufficientFundsFailures
//     };
// }


async function getPaymentAttempts(partner_id, monthStart, monthEnd, category, policy_type, policy_duration) {

    // search where category, policy_type, policy_duration on policy table
    const queryFilter: { beneficiary?: string, policy_type?: string, installment_type?: string } = {};
    if (category) {
        queryFilter.beneficiary = category;
    }
    if (policy_type) {
        queryFilter.policy_type = policy_type;
    }
    if (policy_duration) {
        queryFilter.installment_type = policy_duration;
    }


    const paymentAttempts = await Payment.count({
        where: {
            partner_id,
            //group: ["payment_status"],
            createdAt: {
                [Op.gte]: monthStart.toDate(),
                [Op.lt]: monthEnd.toDate()
            },
        },
        include: [{ model: Policy, as: "policy", where: queryFilter }],

    });

    return paymentAttempts;
}


async function getSuccessfulPayments(partner_id, monthStart, monthEnd, category, policy_type, policy_duration) {
    const queryFilter: { beneficiary?: string, policy_type?: string, installment_type?: string } = {};
    if (category) {
        queryFilter.beneficiary = category;
    }
    if (policy_type) {
        queryFilter.policy_type = policy_type;
    }
    if (policy_duration) {
        queryFilter.installment_type = policy_duration;
    }

    console.log('getSuccessfulPayments', monthStart.toDate(), monthEnd.toDate());

    const successfulPayments = await Payment.count({
        where: {
            partner_id,
            payment_status: "paid",
            createdAt: {
                [Op.gte]: monthStart.toDate(),
                [Op.lt]: monthEnd.toDate()
            },
        },
        include: [{ model: Policy, as: "policy", where: queryFilter }],

    });

    return successfulPayments;
}


async function getQwpPaid(partner_id, monthStart, monthEnd, category, policy_type, policy_duration) {

    const queryFilter: { beneficiary?: string, policy_type?: string, installment_type?: string } = {};
    if (category) {
        queryFilter.beneficiary = category;
    }
    if (policy_type) {
        queryFilter.policy_type = policy_type;
    }

    if (policy_duration) {
        queryFilter.installment_type = policy_duration;
    }

    const total_amount = await Payment.findAll({
        where: {
            partner_id: partner_id,
            payment_status: "paid",
            // group: ["payment_status"],
            createdAt: {
                [Op.gte]: monthStart.toDate(),
                [Op.lt]: monthEnd.toDate()
            }
        },
        include: [{ model: Policy, as: "policy", where: queryFilter }]

    });
    return total_amount.reduce((acc, item) => acc + item.payment_amount, 0);
}

function getFailuresByDateRange(whereClause, monthStart, monthEnd, category, policy_type, policy_duration) {
    const queryFilter: { beneficiary?: string, policy_type?: string, installment_type?: string } = {};
    if (category) {
        queryFilter.beneficiary = category;
    }
    if (policy_type) {
        queryFilter.policy_type = policy_type;
    }
    if (policy_duration) {
        queryFilter.installment_type = policy_duration;
    }

    console.log('getFailuresByDateRange', monthStart.toDate(), monthEnd.toDate());
    return Payment.count({
        where: {
            ...whereClause,
            createdAt: {
                [Op.gte]: monthStart.toDate(),
                [Op.lt]: monthEnd.toDate()
            },
        },
        include: [{ model: Policy, as: "policy", where: queryFilter }],

    });
}


async function getWrongPinFailures(partner_id, startMonth, endMonth, category, policy_type, policy_duration) {
    // Create a reusable function to filter by date range

    // Filter for wrong PIN failures using description or a more specific pattern (if applicable)
    const wrongPinFailures = await getFailuresByDateRange({
        partner_id,
        payment_status: "failed",
        payment_description: { [Op.like]: "%invalid PIN length%" }, // Replace with specific string or pattern if needed
    },
        startMonth, endMonth,
        category, policy_type, policy_duration);

    return wrongPinFailures;
}

async function getInsufficientFundsFailures(partner_id, startMonth, endMonth, category, policy_type, policy_duration) {
    // Reuse the getFailuresByDateRange function
    const insufficientFundsFailures = await getFailuresByDateRange({
        partner_id,
        payment_status: "failed",
        payment_description: { [Op.like]: "%insufficient money%" }, // Replace with specific string or pattern if needed
    },
        startMonth, endMonth,
        category, policy_type, policy_duration
    );

    return insufficientFundsFailures;
}



/**
 * @swagger
 * /api/v1/payments/customer/failures_outcomes_last_month:
 *   get:
 *     tags:
 *       - Payments
 *     description:  Get customer failures and outcomes for the last month
 *     operationId: getFailuresAndOutcomesLastMonth
 *     summary: Get customer failures and outcomes for the last month
 *     security:
 *      - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfuly
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
async function getFailuresAndOutcomesLastMonth(req, res) {
    const { partner_id, endMonth, category, policy_type, policy_duration } = req.query;
    const lastMonthStart = moment().subtract(1, 'month').startOf('month');
    const lastMonthEnd = moment().subtract(1, 'month').endOf('month');

    try {


        const wrongPinFailersSuccessfulPayments = await Payment.count({
            where: {
                partner_id,
                payment_status: "paid",
                payment_description: { [Op.like]: "%invalid PIN length%" },
                createdAt: {
                    [Op.gte]: lastMonthStart.toDate(),
                    [Op.lt]: lastMonthEnd.toDate()
                },
            },

        });

        const wrongPinFailersFialedPayments = await Payment.count({
            where: {
                partner_id,
                payment_status: "failed",
                payment_description: { [Op.like]: "%invalid PIN length%" },
                createdAt: {
                    [Op.gte]: lastMonthStart.toDate(),
                    [Op.lt]: lastMonthEnd.toDate()
                },
            },

        });


        const insifficientFundsFailersSuccessfulPayments = await Payment.count({
            where: {
                partner_id,
                payment_status: "paid",
                payment_description: { [Op.like]: "%insufficient money%" },
                createdAt: {
                    [Op.gte]: lastMonthStart.toDate(),
                    [Op.lt]: lastMonthEnd.toDate()
                },
            },

        });

        const insifficientFundsFailersFailedPayments = await Payment.count({
            where: {
                partner_id,
                payment_status: "failed",
                payment_description: { [Op.like]: "%insufficient money%" },
                createdAt: {
                    [Op.gte]: lastMonthStart.toDate(),
                    [Op.lt]: lastMonthEnd.toDate()
                },
            },

        });


        // calculate percentage of failures and outcomes
        const totalWrongPinPayments = wrongPinFailersSuccessfulPayments + wrongPinFailersFialedPayments;
        const totalInsufficientFundsPayments = insifficientFundsFailersSuccessfulPayments + insifficientFundsFailersFailedPayments;

        const wrongPinFailuresPercentage = ((wrongPinFailersFialedPayments / totalWrongPinPayments) * 100).toFixed(2);
        const insufficientFundsFailuresPercentage = ((insifficientFundsFailersFailedPayments / totalInsufficientFundsPayments) * 100).toFixed(2);

        const wrongPinFailersSuccessfulPaymentsPercentage = ((wrongPinFailersSuccessfulPayments / totalWrongPinPayments) * 100).toFixed(2);

        const insifficientFundsFailersSuccessfulPaymentsPercentage = ((insifficientFundsFailersSuccessfulPayments / totalInsufficientFundsPayments) * 100).toFixed(2);


        return res.status(200).json({
            code: 200,
            status: "OK",
            data: {
                // wrongPinFailures,
                // insufficientFundsFailures,
                wrongPinFailersSuccessfulPayments,
                wrongPinFailersFialedPayments,
                wrongPinFailuresPercentage,
                wrongPinFailersSuccessfulPaymentsPercentage,


                insifficientFundsFailersSuccessfulPayments,
                insifficientFundsFailersFailedPayments,
                insufficientFundsFailuresPercentage,
                insifficientFundsFailersSuccessfulPaymentsPercentage
            }

        });

    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: "FAILED",
            message: "Internal server error",
            error: error.message
        });
    }

}


/**
 * @swagger
 * /api/v1/payments/customer/payment_outcomes_trends:
 *   get:
 *     tags:
 *       - Payments
 *     description:  Get customer payment outcomes trends
 *     operationId: getPaymentOutcomesTrends
 *     summary: Get customer payment outcomes trends
 *     security:
 *      - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfuly
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */

async function getPaymentOutcomesTrends(req, res) {
    const { partner_id, category, policy_type, policy_duration } = req.query;
    const year = moment().year();
    const months = moment.months();
    try {
        const trends = [];
        for (let i = 0; i < months.length; i++) {
            const monthStart = moment(`${year}-${i + 1}-01`).startOf('month');
            const monthEnd = moment(`${year}-${i + 1}-01`).endOf('month');

            const successfulPayments = await getSuccessfulPayments(partner_id, monthStart, monthEnd, category, policy_type, policy_duration);
            const failedPayments = await getFailuresByDateRange({
                partner_id,
                payment_status: "failed",
            },
                monthStart, monthEnd,
                category, policy_type, policy_duration);

            const totalPayments = successfulPayments + failedPayments;
            const wrongPinFailures = await getWrongPinFailures(partner_id, monthStart, monthEnd, category, policy_type, policy_duration);
            const insufficientFundsFailures = await getInsufficientFundsFailures(partner_id, monthStart, monthEnd, category, policy_type, policy_duration);


            const monthData = {
                month: months[i],
                successfulPayments,
                failedPayments,
                wrongPinFailures: wrongPinFailures,
                insufficientFundsFailures: insufficientFundsFailures,
                totalPayments,
                successfulPaymentsPercentage: ((successfulPayments / totalPayments) * 100).toFixed(2) || 0,
                failedPaymentsPercentage: ((failedPayments / totalPayments) * 100).toFixed(2) || 0,
                wrongPinFailuresPercentage: ((wrongPinFailures / totalPayments) * 100).toFixed(2) || 0,
                insufficientFundsFailuresPercentage: ((insufficientFundsFailures / totalPayments) * 100).toFixed(2) || 0,
            };

            trends.push(monthData);
        }

        return res.status(200).json({
            code: 200,
            status: "OK",
            data: trends,
        });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: "FAILED",
            message: "Internal server error",
            error: error.message
        });
    }
}


/**
 * @swagger
 * /api/v1/payments/customer/payment_attempt_outcomes_by_day_of_week:
 *   get:
 *     tags:
 *       - Payments
 *     description:  Get customer payment attempt and outcomes by day of week
 *     operationId: getPaymentAttemptOutcomesByDayOfWeek
 *     summary: Get customer payment attempt and outcomes by day of week
 *     security:
 *      - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfuly
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */

async function getPaymentAttemptOutcomesByDayOfWeek(req, res) {
    const { partner_id, category, policy_type, policy_duration } = req.query;
    const days = Array.from({ length: 7 }, (_, i) => i); // Create an array of 0 to 6 representing days of the week
    try {
        const trends = [];
        for (let i = 0; i < days.length; i++) {
            const dayStart = moment().startOf('week').add(i, 'days');
            const dayEnd = moment().endOf('week').add(i, 'days');

            console.log('dayStart', dayStart, dayStart.toDate());
            console.log('dayEnd', dayEnd, dayEnd.toDate());

            const successfulPayments = await getSuccessfulPayments(partner_id, dayStart, dayEnd, category, policy_type, policy_duration);
            const failedPayments = await getFailuresByDateRange({
                partner_id,
                payment_status: "failed",
            },
                dayStart, dayEnd,
                category, policy_type, policy_duration);

            const totalPayments = successfulPayments + failedPayments;
            const wrongPinFailures = await getWrongPinFailures(partner_id, dayStart, dayEnd, category, policy_type, policy_duration);
            const insufficientFundsFailures = await getInsufficientFundsFailures(partner_id, dayStart, dayEnd, category, policy_type, policy_duration);


            const dayData = {
                day: i, // Use index as day of the week
                successfulPayments,
                failedPayments,
                wrongPinFailures: wrongPinFailures,
                insufficientFundsFailures: insufficientFundsFailures,
                totalPayments,
                successfulPaymentsPercentage: ((successfulPayments / totalPayments) * 100).toFixed(2) || 0,
                failedPaymentsPercentage: ((failedPayments / totalPayments) * 100).toFixed(2) || 0,
                wrongPinFailuresPercentage: ((wrongPinFailures / totalPayments) * 100).toFixed(2) || 0,
                insufficientFundsFailuresPercentage: ((insufficientFundsFailures / totalPayments) * 100).toFixed(2) || 0,
            };

            trends.push(dayData);
        }

        return res.status(200).json({
            code: 200,
            status: "OK",
            data: trends,
        });

    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: "FAILED",
            message: "Internal server error",
            error: error.message
        });
    }
}



/**
 * @swagger
 * /api/v1/payments/customer/payment_attempt_outcomes_by_day_of_month:
 *   get:
 *     tags:
 *       - Payments
 *     description:  Get customer payment attempt and outcomes by day of month
 *     operationId: getPaymentAttemptOutcomesByDayOfMonth
 *     summary: Get customer payment attempt and outcomes by day of month
 *     security:
 *      - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfuly
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */

async function getPaymentAttemptOutcomesByDayOfMonth(req, res) {
    const { partner_id, category, policy_type, policy_duration } = req.query;
    const daysInMonth = moment().daysInMonth(); // Get the number of days in the current month
    try {
        const trends = [];
        for (let i = 1; i <= daysInMonth; i++) { // Iterate through each day of the month
            const dayStart = moment().startOf('month').add(i - 1, 'days'); // Subtract 1 from i to get the correct index
            const dayEnd = moment().startOf('month').add(i, 'days'); // Increment i for the end of the day

            const successfulPayments = await getSuccessfulPayments(partner_id, dayStart, dayEnd, category, policy_type, policy_duration);
            const failedPayments = await getFailuresByDateRange({
                partner_id,
                payment_status: "failed",
            },
                dayStart, dayEnd,
                category, policy_type, policy_duration);

            const totalPayments = successfulPayments + failedPayments;
            const wrongPinFailures = await getWrongPinFailures(partner_id, dayStart, dayEnd, category, policy_type, policy_duration);
            const insufficientFundsFailures = await getInsufficientFundsFailures(partner_id, dayStart, dayEnd, category, policy_type, policy_duration);


            const dayData = {
                day: i,
                successfulPayments,
                failedPayments,
                wrongPinFailures: wrongPinFailures,
                insufficientFundsFailures: insufficientFundsFailures,
                totalPayments,
                successfulPaymentsPercentage: ((successfulPayments / totalPayments) * 100).toFixed(2) || 0,
                failedPaymentsPercentage: ((failedPayments / totalPayments) * 100).toFixed(2) || 0,
                wrongPinFailuresPercentage: ((wrongPinFailures / totalPayments) * 100).toFixed(2) || 0,
                insufficientFundsFailuresPercentage: ((insufficientFundsFailures / totalPayments) * 100).toFixed(2) || 0,
            };

            trends.push(dayData);
        }

        return res.status(200).json({
            code: 200,
            status: "OK",
            data: trends,
        });

    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: "FAILED",
            message: "Internal server error",
            error: error.message
        });
    }
}



/**
 * @swagger
 * /api/v1/payments/customer/payment_attempt_outcomes_by_time_of_day:
 *   get:
 *     tags:
 *       - Payments
 *     description:  Get customer payment attempt and outcomes by time of day
 *     operationId: getPaymentAttemptOutcomesByTimeOfDay
 *     summary: Get customer payment attempt and outcomes by time of day
 *     security:
 *      - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfuly
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */

async function getPaymentAttemptOutcomesByTimeOfDay(req, res) {
    const { partner_id, category, policy_type, policy_duration } = req.query;
    const hours = Array.from({ length: 24 }, (_, i) => i); // Create an array of 24 hours
    try {
        const trends = [];
        for (let i = 0; i < hours.length; i++) {
            const hourStart = moment().startOf('day').add(i, 'hours');
            const hourEnd = moment().startOf('day').add(i + 1, 'hours'); // Increment hour for end time

            const successfulPayments = await getSuccessfulPayments(partner_id, hourStart, hourEnd, category, policy_type, policy_duration);
            const failedPayments = await getFailuresByDateRange({
                partner_id,
                payment_status: "failed",
            },
                hourStart, hourEnd,
                category, policy_type, policy_duration);

            const totalPayments = successfulPayments + failedPayments;
            const wrongPinFailures = await getWrongPinFailures(partner_id, hourStart, hourEnd, category, policy_type, policy_duration);
            const insufficientFundsFailures = await getInsufficientFundsFailures(partner_id, hourStart, hourEnd, category, policy_type, policy_duration);


            const hourData = {
                hour: i, // Use index as hour
                successfulPayments,
                failedPayments,
                wrongPinFailures: wrongPinFailures,
                insufficientFundsFailures: insufficientFundsFailures,
                totalPayments,
                successfulPaymentsPercentage: ((successfulPayments / totalPayments) * 100).toFixed(2) || 0,
                failedPaymentsPercentage: ((failedPayments / totalPayments) * 100).toFixed(2) || 0,
                wrongPinFailuresPercentage: ((wrongPinFailures / totalPayments) * 100).toFixed(2) || 0,
                insufficientFundsFailuresPercentage: ((insufficientFundsFailures / totalPayments) * 100).toFixed(2) || 0,
            };

            trends.push(hourData);
        }

        return res.status(200).json({
            code: 200,
            status: "OK",
            data: trends,
        });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: "FAILED",
            message: "Internal server error",
            error: error.message
        });
    }
}






module.exports = {

    getPayments,
    getPayment,
    getPolicyPayments,
    findUserByPhoneNumberPayments,
    createPayment,
    customerPaymentAttempts,
    getFailuresAndOutcomesLastMonth,
    getPaymentOutcomesTrends,
    getPaymentAttemptOutcomesByDayOfWeek,
    getPaymentAttemptOutcomesByDayOfMonth,
    getPaymentAttemptOutcomesByTimeOfDay

}