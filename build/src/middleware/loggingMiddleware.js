"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { db } = require('../models/db');
const uuid_1 = require("uuid");
const Log = db.logs;
const loggingMiddleware = (req, res, next) => {
    var _a, _b;
    // Gather information for the log
    const userId = (req === null || req === void 0 ? void 0 : req.user) ? (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.user_id : null; // Assuming you're using user authentication middleware
    const operationType = req.method + ' ' + req.originalUrl;
    const details = {
        requestBody: req.body,
        queryParameters: req.query,
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        referer: req.headers.referer,
    };
    // Create a log entry
    Log.create({
        log_id: (0, uuid_1.v4)(),
        timestamp: new Date(),
        message: 'User ' + userId + ' performed operation ' + operationType,
        level: 'info',
        meta: details,
        user: userId,
        session: (_b = req === null || req === void 0 ? void 0 : req.session) === null || _b === void 0 ? void 0 : _b.id,
        partner_id: req.partner_id ? req.partner_id : 1
    })
        .then(() => {
        next();
    })
        .catch((error) => {
        console.error('Logging error:', error);
        next(); // Continue processing the request even if logging fails
    });
};
module.exports = loggingMiddleware;
//   log_id: {
//     type: DataTypes.UUID,
//     defaultValue: sequelize.UUIDV4,
//     primaryKey: true,
// },
// timestamp: {
//     type: DataTypes.DATE, // Corrected data type
//     allowNull: true
// },
// message: {
//     type: DataTypes.STRING, // Corrected data type
//     allowNull: true
// },
// level: {
//     type: DataTypes.STRING, // Corrected data type
//     defaultValue: 'info', // Corrected default value
//     allowNull: false // Added allowNull property
// },
// meta: {
//     type: DataTypes.JSON, // Changed to JSON data type
//     defaultValue: {},
// },
// user: {
//     type: DataTypes.UUID, // Changed to UUID data type
//     allowNull: true
// },
// session: {
//     type: DataTypes.UUID, // Changed to UUID data type
//     allowNull: true
// },
// partner_id: {
//     type: DataTypes.INTEGER,
//     allowNull: true
// },
