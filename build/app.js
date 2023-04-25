"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookieParser = require('cookie-parser');
const userRoutes = require('./src/routes/userRoutes');
const policyRoutes = require('./src/routes/policyRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const claimRoutes = require('./src/routes/claimRoutes');
const ussdRoutes = require('./src/routes/ussdRoutes');
const app = (0, express_1.default)();
app.disable('etag').disable('x-powered-by');
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(cookieParser());
//synchronizing the database and forcing it to false so we dont lose data
// db.sequelize.sync({ force: true }).then(() => {
//     console.log("db has been re sync")
// })
//route health check
app.get('/status', (req, res) => res.send({ status: "I'm up and running" }));
//routes for the user API
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/policies', policyRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/claims', claimRoutes);
// USSD ROUTE
app.use('/api/v1/ussd', ussdRoutes);
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening at port ${port}`));
