const multer = require('multer');
const fs = require('fs');
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

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
    

    return res.json({ message: 'File uploaded successfully',fileUrl });
  
    //   // Process the uploaded file here
    //   const filePath = req.file.path;
    //   // Perform any necessary operations on the file, such as reading, writing, or saving to a database
  
    //   // Example: Read the contents of the file
    //   const fileContent = fs.readFileSync(filePath, 'utf8');
    //   console.log('File content:', fileContent);
  
    //   // Example: Save the file to a database
    //   const fileData = {
    //     filename: req.file.originalname,
    //     path: req.file.path,
    //     // Add any other relevant information about the file
    //   };
    // //   const savedFile = await FileModel.create(fileData);
    // //   console.log('File saved:', savedFile);
  
      // Example: Respond with success message and the saved file data
     // return res.status(200).json({ message: 'File uploaded successfully', file: fileData });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Internal server error', error: error });
    }
  };
  

// Use the multer middleware to handle file uploads

module.exports = {
    uploadDocument
}