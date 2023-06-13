import { db } from "../models/db";
const Payment = db.payments;


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
const getPayments = async (req: any, res: any) => {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;


    try {
        let payments = await Payment.findAll({
            offset: (page - 1) * limit,
            limit: limit,
            order: [
                ['payment_id', 'DESC']
            ]
        });

        console.log(payments)

        if (!payments || payments.length === 0) {
            return res.status(404).json({ message: "No payments found" });
        }

        return res.status(200).json({
            count: payments.length,
            items: payments,

        });




    } catch (error) {
        console.log("ERROR", error)
        return res.status(500).json({ message: "Internal server error" });
    }

}


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

    let payment_id = parseInt(req.params.payment_id)

    try {

        await Payment.findAll({
            where: {
                payment_id: payment_id
            }
        }).then((payment: any) => {
            res.status(200).json({
                item: payment
            });
        }
        );

    } catch (error) {
        console.log("ERROR", error)
        return res.status(500).json({ message: "Internal server error" });

    }
}


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
const getPolicyPayments = async (req: any, res: any) => {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    try {
        let policy_id = parseInt(req.params.policy_id)
        let payments = await Payment.findAll({
            where: {
                policy_id: policy_id
            }
        })


        if (payments.length > 0) {

            //pagination logic
            //paginate the response
            if (page && limit) {
                let startIndex = (page - 1) * limit;
                let endIndex = page * limit;
                let results = payments.slice(startIndex, endIndex);

                res.status(200).json({
                    count: payments.length,
                    items: results
                });
            }
        }
        else {
            res.status(404).json({ message: "No payments found" });
        }

    } catch (error) {
        console.log("ERROR", error)
        return res.status(500).json({ message: "Internal server error" });

    }


}


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
const getUserPayments = async (req: any, res: any) => {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;


    let user_id = parseInt(req.params.user_id)
    try {
        let payments = await Payment.findAll({
            where: {
                user_id: user_id

            }
        })

        if (payments.length > 0) {

            //pagination logic
            //paginate the response
            if (page && limit) {
                let startIndex = (page - 1) * limit;
                let endIndex = page * limit;
                let results = payments.slice(startIndex, endIndex);

                res.status(200).json({
                    count: payments.length,
                    items: results
                });
            }

        }
        else {

            res.status(404).json({ message: "No payments found" });
        }



    } catch (error) {
        console.log("ERROR", error)
        return res.status(500).json({ message: "Internal server error" });

    }


}


module.exports = {
    getPayments,
    getPayment,
    getPolicyPayments,
    getUserPayments
}
