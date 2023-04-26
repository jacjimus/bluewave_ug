"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//importing modules
const express_1 = __importDefault(require("express"));
const userController = require('../controllers/userController');
const { signup, login } = userController;
const { saveUser, isAdmin } = require('../middleware/userAuth');
const router = express_1.default.Router();
//signup endpoint
//passing the middleware function to the signup
router.post('/signup', saveUser, signup);
//login route
router.post('/login', login);
router.get('/', isAdmin, userController.getUsers);
router.get('/:user_id', userController.getUser);
module.exports = router;
