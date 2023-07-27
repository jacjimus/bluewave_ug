"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController = require('../controllers/productController');
const { isBluewave, isAirtel, isVodacom, isAAR, isUser, isManager, isSuperAdmin, isUserOrAdmin, isUserOrAdminOrManager } = require('../middleware/userAuth');
const router = express_1.default.Router();
router.get('/', isSuperAdmin, productController.getProducts);
router.get('/:product_id', isSuperAdmin, productController.getProduct);
router.post('/create', isBluewave, productController.createProduct);
router.put('/:product_id', isBluewave, productController.updateProduct);
module.exports = router;
