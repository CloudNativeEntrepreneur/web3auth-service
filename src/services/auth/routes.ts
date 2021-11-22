import express from "express";
import jwt from "express-jwt";
import { config } from "../../config";
import * as controller from "./controller";

export const authRouter = express.Router();

/** POST /api/auth */
authRouter.route("/").post(controller.create);
authRouter.route("/token").post(controller.refreshToken);
