const Appointment = require('../models/appointment.model');
const Invoice = require('../models/invoice.model');
const Expense = require('../models/expense.model');
const Customer = require('../models/customer.model');
const { pool } = require('../config/database');

/**
 * EXISTING WORKING CODE - MAINTAINED
 */
async function getDashboardStats(req, res) {
  try {
    const salonId = req.user.salon_id;
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    const todayAppointments = await Appointment.getAll(salonId, { dateFrom: today, dateTo: today });
    const monthlyInvoices = await Invoice.getAll(salonId, { dateFrom: `${currentMonth}-01`, dateTo: `${currentMonth}-31` });
    const monthlyRevenue = monthlyInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const monthlyExpenses = await Expense.getAll(salonId, { dateFrom: `${currentMonth}-01`, dateTo: `${currentMonth}-31` });
    const monthlyExpenseTotal = monthlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const allCustomers = await Customer.getAll(salonId);
    const pendingPayments = await Invoice.getAll(salonId, { status: 'pending' });
    const pendingTotal = pendingPayments.reduce((sum, inv) => sum + parseFloat(inv.total), 0);

    res.json({
      todayAppointments: todayAppointments.length,
      todayRevenue: todayAppointments.filter(app => app.status === 'completed').reduce((sum, app) => sum + parseFloat(app.service_price || 0), 0),
      monthlyRevenue,
      monthlyExpenses: monthlyExpenseTotal,
      monthlyProfit: monthlyRevenue - monthlyExpenseTotal,
      totalCustomers: allCustomers.length,
      pendingPayments: pendingTotal,
      recentAppointments: todayAppointments.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * HELPER: Build date filter WHERE clause
 */
function buildDateWhere(alias, startDate, endDate) {
  return `${alias}.invoice_date BETWEEN '${startDate}' AND '${endDate}'`;
}

/**
 * NEW ENTERPRISE DASHBOARD ENDPOINTS
 * All SQL uses ONLY the actual schema columns — no JSON_CONTAINS joins
 */
const DashboardController = {

  async getFilterOptions(req, res) {
    try {
      const salonId = req.user.salon_id;
      const [staff] = await pool.query("SELECT id, name FROM staff WHERE salon_id = ? AND status = 'active'", [salonId]);
      const [services] = await pool.query("SELECT id, name FROM services WHERE salon_id = ?", [salonId]);
      const [branches] = await pool.query("SELECT id, name FROM salons");
      res.json({ staff, services, branches });
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async getRevenueData(req, res) {
    try {
      const salonId = req.user.salon_id;
      const { startDate, endDate } = req.query;
      const targetSalonId = req.query.branchId || salonId;

      // 1. Daily Revenue Trend — simple invoice aggregation
      const [dailyTrend] = await pool.query(
        `SELECT invoice_date as x, SUM(total) as y
         FROM invoices
         WHERE salon_id = ? AND invoice_date BETWEEN ? AND ? AND status = 'paid'
         GROUP BY invoice_date ORDER BY invoice_date`,
        [targetSalonId, startDate, endDate]
      );

      // 2. Revenue by Service — via invoice_items → services
      const [revByService] = await pool.query(
        `SELECT s.name as x, SUM(ii.total) as y
         FROM invoice_items ii
         JOIN services s ON ii.service_id = s.id
         JOIN invoices i ON ii.invoice_id = i.id
         WHERE i.salon_id = ? AND i.invoice_date BETWEEN ? AND ? AND i.status = 'paid'
         GROUP BY s.id ORDER BY y DESC LIMIT 10`,
        [targetSalonId, startDate, endDate]
      );

      // 3. Revenue by Staff — via booking_items → staff → bookings (completed)
      const [revByStaff] = await pool.query(
        `SELECT st.name as x, SUM(bi.price) as y
         FROM booking_items bi
         JOIN staff st ON bi.staff_id = st.id
         JOIN bookings b ON bi.booking_id = b.id
         WHERE b.salon_id = ? AND b.booking_date BETWEEN ? AND ? AND b.status = 'completed'
         GROUP BY st.id ORDER BY y DESC LIMIT 10`,
        [targetSalonId, startDate, endDate]
      );

      // 4. Payment Method Split — parse JSON array first element
      const [paymentSplit] = await pool.query(
        `SELECT JSON_UNQUOTE(JSON_EXTRACT(payment_methods, '$[0]')) as label, SUM(total) as value
         FROM invoices
         WHERE salon_id = ? AND invoice_date BETWEEN ? AND ? AND status = 'paid'
         GROUP BY label`,
        [targetSalonId, startDate, endDate]
      );

      // 5. Drill-down Table
      const [table] = await pool.query(
        `SELECT i.id as invoice_id, i.invoice_date, c.name as customer_name,
            GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') as service_name,
            i.subtotal as gross_amount, i.discount, i.tax, i.total as net_amount,
            JSON_UNQUOTE(JSON_EXTRACT(i.payment_methods, '$[0]')) as payment_method,
            i.status
         FROM invoices i
         JOIN customers c ON i.customer_id = c.id
         LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
         LEFT JOIN services s ON ii.service_id = s.id
         WHERE i.salon_id = ? AND i.invoice_date BETWEEN ? AND ?
         GROUP BY i.id ORDER BY i.invoice_date DESC`,
        [targetSalonId, startDate, endDate]
      );

      res.json({ dailyTrend, revByService, revByStaff, paymentSplit, table });
    } catch (e) {
      console.error('[Dashboard Revenue Error]', e.message);
      res.status(500).json({ error: e.message });
    }
  },

  async getBookingData(req, res) {
    try {
      const salonId = req.user.salon_id;
      const { startDate, endDate, staffId, serviceId, branchId } = req.query;
      const targetSalonId = branchId || salonId;

      // Build optional filters via booking_items
      let joinClause = '';
      let extraWhere = '';
      const params = [targetSalonId, startDate, endDate];

      if (staffId || serviceId) {
        joinClause = 'JOIN booking_items bi ON b.id = bi.booking_id';
        if (staffId) { extraWhere += ' AND bi.staff_id = ?'; params.push(staffId); }
        if (serviceId) { extraWhere += ' AND bi.service_id = ?'; params.push(serviceId); }
      }

      const [trend] = await pool.query(
        `SELECT b.booking_date as x, COUNT(DISTINCT b.id) as y
         FROM bookings b ${joinClause}
         WHERE b.salon_id = ? AND b.booking_date BETWEEN ? AND ? ${extraWhere}
         GROUP BY b.booking_date ORDER BY b.booking_date`,
        params
      );

      const [status] = await pool.query(
        `SELECT b.status as label, COUNT(DISTINCT b.id) as value
         FROM bookings b ${joinClause}
         WHERE b.salon_id = ? AND b.booking_date BETWEEN ? AND ? ${extraWhere}
         GROUP BY b.status`,
        params
      );

      const [peak] = await pool.query(
        `SELECT HOUR(b.start_time) as x, COUNT(DISTINCT b.id) as y
         FROM bookings b ${joinClause}
         WHERE b.salon_id = ? AND b.booking_date BETWEEN ? AND ? ${extraWhere}
         GROUP BY x ORDER BY x`,
        params
      );

      const [table] = await pool.query(
        `SELECT b.id as booking_id, b.booking_date, b.start_time as booking_time,
            c.name as customer,
            GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') as service,
            GROUP_CONCAT(DISTINCT st.name SEPARATOR ', ') as staff,
            b.status, b.booking_type as source,
            b.total_amount as amount, b.notes
         FROM bookings b
         LEFT JOIN customers c ON b.customer_id = c.id
         LEFT JOIN booking_items bi ON b.id = bi.booking_id
         LEFT JOIN services s ON bi.service_id = s.id
         LEFT JOIN staff st ON bi.staff_id = st.id
         WHERE b.salon_id = ? AND b.booking_date BETWEEN ? AND ?
         GROUP BY b.id ORDER BY b.booking_date DESC, b.start_time DESC`,
        [targetSalonId, startDate, endDate]
      );

      res.json({ trend, status, peak, table });
    } catch (e) {
      console.error('[Dashboard Bookings Error]', e.message);
      res.status(500).json({ error: e.message });
    }
  },

  async getCustomerData(req, res) {
    try {
      const salonId = req.user.salon_id;

      const [newVsRepeat] = await pool.query(
        `SELECT label, COUNT(*) as value FROM (
            SELECT CASE WHEN visit_count > 1 THEN 'Repeat' ELSE 'New' END as label
            FROM (SELECT customer_id, COUNT(id) as visit_count FROM bookings WHERE salon_id = ? AND status = 'completed' GROUP BY customer_id) t
         ) r GROUP BY label`,
        [salonId]
      );

      const [topCustomers] = await pool.query(
        `SELECT c.name as x, SUM(b.total_amount) as y
         FROM bookings b JOIN customers c ON b.customer_id = c.id
         WHERE b.salon_id = ? AND b.status = 'completed'
         GROUP BY c.id ORDER BY y DESC LIMIT 10`,
        [salonId]
      );

      const [table] = await pool.query(
        `SELECT c.id as customer_id, c.name, c.phone,
            COUNT(b.id) as total_visits,
            COALESCE(SUM(b.total_amount), 0) as total_spend,
            COALESCE(AVG(b.total_amount), 0) as avg_spend,
            MAX(b.booking_date) as last_visit,
            COALESCE(SUM(b.total_amount), 0) as clv,
            COALESCE(DATEDIFF(CURDATE(), MAX(b.booking_date)), 999) as churn_score
         FROM customers c
         LEFT JOIN bookings b ON c.id = b.customer_id AND b.status = 'completed'
         WHERE c.salon_id = ?
         GROUP BY c.id ORDER BY clv DESC`,
        [salonId]
      );

      res.json({ newVsRepeat, topCustomers, table });
    } catch (e) {
      console.error('[Dashboard Customers Error]', e.message);
      res.status(500).json({ error: e.message });
    }
  },

  async getStaffData(req, res) {
    try {
      const salonId = req.user.salon_id;
      const { startDate, endDate } = req.query;

      // 1. Staff revenue totals (for bar chart)
      const [rev] = await pool.query(
        `SELECT st.name as x, COALESCE(SUM(bi.price), 0) as y
         FROM staff st
         LEFT JOIN booking_items bi ON st.id = bi.staff_id
         LEFT JOIN bookings b ON bi.booking_id = b.id AND b.booking_date BETWEEN ? AND ? AND b.status = 'completed'
         WHERE st.salon_id = ? AND st.status = 'active'
         GROUP BY st.id ORDER BY y DESC`,
        [startDate, endDate, salonId]
      );

      // 2. Daily trend - all staff combined by date
      const [trend] = await pool.query(
        `SELECT b.booking_date as x, COALESCE(SUM(bi.price), 0) as y
         FROM bookings b
         LEFT JOIN booking_items bi ON b.id = bi.booking_id
         WHERE b.salon_id = ? AND b.booking_date BETWEEN ? AND ? AND b.status = 'completed'
         GROUP BY b.booking_date ORDER BY b.booking_date`,
        [salonId, startDate, endDate]
      );

      // 3. Staff performance table
      const [table] = await pool.query(
        `SELECT st.id as staff_id, st.name as staff_name,
            COALESCE(SUM(bi.price), 0) as revenue,
            COUNT(DISTINCT b.id) as bookings,
            COALESCE(
              SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) /
              NULLIF(COUNT(b.id), 0) * 100, 0
            ) as productivity,
            COALESCE(st.commission_rate, 0) as commission,
            st.designation
         FROM staff st
         LEFT JOIN booking_items bi ON st.id = bi.staff_id
         LEFT JOIN bookings b ON bi.booking_id = b.id AND b.booking_date BETWEEN ? AND ?
         WHERE st.salon_id = ?
         GROUP BY st.id ORDER BY revenue DESC`,
        [startDate, endDate, salonId]
      );

      res.json({ rev, trend, table });
    } catch (e) {
      console.error('[Dashboard Staff Error]', e.message);
      res.status(500).json({ error: e.message });
    }
  },

  async getMembershipData(req, res) {
    try {
      const salonId = req.user.salon_id;

      const [status] = await pool.query(
        "SELECT status as label, COUNT(*) as value FROM memberships WHERE salon_id = ? GROUP BY status",
        [salonId]
      );

      const [table] = await pool.query(
        `SELECT m.id as membership_id, c.name as customer, p.name as plan_name,
            m.start_date, m.end_date as expiry_date, m.status, p.price as revenue
         FROM memberships m
         JOIN customers c ON m.customer_id = c.id
         JOIN membership_plans p ON m.plan_id = p.id
         WHERE m.salon_id = ? ORDER BY m.end_date ASC`,
        [salonId]
      );

      res.json({ status, table });
    } catch (e) {
      console.error('[Dashboard Memberships Error]', e.message);
      res.status(500).json({ error: e.message });
    }
  },

  async getProfitData(req, res) {
    try {
      const salonId = req.user.salon_id;

      const [monthly] = await pool.query(
        `SELECT DATE_FORMAT(invoice_date, '%Y-%m') as month, SUM(total) as revenue
         FROM invoices WHERE salon_id = ? AND status = 'paid'
         GROUP BY month ORDER BY month`,
        [salonId]
      );

      const [expenses] = await pool.query(
        `SELECT DATE_FORMAT(expense_date, '%Y-%m') as month, SUM(amount) as expense
         FROM expenses WHERE salon_id = ?
         GROUP BY month ORDER BY month`,
        [salonId]
      );

      const [expenseSplit] = await pool.query(
        "SELECT category as label, SUM(amount) as value FROM expenses WHERE salon_id = ? GROUP BY category ORDER BY value DESC",
        [salonId]
      );

      // Build combined table for P&L
      const monthMap = {};
      monthly.forEach(r => { monthMap[r.month] = { month: r.month, revenue: parseFloat(r.revenue), expense: 0 }; });
      expenses.forEach(r => {
        if (!monthMap[r.month]) monthMap[r.month] = { month: r.month, revenue: 0, expense: 0 };
        monthMap[r.month].expense = parseFloat(r.expense);
      });
      const table = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).map(r => ({
        month: r.month,
        total_revenue: r.revenue.toFixed(2),
        total_expense: r.expense.toFixed(2),
        net_profit: (r.revenue - r.expense).toFixed(2),
        margin_percent: r.revenue > 0 ? ((r.revenue - r.expense) / r.revenue * 100).toFixed(1) + '%' : '0%'
      }));

      res.json({ monthly, expenses, expenseSplit, table });
    } catch (e) {
      console.error('[Dashboard Profit Error]', e.message);
      res.status(500).json({ error: e.message });
    }
  },

  async getServiceData(req, res) {
    try {
      const salonId = req.user.salon_id;

      const [rev] = await pool.query(
        `SELECT s.name as x, SUM(bi.price) as y
         FROM booking_items bi
         JOIN services s ON bi.service_id = s.id
         JOIN bookings b ON bi.booking_id = b.id
         WHERE b.salon_id = ? AND b.status = 'completed'
         GROUP BY s.id ORDER BY y DESC LIMIT 10`,
        [salonId]
      );

      const [pop] = await pool.query(
        `SELECT s.name as x, COUNT(bi.id) as y
         FROM booking_items bi
         JOIN services s ON bi.service_id = s.id
         JOIN bookings b ON bi.booking_id = b.id
         WHERE b.salon_id = ?
         GROUP BY s.id ORDER BY y DESC LIMIT 10`,
        [salonId]
      );

      const [table] = await pool.query(
        `SELECT s.id as service_id, s.name as service_name,
            cat.name as category,
            COALESCE(SUM(bi.price), 0) as revenue,
            COUNT(bi.id) as bookings,
            s.duration_minutes as duration
         FROM services s
         JOIN categories cat ON s.category_id = cat.id
         LEFT JOIN booking_items bi ON s.id = bi.service_id
         LEFT JOIN bookings b ON bi.booking_id = b.id
         WHERE s.salon_id = ?
         GROUP BY s.id ORDER BY revenue DESC`,
        [salonId]
      );

      res.json({ rev, pop, table });
    } catch (e) {
      console.error('[Dashboard Services Error]', e.message);
      res.status(500).json({ error: e.message });
    }
  },

  async getForecastData(req, res) {
    try {
      const salonId = req.user.salon_id;

      // Historical revenue for moving average
      const [history] = await pool.query(
        `SELECT invoice_date as date, SUM(total) as revenue
         FROM invoices WHERE salon_id = ? AND status = 'paid'
         GROUP BY invoice_date ORDER BY invoice_date DESC LIMIT 60`,
        [salonId]
      );

      const recent30 = history.slice(0, 30);
      const avg = recent30.length
        ? recent30.reduce((s, h) => s + parseFloat(h.revenue), 0) / recent30.length
        : 0;

      // Generate 30-day forecast using sine-wave smoothing (no random)
      const forecast = [];
      for (let i = 1; i <= 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const val = avg * (1 + Math.sin(i / 5) * 0.08);
        forecast.push({ date: d.toISOString().split('T')[0], predicted_revenue: val.toFixed(2) });
      }

      // Churn prediction table
      const [table] = await pool.query(
        `SELECT c.name as customer,
            CASE WHEN DATEDIFF(CURDATE(), MAX(b.booking_date)) > 60 THEN 0.80
                 WHEN DATEDIFF(CURDATE(), MAX(b.booking_date)) > 30 THEN 0.40
                 ELSE 0.10 END as churn_probability,
            CASE WHEN COUNT(b.id) > 5 THEN 0.90
                 WHEN COUNT(b.id) > 2 THEN 0.60
                 ELSE 0.30 END as repeat_probability,
            DATE_FORMAT(DATE_ADD(MAX(b.booking_date), INTERVAL 21 DAY), '%Y-%m-%d') as next_visit_prediction,
            DATEDIFF(CURDATE(), MAX(b.booking_date)) as last_visit_days
         FROM customers c
         JOIN bookings b ON c.id = b.customer_id
         WHERE c.salon_id = ?
         GROUP BY c.id ORDER BY churn_probability DESC LIMIT 20`,
        [salonId]
      );

      res.json({ forecast, table });
    } catch (e) {
      console.error('[Dashboard Forecast Error]', e.message);
      res.status(500).json({ error: e.message });
    }
  }
};

module.exports = {
  getDashboardStats,
  getFilterOptions: DashboardController.getFilterOptions,
  getRevenueData: DashboardController.getRevenueData,
  getBookingData: DashboardController.getBookingData,
  getCustomerData: DashboardController.getCustomerData,
  getStaffData: DashboardController.getStaffData,
  getMembershipData: DashboardController.getMembershipData,
  getProfitData: DashboardController.getProfitData,
  getServiceData: DashboardController.getServiceData,
  getForecastData: DashboardController.getForecastData
};