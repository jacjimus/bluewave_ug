const bcrypt = require("bcrypt");
import { db } from "../models/db";
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
import {
  getRandomInt,
  isValidEmail,
  globalSearch

} from "../services/utils";
const { Op } = require("sequelize");
const XLSX = require("xlsx");
import { v4 as uuidv4 } from "uuid";

// Assigning users to the variable User
const User = db.users;
const Partner = db.partners;
const Policy = db.policies;
const Log = db.logs;

async function findUserByPhoneNumberFunc(user_id: string, partner_id: number) {
  let user = await User.findOne({
    where: {
      user_id: user_id,
      partner_id: partner_id,
    },
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
 *             example: { "first_name":"John", "middle_name":"White",  "last_name":"Doe", "email":"test@gmail.com", "password": "test123", "phone_number":"0754546568","national_id":"27885858",  "dob": "1990-12-12", "gender": "M","marital_status": "single","addressline": "Nairobi", "nationality": "Kenyan","title": "Mr","pinzip": "00100","weight": 70,"height": 170, "driver_licence": "DRC123456789", "voter_id": "5322344", "partner_id": "1"}
 *     responses:
 *       200:
 *         description: Information fetched succussfully
 *       400:
 *         description: Invalid request
 */
const signup = async (req: any, res: any) => {
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
      weight,
      height,
      driver_licence,
      voter_id,
    } = req.body;

    let partner_id = req.query.partner_id || req.body.partner_id;

    if (
      !first_name ||
      !last_name ||
      !email ||
      !password ||
      !phone_number ||
      !partner_id
    ) {
      return res.status(400).json({ code: 400, message: "Please provide all fields" });
    }

    // if (!isValidKenyanPhoneNumber(phone_number)) {
    //   return res.status(400).json({ message: "Please enter a valid phone number" });
    // }
    if (!isValidEmail(email)) {
      return res.status(400).json({ code: 400, message: "Please enter a valid email" });
    }
    let nationalId = national_id.toString();
    // if (nationalId.length !== 8) {
    //   return res.status(400).json({ message: "National ID should be 8 digits" });
    // }
    //create a user interface
    interface Person {

      membership_id: number;
      name: string;
      first_name: string;
      middle_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      national_id: string;
      password: string;
      createdAt: Date;
      updatedAt: Date;
      pin: number;
      role: string;
      dob: Date;
      gender: string;
      marital_status: string;
      addressline: string;
      nationality: string;
      title: string;
      pinzip: string;
      weight: number;
      height: number;
      partner_id: number;
      driver_licence: string;
      voter_id: string;
    }

    // Generate a random integer for the primary key
    //let randomId = getRandomInt(10000000, 99999999);

    // let userIDcheck: any = await User.findAll({ where: { id: randomId } });
    // if (userIDcheck.length > 0) {
    //   randomId = getRandomInt(10000000, 99999999);
    // }

    const userData: Person = {

      membership_id: Math.floor(100000 + Math.random() * 900000),
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
      pin: Math.floor(1000 + Math.random() * 9000),
      role: "user",
      dob,
      gender,
      marital_status,
      addressline,
      pinzip,
      weight,
      height,
      nationality,
      title,
      partner_id,
      driver_licence,
      voter_id,
    };

    userData.name = first_name + " " + last_name;

    //checking if the user already exists
    let user: any = await User.findAll({ where: { email: email } });

    //check if national id exists
    // let nationalIdExists: any = await User.findAll({
    //   where: { national_id: national_id },
    // });
    //check if phone number exists
    let phoneNumberExists: any = await User.findAll({
      where: { phone_number: phone_number },
    });
    // if (nationalIdExists && nationalIdExists.length > 0) {
    //   return res.status(409).json({code: 200, message: "National ID already exists" });
    // }
    if (phoneNumberExists && phoneNumberExists.length > 0) {
      return res.status(409).json({ code: 409, message: "Sorry, Phone number already exists" });
    }

    if (user && user.length > 0) {
      return res.status(409).json({ code: 409, message: "Sorry, Customer already exists" });
    }

    console.log("USER DATA", userData);

    //saving the user
    const newUser: any = await User.create(userData);
    req.session.user = newUser;
    // set cookie with the token generated
    if (newUser) {
      let token = jwt.sign(
        { user_id: newUser.user_id, role: newUser.role },
        process.env.JWT_SECRET || "apple123",
        {
          expiresIn: 1 * 24 * 60 * 60 * 1000,
        }
      );

      res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
      console.log(token);
      //send users details

      await Log.create({
        log_id: uuidv4(),
        timestamp: new Date(),
        message: 'User registered successfully',
        level: 'info',
        user: newUser.user_id,
        partner_id: newUser.partner_id,
      });

      return res
        .status(201)
        .json({
          result: {
            code: 200,
            message: "Customer registered successfully",
            token: token
          },
        });
    }
  } catch (error) {
    console.log("ERROR", error);
    return res.status(409).send({ code: 409, message: "Details are not correct" });
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
      return res.status(409).json({ code: 409, message: "Partner already exists" });
    }

    //saving the partner
    const newPartner: any = await Partner.create(partnerData);

    // set cookie with the token generated
    if (newPartner) {
      await Log.create({
        log_id: uuidv4(),
        timestamp: new Date(),
        message: 'Partner registered successfully',
        level: 'info',
        user: newPartner.user_id,
        partner_id: newPartner.partner_id,
      });
      return res
        .status(201)
        .json({
          code: 201,
          message: "Partner registered successfully",
          partner: newPartner,
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ code: 500, message: "Internal server error" });
  }
};

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
 *             example: {  "email":"dickensjuma13@gmail.com", "password": "pAssW0rd@" }
 *     responses:
 *       200:
 *         description: Successful authentication
 */
const login = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ code: 400, message: "Please provide an email and password" });
    }

    //find a user by their email
    const user = await User.findOne({
      where: {
        email: email,
      },
    });

    const partner = await Partner.findOne({
      where: {
        partner_id: user.partner_id + ""
      },
    });

    console.log("PARTNER", partner);
    //console.log("USER",user)
    console.log(!user, user.length == 0);
    if (!user || user.length === 0) {
      return res.status(401).json({ code: 401, message: "Invalid credentials" });
    }

    //if user email is found, compare password with bcrypt
    if (user) {
      const isSame = await bcrypt.compare(password, user.password);
      //generate token with the user's id and the secretKey in the env file
      if (isSame) {
        let token = jwt.sign(
          { user_id: user.user_id, role: user.role, partner_id: user.partner_id, partner_name: partner.partner_name },
          process.env.JWT_SECRET || "apple123",
          {
            expiresIn: 1 * 24 * 60 * 60 * 1000,
          }
        );

        //go ahead and generate a cookie for the user
        res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
        console.log(token);
        //remove password from the user object
        user.password = undefined;

        await Log.create({
          log_id: uuidv4(),
          timestamp: new Date(),
          message: 'User fetched successfully',
          level: 'info',
          user: user.user_id,
          partner_id: user.partner_id,
        });
        return res
          .status(201)
          .json({
            result: {
              code: 201,
              message: "login successfully",
              token: token,
              partner_name: partner.partner_name,
              partner_id: partner.partner_id,
              countryCode: partner.country_code,
                currencyCode: partner.currency_code,
              user: {
                user_id: user.user_id,
                full_name: user.name,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone_number: user.phone_number,
                partner_id: user.partner_id,
                partner_name: partner.partner_name,
                is_active: user.is_active,
                is_verified: user.is_verified,
                countryCode: partner.country_code,
                currencyCode: partner.currency_code,
              }
            },
          });
      }
    }
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(400)
      .json({ code: 400, message: "Invalid credentials", error: error });
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
const findUserByPhoneNumbers = async (req: any, res: any) => {
  let partner_id = req.query.partner_id;
  console.log("PARTNER ID", partner_id);
  let filter = req.query.filter || "";
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let status = {
    status: 200,
    result: {},
  };

  try {
    if (!partner_id) {
      return res.status(400).json({ message: "Please provide a partner id" });
    }

    // Calculate the offset for pagination
    const offset = (page - 1) * limit;

    let users = await User.findAndCountAll({
      where: {
        partner_id: partner_id,
      },
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    // Filter by start_date and end_date if provided
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      users.rows = users.rows.filter((user: any) => {
        const userDate = new Date(user.createdAt);
        return userDate >= startDate && userDate <= endDate;
      });
    }

    // Filter by search term if provided
    if (filter) {
      users.rows = globalSearch(users.rows, filter);
    }

    // Count the number of users
    const count = users.count;

    // Remove password and other sensitive information from the response
    users.rows.forEach((user: any) => {
      delete user.dataValues.password;
      delete user.dataValues.pin;
    }
    );
    // GET NUMBER OF POLICIES FOR EACH USER AND ADD IT TO THE USER OBJECT RESPONSE
    for (let i = 0; i < users.rows.length; i++) {
      let user = users.rows[i];
      let policies = await Policy.findAll({
        where: {
          user_id: user.user_id,
        },
      });
      user.dataValues.number_of_policies = policies.length;
    }

    if (users.rows && users.rows.length > 0) {
      status.result = users.rows;
      return res.status(200).json({
        result: { message: "Customers fetched successfully", items: users.rows, count },
      });
    }
  
    // await Log.create({
    //   log_id: uuidv4(),
    //   timestamp: new Date(),
    //   message: 'get users',
    //   level: 'info',
    //   user: req.params.user_id,
    //   partner_id: req.query.partner_id,
    // });
    return res.status(404).json({ code: 404, message: "Sorry, No Customer found" });
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(500)
      .json({ code: 500, message: "Internal server error", error: error });
  }
}



/**
 * @swagger
 * /api/v1/users/{user_id}:
 *   get:
 *     tags:
 *       - Users
 *     description: Get User
 *     operationId: findUserByPhoneNumber
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
const findUserByPhoneNumber = async (req: any, res: any) => {
  try {
    let user_id = req.params.user_id;
    let partner_id = req.query.partner_id;

    let user: any = await findUserByPhoneNumberFunc(user_id, partner_id);
    console.log(user);

    if (!user || user.length === 0) {
      return res.status(404).json({ item: 0, message: "No user found" });
    }

    //GET NUMBER OF POLICIES FOR EACH USER AND ADD IT TO THE USER OBJECT RESPONSE
    let policies = await Policy.findAll({
      where: {
        user_id: user.user_id,
      },
    });
    user.dataValues.number_of_policies = policies.length;

    await Log.create({
      log_id: uuidv4(),
      timestamp: new Date(),
      message: 'User fetched successfully',
      level: 'info',
      user: user.user_id,
      partner_id: partner_id,
    });

    return res
      .status(200)
      .json({ result: { code: 200, message: "Customer fetched successfully", item: user } });
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error });
  }
};

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
 *             example: { "first_name":"John", "last_name":"Doe", "email":"test@gmail.com", "password": "test123", "phone_number":"25475454656","national_id":278858583,  "dob": "1990-12-12", "gender": "M","marital_status": "single","addressline": "Nairobi", "nationality": "Kenyan","title": "Mr","pinzip": "00100","weight": 70,"height": 170,  "driver_licence": "DRC123456789", "voter_id": "5322344"}
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
      weight,
      height,
      driver_licence,
      voter_id,
    } = req.body;

    let user: any = findUserByPhoneNumberFunc(req.params.user_id, req.query.partner_id);

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
      weight,
      height,
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
        result: { code: 201, message: "User updated successfully", item: updatedUser },
      });
  } catch (error) {
    console.log(error);
    return res
      .status(409)
      .json({ message: "Details are not correct", error: error });
  }
};

// //deleting a user
const deleteUser = async (req: any, res) => {
  try {
    await User.destroy({
      where: {
        user_id: req.params.user_id,
      },
    });

    await Log.create({
      log_id: uuidv4(),
      timestamp: new Date(),
      message: 'User deleted successfully',
      level: 'info',
      user: req.params.user_id,
      partner_id: req.query.partner_id,
    });
    //send users details
    return res
      .status(201)
      .json({ result: { code: 201, message: "Customer deleted successfully" } });
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
    console.log(partner);

    if (!partner || partner.length === 0) {
      return res.status(404).json({ item: 0, message: "No partner found" });
    }
    return res
      .status(200)
      .json({
        result: { code: 200, message: "partner fetched successfully", item: partner },
      });
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(500)
      .json({ code: 500, message: "Internal server error", error: error });
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
    console.log(partner);

    if (!partner || partner.length === 0) {
      return res.status(404).json({ item: 0, message: "Sorry, No partner found" });
    }
    return res
      .status(200)
      .json({
        result: { code: 200, message: "All partners fetched successfully", items: partner },
      });
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(500)
      .json({ code: 500, message: "Internal server error", error: error });
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
    let partner_id_to_update = req.query.partner_id;
    let user_id = req.user_id;

    let partner_id = req.partner_id;

    let partner = await Partner.findOne({
      where: {
        id: partner_id
      },
    });
    console.log("PARTNER", partner);
    if (!partner || partner.length === 0) {
      return res.status(404).json({ item: 0, message: "Sorry, No partner found" });
    }
    //update the partner id
    let updatedUser = await User.update(
      { partner_id: partner_id_to_update },
      { where: { user_id: user_id } }
    );
    //saving the user

    //send users details
    console.log("updated user", updatedUser);
    return res.status(201).json({ code: 201, message: "Partner updated successfully" });
  } catch (error) {
    console.log("ERROR", error);
    return res
      .status(500)
      .json({ code: 500, message: "Internal server error", error: error });
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
      return res.status(400).json({ message: "No file uploaded" });
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
      console.log("USER DATA", userData);
      // Convert keys to lowercase
      const lowerCaseUserData: any = Object.keys(userData).reduce(
        (acc, key) => {
          acc[key.toLowerCase()] = userData[key];
          return acc;
        },
        {}
      );

      console.log("USER DATA", lowerCaseUserData);

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
        weight,
        height,
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
        weight,
        height,
        partner_id: partner_id,
        driver_licence,
        voter_id,
        pin: Math.floor(1000 + Math.random() * 9000),
        role: "user",
      };

      // Use your preferred method to create users (e.g., Sequelize's create())
      const createdUser = await createUserFunction(user_data); // Replace with your create user function
      createdUsers.push(createdUser);
    }


    return res
      .status(200)
      .json({ code: 200, message: "Customers created successfully", items: createdUsers });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
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

  const { username, email, password, role, partner_id } = req.body;

  // Perform validation on the data
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Incomplete data provided' });
  }
  let user: any = await User.findAll({ where: { email: email } });
  if (user && user.length > 0) {
    return res.status(409).json({ code: 409, message: "Sorry, Customer already exists with the same email" });
  }

  // Logic for admin signup goes here
  // You can store the admin data in a database, hash the password, etc.
  const admin = {
    name: username,
    email,
    password: await bcrypt.hash(password, 10),
    role,
    partner_id,
  };

  //save admin to database
  let newAdmin = await User.create(admin);

  console.log("NEW ADMIN", newAdmin);
  // Return a success response
  return res.status(200).json({ code: 200, message: 'Admin registered successfully' });

}



module.exports = {
  adminSignup,
  signup,
  login,
  findUserByPhoneNumbers,
  findUserByPhoneNumber,
  getPartner,
  updateUser,
  deleteUser,
  partnerRegistration,
  partnerSwitch,
  bulkUserRegistration,
  listPartners
};
