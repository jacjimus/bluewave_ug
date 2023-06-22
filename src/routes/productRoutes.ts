import express from 'express'
const productController = require('../controllers/productController')

const router = express.Router()

router.get('/', productController.getProducts)
router.get('/:product_id', productController.getProduct)
router.post('/create', productController.createProduct)
router.put('/:product_id', productController.updateProduct)


module.exports = router