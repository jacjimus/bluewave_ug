
import { db } from "../models/db";
const Policy = db.policies;
const User = db.users;
const Partner = db.partners;
const { v4: uuidv4 } = require("uuid");
const { Op, Sequelize, } = require("sequelize");
import { globalSearch } from "../services/utils";




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
  installment_type: number,
  installment_date: Date,
  installment_alert_date: Date,
  tax_rate_vat: number,
  tax_rate_ext: number,
  premium: number,
  sum_insured: number,
  excess_premium: number,
  discount_premium: number,
  partner_id: number,
  currency_code: string,
  country_code: string,
  policy_documents: string[]
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
    *       - name: start_date
    *         in: query
    *         required: false
    *         schema:
    *           type: string
    *           format: date
    *       - name: end_date
    *         in: query
    *         required: false
    *         schema:
    *           type: string
    *           format: date
    *     responses:
    *       200:
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */

const getPolicies = async (req, res) => {
  try {
    
    const partner_id = req.query.partner_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = req.query?.filter?.toString().toLowerCase() || "";
    const start_date = req.query.start_date; // Start date as string, e.g., "2023-07-01"

    const end_date = req.query.end_date; // End date as string, e.g., "2023-07-31"

    const dateFilters: any = {};
    if (start_date) {
      dateFilters.createdAt = { [Op.gte]: new Date(start_date) };
    }
    if (end_date) {
      dateFilters.createdAt = { ...dateFilters.createdAt, [Op.lte]: new Date(end_date) };
    }

    if (start_date && end_date) {
      dateFilters.createdAt = { [Op.between]: [new Date(start_date), new Date(end_date)] };
    }

    // Prepare the search filters based on the provided filter string
    const searchFilters: any = {};
    if (filter) {
      
      searchFilters[Op.or] = [
        { policy_status: { [Op.iLike]: `%${filter}%` } },
        { policy_type: { [Op.iLike]: `%${filter}%` } },
        { beneficiary: { [Op.iLike]: `%${filter}%` } },
        { first_name: { [Op.iLike]: `%${filter}%` } },
        { last_name: { [Op.iLike]: `%${filter}%` } }
      
      ];
    }
  
    // Prepare the where condition based on the provided filters
    const whereCondition: any = {
      partner_id: partner_id,
      policy_status: 'paid',
      ...dateFilters,
      ...searchFilters, 
    };

    // Calculate the offset
    const offset = (page - 1) * limit;

    // Find query
    const policies = await Policy.findAndCountAll({
      where: whereCondition,
      order: [["policy_start_date", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
        }
      ],
      offset,
      limit,
    
    });

    if (policies.count === 0) {
      return res.status(404).json({ message: "No policies found" });
    }

    const result = {
      message: "Policies fetched successfully",
      count: policies.count,
      items: policies.rows
    };
    return res.status(200).json({
      code: 200,
      result
    });

  
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
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
 *           type: string
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const getPolicy = async (req: any, res: any) => {
  try {
    const policy_id = req.params.policy_id;
    const partner_id = req.query.partner_id;

    const policy = await Policy.findOne({
      where: {
        policy_id: policy_id,
        partner_id: partner_id,
        policy_status: 'paid'
      },
    });

    if (!policy) {
      return res.status(404).json({
        code: 404,
        message: "No policy found"
      });
    }

    // Calculate paid and pending premiums
    const total_premium = policy.premium;
    const paid_premium = policy.policy_deduction_amount;
    const pending_premium = total_premium - paid_premium;

    const result = {
      item: {
        ...policy.dataValues,
        total_premium,
        paid_premium,
        pending_premium,
        count: total_premium,
        items: policy
      },
    };
    return res.status(200).json({
      code: 200,
      result
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: "Internal server error", error: error.message
    });
  }
};


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
  *           type: string
  *       - name: start_date
  *         in: query
  *         required: false
  *         schema:
  *           type: string
  *           format: date
  *       - name: end_date
  *         in: query
  *         required: false
  *         schema:
  *           type: string
  *           format: date
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const findUserByPhoneNumberPolicies = async (req: any, res: any) => {
  let status = {
    code: 200,
    result: {},

  }
  try {
    const user_id = req.params.user_id;
    const partner_id = parseInt(req.query.partner_id);
    const start_date = req.query.start_date; // Start date as string, e.g., "2023-07-01"
    const end_date = req.query.end_date; // End date as string, e.g., "2023-07-31"

    const dateFilters: any = {};
    if (start_date) {
      dateFilters.createdAt = { [Op.gte]: new Date(start_date) };
    }
    if (end_date) {
      dateFilters.createdAt = { ...dateFilters.createdAt, [Op.lte]: new Date(end_date) };
    }

    let policy = await Policy.findAll({
      where: {
        user_id: user_id,
        olicy_status: 'paid',
        partner_id: partner_id,
        ...dateFilters, 

      },
      limit: 100, 
    })

    // policy.total_premium = policy.premium
    policy.policy_paid_premium = policy.policy_deduction_amount
    policy.policy_pending_premium = policy.yearly_premium - policy.premium

    //for every policy, add paid premium and pending premium

    for (let i = 0; i < policy.length; i++) {
      policy[i].total_premium = policy[i].premium
      policy[i].policy_paid_premium = policy[i].policy_deduction_amount
      policy[i].policy_pending_premium = policy[i].premium - policy[i].policy_deduction_amount
    }

    if (!policy || policy.length === 0) {
      status.code = 404;
      status.result = { message: "No policy found" };
      return res.status(status.code).json(status.result);
    }
    let count = policy.length;
 

    status.result = {
      count,
      items: policy
    };
    return res.status(status.code).json({
      result: {
        code: 200,
        message: "Policies fetched successfully",
        item: status.result
      }
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal server error", error: error });
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
  *             example: {"user_id": 58094169, "product_id": 1,"partner_id": "1", "policy_start_date": "2021-05-22T02:30:00+08:00", "policy_status": "pending", "beneficiary": "self", "policy_type": "bonze", "policy_end_date": "2021-05-22T02:30:00+08:00", "policy_deduction_day": 7,"policy_deduction_amount": 1000.0, "policy_next_deduction_date": "2021-05-22T02:30:00+08:00","installment_order": 1,"installment_date": "2021-05-22T02:30:00+08:00", "installment_alert_date": "2021-05-22T02:30:00+08:00","tax_rate_vat": 0.20,"tax_rate_ext": 0.25,"premium": 47418.0, "sum_insured": 250000000.0,"excess_premium": 0.0,"discount_premium": 0.0, "policy_documents":[]}
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */

const createPolicy = async (req: any, res: any) => {
  try {
    let partner_id = (req.body.partner_id).toString()
    let partner = await Partner.findOne({ where: { partner_id } })
    const policy: Policy = req.body;

    policy.currency_code = partner.currency_code
    policy.country_code = partner.country_code

    const newPolicy = await Policy.create(policy);
    if (!newPolicy) {
      return res.status(500).json({ message: "Error creating policy" });
    }
   
    return res.status(200).json({
      result: {
        code: 200,
        message: "Policy created successfully",
        policy: newPolicy
      }
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: 500,
      message: "Internal server error", error: error
    });
  }
}



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
  *           type: string
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             example: {"user_id": 3,"product_id": 1,"partner_id": "1", "policy_start_date": "2021-05-22T02:30:00+08:00", "policy_status": "pending", "beneficiary": "self", "policy_type": "silver", "policy_end_date": "2021-05-22T02:30:00+08:00", "policy_deduction_amount": 1000, "policy_next_deduction_date": "2021-05-22T02:30:00+08:00","installment_order": 1,"installment_date": "2021-05-22T02:30:00+08:00", "installment_alert_date": "2021-05-22T02:30:00+08:00","tax_rate_vat": 0.20,"tax_rate_ext": 0.25,"premium": 47418, "sum_insured": 250000000,"excess_premium": 0,"discount_premium": 0,  "currency_code":"KES","country_code": "KEN", "policy_documents":[]}
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
      installment_type,
      installment_date,
      installment_alert_date,
      tax_rate_vat,
      tax_rate_ext,
      premium,
      sum_insured,
      excess_premium,
      discount_premium,
      partner_id,
      currency_code,
      country_code,
      policy_documents
    } = req.body;

    let policy = await Policy.findAll({
      where: {
        policy_id: req.params.policy_id
      },
      limit: 100, 
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
      installment_type,
      installment_date,
      installment_alert_date,
      tax_rate_vat,
      tax_rate_ext,
      premium,
      sum_insured,
      excess_premium,
      discount_premium,
      product_id,
      partner_id,
      currency_code,
      country_code,
      policy_documents
    };

    await Policy.update(data, {
      where: {
        policy_id: req.params.policy_id,
      },
    });
    
    return res.status(201).json({
      result: {
        code: 200, message: "Policy updated successfully"
      }
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: 500,
      message: "Internal server error", error
    });
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
  *           type: string
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
        policy_id: req.params.policy_id,
      },
    });
   
    return res.status(201).json({
      result: {
        code: 201, message: "Policy deleted successfully"
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: 500, message: "Internal server error", error
    });

  }
}

/**
 * @swagger
 * /api/v1/policies/vehicle/registration:
 *   post:
 *     tags:
 *       - Policies
 *     description: Register a new vehicle for a policy
 *     operationId: registerVehicle
 *     summary: Register a new vehicle
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: {"user_id": 58094169, "product_id": 1, "partner_id": "1", "vehicle_category": "Sedan", "vehicle_make": "Toyota", "vehicle_model": "Camry", "vehicle_year": 2022, "vehicle_vin": "12345678901234567", "vehicle_license_plate": "ABC123", "vehicle_registration": "ABCDEF", "vehicle_registration_expiration": "2023-12-31", "vehicle_insurance": "XYZInsurance", "vehicle_insurance_expiration": "2023-12-31", "vehicle_purchase_price": 25000, "vehicle_purchase_mileage": 10000, "vehicle_purchase_location": "Dealer", "vehicle_purchase_comments": "Brand new vehicle"}
 *     responses:
 *       200:
 *         description: Vehicle registration successful
 *       400:
 *         description: Invalid request
 */
async function vehicleRegistration(req: any, res:any) {
  try {
    // Destructure the request body to extract necessary information
    const {
      user_id,
      product_id,
      partner_id,
      vehicle_category,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_vin,
      vehicle_license_plate,
      vehicle_registration,
      vehicle_insurance_expiration,
      vehicle_purchase_price,
      vehicle_mileage,
    } = req.body;

    // Check if required fields are present in the request
    if (!user_id || !product_id || !partner_id || !vehicle_category || !vehicle_make ) {
      return res.status(400).json({ message: 'Invalid request. Missing required fields.' });
    }

    // Create a new vehicle record in the database
    const registeredVehicle = await db.vehicles.create({
      user_id,
      product_id,
      partner_id,
      vehicle_category,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_vin,
      vehicle_license_plate,
      vehicle_registration,
      vehicle_insurance_expiration,
      vehicle_purchase_price,
      vehicle_mileage
    });

    // Return a success response with the registered vehicle information
    return res.status(200).json({
      message: 'Vehicle registration successful',
      vehicle: registeredVehicle,
    });
  } catch (error) {
    // Handle any errors that occur during the registration process
    console.error('Error registering vehicle:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// Export the function for use in other parts of your application
module.exports = {
  vehicleRegistration,
};



module.exports = {
  getPolicies,
  getPolicy,
  findUserByPhoneNumberPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
vehicleRegistration
}






