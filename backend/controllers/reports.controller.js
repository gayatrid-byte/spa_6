const { pool } = require('../config/database');
const Appointment = require('../models/appointment.model');
const Invoice = require('../models/invoice.model');
const Expense = require('../models/expense.model');

async function getRevenueReport(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const invoices = await Invoice.getAll(salonId, {
      dateFrom: startDate,
      dateTo: endDate
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
    const paidRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
    const pendingRevenue = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);

    res.json({
      startDate,
      endDate,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: invoices.filter(inv => inv.status === 'pending').length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getAppointmentsReport(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const appointments = await Appointment.getAll(salonId, {
      dateFrom: startDate,
      dateTo: endDate
    });

    const statusCounts = appointments.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      startDate,
      endDate,
      totalAppointments: appointments.length,
      statusCounts,
      appointments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getProfitReport(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const invoices = await Invoice.getAll(salonId, {
      dateFrom: startDate,
      dateTo: endDate
    });

    const expenses = await Expense.getAll(salonId, {
      dateFrom: startDate,
      dateTo: endDate
    });

    const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;

    res.json({
      startDate,
      endDate,
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getServicePerformance(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Service revenue must come from invoice_items joined with paid invoices
    // NOT from booking_items alone
    const query = `
      SELECT 
        s.name as serviceName,
        COUNT(DISTINCT ii.id) as bookings,
        COALESCE(SUM(ii.total_price), 0) as revenue,
        COALESCE(AVG(bi.duration_minutes), 0) as avgDuration
      FROM services s
      LEFT JOIN invoice_items ii ON s.id = ii.service_id
      LEFT JOIN invoices inv ON ii.invoice_id = inv.id
      LEFT JOIN booking_items bi ON s.id = bi.service_id
      WHERE inv.salon_id = ?
        AND DATE(inv.invoice_date) >= ?
        AND DATE(inv.invoice_date) <= ?
        AND inv.status = 'paid'
      GROUP BY s.id, s.name
      HAVING revenue > 0
      ORDER BY revenue DESC
    `;

    const [rows] = await pool.query(query, [salonId, startDate, endDate]);

    // Compute summary metrics with safety checks
    const totalRevenue = rows.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);
    const totalBookings = rows.reduce((sum, row) => sum + parseInt(row.bookings || 0), 0);

    // Weighted average duration
    let weightedDurationSum = 0;
    rows.forEach(r => {
      weightedDurationSum += (parseFloat(r.avgDuration || 0) * parseInt(r.bookings || 0));
    });
    const avgDurationTotal = totalBookings > 0 ? (weightedDurationSum / totalBookings) : 0;

    const topService = rows.length > 0 && rows[0].serviceName ? rows[0].serviceName : 'N/A';
    const activeServices = rows.length; // Count of unique services with bookings in this period

    // Format rows for frontend with safety checks
    const performance = rows.map(r => ({
      serviceName: r.serviceName || 'Unknown Service',
      bookings: parseInt(r.bookings || 0),
      revenue: parseFloat(r.revenue || 0),
      avgDuration: Math.round(parseFloat(r.avgDuration || 0))
    }));

    res.json({
      startDate,
      endDate,
      summary: {
        totalRevenue: totalRevenue,
        topService: topService,
        activeServices: activeServices,
        avgDuration: Math.round(avgDurationTotal)
      },
      performance
    });
  } catch (error) {
    console.error('getServicePerformance error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getRevenueReport,
  getAppointmentsReport,
  getProfitReport,
  getServicePerformance
};