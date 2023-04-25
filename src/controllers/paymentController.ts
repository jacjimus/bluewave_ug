import { db } from "../models/db";
const Payment = db.payments;

const getPayments = (req: any, res: any) => {
    Payment.findAll().then((payments: any) => {
        res.status(200).json(payments);
    });

}

const getPayment = (req: any, res: any) => {
    let payment_id = parseInt(req.params.payment_id)
    Payment.findAll({
        where: {
            payment_id: payment_id
        }
    }).then((payment: any) => {
        res.status(200).json(payment);
    }
    );



}

const getPolicyPayments = (req: any, res: any) => {
    let policy_id = parseInt(req.params.policy_id)
    Payment.findAll({
        where: {
            policy_id: policy_id
        }
    }).then((payments: any) => {
        res.status(200).json(payments);
    }
    );


}



const getUserPayments = (req: any, res: any) => {

    let user_id = parseInt(req.params.user_id)

    Payment.findAll({
        where: {
            user_id: user_id

        }
    }).then((payments: any) => {
        res.status(200).json(payments);
    }
    );


}


module.exports = {
    getPayments,
    getPayment,
    getPolicyPayments,
    getUserPayments
}
