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
exports.sendForgotPasswordEmail = exports.sendEmail = exports.sendWelcomeEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const googleapis_1 = require("googleapis");
const OAuth2 = googleapis_1.google.auth.OAuth2;
const dotenv_1 = __importDefault(require("dotenv"));
const welcome_1 = __importDefault(require("./emailTemplates/welcome"));
const forgotPassword_1 = __importDefault(require("./emailTemplates/forgotPassword"));
dotenv_1.default.config();
function getAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const oauth2Client = new OAuth2(process.env.OAUTH_CLIENTID, process.env.OAUTH_CLIENT_SECRET, "https://developers.google.com/oauthplayground" // Redirect URL
            );
            oauth2Client.setCredentials({
                refresh_token: process.env.OAUTH_REFRESH_TOKEN
            });
            oauth2Client.getAccessToken((err, token) => {
                if (err) {
                    reject("Failed to create access token :(");
                }
                resolve(token);
            });
        });
    });
}
const sendEmail = (email, subject, emailHtml) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = yield getAccessToken();
    let transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN,
            accessToken: accessToken,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    let mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: email,
        // cc: "admin@bluewave.insure",
        subject: subject,
        html: emailHtml // text
    };
    // console.log("mailOptions ",mailOptions)
    transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
            console.log("Error " + err);
        }
        else {
            console.log("Email sent successfully");
        }
    });
});
exports.sendEmail = sendEmail;
const sendWelcomeEmail = (user, subject, message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name } = user;
        const emailData = {
            name: name,
            email: email,
            login_url: process.env.DASHBOARD_LOGIN,
            // ... other dynamic values
        };
        const emailHtml = (0, welcome_1.default)(emailData);
        yield sendEmail(email, subject, emailHtml);
    }
    catch (err) {
        console.log(err);
    }
});
exports.sendWelcomeEmail = sendWelcomeEmail;
//forgot password email
const sendForgotPasswordEmail = (user, subject, message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name } = user;
        const emailData = {
            name: name,
            email: email,
            //reset_url: process.env.RESET_URL || "http://localhost:3000/reset-password",
            message: message,
        };
        const emailHtml = (0, forgotPassword_1.default)(emailData);
        yield sendEmail(email, subject, emailHtml);
    }
    catch (err) {
        console.log(err);
    }
});
exports.sendForgotPasswordEmail = sendForgotPasswordEmail;
