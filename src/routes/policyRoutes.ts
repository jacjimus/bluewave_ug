import express from 'express';
const policyController = require('../controllers/policyController');

const router = express.Router()



router.get('/', policyController.getPolicies)
router.get('/:policy_id', policyController.getPolicy)
router.get('/user/:user_id', policyController.getUserPolicies)
//router.get('/payments/:policy_id', policyController.getPolicyPayments)
router.put('/:policy_id', policyController.updatePolicy)
router.delete('/:policy_id', policyController.deletePolicy)


// Method	Endpoint	Description
// POST	/api/v1/policies	Create a new policy
// GET	/api/v1/policies	Get all policies
// GET	/api/v1/policies/:id	Get policies by ID
// PUT	/api/v1/policies/:id	Update policy by ID
// DELETE	/api/v1/policies/:id	Delete policy by ID

module.exports = router