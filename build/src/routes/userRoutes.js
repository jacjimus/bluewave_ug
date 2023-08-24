"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController = require('../controllers/userController');
const { isBluewave, isAirtel, isVodacom, isAAR, isUser, isManager, isSuperAdmin, isUserOrAdmin, isUserOrAdminOrManager } = require('../middleware/userAuth');
const router = express_1.default.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.get('/', isSuperAdmin, userController.getUsers);
router.get('/partner', isBluewave, userController.getPartner);
router.get('/:user_id', userController.getUser);
router.post('/partnerSwitch', isSuperAdmin, userController.partnerSwitch);
router.post('/login', userController.login);
router.post('/signup', userController.signup);
router.post('/group/signup', upload.single('excel_file'), userController.bulkUserRegistration);
router.post('/partner/register', isBluewave, userController.partnerRegistration);
router.put('/:user_id', userController.updateUser);
router.delete('/:user_id', userController.deleteUser);
// Method	Endpoint	            Description
// POST	/api/v1/users/signup	Create a new user
// GET 	/api/v1/users/:id	    Get user by ID
// GET	    /api/v1/users	        Get all users
// GET     /api/v1/users/login     Login user
// PUT	    /api/v1/users/:id	    Update user by ID
// DELETE	/api/v1/users/:id	    Delete user by ID
module.exports = router;
