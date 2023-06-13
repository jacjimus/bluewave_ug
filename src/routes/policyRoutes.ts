import express from 'express';
const policyController = require('../controllers/policyController');
const {
    isBluewave,
  isAirtel,
  isVodacom,
  isAAR,
  isUser,
  isManager,
  isSuperAdmin,
  isUserOrAdmin,
  isUserOrAdminOrManager

} = require('../middleware/userAuth');

const router = express.Router()



router.get('/', policyController.getPolicies)
router.get('/:policy_id', policyController.getPolicy)
router.post('/create', policyController.createPolicy)
router.post('/policyIssuance', policyController.policyIssuance)
router.get('/user/:user_id', policyController.getUserPolicies)
router.put('/:policy_id', policyController.updatePolicy)
router.delete('/:policy_id', policyController.deletePolicy)




module.exports = router