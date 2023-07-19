const { v4: uuidv4 } = require('uuid'); // Import the uuid package and generate unique IDs
const userApiKeys = new Map(); // Map to store user API keys (user ID as the key, API key as the value)
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
