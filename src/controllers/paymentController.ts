import { db } from "../models/db";
const Payment = db.payments;
const Policy = db.policies;
const User = db.users;
const Claim = db.claims;
const Log = db.logs;
import { v4 as uuid_v4 } from "uuid";
import { airtelMoney, airtelMoneyKenya } from "../services/payment";
uuid_v4()
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

// async function customerPaymentAttempts (){
//     try {

// /* implement logic to get the following payment attempts for every quarter of the year with its respective months
// 1. payment attempts
// 2. successful payments
// 3. QWP Paid
// 4. wrong pin failed payments
// 5. insufficient funds failed payments
// */



//     } catch (error) {
//         console.error("ERROR", error);
//         return null;
//     }

// }

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
        if (!partner_id) {
            return res.status(400).json({
                code: 400,
                status: "FAILED",
                message: "Partner ID is required",
            });
        }
        console.log("REQ", req.query)

        // Handle optional start_date and end_date parameters
        const startDate = start_date ? moment(start_date).startOf('day').toDate() : moment().startOf('year').toDate();
        const endDate = end_date ? moment(end_date).endOf('day').toDate() : moment().endOf('year').toDate();


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


            // Initialize months array to hold data for each month within the quarter
            const months = [];

            // Loop through each month within the quarter
            for (let monthStart = moment(quarterStart); monthStart.isBefore(quarterEnd); monthStart.add(1, 'month')) {
                const monthEnd = moment(monthStart).endOf('month');

                // Fetch data for each month
                let monthData = await fetchMonthData(partner_id, monthStart, monthEnd, category, policy_type, policy_duration);


                months.push(monthData);
            }

            // Construct data object for the quarter
            const quarterDataObject = {
                quarter: quarterStart.format('Q YYYY'),
                accumulated_report: {
                    payment_attempts: months.reduce((acc, item) => acc + item.paymentAttempts, 0),
                    successful_payments: months.reduce((acc, item) => acc + item.successfulPayments, 0),
                    qwp_paid: months.reduce((acc, item) => acc + item.qwpPaid, 0),
                    wrong_pin_failures: months.reduce((acc, item) => acc + item.wrongPinFailures, 0),
                    insufficient_funds_failures: months.reduce((acc, item) => acc + item.insufficientFundsFailures, 0),
                },
                months: months
            };

            console.log("quarterDataObject", quarterDataObject);



            // Push the quarter data object to quarterData array
            quarterData.push(quarterDataObject);
        }
        // console.log("quarterData", quarterData)
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

// Function to get start and end months for a quarter
function getQuarterBoundaries(quarter) {
    const month = parseInt(quarter.slice(1)) - 1; // Extract quarter number (1-based) and subtract 1 for zero-based indexing
    const year = parseInt(quarter.slice(-4)); // Extract year

    const startMonth = month * 3; // Months start from 0 (January), so multiply by 3
    const endMonth = startMonth + 2; // Add 2 to get the last month of the quarter

    return { startMonth, endMonth };
}

// Function to fetch payment data for a specific month range (implementation details depend on your data source)
async function fetchMonthData(partner_id, monthStart, endMonth, category, policy_type, policy_duration) {

    console.log("monthStart", monthStart);
    console.log("endMonth", endMonth);
    console.log("category", category);
    console.log("policy_type", policy_type);
    console.log("policy_duration", policy_duration);

    const paymentAttempts = await getPaymentAttempts(partner_id, monthStart, endMonth, category, policy_type, policy_duration);
    const successfulPayments = await getSuccessfulPayments(partner_id, monthStart, endMonth, category, policy_type, policy_duration);
    const qwpPaid = await getQwpPaid(partner_id, monthStart, endMonth, category, policy_type, policy_duration);
    const wrongPinFailures = await getWrongPinFailures(partner_id, monthStart, endMonth, category, policy_type, policy_duration);
    const insufficientFundsFailures = await getInsufficientFundsFailures(partner_id, monthStart, endMonth, category, policy_type, policy_duration);

    // console.log("paymentAttempts", paymentAttempts);
    // console.log("successfulPayments", successfulPayments);
    // console.log("qwpPaid", qwpPaid);
    // console.log("wrongPinFailures", wrongPinFailures);
    // console.log("insufficientFundsFailures", insufficientFundsFailures);


    const monthData = {
        month: monthStart.format('MMMM YYYY'),
        paymentAttempts,
        successfulPayments,
        qwpPaid,
        wrongPinFailures,
        insufficientFundsFailures,
    };

    return monthData;
}

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


    console.log("queryFilter", queryFilter);
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
    console.log("queryFilter", queryFilter);

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


/*
type of failures and ultimate outcomes and for the last 1 month
insufficient fund and wrong pin failures
calculate percentage of failures and outcomes
*/


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

        const wrongPinFailures = await getWrongPinFailures(partner_id, lastMonthStart, lastMonthEnd, category, policy_type, policy_duration);
        console.log("wrongPinFailures", wrongPinFailures);

        const insufficientFundsFailures = await getInsufficientFundsFailures(partner_id, lastMonthStart, lastMonthEnd, category, policy_type, policy_duration);

        console.log("insufficientFundsFailures", insufficientFundsFailures);

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

        console.log("wrongPinFailersSuccessfulPayments", wrongPinFailersSuccessfulPayments);

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

        console.log("insifficientFundsFailersSuccessfulPayments", insifficientFundsFailersSuccessfulPayments)

        // calculate percentage of failures and outcomes
        const wrongPinFailuresPercentage = ((wrongPinFailures / (wrongPinFailures + wrongPinFailersSuccessfulPayments)) * 100).toFixed(2);
        const insufficientFundsFailuresPercentage =((insufficientFundsFailures / (insufficientFundsFailures + insifficientFundsFailersSuccessfulPayments)) * 100).toFixed(2);

        console.log("wrongPinFailuresPercentage", wrongPinFailuresPercentage);
        console.log("insufficientFundsFailuresPercentage", insufficientFundsFailuresPercentage);

        return res.status(200).json({
            code: 200,
            status: "OK",
            data: {
                wrongPinFailures,
                insufficientFundsFailures,
                wrongPinFailersSuccessfulPayments,
                insifficientFundsFailersSuccessfulPayments,
                wrongPinFailuresPercentage,
                insufficientFundsFailuresPercentage
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




module.exports = {
    getPayments,
    getPayment,
    getPolicyPayments,
    findUserByPhoneNumberPayments,
    createPayment,
    customerPaymentAttempts,
    getFailuresAndOutcomesLastMonth

}
