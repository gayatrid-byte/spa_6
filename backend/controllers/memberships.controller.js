const Membership = require('../models/membership.model');

// List active plans
async function getPlans(req, res) {
  try {
    const salonId = req.user.salon_id;
    const plans = await Membership.getAllPlans(salonId);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create a new plan
async function createPlan(req, res) {
  try {
    const salonId = req.user.salon_id;
    const planId = await Membership.createPlan(salonId, req.body);
    res.status(201).json({ message: 'Plan created', id: planId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update a plan
async function updatePlan(req, res) {
  try {
    const { id } = req.params;
    const updated = await Membership.updatePlan(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Plan not found' });
    res.json({ message: 'Plan updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete a plan
async function deletePlan(req, res) {
  try {
    const { id } = req.params;
    const ok = await Membership.deletePlan(id);
    if (!ok) return res.status(404).json({ error: 'Plan not found' });
    res.json({ message: 'Plan deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get current user's membership
async function getMyMembership(req, res) {
  try {
    const membership = await Membership.getUserMembership(req.user.id);
    if (!membership) {
      // Return 200 with null to indicate no active membership without causing frontend error logs
      return res.json(null);
    }
    res.json(membership);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Assign a membership to a user
async function assignMembership(req, res) {
  try {
    const { customer_id, plan_id, start_date } = req.body;
    if (!customer_id || !plan_id || !start_date) {
      return res.status(400).json({ error: 'customer_id, plan_id, start_date are required' });
    }
    const salonId = req.user.salon_id;
    const id = await Membership.assignMembership({ customerId: customer_id, salonId, planId: plan_id, startDate: start_date });
    res.status(201).json({ message: 'Membership assigned', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getMyMembership,
  assignMembership,
  // Get membership for a specific customer
  async getCustomerMembership(req, res) {
    try {
      const { id } = req.params;
      const membership = await Membership.getUserMembership(id);
      // Return null (200) if no membership
      return res.json(membership || null);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async updateMembership(req, res) {
    try {
      const { id } = req.params;
      const allowedStatuses = ['active', 'expired', 'cancelled', 'suspended', 'pending'];
      const updates = {};
      if (req.body.status) {
        if (!allowedStatuses.includes(req.body.status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        updates.status = req.body.status;
      }
      if (req.body.end_date) updates.end_date = req.body.end_date;
      if (req.body.wallet_balance !== undefined) updates.wallet_balance = req.body.wallet_balance;

      const ok = await Membership.updateMembership(id, updates);
      if (!ok) return res.status(404).json({ error: 'Membership not found or no updates provided' });
      res.json({ message: 'Membership updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async deleteMembership(req, res) {
    try {
      const { id } = req.params;
      const ok = await Membership.deleteMembership(id);
      if (!ok) return res.status(404).json({ error: 'Membership not found' });
      res.json({ message: 'Membership deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getPayments(req, res) {
    try {
      const salonId = req.user.salon_id;
      const payments = await Membership.getAllPayments(salonId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      const payment = await Membership.getPaymentById(id);
      if (!payment) return res.status(404).json({ error: 'Invoice not found' });
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async createMembershipWithPayment(req, res) {
    try {
      const salonId = req.user.salon_id;
      const result = await Membership.createMembershipWithPayment({ ...req.body, salonId });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};