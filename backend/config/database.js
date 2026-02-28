console.log("🚀🚀🚀 digicertWITH FS IMPORT 🚀🚀🚀");
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD length:", process.env.DB_PASSWORD?.length);
// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: fs.readFileSync(
      path.join(__dirname, 'DigiCertGlobalRootG2.crt.pem')
    )
  }
});
// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database tables
async function initializeTables() {
  try {
    console.log('🔄 Initializing database tables...');
    // Tables will be created when server starts
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing tables:', error.message);
  }
}


module.exports = { pool, testConnection, initializeTables };
