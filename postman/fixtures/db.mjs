// Shared connection helper for the HU-GD-01 fixtures. Development database only.
import mysql from 'mysql2/promise';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

export const TEST_DATA = "name COLLATE utf8mb4_bin REGEXP '^QA(-|[0-9])'";

export async function connect() {
  if (process.env.DB_NAME !== 'sports_db') {
    console.error(`Refusing to run: DB_NAME is "${process.env.DB_NAME}", expected "sports_db".`);
    process.exit(1);
  }
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
}
