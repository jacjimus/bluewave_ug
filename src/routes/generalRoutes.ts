import express from 'express';
import multer from 'multer';
const generalController = require('../controllers/generalController')

const router = express.Router();

// Configure multer for file upload

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })



// File upload route
router.post('/upload', upload.single('file'), generalController.uploadDocument);

module.exports = router;










