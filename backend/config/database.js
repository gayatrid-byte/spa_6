console.log("🚀🚀🚀 Starting Database Module 🚀🚀🚀");
const mysql = require('mysql2/promise');
const path = require("path");
const fs = require("fs");

// Since the .env is in the 'backend' folder and this file is in 'backend/config',
// we go exactly one level up.
const envPath = path.join(__dirname, "..", ".env");

console.log("🔍 Looking for .env at:", envPath);

if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    console.log("✅ .env file found and loaded");
} else {
    console.error("❌ Still cannot find .env at:", envPath);
}

// Prepare options
const poolOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 19968,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Aiven specific SSL requirement
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
};

// Add CA certificate if available
if (process.env.DB_SSL === "true") {
    const certPath = path.join(__dirname, "DigiCertGlobalRootG2.crt.pem");
    if (fs.existsSync(certPath)) {
        poolOptions.ssl.ca = fs.readFileSync(certPath);
        console.log("🔒 SSL Certificate loaded");
    }
}

// Create the pool ONLY ONCE
const pool = mysql.createPool(poolOptions);

// Debugging logs
console.log("DB_USER:", process.env.DB_USER || "NOT FOUND");
console.log("DB_SSL Mode:", process.env.DB_SSL || "NOT FOUND");

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Database connected successfully to Aiven");
        connection.release();
        return true;
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        if (error.message.includes('Access denied')) {
            console.log("💡 TIP: Add your IP (103.234.212.128) to Aiven's 'Allowed IP addresses'.");
        }
        return false;
    }
}

async function initializeTables() {
    try {
        console.log("🔄 Initializing database tables...");
        // Your SQL queries here
        console.log("✅ Database tables initialized");
    } catch (error) {
        console.error("❌ Error initializing tables:", error.message);
    }
}

module.exports = { pool, testConnection, initializeTables };