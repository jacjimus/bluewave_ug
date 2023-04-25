"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../models/db");
const Claim = db_1.db.claims;
const getClaims = (req, res) => {
    Claim.findAll().then((claims) => {
        res.status(200).json(claims);
    });
};
const getClaim = (req, res) => {
    const claim_id = parseInt(req.params.claim_id);
    Claim.findAll({
        where: {
            claim_id: claim_id
        }
    }).then((claim) => {
        res.status(200).json(claim);
    });
};
const getUserClaims = (req, res) => {
    const user_id = parseInt(req.params.user_id);
    Claim.findAll({
        where: {
            user_id: user_id
        }
    }).then((claims) => {
        res.status(200).json(claims);
    });
};
const getPolicyClaims = (req, res) => {
    const policy_id = parseInt(req.params.policy_id);
    Claim.findAll({
        where: {
            policy_id: policy_id
        }
    }).then((claims) => {
        res.status(200).json(claims);
    });
};
module.exports = {
    getClaims,
    getClaim,
    getUserClaims,
    getPolicyClaims
};
