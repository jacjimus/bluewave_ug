import express from 'express';
import multer from 'multer';
const generalController = require('../controllers/generalController')
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

const router = express.Router();

// Configure multer for file upload

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })



// File upload route
router.post('/documents/upload', upload.single('file'), generalController.uploadDocument);
router.get('/faqs', generalController.getFaqs);
router.get('/privacy-policy', generalController.getPrivacyPolicy);
router.get('/terms-and-conditions', generalController.getTermsAndConditions);



export default router;










