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
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt");
const db_1 = require("../models/db");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
const utils_1 = require("../services/utils");
const { Op } = require("sequelize");
const XLSX = require("xlsx");
const uuid_1 = require("uuid");
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
        const { first_name, middle_name, last_name, email, password, phone_number, national_id, dob, gender, marital_status, addressline, nationality, title, pinzip, weight, height, driver_licence, voter_id, } = req.body;
        let partner_id = req.query.partner_id || req.body.partner_id;
        if (!first_name ||
            !last_name ||
            !email ||
            !password ||
            !phone_number ||
            !partner_id) {
            return res.status(400).json({ code: 400, message: "Please provide all fields" });
        }
        // if (!isValidKenyanPhoneNumber(phone_number)) {
        //   return res.status(400).json({ message: "Please enter a valid phone number" });
        // }
        if (!(0, utils_1.isValidEmail)(email)) {
            return res.status(400).json({ code: 400, message: "Please enter a valid email" });
        }
        let nationalId = national_id.toString();
        // Generate a random integer for the primary key
        //let randomId = getRandomInt(10000000, 99999999);
        // let userIDcheck: any = await User.findAll({ where: { id: randomId } });
        // if (userIDcheck.length > 0) {
        //   randomId = getRandomInt(10000000, 99999999);
        // }
        const userData = {
            membership_id: Math.floor(100000 + Math.random() * 900000),
            first_name,
            middle_name,
            last_name,
            name: first_name + " " + last_name,
            email,
            phone_number,
            national_id,
            password: yield bcrypt.hash(password, 10),
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
        let user = yield User.findAll({ where: { email: email } });
        //check if national id exists
        // let nationalIdExists: any = await User.findAll({
        //   where: { national_id: national_id },
        // });
        //check if phone number exists
        let phoneNumberExists = yield User.findAll({
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
        const newUser = yield User.create(userData);
        // set cookie with the token generated
        if (newUser) {
            let token = jwt.sign({ user_id: newUser.user_id, role: newUser.role }, process.env.JWT_SECRET || "apple123", {
                expiresIn: 1 * 24 * 60 * 60 * 1000,
            });
            res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
            console.log(token);
            //send users details
            yield Log.create({
                log_id: (0, uuid_1.v4)(),
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
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(409).send({ code: 409, message: "Details are not correct" });
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
            password: yield bcrypt.hash(password, 10),
        };
        //checking if the partner already exists using email and partner id
        let partner = yield Partner.findOne({ where: { email: email } });
        if (partner && partner.length > 0) {
            return res.status(409).json({ code: 409, message: "Partner already exists" });
        }
        //saving the partner
        const newPartner = yield Partner.create(partnerData);
        // set cookie with the token generated
        if (newPartner) {
            yield Log.create({
                log_id: (0, uuid_1.v4)(),
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, message: "Internal server error" });
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
 *             example: {  "email":"dickensjuma13@gmail.com", "password": "pAssW0rd@" }
 *     responses:
 *       200:
 *         description: Successful authentication
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ code: 400, message: "Please provide an email and password" });
        }
        //find a user by their email
        const user = yield User.findOne({
            where: {
                email: email,
            },
        });
        const partner = yield Partner.findOne({
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
            const isSame = yield bcrypt.compare(password, user.password);
            //generate token with the user's id and the secretKey in the env file
            if (isSame) {
                let token = jwt.sign({ user_id: user.user_id, role: user.role, partner_id: user.partner_id, partner_name: partner.partner_name }, process.env.JWT_SECRET || "apple123", {
                    expiresIn: 1 * 24 * 60 * 60 * 1000,
                });
                //save partner id in the request
                let admin = {
                    partner_id: user.partner_id,
                    role: user.role == 'superadmin' ? 11 : 22
                };
                //go ahead and generate a cookie for the user
                res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
                // store user object in the session
                res.cookie("admin", admin, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
                console.log(token);
                //remove password from the user object
                user.password = undefined;
                yield Log.create({
                    log_id: (0, uuid_1.v4)(),
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
    }
    catch (error) {
        console.log("ERROR", error);
        return res
            .status(400)
            .json({ code: 400, message: "Invalid credentials", error: error });
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
    const partner_id = req.query.partner_id;
    const filter = req.query.filter;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    try {
        if (!partner_id) {
            return res.status(400).json({ message: "Please provide a partner id" });
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
        const usersWithPolicyCount = yield Promise.all(users.rows.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            const policies = yield db_1.db.policies.findAndCountAll({
                where: {
                    user_id: user.user_id,
                },
                limit: 6,
            });
            user.dataValues.number_of_policies = policies.count;
            return user;
        })));
        // Send the response
        if (users && users.count > 0) {
            return res.status(200).json({
                result: { message: "Customers fetched successfully", items: users.rows, count: users.count },
            });
        }
        return res.status(404).json({ code: 404, message: "No customers found" });
    }
    catch (error) {
        console.error("ERROR", error);
        return res.status(500).json({ code: 500, message: "Internal server error", error: error });
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
        });
        user.dataValues.number_of_policies = policies.length;
        yield Log.create({
            log_id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            message: 'User fetched successfully',
            level: 'info',
            user: user.user_id,
            partner_id: partner_id,
        });
        return res
            .status(200)
            .json({ result: { code: 200, message: "Customer fetched successfully", item: user } });
    }
    catch (error) {
        console.log("ERROR", error);
        return res
            .status(500)
            .json({ message: "Internal server error", error: error });
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
            password: yield bcrypt.hash(password, 10),
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
            result: { code: 201, message: "User updated successfully", item: updatedUser },
        });
    }
    catch (error) {
        console.log(error);
        return res
            .status(409)
            .json({ message: "Details are not correct", error: error });
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
        yield Log.create({
            log_id: (0, uuid_1.v4)(),
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
        console.log(partner);
        if (!partner || partner.length === 0) {
            return res.status(404).json({ item: 0, message: "No partner found" });
        }
        return res
            .status(200)
            .json({
            result: { code: 200, message: "partner fetched successfully", item: partner },
        });
    }
    catch (error) {
        console.log("ERROR", error);
        return res
            .status(500)
            .json({ code: 500, message: "Internal server error", error: error });
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
        // get admin object from cookies
        const admin = req.partner_id;
        let partner = yield Partner.findAll();
        if (parseInt(req.partner_id) == 4) {
            if (!partner || partner.length === 0) {
                return res.status(404).json({ message: "Sorry, No partner found" });
            }
            return res
                .status(200)
                .json({
                result: { code: 200, message: "All partners fetched successfully", items: partner },
            });
        }
        else {
            partner = yield Partner.findAll({
                where: {
                    partner_id: admin.toString()
                },
            });
        }
        if (!partner || partner.length === 0) {
            return res.status(404).json({ item: 0, message: "Sorry, No partner found" });
        }
        return res
            .status(200)
            .json({
            result: { code: 200, message: "All partners fetched successfully", items: partner },
        });
    }
    catch (error) {
        console.log("ERROR", error);
        return res
            .status(500)
            .json({ code: 500, message: "Internal server error", error: error });
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
        let partner_id_to_update = req.query.partner_id;
        let user_id = req.user_id;
        let partner_id = req.partner_id;
        let partner = yield Partner.findOne({
            where: {
                id: partner_id
            },
        });
        console.log("PARTNER", partner);
        if (!partner || partner.length === 0) {
            return res.status(404).json({ item: 0, message: "Sorry, No partner found" });
        }
        //update the partner id
        let updatedUser = yield User.update({ partner_id: partner_id_to_update }, { where: { user_id: user_id } });
        //saving the user
        //send users details
        console.log("updated user", updatedUser);
        return res.status(201).json({ code: 201, message: "Partner updated successfully" });
    }
    catch (error) {
        console.log("ERROR", error);
        return res
            .status(500)
            .json({ code: 500, message: "Internal server error", error: error });
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
                password: yield bcrypt.hash(phone_number.toString(), 10),
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
            const createdUser = yield createUserFunction(user_data); // Replace with your create user function
            createdUsers.push(createdUser);
        }
        return res
            .status(200)
            .json({ code: 200, message: "Customers created successfully", items: createdUsers });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
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
        const { username, email, password, role, partner_id } = req.body;
        // Perform validation on the data
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Incomplete data provided' });
        }
        let user = yield User.findAll({ where: { email: email } });
        if (user && user.length > 0) {
            return res.status(409).json({ code: 409, message: "Sorry, Customer already exists with the same email" });
        }
        // Logic for admin signup goes here
        // You can store the admin data in a database, hash the password, etc.
        const admin = {
            name: username,
            email,
            password: yield bcrypt.hash(password, 10),
            role,
            partner_id,
        };
        //save admin to database
        let newAdmin = yield User.create(admin);
        console.log("NEW ADMIN", newAdmin);
        // Return a success response
        return res.status(200).json({ code: 200, message: 'Admin registered successfully' });
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
    listPartners
};
