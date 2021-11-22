import express from "express";
import jwt from "express-jwt";
import { config } from "../../config";
import * as controller from "./controller";

export const userRouter = express.Router();

/** GET /api/users */
userRouter.route("/").get(controller.find);

/** GET /api/users/:publicAddress */
/** Authenticated route */
userRouter.route("/:publicAddress").get(jwt(config.jwt), controller.get);

/** POST /api/users */
userRouter.route("/").post(controller.create);

/** PATCH /api/users/:publicAddress */
/** Authenticated route */
userRouter.route("/:publicAddress").patch(jwt(config.jwt), controller.patch);
