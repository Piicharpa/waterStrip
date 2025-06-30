// backend/db/client.ts
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Pool } from "pg";
import { connectionString } from "./utils";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const dbClient = drizzle(pool, {
  schema,
  logger: true,
});
