"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const generalController = require('../controllers/generalController');
const { isBluewave, isAirtel, isVodacom, isAAR, isUser, isManager, isSuperAdmin, isUserOrAdmin, isUserOrAdminOrManager } = require('../middleware/userAuth');
const router = express_1.default.Router();
// Configure multer for file upload
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
// File upload route
router.post('/documents/upload', upload.single('file'), generalController.uploadDocument);
router.get('/faqs', generalController.getFaqs);
router.get('/privacy-policy', generalController.getPrivacyPolicy);
router.get('/terms-and-conditions', generalController.getTermsAndConditions);
exports.default = router;
