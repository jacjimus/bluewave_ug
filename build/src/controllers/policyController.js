"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../models/db");
const Policy = db_1.db.policies;
const getPolicies = (req, res) => {
    Policy.findAll().then((policies) => {
        res.status(200).json(policies);
    });
};
const getPolicy = (req, res) => {
    const policy_id = parseInt(req.params.policy_id);
    Policy.findAll({
        where: {
            policy_id: policy_id
        }
    }).then((policy) => {
        res.status(200).json(policy);
    });
};
const getUserPolicies = (req, res) => {
    const user_id = parseInt(req.params.user_id);
    Policy.findAll({
        where: {
            user_id: user_id
        }
    }).then((policies) => {
        res.status(200).json(policies);
    });
};
const getPolicyPayments = (req, res) => {
    const policy_id = parseInt(req.params.policy_id);
    Policy.findAll({
        where: {
            policy_id: policy_id
        }
    }).then((policy) => {
        res.status(200).json(policy);
    });
};
module.exports = {
    getPolicies,
    getPolicy,
    getUserPolicies,
    getPolicyPayments
};
