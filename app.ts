import express from 'express';
const cookieParser = require('cookie-parser');
const userRoutes = require ('./src/routes/userRoutes');
const policyRoutes = require ('./src/routes/policyRoutes');
const paymentRoutes = require ('./src/routes/paymentRoutes');
const claimRoutes = require ('./src/routes/claimRoutes');
const ussdRoutes = require ('./src/routes/ussdRoutes');
const reportRoutes = require ('./src/routes/reportRoutes');
const productRoutes = require ('./src/routes/productRoutes');
const  generalRoutes = require ('./src/routes/generalRoutes');
import * as dotenv from 'dotenv'
dotenv.config()
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
import cors from 'cors';
import mongoose from 'mongoose';
 

const app: express.Application = express();
app.disable('etag').disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(cors());
  

// log only 4xx and 5xx responses to console
app.use(morgan('dev', {
    skip: function (req:any, res:any) { return res.statusCode < 400 }
  }))
   
  // log all requests to access.log
  app.use(morgan('common', {
    stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
  }))

  const mongoURI = 'mongodb+srv://dickens:ugPUWKvrnAuiTs8@cluster0.yeyah.mongodb.net/bluewavedb?retryWrites=true&w=majority';

  // Connect to MongoDB
  mongoose.connect(mongoURI);
  
  // Get the default connection
  const db = mongoose.connection;
  
  // Event listeners for MongoDB connection
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', () => {
    console.log('Connected to Bluewave MongoDB');
    // Start your application or perform other operations here
  });
// Swagger configuration options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BLUEWAVE API Documentation',
      version: '1.0.0',
      description: 'BLUEWAVE API Documentation',
    },
    components: {
      securitySchemes: {
          ApiKeyAuth: {
              scheme: "bearer",
              type: "http"
          }
      }
  },
  },
  // List of files containing API routes to be documented
  apis: ['./src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


  const errorHandler = (error:any, req:any, res:any, next:any) => {
    // Error handling middleware functionality
    console.log( `error ${error.message}`) // log the error
    const status = error.status || 400
    // send back an easily understandable error message to the caller
    res.status(status).send(error.message)
  }
  



//route health check

app.get('/status', (req:any, res:any) => res.send({status: "I'm up and running"}));



//routes for the user API
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/policies', policyRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/claims', claimRoutes)
app.use('/api/v1/reports', reportRoutes)
app.use('/api/v1/products', productRoutes)
app.use('/api/v1/documents', generalRoutes)
app.use(errorHandler)

// USSD ROUTE
app.use('/api/v1/ussd', ussdRoutes);


const port =  process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening at port ${port}`));