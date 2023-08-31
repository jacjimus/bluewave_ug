import express from 'express';
const reportController = require('../controllers/reportController');
const {
    isBluewave,
  isAirtel,
  isVodacom,
  isAAR,
  isUser,
  isManager,
  isSuperAdmin,
  isUserOrAdmin,
  isUserOrAdminOrManager

} = require('../middleware/userAuth');

const router = express.Router()




router.get('/policy/summary',isSuperAdmin, reportController.getPolicySummary)
router.get('/claims/summary',isSuperAdmin, reportController.getClaimSummary)
router.get('/summary/all', isSuperAdmin,reportController.getAllReportSummary)
router.get('/daily/sales', isSuperAdmin,reportController.getDailyPolicySalesReport)
router.post('/policy/excel',isSuperAdmin, reportController.getPolicyExcelReportDownload)
router.get('/aggregated/daily/sales', isSuperAdmin,reportController.getAggregatedDailyPolicySalesReport)
router.get('/policy/excel/download', isSuperAdmin,reportController.handleDownload)

module.exports = router