import express from 'express';
const policyController = require('../controllers/policyController');

const router = express.Router()

//policy endpoint
// getPolicies,
// getPolicy,
// getUserPolicies,
// getPolicyPayments

router.get('/', policyController.getPolicies)
router.get('/:policy_id', policyController.getPolicy)
router.get('/user/:user_id', policyController.getUserPolicies)
router.get('/payments/:policy_id', policyController.getPolicyPayments)

module.exports = router