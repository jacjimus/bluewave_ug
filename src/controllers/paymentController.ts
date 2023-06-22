import { db } from "../models/db";
const Payment = db.payments;
const Policy = db.policies;


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

        return res.status(200).json({ result:{
            count: payments.length,
            items: payments,

     } });

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
            res.status(200).json({ result:{
                item: payment
           }   });
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

                res.status(200).json({ result:{
                    count: payments.length,
                    items: results } });
         
        }else {
            res.status(404).json({ message: "No payments found" });
        }
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

let user_payments = []
    let user_id = parseInt(req.params.user_id)
    //policies that belong to the user

    let user_policies = await Policy.findAll({  
        where: {
            id: user_id
        }
    })
    console.log("USER POLICIES",user_policies)

    //for each policy, get the payments 
    for (let i = 0; i < user_policies.length; i++) {
        let policy_id = user_policies[i].id

        let payments = await Payment.findAll({
            where: {

                policy_id: policy_id

            }

        })

        user_payments.push(payments)

    }

    try {
        

        if (user_payments.length > 0) {
            //paginate the response
            if (page && limit) {
                let startIndex = (page - 1) * limit;
                let endIndex = page * limit;
                let results = user_payments.slice(startIndex, endIndex);

                res.status(200).json({ result:{
                    count: user_payments.length,
                    items: results
              }  });
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
  * /api/v1/payments/create:
  *   post:
  *     tags:
  *       - Payments
  *     description: 
  *     operationId: createPayment
  *     summary: 
  *     security:
  *       - ApiKeyAuth: []
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             example: { "claim_id": 1,"user_id": 1, "policy_id": 3,"payment_date": "2023-6-22","payment_amount": 1000, "payment_metadata": { "payment_method": "mobile money","payment_reference": "1234567890","payment_phone_number": "256700000000","payment_email": "test@test","payment_country": "uganda","payment_currency": "ugx","payment_amount": 1000},"payment_type": "premium","payment_status": "paid","payment_description": "premium payment for policy 3"}
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */

const createPayment = async (req: any, res: any) => {

    try {

        await Payment.create(req.body).then((payment: any) => {
            res.status(200).json({ result:{
                item: payment

            } });
        }
        );

    } catch (error) {

        console.log("ERROR", error)

        return res.status(500).json({ message: "Internal server error" });

    }
}








module.exports = {
    getPayments,
    getPayment,
    getPolicyPayments,
    getUserPayments,
    createPayment

}
