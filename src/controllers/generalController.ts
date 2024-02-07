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
 * /api/v1/generals/documents/upload:
 *   post:
 *     tags:
 *       - General
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
const uploadDocument = async (req: any, res) => {
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

/**
 * @swagger
 * /api/v1/generals/faqs:
 *   get:
 *     tags:
 *       - General
 *     description: Fetch FAQS
 *     operationId: faqs
 *     summary: 
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const getFaqs = async (req: any, res) => {
  try {
    const faqs = [

      {
        question: "Eligibility",
        answer: " Persons between the ages of 18 and 65 are eligible to purchase Medical cover Policy."
      },
      {
        question: "Bamba cover",
        answer: " You get KShs 4,500 / night of hospitalisation up to a Maximum of 30 days after one day of being hospitalized. "
      },
      {
        question: "AfyaShua Zidi Cover",
        answer: "You get Inpatient for KShs 300,000 and Maternity for KShs 100,000 Can cover up to 6 dependents."
      },
      {
        question: "AfyaShua Smarta cover",
        answer: "You get Inpatient for KShs 400,000, Outpatient for 30,000 and Maternity for Kshs 100,0000. Can cover up to 6 dependents."
      },
      {
        question: "Waiting period",
        answer: "1. No waiting period on Accident cases 2.  (30)-day waiting period on illness treatment 3. 10-months waiting period on maternity and pre-existing conditions"
      },
      {
        question: "Waiting period meaning",
        answer: "This refers to a specified period during which you are not eligible for coverage of certain benefits or services."
      },
      {
        question: "When to make claim",
        answer: "Admission and treatment claims will be paid directly to the hospital "
      },
      {
        question: "Treatment Claim",
        answer: "Admission and treatment claims will be paid directly to the hospital"
      },
      {
        question: "Hospital Cash Claim",
        answer: "Hospital cash benefits will be paid to the insured upon discharge from the hospitall"
      },

      {
        question: "Renewal",
        answer: "Premiums are either paid monthly or on annual basis. Premium due notices will be send to you via SMS on your Airtel Line.."
      },
      {
        question: "Insured Name",
        answer: "The insured is the Person who is registerd on the Airtel Money SIM, their chosen dependents or the persons who the Subscriber has purchased cover for.."
      }
    ]
    return res.json({ code: 200, message: 'FAQs fetched successfully', faqs });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ code: error.code || 500, message: 'Internal server error', error: error.message });
  }

}


/**
 * @swagger
 * /api/v1/generals/privacy-policy:
 *   get:
 *     tags:
 *       - General
 *     description: Fetch Privacy Policy
 *     operationId: getPrivacyPolicy
 *     summary: 
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const getPrivacyPolicy = async (req: any, res) => {
  try {
    const privacyPolicy = `This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from www.bluwave.co.ke (the “Site”).`
    return res.json({ code: 200, message: 'Privacy Policy fetched successfully', privacyPolicy });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ code: error.code || 500, message: 'Internal server error', error: error.message });
  }

}

/**
 * @swagger
 * /api/v1/generals/terms-and-conditions:
 *   get:
 *     tags:
 *       - General
 *     description: Fetch Terms and Conditions
 *     operationId: getTermsAndConditions
 *     summary: 
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Information fetched successfully
 *       400:
 *         description: Invalid request
 */
const getTermsAndConditions = async (req: any, res) => {
  try {
    const termsAndConditions = 'https://rb.gy/g4hyk';
    return res.json({ code: 200, message: 'Terms and Conditions fetched successfully', link: termsAndConditions });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ code: error.code || 500, message: 'Internal server error', error: error.message });
  }

}





module.exports = {
  uploadDocument,
  getFaqs,
  getPrivacyPolicy,
  getTermsAndConditions

};
