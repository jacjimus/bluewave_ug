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
const db_1 = require("../models/db");
const LogModel = db_1.db.logs;
const SessionModel = db_1.db.sessions;
/**
* @swagger
* /api/v1/logs/system:
*   get:
*     tags:
*       - Logs
*     description:  Get all logs
*     operationId:  getLogs
*     summary:
*     security:
*       - ApiKeyAuth: []
*     parameters:
*       - name: partner_id
*         in: query
*         required: false
*         schema:
*           type: number
*       - name: user_id
*         in: query
*         required: false
*         schema:
*           type: string
*       - name: page
*         in: query
*         required: false
*         schema:
*           type: string
*       - name: limit
*         in: query
*         required: false
*         schema:
*           type: string
*     responses:
*       200:
*         description: Information fetched successfully
*       400:
*         description: Invalid request
*/
const getLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const partner_id = req.query.partner_id;
        const user_id = req.query.user_id;
        // Retrieve page and limit from query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default limit is 10
        // Calculate offset based on current page and limit
        const offset = (page - 1) * limit;
        const { logs, totalLogsCount } = yield fetchLogsFromDatabase(partner_id, user_id, offset, limit);
        res.status(200).json({
            message: 'Information fetched successfully',
            logs: logs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalLogsCount / limit),
                totalLogs: totalLogsCount
            }
        });
    }
    catch (error) {
        res.status(400).json({
            message: 'Invalid request',
            error: error.message
        });
    }
});
const fetchLogsFromDatabase = (partner_id, user_id, offset, limit) => __awaiter(void 0, void 0, void 0, function* () {
    let whereCondition = {
        partner_id: partner_id
    };
    if (user_id) {
        whereCondition.user_id = user_id;
    }
    // Example query using Sequelize
    let logs = yield LogModel.findAll({
        where: whereCondition,
        offset: offset,
        limit: limit
    });
    // Calculate total logs count based on the query result
    const totalLogsCount = yield LogModel.count({
        where: whereCondition
    });
    return { logs, totalLogsCount };
});
/**
* @swagger
* /api/v1/logs/session:
*   get:
*     tags:
*       - Logs
*     description:  Get all sessions
*     operationId:  getSessions
*     summary:
*     security:
*       - ApiKeyAuth: []
*     parameters:
*       - name: partner_id
*         in: query
*         required: false
*         schema:
*           type: number
*       - name: user_id
*         in: query
*         required: false
*         schema:
*           type: string
*       - name: page
*         in: query
*         required: false
*         schema:
*           type: string
*       - name: limit
*         in: query
*         required: false
*         schema:
*           type: string
*     responses:
*       200:
*         description: Information fetched successfully
*       400:
*         description: Invalid request
*/
const getSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const partner_id = req.query.partner_id;
        const user_id = req.query.user_id;
        // Retrieve page and limit from query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default limit is 10
        // Calculate offset based on current page and limit
        const offset = (page - 1) * limit;
        // Fetch sessions from the database with pagination
        const { sessions, totalSessionsCount } = yield fetchSessionsFromDatabase(partner_id, user_id, offset, limit);
        // Return pagination information along with sessions
        res.status(200).json({
            message: 'Information fetched successfully',
            sessions: sessions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalSessionsCount / limit),
                totalSessions: totalSessionsCount
            }
        });
    }
    catch (error) {
        res.status(400).json({
            message: 'Invalid request',
            error: error.message
        });
    }
});
const fetchSessionsFromDatabase = (partner_id, user_id, offset, limit) => __awaiter(void 0, void 0, void 0, function* () {
    // Your database fetching logic with offset and limit goes here
    let whereCondition = {
        partner_id: partner_id
    };
    if (user_id) {
        whereCondition.user_id = user_id;
    }
    // Example query using Sequelize
    let sessions = yield SessionModel.findAll({
        where: whereCondition,
        offset: offset,
        limit: limit
    });
    // Calculate total sessions count based on the query result
    const totalSessionsCount = yield SessionModel.count({
        where: whereCondition
    });
    return { sessions, totalSessionsCount };
});
module.exports = {
    getLogs,
    getSessions
};
