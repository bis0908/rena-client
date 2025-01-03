import dotenv from "dotenv";
import { getDate } from "../models/common.js";
import mysql from "mysql2/promise";

dotenv.config({ path: "config.env" });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_UID,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  idleTimeout: 60000,
  queueLimit: 0,
});

const executeQuery = async (sql, params = []) => {
  console.log(
    `🔽================================[${getDate()}]=================================🔽`
  );
  console.log(`🔥 / file: dbConfig.js:22 / executeQuery / sql:`, sql);
  console.log("🔥 / file: dbConfig.js:23 / executeQuery / params:", params);
  const stack = new Error().stack
    .split("\n")
    .slice(2, 4)
    .map((stack) => stack.trim())
    .join("\n");
  console.log(
    "🔥 / file: dbConfig.js:30 / executeQuery / Call Stack:\n",
    stack
  );
  try {
    const [rows, fields] = await pool.query(sql, params);
    if (fields !== undefined) {
      console.log("🔥 / file: dbConfig.js:36 / executeQuery / fields:", fields);
    }
    if (rows.length > 0) {
      console.log("🔥 / file: dbConfig.js:39 / executeQuery / rows:", rows);
      console.log(
        "🔥 / file: dbConfig.js:40 / executeQuery / rows[0]:",
        rows[0]
      );
    }
    console.log(
      `🔼==================================[${getDate()}]===============================🔼`
    );
    return rows;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { pool, executeQuery };
