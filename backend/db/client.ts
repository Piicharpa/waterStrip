// backend/db/client.ts
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Pool } from "pg";
// import { connectionString } from "./utils";
import { pgConfig } from "./utils";

const pool = new Pool(pgConfig);

export const dbClient = drizzle(pool, {
  schema,
  logger: true,
});
