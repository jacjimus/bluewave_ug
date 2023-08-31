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
router.post('/', isSuperAdmin,claimController.createClaim)
router.get('/:claim_id', isSuperAdmin,claimController.getClaim)
router.get('/user/:user_id',isSuperAdmin, claimController.getUserClaims)
router.get('/policies/:policy_id', isSuperAdmin,isSuperAdmin, claimController.getPolicyClaims)
router.put('/:claim_id', isSuperAdmin,claimController.updateClaim)
router.delete('/:claim_id',isSuperAdmin, claimController.deleteClaim)

module.exports = router

// Method	Endpoint	Description
// POST	/api/v1/claims	Create a new claim
// GET	/api/v1/claims	Get all claims
// GET	/api/v1/claims/:id	Get policies by ID
// GET /api/v1/claims/user/:user_id	Get user  claims by user ID
// PUT	/api/v1/claims/:id	Update claims by ID
// DELETE	/api/v1/claims/:id	Delete claim by ID









