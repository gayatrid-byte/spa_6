const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDB() {
  try {
    console.log('Connecting to MySQL server...');
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      multipleStatements: true
    });
    
    console.log('Creating database salon_system_ks...');
    await conn.query('CREATE DATABASE IF NOT EXISTS salon_system_ks;');
    await conn.query('USE salon_system_ks;');
    
    console.log('Running all.sql to setup schema and seeds...');
    const sqlFile = fs.readFileSync(path.join(__dirname, '../database/all.sql'), 'utf-8');
    
    // Disable foreign key checks before running massive sql seed
    await conn.query('SET FOREIGN_KEY_CHECKS=0;');
    await conn.query(sqlFile);
    await conn.query('SET FOREIGN_KEY_CHECKS=1;');
    
    console.log('Database initialized successfully!');
    await conn.end();
  } catch (err) {
    console.error('Database setup failed:', err.message);
    process.exit(1);
  }
}

setupDB();
