const {db} = require('../models/db');
import { v4 as uuidv4 } from 'uuid';
const jwt = require('jsonwebtoken');
const Log = db.logs;

const loggingMiddleware = async (req: any, res: any, next: any) => {
  try {
      // Gather information for the log
      const operationType = `${req.method} ${req.originalUrl}`;
      const details = {
        requestBody: req.body,
        queryParameters: req.query,
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        referer: req.headers.referer,
      };
      
      // Get user information from JWT token
      const token = req.cookies.jwt; // Use req.cookies to get cookies
      const user = jwt.verify(token, process.env.JWT_SECRET);
      
      const userId = user.id;
      const partnerId = user.partner_id;
      const role = user.role;
      // Create a log entry
      // await Log.create({
      //     log_id: uuidv4(),
      //     timestamp: new Date(),
      //     message: `${role} ${userId} performed operation ${operationType}`,
      //     level: 'info',
      //     meta: details,
      //     user: userId,
      //     session: req.session?.id,
      //     partner_id: partnerId,
      // });

      next();
  } catch (error) {
      console.error('Logging error:', error);
      next(); // Continue processing the request even if logging fails
  }
};


  
  module.exports = loggingMiddleware;

