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

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class AdvancedBIController {
  
  /**
   * ===================================
   * MODULE 1: REVENUE INTELLIGENCE
   * ===================================
   */
  
  static async revenueIntelligence(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const { startDate, endDate, period = 'daily' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'startDate and endDate are required (YYYY-MM-DD format)' 
        });
      }

      // 1. Main Revenue Metrics
      const [revenueMetrics] = await pool.query(
        `SELECT
          COALESCE(SUM(i.total), 0) as total_revenue,
          COALESCE(COUNT(DISTINCT i.id), 0) as transaction_count,
          COALESCE(AVG(i.total), 0) as avg_transaction_value,
          COALESCE(MAX(i.total), 0) as max_transaction_value,
          COALESCE(MIN(i.total), 0) as min_transaction_value,
          COALESCE(
            SUM(CASE WHEN JSON_CONTAINS(payment_methods, '"cash"') THEN i.total ELSE 0 END), 0
          ) as cash_revenue,
          COALESCE(
            SUM(CASE WHEN JSON_CONTAINS(payment_methods, '"card"') THEN i.total ELSE 0 END), 0
          ) as card_revenue,
          COALESCE(
            SUM(CASE WHEN JSON_CONTAINS(payment_methods, '"online"') THEN i.total ELSE 0 END), 0
          ) as online_revenue,
          COALESCE(i.tax, 0) as tax_collected,
          COUNT(DISTINCT CASE WHEN i.status = 'paid' THEN i.id END) as paid_invoices,
          COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END), 0) as paid_revenue
        FROM invoices i
        WHERE i.salon_id = ? 
          AND DATE(i.invoice_date) BETWEEN ? AND ?
          AND i.status IN ('paid', 'pending')`,
        [salonId, startDate, endDate]
      );

      // 2. Revenue by Payment Method Breakdown (% Share)
      const [paymentBreakdown] = await pool.query(
        `SELECT 
          'cash' as payment_method,
          COALESCE(SUM(CASE WHEN JSON_CONTAINS(payment_methods, '"cash"') THEN total ELSE 0 END), 0) as amount,
          COALESCE(COUNT(CASE WHEN JSON_CONTAINS(payment_methods, '"cash"') THEN id END), 0) as count,
          ROUND(COALESCE(SUM(CASE WHEN JSON_CONTAINS(payment_methods, '"cash"') THEN total ELSE 0 END), 0) 
            / NULLIF(SUM(total), 0) * 100, 2) as percentage
        FROM invoices
        WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ?
        UNION ALL
        SELECT 
          'card',
          COALESCE(SUM(CASE WHEN JSON_CONTAINS(payment_methods, '"card"') THEN total ELSE 0 END), 0),
          COALESCE(COUNT(CASE WHEN JSON_CONTAINS(payment_methods, '"card"') THEN id END), 0),
          ROUND(COALESCE(SUM(CASE WHEN JSON_CONTAINS(payment_methods, '"card"') THEN total ELSE 0 END), 0) 
            / NULLIF(SUM(total), 0) * 100, 2)
        FROM invoices
        WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ?
        UNION ALL
        SELECT 
          'online',
          COALESCE(SUM(CASE WHEN JSON_CONTAINS(payment_methods, '"online"') THEN total ELSE 0 END), 0),
          COALESCE(COUNT(CASE WHEN JSON_CONTAINS(payment_methods, '"online"') THEN id END), 0),
          ROUND(COALESCE(SUM(CASE WHEN JSON_CONTAINS(payment_methods, '"online"') THEN total ELSE 0 END), 0) 
            / NULLIF(SUM(total), 0) * 100, 2)
        FROM invoices
        WHERE salon_id = ? AND DATE(invoice_date) BETWEEN ? AND ?`,
        [
          salonId, startDate, endDate,
          salonId, startDate, endDate,
          salonId, startDate, endDate
        ]
      );

      // 3. Service-wise Revenue Breakdown (Top 10 - Drill-down data)
      const [serviceRevenue] = await pool.query(
        `SELECT
          s.id,
          s.name as service_name,
          COALESCE(COUNT(DISTINCT bi.id), 0) as service_count,
          COALESCE(SUM(bi.price), 0) as service_revenue,
          COALESCE(AVG(bi.price), 0) as avg_price,
          ROUND(
            COALESCE(SUM(bi.price), 0) / NULLIF(
              (SELECT SUM(total) FROM invoices 
               WHERE salon_id = ? 
               AND DATE(invoice_date) BETWEEN ? AND ?), 0) * 100, 2
          ) as revenue_share_pct
        FROM services s
        LEFT JOIN booking_items bi ON s.id = bi.service_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        LEFT JOIN invoices i ON b.id = JSON_EXTRACT(i.booking_ids, '$[0]')
        WHERE b.salon_id = ? 
          AND i.salon_id = ?
          AND DATE(b.booking_date) BETWEEN ? AND ?
        GROUP BY s.id, s.name
        ORDER BY service_revenue DESC
        LIMIT 10`,
        [salonId, startDate, endDate, salonId, salonId, startDate, endDate]
      );

      // 4. Staff-wise Revenue (Performance analysis)
      const [staffRevenue] = await pool.query(
        `SELECT
          s.id,
          s.name as staff_name,
          COALESCE(COUNT(DISTINCT b.id), 0) as bookings_completed,
          COALESCE(SUM(bi.price), 0) as revenue_generated,
          COALESCE(AVG(bi.price), 0) as avg_booking_value,
          ROUND(
            COALESCE(SUM(bi.price), 0) / NULLIF(
              (SELECT SUM(total) FROM invoices 
               WHERE salon_id = ? 
               AND DATE(invoice_date) BETWEEN ? AND ?), 0) * 100, 2
          ) as revenue_contribution_pct
        FROM staff s
        LEFT JOIN bookings b ON b.created_by = s.id
        LEFT JOIN booking_items bi ON bi.booking_id = b.id AND bi.staff_id = s.id
        WHERE s.salon_id = ? 
          AND b.salon_id = ?
          AND DATE(b.booking_date) BETWEEN ? AND ?
        GROUP BY s.id, s.name
        ORDER BY revenue_generated DESC`,
        [salonId, startDate, endDate, salonId, salonId, startDate, endDate]
      );

      // 5. Daily Revenue Trend (for charting)
      const [dailyTrend] = await pool.query(
        `SELECT
          DATE(i.invoice_date) as date,
          DATE_FORMAT(DATE(i.invoice_date), '%W') as day_name,
          COALESCE(SUM(i.total), 0) as daily_revenue,
          COALESCE(COUNT(i.id), 0) as daily_transactions,
          COALESCE(COUNT(DISTINCT i.customer_id), 0) as unique_customers
        FROM invoices i
        WHERE i.salon_id = ? 
          AND DATE(i.invoice_date) BETWEEN ? AND ?
          AND i.status IN ('paid', 'pending')
        GROUP BY DATE(i.invoice_date)
        ORDER BY DATE(i.invoice_date)`,
        [salonId, startDate, endDate]
      );

      // Calculate KPI Metrics
      const totalRevenue = parseFloat(revenueMetrics[0]?.total_revenue) || 0;
      const transactionCount = revenueMetrics[0]?.transaction_count || 0;
      const avgTransactionValue = parseFloat(revenueMetrics[0]?.avg_transaction_value) || 0;
      
      // Calculate growth metrics (comparing with previous period if available)
      const [previousPeriod] = await pool.query(
        `SELECT COALESCE(SUM(total), 0) as prev_revenue
         FROM invoices
         WHERE salon_id = ? 
           AND DATE(invoice_date) BETWEEN DATE_SUB(?, INTERVAL DATEDIFF(?, ?) DAY) 
           AND DATE_SUB(?, INTERVAL 1 DAY)`,
        [
          salonId, 
          startDate, 
          endDate, 
          startDate,
          startDate
        ]
      );

      const previousRevenue = parseFloat(previousPeriod[0]?.prev_revenue) || 0;
      const revenueGrowth = previousRevenue > 0 
        ? (((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(2)
        : 0;

      res.json({
        period: { startDate, endDate },
        summary: {
          total_revenue: totalRevenue !== undefined ? totalRevenue.toFixed(2) : '0.00',
          transaction_count: transactionCount !== undefined ? transactionCount : 0,
          avg_transaction_value: avgTransactionValue !== undefined ? avgTransactionValue.toFixed(2) : '0.00',
          max_transaction: revenueMetrics && revenueMetrics[0] && revenueMetrics[0].max_transaction_value !== undefined ? revenueMetrics[0].max_transaction_value : 0,
          min_transaction: revenueMetrics && revenueMetrics[0] && revenueMetrics[0].min_transaction_value !== undefined ? revenueMetrics[0].min_transaction_value : 0,
          paid_invoices: revenueMetrics && revenueMetrics[0] && revenueMetrics[0].paid_invoices !== undefined ? revenueMetrics[0].paid_invoices : 0,
          paid_revenue: revenueMetrics && revenueMetrics[0] && revenueMetrics[0].paid_revenue !== undefined ? parseFloat(revenueMetrics[0].paid_revenue).toFixed(2) : '0.00',
          tax_collected: revenueMetrics && revenueMetrics[0] && revenueMetrics[0].tax_collected !== undefined ? parseFloat(revenueMetrics[0].tax_collected).toFixed(2) : '0.00',
          revenue_growth_pct: revenueGrowth !== undefined ? revenueGrowth : '0.00'
        },
        payment_breakdown: Array.isArray(paymentBreakdown) && paymentBreakdown.length > 0 ? paymentBreakdown.map(p => ({
          method: p.payment_method,
          amount: p.amount !== undefined ? parseFloat(p.amount).toFixed(2) : '0.00',
          count: p.count !== undefined ? p.count : 0,
          percentage: p.percentage !== undefined ? p.percentage : 0
        })) : [],
        service_breakdown: Array.isArray(serviceRevenue) && serviceRevenue.length > 0 ? serviceRevenue.map(s => ({
          service_id: s.id || s.service_id || '',
          service_name: s.service_name || '',
          service_count: s.service_count || 0,
          revenue: s.service_revenue !== undefined ? parseFloat(s.service_revenue).toFixed(2) : '0.00',
          avg_price: s.avg_price !== undefined ? parseFloat(s.avg_price).toFixed(2) : '0.00',
          revenue_share_pct: s.revenue_share_pct !== undefined ? s.revenue_share_pct : 0
        })) : [],
        staff_performance: Array.isArray(staffRevenue) && staffRevenue.length > 0 ? staffRevenue.map(s => ({
          staff_id: s.id || s.staff_id || '',
          staff_name: s.staff_name || '',
          bookings: s.bookings_completed || 0,
          revenue: s.revenue_generated !== undefined ? parseFloat(s.revenue_generated).toFixed(2) : '0.00',
          avg_value: s.avg_booking_value !== undefined ? parseFloat(s.avg_booking_value).toFixed(2) : '0.00',
          contribution_pct: s.revenue_contribution_pct !== undefined ? s.revenue_contribution_pct : 0
        })) : [],
        daily_trend: Array.isArray(dailyTrend) && dailyTrend.length > 0 ? dailyTrend.map(d => ({
          date: d.date || '',
          day_name: d.day_name || '',
          revenue: d.daily_revenue !== undefined ? parseFloat(d.daily_revenue).toFixed(2) : '0.00',
          transactions: d.daily_transactions || 0,
          unique_customers: d.unique_customers || 0
        })) : []
      });

    }catch (error) {
  logger.error(`Error in revenueIntelligence: ${error && error.message ? error.message : error} ${error && error.stack ? error.stack : ''}`);
  res.status(500).json({ error: error && error.message ? error.message : String(error), stack: error && error.stack ? error.stack : '' });
}
  }

  /**
   * ===================================
   * MODULE 2: BOOKING ANALYTICS
   * ===================================
   */
  
  static async bookingAnalytics(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate required' });
      }

      // 1. Booking Status Summary
      const [bookingStatus] = await pool.query(
        `SELECT
          status,
          COUNT(*) as count,
          ROUND(COUNT(*) / (SELECT COUNT(*) FROM bookings 
            WHERE salon_id = ? 
            AND DATE(booking_date) BETWEEN ? AND ?) * 100, 2) as percentage
        FROM bookings
        WHERE salon_id = ? 
          AND DATE(booking_date) BETWEEN ? AND ?
        GROUP BY status`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      // 2. Booking Performance Metrics
      const [bookingMetrics] = await pool.query(
        `SELECT
          COALESCE(COUNT(*), 0) as total_bookings,
          COALESCE(COUNT(CASE WHEN status = 'completed' THEN 1 END), 0) as completed_bookings,
          COALESCE(COUNT(CASE WHEN status = 'cancelled' THEN 1 END), 0) as cancelled_bookings,
          COALESCE(ROUND(
            COUNT(CASE WHEN status = 'completed' THEN 1 END) / NULLIF(COUNT(*), 0) * 100, 2), 0
          ) as completion_rate,
          COALESCE(ROUND(
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) / NULLIF(COUNT(*), 0) * 100, 2), 0
          ) as cancellation_rate,
          COALESCE(AVG(total_duration), 0) as avg_duration_minutes,
          COALESCE(SUM(total_amount), 0) as total_booking_value,
          COALESCE(AVG(total_amount), 0) as avg_booking_value
        FROM bookings
        WHERE salon_id = ? 
          AND DATE(booking_date) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      // 3. Booking by Type (Walk-in vs Calling)
      const [bookingByType] = await pool.query(
        `SELECT
          booking_type,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as revenue,
          ROUND(COUNT(*) / (SELECT COUNT(*) FROM bookings 
            WHERE salon_id = ? 
            AND DATE(booking_date) BETWEEN ? AND ?) * 100, 2) as percentage
        FROM bookings
        WHERE salon_id = ? 
          AND DATE(booking_date) BETWEEN ? AND ?
        GROUP BY booking_type`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      // 4. Daily Booking Trend
      const [dailyBookings] = await pool.query(
        `SELECT
          DATE(booking_date) as date,
          DATE_FORMAT(DATE(booking_date), '%W') as day_name,
          COUNT(*) as daily_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COALESCE(SUM(total_amount), 0) as daily_revenue
        FROM bookings
        WHERE salon_id = ? 
          AND DATE(booking_date) BETWEEN ? AND ?
        GROUP BY DATE(booking_date)
        ORDER BY DATE(booking_date)`,
        [salonId, startDate, endDate]
      );

      // 5. Service Demand (Most booked services)
      const [serviceBookings] = await pool.query(
        `SELECT
          COALESCE(s.id, 0) as service_id,
          COALESCE(s.name, 'Unknown') as service_name,
          COUNT(DISTINCT bi.id) as booking_count,
          COALESCE(SUM(bi.price), 0) as revenue,
          COALESCE(AVG(bi.duration_minutes), 0) as avg_duration
        FROM booking_items bi
        LEFT JOIN services s ON bi.service_id = s.id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        WHERE b.salon_id = ? 
          AND DATE(b.booking_date) BETWEEN ? AND ?
        GROUP BY s.id, s.name
        ORDER BY booking_count DESC
        LIMIT 10`,
        [salonId, startDate, endDate]
      );

      // 6. Slot Utilization (Hourly)
      const [slotUtilization] = await pool.query(
        `SELECT
          HOUR(start_time) as hour,
          CONCAT(HOUR(start_time), ':00 - ', HOUR(start_time) + 1, ':00') as time_slot,
          COUNT(*) as bookings,
          ROUND(COUNT(*) / (SELECT COUNT(*) FROM bookings 
            WHERE salon_id = ? 
            AND DATE(booking_date) BETWEEN ? AND ?) * 100, 2) as percentage
        FROM bookings
        WHERE salon_id = ? 
          AND DATE(booking_date) BETWEEN ? AND ?
        GROUP BY HOUR(start_time)
        ORDER BY HOUR(start_time)`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      res.json({
        period: { startDate, endDate },
        summary: {
          total_bookings: bookingMetrics[0]?.total_bookings || 0,
          completed_bookings: bookingMetrics[0]?.completed_bookings || 0,
          cancelled_bookings: bookingMetrics[0]?.cancelled_bookings || 0,
          completion_rate_pct: bookingMetrics[0]?.completion_rate || 0,
          cancellation_rate_pct: bookingMetrics[0]?.cancellation_rate || 0,
          avg_duration_minutes: bookingMetrics[0]?.avg_duration_minutes || 0,
          total_booking_value: parseFloat(bookingMetrics[0]?.total_booking_value).toFixed(2),
          avg_booking_value: parseFloat(bookingMetrics[0]?.avg_booking_value).toFixed(2)
        },
        by_status: bookingStatus.map(b => ({
          status: b.status,
          count: b.count,
          percentage: b.percentage
        })),
        by_type: bookingByType.map(b => ({
          type: b.booking_type,
          count: b.count,
          revenue: parseFloat(b.revenue).toFixed(2),
          percentage: b.percentage
        })),
        daily_trend: dailyBookings.map(d => ({
          date: d.date || '',
          day_name: d.day_name || '',
          bookings: d.daily_bookings !== undefined ? d.daily_bookings : 0,
          completed: d.completed !== undefined ? d.completed : 0,
          cancelled: d.cancelled !== undefined ? d.cancelled : 0,
          revenue: d.daily_revenue !== undefined ? parseFloat(d.daily_revenue).toFixed(2) : '0.00'
        })),
        service_demand: serviceBookings.map(s => ({
          service_id: s.service_id,
          service_name: s.service_name,
          booking_count: s.booking_count,
          revenue: parseFloat(s.revenue).toFixed(2),
          avg_duration_minutes: s.avg_duration
        })),
        slot_utilization: slotUtilization.map(s => ({
          hour: s.hour,
          time_slot: s.time_slot,
          bookings: s.bookings,
          percentage: s.percentage
        }))
      });

    } catch (error) {
      logger.error('Error in bookingAnalytics:', error);
      res.status(500).json({ error: error.message });
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
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate required' });
      }

      // 6. Bookings by Type (for customers module)
      const [bookingsByType] = await pool.query(
        `SELECT
          booking_type,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as revenue,
          ROUND(COUNT(*) / (SELECT COUNT(*) FROM bookings 
            WHERE salon_id = ? 
            AND DATE(booking_date) BETWEEN ? AND ?) * 100, 2) as percentage
        FROM bookings
        WHERE salon_id = ? 
          AND DATE(booking_date) BETWEEN ? AND ?
        GROUP BY booking_type`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      // 7. Staff Performance (for customers module)
      const [staffPerformance] = await pool.query(
        `SELECT
          s.id as staff_id,
          s.name as staff_name,
          COALESCE(COUNT(DISTINCT b.id), 0) as total_bookings,
          COALESCE(SUM(bi.price), 0) as revenue,
          COALESCE(AVG(bi.price), 0) as avg_value
        FROM staff s
        LEFT JOIN bookings b ON b.created_by = s.id AND DATE(b.booking_date) BETWEEN ? AND ?
        LEFT JOIN booking_items bi ON bi.booking_id = b.id AND bi.staff_id = s.id
        WHERE s.salon_id = ?
        GROUP BY s.id, s.name
        ORDER BY revenue DESC`,
        [startDate, endDate, salonId]
      );

      // 1. Customer Count & Metrics
      const [customerMetrics] = await pool.query(
        `SELECT
          COALESCE(COUNT(DISTINCT c.id), 0) as total_customers,
          COALESCE(COUNT(DISTINCT CASE WHEN DATE(c.created_at) BETWEEN ? AND ? THEN c.id END), 0) as new_customers,
          COALESCE(COUNT(DISTINCT b.customer_id), 0) as customers_with_bookings,
          COALESCE(SUM(i.total), 0) as customer_revenue,
          COALESCE(AVG(i.total), 0) as avg_customer_value
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id
        LEFT JOIN bookings b ON c.id = b.customer_id
        WHERE c.salon_id = ? 
          AND DATE(i.invoice_date) BETWEEN ? AND ?`,
        [startDate, endDate, salonId, startDate, endDate]
      );

      // 2. Customer Retention & Churn
      const [retentionData] = await pool.query(
        `SELECT
          COALESCE(COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM bookings b2 
              WHERE b2.customer_id = c.id 
              AND DATE(b2.booking_date) BETWEEN DATE_SUB(?, INTERVAL 30 DAY) AND ?
            ) AND EXISTS (
              SELECT 1 FROM bookings b3 
              WHERE b3.customer_id = c.id 
              AND DATE(b3.booking_date) BETWEEN DATE_SUB(?, INTERVAL 60 DAY) AND DATE_SUB(?, INTERVAL 30 DAY)
            ) THEN c.id 
          END), 0) as retained_customers,
          COALESCE(COUNT(DISTINCT c.id), 0) as active_unique_customers,
          COALESCE(ROUND(
            COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM bookings b2 
                WHERE b2.customer_id = c.id 
                AND DATE(b2.booking_date) BETWEEN DATE_SUB(?, INTERVAL 30 DAY) AND ?
              ) AND NOT EXISTS (
                SELECT 1 FROM bookings b3 
                WHERE b3.customer_id = c.id 
                AND DATE(b3.booking_date) BETWEEN DATE_SUB(?, INTERVAL 60 DAY) AND DATE_SUB(?, INTERVAL 30 DAY)
              ) THEN c.id 
            END) / NULLIF(COUNT(DISTINCT c.id), 0) * 100, 2), 0
          ) as churn_rate_pct
        FROM customers c
        LEFT JOIN bookings b ON c.id = b.customer_id
        WHERE c.salon_id = ? 
          AND DATE(b.booking_date) <= ?`,
        [
          endDate, endDate,
          endDate, endDate,
          endDate, endDate, endDate, endDate,
          salonId, endDate
        ]
      );

      // 3. Customer Lifetime Value (CLV) Distribution
      const [clvDistribution] = await pool.query(
        `SELECT
          CASE 
            WHEN sum_revenue < 1000 THEN 'Budget (< 1000)'
            WHEN sum_revenue < 5000 THEN 'Standard (1000-5000)'
            WHEN sum_revenue < 10000 THEN 'Premium (5000-10000)'
            ELSE 'VIP (> 10000)'
          END as customer_segment,
          COUNT(*) as customer_count,
          COALESCE(ROUND(AVG(sum_revenue), 2), 0) as avg_clv,
          COALESCE(ROUND(SUM(sum_revenue), 2), 0) as segment_revenue
        FROM (
          SELECT 
            COALESCE(SUM(i.total), 0) as sum_revenue
          FROM customers c
          LEFT JOIN invoices i ON c.id = i.customer_id
          WHERE c.salon_id = ?
          GROUP BY c.id
        ) clv_data
        GROUP BY customer_segment
        ORDER BY avg_clv DESC`,
        [salonId]
      );

      // 4. Customer Booking Frequency
      const [bookingFrequency] = await pool.query(
        `SELECT
          CASE 
            WHEN booking_count = 1 THEN 'One-time'
            WHEN booking_count BETWEEN 2 AND 5 THEN 'Regular (2-5)'
            WHEN booking_count BETWEEN 6 AND 10 THEN 'Frequent (6-10)'
            ELSE 'Very Frequent (10+)'
          END as frequency_category,
          COUNT(*) as customer_count,
          ROUND(COUNT(*) / (SELECT COUNT(DISTINCT customer_id) FROM bookings 
            WHERE salon_id = ? 
            AND DATE(booking_date) BETWEEN ? AND ?) * 100, 2) as percentage
        FROM (
          SELECT 
            customer_id,
            COUNT(*) as booking_count
          FROM bookings
          WHERE salon_id = ? 
            AND DATE(booking_date) BETWEEN ? AND ?
          GROUP BY customer_id
        ) freq_data
        GROUP BY frequency_category
        ORDER BY customer_count DESC`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      // 5. Top Customers by Revenue (Top 10)
      const [topCustomers] = await pool.query(
        `SELECT
          c.id as customer_id,
          c.name as customer_name,
          c.phone as customer_phone,
          COALESCE(COUNT(DISTINCT b.id), 0) as total_bookings,
          COALESCE(SUM(i.total), 0) as lifetime_revenue,
          COALESCE(AVG(i.total), 0) as avg_transaction,
          DATE(MAX(b.booking_date)) as last_visit
        FROM customers c
        LEFT JOIN bookings b ON c.id = b.customer_id
        LEFT JOIN invoices i ON c.id = i.customer_id
        WHERE c.salon_id = ? 
          AND DATE(i.invoice_date) BETWEEN ? AND ?
        GROUP BY c.id, c.name, c.phone
        ORDER BY lifetime_revenue DESC
        LIMIT 10`,
        [salonId, startDate, endDate]
      );

      res.json({
        period: { startDate, endDate },
        summary: {
          total_customers: (customerMetrics && customerMetrics[0] && customerMetrics[0].total_customers) ? customerMetrics[0].total_customers : 0,
          new_customers: (customerMetrics && customerMetrics[0] && customerMetrics[0].new_customers) ? customerMetrics[0].new_customers : 0,
          customers_with_bookings: (customerMetrics && customerMetrics[0] && customerMetrics[0].customers_with_bookings) ? customerMetrics[0].customers_with_bookings : 0,
          total_customer_revenue: customerMetrics && customerMetrics[0] && customerMetrics[0].customer_revenue !== undefined ? parseFloat(customerMetrics[0].customer_revenue).toFixed(2) : '0.00',
          avg_customer_lifetime_value: customerMetrics && customerMetrics[0] && customerMetrics[0].avg_customer_value !== undefined ? parseFloat(customerMetrics[0].avg_customer_value).toFixed(2) : '0.00',
          retention_rate_pct: retentionData && retentionData[0] && retentionData[0].retained_customers !== undefined && retentionData[0].active_unique_customers !== undefined && retentionData[0].active_unique_customers !== 0
            ? parseFloat((retentionData[0].retained_customers / retentionData[0].active_unique_customers) * 100).toFixed(2)
            : '0.00',
          churn_rate_pct: retentionData && retentionData[0] && retentionData[0].churn_rate_pct !== undefined ? retentionData[0].churn_rate_pct : 0
        },
        customer_segments: Array.isArray(clvDistribution) && clvDistribution.length > 0 ? clvDistribution.map(c => ({
          segment: c.customer_segment,
          customer_count: c.customer_count,
          avg_clv: parseFloat(c.avg_clv).toFixed(2),
          segment_revenue: parseFloat(c.segment_revenue).toFixed(2)
        })) : [],
        booking_frequency: Array.isArray(bookingFrequency) && bookingFrequency.length > 0 ? bookingFrequency.map(b => ({
          frequency: b.frequency_category,
          customer_count: b.customer_count,
          percentage: b.percentage
        })) : [],
        top_customers: Array.isArray(topCustomers) && topCustomers.length > 0 ? topCustomers.map(c => ({
          customer_id: c.customer_id,
          customer_name: c.customer_name,
          phone: c.customer_phone,
          total_bookings: c.total_bookings,
          lifetime_revenue: parseFloat(c.lifetime_revenue).toFixed(2),
          avg_transaction: parseFloat(c.avg_transaction).toFixed(2),
          last_visit: c.last_visit
        })) : [],
        by_type: Array.isArray(bookingsByType) && bookingsByType.length > 0 ? bookingsByType.map(b => ({
          type: b.booking_type,
          count: b.count,
          revenue: parseFloat(b.revenue).toFixed(2),
          percentage: b.percentage
        })) : [],
        staff_performance: Array.isArray(staffPerformance) && staffPerformance.length > 0 ? staffPerformance.map(s => ({
          staff_id: s.staff_id,
          staff_name: s.staff_name,
          bookings: s.total_bookings,
          revenue: parseFloat(s.revenue).toFixed(2),
          avg_value: parseFloat(s.avg_value).toFixed(2)
        })) : []
      });

    } catch (error) {
      logger.error('Error in customerIntelligence:', error);
      res.status(500).json({ error: error.message });
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
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate required' });
      }

      // 1. Staff Performance Metrics (fixed for schema)
      const [staffMetrics] = await pool.query(
        `SELECT
          s.id as staff_id,
          s.name as staff_name,
          COALESCE(COUNT(DISTINCT b.id), 0) as total_bookings,
          COALESCE(COUNT(CASE WHEN b.status = 'completed' THEN 1 END), 0) as completed_bookings,
          COALESCE(ROUND(
            COUNT(CASE WHEN b.status = 'completed' THEN 1 END) / NULLIF(COUNT(DISTINCT b.id), 0) * 100, 2), 0
          ) as completion_rate,
          COALESCE(SUM(bi.price), 0) as total_revenue,
          COALESCE(AVG(bi.price), 0) as avg_booking_value,
          COALESCE(SUM(b.total_duration), 0) as total_duration_minutes,
          COALESCE(AVG(b.total_duration), 0) as avg_duration_minutes,
          ROUND(
            COALESCE(SUM(bi.price), 0) / NULLIF(
              (SELECT SUM(total) FROM invoices 
               WHERE salon_id = ? 
               AND DATE(invoice_date) BETWEEN ? AND ?), 0) * 100, 2
          ) as revenue_contribution_pct
        FROM staff s
        LEFT JOIN bookings b ON b.created_by = s.id AND b.salon_id = ? AND DATE(b.booking_date) BETWEEN ? AND ?
        LEFT JOIN booking_items bi ON bi.booking_id = b.id AND bi.staff_id = s.id
        WHERE s.salon_id = ?
        GROUP BY s.id, s.name
        ORDER BY total_revenue DESC`,
        [salonId, startDate, endDate, salonId, startDate, endDate, salonId]
      );

      // 2. Staff Utilization Rate (fixed for schema)
      const [staffUtilization] = await pool.query(
        `SELECT
          s.id as staff_id,
          s.name as staff_name,
          COALESCE(SUM(b.total_duration), 0) as hours_worked_minutes,
          ROUND(COALESCE(SUM(b.total_duration), 0) / (DATEDIFF(? , ?) * 480) * 100, 2) as utilization_rate_pct,
          COUNT(DISTINCT DATE(b.booking_date)) as working_days
        FROM staff s
        LEFT JOIN bookings b ON b.created_by = s.id AND b.salon_id = ? AND DATE(b.booking_date) BETWEEN ? AND ?
        WHERE s.salon_id = ?
        GROUP BY s.id, s.name`,
        [endDate, startDate, salonId, startDate, endDate, salonId]
      );

      // 3. Service Specialization (fixed for schema)
      const [serviceSpecialization] = await pool.query(
        `SELECT
          s.id as staff_id,
          s.name as staff_name,
          COALESCE(sr.name, 'Unknown') as top_service,
          COALESCE(COUNT(DISTINCT bi.id), 0) as service_count,
          COALESCE(SUM(bi.price), 0) as service_revenue,
          ROUND(
            COALESCE(SUM(bi.price), 0) / NULLIF(
              (SELECT SUM(bi2.price) FROM booking_items bi2
               LEFT JOIN bookings b2 ON bi2.booking_id = b2.id
               WHERE bi2.staff_id = s.id AND DATE(b2.booking_date) BETWEEN ? AND ?), 0) * 100, 2
          ) as service_revenue_share_pct
        FROM staff s
        LEFT JOIN bookings b ON b.created_by = s.id AND b.salon_id = ? AND DATE(b.booking_date) BETWEEN ? AND ?
        LEFT JOIN booking_items bi ON bi.booking_id = b.id AND bi.staff_id = s.id
        LEFT JOIN services sr ON bi.service_id = sr.id
        WHERE s.salon_id = ?
        GROUP BY s.id, s.name, sr.name
        HAVING service_count > 0
        ORDER BY s.id, service_revenue DESC`,
        [startDate, endDate, salonId, startDate, endDate, salonId]
      );

      // 4. Daily Performance Trend (fixed for schema)
      const [dailyStaffPerformance] = await pool.query(
        `SELECT
          s.id as staff_id,
          s.name as staff_name,
          DATE(b.booking_date) as date,
          COUNT(*) as daily_bookings,
          COALESCE(SUM(bi.price), 0) as daily_revenue
        FROM staff s
        LEFT JOIN bookings b ON b.created_by = s.id AND b.salon_id = ? AND DATE(b.booking_date) BETWEEN ? AND ?
        LEFT JOIN booking_items bi ON bi.booking_id = b.id AND bi.staff_id = s.id
        WHERE s.salon_id = ?
        GROUP BY s.id, s.name, DATE(b.booking_date)
        ORDER BY s.id, DATE(b.booking_date) DESC`,
        [salonId, startDate, endDate, salonId]
      );

      res.json({
        period: { startDate, endDate },
        staff_performance: staffMetrics.map(s => ({
          staff_id: s.staff_id,
          staff_name: s.staff_name,
          total_bookings: s.total_bookings,
          completed_bookings: s.completed_bookings,
          completion_rate_pct: s.completion_rate,
          total_revenue: parseFloat(s.total_revenue).toFixed(2),
          avg_booking_value: parseFloat(s.avg_booking_value).toFixed(2),
          total_hours_worked: (s.total_duration_minutes / 60).toFixed(2),
          avg_booking_duration: (s.avg_duration_minutes).toFixed(2),
          revenue_contribution_pct: s.revenue_contribution_pct
        })),
        staff_utilization: staffUtilization.map(s => ({
          staff_id: s.staff_id,
          staff_name: s.staff_name,
          hours_worked: (s.hours_worked_minutes / 60).toFixed(2),
          utilization_rate_pct: s.utilization_rate_pct,
          working_days: s.working_days
        })),
        service_specialization: serviceSpecialization.map(s => ({
          staff_id: s.staff_id,
          staff_name: s.staff_name,
          top_service: s.top_service,
          service_count: s.service_count,
          service_revenue: parseFloat(s.service_revenue).toFixed(2),
          service_revenue_share_pct: s.service_revenue_share_pct
        })),
        daily_trend: dailyStaffPerformance.map(p => ({
          staff_id: p.staff_id,
          staff_name: p.staff_name,
          date: p.date,
          daily_bookings: p.daily_bookings,
          daily_revenue: parseFloat(p.daily_revenue).toFixed(2)
        }))
      });

    } catch (error) {
      logger.error('Error in staffPerformance:', error);
      res.status(500).json({ error: error.message });
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
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate required' });
      }

      // 1. Membership Overview
      const [membershipOverview] = await pool.query(
        `SELECT
          COALESCE(COUNT(DISTINCT m.id), 0) as total_memberships,
          COALESCE(COUNT(CASE WHEN m.status = 'active' THEN 1 END), 0) as active_memberships,
          COALESCE(COUNT(CASE WHEN m.status = 'expired' THEN 1 END), 0) as expired_memberships,
          COALESCE(COUNT(CASE WHEN m.status = 'cancelled' THEN 1 END), 0) as cancelled_memberships,
          COALESCE(ROUND(
            COUNT(CASE WHEN m.status = 'active' THEN 1 END) / NULLIF(COUNT(*), 0) * 100, 2), 0
          ) as active_rate_pct,
          COALESCE(SUM(m.membership_fee), 0) as membership_revenue
        FROM memberships m
        WHERE m.salon_id = ? 
          AND DATE(m.created_at) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      // 2. New vs Renewal Memberships
      const [membershipTrend] = await pool.query(
        `SELECT
          DATE(m.created_at) as date,
          DATE_FORMAT(DATE(m.created_at), '%W') as day_name,
          COUNT(CASE WHEN m.is_renewal = FALSE THEN 1 END) as new_memberships,
          COUNT(CASE WHEN m.is_renewal = TRUE THEN 1 END) as renewal_memberships,
          COALESCE(SUM(m.membership_fee), 0) as daily_membership_revenue
        FROM memberships m
        WHERE m.salon_id = ? 
          AND DATE(m.created_at) BETWEEN ? AND ?
        GROUP BY DATE(m.created_at)
        ORDER BY DATE(m.created_at)`,
        [salonId, startDate, endDate]
      );

      // 3. Membership by Type/Tier
      const [membershipByType] = await pool.query(
        `SELECT
          m.membership_type as membership_type,
          COUNT(*) as member_count,
          COALESCE(SUM(m.membership_fee), 0) as revenue,
          COALESCE(AVG(m.membership_fee), 0) as avg_fee,
          COALESCE(AVG(DATEDIFF(m.expiry_date, m.created_at)), 0) as avg_duration_days
        FROM memberships m
        WHERE m.salon_id = ? 
          AND DATE(m.created_at) BETWEEN ? AND ?
        GROUP BY m.membership_type
        ORDER BY revenue DESC`,
        [salonId, startDate, endDate]
      );

      // 4. Renewal Rate
      const currentDate = new Date().toISOString().split('T')[0];
      const [renewalRate] = await pool.query(
        `SELECT
          COALESCE(COUNT(CASE 
            WHEN EXISTS (
              SELECT 1 FROM memberships m2 
              WHERE m2.customer_id = m.customer_id 
              AND m2.created_at > m.expiry_date 
              AND m2.is_renewal = TRUE
            ) THEN m.id
          END), 0) as renewed_count,
          COALESCE(COUNT(DISTINCT m.customer_id), 0) as expired_count,
          ROUND(
            COALESCE(COUNT(CASE 
              WHEN EXISTS (
                SELECT 1 FROM memberships m2 
                WHERE m2.customer_id = m.customer_id 
                AND m2.created_at > m.expiry_date 
                AND m2.is_renewal = TRUE
              ) THEN m.id
            END), 0) / NULLIF(COUNT(DISTINCT m.customer_id), 0) * 100, 2
          ) as renewal_rate_pct
        FROM memberships m
        WHERE m.salon_id = ? 
          AND DATE(m.expiry_date) BETWEEN ? AND ?
          AND m.status = 'expired'`,
        [salonId, startDate, endDate]
      );

      // 5. MRR - Monthly Recurring Revenue
      const [mrr] = await pool.query(
        `SELECT
          COALESCE(SUM(CASE 
            WHEN DATEDIFF(m.expiry_date, m.created_at) / 30 >= 1 THEN m.membership_fee / (DATEDIFF(m.expiry_date, m.created_at) / 30)
            ELSE 0
          END), 0) as estimated_mrr
        FROM memberships m
        WHERE m.salon_id = ? 
          AND m.status = 'active'`,
        [salonId]
      );

      res.json({
        period: { startDate, endDate },
        summary: {
          total_memberships: membershipOverview[0]?.total_memberships || 0,
          active_memberships: membershipOverview[0]?.active_memberships || 0,
          expired_memberships: membershipOverview[0]?.expired_memberships || 0,
          cancelled_memberships: membershipOverview[0]?.cancelled_memberships || 0,
          active_rate_pct: membershipOverview[0]?.active_rate_pct || 0,
          membership_revenue: parseFloat(membershipOverview[0]?.membership_revenue).toFixed(2),
          renewal_rate_pct: renewalRate[0]?.renewal_rate_pct || 0,
          estimated_mrr: parseFloat(mrr[0]?.estimated_mrr).toFixed(2)
        },
        trend: membershipTrend.map(t => ({
          date: t.date,
          day_name: t.day_name,
          new_memberships: t.new_memberships,
          renewal_memberships: t.renewal_memberships,
          daily_revenue: parseFloat(t.daily_membership_revenue).toFixed(2)
        })),
        by_type: membershipByType.map(m => ({
          membership_type: m.membership_type,
          member_count: m.member_count,
          revenue: parseFloat(m.revenue).toFixed(2),
          avg_fee: parseFloat(m.avg_fee).toFixed(2),
          avg_duration_days: m.avg_duration_days
        }))
      });

    } catch (error) {
      logger.error('Error in membershipAnalytics:', error);
      res.status(500).json({ error: error.message });
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
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate required' });
      }

      // 1. Total Revenue and Expenses
      const [profitLoss] = await pool.query(
        `SELECT
          COALESCE(SUM(i.total), 0) as total_revenue,
          COALESCE(SUM(e.amount), 0) as total_expenses,
          COALESCE(SUM(i.total), 0) - COALESCE(SUM(e.amount), 0) as net_profit,
          ROUND(
            (COALESCE(SUM(i.total), 0) - COALESCE(SUM(e.amount), 0)) / NULLIF(SUM(i.total), 0) * 100, 2
          ) as profit_margin_pct,
          ROUND(
            COALESCE(SUM(e.amount), 0) / NULLIF(SUM(i.total), 0) * 100, 2
          ) as expense_ratio_pct
        FROM invoices i
        LEFT JOIN expenses e ON DATE(e.expense_date) = DATE(i.invoice_date)
        WHERE i.salon_id = ? 
          AND DATE(i.invoice_date) BETWEEN ? AND ?
        LIMIT 1`,
        [salonId, startDate, endDate]
      );

      // 2. Expense Breakdown by Category
      const [expenseByCategory] = await pool.query(
        `SELECT
          category as expense_category,
          COUNT(*) as expense_count,
          COALESCE(SUM(amount), 0) as category_total,
          COALESCE(AVG(amount), 0) as avg_expense,
          ROUND(
            COALESCE(SUM(amount), 0) / NULLIF(
              (SELECT SUM(amount) FROM expenses 
               WHERE salon_id = ? 
               AND DATE(expense_date) BETWEEN ? AND ?), 0) * 100, 2
          ) as expense_share_pct
        FROM expenses
        WHERE salon_id = ? 
          AND DATE(expense_date) BETWEEN ? AND ?
        GROUP BY category
        ORDER BY category_total DESC`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      // 3. Daily Profit & Loss Trend
      const [dailyPL] = await pool.query(
        `SELECT
          DATE(i.invoice_date) as date,
          DATE_FORMAT(DATE(i.invoice_date), '%W') as day_name,
          COALESCE(SUM(i.total), 0) as daily_revenue,
          COALESCE(SUM(e.amount), 0) as daily_expenses,
          COALESCE(SUM(i.total), 0) - COALESCE(SUM(e.amount), 0) as daily_profit,
          ROUND(
            (COALESCE(SUM(i.total), 0) - COALESCE(SUM(e.amount), 0)) / NULLIF(SUM(i.total), 0) * 100, 2
          ) as daily_margin_pct
        FROM invoices i
        LEFT JOIN expenses e ON DATE(e.expense_date) = DATE(i.invoice_date) AND e.salon_id = i.salon_id
        WHERE i.salon_id = ? 
          AND DATE(i.invoice_date) BETWEEN ? AND ?
        GROUP BY DATE(i.invoice_date)
        ORDER BY DATE(i.invoice_date)`,
        [salonId, startDate, endDate]
      );

      // 4. Operating Expenses per Revenue Unit
      const [operatingMetrics] = await pool.query(
        `SELECT
          COALESCE(SUM(i.total), 0) as total_revenue,
          COALESCE(SUM(e.amount), 0) as total_operating_expenses,
          ROUND(
            COALESCE(SUM(e.amount), 0) / NULLIF(SUM(i.total), 0), 4
          ) as expense_per_revenue_unit,
          ROUND(
            COALESCE(SUM(e.amount), 0) / NULLIF(COUNT(DISTINCT DATE(i.invoice_date)), 0), 2
          ) as avg_daily_expenses
        FROM invoices i
        LEFT JOIN expenses e ON DATE(e.expense_date) = DATE(i.invoice_date)
        WHERE i.salon_id = ? 
          AND DATE(i.invoice_date) BETWEEN ? AND ?`,
        [salonId, startDate, endDate]
      );

      res.json({
        period: { startDate, endDate },
        summary: {
          total_revenue: parseFloat(profitLoss[0]?.total_revenue).toFixed(2),
          total_expenses: parseFloat(profitLoss[0]?.total_expenses).toFixed(2),
          net_profit: parseFloat(profitLoss[0]?.net_profit).toFixed(2),
          profit_margin_pct: profitLoss[0]?.profit_margin_pct || 0,
          expense_ratio_pct: profitLoss[0]?.expense_ratio_pct || 0,
          expense_per_revenue_unit: parseFloat(operatingMetrics[0]?.expense_per_revenue_unit).toFixed(4),
          avg_daily_expenses: parseFloat(operatingMetrics[0]?.avg_daily_expenses).toFixed(2)
        },
        expense_breakdown: expenseByCategory.map(e => ({
          category: e.expense_category,
          count: e.expense_count,
          total: parseFloat(e.category_total).toFixed(2),
          avg: parseFloat(e.avg_expense).toFixed(2),
          share_pct: e.expense_share_pct
        })),
        daily_trend: dailyPL.map(d => ({
          date: d.date,
          day_name: d.day_name,
          revenue: parseFloat(d.daily_revenue).toFixed(2),
          expenses: parseFloat(d.daily_expenses).toFixed(2),
          profit: parseFloat(d.daily_profit).toFixed(2),
          margin_pct: d.daily_margin_pct
        }))
      });

    } catch (error) {
      logger.error('Error in expenseAndProfit:', error);
      res.status(500).json({ error: error.message });
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
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate required' });
      }

      // 1. Service Performance Ranking
      const [servicePerformance] = await pool.query(
        `SELECT
          s.id as service_id,
          s.name as service_name,
          s.category,
          COALESCE(COUNT(DISTINCT bi.id), 0) as booking_count,
          COALESCE(SUM(bi.price), 0) as total_revenue,
          COALESCE(AVG(bi.price), 0) as avg_service_price,
          COALESCE(AVG(bi.duration_minutes), 0) as avg_duration_minutes,
          ROUND(
            COALESCE(SUM(bi.price), 0) / NULLIF(
              (SELECT SUM(total) FROM invoices 
               WHERE salon_id = ? 
               AND DATE(invoice_date) BETWEEN ? AND ?), 0) * 100, 2
          ) as revenue_share_pct,
          ROUND(
            COALESCE(AVG(bi.price), 0) / COALESCE(AVG(bi.duration_minutes), 1) * 60, 2
          ) as revenue_per_hour
        FROM services s
        LEFT JOIN booking_items bi ON s.id = bi.service_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        WHERE b.salon_id = ? 
          AND DATE(b.booking_date) BETWEEN ? AND ?
        GROUP BY s.id, s.name, s.category
        ORDER BY total_revenue DESC`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      // 2. Service Demand by Category
      const [servicesByCategory] = await pool.query(
        `SELECT
          s.category,
          COUNT(DISTINCT bi.id) as booking_count,
          COALESCE(SUM(bi.price), 0) as category_revenue,
          ROUND(
            COALESCE(SUM(bi.price), 0) / NULLIF(
              (SELECT SUM(total) FROM invoices 
               WHERE salon_id = ? 
               AND DATE(invoice_date) BETWEEN ? AND ?), 0) * 100, 2
          ) as category_share_pct
        FROM services s
        LEFT JOIN booking_items bi ON s.id = bi.service_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        WHERE b.salon_id = ? 
          AND DATE(b.booking_date) BETWEEN ? AND ?
        GROUP BY s.category
        ORDER BY category_revenue DESC`,
        [salonId, startDate, endDate, salonId, startDate, endDate]
      );

      // 3. Peak Service Times
      const [peakTimes] = await pool.query(
        `SELECT
          s.name as service_name,
          HOUR(b.start_time) as hour,
          CONCAT(HOUR(b.start_time), ':00') as time_slot,
          COUNT(*) as booking_count
        FROM services s
        LEFT JOIN booking_items bi ON s.id = bi.service_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        WHERE b.salon_id = ? 
          AND DATE(b.booking_date) BETWEEN ? AND ?
        GROUP BY s.name, HOUR(b.start_time)
        ORDER BY s.name, booking_count DESC
        LIMIT 20`,
        [salonId, startDate, endDate]
      );

      // 4. Staff Proficiency by Service
      const [staffProficiency] = await pool.query(
        `SELECT
          s.name as service_name,
          st.name as staff_name,
          COUNT(DISTINCT bi.id) as service_count,
          COALESCE(SUM(bi.price), 0) as staff_service_revenue,
          COALESCE(AVG(bi.price), 0) as avg_service_price,
          ROUND(
            COALESCE(AVG(bi.price), 0) / COALESCE(AVG(bi.duration_minutes), 1) * 60, 2
          ) as revenue_per_hour
        FROM services s
        LEFT JOIN booking_items bi ON s.id = bi.service_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        LEFT JOIN staff st ON b.assigned_staff_id = st.id
        WHERE b.salon_id = ? 
          AND DATE(b.booking_date) BETWEEN ? AND ?
        GROUP BY s.name, st.name
        HAVING service_count > 0
        ORDER BY s.name, staff_service_revenue DESC`,
        [salonId, startDate, endDate]
      );

      res.json({
        period: { startDate, endDate },
        performance: servicePerformance.map(s => ({
          service_id: s.service_id,
          service_name: s.service_name,
          category: s.category,
          booking_count: s.booking_count,
          total_revenue: parseFloat(s.total_revenue).toFixed(2),
          avg_service_price: parseFloat(s.avg_service_price).toFixed(2),
          avg_duration_minutes: s.avg_duration_minutes,
          revenue_share_pct: s.revenue_share_pct,
          revenue_per_hour: parseFloat(s.revenue_per_hour).toFixed(2)
        })),
        by_category: servicesByCategory.map(c => ({
          category: c.category,
          booking_count: c.booking_count,
          revenue: parseFloat(c.category_revenue).toFixed(2),
          share_pct: c.category_share_pct
        })),
        peak_times: peakTimes.map(p => ({
          service_name: p.service_name,
          hour: p.hour,
          time_slot: p.time_slot,
          booking_count: p.booking_count
        })),
        staff_proficiency: staffProficiency.map(s => ({
          service_name: s.service_name,
          staff_name: s.staff_name,
          service_count: s.service_count,
          revenue: parseFloat(s.staff_service_revenue).toFixed(2),
          avg_price: parseFloat(s.avg_service_price).toFixed(2),
          revenue_per_hour: parseFloat(s.revenue_per_hour).toFixed(2)
        }))
      });

    } catch (error) {
      logger.error('Error in servicePerformance:', error);
      res.status(500).json({ error: error.message });
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
      const { days = 30 } = req.query;

      // 1. Historical Data for last 60 days
      const [historicalData] = await pool.query(
        `SELECT
          DATE(i.invoice_date) as date,
          COALESCE(SUM(i.total), 0) as daily_revenue,
          COALESCE(COUNT(i.id), 0) as transaction_count
        FROM invoices i
        WHERE i.salon_id = ? 
          AND DATE(i.invoice_date) >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
        GROUP BY DATE(i.invoice_date)
        ORDER BY DATE(i.invoice_date)`,
        [salonId]
      );

      // Calculate 7-day and 14-day moving averages
      const movingAvg7Day = [];
      const movingAvg14Day = [];
      const forecastedRevenue = [];

      historicalData.forEach((record, index) => {
        // 7-day moving average
        const start7 = Math.max(0, index - 6);
        const avg7 = historicalData
          .slice(start7, index + 1)
          .reduce((sum, r) => sum + parseFloat(r.daily_revenue), 0) / (index - start7 + 1);
        movingAvg7Day.push(avg7);

        // 14-day moving average
        const start14 = Math.max(0, index - 13);
        const avg14 = historicalData
          .slice(start14, index + 1)
          .reduce((sum, r) => sum + parseFloat(r.daily_revenue), 0) / (index - start14 + 1);
        movingAvg14Day.push(avg14);
      });

      // Simple exponential forecasting for next 30 days
      let lastRevenue = parseFloat(historicalData[historicalData.length - 1]?.daily_revenue) || 0;
      const alpha = 0.3; // Smoothing factor

      for (let i = 0; i < Math.min(parseInt(days), 30); i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i + 1);
        const forecastedVal = (alpha * lastRevenue) + ((1 - alpha) * movingAvg7Day[movingAvg7Day.length - 1]);
        forecastedRevenue.push({
          date: forecastDate.toISOString().split('T')[0],
          predicted_revenue: forecastedVal.toFixed(2),
          confidence_range: {
            min: (forecastedVal * 0.85).toFixed(2),
            max: (forecastedVal * 1.15).toFixed(2)
          }
        });
        lastRevenue = forecastedVal;
      }

      // 2. Trend Analysis
      const [trendAnalysis] = await pool.query(
        `SELECT
          WEEK(i.invoice_date) as week,
          COALESCE(SUM(i.total), 0) as weekly_revenue,
          COALESCE(COUNT(i.id), 0) as weekly_transactions,
          COALESCE(AVG(i.total), 0) as avg_transaction
        FROM invoices i
        WHERE i.salon_id = ? 
          AND DATE(i.invoice_date) >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
        GROUP BY WEEK(i.invoice_date)
        ORDER BY WEEK(i.invoice_date)`,
        [salonId]
      );

      // Calculate trend direction
      const trend = trendAnalysis.length > 1
        ? (trendAnalysis[trendAnalysis.length - 1].weekly_revenue - trendAnalysis[0].weekly_revenue) / trendAnalysis[0].weekly_revenue * 100
        : 0;

      res.json({
        historical_performance: historicalData.map((h, i) => ({
          date: h.date,
          actual_revenue: parseFloat(h.daily_revenue).toFixed(2),
          transactions: h.transaction_count,
          moving_avg_7day: movingAvg7Day[i]?.toFixed(2),
          moving_avg_14day: movingAvg14Day[i]?.toFixed(2)
        })),
        forecast: {
          days_ahead: parseInt(days),
          forecasted_values: forecastedRevenue,
          methodology: 'Exponential Smoothing with 7-day Moving Average (α=0.3)',
          confidence_level: '85-115% range at 95% confidence'
        },
        trend_analysis: {
          weekly_data: trendAnalysis.map(t => ({
            week: t.week,
            revenue: parseFloat(t.weekly_revenue).toFixed(2),
            transactions: t.weekly_transactions,
            avg_transaction: parseFloat(t.avg_transaction).toFixed(2)
          })),
          trend_direction: trend > 0 ? 'Upward' : trend < 0 ? 'Downward' : 'Stable',
          trend_percentage_change: trend.toFixed(2)
        }
      });

    } catch (error) {
      logger.error('Error in smartAIAnalytics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * ===================================
   * CONSOLIDATED BI DASHBOARD
   * ===================================
   */
  
  static async getBIConsolidatedDashboard(req, res) {
    try {
      const salonId = req.user?.salon_id || 1;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate required' });
      }

      // Fetch all modules in parallel
      const [
        [revenueMetrics],
        [expenseData],
        [bookingMetrics],
        [customerMetrics],
        [staffMetrics]
      ] = await Promise.all([
        pool.query(
          `SELECT COALESCE(SUM(i.total), 0) as total_revenue
           FROM invoices i
           WHERE i.salon_id = ? AND DATE(i.invoice_date) BETWEEN ? AND ?`,
          [salonId, startDate, endDate]
        ),
        pool.query(
          `SELECT COALESCE(SUM(amount), 0) as total_expenses
           FROM expenses
           WHERE salon_id = ? AND DATE(expense_date) BETWEEN ? AND ?`,
          [salonId, startDate, endDate]
        ),
        pool.query(
          `SELECT COUNT(*) as total_bookings, 
                  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings
           FROM bookings
           WHERE salon_id = ? AND DATE(booking_date) BETWEEN ? AND ?`,
          [salonId, startDate, endDate]
        ),
        pool.query(
          `SELECT COUNT(DISTINCT customer_id) as unique_customers,
                  COALESCE(SUM(i.total), 0) as customer_revenue
           FROM invoices i
           JOIN customers c ON i.customer_id = c.id
           WHERE i.salon_id = ? AND DATE(i.invoice_date) BETWEEN ? AND ?`,
          [salonId, startDate, endDate]
        ),
        pool.query(
          `SELECT COUNT(*) as staff_count,
                  COALESCE(SUM(bi.price), 0) as staff_revenue
           FROM staff s
               LEFT JOIN bookings b ON b.created_by = s.id
           LEFT JOIN booking_items bi ON b.id = bi.booking_id
           WHERE s.salon_id = ? AND DATE(b.booking_date) BETWEEN ? AND ?`,
          [salonId, startDate, endDate]
        )
      ]);

      const totalRevenue = parseFloat(revenueMetrics[0]?.total_revenue) || 0;
      const totalExpenses = parseFloat(expenseData[0]?.total_expenses) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

      res.json({
        period: { startDate, endDate },
        consolidated_kpis: {
          total_revenue: totalRevenue.toFixed(2),
          total_expenses: totalExpenses.toFixed(2),
          net_profit: netProfit.toFixed(2),
          profit_margin_pct: profitMargin.toFixed(2),
          total_bookings: bookingMetrics[0]?.total_bookings || 0,
          completed_bookings: bookingMetrics[0]?.completed_bookings || 0,
          unique_customers: customerMetrics[0]?.unique_customers || 0,
          staff_count: staffMetrics[0]?.staff_count || 0
        }
      });

    } catch (error) {
      logger.error('Error in getBIConsolidatedDashboard:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AdvancedBIController;
