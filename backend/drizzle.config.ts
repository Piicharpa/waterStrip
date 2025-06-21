require("dotenv/config");
const { defineConfig } = require("drizzle-kit");
const { connectionString } = require("./db/utils");

module.exports = defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "db/migration",
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
});
