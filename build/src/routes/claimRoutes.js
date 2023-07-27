"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const claimController = require('../controllers/claimController');
const { isBluewave, isAirtel, isVodacom, isAAR, isUser, isManager, isSuperAdmin, isUserOrAdmin, isUserOrAdminOrManager } = require('../middleware/userAuth');
const router = express_1.default.Router();
router.get('/', isSuperAdmin, claimController.getClaims);
router.post('/', claimController.createClaim);
router.get('/:claim_id', claimController.getClaim);
router.get('/user/:user_id', claimController.getUserClaims);
router.get('/policies/:policy_id', isSuperAdmin, claimController.getPolicyClaims);
router.put('/:claim_id', claimController.updateClaim);
router.delete('/:claim_id', claimController.deleteClaim);
module.exports = router;
// Method	Endpoint	Description
// POST	/api/v1/claims	Create a new claim
// GET	/api/v1/claims	Get all claims
// GET	/api/v1/claims/:id	Get policies by ID
// GET /api/v1/claims/user/:user_id	Get user  claims by user ID
// PUT	/api/v1/claims/:id	Update claims by ID
// DELETE	/api/v1/claims/:id	Delete claim by ID
