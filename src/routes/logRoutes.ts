import express from 'express'
const logController = require('../controllers/logController');
const {
  isBluewave,
  isAirtel,
  isVodacom,
  isAAR,
  isUser,
  isManager,
  isSuperAdmin,
  isUserOrAdmin,
  isUserOrAdminOrManager } = require('../middleware/userAuth');

const router = express.Router()




router.get('/system', logController.getLogs);
router.get('/session', logController.getSessions);
router.post('/ussdSessions', logController.ussdSessions);



module.exports = router
