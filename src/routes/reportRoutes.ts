import express from 'express';
const reportController = require('../controllers/reportController');

const router = express.Router()




router.get('/policy/summary', reportController.getPolicySummary)
router.get('/claims/summary', reportController.getClaimSummary)

module.exports = router