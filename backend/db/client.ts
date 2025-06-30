// backend/db/client.ts
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Pool } from "pg";
import { connectionString } from "./utils";

const pool = new Pool({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.bddrbvyrfmswpkljffim',
  password: 'Nawa_09062546',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false,
  },
});

export const dbClient = drizzle(pool, {
  schema,
  logger: true,
});
