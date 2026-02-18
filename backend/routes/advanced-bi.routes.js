/**
 * ============================================
 * ADVANCED BI ROUTES
 * Enterprise Business Intelligence API
 * ============================================
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const AdvancedBIController = require('../controllers/advanced-bi.controller');

/**
 * ROUTES STRUCTURE:
 * 
 * /api/bi/revenue - Revenue Intelligence
 * /api/bi/bookings - Booking Analytics
 * /api/bi/customers - Customer Intelligence
 * /api/bi/staff - Staff Performance
 * /api/bi/memberships - Membership Analytics
 * /api/bi/profit - Expense & Profit Analysis
 * /api/bi/services - Service Performance
 * /api/bi/forecast - Smart AI Analytics & Forecasting
 * /api/bi/dashboard - Consolidated Dashboard
 */

// ============================================
// MODULE 1: REVENUE INTELLIGENCE
// ============================================
/**
 * GET /api/bi/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 
 * Returns:
 * - Total Revenue, Transaction Count, Avg Value
 * - Payment Method Breakdown (Cash, Card, Online, Membership)
 * - Service-wise Revenue Breakdown (Top 10)
 * - Staff-wise Revenue Performance
 * - Daily Revenue Trend
 * - Revenue Growth %
 */
router.get('/revenue', authenticate, AdvancedBIController.revenueIntelligence);

// ============================================
// MODULE 2: BOOKING ANALYTICS
// ============================================
/**
 * GET /api/bi/bookings?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 
 * Returns:
 * - Booking Status Summary
 * - Completion Rate, Cancellation Rate
 * - Booking by Type (Walk-in vs Calling)
 * - Daily Booking Trend
 * - Service Demand (Most booked services)
 * - Slot Utilization (Hourly breakdown)
 */
router.get('/bookings', authenticate, AdvancedBIController.bookingAnalytics);

// ============================================
// MODULE 3: CUSTOMER INTELLIGENCE
// ============================================
/**
 * GET /api/bi/customers?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 
 * Returns:
 * - Total Customers, New Customers, Active Customers
 * - Customer Retention Rate, Churn Rate
 * - Customer Lifetime Value (CLV) Distribution
 * - Customer Booking Frequency Segments
 * - Top 10 Customers by Revenue
 */
router.get('/customers', authenticate, AdvancedBIController.customerIntelligence);

// ============================================
// MODULE 4: STAFF PERFORMANCE
// ============================================
/**
 * GET /api/bi/staff?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 
 * Returns:
 * - Staff Performance Metrics (Revenue, Bookings, Completion Rate)
 * - Staff Utilization Rate
 * - Service Specialization (Best services per staff)
 * - Daily Staff Performance Trend
 * - Revenue Contribution %
 */
router.get('/staff', authenticate, AdvancedBIController.staffPerformance);

// ============================================
// MODULE 5: MEMBERSHIP ANALYTICS
// ============================================
/**
 * GET /api/bi/memberships?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 
 * Returns:
 * - Active Memberships, Expired, Cancelled
 * - New vs Renewal Memberships Trend
 * - Membership by Type/Tier
 * - Renewal Rate %
 * - Estimated Monthly Recurring Revenue (MRR)
 */
router.get('/memberships', authenticate, AdvancedBIController.membershipAnalytics);

// ============================================
// MODULE 6: EXPENSE & PROFIT ANALYSIS
// ============================================
/**
 * GET /api/bi/profit?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 
 * Returns:
 * - Total Revenue, Expenses, Net Profit
 * - Profit Margin %, Expense Ratio %
 * - Expense Breakdown by Category
 * - Daily Profit & Loss Trend
 * - Operating Metrics (Expense per Revenue Unit)
 */
router.get('/profit', authenticate, AdvancedBIController.expenseAndProfit);

// ============================================
// MODULE 7: SERVICE PERFORMANCE
// ============================================
/**
 * GET /api/bi/services?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 
 * Returns:
 * - Service Performance Ranking
 * - Revenue Share % per Service
 * - Service Demand by Category
 * - Peak Service Times (Hourly)
 * - Staff Proficiency by Service
 * - Revenue per Hour per Service
 */
router.get('/services', authenticate, AdvancedBIController.servicePerformance);

// ============================================
// MODULE 8: SMART AI ANALYTICS & FORECASTING
// ============================================
/**
 * GET /api/bi/forecast?days=30
 * 
 * Returns:
 * - 60-day Historical Revenue Data
 * - 7-day & 14-day Moving Averages
 * - Next 30-day Revenue Forecast
 * - Confidence Range (Min-Max)
 * - Weekly Trend Analysis
 * - Trend Direction (Upward/Downward/Stable)
 * 
 * Methodology: Exponential Smoothing (α=0.3)
 * Confidence Level: 85-115% range at 95% confidence
 */
router.get('/forecast', authenticate, AdvancedBIController.smartAIAnalytics);

// ============================================
// CONSOLIDATED BI DASHBOARD
// ============================================
/**
 * GET /api/bi/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 
 * Returns consolidated KPIs from all modules:
 * - Total Revenue, Expenses, Net Profit
 * - Profit Margin %
 * - Total Bookings, Completed Bookings
 * - Unique Customers
 * - Staff Count
 */
router.get('/dashboard', authenticate, AdvancedBIController.getBIConsolidatedDashboard);

// ============================================
// ERROR HANDLING
// ============================================

// 404 for invalid BI routes
router.use((req, res) => {
  res.status(404).json({
    error: 'BI endpoint not found',
    available_endpoints: [
      'GET /api/bi/revenue',
      'GET /api/bi/bookings',
      'GET /api/bi/customers',
      'GET /api/bi/staff',
      'GET /api/bi/memberships',
      'GET /api/bi/profit',
      'GET /api/bi/services',
      'GET /api/bi/forecast',
      'GET /api/bi/dashboard'
    ]
  });
});

module.exports = router;
