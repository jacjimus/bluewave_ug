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
const axios_1 = __importDefault(require("axios"));
const auth_1 = __importDefault(require("./auth"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../models/db");
const uuid_1 = require("uuid");
require('dotenv').config();
const sendSMS_1 = __importDefault(require("./sendSMS"));
const User = db_1.db.users;
function getAirtelUser(phoneNumber, country, currency, partner_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield (0, auth_1.default)();
            const headers = {
                'Accept': '*/*',
                'X-Country': country,
                'X-Currency': currency,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
            };
            const GET_USER_URL = `https://openapiuat.airtel.africa/standard/v1/users/${phoneNumber}`;
            console.log("GET_USER_URL", GET_USER_URL);
            const response = yield axios_1.default.get(GET_USER_URL, { headers });
            console.log("RESPONCE KYC", response.data);
            if (response && response.data) {
                const userData = response.data.data;
                //check if user exists with the same phone number and partner id
                const userExists = yield User.findOne({
                    where: {
                        phone_number: userData.msisdn,
                        partner_id: partner_id
                    }
                });
                if (userExists) {
                    console.log("User exists");
                    return userExists;
                }
                const user = yield User.create({
                    user_id: (0, uuid_1.v4)(),
                    membership_id: Math.floor(100000 + Math.random() * 900000),
                    name: `${userData.first_name} ${userData.last_name}`,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    nationality: "UGANDA",
                    phone_number: userData.msisdn,
                    password: yield bcrypt_1.default.hash(`${userData.first_name}${userData.last_name}`, 10),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    pin: Math.floor(1000 + Math.random() * 9000),
                    role: "user",
                    status: "active",
                    partner_id: partner_id,
                });
                // WELCOME SMS
                const message = `Dear ${user.first_name}, welcome to Bluewave Insurance. Your membership ID is ${user.membership_id} and PIN is ${user.pin}. Dial *185*4*4# to access your account.`;
                yield (0, sendSMS_1.default)(user.phone_number, message);
                console.log("USER FOR AIRTEL API", user);
                return user;
            }
            else {
                console.error("User data not found in response");
                throw new Error("User not found");
            }
        }
        catch (error) {
            console.error(error);
            throw new Error("Error while fetching Airtel user");
        }
    });
}
exports.default = getAirtelUser;
