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

router.get('/', paymentController.getPayments)
router.get('/:payment_id', paymentController.getPayment)
router.get('/policy/:policy_id', paymentController.getPolicyPayments)
router.get('/user/:user_id', paymentController.getUserPayments)

module.exports = router

