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
const apiKey = "f16ecdd2d74c746296367b7f34dcebe7b9f14ab45cfb2113f3e86077f906bc98";
const username = "sandbox";
const africastalking = AfricasTalking({
    apiKey,
    username
});
function sendSMS(phoneNumber, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const sms = africastalking.SMS;
        const options = {
            from: 'BLUEWAVE',
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
