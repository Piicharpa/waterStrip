// backend/db/client.ts
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Pool } from "pg";
// import { connectionString } from "./utils";
import { pgConfig } from "./utils";

// const pool = new Pool(pgConfig);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ✅ ใช้ตัวเดียวครบ
});

export const dbClient = drizzle(pool, {
  schema,
  logger: true,
});
