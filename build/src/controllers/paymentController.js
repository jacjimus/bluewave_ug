"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../models/db");
const Payment = db_1.db.payments;
const getPayments = (req, res) => {
    Payment.findAll().then((payments) => {
        res.status(200).json(payments);
    });
};
const getPayment = (req, res) => {
    let payment_id = parseInt(req.params.payment_id);
    Payment.findAll({
        where: {
            payment_id: payment_id
        }
    }).then((payment) => {
        res.status(200).json(payment);
    });
};
const getPolicyPayments = (req, res) => {
    let policy_id = parseInt(req.params.policy_id);
    Payment.findAll({
        where: {
            policy_id: policy_id
        }
    }).then((payments) => {
        res.status(200).json(payments);
    });
};
const getUserPayments = (req, res) => {
    let user_id = parseInt(req.params.user_id);
    Payment.findAll({
        where: {
            user_id: user_id
        }
    }).then((payments) => {
        res.status(200).json(payments);
    });
};
module.exports = {
    getPayments,
    getPayment,
    getPolicyPayments,
    getUserPayments
};
