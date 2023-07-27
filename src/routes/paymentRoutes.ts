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

router.get('/',isSuperAdmin, paymentController.getPayments)
router.get('/:payment_id', paymentController.getPayment)
router.get('/policy/:policy_id', isSuperAdmin,paymentController.getPolicyPayments)
router.get('/user/:user_id', paymentController.getUserPayments)
router.post('/create', isSuperAdmin,paymentController.createPayment)

module.exports = router

