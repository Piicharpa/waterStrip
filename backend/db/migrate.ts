// backend/db/migrate.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
// import { connectionString } from "./utils";

import { pgConfig } from "./utils";

const pool = new Pool(pgConfig);
async function main() {
  const db = drizzle(pool);
  await migrate(db, {
    migrationsFolder: "./db/migration",
    migrationsSchema: "drizzle",
  });
  await pool.end();
}

main();
