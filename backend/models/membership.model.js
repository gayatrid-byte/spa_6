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
       (salon_id, name, description, tier, duration_days, price, is_recurring, 
        discount_percentage, wallet_credits, free_services, guest_passes, priority_level, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        salonId,
        plan.name,
        plan.description || null,
        plan.tier || 'silver',
        plan.duration_days,
        plan.price || 0,
        !!plan.is_recurring,
        plan.discount_percentage || 0,
        plan.wallet_credits || 0,
        plan.free_services || 0,
        plan.guest_passes || 0,
        plan.priority_level || 'standard',
        plan.is_active !== false
      ]
    );
    return result.insertId;
  }

  static async updatePlan(id, plan) {
    const [result] = await pool.query(
      `UPDATE membership_plans SET 
       name = ?, description = ?, tier = ?, duration_days = ?, price = ?, is_recurring = ?,
       discount_percentage = ?, wallet_credits = ?, free_services = ?, guest_passes = ?,
       priority_level = ?, is_active = ?
       WHERE id = ?`,
      [
        plan.name,
        plan.description || null,
        plan.tier || 'silver',
        plan.duration_days,
        plan.price || 0,
        !!plan.is_recurring,
        plan.discount_percentage || 0,
        plan.wallet_credits || 0,
        plan.free_services || 0,
        plan.guest_passes || 0,
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
      `SELECT m.*, p.name as plan_name, p.tier, p.discount_percentage, p.wallet_credits, p.free_services,
              p.guest_passes, p.priority_level
       FROM memberships m
       JOIN membership_plans p ON m.plan_id = p.id
       WHERE m.customer_id = ? AND m.status IN ('active','pending')
       ORDER BY m.created_at DESC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  static async assignMembership({ customerId, salonId, planId, startDate }) {
    // Retrieve plan to compute endDate and initial balances
    const [planRows] = await pool.query('SELECT * FROM membership_plans WHERE id = ? AND salon_id = ?', [planId, salonId]);
    const plan = planRows[0];
    if (!plan) throw new Error('Plan not found');

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);
    const endDateStr = endDate.toISOString().slice(0, 10);

    const [result] = await pool.query(
      `INSERT INTO memberships 
       (customer_id, salon_id, plan_id, start_date, end_date, status, wallet_balance, free_services_remaining, guest_passes_remaining)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      [
        customerId,
        salonId,
        planId,
        startDate,
        endDateStr,
        plan.wallet_credits || 0,
        plan.free_services || 0,
        plan.guest_passes || 0
      ]
    );
    return result.insertId;
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
    if (updates.free_services_remaining !== undefined) {
      fields.push('free_services_remaining = ?');
      params.push(updates.free_services_remaining);
    }
    if (updates.guest_passes_remaining !== undefined) {
      fields.push('guest_passes_remaining = ?');
      params.push(updates.guest_passes_remaining);
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
    const [result] = await pool.query('DELETE FROM memberships WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = MembershipModel;