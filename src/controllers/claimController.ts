import {db} from "../models/db";
const Claim = db.claims;

const getClaims = (req:any, res:any) => {
    Claim.findAll().then((claims:any) => {
        res.status(200).json(claims);
    });
  }

    const getClaim = (req:any, res:any) => {
    const claim_id = parseInt(req.params.claim_id)
    Claim.findAll({
        where: {
            claim_id: claim_id
        }
    }).then((claim:any) => {
        res.status(200).json(claim);
    });

    }

    const getUserClaims = (req:any, res:any) => {
    const user_id = parseInt(req.params.user_id)
    Claim.findAll({
        where: {
            user_id: user_id
        }
    }).then((claims:any) => {
        res.status(200).json(claims);
    });

    }

    const getPolicyClaims = (req:any, res:any) => {
    const policy_id = parseInt(req.params.policy_id)
    Claim.findAll({
        where: {
            policy_id: policy_id
        }
    }).then((claims:any) => {
        res.status(200).json(claims);
    });

    }


module.exports = {
    getClaims,
    getClaim,
    getUserClaims,
    getPolicyClaims
}
