import express from "express";

import { authRouter } from "./auth/index.js";
import { userRouter } from "./users/index.js";

export const services = express.Router();

services.use("/auth", authRouter);
services.use("/users", userRouter);
