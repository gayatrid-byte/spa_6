const Appointment = require('../models/appointment.model');
const Invoice = require('../models/invoice.model');
const Expense = require('../models/expense.model');
const Customer = require('../models/customer.model'); // Add this import

async function getDashboardStats(req, res) {
  try {
    const salonId = req.user.salon_id;
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get today's appointments
    const todayAppointments = await Appointment.getAll(salonId, {
      dateFrom: today,
      dateTo: today
    });

    // Get monthly revenue
    const monthlyInvoices = await Invoice.getAll(salonId, {
      dateFrom: `${currentMonth}-01`,
      dateTo: `${currentMonth}-31`
    });

    const monthlyRevenue = monthlyInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

    // Get monthly expenses
    const monthlyExpenses = await Expense.getAll(salonId, {
      dateFrom: `${currentMonth}-01`,
      dateTo: `${currentMonth}-31`
    });

    const monthlyExpenseTotal = monthlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    // Get total customers directly from customers table
    const allCustomers = await Customer.getAll(salonId);
    const totalCustomers = allCustomers.length;

    // Get pending payments
    const pendingPayments = await Invoice.getAll(salonId, {
      status: 'pending'
    });

    const pendingTotal = pendingPayments.reduce((sum, inv) => sum + parseFloat(inv.total), 0);

    res.json({
      todayAppointments: todayAppointments.length,
      todayRevenue: todayAppointments
        .filter(app => app.status === 'completed')
        .reduce((sum, app) => sum + parseFloat(app.service_price || 0), 0),
      monthlyRevenue,
      monthlyExpenses: monthlyExpenseTotal,
      monthlyProfit: monthlyRevenue - monthlyExpenseTotal,
      totalCustomers: totalCustomers, // Changed from uniqueCustomers to totalCustomers
      pendingPayments: pendingTotal,
      recentAppointments: todayAppointments.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getDashboardStats };