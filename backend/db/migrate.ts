// backend/db/migrate.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
// import { connectionString } from "./utils";

// import { pgConfig } from "./utils";
const pool = new Pool({
  host: "aws-0-ap-southeast-1.pooler.supabase.com",
  port: 5432,
  user: "postgres",
  password: "Nawa_09062546",
  database: "postgres",
  ssl: {
    rejectUnauthorized: false,
  },
});
async function main() {
  const db = drizzle(pool);
  await migrate(db, {
    migrationsFolder: "./db/migration",
    migrationsSchema: "drizzle",
  });
  await pool.end();
}

main();
