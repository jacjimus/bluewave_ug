//importing modules
import express from 'express';
const userController = require('../controllers/userController');
const { signup, login } = userController
const {saveUser, isAdmin} = require('../middleware/userAuth');

const router = express.Router()

//signup endpoint
//passing the middleware function to the signup
router.post('/signup', saveUser, signup)

//login route
router.post('/login', login )

router.get('/', isAdmin, userController.getUsers)
router.get('/:user_id', userController.getUser)





module.exports = router