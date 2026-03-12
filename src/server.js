require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const port = Number.parseInt(process.env.PORT || "3000", 10);

if (Number.isNaN(port)) {
  throw new Error("PORT must be a valid number");
}

async function verifyDatabaseConnection() {
  try {
    const [rows] = await pool.query("SELECT NOW() AS currentTime");

    console.log("DB connected:", rows[0].currentTime);
  } catch (error) {
    console.error("DB connection failed:", error.message);
  }
}

async function startServer() {
  await verifyDatabaseConnection();

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();
