#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { Client } = require("pg");

const envFiles = [
  path.resolve(__dirname, "../backend/.env"),
  path.resolve(__dirname, "../frontend/.env"),
];
for (const file of envFiles) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file, override: true });
  } else {
    console.warn(`[inject] warning: env file not found, skipping: ${file}`);
  }
}

const query = process.argv[2];
if (!query) {
  console.error('Usage: npm run inject -- "select * from groups;"');
  process.exit(1);
}

const config = {
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
};
async function main() {
  const client = new Client(config);
  await client.connect();

  try {
    console.log(`[inject] running query: ${query}`);
    const result = await client.query(query);

    if (Array.isArray(result)) {
      // multiple statements (multi-command query)
      result.forEach((r, i) => {
        console.log(`\n-- result set ${i + 1} --`);
        console.table(r.rows);
      });
    } else if (result.rows && result.rows.length) {
      console.table(result.rows);
    } else {
      console.log(`[inject] OK. rowCount: ${result.rowCount}`);
    }
  } catch (err) {
    console.error("[inject] query failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[inject] fatal error:", err);
  process.exit(1);
});