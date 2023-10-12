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
const cookieParser = require("cookie-parser");
const userRoutes = require("./src/routes/userRoutes");
const policyRoutes = require("./src/routes/policyRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const claimRoutes = require("./src/routes/claimRoutes");
const ussdRoutes = require("./src/routes/ussdRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const productRoutes = require("./src/routes/productRoutes");
const generalRoutes = require("./src/routes/generalRoutes");
const logRoutes = require("./src/routes/logRoutes");
const loggingMiddleware = require("./src/middleware/loggingMiddleware");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const fs = require("fs");
const morgan = require("morgan");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const session = require('express-session');
const app = (0, express_1.default)();
app.disable("etag").disable("x-powered-by");
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(session({ secret: "Shh, its a secret!" }));
// log only 4xx and 5xx responses to console
app.use(morgan("dev", {
    skip: function (req, res) {
        return res.statusCode < 400;
    },
}));
// log all requests to access.log
app.use(morgan("common", {
    stream: fs.createWriteStream(path.join(__dirname, "access.log"), {
        flags: "a",
    }),
}));
// Swagger configuration options
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "BLUEWAVE API Documentation",
            version: "1.0.0",
            description: "BLUEWAVE API Documentation",
        },
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    scheme: "bearer",
                    type: "http",
                },
            },
        },
    },
    // List of files containing API routes to be documented
    apis: ["./src/controllers/*.ts"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
// Serve Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
const errorHandler = (error, req, res, next) => {
    // Error handling middleware functionality
    console.log(`error ${error.message}`); // log the error
    const status = error.status || 400;
    // send back an easily understandable error message to the caller
    res.status(status).send(error.message);
};
//route health check
app.get("/status", (req, res) => res.send({ status: "I'm up and running - Bluewave Insurance" }));
//routes for the user API
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/policies", policyRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/claims", claimRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/documents", generalRoutes);
app.use("/api/v1/logs", logRoutes);
app.use(errorHandler);
// USSD ROUTE
app.use("/api/v1/ussd", ussdRoutes);
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening at port ${port}`));
