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
require('dotenv').config();
function authToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let token;
            const inputBody = {
                "client_id": process.env.AIRTEL_CLIENT_ID,
                "client_secret": process.env.AIRTEL_CLIENT_SECRET,
                "grant_type": "client_credentials"
            };
            const headers = {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            };
            const AUTH_TOKEN_URL = process.env.AIRTEL_AUTH_TOKEN_URL;
            yield axios_1.default.post(AUTH_TOKEN_URL, inputBody, { headers })
                .then(response => {
                console.log(response.data);
                token = response.data.access_token;
            })
                .catch(error => {
                console.error(error);
            });
            return token;
        }
        catch (error) {
            console.log(error);
            throw new Error(error);
        }
    });
}
exports.default = authToken;
