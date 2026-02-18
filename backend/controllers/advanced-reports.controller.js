/**
 * ADVANCED REPORTS CONTROLLER
 * Enterprise Business Intelligence with 5-Layer Architecture
 * 
 * Maps API Endpoints → AdvancedBIModel → Data Warehouse
 */

const AdvancedBIModel = require('../models/advanced-bi.model');

// ============================================
// 1️⃣ REVENUE INTELLIGENCE
// ============================================
async function getRevenue(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const data = await AdvancedBIModel.getRevenueIntelligence(salonId, start, end);
    res.json(data);
  } catch (error) {
    console.error('Revenue Intelligence error:', error);
    res.status(500).json({ error: 'Failed to retrieve revenue data' });
  }
}

// ============================================
// 2️⃣ BOOKING ANALYTICS
// ============================================
async function getBookings(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const data = await AdvancedBIModel.getBookingAnalytics(salonId, start, end);
    res.json(data);
  } catch (error) {
    console.error('Booking Analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve booking data' });
  }
}

// ============================================
// 3️⃣ CUSTOMER INTELLIGENCE
// ============================================
async function getCustomers(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const data = await AdvancedBIModel.getCustomerIntelligence(salonId, start, end);
    res.json(data);
  } catch (error) {
    console.error('Customer Intelligence error:', error);
    res.status(500).json({ error: 'Failed to retrieve customer data' });
  }
}

// ============================================
// 4️⃣ STAFF PERFORMANCE
// ============================================
async function getStaff(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const data = await AdvancedBIModel.getStaffPerformance(salonId, start, end);
    res.json(data);
  } catch (error) {
    console.error('Staff Performance error:', error);
    res.status(500).json({ error: 'Failed to retrieve staff data' });
  }
}

// ============================================
// 5️⃣ MEMBERSHIP ANALYTICS
// ============================================
async function getMemberships(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const data = await AdvancedBIModel.getMembershipAnalytics(salonId, start, end);
    res.json(data);
  } catch (error) {
    console.error('Membership Analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve membership data' });
  }
}

// ============================================
// 6️⃣ EXPENSE & PROFIT ANALYSIS
// ============================================
async function getExpenses(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const data = await AdvancedBIModel.getExpenseAnalysis(salonId, start, end);
    res.json(data);
  } catch (error) {
    console.error('Expense Analysis error:', error);
    res.status(500).json({ error: 'Failed to retrieve expense data' });
  }
}

// ============================================
// 7️⃣ SERVICE PERFORMANCE
// ============================================
async function getServices(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const data = await AdvancedBIModel.getServicePerformance(salonId, start, end);
    res.json(data);
  } catch (error) {
    console.error('Service Performance error:', error);
    res.status(500).json({ error: 'Failed to retrieve service data' });
  }
}

// ============================================
// 8️⃣ SMART AI & ADVANCED ANALYTICS
// ============================================
async function getSmart(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const data = await AdvancedBIModel.getSmartAnalytics(salonId, start, end);
    res.json(data);
  } catch (error) {
    console.error('Smart Analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve smart analytics' });
  }
}

// ============================================
// COMPREHENSIVE DASHBOARD (All Modules)
// ============================================
async function getDashboard(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    // Fetch all BI data in parallel for better performance
    const [
      revenue,
      bookings,
      customers,
      staff,
      memberships,
      expenses,
      services,
      smart
    ] = await Promise.all([
      AdvancedBIModel.getRevenueIntelligence(salonId, start, end).catch(() => ({})),
      AdvancedBIModel.getBookingAnalytics(salonId, start, end).catch(() => ({})),
      AdvancedBIModel.getCustomerIntelligence(salonId, start, end).catch(() => ({})),
      AdvancedBIModel.getStaffPerformance(salonId, start, end).catch(() => ({})),
      AdvancedBIModel.getMembershipAnalytics(salonId, start, end).catch(() => ({})),
      AdvancedBIModel.getExpenseAnalysis(salonId, start, end).catch(() => ({})),
      AdvancedBIModel.getServicePerformance(salonId, start, end).catch(() => ({})),
      AdvancedBIModel.getSmartAnalytics(salonId, start, end).catch(() => ({}))
    ]);

    res.json({
      dashboard: {
        revenue,
        bookings,
        customers,
        staff,
        memberships,
        expenses,
        services,
        smart
      },
      metadata: {
        period: { start, end },
        generated_at: new Date().toISOString(),
        salon_id: salonId
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
}

// ============================================
// EXPORT ENDPOINTS (PDF/Excel/CSV)
// ============================================

async function exportReportsAsPDF(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate, modules } = req.body;
    
    // TODO: Implement PDF generation using PDFKit or similar
    // This would include all selected report modules
    
    res.json({ message: 'PDF export initiated', status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: 'PDF export failed' });
  }
}

async function exportReportsAsExcel(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate, modules } = req.body;
    
    // TODO: Implement Excel export using xlsx or similar
    // This would create multi-sheet workbook with all report data
    
    res.json({ message: 'Excel export initiated', status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: 'Excel export failed' });
  }
}

async function exportReportsAsCSV(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate, modules } = req.body;
    
    // TODO: Implement CSV export
    // This would create downloadable CSV files for each module
    
    res.json({ message: 'CSV export initiated', status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: 'CSV export failed' });
  }
}

// ============================================
// DRILL-DOWN ANALYTICS (Deep-dive data)
// ============================================

async function drillDownRevenue(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate, dimension } = req.query; // dimension: service, staff, customer, etc
    
    // Return detailed transactions for the selected dimension
    const data = await AdvancedBIModel.getRevenueIntelligence(salonId, startDate, endDate);
    
    // Filter based on dimension
    if (dimension === 'service') {
      res.json({ data: data.service_breakdown });
    } else if (dimension === 'staff') {
      res.json({ data: data.staff_breakdown });
    } else {
      res.json({ data });
    }
  } catch (error) {
    res.status(500).json({ error: 'Drill-down failed' });
  }
}

// ============================================
// CUSTOM REPORT BUILDER
// ============================================

async function buildCustomReport(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { metrics, filters, groupBy, orderBy } = req.body;
    
    // TODO: Implement dynamic query builder
    // Allows users to create custom reports with selected metrics and filters
    
    res.json({ message: 'Custom report generated', data: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to build custom report' });
  }
}

module.exports = {
  // Core BI Modules
  getRevenue,
  getBookings,
  getCustomers,
  getStaff,
  getMemberships,
  getExpenses,
  getServices,
  getSmart,
  
  // Dashboard & Export
  getDashboard,
  exportReportsAsPDF,
  exportReportsAsExcel,
  exportReportsAsCSV,
  
  // Advanced Features
  drillDownRevenue,
  buildCustomReport
};
