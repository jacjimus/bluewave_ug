
import { db } from "../models/db";
import { sendEmail } from "../services/emailService";
import { airtelMoney } from "../services/payment";
import moment from 'moment'
import { calculatePremium } from "../services/utils";
const { v4: uuidv4 } = require("uuid");
const { Op, Sequelize, } = require("sequelize");
const redisClient = require("../middleware/redis");


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
  premium: number,
  sum_insured: number,
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
    *         required: true
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

const getPolicies = async (req: any, res: any) => {
  try {
    let { start_date, end_date, partner_id, filter, page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    filter = filter?.toString().toLowerCase() || "";

    // const cacheKey = `policies_${partner_id}_${start_date}_${end_date}_${filter}_${page}_${limit}`;
    // const cachedData = await redisClient.get(cacheKey);

    // if (cachedData) {
    //   return res.status(200).json({
    //     code: 200,
    //     status: "OK",
    //     result: JSON.parse(cachedData)
    //   });
    // }


    const dateFilters: any = {};

    if (start_date && end_date) {
      if (start_date === end_date) {
        dateFilters.policy_paid_date = { [Op.eq]: new Date(start_date) };
      } else {
        dateFilters.policy_paid_date = { [Op.between]: [new Date(start_date), new Date(end_date)] };
      }
    } else if (start_date) {
      dateFilters.policy_paid_date = { [Op.gte]: new Date(start_date) };
    } else if (end_date) {
      dateFilters.policy_paid_date = { [Op.lte]: new Date(end_date) };
    }

    const searchFilters: any = {};
    if (filter) {
      searchFilters[Op.or] = [
        { policy_status: { [Op.iLike]: `%${filter}%` } },
        { policy_type: { [Op.iLike]: `%${filter}%` } },
        { beneficiary: { [Op.iLike]: `%${filter}%` } },
        { first_name: { [Op.iLike]: `%${filter}%` } },
        { last_name: { [Op.iLike]: `%${filter}%` } },
        { '$user.name$': { [Op.iLike]: `%${filter}%` } },
        { '$user.first_name$': { [Op.iLike]: `%${filter}%` } },
        { '$user.last_name$': { [Op.iLike]: `%${filter}%` } },
        { '$user.phone_number$': { [Op.iLike]: `%${filter}%` } },
        { '$user.arr_member_number$': { [Op.iLike]: `%${filter}%` } }
      ];
    }

    console.log("dateFilters", dateFilters.policy_paid_date)

    const whereCondition: any = {
      partner_id: partner_id,
      policy_status: 'paid',
      ...dateFilters,
      ...searchFilters,
    };
    console.log("whereCondition", whereCondition)

    const paginationOptions = {
      offset: (page - 1) * limit,
      limit: limit,
    };

    const { rows: policies, count: totalCount } = await db.policies.findAndCountAll({
      where: whereCondition,
      order: [["policy_paid_date", "DESC"]],
      include: [{
        model: db.payments,
        as: 'payments',
      },
      {
        model: db.claims,
        as: 'claims',
      },
      {
        model: db.users,
        as: 'user',
        where: {
          partner_id: partner_id
        },
      }],
      ...paginationOptions,
    });

    const result = {
      message: "Policies fetched successfully",
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      count: totalCount,
      items: policies
    };

    // // Store the result in Redis with an expiration time of 1 hour (3600 seconds)
    // await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);

    return res.status(200).json({
      code: 200,
      status: "OK",
      result
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      status: "FAILED",
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
 *     description: List policies by policy_id
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

    const policy = await db.policies.findOne({
      where: {
        policy_id: policy_id,
        partner_id: partner_id,
        policy_status: 'paid',
      },
      include: [{
        model: db.payments,
        as: 'payments',
      },
      {
        model: db.claims,
        as: 'claims',
      },
      {
        model: db.users,
        as: 'user',
      }],
    });

    if (!policy) {
      return res.status(404).json({
        code: 404,
        message: "No policy found"
      });
    }

    const result = {
      item: {
        ...policy.dataValues,
      },
    };
    return res.status(200).json({
      code: 200,
      status: "OK",
      result
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      status: "FAILED",
      message: "Internal server error",
      error: error.message
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
  *       - name: limit
  *         in: query
  *         required: false
  *         schema:
  *           type: string
  *           format: date
  * 
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const findPolicyByUserId = async (req: any, res: any) => {
  let status = {
    code: 200,
    status: "OK",
    result: {},

  }
  try {
    const user_id = req.params.user_id;
    const partner_id = parseInt(req.query.partner_id);
    const start_date = req.query.start_date; // Start date as string, e.g., "2023-07-01"
    const end_date = req.query.end_date; // End date as string, e.g., "2023-07-31"
    const limit = req.query.limit || 10;

    const dateFilters: any = {};

    if (start_date && end_date) {
      if (start_date === end_date) {
        dateFilters.policy_paid_date = { [Op.eq]: new Date(start_date) };
      } else {
        dateFilters.policy_paid_date = { [Op.between]: [new Date(start_date), new Date(end_date)] };
      }
    } else if (start_date) {
      dateFilters.policy_paid_date = { [Op.gte]: new Date(start_date) };
    } else if (end_date) {
      dateFilters.policy_paid_date = { [Op.lte]: new Date(end_date) };
    }


    let policy = await db.policies.findAll({
      where: {
        user_id: user_id,
        policy_status: 'paid',
        partner_id: partner_id,
        ...dateFilters,

      },
      limit: limit,
    })



    if (!policy || policy.length === 0) {
      status.code = 404;
      status.result = { message: "No policy found" };
      return res.status(status.code).json(status.result);
    }
    let count = policy.length;


    return res.status(status.code).json({
      result: {
        code: 200,
        status: "OK",
        message: "Policies fetched successfully",
        count: count,
        items: policy
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
  *             example: {"user_id": 58094169, "product_id": 1,"partner_id": "1", "policy_start_date": "2021-05-22T02:30:00+08:00", "policy_status": "pending", "beneficiary": "self", "policy_type": "bonze", "policy_end_date": "2021-05-22T02:30:00+08:00", "policy_deduction_day": 7,"policy_deduction_amount": 1000.0, "policy_next_deduction_date": "2021-05-22T02:30:00+08:00","installment_order": 1,"installment_date": "2021-05-22T02:30:00+08:00", "installment_alert_date": "2021-05-22T02:30:00+08:00","premium": 47418.0, "sum_insured": 250000000.0}
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */

const createPolicy = async (req: any, res: any) => {
  try {
    let partner_id = (req.body.partner_id).toString()
    let partner = await db.partners.findOne({ where: { partner_id } })
    const policy: Policy = req.body;

    policy.currency_code = partner.currency_code
    policy.country_code = partner.country_code

    const newPolicy = await db.policies.create(policy);
    if (!newPolicy) {
      return res.status(500).json({ message: "Error creating policy" });
    }


    return res.status(200).json({
      result: {
        status: "OK",
        message: "Policy created successfully",
        policy: newPolicy
      }
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: 500,
      status: "FAILED",
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
  *             example: {"user_id": 3,"product_id": 1,"partner_id": "1", "policy_start_date": "2021-05-22T02:30:00+08:00", "policy_status": "pending", "beneficiary": "self", "policy_type": "silver", "policy_end_date": "2021-05-22T02:30:00+08:00", "policy_deduction_amount": 1000, "policy_next_deduction_date": "2021-05-22T02:30:00+08:00","installment_order": 1,"installment_date": "2021-05-22T02:30:00+08:00", "installment_alert_date": "2021-05-22T02:30:00+08:00", "premium": 47418, "sum_insured": 250000000, "currency_code":"KES","country_code": "KEN", "policy_documents":[]}
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
      premium,
      sum_insured,
      partner_id,
      currency_code,
      country_code,
      policy_documents
    } = req.body;

    let policy = await db.users.findAll({
      where: {
        policy_id: req.params.policy_id
      },
      limit: 100,
    })
    if (!policy) {
      return res.status(404).json({ status: "FAILED", message: "No policy found" });
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
      premium,
      sum_insured,
      product_id,
      partner_id,
      currency_code,
      country_code,
      policy_documents
    };

    await db.users.update(data, {
      where: {
        policy_id: req.params.policy_id,
      },
    });

    return res.status(201).json({
      result: {
        code: 200,
        status: "OK", message: "Policy updated successfully"
      }
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: 500,
      status: "FAILED",
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
    await db.policies.destroy({
      where: {
        policy_id: req.params.policy_id,
      },
    });

    return res.status(201).json({
      result: {
        code: 201,
        status: "OK", message: "Policy deleted successfully"
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: 500,
      status: "FAILED", message: "Internal server error", error
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
 *             example: {"user_id": 4d34925f-21d5-4515-b591-72c51db685f6, "partner_id": "3", "vehicle_category": "Sedan", "vehicle_make": "Toyota", "vehicle_model": "Camry", "vehicle_year": 2022, "vehicle_vin": "5678901234567", "vehicle_license_plate": "ABC123Y", "vehicle_registration_number": "ABCDEF", "vehicle_registration_expiration": "2023-12-31",  "vehicle_insurance_expiration": "2023-12-31", "vehicle_purchase_price": 25000, "vehicle_mileage": 10000}
 *     responses:
 *       200:
 *         description: Vehicle registration successful
 *       400:
 *         description: Invalid request
 */
async function vehicleRegistration(req: any, res: any) {
  try {
    // Destructure the request body to extract necessary information
    const {
      user_id,
      partner_id,
      vehicle_category,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_vin,
      vehicle_license_plate,
      vehicle_registration_number,
      vehicle_insurance_expiration,
      vehicle_purchase_price,
      vehicle_mileage,
    } = req.body;

    // Check if required fields are present in the request
    if (!user_id || !partner_id || !vehicle_category || !vehicle_make) {
      return res.status(400).json({ message: 'Invalid request. Missing required fields.' });
    }

    // Create a new vehicle record in the database
    const registeredVehicle = await db.vehicles.create({
      user_id,
      partner_id,
      vehicle_category,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_vin,
      vehicle_license_plate,
      vehicle_registration_number,
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

/**
 * @swagger
 * /api/v1/policies/calculate/premium:
 *   post:
 *     tags:
 *       - Policies
 *     description:
 *     operationId: 
 *     summary: 
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: vehicle_category
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: vehicle_type
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: vehicle_cv
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: vehicle_tonnage
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: vehicle_number_of_passengers
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: is_fleet
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Vehicle registration successful
 *       400:
 *         description: Invalid request
 */
async function calculatePremiumBasedOnVehicleDetails(req: any, res) {
  try {
    let {
      vehicle_category,
      vehicle_type,
      vehicle_cv,
      vehicle_tonnage,
      vehicle_number_of_passengers,
      is_fleet
    } = req.query;

    // Validate required parameters
    if (!vehicle_category) {
      return res.status(400).json({
        code: 400,
        message: "Invalid request. Please provide vehicle_category and vehicle_type. eg, vehicle_category: CAR, vehicle_type: PRIVATE",
      });
    }

    // Descriptive variable name for premium pricing data
    const vehiclePremiums = {
      CAR_JEEP_PICKUP: {
        PRIVATE: {
          "0-9 CV": 153,
          "10-13 CV": 200,
          "14-17 CV": 264,
          "18+": 349,
        },
        CORPORATE: {
          "0-9 CV": 225,
          "10-13 CV": 298,
          "14-17 CV": 340,
          "18+": 383,
          "Bus_Minibus_Minivan_15": 650,
          "Bus_Minibus_Minivan_16-30": 765,
          "Bus_Minibus_Minivan_31+": 1169,
        },
      },
      TRUCKS: {
        OWN_ACCOUNT_TRANSPORT: {
          "Truck_<=3.5T": 464,
          "Truck_3.6T-8T": 519,
          "Truck_9T-15T": 582,
          "Truck_15T+_Tracteur_routier": 652,
        },
      },
      TAXI_BUS_MINIBUS_MINIVAN: {
        "Taxi_<=5_passengers": 654,
        "Taxi_>5_passengers": 785,
        "Bus_Minibus_Minivan_15_paying": 915,
        "Bus_Minibus_Minivan_16-30_paying": 1177,
        "Bus_Minibus_Minivan_31+_paying": 1471,
        "Taxi_Fleet_<=5_passengers": 425,
        "Taxi_Fleet_>5_passengers": 510,
      },
      DRIVING_SCHOOL: {
        "0-9 CV": 338,
        "10-13 CV": 446,
        "14-17 CV": 510,
        "18+": 574,
        "Bus_Minibus_Minivan_15_paying": 975,
        "Bus_Minibus_Minivan_16-30_paying": 1148,
        "Bus_Minibus_Minivan_31+_paying": 1753,
        "Truck_<=3.5T": 774,
        "Truck_3.6T-8T": 866,
        "Truck_9T-15T": 970,
        "Truck_15T+_Tracteur_routier": 1084,
      },
    };

    const premium = calculatePremium(
      vehiclePremiums,
      vehicle_category,
      vehicle_type,
      vehicle_cv,
      vehicle_tonnage,
      vehicle_number_of_passengers,
      is_fleet)

    return res.status(200).json({
      code: 200,
      status: "OK",
      message: premium.message,
      currency_code: "USD",
      premium: premium.premium,
      vehicle_data: {
        vehicle_category,
        vehicle_type,
        vehicle_cv,
        vehicle_tonnage,
        vehicle_number_of_passengers,
        is_fleet
      }

    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      status: "FAILED",
      message: "Internal server error",
      error,
    });
  }
}

/**
  * @swagger
  * /api/v1/policies/health:
  *   post:
  *     tags:
  *       - Policies
  *     description: buy health insurance
  *     operationId:  createHealthPolicy
  *     summary:  create health insurance
  *     security:
  *       - ApiKeyAuth: []
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             example: {"company_name": "Umoja CO", "company_address": "Nairobi", "company_phone_number": "254712345678", "company_email": "info@umoja.com","contact_person_name":"John Doe", "number_of_staff": 20,"medical_cover_type":"inpatient", "admin_email": "admin@bluewave.insure", "partner_id": 3  }
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */

const createHealthPolicy = async (req: any, res: any) => {
  try {
    let partner_id = (req.body.partner_id).toString()
    let partner = await db.partners.findOne({ where: { partner_id } })


    let { company_name, company_address, company_phone_number, company_email, contact_person_name, number_of_staff, medical_cover_type, admin_email } = req.body
    let subject = "Health Insurance Policy"
    let emailHtml = `<p>Dear Admin,</p>  <p>Request for health insurance provider.
    <p>Company Name: ${company_name}</p>
    <p>Company Address: ${company_address}</p>
    <p>Company Phone Number: ${company_phone_number}</p>
    <p>Company Email: ${company_email}</p>
    <p>Contact Person Name: ${contact_person_name}</p>
    <p>Number of Staff: ${number_of_staff}</p>
    <p>Medical Cover Type: ${medical_cover_type}</p>
    <p>Thank you.</p>`
    await sendEmail("admin@bluewave.insure", subject, emailHtml)


    return res.status(200).json({
      result: {
        code: 200,
        status: "OK",
        message: "We have received your request. We will get back to you shortly.",
        policy: req.body
      }
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: 500,
      status: "FAILED",
      message: "Internal server error", error: error
    });
  }
}

/**
  * @swagger
  * /api/v1/policies/self-cover:
  *   post:
  *     tags:
  *       - Policies
  *     description: buy health insurance
  *     operationId:  submitSelfCover
  *     summary:  submit self cover
  *     security:
  *       - ApiKeyAuth: []
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             example: {"membership_type": "individual", "number_of_family_members": 4, "medical_cover_type": "inpatient", "user_id": "8fd0627e-09df-44e2-a96c-29712388e5f5", "partner_id": 3  }
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const submitSelfCover = async (req, res) => {
  try {
    const { membership_type, number_of_family_members, medical_cover_type, user_id, partner_id } = req.body

    const user = await db.users.findOne({ where: { user_id: user_id, partner_id: partner_id } })
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "No user found"
      });
    }

    let subject = "Health Insurance Policy"
    let emailHtml = `<p>Dear Admin,</p>  <p>Request for Self Cover health insurance.
    <p>Membership Type: ${membership_type}</p>
    <p>Number of Family Members: ${number_of_family_members}</p>
    <p>Medical Cover Type: ${medical_cover_type}</p>
    <p> Customer Name: ${user.name} of phone number ${user.phone_number}</p>
    <p>Thank you.</p>`
    await sendEmail("admin@bluewave.insure", subject, emailHtml)

    return res.status(200).json({
      result: {
        code: 200,
        status: "OK",
        message: "We have received your request. We will get back to you shortly.",
      }
    });

  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: 500,
      status: "FAILED",
      message: "Internal server error", error: error
    });
  }
}

/*
customer that were never paid for the last month
category: "S MINI", "MINI", "MIDI", "BIGGIE"
calculate the percentages of the categories
*/


/**
  * @swagger
  * /api/v1/policies/category/not-paid-last-month:
  *   get:
  *     tags:
  *       - Policies
  *     description: get category not paid last month
  *     operationId:  getCategoryNotPaidLastmonth
  *     summary:  get category not paid last month
  *     security:
  *       - ApiKeyAuth: []
  *     parameters:
  *       - name: partner_id
  *         in: query
  *         required: false
  *         schema:
  *           type: number
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const getCategoryNotPaidLastmonth = async (req, res) => {
  try {
    const lastMonth = new Date(moment().toDate().setMonth(moment().toDate().getMonth() - 1));

    const categoryData = await db.policies.findAll({
      where: {
        partner_id: req.query.partner_id,
        policy_status: "pending",
        createdAt: {
          [Op.between]: [lastMonth, moment().toDate()],
        },
      },
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("policy_id")), "total_count"],
        [
          Sequelize.literal(`SUM(CASE WHEN policy_type = 'S MINI' THEN 1 ELSE 0 END)`),
          'sMiniCategory_count'
        ],
        [
          Sequelize.literal(`SUM(CASE WHEN policy_type = 'MINI' THEN 1 ELSE 0 END)`),
          'miniCategory_count'
        ],
        [
          Sequelize.literal(`SUM(CASE WHEN policy_type = 'MIDI' THEN 1 ELSE 0 END)`),
          'middieCategory_count'
        ],
        [
          Sequelize.literal(`SUM(CASE WHEN policy_type = 'BIGGIE' THEN 1 ELSE 0 END)`),
          'biggieCategory_count'
        ],
      ],

      raw: true, // Return raw object with calculated values
    });



    if (!categoryData || categoryData.length === 0) {
      return res.status(200).json({
        code: 200,
        status: "OK",
        message: "No pending payments found last month",
        total_failed_payments_last_month: 0,
        sMiniCategoryPercentage: 0,
        miniCategoryPercentage: 0,
        middieCategoryPercentage: 0,
        biggieCategoryPercentage: 0,
      });
    }

    const totalPayments = categoryData[0].total_count;
    const sMiniCategoryCount = categoryData[0].sMiniCategory_count;
    const miniCategoryCount = categoryData[0].miniCategory_count;
    const middieCategoryCount = categoryData[0].middieCategory_count;
    const biggieCategoryCount = categoryData[0].biggieCategory_count;

    const sMiniCategoryPercentage = ((sMiniCategoryCount / totalPayments) * 100).toFixed(2);
    const miniCategoryPercentage = ((miniCategoryCount / totalPayments) * 100).toFixed(2);
    const middieCategoryPercentage = ((middieCategoryCount / totalPayments) * 100).toFixed(2);
    const biggieCategoryPercentage = ((biggieCategoryCount / totalPayments) * 100).toFixed(2);

    return res.status(200).json({
      code: 200,
      status: "OK",
      message: "Percentages calculated successfully",
      total_failed_payments_last_month: totalPayments,
      sMiniCategoryPercentage,
      miniCategoryPercentage,
      middieCategoryPercentage,
      biggieCategoryPercentage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      status: "FAILED",
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
};


module.exports = {
  getPolicies,
  getPolicy,
  findPolicyByUserId,
  createPolicy,
  updatePolicy,
  deletePolicy,
  vehicleRegistration,
  calculatePremiumBasedOnVehicleDetails,
  createHealthPolicy,
  submitSelfCover,
  getCategoryNotPaidLastmonth
}






