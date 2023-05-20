
import express from 'express';
const userController = require('../controllers/userController');
const {saveUser, isAdmin, isUser} = require('../middleware/userAuth');

const router = express.Router()




router.get('/', userController.getUsers)
router.get('/:user_id',  userController.getUser)
router.post('/login', userController.login )
router.post('/signup', saveUser, userController.signup)
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