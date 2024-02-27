"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const claimController = require('../controllers/claimController');
const { isBluewave, isAirtel, isVodacom, isAAR, isUser, isManager, isSuperAdmin, isUserOrAdmin, isUserOrAdminOrManager } = require('../middleware/userAuth');
const router = express_1.default.Router();
router.get('/all', isSuperAdmin, claimController.getAllClaims);
router.get('/:claim_id', claimController.getClaim);
router.post('/create', claimController.createClaim);
router.get('/user/:user_id', claimController.getUserClaims);
router.get('/policy/:policy_id', isSuperAdmin, claimController.getPolicyClaims);
router.put('/:claim_id', isSuperAdmin, claimController.updateClaim);
router.delete('/:claim_id', isSuperAdmin, claimController.deleteClaim);
exports.default = router;
