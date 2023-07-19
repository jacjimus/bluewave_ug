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
const dotenv = require('dotenv').config();
const utils_1 = require("../services/utils");
const { Op } = require("sequelize");
// Assigning users to the variable User
const User = db_1.db.users;
const Partner = db_1.db.partners;
function getUserFunc(user_id, partner_id) {
    return __awaiter(this, void 0, void 0, function* () {
        let user = yield User.findOne({
            where: {
                id: user_id,
                partner_id: partner_id
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
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             example: { "first_name":"John", "middle_name":"White",  "last_name":"Doe", "email":"test@gmail.com", "password": "test123", "phone_number":"0754546568","national_id":"27885858",  "dob": "1990-12-12", "gender": "M","marital_status": "single","addressline": "Nairobi", "nationality": "Kenyan","title": "Mr","pinzip": "00100","weight": 70,"height": 170, "partner_id": 1}
  *     responses:
  *       200:
  *         description: Information fetched succussfully
  *       400:
  *         description: Invalid request
  */
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { first_name, middle_name, last_name, email, password, phone_number, national_id, dob, gender, marital_status, addressline, nationality, title, pinzip, weight, height, partner_id } = req.body;
        if (!first_name || !last_name || !email || !password || !phone_number || !national_id || !partner_id) {
            return res.status(400).json({ message: "Please provide all fields" });
        }
        // if (!isValidKenyanPhoneNumber(phone_number)) {
        //   return res.status(400).json({ message: "Please enter a valid phone number" });
        // }
        if (!(0, utils_1.isValidEmail)(email)) {
            return res.status(400).json({ message: "Please enter a valid email" });
        }
        let nationalId = national_id.toString();
        // Generate a random integer for the primary key
        let randomId = (0, utils_1.getRandomInt)(10000000, 99999999);
        let userIDcheck = yield User.findAll({ where: { id: randomId } });
        if (userIDcheck.length > 0) {
            randomId = (0, utils_1.getRandomInt)(10000000, 99999999);
        }
        const userData = {
            id: randomId,
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
            partner_id
        };
        //checking if the user already exists
        let user = yield User.findAll({ where: { email: email } });
        //check if national id exists
        let nationalIdExists = yield User.findAll({ where: { national_id: national_id } });
        //check if phone number exists
        let phoneNumberExists = yield User.findAll({ where: { phone_number: phone_number } });
        if (nationalIdExists && nationalIdExists.length > 0) {
            return res.status(409).json({ message: "National ID already exists" });
        }
        if (phoneNumberExists && phoneNumberExists.length > 0) {
            return res.status(409).json({ message: "Phone number already exists" });
        }
        if (user && user.length > 0) {
            return res.status(409).json({ message: "User already exists" });
        }
        console.log("USER DATA", userData);
        //saving the user
        const newUser = yield User.create(userData);
        // set cookie with the token generated
        if (newUser) {
            let token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET || "apple123", {
                expiresIn: 1 * 24 * 60 * 60 * 1000,
            });
            res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
            console.log(token);
            //send users details
            return res.status(201).json({ result: { message: "User login successfully", token: token, user: newUser } });
        }
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(409).send("Details are not correct");
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
  *             example: { "partner_name": "Vodacom", "business_name": "Vodacom","business_type": "Telecom","business_category": "insurance","business_address": "Dar es salaam","country": "Tanzania","email": "info@vodacom.com","phone_number": "255754000000" ,"password": "passw0rd", "partner_id": 1}
  *     responses:
  *       200:
  *         description: Information fetched succussfully
  *       400:
  *         description: Invalid request
  */
const partnerRegistration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { partner_name, partner_id, business_name, business_type, business_category, business_address, country, email, phone_number, password } = req.body;
    try {
        //signup a partner
        if (!partner_name || !partner_id || !business_name || !business_type || !business_category || !business_address || !country || !email || !phone_number || !password) {
            return res.status(400).json({ message: "Please fill all the required fields" });
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
            return res.status(409).json({ message: "Partner already exists" });
        }
        //saving the partner
        const newPartner = yield Partner.create(partnerData);
        // set cookie with the token generated
        if (newPartner) {
            return res.status(201).json({ message: "Partner registered successfully", partner: newPartner });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
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
  *             example: {  "email":"dickens@bluewaveinsurance.co.ke", "password": "test123" }
  *     responses:
  *       200:
  *         description: Successful authentication
  */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("I WAS CALLED", req.body);
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide an email and password" });
        }
        //find a user by their email
        const user = yield User.findOne({
            where: {
                email: email
            }
        });
        //console.log("USER",user)
        console.log(!user, user.length == 0);
        if (!user || user.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        //if user email is found, compare password with bcrypt
        if (user) {
            const isSame = yield bcrypt.compare(password, user.password);
            //if password is the same
            //generate token with the user's id and the secretKey in the env file
            if (isSame) {
                let token = jwt.sign({ id: user.id, role: user.role, partner_id: user.partner_id }, process.env.JWT_SECRET || "apple123", {
                    expiresIn: 1 * 24 * 60 * 60 * 1000,
                });
                //if password matches wit the one in the database
                //go ahead and generate a cookie for the user
                res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
                console.log(token);
                //remove password from the user object
                user.password = undefined;
                //send user data
                return res.status(201).json({ result: { message: "User login successfully", token: token, user: user } });
            }
        }
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(400).json({ message: "Invalid credentials", error: error });
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
 *     description: Retrieve a list of users from the database
 *     responses:
 *       200:
 *         description: Successful response
 */
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let partner_id = req.query.partner_id;
    console.log("PARTNER ID", partner_id);
    let filter = req.query.filter || "";
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let status = {
        status: 200,
        result: {}
    };
    try {
        if (!partner_id) {
            return res.status(400).json({ message: "Please provide a partner id" });
        }
        let users = yield User.findAll({
            where: {
                partner_id: partner_id,
                [Op.or]: [
                    {
                        first_name: {
                            [Op.iLike]: `%${filter}%`
                        }
                    },
                    {
                        last_name: {
                            [Op.iLike]: `%${filter}%`
                        }
                    },
                    {
                        email: {
                            [Op.iLike]: `%${filter}%`
                        }
                    },
                    {
                        phone_number: {
                            [Op.iLike]: `%${filter}%`
                        }
                    },
                    {
                        national_id: {
                            [Op.iLike]: `%${filter}%`
                        }
                    },
                ]
            },
            offset: (page - 1) * limit,
            limit: limit,
            order: [
                ['createdAt', 'DESC']
            ],
        });
        //count all users
        let count = yield User.count({ where: { partner_id: partner_id } });
        //remove password from the response
        if (users) {
            for (let i = 0; i < users.length; i++) {
                delete users[i].dataValues.password;
                delete users[i].dataValues.pin;
            }
        }
        if (users && users.length > 0) {
            status.result = users;
            return res.status(200).json({ result: { message: "Users fetched successfully", items: users, count } });
        }
        return res.status(404).json({ message: "No users found" });
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({ message: "Internal server error", error: error });
    }
});
/**
  * @swagger
  * /api/v1/users/{user_id}:
  *   get:
  *     tags:
  *       - Users
  *     description: Get User
  *     operationId: getUser
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
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let user_id = parseInt(req.params.user_id);
        let partner_id = req.query.partner_id;
        let user = yield getUserFunc(user_id, partner_id);
        console.log(user);
        if (!user || user.length === 0) {
            return res.status(404).json({ item: 0, message: "No user found" });
        }
        return res.status(200).json({ result: { message: "User fetched successfully", item: user } });
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({ message: "Internal server error", error: error });
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
  *             example: { "first_name":"John", "last_name":"Doe", "email":"test@gmail.com", "password": "test123", "phone_number":"25475454656","national_id":278858583,  "dob": "1990-12-12", "gender": "M","marital_status": "single","addressline": "Nairobi", "nationality": "Kenyan","title": "Mr","pinzip": "00100","weight": 70,"height": 170}
  *     responses:
  *       200:
  *         description: Information fetched succussfully
  *       400:
  *         description: Invalid request
  */
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { first_name, middle_name, last_name, email, password, phone_number, national_id, dob, gender, marital_status, addressline, nationality, title, pinzip, weight, height } = req.body;
        let user = getUserFunc(req.params.user_id, req.query.partner_id);
        //check if user exists
        if (!user || user.length === 0) {
            return res.status(404).json({ message: "No user found" });
        }
        const data = {
            first_name,
            middle_name,
            last_name,
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
            partner_id: req.query.partner_id
        };
        //saving the user
        const updatedUser = yield User.update(data, {
            where: {
                id: req.params.user_id,
            },
        });
        //send users details
        return res.status(201).json({ result: { message: "User updated successfully", item: updatedUser } });
    }
    catch (error) {
        console.log(error);
        return res.status(409).json({ message: "Details are not correct", error: error });
    }
});
// //deleting a user
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield User.destroy({
            where: {
                id: req.params.user_id,
            },
        });
        //send users details
        return res.status(201).json({ result: { message: "User deleted successfully" } });
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
                partner_id: partner_id
            },
        });
        console.log(partner);
        if (!partner || partner.length === 0) {
            return res.status(404).json({ item: 0, message: "No partner found" });
        }
        return res.status(200).json({ result: { message: "partner fetched successfully", item: partner } });
    }
    catch (error) {
        console.log("ERROR", error);
        return res.status(500).json({ message: "Internal server error", error: error });
    }
});
module.exports = {
    signup,
    login,
    getUsers,
    getUser,
    getPartner,
    updateUser,
    deleteUser,
    partnerRegistration
};
