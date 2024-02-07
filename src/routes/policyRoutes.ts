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



router.get('/', isSuperAdmin, policyController.getPolicies)
router.get('/:policy_id', isSuperAdmin, policyController.getPolicy)
router.post('/create', isSuperAdmin, policyController.createPolicy)
router.post('/vehicle/registration', policyController.vehicleRegistration)
router.post('/calculate/premium', policyController.calculatePremiumBasedOnVehicleDetails)
router.post('/health', policyController.createHealthPolicy)
router.post('/self-cover', policyController.submitSelfCover)
router.get('/user/:user_id', isSuperAdmin, policyController.findUserByPhoneNumberPolicies)
router.put('/:policy_id', isSuperAdmin, policyController.updatePolicy)
router.delete('/:policy_id', isSuperAdmin, policyController.deletePolicy)





export default router;