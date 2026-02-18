const { pool } = require('../config/database');
const { generateInvoiceNumber } = require('../utils/settingsStore');

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

      console.log('Executing getAll query:', query, 'params:', params);
      const [rows] = await pool.query(query, params);
      console.log('getAll returned rows:', rows.length);
      
      // Fetch items for each invoice and parse JSON fields
      const invoices = await Promise.all(
        rows.map(async (row) => {
          try {
            const [items] = await pool.query(
              'SELECT * FROM invoice_items WHERE invoice_id = ?',
              [row.id]
            );
            
            console.log(`Fetched ${items.length} items for invoice ${row.id}`);
            
            return {
              ...row,
              booking_ids: row.booking_ids ? (typeof row.booking_ids === 'string' ? JSON.parse(row.booking_ids) : row.booking_ids) : [],
              payment_methods: row.payment_methods ? (typeof row.payment_methods === 'string' ? JSON.parse(row.payment_methods) : row.payment_methods) : [],
              items: items.map(item => ({
                ...item
              }))
            };
          } catch (err) {
            console.error(`Error fetching items for invoice ${row.id}:`, err.message);
            return {
              ...row,
              booking_ids: row.booking_ids ? (typeof row.booking_ids === 'string' ? JSON.parse(row.booking_ids) : row.booking_ids) : [],
              payment_methods: row.payment_methods ? (typeof row.payment_methods === 'string' ? JSON.parse(row.payment_methods) : row.payment_methods) : [],
              items: []
            };
          }
        })
      );
      
      console.log('getAll returning invoices:', invoices.length);
      return invoices;
    } catch (error) {
      console.error('Error in getAll:', error.message);
      throw new Error(`Error getting invoices: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT i.*, c.name as customer_name, c.phone as customer_phone
         FROM invoices i
         LEFT JOIN customers c ON i.customer_id = c.id
         WHERE i.id = ?`,
        [id]
      );
      
      if (rows[0]) {
        // Parse JSON fields
        const invoice = rows[0];
        invoice.booking_ids = invoice.booking_ids ? (typeof invoice.booking_ids === 'string' ? JSON.parse(invoice.booking_ids) : invoice.booking_ids) : [];
        invoice.payment_methods = invoice.payment_methods ? (typeof invoice.payment_methods === 'string' ? JSON.parse(invoice.payment_methods) : invoice.payment_methods) : [];
        
        // Get invoice items
        const [items] = await pool.query(
          'SELECT * FROM invoice_items WHERE invoice_id = ?',
          [id]
        );
        
        // Parse booking_ids in each item
        invoice.items = items.map(item => ({
          ...item
        }));
        
        return invoice;
      }
      
      return null;
    } catch (error) {
      throw new Error(`Error getting invoice: ${error.message}`);
    }
  }

  static async create(invoiceData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();

      const queryValues = [
        invoiceData.salon_id,
        invoiceNumber,
        invoiceData.customer_id,
        invoiceData.invoice_date,
        invoiceData.subtotal,
        invoiceData.tax || 0,
        invoiceData.discount || 0,
        invoiceData.total,
        invoiceData.status || 'pending',
        invoiceData.notes,
        JSON.stringify(invoiceData.booking_ids || []),
        JSON.stringify(invoiceData.payment_methods || [])
      ];

      console.log('Invoice create query values:', queryValues);
      console.log('Invoice data received:', invoiceData);

      const [result] = await connection.query(
        'INSERT INTO invoices (salon_id, invoice_number, customer_id, invoice_date, subtotal, tax, discount, total, status, notes, booking_ids, payment_methods) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        queryValues
      );

      const invoiceId = result.insertId;

      // Add invoice items
      if (invoiceData.items && invoiceData.items.length > 0) {
        for (const item of invoiceData.items) {
          console.log(`Inserting item: ${item.description}`);
          
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
        'UPDATE invoices SET customer_id = ?, invoice_date = ?, subtotal = ?, tax = ?, discount = ?, total = ?, status = ?, notes = ?, booking_ids = ?, payment_methods = ? WHERE id = ?',
        [
          invoiceData.customer_id,
          invoiceData.invoice_date,
          invoiceData.subtotal,
          invoiceData.tax,
          invoiceData.discount,
          invoiceData.total,
          invoiceData.status,
          invoiceData.notes,
          JSON.stringify(invoiceData.booking_ids || []),
          JSON.stringify(invoiceData.payment_methods || []),
          id
        ]
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