"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../models/db");
const aar_1 = require("../services/aar");
const welcome_1 = __importDefault(require("../services/emailTemplates/welcome"));
const emailService_1 = require("../services/emailService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv = require("dotenv").config();
const utils_1 = require("../services/utils");
const { Op } = require("sequelize");
const XLSX = require("xlsx");
const uuid_1 = require("uuid");
const sendSMS_1 = __importDefault(require("../services/sendSMS"));
// Assigning users to the variable User
const User = db_1.db.users;
const Partner = db_1.db.partners;
const Policy = db_1.db.policies;
const Log = db_1.db.logs;
function findUserByPhoneNumberFunc(user_id, partner_id) {
    return __awaiter(this, void 0, void 0, function* () {
        let user = yield User.findOne({
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
    });
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
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { first_name, middle_name, last_name, email, password, phone_number, partner_id, national_id, dob, gender, marital_status, addressline, nationality, title, pinzip, weight, height, driver_licence, voter_id, } = req.body;
        // Validate required fields
        const requiredFields = [first_name, last_name, email, password, phone_number, partner_id];
        if (requiredFields.some((field) => !field)) {
            return res.status(400).json({ code: 400, message: "Please provide all required fields" });
        }
        // Validate email format
        if (!(0, utils_1.isValidEmail)(email)) {
            return res.status(400).json({ code: 400, message: "Please enter a valid email" });
        }
        // Create user data object
        const userData = {
            membership_id: Math.floor(100000 + Math.random() * 900000),
            name: `${first_name} ${last_name}`,
            first_name,
            last_name,
            email,
            phone_number,
            national_id,
            password: yield bcrypt_1.default.hash(password, 10),
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
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Check if phone number or email already exists
        const phoneNumberExists = yield User.findOne({ where: { phone_number } });
        const emailExists = yield User.findOne({ where: { email } });
        if (phoneNumberExists) {
            return res.status(409).json({ status: "FAILED", code: 409, message: "Phone number already exists" });
        }
        if (emailExists) {
            return res.status(409).json({ status: "FAILED", code: 409, message: "Email already exists" });
        }
        // Create a new user
        const newUser = yield User.create(userData);
        if (newUser) {
            // Generate and set JWT token
            const token = jsonwebtoken_1.default.sign({ user_id: newUser.user_id, role: newUser.role }, process.env.JWT_SECRET || "apple123", {
                expiresIn: 1 * 24 * 60 * 60 * 1000,
            });
            res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
            return res.status(201).json({
                result: {
                    code: 200,
                    status: "OK",
                    message: "Customer registered successfully",
                    token,
                },
            });
        }
    }
    catch (error) {
        console.error("ERROR", error);
        return res.status(500).json({
            code: 500,
            status: "FAILED", message: "Internal server error", error: error.message
        });
    }
});
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
const partnerRegistration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { partner_name, partner_id, business_name, business_type, business_category, business_address, country, email, phone_number, password, } = req.body;
    try {
        //signup a partner
        if (!partner_name ||
            !partner_id ||
            !business_name ||
            !business_type ||
            !business_category ||
            !business_address ||
            !country ||
            !email ||
            !phone_number ||
            !password) {
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
            password: yield bcrypt_1.default.hash(password, 10),
        };
        //checking if the partner already exists using email and partner id
        let partner = yield Partner.findOne({ where: { email: email } });
        if (partner && partner.length > 0) {
            return res.status(409).json({ status: "FAILED", code: 409, message: "Partner already exists" });
        }
        //saving the partner
        const newPartner = yield Partner.create(partnerData);
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            code: 500,
            status: "FAILED", message: "Internal server error"
        });
    }
});
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
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, phone_number, password } = req.body;
        console.log("LOGIN", req.body);
        // Check if either email or phone_number is provided
        if (!email && !phone_number) {
            return res.status(400).json({ status: "FAILED", message: 'Email or phone number is required, e.g john@email.com or 07XXXXXXXXX' });
        }
        // check password
        if (!password) {
            return res.status(400).json({ status: "FAILED", message: 'password is required' });
        }
        // Construct the query based on defined parameters
        let whereClause = {};
        if (email) {
            whereClause.email = email;
        }
        if (phone_number) {
            whereClause.phone_number = phone_number.replace(/^0/, '');
        }
        // Find user by email or phone number
        const user = yield User.findOne({ where: whereClause });
        // Check if user exists
        if (!user) {
            return res.status(401).json({
                code: 401,
                status: "FAILED",
                message: "Invalid credentials",
            });
        }
        // Find partner based on user's partner_id
        const partner = yield Partner.findOne({
            where: {
                partner_id: user.partner_id + "",
            },
        });
        // Compare password with bcrypt
        const isSame = yield bcrypt_1.default.compare(password, user.password);
        // Generate token if password is correct
        if (isSame) {
            const token = jsonwebtoken_1.default.sign({
                user_id: user.user_id,
                role: user.role,
                partner_id: user.partner_id,
                partner_name: partner.partner_name,
            }, process.env.JWT_SECRET || "apple123", {
                expiresIn: 1 * 24 * 60 * 60 * 1000,
            });
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
        }
        else {
            return res.status(401).json({
                status: "FAILED",
                code: 401,
                message: "Invalid credentials",
            });
        }
    }
    catch (error) {
        console.error("ERROR", error);
        return res.status(500).json({
            code: 500,
            status: "FAILED",
            message: "Internal server error",
            error: error.message,
        });
    }
});
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
const findAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const partner_id = req.query.partner_id;
    let filter = (_a = req.query) === null || _a === void 0 ? void 0 : _a.filter;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    try {
        if (!partner_id) {
            return res.status(400).json({ status: "FAILED", message: "Please provide a partner id" });
        }
        const offset = Math.max(0, (page - 1) * limit);
        let whereCondition = {
            partner_id: partner_id,
        };
        if (start_date && end_date) {
            whereCondition.createdAt = {
                [Op.between]: [new Date(start_date), new Date(end_date)],
            };
        }
        if (filter) {
            filter = filter === null || filter === void 0 ? void 0 : filter.trim().toLowerCase();
            // Add global filtering for user properties (modify this as needed)
            whereCondition = Object.assign(Object.assign({}, whereCondition), { [Op.or]: [
                    { name: { [Op.like]: `%${filter}%` } },
                    { first_name: { [Op.like]: `%${filter}%` } },
                    { last_name: { [Op.like]: `%${filter}%` } },
                    // Add more fields as needed
                ] });
        }
        // Now, you can use Sequelize to fetch users based on the whereCondition and pagination
        let users = yield User.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: offset,
            order: [["createdAt", "DESC"]],
            attributes: {
                exclude: ["password", "pin"],
            },
        });
        // Send the response
        if (users && users.count > 0) {
            return res.status(200).json({
                result: { message: "Customers fetched successfully", items: users.rows, count: users.count },
            });
        }
        return res.status(404).json({ status: "FAILED", code: 404, message: "No customers found" });
    }
    catch (error) {
        console.error("ERROR", error);
        return res.status(500).json({
            code: 500,
            status: "FAILED", message: "Internal server error", error: error
        });
    }
});
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
const findUserByPhoneNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let user_id = req.params.user_id;
        let partner_id = req.query.partner_id;
        let user = yield findUserByPhoneNumberFunc(user_id, partner_id);
        console.log(user);
        if (!user || user.length === 0) {
            return res.status(404).json({ item: 0, message: "No user found" });
        }
        //GET NUMBER OF POLICIES FOR EACH USER AND ADD IT TO THE USER OBJECT RESPONSE
        let policies = yield Policy.findAll({
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
    }
    catch (error) {
        console.log("ERROR", error);
        return res
            .status(500)
            .json({ status: "FAILED", message: "Internal server error", error: error });
    }
});
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
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { first_name, middle_name, last_name, email, password, phone_number, national_id, dob, gender, marital_status, addressline, nationality, title, pinzip, weight, height, driver_licence, voter_id, } = req.body;
        let user = findUserByPhoneNumberFunc(req.params.user_id, req.query.partner_id);
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
            password: yield bcrypt_1.default.hash(password, 10),
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
        const updatedUser = yield User.update(data, {
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
    }
    catch (error) {
        console.log(error);
        return res
            .status(409)
            .json({ status: "FAILED", message: "Details are not correct", error: error });
    }
});
// //deleting a user
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield User.destroy({
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
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(409).send("Details are not correct");
    }
});
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
const getPartner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let partner_id = req.query.partner_id;
        let partner = yield Partner.findOne({
            where: {
                partner_id: partner_id + "",
            },
        });
        // console.log(partner);
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
    }
    catch (error) {
        console.log("ERROR", error);
        return res
            .status(500)
            .json({
            code: 500,
            status: "FAILED", message: "Internal server error", error: error
        });
    }
});
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
const listPartners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let partner = yield Partner.findAll();
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
        }
        else {
            partner = yield Partner.findAll({
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
    }
    catch (error) {
        console.log("ERROR", error);
        return res
            .status(500)
            .json({
            code: 500,
            status: "FAILED", message: "Internal server error", error: error
        });
    }
});
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
const partnerSwitch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let partner = yield Partner.findOne({
            where: {
                id: req.partner_id
            },
        });
        console.log("PARTNER", partner);
        if (!partner || partner.length === 0) {
            return res.status(404).json({ item: 0, status: "FAILED", message: "Sorry, No partner found" });
        }
        let updatedUser = yield User.update({ partner_id: req.query.partner_id }, {
            where: {
                user_id: req.user_id
            }
        });
        console.log("updated user", updatedUser);
        return res.status(201).json({
            code: 201,
            status: "OK", message: "Partner updated successfully"
        });
    }
    catch (error) {
        console.log("ERROR", error);
        return res
            .status(500)
            .json({
            code: 500,
            status: "FAILED", message: "Internal server error", error: error
        });
    }
});
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
const bulkUserRegistration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            console.log("USER DATA", userData);
            // Convert keys to lowercase
            const lowerCaseUserData = Object.keys(userData).reduce((acc, key) => {
                acc[key.toLowerCase()] = userData[key];
                return acc;
            }, {});
            console.log("USER DATA", lowerCaseUserData);
            const { first_name, middle_name, last_name, email, phone_number, national_id, dob, gender, marital_status, addressline, nationality, title, pinzip, weight, height, driver_licence, voter_id, } = lowerCaseUserData;
            // Create a user object using the   data
            const user_data = {
                user_id: (0, uuid_1.v4)(),
                membership_id: Math.floor(100000 + Math.random() * 900000),
                first_name,
                middle_name,
                last_name,
                name: first_name + " " + middle_name + " " + last_name,
                email,
                phone_number,
                national_id,
                password: yield bcrypt_1.default.hash(phone_number.toString(), 10),
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
            const createdUser = (yield createUserFunction(user_data)) || {};
            createdUsers.push(createdUser);
        }
        return res
            .status(200)
            .json({
            code: 200,
            status: "OK", message: "Customers created successfully", items: createdUsers
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ status: "FAILED", message: "Internal server error" });
    }
});
const createUserFunction = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const createdUser = yield User.create(userData);
        //omit password, pin from the response
        delete createdUser.dataValues.password;
        delete createdUser.dataValues.pin;
        return createdUser;
    }
    catch (error) {
        throw error;
    }
});
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
function adminSignup(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { username, email, password, role, partner_id } = req.body;
            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Incomplete data provided' });
            }
            let user = yield User.findAll({ where: { email: email }, limit: 100 });
            if (user && user.length > 0) {
                return res.status(409).json({ code: 409, message: "Sorry, Customer already exists with the same email" });
            }
            const admin = {
                name: username,
                email,
                password: yield bcrypt_1.default.hash(password, 10),
                role,
                partner_id,
            };
            let newAdmin = yield User.create(admin);
            yield (0, emailService_1.sendWelcomeEmail)(admin, "Admin Registration", welcome_1.default);
            console.log("NEW ADMIN", newAdmin);
            return res.status(200).json({
                code: 200,
                status: "OK", message: 'Admin registered successfully'
            });
        }
        catch (error) {
            return res.status(500).json({
                status: "FAILED", message: error.message
            });
        }
    });
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
function arrMemberRegistration(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { phoneNumber, premium, arr_member_number, transaction_date } = req.body;
            let paymentData = {
                premium: premium,
                transaction_date: transaction_date,
                phone_number: phoneNumber,
            };
            let excistingUser = yield db_1.db.users.findOne({
                where: {
                    phone_number: phoneNumber.toString()
                }
            });
            let updatedPremium = (0, aar_1.reconciliation)(excistingUser, paymentData);
            return res.status(200).json({
                code: 200,
                status: "OK", message: 'ARR Member registered successfully and premium updated', item: updatedPremium
            });
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({ status: "FAILED", message: "Internal server error" });
        }
    });
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
function findUserVehicle(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { partner_id } = req.query;
            const { user_id } = req.params;
            console.log(" req.query", req.query);
            console.log("USER ID", user_id);
            console.log("PARTNER ID", partner_id);
            const userVehicle = yield db_1.db.vehicles.findAll({
                where: {
                    partner_id: partner_id,
                    user_id: user_id
                }
            });
            if (!userVehicle || userVehicle.length === 0) {
                return res.status(404).json({ item: 0, message: "Sorry, No vehicle found" });
            }
            return res.status(200).json({ status: "OK", message: "succesfully fetched user vehicles", items: userVehicle });
        }
        catch (error) {
            return res.status(500).json({ status: "FAILED", message: "Internal server error" });
        }
    });
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
function updateUserVehicle(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { vehicle_id } = req.query;
            const { user_id } = req.params;
            const { vehicle_category, vehicle_make, vehicle_model, vehicle_year, vehicle_vin, vehicle_license_plate, vehicle_registration_number, vehicle_insurance_expiration, vehicle_purchase_price, vehicle_mileage } = req.body;
            const userVehicle = yield db_1.db.vehicles.findAll({
                where: {
                    vehicle_id: vehicle_id,
                    user_id: user_id
                }
            });
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
            };
            yield db_1.db.vehicles.update(data, {
                where: {
                    user_id: user_id,
                    vehicle_id: vehicle_id
                },
            });
            return res.status(200).json({ status: "OK", message: "succesfully updated user vehicles" });
        }
        catch (error) {
            return res.status(500).json({ status: "FAILED", message: "Internal server error" });
        }
    });
}
function sendResetEmail(email, token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield db_1.db.users.findOne({ where: { email } });
            const subject = 'Password Reset';
            const message = `Use this token to reset your password: ${token}`;
            (0, emailService_1.sendForgotPasswordEmail)(user, subject, message);
            console.log(`Reset email sent to ${email} with token: ${token}`);
        }
        catch (error) {
            console.error('Error sending reset email:', error);
            throw new Error('Failed to send reset email.');
        }
    });
}
// Placeholder for generating a unique token
function generateUniqueToken() {
    const token = Math.floor(100000 + Math.random() * 900000);
    return token;
}
// Placeholder for storing the token in the database
function storeTokenInDatabase(email, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield db_1.db.users.findOne({ where: { email } });
        user.reset_token = token.toString();
        user.reset_token_timestamp = Date.now();
        yield user.save();
        return user;
    });
}
function sendResetOTP(phone_number, token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield db_1.db.users.findOne({ where: { phone_number } });
            const message = `Use this
    token to reset your password: ${token}`;
            sendSMS_1.default.sendSMS(3, user.phone_number, message);
            console.log(`Reset OTP sent to ${phone_number} with token: ${token}`);
        }
        catch (error) {
            console.error('Error sending reset OTP:', error);
            throw new Error('Failed to send reset OTP.');
        }
    });
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
function forgotPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, phone_number } = req.query;
            if (!email) {
                return res.status(400).json({ status: "FAILED", error: 'Email is required for password reset.' });
            }
            const resetToken = generateUniqueToken();
            yield storeTokenInDatabase(email, resetToken);
            if (email) {
                yield sendResetEmail(email, resetToken);
            }
            else if (phone_number) {
                yield sendResetOTP(phone_number, resetToken);
            }
            else {
                return res.status(400).json({ status: "FAILED", error: 'Email or phone number is required for password reset.' });
            }
            return res.status(200).json({ status: "OK", message: 'Password reset instructions sent to your email.' });
        }
        catch (error) {
            console.error('Error in forgotPassword:', error);
            return res.status(500).json({ status: "FAILED", error: 'Internal server error.' });
        }
    });
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
function changePassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1. Validate Input
            const { email, token, newPassword } = req.query;
            if (!email || !token || !newPassword) {
                return res.status(400).json({ error: 'Email, token, and new password are required.' });
            }
            // 2. Verify Token
            const user = yield db_1.db.users.findOne({ where: { email } });
            console.log("USER", user.reset_token);
            if (user.reset_token !== token) {
                return res.status(400).json({ status: "FAILED", error: 'Invalid reset token.' });
            }
            // Check if token has expired
            const tokenTimestamp = user.reset_token_timestamp;
            // after 24 hours token expires
            if ((Date.now() - tokenTimestamp) > 24 * 60 * 60 * 1000) {
                return res.status(400).json({ status: "FAILED", error: 'Expired reset token.' });
            }
            // 3. Update Password
            yield db_1.db.users.update({ password: yield bcrypt_1.default.hash(newPassword, 10) }, { where: { email } });
            return res.status(200).json({ status: "OK", message: 'Password updated successfully.' });
        }
        catch (error) {
            console.error('Error in changePassword:', error);
            return res.status(500).json({ status: "FAILED", error: 'Internal server error.' });
        }
    });
}
module.exports = {
    adminSignup,
    signup,
    login,
    findAllUsers,
    findUserByPhoneNumber,
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
    changePassword
};
