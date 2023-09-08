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
exports.termsAndConditions = void 0;
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
function termsAndConditions(menu, buildInput) {
    menu.state('termsAndConditions', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const message = 'To view Medical cover Terms &Conditions Visit www.tclink.com ';
            const to = buildInput.phoneNumber;
            const sms = yield (0, sendSMS_1.default)(to, message);
            console.log("SMS", sms);
            menu.end('Visit www.tclink.com to Terms & Conditions. A link will also be sent by SMS');
        }),
    });
}
exports.termsAndConditions = termsAndConditions;
