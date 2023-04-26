import express from 'express';
const cookieParser = require('cookie-parser');
const userRoutes = require ('./src/routes/userRoutes');
const policyRoutes = require ('./src/routes/policyRoutes');
const paymentRoutes = require ('./src/routes/paymentRoutes');
const claimRoutes = require ('./src/routes/claimRoutes');
const ussdRoutes = require ('./src/routes/ussdRoutes');
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
 


 


const app: express.Application = express();
app.disable('etag').disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

// log only 4xx and 5xx responses to console
app.use(morgan('dev', {
    skip: function (req:any, res:any) { return res.statusCode < 400 }
  }))
   
  // log all requests to access.log
  app.use(morgan('common', {
    stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
  }))
  

//synchronizing the database and forcing it to false so we dont lose data
// db.sequelize.sync({ force: true }).then(() => {
//     console.log("db has been re sync")
// })


//route health check

app.get('/status', (req:any, res:any) => res.send({status: "I'm up and running"}));



//routes for the user API
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/policies', policyRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/claims', claimRoutes)

// USSD ROUTE
app.use('/api/v1/ussd', ussdRoutes);



const port =  process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening at port ${port}`));