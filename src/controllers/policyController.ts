import { db } from "../models/db";
const Policy = db.policies;


/**
    * @swagger
    * /api/v1/policies:
    *   get:
    *     tags:
    *       - Policies
    *     description: List policies
    *     operationId: listPolicies
    *     summary: List policies
    *     security:
    *       - ApiKeyAuth: []
    *     responses:
    *       200:
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const getPolicies = async (req: any, res: any) => {
    try {
        const policy = await Policy.findAll().then((policies: any) => {
            return res.status(200).json(policies);
        });

        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policies found" });
        }

        return res.status(200).json(policy);
    } catch (error) {
        return res.status(404).json({ message: "Error fetching policies" });

    }

}

/**
  * @swagger
  * /api/v1/policies/{policy_id}:
  *   get:
  *     tags:
  *       - Policies
  *     description: List policies by agreement_id
  *     operationId: listPoliciesByAgreementID
  *     summary: List policies
  *     security:
  *       - ApiKeyAuth: []
  *     parameters:
  *       - name: policy_id
  *         in: path
  *         required: true
  *         schema:
  *           type: number
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const getPolicy = async (req: any, res: any) => {
    try {
        const policy_id = parseInt(req.params.policy_id)
        const policy = await Policy.findAll({
            where: {
                policy_id: policy_id
            }
        })
        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policy found" });
        }

        return res.status(200).json(policy);
    } catch (error) {
        console.log(error)
        return res.status(404).json({ message: "error getting policy" });
    }

}



/* * @swagger
   * /api/v1/policies/user/{user_id}:
   *   get:
   *     tags:
   *       - Policies
   *     description: List policies by user_id
   *     operationId:  ListPoliciesByUserID
   *     summary: List user policies
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - name: user_id
   *         in: path
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Information fetched succussfuly
   *       400:
   *         description: Invalid request
   */
const getUserPolicies = async (req: any, res: any) => {
    try {
        const user_id = parseInt(req.params.user_id)
        let user = await Policy.findAll({
            where: {
                user_id: user_id
            }
        })

        if (!user || user.length === 0) {
            return res.status(404).json({ message: "No user found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.log(error)
        return res.status(404).json({ message: "No policy found" });
    }


}





/* * @swagger
   * /api/v1/policies/{policy_id}:
   *   put:
   *     tags:
   *       - Policies
   *     description: Update policies by policy_id
   *     operationId:  UpdatePoliciesByPolicyID
   *     summary: List user policies
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - name: policy_id
   *         in: path
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Information fetched succussfuly
   *       400:
   *         description: Invalid request
   */
const updatePolicy = async (req: any, res: any) => {
    try {

        const {
            policy_start_date,
            policy_status, beneficiary,
            policy_type, policy_end_date,
            policy_deduction_amount,
            policy_next_deduction_date
        } = req.body;

        let policy = await Policy.findAll({

            where: {
                policy_id: req.params.policy_id
            }
        })
        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policy found" });
        }

        const data = {
            policy_start_date,
            policy_status,
            beneficiary,
            policy_type,
            policy_end_date,
            policy_deduction_amount,
            policy_next_deduction_date,
            updatedAt: new Date(),
        };
        //saving the policy
        const updatedPolicy = await Policy.update(data, {
            where: {
                policy_id: req.params.policy_id,
            },
        });
        //send policy details
        return res.status(201).send(updatedPolicy);
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Details are not correct" });
    }
}

//deleting a policy
const deletePolicy = async (req: any, res: any) => {
    try {
        const policy = await Policy.destroy({
            where: {
                policy_id: req.params.policy_id,
            },
        });
        //send policy details
        return res.status(201).send(policy);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Details are not correct" });

    }
}



module.exports = {
    getPolicies,
    getPolicy,
    getUserPolicies,
    // getPolicyPayments,
    updatePolicy,
    deletePolicy

}






