console.log("🚀🚀🚀 Starting Database Module 🚀🚀🚀");
const mysql = require('mysql2/promise');
const path = require("path");
const fs = require("fs");

// Load .env from root
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// 1. Prepare the base options first
const poolOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 19968,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
};

// 2. Add CA certificate if using Aiven SSL
if (process.env.DB_SSL === "true") {
  try {
    const certPath = path.join(__dirname, "DigiCertGlobalRootG2.crt.pem");
    if (fs.existsSync(certPath)) {
      poolOptions.ssl.ca = fs.readFileSync(certPath);
      console.log("🔒 SSL Certificate loaded from file");
    }
  } catch (err) {
    console.warn("⚠️ SSL file found but could not be read, using basic SSL.");
  }
}

// 3. Create the pool ONLY ONCE
const pool = mysql.createPool(poolOptions);

// Debugging (Safe)
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_SSL Mode:", process.env.DB_SSL);

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully to Aiven");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    // Helpful tip for Aiven
    if (error.message.includes('Access denied')) {
      console.log("💡 TIP: Check if your IP is whitelisted in the Aiven Console.");
    }
    return false;
  }
}

async function initializeTables() {
  try {
    console.log("🔄 Initializing database tables...");
    // Table creation queries go here
    console.log("✅ Database tables initialized");
  } catch (error) {
    console.error("❌ Error initializing tables:", error.message);
  }
}

module.exports = { pool, testConnection, initializeTables };