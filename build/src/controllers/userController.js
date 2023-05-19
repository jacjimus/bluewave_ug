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
//importing modules
const bcrypt = require("bcrypt");
const db_1 = require("../models/db");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv').config();
// Assigning users to the variable User
const User = db_1.db.users;
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
    *             example: { "first_name":"John", "last_name":"Doe", "email":"test@gmail.com", "password": "test123", "phone_number":"25475454656","national_id":278858583}
    *     responses:
    *       200:
    *         description: Information fetched succussfully
    *       400:
    *         description: Invalid request
    */
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    try {
        const { first_name, last_name, email, password, phone_number, national_id } = req.body;
        if (!first_name || !last_name || !email || !password || !phone_number || !national_id) {
            return res.status(400).json({ message: "Please provide all fields" });
        }
        function isValidKenyanPhoneNumber(phoneNumber) {
            const kenyanPhoneNumberRegex = /^(\+?254|0)[17]\d{8}$/;
            return kenyanPhoneNumberRegex.test(phoneNumber);
        }
        if (!isValidKenyanPhoneNumber(phone_number)) {
            return res.status(400).json({ message: "Please enter a valid phone number" });
        }
        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Please enter a valid email" });
        }
        let nationalId = national_id.toString();
        if (nationalId.length !== 8) {
            return res.status(400).json({ message: "National ID should be 8 digits" });
        }
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        // Generate a random integer for the primary key
        const randomId = getRandomInt(10000000, 99999999);
        const userData = {
            id: randomId,
            name: first_name + " " + last_name,
            email,
            phone_number,
            national_id,
            password: yield bcrypt.hash(password, 10),
            createdAt: new Date(),
            updatedAt: new Date(),
            pin: Math.floor(1000 + Math.random() * 9000),
            role: "user"
        };
        //checking if the user already exists
        let user = yield User.findOne({ where: { email: email } });
        if (user) {
            return res.status(409).json({ message: "User already exists" });
        }
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
            return res.status(201).json({ message: "User login successfully", token: token });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(409).send("Details are not correct");
    }
});
/**
    * @swagger
    * /api/v1/users/login:
    *   post:
    *     tags:
    *       - Users
    *     description: Login User
    *     operationId: loginUser
    *     summary: Login User
    *     security:
    *       - ApiKeyAuth: []
    *     parameters:
    *     requestBody:
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             example: {  "email":"dickens@bluewaveinsurance.co.ke", "password": "test123" }
    *     responses:
    *       200:
    *         description: Information fetched succussfuly
    *       400:
    *         description: Invalid request
    */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        console.log("USER", user);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        //if user email is found, compare password with bcrypt
        if (user) {
            const isSame = yield bcrypt.compare(password, user.password);
            //if password is the same
            //generate token with the user's id and the secretKey in the env file
            if (isSame) {
                let token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "apple123", {
                    expiresIn: 1 * 24 * 60 * 60 * 1000,
                });
                //if password matches wit the one in the database
                //go ahead and generate a cookie for the user
                res.cookie("jwt", token, { maxAge: 1 * 24 * 60 * 60, httpOnly: true });
                console.log("user", JSON.stringify(user, null, 2));
                console.log(token);
                //send user data
                return res.status(201).json({ message: "User login successfully", token: token });
            }
        }
    }
    catch (error) {
        console.log(error);
        return res.status(401).json({ message: "Invalid credentials" });
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
 *     description: Retrieve a list of users from the database
 *     responses:
 *       200:
 *         description: Successful response
 */
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield User.findAll().then((users) => {
            //remove password from the response
            users.forEach((user) => {
                delete user.dataValues.password;
                delete user.dataValues.pin;
            });
            return res.status(200).json(users);
        });
    }
    catch (error) {
        return res.status(404).json({ message: "No users found" });
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
    console.log(req.params);
    try {
        let user_id = parseInt(req.params.user_id);
        const user = yield User.findAll({
            where: {
                id: user_id
            }
        });
        if (!user || user.length === 0) {
            return res.status(404).json({ message: "No user found" });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        return res.status(404).json({ message: "No user found" });
    }
});
//updating a user
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, phone_number, national_id } = req.body;
        let user = yield User.findOne({
            where: {
                id: req.params.user_id,
            },
        });
        //check if user exists
        if (!user || user.length === 0) {
            return res.status(404).json({ message: "No user found" });
        }
        const data = {
            name,
            email,
            phone_number,
            national_id,
            password: yield bcrypt.hash(password, 10),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        //saving the user
        const updatedUser = yield User.update(data, {
            where: {
                id: req.params.user_id,
            },
        });
        //send users details
        return res.status(201).json({ message: "User updated successfully", user: updatedUser });
    }
    catch (error) {
        console.log(error);
        return res.status(409).json({ message: "Details are not correct" });
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
        return res.status(201).json({ message: "User deleted successfully" });
    }
    catch (error) {
        console.log(error);
        return res.status(409).send("Details are not correct");
    }
});
module.exports = {
    signup,
    login,
    getUsers,
    getUser,
    updateUser,
    deleteUser
};
