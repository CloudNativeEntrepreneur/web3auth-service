import os from "os";
import path from "path";

const clientId = process.env.CLIENT_ID || "web3-auth-client";
const clientSecret =
  process.env.CLIENT_SECRET ||
  "replace me with random characters, like a guid, or a few, at least 32 characters";

export const config = {
  clientId,
  jwt: {
    algorithms: ["HS256" as const],
    secret: clientSecret,
  },
  publicURI: process.env.PUBLIC_URI || "http://localhost:8000/",
  database: {
    sqlite: {
      name: "web3auth",
      username: "",
      password: undefined,
      sequelize: {
        dialect: "sqlite",
        storage: path.join(os.tmpdir(), "db.sqlite"),
        logging: false,
      },
    },
  },
};
