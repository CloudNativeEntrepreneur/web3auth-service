/**
 * Server Config.
 */
export const config = {
  jwt: {
    algorithms: ["HS256" as const],
    secret: "696ae31d13bb40e2ae7aa604128d3ca8", // TODO Put in process.env
  },
  publicURI: "http://localhost:8000/",
};
