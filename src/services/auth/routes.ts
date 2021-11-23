import express from "express";
// import jwt from "express-jwt";
// import { config } from "../../config";
import pino from "pino";
import pinoLoggerMiddleware from "express-pino-logger";
import * as controller from "./controller";

const logger = pino();
const pinoLogger = pinoLoggerMiddleware({ logger });

export const authRouter = express.Router();
authRouter.use(pinoLogger);

/** POST /api/auth */
authRouter.route("/").post(controller.create);
authRouter.route("/token").post(controller.refreshToken);
