
import { db } from "../models/db";
const Policy = db.policies;
const User = db.users;
const Product = db.products;
const { Op } = require("sequelize");


import PolicyIssuance from "../services/PolicyIssuance";

interface Policy {
    user_id: number,
    product_id: number,
    policy_start_date: Date,
    policy_status: string,
    beneficiary: string,
    policy_type: string,
    policy_end_date: Date,
    policy_deduction_amount: number,
    policy_next_deduction_date: Date,
    installment_order: number,
    installment_date: Date,
    installment_alert_date: Date,
    tax_rate_vat: number,
    tax_rate_ext: number,
    premium: number,
    sum_insured: number,
    excess_premium: number,
    discount_premium: number,
    partner_id: number
}


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
    *       - name: filter
    *         in: query
    *         required: false
    *         schema:
    *           type: string
    *     responses:
    *       200:
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const getPolicies = async (req: any, res: any) => {
    let status = {
        code: 200,
        result: {},

    }
    try {

        const filter = req.query.filter || "";
        let policy: any = await Policy.findAll(
            {
              where: {
                partner_id: req.query.partner_id,
                [Op.or]: [
                    {
                      policy_type: {
                        [Op.iLike]: `%${filter}%`
                      }
                    },

                    {
                        policy_status: {
                            [Op.iLike]: `%${filter}%`
                            }

                    },

                ],

                },
                order: [
                    ['id', 'DESC'],
                ],

                include: [
                    {
                        model: User,
                        as: "user",

                    },
                    {
                        model: Product,
                        as: "product",
                    }
                ]

                
            }
        )

        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policies found" });
        }

        //policy count
        const policyCount = await Policy.count();

        //policy pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = policyCount;

        const resultPolicy = policy.slice(startIndex, endIndex);

        const pagination: any = {};

        if (endIndex < policyCount) {
            pagination.next = {
                page: page + 1,
                limit: limit,
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit: limit,
            };
        }

        status.result = {
            count: total,
            pagination: pagination,
            items: resultPolicy,

        }

        return res.status(status.code).json({result: status.result});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Internal server error", error: error});
    }
};


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
  *       - name: partner_id
  *         in: query
  *         required: true
  *         schema:
  *           type: number
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
    let status = {
        code: 200,
        result: {},

    }
    try {
        const policy_id = parseInt(req.params.policy_id)
        const partner_id = parseInt(req.query.partner_id)
        const policy = await Policy.findOne({
            where: {
                id: policy_id,
                partner_id: partner_id
            }
        })
        if (!policy || policy.length === 0) {
            return res.status(404).json({ message: "No policy found" });
        }
  
        status.result = {
            item: policy
        };

        return res.status(status.code).json({result: status.result});
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "Internal server error", error: error});
    }

}


/**
  * @swagger
  * /api/v1/policies/user/{user_id}:
  *   get:
  *     tags:
  *       - Policies
  *     description: List policies by user_id
  *     operationId: listPoliciesByUserID
  *     summary: List policies
  *     security:
  *       - ApiKeyAuth: []
  *     parameters:
  *       - name: partner_id
  *         in: query
  *         required: true
  *         schema:
  *           type: number
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
    let status = {
        code: 200,
        result: {},

    }
    try {
        const user_id = parseInt(req.params.user_id)
        const partner_id = parseInt(req.query.partner_id)

        let users = await Policy.findAll({
            where: {
                user_id: user_id,
                partner_id: partner_id
                
            }
        })

        if (!users || users.length === 0) {
            status.code = 404;
            status.result = { message: "No policy found" };
            return res.status(status.code).json(status.result);
        }
        let count = users.length;


        status.result = {
            count,
            items: users
        };
        return res.status(status.code).json({result: {item:status.result}});
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "Internal server error", error: error});
    }


}

/**
  * @swagger
  * /api/v1/policies/create:
  *   post:
  *     tags:
  *       - Policies
  *     description: 
  *     operationId: createPolicy
  *     summary: 
  *     security:
  *       - ApiKeyAuth: []
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             example: {"user_id": 58094169, "product_id": 1,"partner_id":1", "policy_start_date": "2021-05-22T02:30:00+08:00", "policy_status": "pending", "beneficiary": "Radhe", "policy_type": "Individual", "policy_end_date": "2021-05-22T02:30:00+08:00", "policy_deduction_day": 7,"policy_deduction_amount": 1000.0, "policy_next_deduction_date": "2021-05-22T02:30:00+08:00","installment_order": 1,"installment_date": "2021-05-22T02:30:00+08:00", "installment_alert_date": "2021-05-22T02:30:00+08:00","tax_rate_vat": 0.20,"tax_rate_ext": 0.25,"premium": 47418.0, "sum_insured": 250000000.0,"excess_premium": 0.0,"discount_premium": 0.0}
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */

const createPolicy = async (req: any, res: any) => {
    try {


        const policy: Policy = req.body;

        const newPolicy = await Policy.create(policy);
        if(!newPolicy){
            return res.status(500).json({ message: "Error creating policy" });
        }

        return res.status(200).json({ result: {
            message: "Policy created successfully",
            policy: newPolicy
        }
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "Internal server error", error: error});
    }

}



/**
  * @swagger
  * /api/v1/policies/policyIssuance:
  *   post:
  *     tags:
  *       - Policies
  *     description: policyIssuance
  *     operationId: PolicyIssuance
  *     summary: policyIssuance
  *     security:
  *       - ApiKeyAuth: []
  *     parameters:
  *       - name: product_id
  *         in: query
  *         required: true
  *         schema:
  *           type: number
  *       - name: partner_id
  *         in: query
  *         required: true
  *         schema:
  *           type: number
  *       - name: user_id
  *         in: query
  *         required: true
  *         schema:
  *           type: number
  *       - name: policy_id
  *         in: query
  *         required: true
  *         schema:
  *           type: number
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             example: { "ClientCreation":{ "Title":"Master", "First_Nm":"Member1", "Middle_Nm":"Member1m", "Last_Nm":"Member1l","Dob":"2023-05-25T00:00:00","Gender":"M","Pin_Zip":null,"idNo":null,"Marital_Status":"Remarried","Nationality":null,"Email1":"Radhe@gmm.com","Contact_Mobile_No":"4444444444","Remarks":null,"Address_Line1":null},"PolicyCreationRequest":{"Quotation_No":"Q20230522100007-00", "Intermediary_Cd":"AGT0000308","Source_System_Nm":"Member Portal", "Employee_No":"", "Quotation_Dt":"2023-05-22T02:30:00+08:00","IsPayment":"0","Policy_Tenure":"365","FamilyType_Cd":"","Cal_Type":"PerPerson","Business_Type":"New","Subsidiary_Cd":""},"MemObj":{"Member":[ {"Insured_Cd":"1","Title":"Master","First_Nm":"Member1","Middle_Nm":"Member1m","Last_Nm":"Member1l","Gender":"M","Dob":"2023-05-25T00:00:00","Relation_Cd":"R001","MaritalStatus":"Remarried","Height":"179","Weight":"70","MemberproductComponents":[{"Product_Cd":"IFM1","Scheme_Cd":"IFM1000001","MemberQuestionDetails":[],"CoversDetails":[{ "Cover_Cd":"1100001", "Sum_Insured":"40000000.0","installment_Order":1,"installment_Date":"2023-05-22T02:30:00+08:00","installment_Alert_Date":"2023-05-22T02:30:00+08:00","tax_Rate_Vat":0.20,"tax_Rate_Ext":0.25, "premium":0.0, "excess_Premium":0.0,"discount_Premium":0.0,"tax_Amt_Vat":0.000,"tax_Amt_Ext":0.0000,"total_Amt":0.0},{ "Cover_Cd":"1100002", "Sum_Insured":"250000.0", "installment_Order":1, "installment_Date":"2023-05-22T02:30:00+08:00", "installment_Alert_Date":"2023-05-22T02:30:00+08:00", "tax_Rate_Vat":0.20, "tax_Rate_Ext":0.25, "premium":47418.00,"excess_Premium":0.0, "discount_Premium":0.0, "tax_Amt_Vat":94.8360,"tax_Amt_Ext":118.5450,"total_Amt":47418.00     } ]}]}]},"ReceiptObj":{"Branch_Cd":null,"Receipt_Type":null,"Mode_Of_Entry":null,"Payer_Type":null,"Payer_Cd":null,"Payer_Nm":null,"Collection_Rcvd_Dt":null,"Base_Currency_Cd":null,"Receipt_Amt":0.0,"Instrument_Type":null,"Instrument_No":null,"Instrument_Dt":"0001-01-01T00:00:00"}}
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const policyIssuance = async (req: any, res: any) => {
    try {
        const { PolicyCreationRequest, MemObj, ReceiptObj } = req.body;

        const  {user_id, policy_id, partner_id, product_id} = req.query;

        //get user details
        let user = await User.findOne({where: {id: user_id}});

        //get policy details
        let policy = await Policy.findOne({where: {id: policy_id}});

        //use it to create client and policy request

    let ClientCreation = {
        Title: user.title,
        First_Nm: user.first_name,
        Middle_Nm: user.middle_name,
        Last_Nm: user.last_name,
        Dob: user.dob,
        Gender: user.gender,
        Pin_Zip: user.pin_zip,
        idNo: user.national_id,
        Marital_Status: user.marital_status,
        Nationality: user.nationality,
        Email1: user.email,
        Contact_Mobile_No: user.phone_number,
        Remarks: user.remarks || null,
        Address_Line1: user.address_line
    }

    // let PolicyCreationRequest = {
    //     Quotation_No: policy.quotation_no,
    //     Intermediary_Cd: policy.intermediary_cd,
    //     Source_System_Nm: policy.source_system_nm,
    //     Employee_No: policy.employee_no,
    //     Quotation_Dt: policy.quotation_dt,
    //     IsPayment: policy.is_payment,
    //     Policy_Tenure: policy.policy_tenure,
    //     FamilyType_Cd: policy.familytype_cd,
    //     Cal_Type: policy.cal_type,
    //     Business_Type: policy.business_type,
    //     Subsidiary_Cd: policy.subsidiary_cd
    // }

        





        const policyIssuance = await PolicyIssuance(ClientCreation, PolicyCreationRequest, MemObj, ReceiptObj);

        if (policyIssuance) {

            return res.status(200).json({ result : {
                success: true,
                message: 'Policy Issuance',
                item: policyIssuance
          }  });
        }

    } catch (error) {
        console.log("ERROR ON POLICY ISSURANC", error)
        return res.status(500).json({message: "Internal server error"}, error);
    }
};




/**
  * @swagger
  * /api/v1/policies/{policy_id}:
  *   put:
  *     tags:
  *       - Policies
  *     description: Update policies by policy_id
  *     operationId: updatePoliciesByPolicyID
  *     summary: Update policies
  *     security:
  *       - ApiKeyAuth: []
  *     parameters:
  *       - name: policy_id
  *         in: path
  *         required: true
  *         schema:
  *           type: number
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             example: {"user_id": 3,"product_id": 1,"partner_id": 1, "policy_start_date": "2021-05-22T02:30:00+08:00", "policy_status": "pending", "beneficiary": "Radhe", "policy_type": "Individual", "policy_end_date": "2021-05-22T02:30:00+08:00", "policy_deduction_amount": 1000, "policy_next_deduction_date": "2021-05-22T02:30:00+08:00","installment_order": 1,"installment_date": "2021-05-22T02:30:00+08:00", "installment_alert_date": "2021-05-22T02:30:00+08:00","tax_rate_vat": 0.20,"tax_rate_ext": 0.25,"premium": 47418, "sum_insured": 250000000,"excess_premium": 0,"discount_premium": 0}
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const updatePolicy = async (req: any, res: any) => {
    try {

        const {
            user_id,
            product_id,
            policy_start_date,
            policy_status,
            beneficiary,
            policy_type,
            policy_end_date,
            policy_deduction_amount,
            policy_next_deduction_date,
            installment_order,
            installment_date,
            installment_alert_date,
            tax_rate_vat,
            tax_rate_ext,
            premium,
            sum_insured,
            excess_premium,
            discount_premium,
            partner_id

        } = req.body;


        let policy = await Policy.findAll({

            where: {
                id: req.params.policy_id
            }
        })
        if (!policy) {
            return res.status(404).json({ message: "No policy found" });
        }

        const data: Policy = {
            user_id,
            policy_start_date,
            policy_status,
            beneficiary,
            policy_type,
            policy_end_date,
            policy_deduction_amount,
            policy_next_deduction_date,
            installment_order,
            installment_date,
            installment_alert_date,
            tax_rate_vat,
            tax_rate_ext,
            premium,
            sum_insured,
            excess_premium,
            discount_premium,
            product_id,
            partner_id
        };
        //saving the policy
        await Policy.update(data, {
            where: {
                policy_id: req.params.policy_id,
            },
        });
        //send policy details
        return res.status(201).json({ result:{message: "Policy updated successfully"} });
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "Internal server error", error});
    }
}

/**
  * @swagger
  * /api/v1/policies/{policy_id}:
  *   delete:
  *     tags:
  *       - Policies
  *     description: Delete policies by policy_id
  *     operationId: deletePoliciesByPolicyID
  *     summary: Delete policies
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
const deletePolicy = async (req: any, res: any) => {
    try {
        await Policy.destroy({
            where: {
                id: req.params.policy_id,
            },
        });
        //send policy details
        return res.status(201).json({ result:{message: "Policy deleted successfully"}  });
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Internal server error", error});

    }
}





module.exports = {
    getPolicies,
    getPolicy,
    getUserPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    policyIssuance

}






