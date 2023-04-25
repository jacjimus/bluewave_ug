"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const policyController = require('../controllers/policyController');
const router = express_1.default.Router();
//policy endpoint
// getPolicies,
// getPolicy,
// getUserPolicies,
// getPolicyPayments
router.get('/', policyController.getPolicies);
router.get('/:policy_id', policyController.getPolicy);
router.get('/user/:user_id', policyController.getUserPolicies);
router.get('/payments/:policy_id', policyController.getPolicyPayments);
module.exports = router;
