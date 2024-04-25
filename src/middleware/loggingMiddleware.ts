
import jwt from 'jsonwebtoken';
import winston from "winston";

 const loggingMiddleware = async (req: any, res: any, next: any) => {
  try {
    const operationType = `${req.method} ${req.originalUrl}`;
    const details = {
      requestBody: req.body,
      queryParameters: req.query,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer,
    };

    const token = req.cookies.jwt;

    if (token) {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      const { user_id: userId, partner_id: partnerId, role } = user;
      console.log('user', user);

      req.user = { userId, partnerId, role };
    }

    console.log(
      `Operation: ${operationType} Details: ${JSON.stringify(details)}`
    );
    next();
  } catch (error) {
   logger.error(`Error: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const { combine, timestamp, json } = winston.format;

const logger = winston.createLogger({
  level: 'http',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD hh:mm:ss.SSS A',
    }),
    json()
  ),
  transports: [new winston.transports.Console()],
});



export { loggingMiddleware, logger };


