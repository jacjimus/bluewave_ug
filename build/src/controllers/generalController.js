"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer = require('multer');
const fs = require('fs');
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const uuid_1 = require("uuid");
const { db } = require('../models/db');
const Log = db.logs;
const s3 = new aws_sdk_1.default.S3({
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
const uploadDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Access the uploaded file using req.file
        if (!req.file.buffer || req.file.buffer.length === 0) {
            return res.status(400).json({ message: 'Invalid file' });
        }
        // Generate a unique filename for the uploaded image
        const filename = `${(0, uuid_1.v4)()}_${req.file.originalname}`;
        // Prepare parameters for S3 upload
        const params = {
            Bucket: 'bluwavebucket',
            Key: filename,
            Body: req.file.buffer,
            //ACL: 'public-read', // Set the ACL to make the uploaded file publicly accessible
        };
        // Upload the file to S3
        const uploadResult = yield s3.upload(params).promise();
        // Return the URL of the uploaded file
        const fileUrl = uploadResult.Location;
        yield Log.create({
            log_id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            message: 'File uploaded successfully',
            level: 'info',
            user: req.user.user_id,
            partner_id: req.user.partner_id,
        });
        return res.json({ message: 'File uploaded successfully', fileUrl });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', error: error });
    }
});
// Use the multer middleware to handle file uploads
module.exports = {
    uploadDocument
};
