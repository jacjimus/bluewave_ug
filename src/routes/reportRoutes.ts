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


import { storage } from '../services/storageConfig';

import multer from 'multer';
import { excelFilter } from '../services/utils';

const router = express.Router();
const upload = multer({ storage: storage, fileFilter: excelFilter });



router.get('/policy/summary',isSuperAdmin, reportController.getPolicySummary)
router.get('/claims/summary',isSuperAdmin, reportController.getClaimSummary)
router.get('/summary/all', isSuperAdmin,reportController.getAllReportSummary)
router.get('/daily/sales', isSuperAdmin,reportController.getDailyPolicySalesReport)
router.get('/aggregated/daily/sales', isSuperAdmin,reportController.getAggregatedDailyPolicySalesReport)
router.get('/aggregated/monthly/sales', isSuperAdmin,reportController.getAggregatedMonthlySalesReport )
router.get('/aggregated/annual/sales', isSuperAdmin,reportController.getAggregatedAnnuallyPolicySalesReport)
router.get('/policy/excel/download', reportController.handlePolicyDownload)
router.post('/policy/excel',isSuperAdmin, reportController.getPolicyExcelReportDownload)
router.get('/users/excel/download', reportController.handleUsersDownload)
router.post('/users/excel',isSuperAdmin, reportController.getUserExcelReportDownload)
router.post('/claim/excel',isSuperAdmin, reportController.getClaimExcelReportDownload)
router.post('/reconciliation', upload.single('payment_file'), reportController.paymentReconciliation)
router.get('/claim/excel/download', reportController.handleClaimDownload)

export default router;