import express from 'express';
const cookieParser = require('cookie-parser');
const userRoutes = require ('./src/routes/userRoutes');
const policyRoutes = require ('./src/routes/policyRoutes');
const paymentRoutes = require ('./src/routes/paymentRoutes');
const claimRoutes = require ('./src/routes/claimRoutes');
const ussdRoutes = require ('./src/routes/ussdRoutes');



const app: express.Application = express();
app.disable('etag').disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())



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