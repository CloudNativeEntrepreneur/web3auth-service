import express from "express";
import jwt from "express-jwt";
import basicAuth from "express-basic-auth";
import { config } from "../../config.js";
import * as controller from "./controller.js";

export const userRouter = express.Router();

/** GET /api/users */
userRouter.route("/").get(
  basicAuth({
    users: { [config.clientId]: config.jwt.secret },
  }),
  controller.find
);

/** GET /api/users/:address */
/** Authenticated route */
userRouter.route("/:address").get(jwt(config.jwt), controller.get);

/** POST /api/users */
userRouter.route("/").post(
  basicAuth({
    users: { [config.clientId]: config.jwt.secret },
  }),
  controller.create
);

/** PATCH /api/users/:address */
/** Authenticated route */
userRouter.route("/:address").patch(jwt(config.jwt), controller.patch);
