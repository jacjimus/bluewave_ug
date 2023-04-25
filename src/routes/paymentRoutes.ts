import express from 'express';
const paymentController = require('../controllers/paymentController');

const router = express.Router()

router.get('/', paymentController.getPayments)
router.get('/:payment_id', paymentController.getPayment)
router.get('/user/:user_id', paymentController.getPolicyPayments)
router.get('/payments/:payment_id', paymentController.getUserPayments)

module.exports = router

