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




router.get('/policy/summary', reportController.getPolicySummary)
router.get('/claims/summary', reportController.getClaimSummary)
router.get('/summary/all', reportController.getAllReportSummary)

module.exports = router