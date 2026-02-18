const { pool } = require('../config/database');

class User {
  static async findByEmail(email) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const [result] = await pool.query(
        'INSERT INTO users (email, password, name, role, salon_id) VALUES (?, ?, ?, ?, ?)',
        [userData.email, userData.password, userData.name, userData.role, userData.salon_id]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async getAll(salonId) {
    try {
      const [rows] = await pool.query(
        'SELECT id, email, name, role, salon_id, created_at FROM users WHERE salon_id = ?',
        [salonId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting all users: ${error.message}`);
    }
  }

  static async update(id, userData) {
    try {
      const [result] = await pool.query(
        'UPDATE users SET name = ?, role = ? WHERE id = ?',
        [userData.name, userData.role, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }
}

module.exports = User;