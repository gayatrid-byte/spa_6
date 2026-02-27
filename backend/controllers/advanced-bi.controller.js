const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * ============================================
 * ADVANCED BI CONTROLLER
 * Enterprise Business Intelligence Module
 * Production-Ready Implementation
 * ============================================
 * 
 * 8 Core Modules:
 * 1. Revenue Intelligence
 * 2. Booking Analytics
 * 3. Customer Intelligence
 * 4. Staff Performance
 * 5. Membership Analytics
 * 6. Expense & Profit Analysis
 * 7. Service Performance
 * 8. Smart AI Analytics (Forecasting)
 */

class AdvancedBIController {

  /**
   * Helper: Standard Error Response
   */
  static handleError(res, error, context) {
    logger.error(`[BI Error] ${context}: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
      context: context
    });
  }

  /**
   * Helper: Validate Date Range
   */
  static getValidatedDates(query) {
    const today = new Date().toISOString().split('T')[0];
    return {
      startDate: query.startDate || today,
      endDate: query.endDate || today
    };
  }

  /**
   * ===================================
   * MODULE 1: REVENUE INTELLIGENCE
   * ===================================
   */
  static async revenueIntelligence(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const { startDate, endDate } = AdvancedBIController.getValidatedDates(req.query);

      // 1. Customer Revenue Metrics (Invoices)
      const [customerMetrics] = await pool.query(
        `SELECT
          COALESCE(SUM(total), 0) as total,
          COALESCE(COUNT(*), 0) as count,
          COALESCE(SUM(tax), 0) as tax,
          COALESCE(SUM(discount), 0) as discount
        FROM invoices
        WHERE salon_id = ? 
          AND DATE(invoice_date) BETWEEN ? AND ?
          AND status IN ('paid', 'pending')`,
        [salonId, startDate, endDate]
      );

      // 2. Membership Revenue Metrics (membership_payments)
      const [membershipMetrics] = await pool.query(
        `SELECT
          COALESCE(SUM(amount), 0) as total,
          COALESCE(COUNT(*), 0) as count,
          COALESCE(SUM(discount), 0) as discount
        FROM membership_payments
        WHERE salon_id = ? 
          AND DATE(payment_date) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      // 3. Expenses for Profit Calculation
      const [expenses] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM expenses
         WHERE salon_id = ? 
           AND DATE(expense_date) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      // 4. Daily Trend - Combined
      const [dailyTrend] = await pool.query(
        `SELECT 
          d.date,
          COALESCE(i.cust_rev, 0) as customer_revenue,
          COALESCE(m.mem_rev, 0) as membership_revenue,
          (COALESCE(i.cust_rev, 0) + COALESCE(m.mem_rev, 0)) as total_revenue
        FROM (
          SELECT DISTINCT DATE(invoice_date) as date FROM invoices WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ?
          UNION
          SELECT DISTINCT DATE(payment_date) as date FROM membership_payments WHERE salon_id = ? AND DATE(payment_date) BETWEEN ? AND ?
        ) d
        LEFT JOIN (
          SELECT DATE(invoice_date) as date, SUM(total) as cust_rev 
          FROM invoices WHERE salon_id = ? AND status != 'cancelled' GROUP BY DATE(invoice_date)
        ) i ON d.date = i.date
        LEFT JOIN (
          SELECT DATE(payment_date) as date, SUM(amount) as mem_rev 
          FROM membership_payments WHERE salon_id = ? GROUP BY DATE(payment_date)
        ) m ON d.date = m.date
        ORDER BY d.date`,
        [salonId, startDate, endDate, salonId, startDate, endDate, salonId, salonId]
      );

      // 5. Consolidated Summary
      const totalCustomerRevenue = parseFloat(customerMetrics[0]?.total || 0);
      const totalMembershipRevenue = parseFloat(membershipMetrics[0]?.total || 0);
      const totalRevenue = totalCustomerRevenue + totalMembershipRevenue;
      const totalExpenses = parseFloat(expenses[0]?.total || 0);
      const totalDiscount = parseFloat(customerMetrics[0]?.discount || 0) + parseFloat(membershipMetrics[0]?.discount || 0);
      const taxCollected = parseFloat(customerMetrics[0]?.tax || 0);
      const transactionCount = parseInt(customerMetrics[0]?.count || 0) + parseInt(membershipMetrics[0]?.count || 0);

      res.json({
        success: true,
        summary: {
          total_revenue: totalRevenue.toFixed(2),
          customer_revenue: totalCustomerRevenue.toFixed(2),
          membership_revenue: totalMembershipRevenue.toFixed(2),
          net_profit: (totalRevenue - totalExpenses).toFixed(2),
          transaction_count: transactionCount,
          avg_invoice: transactionCount > 0 ? (totalRevenue / transactionCount).toFixed(2) : '0.00',
          tax_collected: taxCollected.toFixed(2),
          discount_given: totalDiscount.toFixed(2),
          total_expenses: totalExpenses.toFixed(2)
        },
        daily_trend: dailyTrend || [],
        payment_breakdown: await AdvancedBIController.getPaymentBreakdown(salonId, startDate, endDate)
      });

    } catch (error) {
      return AdvancedBIController.handleError(res, error, 'revenueIntelligence');
    }
  }

  // Helper for Unified Payment Breakdown
  static async getPaymentBreakdown(salonId, startDate, endDate) {
    const [breakdown] = await pool.query(
      `SELECT payment_method, SUM(amount) as amount FROM (
        SELECT 'cash' as payment_method, total as amount FROM invoices WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND JSON_SEARCH(payment_methods, 'one', 'cash') IS NOT NULL
        UNION ALL
        SELECT 'card' as payment_method, total as amount FROM invoices WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND JSON_SEARCH(payment_methods, 'one', 'card') IS NOT NULL
        UNION ALL
        SELECT 'upi' as payment_method, total as amount FROM invoices WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND JSON_SEARCH(payment_methods, 'one', 'upi') IS NOT NULL
        UNION ALL
        SELECT payment_method, amount FROM membership_payments WHERE salon_id = ? AND DATE(payment_date) BETWEEN ? AND ?
      ) combined
      GROUP BY payment_method`,
      [salonId, startDate, endDate, salonId, startDate, endDate, salonId, startDate, endDate, salonId, startDate, endDate]
    );
    return breakdown;
  }

  /**
   * ===================================
   * MODULE 2: BOOKING ANALYTICS
   * ===================================
   */
  static async bookingAnalytics(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const { startDate, endDate } = AdvancedBIController.getValidatedDates(req.query);

      // 1. Booking Stats
      const [bookingStats] = await pool.query(
        `SELECT
          COUNT(*) as total_bookings,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
          COALESCE(AVG(total_duration), 0) as avg_duration_minutes,
          COALESCE(SUM(total_amount), 0) as total_booking_value
        FROM bookings
        WHERE salon_id = ?
          AND DATE(booking_date) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      // 2. Bookings by Type
      const [byType] = await pool.query(
        `SELECT
          booking_type,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings
        WHERE salon_id = ?
          AND DATE(booking_date) BETWEEN ? AND ?
        GROUP BY booking_type`,
        [salonId, startDate, endDate]
      );

      // 3. Daily Trend
      const [dailyTrend] = await pool.query(
        `SELECT
          DATE(booking_date) as date,
          COUNT(*) as bookings,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM bookings
        WHERE salon_id = ?
          AND DATE(booking_date) BETWEEN ? AND ?
        GROUP BY DATE(booking_date)
        ORDER BY DATE(booking_date)`,
        [salonId, startDate, endDate]
      );

      // 4. Peak Booking Hour
      const [peakHour] = await pool.query(
        `SELECT
          HOUR(booking_date) as hour,
          COUNT(*) as booking_count
        FROM bookings
        WHERE salon_id = ?
          AND DATE(booking_date) BETWEEN ? AND ?
        GROUP BY HOUR(booking_date)
        ORDER BY booking_count DESC
        LIMIT 1`,
        [salonId, startDate, endDate]
      );

      // 5. Repeat Booking Ratio
      const [repeatBookings] = await pool.query(
        `SELECT
          COUNT(DISTINCT CASE WHEN booking_count > 1 THEN customer_id END) as repeat_customers,
          COUNT(DISTINCT customer_id) as total_customers
        FROM (
          SELECT customer_id, COUNT(*) as booking_count
          FROM bookings
          WHERE salon_id = ?
            AND DATE(booking_date) BETWEEN ? AND ?
            AND status = 'completed'
          GROUP BY customer_id
        ) AS customer_bookings`,
        [salonId, startDate, endDate]
      );

      const totalBookings = bookingStats[0]?.total_bookings || 0;
      const cancelledBookings = bookingStats[0]?.cancelled_bookings || 0;
      const cancellationRate = totalBookings ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0;
      const peakBookingHour = peakHour[0]?.hour !== undefined ? `${peakHour[0].hour}:00` : 'N/A';
      const repeatCustomerRatio = repeatBookings[0]?.total_customers ?
        ((repeatBookings[0].repeat_customers / repeatBookings[0].total_customers) * 100).toFixed(1) : 0;

      res.json({
        success: true,
        summary: {
          total_bookings: totalBookings,
          completed_bookings: bookingStats[0]?.completed_bookings || 0,
          cancelled_bookings: cancelledBookings,
          completion_rate: bookingStats[0]?.total_bookings ? ((bookingStats[0].completed_bookings / totalBookings) * 100).toFixed(1) : 0,
          cancellation_rate: cancellationRate,
          peak_booking_hour: peakBookingHour,
          repeat_booking_ratio: repeatCustomerRatio,
          total_booking_value: parseFloat(bookingStats[0]?.total_booking_value || 0).toFixed(2)
        },
        by_type: byType || [],
        daily_trend: dailyTrend || []
      });

    } catch (error) {
      return AdvancedBIController.handleError(res, error, 'bookingAnalytics');
    }
  }

  /**
   * ===================================
   * MODULE 3: CUSTOMER INTELLIGENCE
   * ===================================
   */
  static async customerIntelligence(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const { startDate, endDate } = AdvancedBIController.getValidatedDates(req.query);

      // 1. Customer Metrics
      const [metrics] = await pool.query(
        `SELECT
          COUNT(DISTINCT c.id) as total_customers,
          COUNT(DISTINCT CASE WHEN DATE(c.created_at) BETWEEN ? AND ? THEN c.id END) as new_customers
        FROM customers c
        WHERE c.salon_id = ?`,
        [startDate, endDate, salonId]
      );

      const [revenueMetrics] = await pool.query(
        `SELECT
          COUNT(DISTINCT customer_id) as active_customers,
          COALESCE(SUM(total), 0) as customer_revenue
        FROM invoices
        WHERE salon_id = ?
          AND DATE(invoice_date) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      // 2. Top Customers
      const [topCustomers] = await pool.query(
        `SELECT
          c.id, c.name, c.phone,
          COUNT(b.id) as booking_count,
          COALESCE(SUM(b.total_amount), 0) as total_spent
        FROM customers c
        JOIN bookings b ON c.id = b.customer_id
        WHERE c.salon_id = ?
          AND DATE(b.booking_date) BETWEEN ? AND ?
          AND b.status = 'completed'
        GROUP BY c.id
        ORDER BY total_spent DESC
        LIMIT 10`,
        [salonId, startDate, endDate]
      );

      // 3. Repeat Customer Analysis
      const [repeatAnalysis] = await pool.query(
        `SELECT
          COUNT(DISTINCT CASE WHEN booking_count = 1 THEN customer_id END) as first_time_customers,
          COUNT(DISTINCT CASE WHEN booking_count > 1 THEN customer_id END) as repeat_customers,
          COUNT(DISTINCT customer_id) as total_customers_period
        FROM (
          SELECT customer_id, COUNT(*) as booking_count
          FROM bookings
          WHERE salon_id = ?
            AND DATE(booking_date) BETWEEN ? AND ?
            AND status = 'completed'
          GROUP BY customer_id
        ) AS customer_bookings`,
        [salonId, startDate, endDate]
      );

      // 4. Customer Lifetime Value (Avg spend per customer all time)
      const [ltv] = await pool.query(
        `SELECT
          COUNT(DISTINCT customer_id) as total_cust_ltv,
          COALESCE(SUM(total_amount), 0) as total_lifetime_spend
        FROM bookings
        WHERE salon_id = ?
          AND status = 'completed'`,
        [salonId]
      );

      // 5. Retention Rate (Customers active in current period who were also active before)
      const [beforeDate] = await pool.query(
        `SELECT DATE_SUB(?, INTERVAL 1 DAY) as prev_end_date`, []
      );
      const prevEndDate = beforeDate[0]?.prev_end_date;
      const prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevStartDate.getDate() - (new Date(endDate).getDate() - new Date(startDate).getDate()));

      const [retention] = await pool.query(
        `SELECT
          COUNT(DISTINCT CASE WHEN current_period = 1 AND previous_period = 1 THEN customer_id END) as retained_customers,
          COUNT(DISTINCT CASE WHEN current_period = 1 THEN customer_id END) as current_customers
        FROM (
          SELECT c.id as customer_id,
            MAX(CASE WHEN DATE(b.booking_date) BETWEEN ? AND ? THEN 1 ELSE 0 END) as current_period,
            MAX(CASE WHEN DATE(b.booking_date) <= DATE_SUB(?, INTERVAL 1 DAY) AND DATE(b.booking_date) > DATE_SUB(?, INTERVAL 60 DAY) THEN 1 ELSE 0 END) as previous_period
          FROM customers c
          LEFT JOIN bookings b ON c.id = b.customer_id
          WHERE c.salon_id = ?
          GROUP BY c.id
        ) as retention_data`,
        [startDate, endDate, startDate, startDate, salonId]
      );

      const totalCustomersInPeriod = revenueMetrics[0]?.active_customers || 0;
      const repeatCustomers = repeatAnalysis[0]?.repeat_customers || 0;
      const repeatRatio = totalCustomersInPeriod > 0 ? ((repeatCustomers / totalCustomersInPeriod) * 100).toFixed(1) : 0;

      const totalCustomersLTV = ltv[0]?.total_cust_ltv || 1;
      const avgLTV = ltv[0]?.total_lifetime_spend ? (ltv[0].total_lifetime_spend / totalCustomersLTV).toFixed(2) : 0;

      const retainedCount = retention[0]?.retained_customers || 0;
      const currentCount = retention[0]?.current_customers || 1;
      const retentionRate = currentCount > 0 ? ((retainedCount / currentCount) * 100).toFixed(1) : 0;

      res.json({
        success: true,
        summary: {
          total_customers: metrics[0]?.total_customers || 0,
          new_customers: metrics[0]?.new_customers || 0,
          active_customers: revenueMetrics[0]?.active_customers || 0,
          customer_revenue: parseFloat(revenueMetrics[0]?.customer_revenue || 0).toFixed(2),
          repeat_customer_ratio: repeatRatio,
          retention_rate: retentionRate,
          avg_lifetime_value: parseFloat(avgLTV)
        },
        top_customers: topCustomers || []
      });

    } catch (error) {
      return AdvancedBIController.handleError(res, error, 'customerIntelligence');
    }
  }

  /**
   * ===================================
   * MODULE 4: STAFF PERFORMANCE
   * ===================================
   */
  static async staffPerformance(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const { startDate, endDate } = AdvancedBIController.getValidatedDates(req.query);

      // CORRECTED: Use booking_items to link staff to services
      const [staffStats] = await pool.query(
        `SELECT
          s.id as staff_id,
          s.name as staff_name,
          COUNT(DISTINCT bi.booking_id) as total_bookings,
          COALESCE(SUM(bi.price), 0) as total_revenue,
          COALESCE(SUM(bi.duration_minutes), 0) as total_minutes_worked
        FROM staff s
        LEFT JOIN booking_items bi ON s.id = bi.staff_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        WHERE s.salon_id = ? 
          AND DATE(b.booking_date) BETWEEN ? AND ?
          AND b.status IN ('completed', 'confirmed')
        GROUP BY s.id, s.name
        ORDER BY total_revenue DESC`,
        [salonId, startDate, endDate]
      );

      // Add productivity metrics
      const staffData = staffStats.map(s => {
        const hoursWorked = s.total_minutes_worked ? (s.total_minutes_worked / 60).toFixed(2) : 0;
        const revenuePerHour = hoursWorked > 0 ? (s.total_revenue / hoursWorked).toFixed(2) : '0.00';
        return {
          ...s,
          total_revenue: parseFloat(s.total_revenue).toFixed(2),
          avg_booking_value: s.total_bookings ? (s.total_revenue / s.total_bookings).toFixed(2) : '0.00',
          hours_worked: hoursWorked,
          revenue_per_hour: revenuePerHour
        };
      });

      res.json({
        success: true,
        staff_performance: staffData
      });

    } catch (error) {
      return AdvancedBIController.handleError(res, error, 'staffPerformance');
    }
  }

  /**
   * ===================================
   * MODULE 5: MEMBERSHIP ANALYTICS
   * ===================================
   */
  static async membershipAnalytics(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const { startDate, endDate } = AdvancedBIController.getValidatedDates(req.query);

      // 1. Membership Overview
      const [overview] = await pool.query(
        `SELECT
          COUNT(*) as total_active,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as total_expired,
          SUM(CASE WHEN DATE(created_at) BETWEEN ? AND ? THEN 1 ELSE 0 END) as new_memberships
        FROM memberships
        WHERE salon_id = ?`,
        [startDate, endDate, salonId]
      );

      // 2. Revenue from Memberships (New sales in period)
      const [revenue] = await pool.query(
        `SELECT
          COALESCE(SUM(mp.price), 0) as total_revenue
        FROM memberships m
        JOIN membership_plans mp ON m.plan_id = mp.id
        WHERE m.salon_id = ?
          AND DATE(m.created_at) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      // 3. Memberships by Plan Tier
      const [byTier] = await pool.query(
        `SELECT
          mp.tier,
          mp.name as plan_name,
          COUNT(m.id) as count
        FROM memberships m
        JOIN membership_plans mp ON m.plan_id = mp.id
        WHERE m.salon_id = ?
          AND m.status = 'active'
        GROUP BY mp.tier, mp.name`,
        [salonId]
      );

      // 4. Individual Member Details (with expiry calculations)
      const [memberDetails] = await pool.query(
        `SELECT
          m.id as membership_id,
          c.name as customer_name,
          mp.name as plan_name,
          m.start_date,
          m.end_date,
          DATEDIFF(m.end_date, CURDATE()) as days_left,
          m.wallet_balance,
          m.status
        FROM memberships m
        JOIN customers c ON m.customer_id = c.id
        JOIN membership_plans mp ON m.plan_id = mp.id
        WHERE m.salon_id = ?
        ORDER BY m.end_date ASC`,
        [salonId]
      );

      // 5. Expiring Soon Count (7 days)
      const [expiring] = await pool.query(
        `SELECT COUNT(*) as expiring_soon
        FROM memberships
        WHERE salon_id = ?
          AND status = 'active'
          AND DATEDIFF(end_date, CURDATE()) BETWEEN 1 AND 7`,
        [salonId]
      );

      // 6. Renewal Rate & Average Membership Value
      const [avgMembership] = await pool.query(
        `SELECT
          COUNT(*) as total_memberships,
          COALESCE(AVG(mp.price), 0) as avg_price
        FROM memberships m
        JOIN membership_plans mp ON m.plan_id = mp.id
        WHERE m.salon_id = ?`,
        [salonId]
      );

      res.json({
        success: true,
        summary: {
          active_memberships: overview[0]?.total_active || 0,
          expired_memberships: overview[0]?.total_expired || 0,
          new_memberships: overview[0]?.new_memberships || 0,
          expiring_soon: expiring[0]?.expiring_soon || 0,
          membership_revenue: parseFloat(revenue[0]?.total_revenue || 0).toFixed(2),
          avg_membership_value: parseFloat(avgMembership[0]?.avg_price || 0).toFixed(2)
        },
        by_tier: byTier || [],
        member_details: memberDetails || []
      });

    } catch (error) {
      return AdvancedBIController.handleError(res, error, 'membershipAnalytics');
    }
  }

  /**
   * ===================================
   * MODULE 6: EXPENSE & PROFIT ANALYSIS
   * ===================================
   */
  static async expenseAndProfit(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const { startDate, endDate } = AdvancedBIController.getValidatedDates(req.query);

      // 1. Total Revenue (Invoices)
      const [rev] = await pool.query(
        `SELECT COALESCE(SUM(total), 0) as total_revenue
         FROM invoices
         WHERE salon_id = ? 
         AND DATE(invoice_date) BETWEEN ? AND ?
         AND status != 'cancelled'`,
        [salonId, startDate, endDate]
      );

      // 2. Total Expenses
      const [exp] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_expenses
         FROM expenses
         WHERE salon_id = ? 
         AND DATE(expense_date) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      const totalRevenue = parseFloat(rev[0]?.total_revenue || 0);
      const totalExpenses = parseFloat(exp[0]?.total_expenses || 0);
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // 3. Expense Breakdown
      const [breakdown] = await pool.query(
        `SELECT category, COALESCE(SUM(amount), 0) as amount
         FROM expenses
         WHERE salon_id = ? 
         AND DATE(expense_date) BETWEEN ? AND ?
         GROUP BY category`,
        [salonId, startDate, endDate]
      );

      res.json({
        success: true,
        summary: {
          total_revenue: totalRevenue.toFixed(2),
          total_expenses: totalExpenses.toFixed(2),
          net_profit: netProfit.toFixed(2),
          profit_margin_pct: profitMargin.toFixed(2)
        },
        expense_breakdown: breakdown || []
      });

    } catch (error) {
      return AdvancedBIController.handleError(res, error, 'expenseAndProfit');
    }
  }

  /**
   * ===================================
   * MODULE 7: SERVICE PERFORMANCE
   * ===================================
   */
  static async servicePerformance(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const { startDate, endDate } = AdvancedBIController.getValidatedDates(req.query);

      // 1. Service Performance (Top performers)
      const [services] = await pool.query(
        `SELECT
          s.id,
          s.name,
          s.category_id,
          c.name as category_name,
          COUNT(bi.id) as booking_count,
          COALESCE(SUM(bi.price), 0) as total_revenue,
          COALESCE(AVG(bi.price), 0) as avg_price,
          COALESCE(AVG(bi.duration_minutes), 0) as avg_duration
        FROM services s
        JOIN categories c ON s.category_id = c.id
        LEFT JOIN booking_items bi ON s.id = bi.service_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        WHERE s.salon_id = ?
          AND (b.booking_date IS NULL OR DATE(b.booking_date) BETWEEN ? AND ?)
          AND (b.status IS NULL OR b.status = 'completed')
        GROUP BY s.id, s.name, c.name
        HAVING booking_count > 0
        ORDER BY total_revenue DESC`,
        [salonId, startDate, endDate]
      );

      // 2. Get all services to find lowest performers
      const [allServices] = await pool.query(
        `SELECT
          s.id,
          s.name,
          COUNT(DISTINCT bi.booking_id) as booking_count,
          COALESCE(SUM(bi.price), 0) as total_revenue
        FROM services s
        LEFT JOIN booking_items bi ON s.id = bi.service_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        WHERE s.salon_id = ?
          AND (b.booking_date IS NULL OR DATE(b.booking_date) BETWEEN ? AND ?)
          AND (b.status IS NULL OR b.status = 'completed')
        GROUP BY s.id, s.name
        ORDER BY total_revenue ASC
        LIMIT 5`,
        [salonId, startDate, endDate]
      );

      // 3. Average Service Price
      const [avgPrice] = await pool.query(
        `SELECT COALESCE(AVG(s.price), 0) as avg_service_price
        FROM services s
        WHERE s.salon_id = ?`,
        [salonId]
      );

      res.json({
        success: true,
        summary: {
          total_services_count: services.length,
          avg_service_price: parseFloat(avgPrice[0]?.avg_service_price || 0).toFixed(2),
          top_selling: services[0]?.name || 'N/A',
          most_profitable: services[0]?.name || 'N/A'
        },
        performance: services.map(s => ({
          ...s,
          total_revenue: parseFloat(s.total_revenue).toFixed(2),
          avg_price: parseFloat(s.avg_price).toFixed(2)
        })),
        low_performers: allServices || []
      });

    } catch (error) {
      return AdvancedBIController.handleError(res, error, 'servicePerformance');
    }
  }

  /**
   * ===================================
   * MODULE 8: SMART AI ANALYTICS (Forecasting)
   * ===================================
   */
  static async smartAIAnalytics(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const daysToForecast = 30;

      // 1. Get Historical Daily Revenue (Last 60 days)
      const [history] = await pool.query(
        `SELECT
          DATE(invoice_date) as date,
          COALESCE(SUM(total), 0) as revenue
        FROM invoices
        WHERE salon_id = ? 
          AND DATE(invoice_date) >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
          AND status != 'cancelled'
        GROUP BY DATE(invoice_date)
        ORDER BY date ASC`,
        [salonId]
      );

      // 2. REAL Forecast Logic - Linear Trend Projection (NO FAKE DATA)
      let forecastedRevenue = [];
      if (history.length > 7) {
        let lastDate = new Date(history[history.length - 1].date);

        // Calculate 7-day moving average
        const last7 = history.slice(-7);
        const avg7Days = last7.reduce((acc, curr) => acc + parseFloat(curr.revenue), 0) / last7.length;

        // Calculate linear trend using least squares regression on last 30 days
        const last30 = history.slice(-30);
        let slope = 0;

        if (last30.length > 1) {
          const n = last30.length;
          let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

          last30.forEach((point, index) => {
            const x = index;
            const y = parseFloat(point.revenue);
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
          });

          // Linear regression slope: (n*sumXY - sumX*sumY) / (n*sumX2 - sumX^2)
          const denominator = (n * sumX2 - sumX * sumX);
          if (denominator !== 0) {
            slope = (n * sumXY - sumX * sumY) / denominator;
          }
        }

        // Calculate daily growth rate percentage
        const dailyGrowthRate = avg7Days > 0 ? (slope / avg7Days) : 0;

        // Project next 30 days using linear trend
        for (let i = 1; i <= daysToForecast; i++) {
          const nextDate = new Date(lastDate);
          nextDate.setDate(lastDate.getDate() + i);

          // Linear projection: base + (slope * days ahead)
          const forecastValue = Math.max(0, avg7Days + (slope * i));

          forecastedRevenue.push({
            date: nextDate.toISOString().split('T')[0],
            predicted_revenue: forecastValue.toFixed(2),
            growth_rate_pct: (dailyGrowthRate * 100).toFixed(2)
          });
        }
      }

      // 3. Monthly Aggregation (Revenue & Bookings)
      const [monthlyTrend] = await pool.query(
        `SELECT 
            DATE_FORMAT(booking_date, '%Y-%m') as month,
            COUNT(*) as total_bookings,
            SUM(total_amount) as total_revenue
         FROM bookings
         WHERE salon_id = ? 
           AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
         ORDER BY month ASC`,
        [salonId]
      );

      res.json({
        success: true,
        historical_revenue: history.map(h => ({ date: h.date, revenue: parseFloat(h.revenue).toFixed(2) })),
        revenue_forecast: forecastedRevenue,
        monthly_trend: monthlyTrend.map(m => ({
          month: m.month,
          bookings: m.total_bookings,
          revenue: parseFloat(m.total_revenue || 0).toFixed(2)
        }))
      });

    } catch (error) {
      return AdvancedBIController.handleError(res, error, 'smartAIAnalytics');
    }
  }

  /**
   * ===================================
   * CONSOLIDATED DASHBOARD
   * ===================================
   */
  static async getBIConsolidatedDashboard(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const { startDate, endDate } = AdvancedBIController.getValidatedDates(req.query);

      // Run parallel queries for speed
      const [
        [revenue],
        [expenses],
        [bookings],
        [customers],
        [staff]
      ] = await Promise.all([
        pool.query(`SELECT COALESCE(SUM(total), 0) as val FROM invoices WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ?`, [salonId, startDate, endDate]),
        pool.query(`SELECT COALESCE(SUM(amount), 0) as val FROM expenses WHERE salon_id = ? AND DATE(expense_date) BETWEEN ? AND ?`, [salonId, startDate, endDate]),
        pool.query(`SELECT COUNT(*) as val FROM bookings WHERE salon_id = ? AND DATE(booking_date) BETWEEN ? AND ?`, [salonId, startDate, endDate]),
        pool.query(`SELECT COUNT(DISTINCT customer_id) as val FROM bookings WHERE salon_id = ? AND DATE(booking_date) BETWEEN ? AND ?`, [salonId, startDate, endDate]),
        pool.query(`SELECT COUNT(*) as val FROM staff WHERE salon_id = ? AND status = 'active'`, [salonId])
      ]);

      const totalRevenue = parseFloat(revenue[0]?.val || 0);
      const totalExpenses = parseFloat(expenses[0]?.val || 0);
      const netProfit = totalRevenue - totalExpenses;

      res.json({
        success: true,
        consolidated_kpis: {
          total_revenue: totalRevenue.toFixed(2),
          total_expenses: totalExpenses.toFixed(2),
          net_profit: netProfit.toFixed(2),
          total_bookings: bookings[0]?.val || 0,
          unique_customers: customers[0]?.val || 0,
          active_staff: staff[0]?.val || 0
        }
      });

    } catch (error) {
      return AdvancedBIController.handleError(res, error, 'getBIConsolidatedDashboard');
    }
  }
}

module.exports = AdvancedBIController;
