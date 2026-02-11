const { pool } = require('../config/database');

class Expense {
  static async getAll(salonId, filters = {}) {
    try {
      let query = 'SELECT * FROM expenses WHERE salon_id = ?';
      const params = [salonId];

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.dateFrom) {
        query += ' AND expense_date >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        query += ' AND expense_date <= ?';
        params.push(filters.dateTo);
      }

      query += ' ORDER BY expense_date DESC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error getting expenses: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM expenses WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error getting expense: ${error.message}`);
    }
  }

  static async create(expenseData) {
    try {
      const [result] = await pool.query(
        'INSERT INTO expenses (salon_id, category, amount, description, expense_date, payment_method, receipt_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [expenseData.salon_id, expenseData.category, expenseData.amount, expenseData.description, expenseData.expense_date, expenseData.payment_method, expenseData.receipt_url, expenseData.notes]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating expense: ${error.message}`);
    }
  }

  static async update(id, expenseData) {
    try {
      const [result] = await pool.query(
        'UPDATE expenses SET category = ?, amount = ?, description = ?, expense_date = ?, payment_method = ?, receipt_url = ?, notes = ? WHERE id = ?',
        [expenseData.category, expenseData.amount, expenseData.description, expenseData.expense_date, expenseData.payment_method, expenseData.receipt_url, expenseData.notes, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating expense: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM expenses WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting expense: ${error.message}`);
    }
  }

  static async getCategoryTotals(salonId, startDate, endDate) {
    try {
      const [rows] = await pool.query(
        'SELECT category, SUM(amount) as total FROM expenses WHERE salon_id = ? AND expense_date BETWEEN ? AND ? GROUP BY category ORDER BY total DESC',
        [salonId, startDate, endDate]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting category totals: ${error.message}`);
    }
  }
}

module.exports = Expense;