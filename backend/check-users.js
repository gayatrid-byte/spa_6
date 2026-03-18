require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('./config/database');

async function checkUsers() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables:', tables);

    try {
      const [users] = await pool.query('SELECT id, name, email, role, password FROM users');
      console.log('Users:', users);
    } catch (err) {
      console.log('Users table query error:', err.message);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkUsers();
