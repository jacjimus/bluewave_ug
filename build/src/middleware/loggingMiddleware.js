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
const { db } = require('../models/db');
const uuid_1 = require("uuid");
const jwt = require('jsonwebtoken');
const Log = db.logs;
const loggingMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Gather information for the log
        const operationType = `${req.method} ${req.originalUrl}`;
        const details = {
            requestBody: req.body,
            queryParameters: req.query,
            userAgent: req.headers['user-agent'],
            origin: req.headers.origin,
            referer: req.headers.referer,
        };
        // Get user information from JWT token
        const token = req.cookies.jwt; // Use req.cookies to get cookies
        const user = jwt.verify(token, process.env.JWT_SECRET);
        const userId = user.id;
        const partnerId = user.partner_id;
        const role = user.role;
        // Create a log entry
        yield Log.create({
            log_id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            message: `${role} ${userId} performed operation ${operationType}`,
            level: 'info',
            meta: details,
            user: userId,
            session: (_a = req.session) === null || _a === void 0 ? void 0 : _a.id,
            partner_id: partnerId,
        });
        next();
    }
    catch (error) {
        console.error('Logging error:', error);
        next(); // Continue processing the request even if logging fails
    }
});
module.exports = loggingMiddleware;
