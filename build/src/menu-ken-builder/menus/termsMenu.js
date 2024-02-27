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
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const termsAndConditions = (args) => __awaiter(void 0, void 0, void 0, function* () {
    let { phoneNumber, response } = args;
    phoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const message = 'To view Terms and Conditions, visit Afyashua Ts & Cs https://rb.gy/g4hyk';
    const sms = yield sendSMS_1.default.sendSMS(3, phoneNumber, message);
    console.log("SMS", sms);
    response = 'END Visit [LINK TBC] to view Terms & Conditions. A link will also be sent by SMS.';
    return response;
});
exports.default = termsAndConditions;
