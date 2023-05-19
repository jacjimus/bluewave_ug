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
require('dotenv').config();
const User = db_1.db.users;
function getUser(phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        let token = yield (0, auth_1.default)();
        const headers = {
            'Accept': '*/*',
            'X-Country': process.env.AIRTEL_COUNTRY,
            'X-Currency': process.env.AIRTEL_CURRENCY,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        const GET_USER_URL = `https://openapiuat.airtel.africa/standard/v1/users/${phoneNumber}`;
        yield axios_1.default.get(GET_USER_URL, { headers })
            .then(response => {
            console.log(response.data);
            //   "first_name": "Dealer",
            //   "grade": "SUBS",
            //   "is_barred": false,
            //   "is_pin_set": true,
            //   "last_name": "Test1",
            //   "msisdn": 123456789,
            //   "reg_status": "SUBS",
            let user = User.create({
                name: response.data.first_name + " " + response.data.last_name,
                phone_number: response.data.msisdn,
                password: bcrypt_1.default.hash(response.data.msisdn, 10),
                createdAt: new Date(),
                updatedAt: new Date(),
                pin: Math.floor(1000 + Math.random() * 9000),
                role: "user"
            });
            console.log("USER FOR AIRTEL API", user);
            return user;
        })
            .catch(error => {
            console.error(error);
            throw new Error("User not found");
        });
    });
}
exports.default = getUser;
