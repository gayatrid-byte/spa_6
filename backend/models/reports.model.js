/**
 * REPORTS MODEL
 * Advanced Business Intelligence Data Retrieval
 */

const { pool } = require('../config/database');

class ReportsModel {

  // ============================================
  // DASHBOARD OVERVIEW DATA
  // ============================================
  static async getDashboardData(salonId, startDate, endDate) {
    try {
      // Calculate previous period dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const prevStart = new Date(start);
      prevStart.setDate(start.getDate() - daysDiff);
      const prevEnd = new Date(start);
      prevEnd.setDate(start.getDate() - 1);

      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];

      const promises = [
        // Today's revenue
        pool.query(
          `SELECT COALESCE(SUM(total), 0) as total FROM invoices 
           WHERE salon_id = ? AND DATE(invoice_date) = CURDATE() AND status = 'paid'`,
          [salonId]
        ),

        // Total bookings in period
        pool.query(
          `SELECT COUNT(*) as total FROM bookings 
           WHERE salon_id = ? AND DATE(booking_date) BETWEEN ? AND ?`,
          [salonId, startDate, endDate]
        ),

        // New customers in period
        pool.query(
          `SELECT COUNT(*) as total FROM customers 
           WHERE salon_id = ? AND DATE(created_at) BETWEEN ? AND ?`,
          [salonId, startDate, endDate]
        ),

        // Profit calculation
        pool.query(
          `SELECT 
            COALESCE(SUM(i.total), 0) as revenue,
            COALESCE(SUM(e.amount), 0) as expenses
           FROM invoices i
           LEFT JOIN expenses e ON i.salon_id = e.salon_id AND DATE(e.expense_date) BETWEEN ? AND ?
           WHERE i.salon_id = ? AND DATE(i.invoice_date) BETWEEN ? AND ? AND i.status = 'paid'`,
          [startDate, endDate, salonId, startDate, endDate]
        ),

        // Completion rate
        pool.query(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
           FROM bookings 
           WHERE salon_id = ? AND DATE(booking_date) BETWEEN ? AND ?`,
          [salonId, startDate, endDate]
        ),

        // Previous period bookings
        pool.query(
          `SELECT COUNT(*) as total FROM bookings 
           WHERE salon_id = ? AND DATE(booking_date) BETWEEN ? AND ?`,
          [salonId, prevStartStr, prevEndStr]
        ),

        // Previous period customers
        pool.query(
          `SELECT COUNT(*) as total FROM customers 
           WHERE salon_id = ? AND DATE(created_at) BETWEEN ? AND ?`,
          [salonId, prevStartStr, prevEndStr]
        ),

        // Previous period profit
        pool.query(
          `SELECT 
            COALESCE(SUM(i.total), 0) as revenue,
            COALESCE(SUM(e.amount), 0) as expenses
           FROM invoices i
           LEFT JOIN expenses e ON i.salon_id = e.salon_id AND DATE(e.expense_date) BETWEEN ? AND ?
           WHERE i.salon_id = ? AND DATE(i.invoice_date) BETWEEN ? AND ? AND i.status = 'paid'`,
          [prevStartStr, prevEndStr, salonId, prevStartStr, prevEndStr]
        )
      ];

      const results = await Promise.all(promises);

      const [todayRevenue] = results[0];
      const [totalBookings] = results[1];
      const [newCustomers] = results[2];
      const [profitData] = results[3];
      const [completionData] = results[4];
      const [prevBookings] = results[5];
      const [prevCustomers] = results[6];
      const [prevProfitData] = results[7];

      const currentProfit = (profitData[0]?.revenue || 0) - (profitData[0]?.expenses || 0);
      const prevProfit = (prevProfitData[0]?.revenue || 0) - (prevProfitData[0]?.expenses || 0);

      // Calculate growth percentages
      const calcGrowth = (current, previous) => {
        if (previous === 0) return 0;
        return (((current - previous) / previous) * 100).toFixed(1);
      };

      return {
        todayRevenue: todayRevenue[0]?.total || 0,
        revenueGrowth: calcGrowth(profitData[0]?.revenue || 0, prevProfitData[0]?.revenue || 0),
        totalBookings: totalBookings[0]?.total || 0,
        bookingsGrowth: calcGrowth(totalBookings[0]?.total || 0, prevBookings[0]?.total || 0),
        newCustomers: newCustomers[0]?.total || 0,
        newCustomersGrowth: calcGrowth(newCustomers[0]?.total || 0, prevCustomers[0]?.total || 0),
        profit: currentProfit,
        profitGrowth: calcGrowth(currentProfit, prevProfit),
        completionRate: completionData[0]?.total > 0 ? ((completionData[0]?.completed / completionData[0]?.total) * 100).toFixed(1) : 0,
        completionGrowth: 0
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  // ============================================
  // CUSTOMER INTELLIGENCE
  // ============================================
  static async getCustomerIntelligence(salonId, startDate, endDate) {
    try {
      const [data] = await pool.query(
        `SELECT 
          COUNT(DISTINCT c.id) as total,
          SUM(CASE WHEN DATE(c.created_at) BETWEEN ? AND ? THEN 1 ELSE 0 END) as new,
          SUM(CASE WHEN (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) > 1 THEN 1 ELSE 0 END) / 
            NULLIF(COUNT(DISTINCT c.id), 0) * 100 as repeatRate,
          AVG(COALESCE((SELECT SUM(total) FROM invoices i WHERE i.customer_id = c.id), 0)) as avgLifetimeValue,
          SUM(CASE WHEN DATEDIFF(CURDATE(), (SELECT MAX(booking_date) FROM bookings b WHERE b.customer_id = c.id)) > 90 THEN 1 ELSE 0 END) / 
            NULLIF(COUNT(DISTINCT c.id), 0) * 100 as churnRisk,
          SUM(CASE WHEN (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id AND b.status = 'completed') / 
            NULLIF((SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id), 1) > 0.7 THEN 1 ELSE 0 END) / 
            NULLIF(COUNT(DISTINCT c.id), 0) * 100 as repeatProbability
         FROM customers c
         WHERE c.salon_id = ?`,
        [startDate, endDate, salonId]
      );

      return {
        total: data[0]?.total || 0,
        new: data[0]?.new || 0,
        repeatRate: Math.round(data[0]?.repeatRate || 0),
        avgLifetimeValue: Math.round(data[0]?.avgLifetimeValue || 0),
        churnRisk: data[0]?.churnRisk > 30 ? 'High' : (data[0]?.churnRisk > 15 ? 'Medium' : 'Low'),
        repeatProbability: Math.round(data[0]?.repeatProbability || 0)
      };
    } catch (error) {
      console.error('Error getting customer intelligence:', error);
      throw error;
    }
  }

  // ============================================
  // BOOKING ANALYTICS
  // ============================================
  static async getBookingAnalytics(salonId, startDate, endDate) {
    try {
      const [data] = await pool.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          HOUR(start_time) as peakHour
         FROM bookings
         WHERE salon_id = ? AND DATE(booking_date) BETWEEN ? AND ?
         GROUP BY HOUR(start_time)
         ORDER BY COUNT(*) DESC
         LIMIT 1`,
        [salonId, startDate, endDate]
      );

      const [peakHourData] = await pool.query(
        `SELECT HOUR(start_time) as peakHour, COUNT(*) as count
         FROM bookings
         WHERE salon_id = ? AND DATE(booking_date) BETWEEN ? AND ?
         GROUP BY HOUR(start_time)
         ORDER BY count DESC
         LIMIT 1`,
        [salonId, startDate, endDate]
      );

      return {
        total: data[0]?.total || 0,
        completed: data[0]?.completed || 0,
        cancelled: data[0]?.cancelled || 0,
        confirmed: data[0]?.confirmed || 0,
        peakHour: peakHourData[0] ? `${String(peakHourData[0].peakHour).padStart(2, '0')}:00` : 'N/A'
      };
    } catch (error) {
      console.error('Error getting booking analytics:', error);
      throw error;
    }
  }

  // ============================================
  // REVENUE REPORTS
  // ============================================
  static async getRevenueReports(salonId, startDate, endDate) {
    try {
      const [data] = await pool.query(
        `SELECT 
          SUM(total) as total,
          AVG(total) as average,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(tax) as tax
         FROM invoices
         WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND status = 'paid'`,
        [salonId, startDate, endDate]
      );

      return {
        total: Math.round(data[0]?.total || 0),
        average: Math.round(data[0]?.average || 0),
        pending: data[0]?.pending || 0,
        tax: Math.round(data[0]?.tax || 0)
      };
    } catch (error) {
      console.error('Error getting revenue reports:', error);
      throw error;
    }
  }

  // ============================================
  // STAFF PERFORMANCE
  // ============================================
  static async getStaffPerformance(salonId, startDate, endDate) {
    try {
      const [data] = await pool.query(
        `SELECT 
          COUNT(DISTINCT s.id) as total,
          AVG(COALESCE((SELECT SUM(bi.price) FROM booking_items bi 
            JOIN bookings b ON bi.booking_id = b.id
            WHERE bi.staff_id = s.id AND DATE(b.booking_date) BETWEEN ? AND ?), 0)) as avgRevenue
         FROM staff s
         WHERE s.salon_id = ?`,
        [startDate, endDate, salonId]
      );

      const [topStaff] = await pool.query(
        `SELECT s.name, SUM(bi.price) as revenue
         FROM staff s
         LEFT JOIN booking_items bi ON s.id = bi.staff_id
         LEFT JOIN bookings b ON bi.booking_id = b.id
         WHERE s.salon_id = ? AND DATE(b.booking_date) BETWEEN ? AND ?
         GROUP BY s.id
         ORDER BY revenue DESC
         LIMIT 1`,
        [salonId, startDate, endDate]
      );

      return {
        total: data[0]?.total || 0,
        avgRevenue: Math.round(data[0]?.avgRevenue || 0),
        topName: topStaff[0]?.name || 'N/A',
        topRevenue: Math.round(topStaff[0]?.revenue || 0)
      };
    } catch (error) {
      console.error('Error getting staff performance:', error);
      throw error;
    }
  }

  // ============================================
  // MEMBERSHIP ANALYTICS
  // ============================================
  static async getMembershipAnalytics(salonId, startDate, endDate) {
    try {
      const [data] = await pool.query(
        `SELECT 
          COUNT(CASE WHEN end_date > CURDATE() AND m.status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN DATEDIFF(end_date, CURDATE()) BETWEEN 0 AND 30 AND m.status = 'active' THEN 1 END) as expiring,
          SUM(mp.price) / 12 as mrr
         FROM memberships m
         JOIN membership_plans mp ON m.plan_id = mp.id
         WHERE m.salon_id = ? AND DATE(m.created_at) <= ?`,
        [salonId, endDate]
      );

      // Calculate renewal rate from historical data
      const [renewalData] = await pool.query(
        `SELECT 
          COUNT(CASE WHEN status = 'active' AND end_date > CURDATE() THEN 1 END) as renewed,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired
         FROM memberships
         WHERE salon_id = ?`,
        [salonId]
      );

      const renewalRate = (renewalData[0]?.renewed + renewalData[0]?.expired) > 0
        ? Math.round((renewalData[0]?.renewed / (renewalData[0]?.renewed + renewalData[0]?.expired)) * 100)
        : 0;

      return {
        active: data[0]?.active || 0,
        expiring: data[0]?.expiring || 0,
        renewalRate: renewalRate,
        mrr: Math.round(data[0]?.mrr || 0)
      };
    } catch (error) {
      console.error('Error getting membership analytics:', error);
      throw error;
    }
  }

  // ============================================
  // EXPENSE & PROFIT
  // ============================================
  static async getExpenseAndProfit(salonId, startDate, endDate) {
    try {
      const [data] = await pool.query(
        `SELECT 
          SUM(e.amount) as totalExpenses
         FROM expenses e
         WHERE e.salon_id = ? AND DATE(e.created_at) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      const [revenue] = await pool.query(
        `SELECT SUM(total) as total FROM invoices
         WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND status = 'paid'`,
        [salonId, startDate, endDate]
      );

      const totalExpenses = data[0]?.totalExpenses || 0;
      const totalRevenue = revenue[0]?.total || 0;
      const profit = totalRevenue - totalExpenses;

      return {
        total: Math.round(totalExpenses),
        netProfit: Math.round(profit),
        profitMargin: totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0,
        operatingRatio: totalRevenue > 0 ? Math.round((totalExpenses / totalRevenue) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting expense and profit:', error);
      throw error;
    }
  }

  // ============================================
  // SERVICE PERFORMANCE
  // ============================================
  static async getServicePerformance(salonId, startDate, endDate) {
    try {
      const [data] = await pool.query(
        `SELECT 
          COUNT(DISTINCT s.id) as total,
          s.name as topName
         FROM services s
         LEFT JOIN booking_items bi ON s.id = bi.service_id
         LEFT JOIN bookings b ON bi.booking_id = b.id AND DATE(b.booking_date) BETWEEN ? AND ?
         WHERE s.salon_id = ?
         GROUP BY s.id
         ORDER BY COUNT(bi.id) DESC
         LIMIT 1`,
        [startDate, endDate, salonId]
      );

      return {
        total: data[0]?.total || 0,
        topName: data[0]?.topName || 'N/A',
        totalBookings: data.reduce((sum, s) => sum + (s.booking_count || 0), 0)
      };
    } catch (error) {
      console.error('Error getting service performance:', error);
      throw error;
    }
  }

  // ============================================
  // SMART ANALYTICS / PREDICTIVE INSIGHTS
  // ============================================
  static async getSmartAnalytics(salonId, startDate, endDate) {
    try {
      const customerData = await this.getCustomerIntelligence(salonId, startDate, endDate);
      const bookingData = await this.getBookingAnalytics(salonId, startDate, endDate);

      return {
        churnRisk: customerData.churnRisk,
        peakHour: bookingData.peakHour,
        repeatProbability: customerData.repeatProbability,
        seasonalTrend: 'Growth' // Analyze trend data
      };
    } catch (error) {
      console.error('Error getting smart analytics:', error);
      throw error;
    }
  }

  // ============================================
  // REVENUE TREND (For charts)
  // ============================================
  static async getRevenueTrend(salonId, startDate, endDate) {
    try {
      const [data] = await pool.query(
        `SELECT 
          DATE(invoice_date) as date,
          SUM(total) as revenue
         FROM invoices
         WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND status = 'paid'
         GROUP BY DATE(invoice_date)
         ORDER BY date ASC`,
        [salonId, startDate, endDate]
      );

      return data || [];
    } catch (error) {
      console.error('Error getting revenue trend:', error);
      throw error;
    }
  }

  // ============================================
  // BOOKING STATUS DISTRIBUTION
  // ============================================
  static async getBookingStatusDistribution(salonId, startDate, endDate) {
    try {
      const [data] = await pool.query(
        `SELECT 
          status,
          COUNT(*) as count
         FROM bookings
         WHERE salon_id = ? AND DATE(booking_date) BETWEEN ? AND ?
         GROUP BY status`,
        [salonId, startDate, endDate]
      );

      return data || [];
    } catch (error) {
      console.error('Error getting booking status distribution:', error);
      throw error;
    }
  }

  // ============================================
  // SERVICE REVENUE BREAKDOWN
  // ============================================
  static async getServiceRevenueBreakdown(salonId, startDate, endDate) {
    try {
      const [data] = await pool.query(
        `SELECT 
          s.name as service,
          SUM(bi.price) as revenue,
          COUNT(DISTINCT b.id) as bookings
         FROM services s
         LEFT JOIN booking_items bi ON s.id = bi.service_id
         LEFT JOIN bookings b ON bi.booking_id = b.id AND DATE(b.booking_date) BETWEEN ? AND ?
         WHERE s.salon_id = ?
         GROUP BY s.id
         ORDER BY revenue DESC`,
        [startDate, endDate, salonId]
      );

      return data || [];
    } catch (error) {
      console.error('Error getting service revenue breakdown:', error);
      throw error;
    }
  }
}

module.exports = ReportsModel;
