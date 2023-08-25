"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportController = require('../controllers/reportController');
const { isBluewave, isAirtel, isVodacom, isAAR, isUser, isManager, isSuperAdmin, isUserOrAdmin, isUserOrAdminOrManager } = require('../middleware/userAuth');
const router = express_1.default.Router();
router.get('/policy/summary', isSuperAdmin, reportController.getPolicySummary);
router.get('/claims/summary', isSuperAdmin, reportController.getClaimSummary);
router.get('/summary/all', isSuperAdmin, reportController.getAllReportSummary);
router.get('/daily/sales', isSuperAdmin, reportController.getDailyPolicySalesReport);
router.post('/policy/excel', isSuperAdmin, reportController.getPolicyExcelReportDownload);
router.get('/aggregated/daily/sales', isSuperAdmin, reportController.getAggregatedDailyPolicySalesReport);
module.exports = router;
