import {db} from "../models/db";
const Policy = db.policies;

const getPolicies = (req:any, res:any) => {
    Policy.findAll().then((policies:any) => {
        res.status(200).json(policies);
    });
  }
  
  
    const getPolicy = (req:any, res:any) => {
    const policy_id = parseInt(req.params.policy_id)
    Policy.findAll({
        where: {
            policy_id: policy_id
        }
    }).then((policy:any) => {
        res.status(200).json(policy);
    });

    }

    const getUserPolicies = (req:any, res:any) => {
    const user_id = parseInt(req.params.user_id)
    Policy.findAll({
        where: {
            user_id: user_id
        }
    }).then((policies:any) => {
        res.status(200).json(policies);
    });

    }


    const getPolicyPayments = (req:any, res:any) => {
    const policy_id = parseInt(req.params.policy_id)
    Policy.findAll({
        where: {
            policy_id: policy_id
        }
    }).then((policy:any) => {
        res.status(200).json(policy);
    });

    }

  
module.exports = {
    getPolicies,
    getPolicy,
    getUserPolicies,
    getPolicyPayments
}






