
const express = require('express');
const claimController = require('../controllers/claimController');

const router = express.Router()

router.get('/', claimController.getClaims)
router.get('/:claim_id', claimController.getClaim)
router.get('/user/:user_id', claimController.getUserClaims)
router.get('/policies/:policy_id', claimController.getPolicyClaims)

module.exports = router



