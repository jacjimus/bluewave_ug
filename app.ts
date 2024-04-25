import express from "express";
import cron from "node-cron";
import { getArrMemberNumberData, sendPolicyRenewalReminder } from "./src/services/cronJobs";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import { playground } from "./src/services/playground";
import morgan from "morgan";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import compression from "compression";
import router from "./src/routes/index"
import helmet from "helmet";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { loggingMiddleware, logger } from "./src/middleware/loggingMiddleware";
import bodyParser from "body-parser";
import { pingAirtel } from "./src/services/payment";



dotenv.config();


const app: express.Application = express();
app.disable("etag").disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(compression());
app.use(helmet());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(
  morgan("dev", {
    skip: function (req: any, res: any) {
      return res.statusCode < 400;
    },
  })
);



const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      // Configure Morgan to use our custom logger with the http severity
      write: (message) => logger.http(message.trim()),
    },
  }
);

app.use(morganMiddleware);

const rateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 1, // per 1 second by IP
});

app.use((req: any, res: any, next: any) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      console.log('Request IP: %s, Allowed: %s, Url: %s', req.ip, false, req.url)
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

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const errorHandler = (error: any, req: any, res: any, next: any) => {
  console.log(`error ${error.message}`);
  const status = error.status || 400;
  res.status(status).send(error.message);
};


app.get("/", (req: any, res: any) =>
  res.send({ status: "I'm up and running - Bluewave Insurance" })
);

app.use("/api/v1", router);

app.use(loggingMiddleware);

app.use(errorHandler);


cron.schedule("0 8 * * *", () => {
  console.log("Running a task every day at 8 AM");
  sendPolicyRenewalReminder();
});

cron.schedule("*/30 * * * *", () => {
  console.log("Running a task every 30 minutes");
  getArrMemberNumberData();
});

/* BACKGROUND JOB 
WILL CALL AIRTEL URL TO WAKE IT UP EVERY 2 MINUTES

 */

// cron.schedule("*/2 * * * *", async () => {
//   console.log("Running a task every 2 minutes");
//   pingAirtel();
// }
// );

playground()

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening at port ${port}`));
