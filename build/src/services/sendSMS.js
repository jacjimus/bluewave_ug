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
class SMSMessenger {
    static sendSMS(partner_id, phoneNumber, message) {
        return __awaiter(this, void 0, void 0, function* () {
            // const sms = SMSMessenger.africastalking.SMS;
            const sms = partner_id === 3 ? SMSMessenger.africastalkingKen.SMS : SMSMessenger.africastalking.SMS;
            const options = {
                from: partner_id === 3 ? process.env.AFRICA_TALKING_KEN_SHORTCODE : process.env.AFRICA_TALKING_SHORTCODE,
                to: phoneNumber,
                message: message,
            };
            console.log('AFRICASLKING OPTIONS ', options);
            try {
                const response = yield sms.send(options);
                console.log('AFRICASLKING RESPONSE ', response);
            }
            catch (error) {
                console.log("AFRICASTALKING ERR ", error);
            }
        });
    }
}
SMSMessenger.africastalking = AfricasTalking({
    apiKey: process.env.AFRICA_TALKING_API_KEY,
    username: process.env.AFRICA_TALKING_USERNAME,
});
SMSMessenger.africastalkingKen = AfricasTalking({
    apiKey: process.env.AFRICA_TALKING_API_KEY,
    username: process.env.AFRICA_TALKING_USERNAME,
});
exports.default = SMSMessenger;
