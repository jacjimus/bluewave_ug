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



router.get('/',isSuperAdmin, policyController.getPolicies)
router.get('/:policy_id',isSuperAdmin, policyController.getPolicy)
router.post('/create', isSuperAdmin,policyController.createPolicy)
router.post('/policyIssuance',isBluewave, policyController.policyIssuance)
router.get('/user/:user_id', isSuperAdmin,policyController.getUserPolicies)
router.put('/:policy_id', isSuperAdmin,policyController.updatePolicy)
router.delete('/:policy_id',isSuperAdmin, policyController.deletePolicy)




module.exports = router