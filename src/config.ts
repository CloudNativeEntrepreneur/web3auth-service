import os from "os";
import path from "path";

export const config = {
  jwt: {
    algorithms: ["HS256" as const],
    secret: process.env.CLIENT_SECRET || "replace me with random characters, like a guid, or a few, at least 32 characters", // TODO Put in process.env
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
			}
		}
  },
};
