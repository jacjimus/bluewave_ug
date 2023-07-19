"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController = require('../controllers/productController');
const router = express_1.default.Router();
router.get('/', productController.getProducts);
router.get('/:product_id', productController.getProduct);
router.post('/create', productController.createProduct);
router.put('/:product_id', productController.updateProduct);
module.exports = router;
