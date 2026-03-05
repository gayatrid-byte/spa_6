console.log("🚀🚀🚀 Starting Database Module 🚀🚀🚀");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs"); // Added missing fs module

// Fix 1: Point to the .env file in the root folder
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Debugging
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD length:", process.env.DB_PASSWORD?.length);

const poolOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false // Required for Aiven
  }
};

// Only try to read the CA file if SSL is explicitly set to true in .env
if (process.env.DB_SSL === "true") {
  try {
    poolOptions.ssl = {
      ca: fs.readFileSync(path.join(__dirname, "DigiCertGlobalRootG2.crt.pem")),
    };
    console.log("🔒 SSL Certificate loaded");
  } catch (err) {
    console.error("⚠️ Could not find SSL certificate file, falling back to basic SSL");
  }
}

const pool = mysql.createPool(poolOptions);

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully to Aiven");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

// Initialize database tables
async function initializeTables() {
  try {
    console.log("🔄 Initializing database tables...");
    // Your table creation logic goes here
    console.log("✅ Database tables initialized");
  } catch (error) {
    console.error("❌ Error initializing tables:", error.message);
  }
}

// Move all exports to the bottom
module.exports = { pool, testConnection, initializeTables };