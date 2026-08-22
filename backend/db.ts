import { Client } from "pg";

async function dbHelloWorld() {
  const client = await new Client({
    user: process.env.DATABASE_USER,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    host: process.env.DATABASE_HOST,
  }).connect();

  const res = await client.query("SELECT $1::text as message", ["Hello chud!"]);
  console.log("From db: " + res.rows[0].message);
  await client.end();
}

export { dbHelloWorld };
