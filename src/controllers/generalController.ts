const multer = require('multer');
const fs = require('fs');
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
const {db} = require('../models/db');
const Log = db.logs;



const s3 = new AWS.S3({
  // Configure your AWS credentials and region
  accessKeyId: 'AKIA2I7W2PK6V4YN27X7',
  secretAccessKey: 'DqHui4wiO12MRR3sjcc3xYbAUC2DZXLpAeyygZaC',
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
const uploadDocument = async (req: any, res: any) => {
  try {

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Access the uploaded file using req.file
    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ message: 'Invalid file' });
    }
    // Generate a unique filename for the uploaded image
    const filename = `${uuidv4()}_${req.file.originalname}`;

    // Prepare parameters for S3 upload
    const params = {
      Bucket: 'bluwavebucket',
      Key: filename,
      Body: req.file.buffer,
      //ACL: 'public-read', // Set the ACL to make the uploaded file publicly accessible
    };

    // Upload the file to S3
    const uploadResult = await s3.upload(params).promise();

    // Return the URL of the uploaded file
    const fileUrl = uploadResult.Location;
    await Log.create({
      log_id: uuidv4(),
      timestamp: new Date(),
      message: 'File uploaded successfully',
      level: 'info',
      user: req.user.user_id,
      partner_id: req.user.partner_id,
  });

    return res.json({ message: 'File uploaded successfully', fileUrl });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error', error: error });
  }
};


// Use the multer middleware to handle file uploads

module.exports = {
  uploadDocument
}