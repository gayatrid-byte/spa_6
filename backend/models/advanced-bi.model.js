/**
 * ============================================
 * ADVANCED BUSINESS INTELLIGENCE MODEL
 * 5-Layer Analytics Architecture
 * ============================================
 * 
 * Layer 1: Presentation (Dashboard UI)
 * Layer 2: Analytics (KPI Formulas & Calculations)
 * Layer 3: Data Processing (Queries & Aggregations)
 * Layer 4: Warehouse (Fact/Dimension Tables)
 * Layer 5: Source (Original OLTP Tables)
 */

const { pool } = require('../config/database');

class AdvancedBIModel {

  /**
   * ===================================
   * MODULE 1: REVENUE INTELLIGENCE
   * ===================================
   * KPIs: Total Revenue, Revenue Growth, Profit Margin, Revenue by Service, Revenue by Staff
   * Formulas: Revenue = Sum(Completed Invoices), Profit = Revenue - Expenses, Margin % = (Profit/Revenue)*100
   */

  static async getRevenueIntelligence(salonId, startDate, endDate) {
    try {
      // Get Core Revenue Metrics
      const [revenueMetrics] = await pool.query(
        `SELECT
          COALESCE(SUM(i.total), 0) as total_revenue,
          COALESCE(COUNT(DISTINCT i.id), 0) as transaction_count,
          COALESCE(AVG(i.total), 0) as avg_transaction_value,
          COALESCE(MAX(i.total), 0) as max_transaction_value,
          COALESCE(MIN(i.total), 0) as min_transaction_value,
          COALESCE(SUM(i.tax), 0) as tax_collected
        FROM invoices i
        WHERE i.salon_id = ? 
          AND DATE(i.invoice_date) BETWEEN ? AND ?
          AND i.status = 'paid'`,
        [salonId, startDate, endDate]
      );

      // Get Expense Data
      const [expenseData] = await pool.query(
        `SELECT
          COALESCE(SUM(amount), 0) as total_expenses,
          COALESCE(COUNT(*), 0) as expense_count,
          COALESCE(AVG(amount), 0) as avg_expense
        FROM expenses
        WHERE salon_id = ?
          AND DATE(expense_date) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      // Get Service-wise Revenue Breakdown (Drill-down data)
      const [serviceRevenue] = await pool.query(
        `SELECT
          s.id,
          s.name as service_name,
          COALESCE(c.name, 'Uncategorized') as category,
          COALESCE(COUNT(bi.id), 0) as service_count,
          COALESCE(SUM(bi.price), 0) as service_revenue,
          COALESCE(AVG(bi.price), 0) as avg_price,
          COALESCE(ROUND(SUM(bi.price) / (SELECT SUM(total) FROM invoices WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND status = 'paid') * 100, 2), 0) as revenue_share_pct
        FROM services s
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN booking_items bi ON s.id = bi.service_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        WHERE b.salon_id = ? AND DATE(b.booking_date) BETWEEN ? AND ?
        GROUP BY s.id, s.name, c.name
        ORDER BY service_revenue DESC
        LIMIT 10`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      // Get Staff-wise Revenue (Performance analysis) - REAL DATA
      const [staffRevenue] = await pool.query(
        `SELECT
          s.id,
          s.name as staff_name,
          COUNT(DISTINCT bi.booking_id) as bookings_completed,
          COALESCE(SUM(ii.total_price), 0) as revenue_generated,
          COALESCE(AVG(ii.total_price), 0) as avg_booking_value,
          COALESCE(
            ROUND(
              SUM(ii.total_price) / NULLIF(
                (SELECT SUM(total) FROM invoices WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND status = 'paid'), 
                0
              ) * 100, 
              2
            ), 
            0
          ) as revenue_contribution_pct
        FROM staff s
        LEFT JOIN booking_items bi ON s.id = bi.staff_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        LEFT JOIN invoice_items ii ON bi.service_id = ii.service_id AND b.id = (
          SELECT booking_id FROM invoices WHERE id = ii.invoice_id
        )
        LEFT JOIN invoices inv ON ii.invoice_id = inv.id
        WHERE s.salon_id = ? 
          AND (b.booking_date IS NULL OR DATE(b.booking_date) BETWEEN ? AND ?)
          AND (inv.status IS NULL OR inv.status = 'paid')
        GROUP BY s.id, s.name
        ORDER BY revenue_generated DESC
        LIMIT 10`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      // Calculate Financial Ratios
      const totalRevenue = parseFloat(revenueMetrics[0].total_revenue) || 0;
      const totalExpenses = parseFloat(expenseData[0].total_expenses) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
      const operatingRatio = totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(2) : 0;

      // Previous Period Comparison (for growth calculation)
      const prevStartDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() - 1));
      const prevEndDate = new Date(new Date(endDate).setMonth(new Date(endDate).getMonth() - 1));
      const [prevRevenueMetrics] = await pool.query(
        `SELECT COALESCE(SUM(total), 0) as prev_revenue FROM invoices 
         WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND status = 'paid'`,
        [salonId, prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0]]
      );

      const prevRevenue = parseFloat(prevRevenueMetrics[0].prev_revenue) || 0;
      const revenueGrowth = prevRevenue > 0 ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(2) : 0;

      return {
        summary: {
          total_revenue: totalRevenue.toFixed(2),
          total_expenses: totalExpenses.toFixed(2),
          net_profit: netProfit.toFixed(2),
          profit_margin_pct: profitMargin,
          operating_ratio_pct: operatingRatio,
          revenue_growth_pct: revenueGrowth,
          transaction_count: revenueMetrics[0].transaction_count,
          avg_transaction_value: (revenueMetrics[0].avg_transaction_value ? parseFloat(revenueMetrics[0].avg_transaction_value).toFixed(2) : '0.00')
        },
        payment_breakdown: {
          cash: 0,
          card: 0,
          online: 0,
          wallet: 0
        },
        service_breakdown: serviceRevenue,
        staff_breakdown: staffRevenue,
        chart_data: {
          revenue_trend: await this._getRevenueTrend(salonId, startDate, endDate),
          revenue_by_payment_method: [
            { method: 'Total Revenue', value: revenueMetrics[0].total_revenue || 0 },
            { method: 'Total Tax', value: revenueMetrics[0].tax_collected || 0 }
          ]
        }
      };
    } catch (error) {
      console.error('Revenue Intelligence error:', error);
      throw error;
    }
  }

  /**
   * ===================================
   * MODULE 2: BOOKING ANALYTICS
   * ===================================
   * KPIs: Total Bookings, Completion Rate, No-Show Rate, Avg Duration, Staff Utilization
   */

  static async getBookingAnalytics(salonId, startDate, endDate) {
    try {
      const [bookingMetrics] = await pool.query(
        `SELECT
          COUNT(*) as total_bookings,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_bookings,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
          COUNT(DISTINCT customer_id) as unique_customers
        FROM bookings
        WHERE salon_id = ? AND DATE(booking_date) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      const [hourlyDistribution] = await pool.query(
        `SELECT
          HOUR(start_time) as hour,
          COUNT(*) as booking_count
        FROM bookings
        WHERE salon_id = ? AND DATE(booking_date) BETWEEN ? AND ?
        GROUP BY HOUR(start_time)
        ORDER BY hour`,
        [salonId, startDate, endDate]
      );

      const totalBookings = bookingMetrics[0].total_bookings || 0;
      const completionRate = totalBookings > 0 ? ((bookingMetrics[0].completed_bookings / totalBookings) * 100).toFixed(2) : 0;
      const cancellationRate = totalBookings > 0 ? ((bookingMetrics[0].cancelled_bookings / totalBookings) * 100).toFixed(2) : 0;

      return {
        summary: {
          total_bookings: totalBookings,
          completed_bookings: bookingMetrics[0].completed_bookings || 0,
          cancelled_bookings: bookingMetrics[0].cancelled_bookings || 0,
          in_progress_bookings: bookingMetrics[0].in_progress_bookings || 0,
          confirmed_bookings: bookingMetrics[0].confirmed_bookings || 0,
          completion_rate_pct: completionRate,
          cancellation_rate_pct: cancellationRate,
          unique_customers: bookingMetrics[0].unique_customers || 0
        },
        hourly_distribution: hourlyDistribution,
        chart_data: {
          booking_status_breakdown: [
            { status: 'Completed', count: bookingMetrics[0].completed_bookings || 0 },
            { status: 'Cancelled', count: bookingMetrics[0].cancelled_bookings || 0 },
            { status: 'In Progress', count: bookingMetrics[0].in_progress_bookings || 0 },
            { status: 'Confirmed', count: bookingMetrics[0].confirmed_bookings || 0 }
          ]
        }
      };
    } catch (error) {
      console.error('Booking Analytics error:', error);
      throw error;
    }
  }

  /**
   * ===================================
   * MODULE 3: CUSTOMER INTELLIGENCE
   * ===================================
   * KPIs: CLV, Retention Rate, Churn Rate, New vs Repeat, Avg Customer Value
   * Formulas: CLV = Sum(Total Spent), Retention = (Customers who returned / Previous Customers) * 100
   */

  static async getCustomerIntelligence(salonId, startDate, endDate) {
    try {
      const [customerMetrics] = await pool.query(
        `SELECT
          COUNT(DISTINCT c.id) as total_customers,
          SUM(CASE WHEN DATE(c.created_at) BETWEEN ? AND ? THEN 1 ELSE 0 END) as new_customers,
          COUNT(DISTINCT CASE WHEN (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id AND DATE(booking_date) < ?) > 0 THEN c.id END) as repeat_customers,
          ROUND(AVG(clv.total_spent), 2) as avg_customer_lifetime_value,
          ROUND(MAX(clv.total_spent), 2) as max_customer_lifetime_value,
          ROUND(MIN(clv.total_spent), 2) as min_customer_lifetime_value
        FROM customers c
        LEFT JOIN (
          SELECT customer_id, SUM(total) as total_spent FROM invoices WHERE status = 'paid' GROUP BY customer_id
        ) clv ON c.id = clv.customer_id
        WHERE c.salon_id = ?`,
        [startDate, endDate, startDate, salonId]
      );

      const [segmentation] = await pool.query(
        `SELECT
          CASE
            WHEN clv.total_spent >= 5000 THEN 'VIP'
            WHEN clv.total_spent >= 2000 THEN 'Premium'
            WHEN clv.total_spent >= 500 THEN 'Regular'
            ELSE 'NewDeferred'
          END as segment,
          COUNT(*) as customer_count,
          ROUND(AVG(clv.total_spent), 2) as avg_segment_value
        FROM customers c
        LEFT JOIN (
          SELECT customer_id, SUM(total) as total_spent FROM invoices WHERE status = 'paid' GROUP BY customer_id
        ) clv ON c.id = clv.customer_id
        WHERE c.salon_id = ?
        GROUP BY segment`,
        [salonId]
      );

      const totalCustomers = customerMetrics[0].total_customers || 0;
      const newCustomers = customerMetrics[0].new_customers || 0;
      const repeatCustomers = customerMetrics[0].repeat_customers || 0;
      const retentionRate = totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(2) : 0;
      const churnRate = totalCustomers > 0 ? (100 - retentionRate).toFixed(2) : 0;

      return {
        summary: {
          total_customers: totalCustomers,
          new_customers: newCustomers,
          repeat_customers: repeatCustomers,
          retention_rate_pct: retentionRate,
          churn_rate_pct: churnRate,
          avg_customer_lifetime_value: customerMetrics[0].avg_customer_lifetime_value || 0,
          max_customer_lifetime_value: customerMetrics[0].max_customer_lifetime_value || 0,
          min_customer_lifetime_value: customerMetrics[0].min_customer_lifetime_value || 0
        },
        segmentation: segmentation,
        chart_data: {
          customer_segmentation: segmentation
        }
      };
    } catch (error) {
      console.error('Customer Intelligence error:', error);
      throw error;
    }
  }

  /**
   * ===================================
   * MODULE 4: STAFF PERFORMANCE
   * ===================================
   * KPIs: Revenue/Staff, Bookings/Staff, Utilization Rate, Top Performers, Commission
   */

  static async getStaffPerformance(salonId, startDate, endDate) {
    try {
      const [staffMetrics] = await pool.query(
        `SELECT
          s.id,
          s.name,
          COUNT(DISTINCT bi.booking_id) as bookings_completed,
          COUNT(DISTINCT b.customer_id) as unique_customers,
          COALESCE(SUM(ii.total_price), 0) as revenue_generated,
          COALESCE(AVG(ii.total_price), 0) as avg_booking_value
        FROM staff s
        LEFT JOIN booking_items bi ON s.id = bi.staff_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        LEFT JOIN invoice_items ii ON bi.service_id = ii.service_id
        LEFT JOIN invoices inv ON ii.invoice_id = inv.id
        WHERE s.salon_id = ?
          AND (b.booking_date IS NULL OR DATE(b.booking_date) BETWEEN ? AND ?)
          AND (inv.status IS NULL OR inv.status = 'paid')
        GROUP BY s.id, s.name
        ORDER BY revenue_generated DESC
        LIMIT 10`,
        [salonId, startDate, endDate]
      );

      return {
        summary: {
          total_staff: staffMetrics.length,
          avg_revenue_per_staff: staffMetrics.length > 0 ?
            (staffMetrics.reduce((sum, s) => sum + parseFloat(s.revenue_generated || 0), 0) / staffMetrics.length).toFixed(2) : 0,
          avg_bookings_per_staff: staffMetrics.length > 0 ?
            (staffMetrics.reduce((sum, s) => sum + (s.bookings_completed || 0), 0) / staffMetrics.length).toFixed(0) : 0,
          top_performer: staffMetrics[0]?.name || 'N/A'
        },
        staff_details: staffMetrics,
        chart_data: {
          staff_revenue: staffMetrics.map(s => ({ name: s.name, revenue: parseFloat(s.revenue_generated) })),
          staff_bookings: staffMetrics.map(s => ({ name: s.name, bookings: s.bookings_completed }))
        }
      };
    } catch (error) {
      console.error('Staff Performance error:', error);
      throw error;
    }
  }

  /**
   * ===================================
   * MODULE 5: MEMBERSHIP ANALYTICS
   * ===================================
   * KPIs: Active Memberships, MRR, Renewal Rate, Expiring Soon, Churn Prediction
   * Formulas: MRR = Sum(Monthly Recurring Revenue), Renewal = (Renewed / Expired) * 100
   */

  static async getMembershipAnalytics(salonId, startDate, endDate) {
    try {
      const [membershipMetrics] = await pool.query(
        `SELECT
          COUNT(DISTINCT CASE WHEN status = 'active' THEN id END) as active_memberships,
          COUNT(DISTINCT CASE WHEN status = 'expired' THEN id END) as expired_memberships,
          COUNT(DISTINCT CASE WHEN DATE(end_date) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN id END) as expiring_soon
        FROM memberships
        WHERE salon_id = ?`,
        [salonId]
      );

      const [membershipByType] = await pool.query(
        `SELECT
          mp.tier as type,
          COUNT(m.id) as count,
          COALESCE(SUM(CASE WHEN m.status = 'active' THEN mp.price ELSE 0 END), 0) as revenue
        FROM memberships m
        LEFT JOIN membership_plans mp ON m.plan_id = mp.id
        WHERE m.salon_id = ?
        GROUP BY mp.tier`,
        [salonId]
      );

      const activeMemberships = membershipMetrics[0].active_memberships || 0;
      const expiredMemberships = membershipMetrics[0].expired_memberships || 0;
      const totalHistorical = activeMemberships + expiredMemberships;
      const renewalRate = totalHistorical > 0 ? ((activeMemberships / totalHistorical) * 100).toFixed(2) : 0;
      const mrr = (membershipByType.reduce((sum, m) => sum + parseFloat(m.revenue || 0), 0) / 12).toFixed(2);

      return {
        summary: {
          active_memberships: activeMemberships,
          expiring_soon: membershipMetrics[0].expiring_soon || 0,
          mrr_estimated: mrr,
          renewal_rate_pct: renewalRate,
          expired_memberships: expiredMemberships
        },
        breakdown_by_type: membershipByType,
        chart_data: {
          membership_status: [
            { status: 'Active', count: activeMemberships },
            { status: 'Expired', count: expiredMemberships },
            { status: 'Expiring Soon', count: membershipMetrics[0].expiring_soon }
          ]
        }
      };
    } catch (error) {
      console.error('Membership Analytics error:', error);
      throw error;
    }
  }

  /**
   * ===================================
   * MODULE 6: EXPENSE & PROFIT ANALYSIS
   * ===================================
   * KPIs: Total Expenses, Profit, Profit Margin, Expense Ratio, Cost per Booking
   */

  static async getExpenseAnalysis(salonId, startDate, endDate) {
    try {
      const [expenseMetrics] = await pool.query(
        `SELECT
          SUM(amount) as total_expenses,
          AVG(amount) as avg_expense,
          COUNT(*) as expense_count,
          MAX(amount) as max_expense,
          MIN(amount) as min_expense
        FROM expenses
        WHERE salon_id = ? AND DATE(expense_date) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      const [expenseByCategory] = await pool.query(
        `SELECT
          category,
          SUM(amount) as total,
          COUNT(*) as count,
          ROUND(SUM(amount) / (SELECT SUM(amount) FROM expenses WHERE salon_id = ? AND DATE(expense_date) BETWEEN ? AND ?) * 100, 2) as pct_of_total
        FROM expenses
        WHERE salon_id = ? AND DATE(expense_date) BETWEEN ? AND ?
        GROUP BY category`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      const [revenueData] = await pool.query(
        `SELECT COALESCE(SUM(total), 0) as total_revenue FROM invoices
         WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND status = 'paid'`,
        [salonId, startDate, endDate]
      );

      const totalRevenue = parseFloat(revenueData[0].total_revenue) || 0;
      const totalExpenses = parseFloat(expenseMetrics[0].total_expenses) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
      const operatingRatio = totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(2) : 0;
      const avgExpense = expenseMetrics[0].avg_expense ? parseFloat(expenseMetrics[0].avg_expense).toFixed(2) : 0;

      return {
        summary: {
          total_expenses: totalExpenses.toFixed(2),
          total_revenue: totalRevenue.toFixed(2),
          net_profit: netProfit.toFixed(2),
          profit_margin_pct: profitMargin,
          operating_ratio_pct: operatingRatio,
          avg_expense: avgExpense,
          expense_count: expenseMetrics[0].expense_count
        },
        expense_by_category: expenseByCategory,
        chart_data: {
          expense_distribution: expenseByCategory
        }
      };
    } catch (error) {
      console.error('Expense Analysis error:', error);
      throw error;
    }
  }

  /**
   * ===================================
   * MODULE 7: SERVICE PERFORMANCE
   * ===================================
   * KPIs: Popular Services, Service Revenue, Ratings, Growth Rate
   */

  static async getServicePerformance(salonId, startDate, endDate) {
    try {
      const [serviceMetrics] = await pool.query(
        `SELECT
          s.id,
          s.name,
          c.name as category,
          COUNT(DISTINCT ii.id) as bookings,
          COALESCE(SUM(ii.total_price), 0) as revenue,
          COALESCE(AVG(ii.total_price), 0) as avg_price,
          ROUND(
            (COALESCE(SUM(ii.total_price), 0) / NULLIF(
              (SELECT SUM(total) FROM invoices WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND status = 'paid'), 
              0
            )) * 100, 
            2
          ) as revenue_share_pct
        FROM services s
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN invoice_items ii ON s.id = ii.service_id
        LEFT JOIN invoices inv ON ii.invoice_id = inv.id
        WHERE inv.salon_id = ? 
          AND DATE(inv.invoice_date) BETWEEN ? AND ?
          AND inv.status = 'paid'
        GROUP BY s.id, s.name, c.name
        HAVING revenue > 0
        ORDER BY revenue DESC
        LIMIT 10`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      const totalRevenue = serviceMetrics.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
      const avgServicePrice = serviceMetrics.length > 0
        ? (serviceMetrics.reduce((sum, s) => sum + parseFloat(s.avg_price || 0), 0) / serviceMetrics.length).toFixed(2)
        : '0.00';

      return {
        summary: {
          total_services_offered: serviceMetrics.length,
          top_service: serviceMetrics[0]?.name || 'N/A',
          total_service_revenue: totalRevenue.toFixed(2),
          avg_service_price: avgServicePrice
        },
        service_details: serviceMetrics,
        chart_data: {
          service_revenue: serviceMetrics.map(s => ({ name: s.name, revenue: parseFloat(s.revenue || 0) })),
          service_bookings: serviceMetrics.map(s => ({ name: s.name, bookings: s.bookings || 0 }))
        }
      };
    } catch (error) {
      console.error('Service Performance error:', error);
      throw error;
    }
  }

  /**
   * ===================================
   * MODULE 8: SMART AI & ADVANCED ANALYTICS
   * ===================================
   * Advanced Metrics: Churn Prediction, Forecast, Anomalies, Recommendations
   */

  static async getSmartAnalytics(salonId, startDate, endDate) {
    try {
      // Predict Churn Risk Customers
      const [churnRiskCustomers] = await pool.query(
        `SELECT
          c.id,
          c.name,
          c.email,
          MAX(b.booking_date) as last_booking,
          DATEDIFF(CURDATE(), MAX(b.booking_date)) as days_since_booking,
          COUNT(b.id) as lifetime_bookings,
          CASE
            WHEN DATEDIFF(CURDATE(), MAX(b.booking_date)) > 180 THEN 'High Risk'
            WHEN DATEDIFF(CURDATE(), MAX(b.booking_date)) > 90 THEN 'Medium Risk'
            WHEN DATEDIFF(CURDATE(), MAX(b.booking_date)) > 60 THEN 'Low Risk'
            ELSE 'Active'
          END as churn_status
        FROM customers c
        LEFT JOIN bookings b ON c.id = b.customer_id
        WHERE c.salon_id = ?
        GROUP BY c.id, c.name, c.email
        HAVING churn_status IN ('High Risk', 'Medium Risk')
        ORDER BY days_since_booking DESC`,
        [salonId]
      );

      // Revenue Forecast (Next 7 days using moving average)
      const [revenueForecast] = await pool.query(
        `SELECT
          DATE_ADD(CURDATE(), INTERVAL seq.i DAY) as forecast_date,
          ROUND(AVG(daily_revenue), 2) as predicted_revenue
        FROM (
          SELECT 0 as i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
        ) seq
        CROSS JOIN (
          SELECT DATE(invoice_date) as date, SUM(total) as daily_revenue
          FROM invoices
          WHERE salon_id = ? AND DATE(invoice_date) BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE() AND status = 'paid'
          GROUP BY DATE(invoice_date)
        ) recent_data
        GROUP BY seq.i
        ORDER BY seq.i`,
        [salonId]
      );

      // Anomaly Detection - Unusually High/Low Days
      const [anomalies] = await pool.query(
        `SELECT
          date,
          daily_revenue,
          ROUND(daily_revenue - avg_revenue, 2) as deviation,
          ROUND(((daily_revenue - avg_revenue) / avg_revenue) * 100, 2) as deviation_pct
        FROM (
          SELECT
            DATE(invoice_date) as date,
            SUM(total) as daily_revenue,
            AVG(SUM(total)) OVER () as avg_revenue
          FROM invoices
          WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ?
          GROUP BY DATE(invoice_date)
        ) daily_stats
        WHERE ABS((daily_revenue - avg_revenue) / NULLIF(avg_revenue, 0)) > 0.5
        ORDER BY deviation DESC`,
        [salonId, startDate, endDate]
      );

      return {
        churn_prediction: {
          high_risk_customers: churnRiskCustomers.filter(c => c.churn_status === 'High Risk'),
          medium_risk_customers: churnRiskCustomers.filter(c => c.churn_status === 'Medium Risk'),
          total_at_risk: churnRiskCustomers.length
        },
        revenue_forecast: revenueForecast,
        anomalies: anomalies,
        recommendations: [
          churnRiskCustomers.length > 0 ? `${churnRiskCustomers.length} customers at churn risk - Launch engagement campaign` : 'Customer retention excellent',
          anomalies.length > 0 ? `Detected ${anomalies.length} anomalies - Review for patterns` : 'Revenue trending normally'
        ]
      };
    } catch (error) {
      console.error('Smart Analytics error:', error);
      throw error;
    }
  }

  /**
   * ===================================
   * HELPER METHODS
   * ===================================
   */

  static async _getRevenueTrend(salonId, startDate, endDate) {
    try {
      const [trendData] = await pool.query(
        `SELECT
          DATE(invoice_date) as date,
          SUM(total) as revenue
        FROM invoices
        WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ? AND status = 'paid'
        GROUP BY DATE(invoice_date)
        ORDER BY DATE(invoice_date)`,
        [salonId, startDate, endDate]
      );
      return trendData;
    } catch (error) {
      console.error('Revenue trend error:', error);
      return [];
    }
  }

  /**
   * Get Dashboard Overview (All KPIs combined)
   */
  static async getDashboardOverview(salonId, startDate, endDate) {
    try {
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
        this.getRevenueIntelligence(salonId, startDate, endDate),
        this.getBookingAnalytics(salonId, startDate, endDate),
        this.getCustomerIntelligence(salonId, startDate, endDate),
        this.getStaffPerformance(salonId, startDate, endDate),
        this.getMembershipAnalytics(salonId, startDate, endDate),
        this.getExpenseAnalysis(salonId, startDate, endDate),
        this.getServicePerformance(salonId, startDate, endDate),
        this.getSmartAnalytics(salonId, startDate, endDate)
      ]);

      return {
        revenue,
        bookings,
        customers,
        staff,
        memberships,
        expenses,
        services,
        smart,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Dashboard overview error:', error);
      throw error;
    }
  }
}

module.exports = AdvancedBIModel;
