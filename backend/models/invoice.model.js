const { pool } = require('../config/database');

class Invoice {
  static async getAll(salonId, filters = {}) {
    try {
      let query = `
        SELECT i.*, c.name as customer_name, c.phone as customer_phone
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.salon_id = ?
      `;
      const params = [salonId];

      if (filters.status) {
        query += ' AND i.status = ?';
        params.push(filters.status);
      }

      if (filters.dateFrom) {
        query += ' AND i.invoice_date >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        query += ' AND i.invoice_date <= ?';
        params.push(filters.dateTo);
      }

      query += ' ORDER BY i.invoice_date DESC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error getting invoices: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM invoices WHERE id = ?',
        [id]
      );
      
      if (rows[0]) {
        // Get invoice items
        const [items] = await pool.query(
          'SELECT * FROM invoice_items WHERE invoice_id = ?',
          [id]
        );
        rows[0].items = items;
      }
      
      return rows[0];
    } catch (error) {
      throw new Error(`Error getting invoice: ${error.message}`);
    }
  }

  static async create(invoiceData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        'INSERT INTO invoices (salon_id, customer_id, invoice_date, subtotal, tax, discount, total, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [invoiceData.salon_id, invoiceData.customer_id, invoiceData.invoice_date, invoiceData.subtotal, invoiceData.tax || 0, invoiceData.discount || 0, invoiceData.total, invoiceData.status || 'pending', invoiceData.notes]
      );

      const invoiceId = result.insertId;

      // Add invoice items
      if (invoiceData.items && invoiceData.items.length > 0) {
        for (const item of invoiceData.items) {
          await connection.query(
            'INSERT INTO invoice_items (invoice_id, service_id, description, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)',
            [invoiceId, item.service_id, item.description, item.quantity, item.price, item.total]
          );
        }
      }

      await connection.commit();
      return invoiceId;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error creating invoice: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async update(id, invoiceData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update invoice
      await connection.query(
        'UPDATE invoices SET customer_id = ?, invoice_date = ?, subtotal = ?, tax = ?, discount = ?, total = ?, status = ?, notes = ? WHERE id = ?',
        [invoiceData.customer_id, invoiceData.invoice_date, invoiceData.subtotal, invoiceData.tax, invoiceData.discount, invoiceData.total, invoiceData.status, invoiceData.notes, id]
      );

      // Delete existing items
      await connection.query(
        'DELETE FROM invoice_items WHERE invoice_id = ?',
        [id]
      );

      // Add new items
      if (invoiceData.items && invoiceData.items.length > 0) {
        for (const item of invoiceData.items) {
          await connection.query(
            'INSERT INTO invoice_items (invoice_id, service_id, description, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)',
            [id, item.service_id, item.description, item.quantity, item.price, item.total]
          );
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error updating invoice: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async updateStatus(id, status) {
    try {
      const [result] = await pool.query(
        'UPDATE invoices SET status = ? WHERE id = ?',
        [status, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating invoice status: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Delete invoice items
        await connection.query(
          'DELETE FROM invoice_items WHERE invoice_id = ?',
          [id]
        );

        // Delete invoice
        const [result] = await connection.query(
          'DELETE FROM invoices WHERE id = ?',
          [id]
        );

        await connection.commit();
        return result.affectedRows > 0;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw new Error(`Error deleting invoice: ${error.message}`);
    }
  }
}

module.exports = Invoice;