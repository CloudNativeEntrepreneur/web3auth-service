import "./db.js";

import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { services } from "./services/index.js";

const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(cors());

// Mount REST on /api
app.use("/api", services);

const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("ok");
});

app.listen(port, () =>
  console.log(`Express app listening on localhost:${port}`)
);
