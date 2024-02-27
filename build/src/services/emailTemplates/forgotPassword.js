"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handlebars_1 = __importDefault(require("handlebars"));
let forgotPassword = `
    <div>
        <p>Hi {{name}},</p>
        <p>You recently requested to reset your password for your account.</p>
        <p style="color: black;">{{message}}</p>
        <p>If you did not request a password reset, please ignore this email or reply to let us know. This password reset is only valid for the next 30 minutes.</p>
        <p>Thanks</p>
        <p>Your Team</p>
    </div>
`;
const forgotPasswordTemplate = handlebars_1.default.compile(forgotPassword);
exports.default = forgotPasswordTemplate;
