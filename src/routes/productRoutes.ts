import express from 'express'
const productController = require('../controllers/productController')
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


const router = express.Router()

router.get('/', isSuperAdmin,productController.getProducts)
router.get('/policy_details',  productController.getProductPolicyDetailsByPartner)
router.get('/:product_id', isSuperAdmin, productController.getProduct)
router.post('/create',isBluewave, productController.createProduct)
router.put('/:product_id',isBluewave, productController.updateProduct)



export default router;