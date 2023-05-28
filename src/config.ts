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
    sync: process.env.DATABASE_SYNC === "true" ? true : false,
    postgres: {
      name: process.env.PG_DATABASE || "web3auth",
      username: process.env.PG_USER || "web3auth",
      password: process.env.PG_PASS || "web3auth",
      sequelize: {
        dialect: "postgres",
        logging: true,
        port: parseInt(process.env.PG_PORT || "", 10) || 5432,
        host:
          process.env.PG_HOST ||
          "web3auth-db-postgresql.example-local-env.svc.cluster.local",
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

  bus: {
    aggregates: {
      web3auth: {
        events:
          process.env.WEB3AUTH_EVENTS_BROKER_URL ||
          "http://broker-ingress.knative-eventing.svc.cluster.local/example-local-env/web3auth-events",
      },
    },
    source: "web3auth-service",
  },

  expirations: {
    accessToken: process.env.EXPIRATION_ACCESS_TOKEN || "30m",
    idToken: process.env.EXPIRATION_ID_TOKEN || "30d",
    refreshToken: process.env.EXPIRATION_REFRESH_TOKEN || "30d",
  },
};
