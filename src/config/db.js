const mysql = require("mysql2/promise");

const dbPort = Number.parseInt(process.env.DB_PORT || "3306", 10);
const connectionLimit = Number.parseInt(
  process.env.DB_CONNECTION_LIMIT || "10",
  10
);

if (Number.isNaN(dbPort)) {
  throw new Error("DB_PORT must be a valid number");
}

if (Number.isNaN(connectionLimit)) {
  throw new Error("DB_CONNECTION_LIMIT must be a valid number");
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: dbPort,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "jp_db",
  waitForConnections: true,
  connectionLimit,
  queueLimit: 0,
});

module.exports = pool;
