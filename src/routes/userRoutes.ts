
import express from 'express';
const userController = require('../controllers/userController');
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

import { storage } from '../services/storageConfig';

import multer from 'multer';
import { excelFilter } from '../services/utils';

const router = express.Router();
const upload = multer({ storage: storage, fileFilter: excelFilter });


router.get('/', isSuperAdmin, userController.findAllUsers)
router.get('/partners', isSuperAdmin,userController.listPartners)
router.get('/partner', isSuperAdmin, userController.getPartner)
router.get('/agent/all', userController.findAllAgents)
router.get('/agent/summary', userController.agentSummaryAnalytics)
router.get('/:user_id', userController.findUser)
router.get('/fetch_user_by_phone_number', userController.findUserByPhoneNumber)
router.get('/agent/:referral_code', userController.findUsersByReferralCode)
router.get('/vehicle/:user_id', userController.findUserVehicle)
router.post('/partnerSwitch', isSuperAdmin, userController.partnerSwitch)
router.post('/login', userController.login)
router.post('/signup', userController.signup)
router.post('/admin/signup', userController.adminSignup)
router.post('/agent/signup', userController.agentSignup)
router.post('/group/signup', upload.single('excel_file'), userController.bulkUserRegistration)
router.post('/partner/register', isBluewave, userController.partnerRegistration)
router.post('/arr_member_registration', userController.arrMemberRegistration)
router.put('/:user_id', userController.updateUser)
router.put('/update/vehicle/:user_id', userController.updateUserVehicle)
router.delete('/:user_id', userController.deleteUser)
router.post('/password/reset', userController.forgotPassword)
router.post('/password/change', userController.changePassword)
router.post('/send_otp', userController.sendOTP)




export default router;