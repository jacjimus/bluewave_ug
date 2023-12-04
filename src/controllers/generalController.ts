const multer = require('multer');
const AWS = require('aws-sdk');
import { v4 as uuidv4 } from 'uuid';



const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1',
});

/**
 * @swagger
 * /api/v1/documents/upload:
 *   post:
 *     tags:
 *       - Documents
 *     description: Upload a document
 *     operationId: uploadDocument
 *     summary: 
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: 'No file uploaded' });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ code: 400, message: 'Invalid file' });
    }

    const filename = `${uuidv4()}_${req.file.originalname}`;

    const params = {
      Bucket: 'bluwavebucket',
      Key: filename,
      Body: req.file.buffer,
      ACL: 'public-read', // Set the ACL to make the uploaded file publicly accessible
    };

    const uploadResult = await s3.upload(params).promise();

    const fileUrl = uploadResult.Location;

    return res.json({ code: 200, message: 'File uploaded successfully', fileUrl });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ code: error.code || 500, message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  uploadDocument,
};
