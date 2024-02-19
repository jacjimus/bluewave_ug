
const { db } = require("../models/db");
import { v4 as uuidv4 } from 'uuid';
const Product = db.products;

const Op = db.Sequelize.Op;


interface Product {
  product_name: string,
  product_description: string,
  product_type: string,
  product_category: string,
  product_premium: number,
  product_image: string,
  product_status: string,
  product_duration: number,
  underwriter: string,
  benefits: object

}


/**
    * @swagger
    * /api/v1/products:
    *   get:
    *     tags:
    *       - Products
    *     description: List products
    *     operationId: listProducts
    *     summary: List products
    *     security:
    *       - ApiKeyAuth: []
    *     parameters:
    *       - name: page
    *         in: query
    *         required: false
    *         schema:
    *           type: number
    *       - name: limit
    *         in: query
    *         required: false
    *         schema:
    *           type: number
    *       - name: filter
    *         in: query
    *         required: false
    *         schema:
    *           type: string
    *       - name: start_date
    *         in: query
    *         required: false
    *         schema:
    *           type: string
    *           format: date
    *       - name: end_date
    *         in: query
    *         required: false
    *         schema:
    *           type: string
    *           format: date
    *     responses:
    *       200:
    *         description: Information fetched successfuly
    *       400:
    *         description: Invalid request
    */
const getProducts = async (req: any, res: any) => {
  let status = {
    code: 200,
    status: "OK",
    result: {},
  };
  try {
    let filter = req?.query?.filter
    let product: any;

    if (!filter || filter == "") {
      filter = filter?.trim().toLowerCase();
      product = await Product.findAll({
        order: [["createdAt", "DESC"]],
      });
    } else {
      product = await Product.findAll({
        where: {
          [Op.or]: [
            { product_name: { [Op.iLike]: `%${filter}%` } },
            { product_description: { [Op.iLike]: `%${filter}%` } },
            { product_type: { [Op.iLike]: `%${filter}%` } },
            { product_category: { [Op.iLike]: `%${filter}%` } },
            { product_premium: { [Op.iLike]: `%${filter}%` } },
          ],
        },
        order: [["createdAt", "DESC"]],
      });
    }

    // Filter by start_date and end_date if provided
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      product = product.filter((item: any) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    if (!product || product.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    // Product count
    const productCount = product.length;

    // Product pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = productCount;

    const resultProduct = product.slice(startIndex, endIndex);

    const pagination: any = {};

    if (endIndex < productCount) {
      pagination.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit: limit,
      };
    }

    status.result = {
      count: total,
      pagination: pagination,
      items: resultProduct,
    };


    return res.status(status.code).json({
      code: 200,
      status: "OK", result: status.result
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: 500,
      status: "FAILED",
       message: "Internal server error", error: error
    });
  }
};



/**
  * @swagger
  * /api/v1/products/{product_id}:
  *   get:
  *     tags:
  *       - Products
  *     description: List products by agreement_id
  *     operationId: listProductsByAgreementID
  *     summary: List products
  *     security:
  *       - ApiKeyAuth: []
  *     parameters:
  *       - name: product_id
  *         in: path
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const getProduct = async (req: any, res: any) => {
  let status = {
    code: 200,
    status: "OK",
    result: {},

  }
  try {
    const product_id = req.params.product_id

    const product = await Product.findOne({
      where: {
        product_id: product_id
      }
    })
    if (!product || product.length === 0) {
      return res.status(404).json({ message: "No product found" });
    }

    status.result = {
      item: product
    };

    return res.status(status.code).json({
      code: 200,
      status: "OK", result: status.result
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: 500,
      status: "FAILED", message: "Internal server error", error: error
    });
  }

}

/**
  * @swagger
  * /api/v1/products/create:
  *   post:
  *     tags:
  *       - Products
  *     description: 
  *     operationId: createProduct
  *     summary: 
  *     security:
  *       - ApiKeyAuth: []
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             example: {"product_name": "Test Product", "product_description": "Test Product", "product_type": "Test Product", "product_category": "Test Product", "product_premium": 1000, "product_image": "Test Product", "product_status": "Test Product", "product_duration": 1000, "underwriter": "Test Product", "benefits":{ "last_expense": 50000, "hospital_cash": 10000,"maternity": 10000}}
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */

const createProduct = async (req: any, res: any) => {
  try {

    const product: Product = req.body;
    const newProduct = await Product.create(product);
    if (!newProduct) {
      return res.status(500).json({status: "FAILED", message: "Error creating product" });
    }


    return res.status(200).json({
      result: {
        code: 200,
        status: "OK",
        message: "Product created successfully",
        product: newProduct
      }
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: 500,
      status: "FAILED", message: "Internal server error", error: error
    });
  }

}



/**
  * @swagger
  * /api/v1/products/{product_id}:
  *   put:
  *     tags:
  *       - Products
  *     description: Update products by product_id
  *     operationId: updateProductsByProductID
  *     summary: Update products
  *     security:
  *       - ApiKeyAuth: []
  *     parameters:
  *       - name: product_id
  *         in: path
  *         required: true
  *         schema:
  *           type: string
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             example: {"product_name": "Test Product", "product_description": "Test Product", "product_type": "Test Product", "product_category": "Test Product", "product_premium": 1000, "product_image": "Test Product", "product_status": "Test Product", "product_duration": 1000, "underwriter": "Test Product", "benefits":{ "last_expense": 50000, "hospital_cash": 10000,"maternity": 10000}}
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const updateProduct = async (req: any, res: any) => {
  try {

    const {
      product_name,
      product_description,
      product_type,
      product_category,
      product_premium,
      product_image,
      product_status,
      product_duration,
      underwriter,
      benefits
    } = req.body;


    let product = await Product.findAll({

      where: {
        product_id: req.params.product_id
      }
    })
    if (!product) {
      return res.status(404).json({ status: "FAILED", message: "No product found" });
    }

    const data: Product = {
      product_name: product_name,
      product_description: product_description,
      product_type: product_type,
      product_category: product_category,
      product_premium: product_premium,
      product_image: product_image,
      product_status: product_status,
      product_duration: product_duration,
      underwriter: underwriter,
      benefits: benefits

    };
    //saving the product
    await Product.update(data, {
      where: {
        id: req.params.product_id,
      },
    });

    return res.status(201).json({
      result: {
        code: 200,
        status: "OK", message: "Product updated successfully"
      }
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      code: 500,
      status: "FAILED", message: "Internal server error", error: error
    });
  }
}

/**
  * @swagger
  * /api/v1/products/{product_id}:
  *   delete:
  *     tags:
  *       - Products
  *     description: Delete products by product_id
  *     operationId: deleteProductsByProductID
  *     summary: Delete products
  *     security:
  *       - ApiKeyAuth: []
  *     parameters:
  *       - name: product_id
  *         in: path
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Information fetched succussfuly
  *       400:
  *         description: Invalid request
  */
const deleteProduct = async (req: any, res: any) => {
  try {
    await Product.destroy({
      where: {
        id: req.params.product_id,
      },
    });

    return res.status(201).json({
      result: {
        code: 200,
        status: "OK", message: "Product deleted successfully"
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error", error: error
    });

  }
}



module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
}






