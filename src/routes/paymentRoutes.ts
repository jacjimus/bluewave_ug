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
router.get('/customer/payment_attempts',  paymentController.customerPaymentAttempts)
router.get('/customer/failures_outcomes_last_month',  paymentController.getFailuresAndOutcomesLastMonth)
router.get('/customer/payment_outcomes_trends',  paymentController.getPaymentOutcomesTrends)
router.get('/customer/payment_attempt_outcomes_by_day_of_week',  paymentController.getPaymentAttemptOutcomesByDayOfWeek)
router.get('/customer/payment_attempt_outcomes_by_day_of_month',  paymentController.getPaymentAttemptOutcomesByDayOfMonth)
router.get('/customer/payment_attempt_outcomes_by_time_of_day',  paymentController.getPaymentAttemptOutcomesByTimeOfDay)
router.post('/create', isSuperAdmin, isSuperAdmin, paymentController.createPayment)


export default router;

