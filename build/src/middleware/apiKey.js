const { v4: uuidv4 } = require('uuid');
const userApiKeys = new Map();
const genAPIKey = () => {
    //create a base-36 string that contains 30 chars in a-z,0-9
    return [...Array(30)]
        .map((e) => ((Math.random() * 36) | 0).toString(36))
        .join('');
};
// Middleware to validate API keys
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.header("x-api-key");
    if (!apiKey || !userApiKeys.has(apiKey)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};
module.exports = {
    genAPIKey,
    apiKeyMiddleware,
};
