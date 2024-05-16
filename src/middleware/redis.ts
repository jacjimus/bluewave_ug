const Redis = require('ioredis');
const dotenv = require("dotenv");
dotenv.config();

let redisClient;

const redisURL = process.env.REDIS_URI;

if (redisURL) {
  try {
    // create the Redis client object
    redisClient = new Redis(redisURL);
    
    // Handle successful connection
    redisClient.on('connect', () => {
      console.log(`Connected to Redis successfully!`);
    });

    // Handle connection errors
    redisClient.on('error', (error) => {
      console.error(`Connection to Redis failed with error:`);
      console.error(error);
    });
  } catch (e) {
    console.error(`Failed to create Redis client with error:`);
    console.error(e);
  }
} else {
  console.error('REDIS_URI is not defined in the environment variables.');
}

module.exports = redisClient;
