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
const User = db_1.db.users;
function getAirtelUser(phoneNumber, country, currency, partner_id) {
    return __awaiter(this, void 0, void 0, function* () {
        let token = yield (0, auth_1.default)();
        const headers = {
            'Accept': '*/*',
            'X-Country': country,
            'X-Currency': currency,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        const GET_USER_URL = `https://openapiuat.airtel.africa/standard/v1/users/${phoneNumber}`;
        yield axios_1.default.get(GET_USER_URL, { headers })
            .then(response => {
            var _a, _b, _c, _d, _e, _f;
            console.log(response.data);
            //   "first_name": "Dealer",
            //   "grade": "SUBS",
            //   "is_barred": false,
            //   "is_pin_set": true,
            //   "last_name": "Test1",
            //   "msisdn": 123456789,
            //   "reg_status": "SUBS",
            let user = User.create({
                user_id: (0, uuid_1.v4)(),
                membership_number: Math.floor(100000 + Math.random() * 900000),
                name: ((_a = response.data) === null || _a === void 0 ? void 0 : _a.first_name) + " " + ((_b = response.data) === null || _b === void 0 ? void 0 : _b.last_name),
                first_name: (_c = response.data) === null || _c === void 0 ? void 0 : _c.first_name,
                last_name: (_d = response.data) === null || _d === void 0 ? void 0 : _d.last_name,
                nationality: country,
                phone_number: (_e = response.data) === null || _e === void 0 ? void 0 : _e.msisdn,
                password: bcrypt_1.default.hash((_f = response.data) === null || _f === void 0 ? void 0 : _f.msisdn, 10),
                createdAt: new Date(),
                updatedAt: new Date(),
                pin: Math.floor(1000 + Math.random() * 9000),
                role: "user",
                status: "active",
                partner_id: partner_id,
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
exports.default = getAirtelUser;
