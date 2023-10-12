"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController = require('../controllers/paymentController');
const { isBluewave, isAirtel, isVodacom, isAAR, isUser, isManager, isSuperAdmin, isUserOrAdmin, isUserOrAdminOrManager } = require('../middleware/userAuth');
const router = express_1.default.Router();
router.get('/', isSuperAdmin, paymentController.getPayments);
router.get('/:payment_id', isSuperAdmin, paymentController.getPayment);
router.get('/policy/:policy_id', isSuperAdmin, paymentController.getPolicyPayments);
router.get('/user/:user_id', isSuperAdmin, paymentController.findUserByPhoneNumberPayments);
router.post('/create', isSuperAdmin, isSuperAdmin, paymentController.createPayment);
module.exports = router;
