
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
import path from 'path'

const router = express.Router()
const multer = require('multer')

const excelFilter = (req, file, cb) => {
  if (
    file.mimetype.includes("excel") ||
    file.mimetype.includes("spreadsheetml") || file.mimetype.includes("xls") || file.mimetype.includes("xlsx")
  ) {
    cb(null, true);
  } else {
    cb("Please upload only excel file.", false);
  }
};

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, `${Date.now()}-bluewave-${file.originalname}`);
  },
});


const upload = multer({ storage: storage, fileFilter: excelFilter });



router.get('/', isSuperAdmin, userController.findAllUsers)
router.get('/partner', isSuperAdmin, userController.getPartner)
router.get('/partners', isSuperAdmin, userController.listPartners)
router.get('/:user_id', isSuperAdmin, userController.findUserByPhoneNumber)
router.post('/partnerSwitch', isSuperAdmin, userController.partnerSwitch)
router.post('/login', userController.login)
router.post('/signup', userController.signup)
router.post('/admin/signup', userController.adminSignup)
router.post('/group/signup', upload.single('excel_file'), userController.bulkUserRegistration)
router.post('/partner/register', isBluewave, userController.partnerRegistration)
router.post('/arr_member_registration', userController.arrMemberRegistration)
router.put('/:user_id', userController.updateUser)
router.delete('/:user_id', userController.deleteUser)









module.exports = router