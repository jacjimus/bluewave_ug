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
const node_cron_1 = __importDefault(require("node-cron"));
const crons_1 = require("./src/services/crons");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv = __importStar(require("dotenv"));
const playground_1 = require("./src/services/playground");
const morgan_1 = __importDefault(require("morgan"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const index_1 = __importDefault(require("./src/routes/index"));
const helmet_1 = __importDefault(require("helmet"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const loggingMiddleware_1 = require("./src/middleware/loggingMiddleware");
const body_parser_1 = __importDefault(require("body-parser"));
dotenv.config();
const app = (0, express_1.default)();
app.disable("etag").disable("x-powered-by");
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
app.use((0, helmet_1.default)());
app.use(body_parser_1.default.json({ limit: '1mb' }));
app.use((0, morgan_1.default)("dev", {
    skip: function (req, res) {
        return res.statusCode < 400;
    },
}));
const rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 100,
    duration: 1, // per 1 second by IP
});
app.use((req, res, next) => {
    rateLimiter
        .consume(req.ip)
        .then(() => {
        next();
    })
        .catch(() => {
        console.log('Request IP: %s, Allowed: %s, Url: %s', req.ip, false, req.url);
        res.status(429).send("Too Many Requests");
    });
});
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
    apis: ["./src/controllers/*.ts"],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
const errorHandler = (error, req, res, next) => {
    console.log(`error ${error.message}`);
    const status = error.status || 400;
    res.status(status).send(error.message);
};
app.get("/", (req, res) => res.send({ status: "I'm up and running - Bluewave Insurance" }));
app.use("/api/v1", index_1.default);
app.use(loggingMiddleware_1.loggingMiddleware);
app.use(errorHandler);
node_cron_1.default.schedule("0 8 * * *", () => {
    console.log("Running a task every day at 8 AM");
    (0, crons_1.sendPolicyRenewalReminder)();
});
(0, playground_1.playground)();
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening at port ${port}`));
