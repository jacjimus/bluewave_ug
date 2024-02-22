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

router.get('/all', isSuperAdmin, claimController.getAllClaims)
router.get('/:claim_id', claimController.getClaim)
router.post('/create', claimController.createClaim)
router.get('/user/:user_id',  claimController.getUserClaims)
router.get('/policy/:policy_id',  isSuperAdmin, claimController.getPolicyClaims)
router.put('/:claim_id', isSuperAdmin, claimController.updateClaim)
router.delete('/:claim_id', isSuperAdmin, claimController.deleteClaim)


export default router;








