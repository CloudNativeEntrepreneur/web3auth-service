import express from "express";
// import jwt from "express-jwt";
import basicAuth from "express-basic-auth";
import pino from "pino";
import pinoLoggerMiddleware from "express-pino-logger";
import { config } from "../../config.js";
import * as controller from "./controller.js";

const logger = pino({
  name: config.clientId,
});
const pinoLogger = pinoLoggerMiddleware({ logger });

export const authRouter = express.Router();
authRouter.use(pinoLogger);

/** POST /api/auth */
authRouter.route("/").post(
  basicAuth({
    users: { [config.clientId]: config.jwt.secret },
  }),
  controller.create
);

authRouter.route("/token").post(
  basicAuth({
    users: { [config.clientId]: config.jwt.secret },
  }),
  controller.refreshToken
);
