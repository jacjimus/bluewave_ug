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
exports.loggingMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const loggingMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const operationType = `${req.method} ${req.originalUrl}`;
        const details = {
            requestBody: req.body,
            queryParameters: req.query,
            userAgent: req.headers['user-agent'],
            origin: req.headers.origin,
            referer: req.headers.referer,
        };
        const token = req.cookies.jwt;
        if (token) {
            const user = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const { user_id: userId, partner_id: partnerId, role } = user;
            console.log('user', user);
            req.user = { userId, partnerId, role };
        }
        console.log(`Operation: ${operationType} Details: ${JSON.stringify(details)}`);
        next();
    }
    catch (error) {
        console.error('Logging error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.loggingMiddleware = loggingMiddleware;
