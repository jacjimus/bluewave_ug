
import express from 'express';
const userController = require('../controllers/userController');
const { signup, login } = userController
const {saveUser, isAdmin, isUser} = require('../middleware/userAuth');

const router = express.Router()

//signup endpoint
//passing the middleware function to the signup
router.post('/signup', saveUser, signup)

//login route
router.post('/login', login )

router.get('/', isAdmin, userController.getUsers)
router.get('/:user_id', isUser, userController.getUser)
router.put('/:user_id', isAdmin, userController.updateUser)
router.delete('/:user_id', isAdmin, userController.deleteUser)




// Method	Endpoint	            Description
// POST	/api/v1/users/signup	Create a new user
// GET 	/api/v1/users/:id	    Get user by ID
// GET	    /api/v1/users	        Get all users
// GET     /api/v1/users/login     Login user
// PUT	    /api/v1/users/:id	    Update user by ID
// DELETE	/api/v1/users/:id	    Delete user by ID








module.exports = router