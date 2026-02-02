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
    
    const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const paidRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const pendingRevenue = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    
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
    
    const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const profit = totalRevenue - totalExpenses;
    
    res.json({
      startDate,
      endDate,
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin: totalRevenue > 0 ? (profit / totalRevenue * 100).toFixed(2) : 0
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
    
    const appointments = await Appointment.getAll(salonId, {
      dateFrom: startDate,
      dateTo: endDate
    });
    
    const servicePerformance = {};
    
    appointments.forEach(app => {
      if (!servicePerformance[app.service_name]) {
        servicePerformance[app.service_name] = {
          serviceName: app.service_name,
          bookings: 0,
          revenue: 0
        };
      }
      
      servicePerformance[app.service_name].bookings++;
      servicePerformance[app.service_name].revenue += parseFloat(app.service_price || 0);
    });
    
    const performance = Object.values(servicePerformance).sort((a, b) => b.bookings - a.bookings);
    
    res.json({
      startDate,
      endDate,
      performance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getRevenueReport,
  getAppointmentsReport,
  getProfitReport,
  getServicePerformance
};