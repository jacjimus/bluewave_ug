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
const sendSMS_1 = __importDefault(require("./sendSMS"));
const User = db_1.db.users;
function getAirtelUser(phoneNumber, country, currency, partner_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userExists = yield User.findOne({
                where: {
                    phone_number: phoneNumber,
                    partner_id: partner_id,
                },
            });
            if (userExists) {
                console.log("User exists");
                return userExists;
            }
            // Making an API call only if the user doesn't exist
            const token = yield (0, auth_1.default)(partner_id);
            const headers = {
                Accept: "*/*",
                "X-Country": country,
                "X-Currency": currency,
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            };
            const AIRTEL_KYC_API_URL = process.env.AIRTEL_KYC_API_URL;
            const GET_USER_URL = `${AIRTEL_KYC_API_URL}/${phoneNumber}`;
            console.log("GET_USER_URL", GET_USER_URL);
            const response = yield axios_1.default.get(GET_USER_URL, { headers });
            console.log("RESPONSE KYC", response.data);
            if (response && response.data) {
                const userData = response.data.data;
                const user = yield User.create({
                    user_id: (0, uuid_1.v4)(),
                    membership_id: generateMembershipId(),
                    name: `${userData.first_name} ${userData.last_name}`,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    nationality: partner_id == 1 ? "KENYA" : "UGANDA",
                    phone_number: userData.msisdn,
                    password: yield bcrypt_1.default.hash(`${userData.first_name}${userData.last_name}`, 10),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    pin: generatePIN(),
                    role: "user",
                    status: "active",
                    partner_id: partner_id,
                });
                // WELCOME SMS
                const message = `Dear ${user.first_name}, welcome to Ddwaliro Care. Membership ID: ${user.membership_id} and Ddwaliro PIN: ${user.pin}. Dial *185*4*4# to access your account.`;
                yield (0, sendSMS_1.default)(user.phone_number, message);
                console.log("USER FOR AIRTEL API", user);
                return user ? user : null;
            }
            else {
                console.error("User data not found in response");
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
function generateMembershipId() {
    while (true) {
        const membershipId = Math.floor(100000 + Math.random() * 900000);
        const user = User.findOne({
            where: {
                membership_id: membershipId,
            },
        });
        if (!user) {
            return membershipId;
        }
    }
}
function generatePIN() {
    return Math.floor(1000 + Math.random() * 9000);
}
exports.default = getAirtelUser;
