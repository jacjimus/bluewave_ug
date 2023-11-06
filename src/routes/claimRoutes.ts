import express from 'express'
const claimController = require('../controllers/claimController');
const {
  isBluewave,
  isAirtel,
  isVodacom,
  isAAR,
  isUser,
  isManager,
  isSuperAdmin,
  isUserOrAdmin,
  isUserOrAdminOrManager } = require('../middleware/userAuth');

const router = express.Router()

router.get('/', isSuperAdmin, claimController.getClaims)
router.post('/', isSuperAdmin, claimController.createClaim)
router.get('/:claim_id', isSuperAdmin, claimController.getClaim)
router.get('/user/:user_id', isSuperAdmin, claimController.findUserByPhoneNumberClaims)
router.get('/policies/:policy_id', isSuperAdmin, isSuperAdmin, claimController.getPolicyClaims)
router.put('/:claim_id', isSuperAdmin, claimController.updateClaim)
router.delete('/:claim_id', isSuperAdmin, claimController.deleteClaim)

module.exports = router








