const clientId = process.env.CLIENT_ID || "web3auth-client";
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
    sync: process.env.DATABASE_SYNC || false,
    postgres: {
      name: "web3auth",
      username: "web3auth",
      password: process.env.PG_PASS || "web3auth",
      sequelize: {
        dialect: "postgres",
        logging: true,
        port: process.env.PG_PORT || 5432,
      },
    },
    // sqlite: {
    //   name: "web3auth",
    //   username: "",
    //   password: undefined,
    //   sequelize: {
    //     dialect: "sqlite",
    //     storage: path.join(os.tmpdir(), "db.sqlite"),
    //     logging: false,
    //   },
    // },
  },
};
