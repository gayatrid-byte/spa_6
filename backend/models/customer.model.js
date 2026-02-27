const { pool } = require('../config/database');

class Customer {
  static async getAll(salonId, filters = {}) {
    try {
      let query = `
         SELECT c.*,
           lm.id AS membership_id,
           CASE WHEN lm.end_date IS NOT NULL AND lm.end_date < CURDATE() AND lm.status IN ('active','pending') THEN 'expired' ELSE lm.status END AS membership_status,
           lm.end_date AS membership_end_date,
           lm.plan_id AS membership_plan_id,
           p.name AS membership_plan_name,
           p.tier AS membership_tier
        FROM customers c
        LEFT JOIN (
          SELECT m.*
          FROM memberships m
          JOIN (
            SELECT customer_id, MAX(created_at) AS max_created
            FROM memberships
            GROUP BY customer_id
          ) mx ON mx.customer_id = m.customer_id AND mx.max_created = m.created_at
        ) lm ON lm.customer_id = c.id AND lm.salon_id = c.salon_id
        LEFT JOIN membership_plans p ON p.id = lm.plan_id
        WHERE c.salon_id = ?
      `;
      const params = [salonId];

      // Add date filters
      if (filters.dateFilter) {
        const today = new Date();
        switch (filters.dateFilter) {
          case 'today':
            query += ' AND DATE(c.created_at) = CURDATE()';
            break;
          case 'last_7_days':
            query += ' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            break;
          case 'last_30_days':
            query += ' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            break;
          case 'last_90_days':
            query += ' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
            break;
          // 'all' is default, no filter needed
        }
      }

      // Membership filter
      if (filters.membershipFilter) {
        switch (filters.membershipFilter) {
          case 'has':
            query += ' AND lm.id IS NOT NULL';
            break;
          case 'none':
            query += ' AND lm.id IS NULL';
            break;
          case 'active':
            query += " AND lm.status = 'active' AND (lm.end_date IS NULL OR lm.end_date >= CURDATE())";
            break;
          case 'pending':
            query += " AND lm.status = 'pending'";
            break;
          case 'expired':
            query += " AND ((lm.status IN ('active','pending') AND lm.end_date IS NOT NULL AND lm.end_date < CURDATE()) OR lm.status = 'expired')";
            break;
        }
      }

      // Add sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'created_desc':
            query += ' ORDER BY c.created_at DESC';
            break;
          case 'created_asc':
            query += ' ORDER BY c.created_at ASC';
            break;
          case 'name_asc':
            query += ' ORDER BY c.name ASC, c.created_at DESC';
            break;
          case 'name_desc':
            query += ' ORDER BY c.name DESC, c.created_at DESC';
            break;
          default:
            query += ' ORDER BY c.created_at DESC';
        }
      } else {
        query += ' ORDER BY c.created_at DESC';
      }

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error getting customers: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT c.*,
          lm.id AS membership_id,
          CASE WHEN lm.end_date IS NOT NULL AND lm.end_date < CURDATE() AND lm.status IN ('active','pending') THEN 'expired' ELSE lm.status END AS membership_status,
          lm.end_date AS membership_end_date,
          lm.plan_id AS membership_plan_id,
          p.name AS membership_plan_name,
          p.tier AS membership_tier
         FROM customers c
         LEFT JOIN (
           SELECT m.*
           FROM memberships m
           JOIN (
             SELECT customer_id, MAX(created_at) AS max_created
             FROM memberships
             GROUP BY customer_id
           ) mx ON mx.customer_id = m.customer_id AND mx.max_created = m.created_at
         ) lm ON lm.customer_id = c.id AND lm.salon_id = c.salon_id
         LEFT JOIN membership_plans p ON p.id = lm.plan_id
         WHERE c.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error getting customer: ${error.message}`);
    }
  }

  static async create(customerData) {
    try {
      // Check if phone already exists for this salon
      const [existing] = await pool.query(
        'SELECT id FROM customers WHERE salon_id = ? AND phone = ?',
        [customerData.salon_id, customerData.phone]
      );
      
      if (existing.length > 0) {
        throw new Error('Phone number already exists for another customer');
      }

      const [result] = await pool.query(
        'INSERT INTO customers (salon_id, name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [customerData.salon_id, customerData.name || null, customerData.email || null, customerData.phone, customerData.address || null, customerData.notes || null]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating customer: ${error.message}`);
    }
  }

  static async update(id, customerData) {
    try {
      // If phone is being updated, check for duplicates (excluding current record)
      if (customerData.phone) {
        const [existing] = await pool.query(
          'SELECT id FROM customers WHERE salon_id = (SELECT salon_id FROM customers WHERE id = ?) AND phone = ? AND id != ?',
          [id, customerData.phone, id]
        );
        
        if (existing.length > 0) {
          throw new Error('Phone number already exists for another customer');
        }
      }

      const [result] = await pool.query(
        'UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, notes = ? WHERE id = ?',
        [customerData.name || null, customerData.email || null, customerData.phone, customerData.address || null, customerData.notes || null, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating customer: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM customers WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting customer: ${error.message}`);
    }
  }

  static async search(salonId, query, filters = {}) {
    try {
      let sqlQuery = `
        SELECT c.*,
               lm.id AS membership_id,
               CASE WHEN lm.end_date IS NOT NULL AND lm.end_date < CURDATE() AND lm.status IN ('active','pending') THEN 'expired' ELSE lm.status END AS membership_status,
               lm.end_date AS membership_end_date,
               lm.plan_id AS membership_plan_id,
               p.name AS membership_plan_name,
               p.tier AS membership_tier
        FROM customers c
        LEFT JOIN (
          SELECT m.*
          FROM memberships m
          JOIN (
            SELECT customer_id, MAX(created_at) AS max_created
            FROM memberships
            GROUP BY customer_id
          ) mx ON mx.customer_id = m.customer_id AND mx.max_created = m.created_at
        ) lm ON lm.customer_id = c.id AND lm.salon_id = c.salon_id
        LEFT JOIN membership_plans p ON p.id = lm.plan_id
        WHERE c.salon_id = ?
        AND (c.phone LIKE ? OR c.name LIKE ? OR c.email LIKE ? OR c.address LIKE ?)
      `;
      const params = [salonId, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];

      // Apply date filters
      if (filters.dateFilter) {
        const today = new Date();
        switch (filters.dateFilter) {
          case 'today':
            sqlQuery += ' AND DATE(created_at) = CURDATE()';
            break;
          case 'last_7_days':
            sqlQuery += ' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            break;
          case 'last_30_days':
            sqlQuery += ' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            break;
          case 'last_90_days':
            sqlQuery += ' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
            break;
        }
      }

      // Membership filter
      if (filters.membershipFilter) {
        switch (filters.membershipFilter) {
          case 'has':
            sqlQuery += ' AND lm.id IS NOT NULL';
            break;
          case 'none':
            sqlQuery += ' AND lm.id IS NULL';
            break;
          case 'active':
            sqlQuery += " AND lm.status = 'active' AND (lm.end_date IS NULL OR lm.end_date >= CURDATE())";
            break;
          case 'pending':
            sqlQuery += " AND lm.status = 'pending'";
            break;
          case 'expired':
            sqlQuery += " AND ((lm.status IN ('active','pending') AND lm.end_date IS NOT NULL AND lm.end_date < CURDATE()) OR lm.status = 'expired')";
            break;
        }
      }

      sqlQuery += ' ORDER BY c.created_at DESC';
      
      const [rows] = await pool.query(sqlQuery, params);
      return rows;
    } catch (error) {
      throw new Error(`Error searching customers: ${error.message}`);
    }
  }
}

module.exports = Customer;