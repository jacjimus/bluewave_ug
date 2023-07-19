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
const AfricasTalking = require('africastalking');
const dotenv = require('dotenv');
dotenv.config();
const africastalking = AfricasTalking({
    apiKey: process.env.AFRICA_TALKING_API_KEY || '1718d7b52118cfef92bcc7bfb906ee258ed7c6bc420dd78c45b6328b99775c62',
    username: process.env.AFRICA_TALKING_USERNAME || 'sandbox'
});
function sendSMS(phoneNumber, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const sms = africastalking.SMS;
        const options = {
            from: "36667",
            to: phoneNumber,
            message: message
        };
        try {
            const response = yield sms.send(options);
            console.log(response);
        }
        catch (error) {
            console.log(error);
        }
    });
}
exports.default = sendSMS;
