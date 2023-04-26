"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const dotenv = __importStar(require("dotenv")); // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const app = (0, express_1.default)();
app.disable('etag').disable('x-powered-by');
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(cookieParser());
// log only 4xx and 5xx responses to console
app.use(morgan('dev', {
    skip: function (req, res) { return res.statusCode < 400; }
}));
// log all requests to access.log
app.use(morgan('common', {
    stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
}));
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
