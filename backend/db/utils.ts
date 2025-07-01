import 'dotenv/config'; 

// const dbUser = process.env.POSTGRES_APP_USER;
// const dbPassword = process.env.POSTGRES_APP_PASSWORD;
// const dbHost = process.env.POSTGRES_HOST;
// const dbPort = process.env.POSTGRES_PORT;
// const dbName = process.env.POSTGRES_DB;

// console.log({
//   dbUser,
//   dbPassword,
//   dbHost,
//   dbPort,
//   dbName,
// });

// if (!dbUser || !dbPassword || !dbHost || !dbName || !dbName) {
//   throw new Error("Invalid DB env.");
// }

// export const connectionString = process.env.DATABASE_URL!;
// console.log("✅ DATABASE_URL:", connectionString);

export const pgConfig = {
  host: process.env.PG_HOST!,
  port: parseInt(process.env.PG_PORT!),
  user: process.env.PG_USER!,
  password: process.env.PG_PASS!,
  database: process.env.PG_DB!,
  ssl: {
    rejectUnauthorized: false,
  },
  family: 4,
};
