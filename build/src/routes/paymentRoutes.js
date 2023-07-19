"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController = require('../controllers/paymentController');
const { isBluewave, isAirtel, isVodacom, isAAR, isUser, isManager, isSuperAdmin, isUserOrAdmin, isUserOrAdminOrManager } = require('../middleware/userAuth');
const router = express_1.default.Router();
router.get('/', paymentController.getPayments);
router.get('/:payment_id', paymentController.getPayment);
router.get('/policy/:policy_id', paymentController.getPolicyPayments);
router.get('/user/:user_id', paymentController.getUserPayments);
router.post('/create', paymentController.createPayment);
module.exports = router;
