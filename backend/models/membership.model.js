const { pool } = require('../config/database');

class MembershipModel {
  // Plans
  static async getAllPlans(salonId) {
    const [rows] = await pool.query(
      'SELECT * FROM membership_plans WHERE salon_id = ? AND is_active = TRUE ORDER BY tier, price',
      [salonId]
    );
    return rows;
  }

  static async createPlan(salonId, plan) {
    const [result] = await pool.query(
      `INSERT INTO membership_plans 
       (salon_id, name, description, tier, duration_months, price,
        discount_percentage, wallet_credits, priority_level, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        salonId,
        plan.name,
        plan.description || null,
        plan.tier || 'silver',
        plan.duration_months,
        plan.price || 0,
        (plan.discount_percentage === undefined || plan.discount_percentage === null || plan.discount_percentage === '') ? 15 : plan.discount_percentage,
        (plan.wallet_credits === undefined || plan.wallet_credits === null || plan.wallet_credits === '') ? (plan.price || 0) : plan.wallet_credits,
        plan.priority_level || 'standard',
        plan.is_active !== false
      ]
    );
    return result.insertId;
  }

  static async updatePlan(id, plan) {
    const [result] = await pool.query(
      `UPDATE membership_plans SET 
       name = ?, description = ?, tier = ?, duration_months = ?, price = ?,
       discount_percentage = ?, wallet_credits = ?,
       priority_level = ?, is_active = ?
       WHERE id = ?`,
      [
        plan.name,
        plan.description || null,
        plan.tier || 'silver',
        plan.duration_months,
        plan.price || 0,
        (plan.discount_percentage === undefined || plan.discount_percentage === null || plan.discount_percentage === '') ? 15 : plan.discount_percentage,
        (plan.wallet_credits === undefined || plan.wallet_credits === null || plan.wallet_credits === '') ? (plan.price || 0) : plan.wallet_credits,
        plan.priority_level || 'standard',
        plan.is_active !== false,
        id
      ]
    );
    return result.affectedRows > 0;
  }

  static async deletePlan(id) {
    const [result] = await pool.query('DELETE FROM membership_plans WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Memberships
  static async getUserMembership(userId) {
    const [rows] = await pool.query(
      `SELECT m.*, p.name as plan_name, p.tier, p.discount_percentage, p.wallet_credits,
              p.priority_level
       FROM memberships m
       JOIN membership_plans p ON m.plan_id = p.id
       WHERE m.customer_id = ? AND m.status IN ('active','pending')
       ORDER BY m.created_at DESC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  static async assignMembership({ customerId, salonId, planId, startDate, paymentMethod, amount, discount }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Get plan details
      const [planRows] = await connection.query('SELECT * FROM membership_plans WHERE id = ? AND salon_id = ?', [planId, salonId]);
      const plan = planRows[0];
      if (!plan) throw new Error('Plan not found');

      // 2. Calculate dates
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + Number(plan.duration_months));
      const endDateStr = end.toISOString().split('T')[0];

      // 3. Create membership
      const [membershipResult] = await connection.query(
        `INSERT INTO memberships (customer_id, salon_id, plan_id, start_date, end_date, status, wallet_balance)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`,
        [customerId, salonId, planId, startDate, endDateStr, plan.wallet_credits || 0]
      );
      const membershipId = membershipResult.insertId;

      // 4. Create payment record (invoice)
      const invAmount = amount !== undefined ? amount : (plan.price || 0);
      const invDiscount = discount !== undefined ? discount : ((invAmount * (plan.discount_percentage || 0)) / 100);
      const invoiceNumber = `MEM-${Date.now().toString().slice(-6)}-${membershipId}`;

      const [paymentResult] = await connection.query(
        `INSERT INTO membership_payments (salon_id, membership_id, customer_id, amount, discount, payment_method, invoice_number)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [salonId, membershipId, customerId, invAmount, invDiscount, paymentMethod || 'cash', invoiceNumber]
      );

      await connection.commit();
      return { membershipId, paymentId: paymentResult.insertId, invoiceNumber };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateMembership(id, updates) {
    // Allow updating status and end_date (extend as needed)
    const fields = [];
    const params = [];
    if (updates.status) {
      fields.push('status = ?');
      params.push(updates.status);
    }
    if (updates.end_date) {
      fields.push('end_date = ?');
      params.push(updates.end_date);
    }
    if (updates.wallet_balance !== undefined) {
      fields.push('wallet_balance = ?');
      params.push(updates.wallet_balance);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await pool.query(
      `UPDATE memberships SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  static async deleteMembership(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Delete payments first if we want strict cleanup, or rely on cascades if defined
      await connection.query('DELETE FROM membership_payments WHERE membership_id = ?', [id]);
      const [result] = await connection.query('DELETE FROM memberships WHERE id = ?', [id]);

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Payments / Invoices
  static async getAllPayments(salonId) {
    const [rows] = await pool.query(
      `SELECT mp.*, c.name as customer_name, c.phone as customer_phone, 
              p.name as plan_name, p.tier,
              m.start_date, m.end_date, m.wallet_balance, m.status as membership_status
       FROM membership_payments mp
       JOIN customers c ON mp.customer_id = c.id
       JOIN memberships m ON mp.membership_id = m.id
       JOIN membership_plans p ON m.plan_id = p.id
       WHERE mp.salon_id = ?
       ORDER BY mp.payment_date DESC`,
      [salonId]
    );
    return rows;
  }

  static async getPaymentById(id) {
    const [rows] = await pool.query(
      `SELECT mp.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
              p.name as plan_name, p.tier, m.start_date, m.end_date
       FROM membership_payments mp
       JOIN customers c ON mp.customer_id = c.id
       JOIN memberships m ON mp.membership_id = m.id
       JOIN membership_plans p ON m.plan_id = p.id
       WHERE mp.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async createMembershipWithPayment(data) {
    // We can just use the refactored assignMembership which now does exactly this
    return this.assignMembership(data);
  }
}

module.exports = MembershipModel;