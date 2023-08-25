
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



router.get('/',isSuperAdmin, userController.getUsers)
router.get('/partner',isBluewave, userController.getPartner)
router.get('/:user_id', userController.getUser)
router.post('/partnerSwitch',   isSuperAdmin, userController.partnerSwitch)
router.post('/login', userController.login)
router.post('/signup', userController.signup)
router.post('/group/signup',upload.single('excel_file'), userController.bulkUserRegistration)
router.post('/partner/register',isBluewave, userController.partnerRegistration)
router.put('/:user_id', userController.updateUser)
router.delete('/:user_id',  userController.deleteUser)




// Method	Endpoint	            Description
// POST	/api/v1/users/signup	Create a new user
// GET 	/api/v1/users/:id	    Get user by ID
// GET	    /api/v1/users	        Get all users
// GET     /api/v1/users/login     Login user
// PUT	    /api/v1/users/:id	    Update user by ID
// DELETE	/api/v1/users/:id	    Delete user by ID








module.exports = router