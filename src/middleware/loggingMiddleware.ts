
import jwt from 'jsonwebtoken';

export const loggingMiddleware = async (req: any, res: any, next: any) => {
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
    console.error('Logging error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


