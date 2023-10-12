import express from 'express';
const paymentController = require('../controllers/paymentController');
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

router.get('/', isSuperAdmin, paymentController.getPayments)
router.get('/:payment_id', isSuperAdmin, paymentController.getPayment)
router.get('/policy/:policy_id', isSuperAdmin, paymentController.getPolicyPayments)
router.get('/user/:user_id', isSuperAdmin, paymentController.findUserByPhoneNumberPayments)
router.post('/create', isSuperAdmin, isSuperAdmin, paymentController.createPayment)

module.exports = router

