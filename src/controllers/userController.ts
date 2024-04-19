import { Request, Response } from 'express';
import bcrypt from "bcrypt";
import { db } from "../models/db";
import { reconciliation, registerDependant, registerPrincipal, updatePremium } from "../services/aarServices";
import welcomeTemplate from "../services/emailTemplates/welcome";
import { sendEmail, sendForgotPasswordEmail, sendWelcomeEmail } from "../services/emailService";
import jwt from 'jsonwebtoken'
const dotenv = require("dotenv").config();
import {
  getRandomInt,
  isValidEmail,
  globalSearch

} from "../services/utils";
const { Op } = require("sequelize");
const XLSX = require("xlsx");
import { v4 as uuidv4 } from "uuid";
import SMSMessenger from "../services/sendSMS";

const User = db.users;
const Partner = db.partners;
const Policy = db.policies;
const Log = db.logs;
const Beneficiary = db.beneficiaries;
const Payments = db.payments;


async function findUserByUserId(user_id: string, partner_id: number) {
  let user = await User.findOne({
    where: {
      user_id: user_id,
      partner_id: partner_id,
    },
    include: [
      {
        model: Beneficiary,
        as: "beneficiaries",
      },
      {
        model: Payments,
        as: "payments",
      },
      {
        model: Policy,
        as: "policies",
      }
    ],
  });
  //remove password from the response
  if (user) {
    delete user.dataValues.password;
    delete user.dataValues.pin;
  }
  return user;
}

/** @swagger
 * /api/v1/users/signup:
 *   post:
 *     tags:
 *       - Users
 *     description: Register User
 *     operationId: registerUser
 *     summary: Register User
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: { "first_name":"John", "middle_name":"White",  "last_name":"Doe", "email":"test@gmail.com", "password": "test123", "phone_number":"0754546568","national_id":"27885858",  "dob": "1990-12-12", "gender": "M","marital_status": "single","addressline": "Nairobi", "nationality": "Kenyan","title": "Mr","pinzip": "00100", "driver_licence": "DRC123456789", "voter_id": "5322344", "partner_id": "1"}
 *     responses:
 *       200:
 *         description: Information fetched succussfully
 *       400:
 *         description: Invalid request
 */
const signup = async (req, res) => {
  try {
    let {
      first_name,
      middle_name,
      last_name,
      email,
      password,
      phone_number,
      partner_id,
      national_id,
      dob,
      gender,
      marital_status,
      addressline,
      nationality,
      title,
      pinzip,
      driver_licence,
      voter_id,
      role,
    } = req.body;

    // Validate required fields
    const requiredFields = [first_name, last_name, password, phone_number, partner_id];
    if (requiredFields.some((field) => !field)) {
      return res.status(400).json({ code: 400, message: "Please provide all required fields" });
    }

    // Remove leading '0' from phone number
    phone_number = phone_number.replace(/^0/, '');

    // Set default role if not provided
    role = role || "user";

    // Validate email format
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ code: 400, message: "Please enter a valid email" });
    }

    // Check if email already exists
    if (email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(409).json({ status: "FAILED", code: 409, message: "Email already exists" });
      }
    }

    if (phone_number) {
      const phoneExists = await User.findOne({ where: { phone_number } });
      if (phoneExists) {
        return res.status(409).json({ status: "FAILED", code: 409, message: "Phone number already exists" });
      }
    }

    // Generate membership ID
    const membership_id = Math.floor(100000 + Math.random() * 900000);

    // Create user data object
    const userData = {
      membership_id,
      name: `${first_name} ${last_name}`,
      first_name,
      last_name,
      middle_name,
      email,
      phone_number,
      national_id,
      password: await bcrypt.hash(password, 10),
      pin: Math.floor(1000 + Math.random() * 9000),
      role,
      dob,
      gender,
      marital_status,
      addressline,
      pinzip,
      nationality,
      title,
      partner_id,
      driver_licence,
      voter_id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create a new user
    const newUser = await User.create(userData);

    if (newUser) {
      // Generate JWT token
      const token = jwt.sign({ user_id: newUser.user_id, role: newUser.role }, process.env.JWT_SECRET || "apple123", {
        expiresIn: 1 * 24 * 60 * 60 * 1000,
      });

      // Set JWT token as a cookie
      res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpOnly: true });

      return res.status(201).json({
        result: {
          code: 200,
          status: "OK",
          message: "Customer registered successfully",
          token,
        },
      });
    }
  } catch (error) {
    console.error("ERROR", error);
    return res.status(500).json({
      code: 500,
      status: "FAILED",
      message: "Internal server error",
      error: error.message
    });
  }
};


//partnerRegistration

/** @swagger
 * /api/v1/users/partner/register:
 *   post:
 *     tags:
 *       - Partner
 *     description: Register a partner
 *     operationId: registerPartner
 *     summary: Register a partner
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: { "partner_name": "Vodacom", "business_name": "Vodacom","business_type": "Telecom","business_category": "account","business_address": "Dar es salaam","country": "Tanzania","email": "info@vodacom.com","phone_number": "255754000000" ,"password": "passw0rd", "partner_id": "1"}
 *     responses:
 *       200:
 *         description: Information fetched succussfully
 *       400:
 *         description: Invalid request
 */

const partnerRegistration = async (req: any, res: any) => {
  const {
    partner_name,
    partner_id,
    business_name,
    business_type,
    business_category,
    business_address,
    country,
    email,
    phone_number,
    password,
  } = req.body;
  try {
    //signup a partner
    if (
      !partner_name ||
      !partner_id ||
      !business_name ||
      !business_type ||
      !business_category ||
      !business_address ||
      !country ||
      !email ||
      !phone_number ||
      !password
    ) {
      return res
        .status(400)
        .json({ message: "Please fill all the required fields" });
    }
    const partnerData = {
      partner_name,
      partner_id,
      business_name,
      business_type,
      business_category,
      business_address,
      country,
      email,
      phone_number,
      password: await bcrypt.hash(password, 10),
    };

    //checking if the partner already exists using email and partner id
    let partner: any = await Partner.findOne({ where: { email: email } });
    if (partner && partner.length > 0) {
      return res.status(409).json({ status: "FAILED", code: 409, message: "Partner already exists" });
    }

    //saving the partner
    const newPartner: any = await Partner.create(partnerData);

    // set cookie with the token generated
    if (newPartner) {

      return res
        .status(201)
        .json({
          code: 201,
          status: "OK",
          message: "Partner registered successfully",
          partner: newPartner,
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: 500,
      status: "FAILED", message: "Internal server error"
    });
  }
};


interface LoginRequestBody {
  email?: string;
  phone_number?: string;
  password: string;
}

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     tags:
 *      - Users
 *     summary: Authenticate user
 *     description: Returns a JWT token upon successful login
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             example: {  "email":"dickensjuma13@gmail.com", "phone_number":"704868023", "password": "pAssW0rd" }
 *     responses:
 *       200:
 *         description: Successful authentication
 */
const login = async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
  try {
    const { email, phone_number, password } = req.body;

    // Check if either email or phone_number is provided
    if (!email && !phone_number) {
      return res.status(400).json({ status: "FAILED", message: 'Email or phone number is required, e.g john@email.com or 07XXXXXXXXX' });
    }

    // check password
    if (!password) {
      return res.status(400).json({ status: "FAILED", message: 'password is required' });
    }


    // Construct the query based on defined parameters
    let whereClause: any = {};
    if (email) {
      whereClause.email = email;
    }
    if (phone_number) {
      whereClause.phone_number = phone_number.replace(/^0/, '')
    }
    console.log(whereClause)
    // Find user by email or phone number
    const user = await User.findOne({ where: whereClause });
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        code: 401,
        status: "FAILED",
        message: "Invalid credentials",
      });
    }

    // Find partner based on user's partner_id
    const partner = await Partner.findOne({
      where: {
        partner_id: user.partner_id + "",
      },
    });

    // Compare password with bcrypt
    const isSame = await bcrypt.compare(password, user.password);

    // Generate token if password is correct
    if (isSame) {
      const token = jwt.sign(
        {
          user_id: user.user_id,
          role: user.role,
          partner_id: user.partner_id,
          partner_name: partner.partner_name,
        },
        process.env.JWT_SECRET || "apple123",
        {
          expiresIn: 1 * 24 * 60 * 60 * 1000,
        }
      );

      // Generate cookie for the user
      res.cookie("jwt", token, {
        maxAge: 1 * 24 * 60 * 60,
        httpOnly: true,
      });

      // Remove sensitive information from the user object
      const sanitizedUser = {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        partner_id: user.partner_id,
        partner_name: partner.partner_name,
        is_active: user.is_active,
        is_verified: user.is_verified,
      };

      return res.status(201).json({
        result: {
          code: 201,
          status: "OK",
          message: "Login successful",
          token,
          role: user.role,
          partner_name: partner.partner_name,
          partner_id: partner.partner_id,
          countryCode: partner.country_code,
          currencyCode: partner.currency_code,
          user: sanitizedUser,
        },
      });
    } else {
      return res.status(401).json({
        status: "FAILED",
        code: 401,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    console.error("ERROR", error);
    return res.status(500).json({
      code: 500,
      status: "FAILED",
      message: "Internal server error",
      error: error.message,
    });
  }
};




/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Retrieve a list of users
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
 *     description: Retrieve a list of users from the database
 *     responses:
 *       200:
 *         description: Successful response
 */
const findAllUsers = async (req: any, res) => {
  const partner_id = req.query.partner_id;
  let filter = req.query?.filter
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const start_date = req.query.start_date;
  const end_date = req.query.end_date;

  try {
    if (!partner_id) {
      return res.status(400).json({ status: "FAILED", message: "Please provide a partner id" });
    }


    const offset = Math.max(0, (page - 1) * limit);

    let whereCondition: any = {
      partner_id: partner_id,
    };

    if (start_date && end_date) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      };
    }

    if (filter) {
      filter = filter?.trim().toLowerCase();
      // Add global filtering for user properties (modify this as needed)
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { name: { [Op.like]: `%${filter}%` } },
          { first_name: { [Op.like]: `%${filter}%` } },
          { last_name: { [Op.like]: `%${filter}%` } },
        ],
      };
    }

    // Now, you can use Sequelize to fetch users based on the whereCondition and pagination
    let users = await User.findAndCountAll({
      where: whereCondition,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      attributes: {
        exclude: ["password", "pin"],
      },
      include: [
        {
          model: Policy,
          attributes: ["beneficiary", "policy_type", "policy_type", "policy_status", "premium", "policy_paid_amount", "installment_type", "installment_order", "policy_start_date", "createdAt"],
          where: {
            partner_id: partner_id,
            policy_status: "paid"
          }
        },
      ],
    });


    // Send the response
    if (users && users.count > 0) {
      return res.status(200).json({
        result: { message: "Customers fetched successfully", items: users.rows, count: users.count },
      });
    }

    return res.status(404).json({ status: "FAILED", code: 404, message: "No customers found" });
  } catch (error) {
    console.error("ERROR", error);
    return res.status(500).json({
      code: 500,
      status: "FAILED", message: "Internal server error", error: error
    });
  }
};





/**
 * @swagger
 * /api/v1/users/{user_id}:
 *   get:
 *     tags:
 *       - Users
 *     description: Get User
 *     operationId: findUserByUserId
 *     summary: Get User
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
 *     responses:
 *       200:
 *         description: Information fetched succussfuly
 *       400:
 *         description: Invalid request
 */
const findUser = async (req: any, res: any) => {
  try {
    let user_id = req.params.user_id;
    let partner_id = req.query.partner_id;

    let user: any = await findUserByUserId(user_id, partner_id);

    if (!user || user.length === 0) {
      return res.status(404).json({ item: 0, message: "No user found" });
    }

    //GET NUMBER OF POLICIES FOR EACH USER AND ADD IT TO THE USER OBJECT RESPONSE
    let policies = await Policy.findAll({
      where: {
        user_id: user.user_id,
      },
      limit: 100,
    });
    user.dataValues.number_of_policies = policies.length;

    return res
      .status(200)
      .json({
        result: {
          code: 200,
          status: "OK", message: "Customer fetched successfully", item: user
        }
      });
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(500)
      .json({ status: "FAILED", message: "Internal server error", error: error });
  }
};


/**
 * @swagger
 * /api/v1/users/{phone_number}:
 *   get:
 *     tags:
 *       - Users
 *     description: Get User by phone number
 *     operationId: findUserByPhoneNumber
 *     summary: Get User by phone number
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: phone_number
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
const findUserByPhoneNumber = async (req: any, res: any) => {
  try {
    let partner_id = req.query.partner_id;
    let phone_number = req.params.phone_number;


    let user: any = await findUserByPhoneNumberFunc(phone_number, partner_id);

    if (!user || user.length === 0) {
      return res.status(404).json({ item: 0, message: "No user found" });
    }

    return res
      .status(200)
      .json({
        result: {
          code: 200,
          status: "OK", message: "Customer fetched successfully", item: user
        }
      });
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(500)
      .json({ status: "FAILED", message: "Internal server error", error: error });
  }
};



async function findUserByPhoneNumberFunc(phone_number: string, partner_id: number) {
  let user
  if (phone_number) {
    
    user = await User.findOne({
      where: {
        phone_number: phone_number,
        partner_id: partner_id,
      },
    });
  } else {
    return { status: "FAILED", message: "Please provide a phone number" }
  }
  //remove password from the response
  if (user) {
    delete user.dataValues.password;
    delete user.dataValues.pin;
  }

  return user;
}

/** @swagger
 * /api/v1/users/{user_id}:
 *   put:
 *     tags:
 *       - Users
 *     description: Update User
 *     operationId: updateUser
 *     summary: update User
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: { "first_name":"John", "last_name":"Doe", "email":"test@gmail.com", "password": "test123", "phone_number":"25475454656","national_id":278858583,  "dob": "1990-12-12", "gender": "M","marital_status": "single","addressline": "Nairobi", "nationality": "Kenyan","title": "Mr","pinzip": "00100", "driver_licence": "DRC123456789", "voter_id": "5322344"}
 *     responses:
 *       200:
 *         description: Information fetched succussfully
 *       400:
 *         description: Invalid request
 */

const updateUser = async (req: any, res: any) => {
  try {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      password,
      phone_number,
      national_id,
      dob,
      gender,
      marital_status,
      addressline,
      nationality,
      title,
      pinzip,
      driver_licence,
      voter_id,
    } = req.body;

    let user: any = findUserByUserId(req.params.user_id, req.query.partner_id);

    //check if user exists
    if (!user || user.length === 0) {
      return res.status(404).json({ message: "No Customer found" });
    }

    const data = {
      first_name,
      middle_name,
      last_name,
      name: first_name + " " + last_name,
      email,
      phone_number,
      national_id,
      password: await bcrypt.hash(password, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      dob,
      gender,
      marital_status,
      addressline,
      nationality,
      title,
      pinzip,
      partner_id: req.query.partner_id,
      driver_licence,
      voter_id,
    };
    //saving the user
    const updatedUser = await User.update(data, {
      where: {
        user_id: req.params.user_id,
      },
    });
    //send users details
    return res
      .status(201)
      .json({
        result: {
          code: 201,
          status: "OK", message: "User updated successfully", item: updatedUser
        },
      });
  } catch (error) {
    console.log(error);
    return res
      .status(409)
      .json({ status: "FAILED", message: "Details are not correct", error: error });
  }
};

// //deleting a user
const deleteUser = async (req: any, res: any) => {
  try {
    await User.destroy({
      where: {
        user_id: req.params.user_id,
      },
    });

    return res
      .status(201)
      .json({
        result: {
          code: 201,
          status: "OK", message: "Customer deleted successfully"
        }
      });
  } catch (error) {
    console.log("ERROR", error);
    return res.status(409).send("Details are not correct");
  }
};

/**
 * @swagger
 * /api/v1/users/partner:
 *   get:
 *     tags:
 *       - Partner
 *     description: Get Partner
 *     operationId: getPartner
 *     summary: Get Partner
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched succussfuly
 *       400:
 *         description: Invalid request
 */
const getPartner = async (req: any, res: any) => {
  try {
    let partner_id = req.query.partner_id;

    let partner: any = await Partner.findOne({
      where: {
        partner_id: partner_id + "",
      },
    });

    if (!partner || partner.length === 0) {
      return res.status(404).json({ item: 0, message: "No partner found" });
    }
    return res
      .status(200)
      .json({
        result: {
          code: 200,
          status: "OK", message: "partner fetched successfully", item: partner
        },
      });
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(500)
      .json({
        code: 500,
        status: "FAILED", message: "Internal server error", error: error
      });
  }
};

/**
 * @swagger
 * /api/v1/users/partners:
 *   get:
 *     tags:
 *       - Partner
 *     description: List Partners
 *     operationId: getAllPartners
 *     summary: Get All Partners
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Information fetched succussfuly
 *       400:
 *         description: Invalid request
 */
const listPartners = async (req: any, res: any) => {
  try {


    let partner: any = await Partner.findAll();
    if (parseInt(req.partner_id) == 4) {

      if (!partner || partner.length === 0) {
        return res.status(404).json({ message: "Sorry, No partner found" });
      }
      return res
        .status(200)
        .json({
          result: {
            code: 200,
            status: "OK", message: "All partners fetched successfully", items: partner
          },
        });
    } else {
      partner = await Partner.findAll({
        where: {
          partner_id: req.partner_id.toString()
        },
      });
    }


    if (!partner || partner.length === 0) {
      return res.status(404).json({ status: "FAILED", message: "Sorry, No partner found" });
    }
    return res
      .status(200)
      .json({
        result: {
          code: 200,
          status: "OK", message: "All partners fetched successfully", items: partner
        },
      });
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(500)
      .json({
        code: 500,
        status: "FAILED", message: "Internal server error", error: error
      });
  }
};

//partner switch
/**
 * @swagger
 * /api/v1/users/partnerSwitch:
 *   post:
 *     tags:
 *       - Partner
 *     description: Partner Switch
 *     operationId:  partnerSwitch
 *     summary: Partner Switch
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched succussfuly
 *       400:
 *         description: Invalid request
 */
const partnerSwitch = async (req: any, res: any) => {
  try {

    let partner = await Partner.findOne({
      where: {
        id: req.partner_id
      },
    });
    if (!partner || partner.length === 0) {
      return res.status(404).json({ item: 0, status: "FAILED", message: "Sorry, No partner found" });
    }

    let updatedUser = await User.update(
      { partner_id: req.query.partner_id },
      {
        where: {
          user_id: req.user_id
        }
      }
    );

    return res.status(201).json({
      code: 201,
      status: "OK", message: "Partner updated successfully"
    });
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(500)
      .json({
        code: 500,
        status: "FAILED", message: "Internal server error", error: error
      });
  }
};

/**
 * @swagger
 * /api/v1/users/group/signup:
 *   post:
 *     tags:
 *       - Users
 *     description: Bulk User Registration
 *     operationId: bulkUserRegistration
 *     summary: Bulk User Registration
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       content:
 *         multipart/form-data:   # Change content type to multipart/form-data
 *           schema:
 *             type: object
 *             properties:
 *               excel_file:   # Specify the parameter name for the Excel file
 *                 type: file  # Set the type as 'file' to indicate a file upload
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const bulkUserRegistration = async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "FAILED", message: "No file uploaded" });
    }

    const partner_id = req.query.partner_id;
    const excel_file = req.file;

    // Read the uploaded Excel file
    const workbook = XLSX.read(excel_file.buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert worksheet data to an array of objects
    const userDataArray = XLSX.utils.sheet_to_json(worksheet);

    // Process the userDataArray to create users
    const createdUsers = [];

    for (const userData of userDataArray) {
      // Convert keys to lowercase
      const lowerCaseUserData: any = Object.keys(userData).reduce(
        (acc, key) => {
          acc[key.toLowerCase()] = userData[key];
          return acc;
        },
        {}
      );


      const {
        first_name,
        middle_name,
        last_name,
        email,
        phone_number,
        national_id,
        dob,
        gender,
        marital_status,
        addressline,
        nationality,
        title,
        pinzip,
        driver_licence,
        voter_id,
      } = lowerCaseUserData;

      // Create a user object using the   data
      const user_data = {
        user_id: uuidv4(),
        membership_id: Math.floor(100000 + Math.random() * 900000),
        first_name,
        middle_name,
        last_name,
        name: first_name + " " + middle_name + " " + last_name,
        email,
        phone_number,
        national_id,
        password: await bcrypt.hash(phone_number.toString(), 10),
        createdAt: new Date(),
        updatedAt: new Date(),
        dob,
        gender,
        marital_status,
        addressline,
        nationality,
        title,
        pinzip,
        partner_id: partner_id,
        driver_licence,
        voter_id,
        pin: Math.floor(1000 + Math.random() * 9000),
        role: "user",
      };

      const createdUser = await createUserFunction(user_data) || {};
      createdUsers.push(createdUser);
    }


    return res
      .status(200)
      .json({
        code: 200,
        status: "OK", message: "Customers created successfully", items: createdUsers
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "FAILED", message: "Internal server error" });
  }
};

const createUserFunction = async (userData: any) => {
  try {
    const createdUser = await User.create(userData);

    //omit password, pin from the response
    delete createdUser.dataValues.password;
    delete createdUser.dataValues.pin;
    return createdUser;
  } catch (error) {
    throw error;
  }
};



/** @swagger
 * /api/v1/users/admin/signup:
 *   post:
 *     tags:
 *       - Users
 *     description: Register a admin
 *     operationId: registerAdmin
 *     summary: Register a admin
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: {  "username": "admin123", "email": "admin@example.com", "password": "securePassword", "role": "admin", "partner_id": "1" }
 *     responses:
 *       200:
 *         description: Information fetched succussfully
 *       400:
 *         description: Invalid request
 */
async function adminSignup(req: any, res: any) {
  try {
    const { username, email, password, role, partner_id } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Incomplete data provided' });
    }
    let user: any = await User.findAll({ where: { email: email }, limit: 100 });
    if (user && user.length > 0) {
      return res.status(409).json({ code: 409, message: "Sorry, Customer already exists with the same email" });
    }

    const admin = {
      name: username,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      partner_id,
    };

    let newAdmin = await User.create(admin);

    await sendWelcomeEmail(admin, "Admin Registration", welcomeTemplate)


    return res.status(200).json({
      code: 200,
      status: "OK", message: 'Admin registered successfully'
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILED", message: error.message
    })

  }

}


/**
 * @swagger
 * /api/v1/users/arr_member_registration:
 *   post:
 *     tags:
 *       - Users
 *     description: Arr Member Registration
 *     operationId: arrMemberRegistration
 *     summary: Arr Member Registration
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: partner_id
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: phoneNumber
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: arr_member_number
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: premium
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
async function arrMemberRegistration(req: any, res: any) {
  try {

    const { phoneNumber, premium, arr_member_number, transaction_date } = req.body
    let paymentData = {
      premium: premium,
      transaction_date: transaction_date,
      phone_number: phoneNumber,

    }

    let excistingUser = await db.users.findOne({
      where: {
        phone_number: phoneNumber.toString()
      }
    })
    let updatedPremium = reconciliation(excistingUser, paymentData)

    return res.status(200).json({
      code: 200,
      status: "OK", message: 'ARR Member registered successfully and premium updated', item: updatedPremium
    });
  } catch (error) {

    console.log(error);
    return res.status(500).json({ status: "FAILED", message: "Internal server error" });

  }
}




/**
 * @swagger
 * /api/v1/users/vehicle/{user_id}:
 *   get:
 *     tags:
 *       - Users
 *     description: Get User Vehicle
 *     operationId: findUserVehicle
 *     summary: Get User Vehicle
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
 *     responses:
 *       200:
 *         description: Information fetched succussfuly
 *       400:
 *         description: Invalid request
 */
async function findUserVehicle(req: any, res: any) {
  try {
    const { partner_id } = req.query
    const { user_id } = req.params


    const userVehicle = await db.vehicles.findAll({
      where: {
        partner_id: partner_id,
        user_id: user_id

      }
    })

    if (!userVehicle || userVehicle.length === 0) {
      return res.status(404).json({ item: 0, message: "Sorry, No vehicle found" });
    }

    return res.status(200).json({ status: "OK", message: "succesfully fetched user vehicles", items: userVehicle })
  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: "Internal server error" });
  }
}

/**
 * @swagger
 * /api/v1/users/update/vehicle/{user_id}:
 *   put:
 *     tags:
 *       - Users
 *     description: Update User Vehicle
 *     operationId: updateUserVehicle
 *     summary: Update User Vehicle
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: vehicle_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: user_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: { "vehicle_category": "SUV", "vehicle_make": "Toyota", "vehicle_model": "Land Cruiser", "vehicle_year": "2019", "vehicle_vin": "123456789", "vehicle_license_plate": "KCA 123T", "vehicle_registration_number": "123456789", "vehicle_insurance_expiration": "2021-12-12", "vehicle_purchase_price": "1000000", "vehicle_mileage": "100000" }
 *     responses:
 *       200:
 *         description: Information fetched succussfuly
 *       400:
 *         description: Invalid request
 */
async function updateUserVehicle(req: any, res: any) {
  try {
    const { vehicle_id } = req.query
    const { user_id } = req.params

    const {
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

    } = req.body

    const userVehicle = await db.vehicles.findAll({
      where: {
        vehicle_id: vehicle_id,
        user_id: user_id

      }
    })

    if (!userVehicle || userVehicle.length === 0) {
      return res.status(404).json({ status: "FAILED", item: 0, message: "Sorry, No vehicle found" });
    }

    const data = {
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
    }

    await db.vehicles.update(data, {
      where: {
        user_id: user_id,
        vehicle_id: vehicle_id
      },
    });

    return res.status(200).json({ status: "OK", message: "succesfully updated user vehicles" })


  } catch (error) {
    return res.status(500).json({ status: "FAILED", message: "Internal server error" });
  }

}



async function sendOTPEmail(subject, email, token) {
  try {
    const user = await db.users.findOne({ where: { email } });
    if (subject == 'forgot_password') {

      const subject = 'Password Reset';
      const message = `Use this token to reset your password: ${token}`;

      sendForgotPasswordEmail(user, subject, message)
    } else if (subject == 'send_otp') {
      const subject = 'OTP';
      const message = `Use this token to verify your account: ${token}`;

      sendOTPEmailFunc(user, subject, message)
    }

  } catch (error) {
    console.error('Error sending reset email:', error);
    throw new Error('Failed to send reset email.');
  }
}

async function sendOTPEmailFunc(user, subject, message) {
  try {
    const email = user.email;
    const emailHtml = `
    <h1> OTP </h1>
    <h3> Dear ${user.name} </h3>

    <p>${message}</p>
    <p> This token will expire in 5 minutes.</p>

    <p>Regards,</p>
    <p>Bluewave Team</p>


    `;
    await sendEmail(email, subject, emailHtml)
  }
  catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email.');
  }
}



// Placeholder for generating a unique token
function generateUniqueToken() {
  const token = Math.floor(100000 + Math.random() * 900000);

  return token

}

// Placeholder for storing the token in the database
async function storeTokenInDatabase(email: string, token: number) {
  const user = await db.users.findOne({ where: { email } });
  user.reset_token = token.toString();
  user.reset_token_timestamp = Date.now();
  await user.save();
  return user;
}

async function sendOTPPhone(subject, phone_number, token) {
  try {
    if (subject == 'send_otp') {

      const message = `Use this token to verify your account: ${token}`;

      SMSMessenger.sendSMS(3, phone_number, message)
    } else if (subject == 'forgot_password') {
      const user = await db.users.findOne({ where: { phone_number } });
      const message = `Use this
    token to reset your password: ${token}`;
      SMSMessenger.sendSMS(3, user.phone_number, message)
    }
  }
  catch (error) {
    console.error('Error sending reset OTP:', error);
    throw new Error('Failed to send reset OTP.');
  }
}


/**
* @swagger
* /api/v1/users/send_otp:
*   post:
*     tags:
*       - Users
*     description: Send OTP
*     summary: Send OTP
*     security:
*       - ApiKeyAuth: []
*     parameters:
*       - name: email
*         in: query
*         required: false
*         schema:
*           type: string
*       - name: phone_number
*         in: query
*         required: false
*         schema:
*           type: string
*     responses:
*       200:
*         description: Information fetched succussfuly
*       400:
*         description: Invalid request
*/
async function sendOTP(req: any, res: any) {
  try {

    const { email, phone_number } = req.query
    if (!email) {
      return res.status(400).json({ status: "FAILED", error: 'Email is required for sending OTP.' });
    }
    const otp = generateUniqueToken();

    await storeTokenInDatabase(email, otp);

    let subject = 'send_otp';

    if (email) {
      await sendOTPEmail(subject, email, otp);
    } else if (phone_number) {

      await sendOTPPhone(subject, phone_number, otp);
    } else {
      return res.status(400).json({ status: "FAILED", error: 'Email or phone number is required for password reset.' });
    }

    return res.status(200).json({ status: "OK", message: 'Password reset instructions sent to your email.' });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({ status: "FAILED", error: 'Internal server error.' });
  }
}



/**
* @swagger
* /api/v1/users/password/reset:
*   post:
*     tags:
*       - Users
*     description: forgot Password
*     summary: forgot Password
*     security:
*       - ApiKeyAuth: []
*     parameters:
*       - name: email
*         in: query
*         required: true
*         schema:
*           type: string
*       - name: phone_number
*         in: query
*         required: false
*         schema:
*           type: string
*     responses:
*       200:
*         description: Information fetched succussfuly
*       400:
*         description: Invalid request
*/
async function forgotPassword(req: any, res: any) {
  try {

    const { email, phone_number } = req.query
    if (!email) {
      return res.status(400).json({ status: "FAILED", error: 'Email is required for password reset.' });
    }
    const resetToken = generateUniqueToken();

    await storeTokenInDatabase(email, resetToken);


    if (email) {

      await sendOTPEmail('forgot_password', email, resetToken);
    } else if (phone_number) {

      await sendOTPPhone('forgot_password', phone_number, resetToken);
    } else {
      return res.status(400).json({ status: "FAILED", error: 'Email or phone number is required for password reset.' });
    }

    return res.status(200).json({ status: "OK", message: 'Password reset instructions sent to your email.' });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({ status: "FAILED", error: 'Internal server error.' });
  }
}

/**
 * @swagger
 * /api/v1/users/password/change:
 *   post:
 *     tags:
 *       - Users
 *     description: Change Password
 *     summary: Change Password
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: email
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: token
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: newPassword
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Information fetched succussfuly
 *       400:
 *         description: Invalid request
 */
async function changePassword(req: any, res: any) {
  try {
    const { email, token, newPassword } = req.query
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required.' });
    }

    const user = await db.users.findOne({ where: { email } });
    if (user.reset_token !== token) {
      return res.status(400).json({ status: "FAILED", error: 'Invalid reset token.' });
    }
    // Check if token has expired
    const tokenTimestamp = user.reset_token_timestamp;
    // after 24 hours token expires
    if ((Date.now() - tokenTimestamp) > 24 * 60 * 60 * 1000) {
      return res.status(400).json({ status: "FAILED", error: 'Expired reset token.' });
    }

    await db.users.update({ password: await bcrypt.hash(newPassword, 10) }, { where: { email } });

    return res.status(200).json({ status: "OK", message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error in changePassword:', error);
    return res.status(500).json({ status: "FAILED", error: 'Internal server error.' });
  }
}



module.exports = {
  adminSignup,
  signup,
  login,
  findAllUsers,
  findUser,
  getPartner,
  updateUser,
  deleteUser,
  partnerRegistration,
  partnerSwitch,
  bulkUserRegistration,
  listPartners,
  arrMemberRegistration,
  findUserVehicle,
  updateUserVehicle,
  forgotPassword,
  changePassword,
  findUserByPhoneNumber,
  sendOTP
};
