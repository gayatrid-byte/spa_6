# Enterprise Business Intelligence System
## Complete 5-Layer Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [BI Modules](#bi-modules)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Implementation Guide](#implementation-guide)
7. [Performance Optimization](#performance-optimization)

---

## System Overview

This is a **production-ready, enterprise-level Business Intelligence (BI) system** designed for SaaS salon management platforms. It provides:

✅ **5-Layer Architecture** - Presentation → Analytics → Processing → Warehouse → Source  
✅ **8 BI Modules** - Revenue, Bookings, Customers, Staff, Memberships, Expenses, Services, Smart AI  
✅ **Premium SaaS UI** - Fintech-grade dashboard with glassmorphism & micro-animations  
✅ **Real-time Analytics** - Dashboard with date filters & auto-refresh  
✅ **Drill-down Reports** - Deep-dive analysis with export (PDF/Excel/CSV)  
✅ **Template Showcase** - Marketplace-style dashboard template gallery  
✅ **External API** - JWT-protected BI endpoints for integrations  

---

## Architecture Layers

### Layer 1: Presentation (Frontend UI)
**Location:** `frontend/assets/js/modules/reports/`

```
reports.js                 ← Main dashboard module (exports render())
template-showcase.js       ← Premium template gallery
advanced-bi-dashboard.css  ← Premium SaaS styling
template-showcase.css      ← Template showcase styling
```

**Key Components:**
- Responsive grid layout
- KPI cards with animated counters
- Interactive charts (Chart.js ready)
- Date range filters
- Export buttons
- Report cards grid
- Glassmorphism effects

### Layer 2: Analytics (Business Logic)
**Location:** `backend/models/advanced-bi.model.js`

Contains 8 analytical modules with KPI calculations:

```javascript
1. getRevenueIntelligence()      → Revenue, Profit, Margins, Growth
2. getBookingAnalytics()          → Completion Rate, No-shows, Utilization
3. getCustomerIntelligence()      → CLV, Retention, Segmentation
4. getStaffPerformance()          → Revenue/Staff, Rankings, Utilization
5. getMembershipAnalytics()       → MRR, Renewal Rate, Churn Prediction
6. getExpenseAnalysis()           → P&L, Operating Ratio, Cost Analysis
7. getServicePerformance()        → Service Mix, Ratings, Growth
8. getSmartAnalytics()            → Churn Prediction, Forecasting, Anomalies
```

**KPI Formulas Implemented:**

| KPI | Formula | Module |
|-----|---------|--------|
| **Net Profit** | Revenue - Expenses | Revenue |
| **Profit Margin %** | (Net Profit / Revenue) × 100 | Revenue |
| **Operating Ratio %** | (Expenses / Revenue) × 100 | Revenue |
| **CLV** | Sum(Total Spent) | Customer |
| **Retention Rate** | (Repeat Customers / Total) × 100 | Customer |
| **Churn Rate** | 100 - Retention Rate | Customer |
| **MRR** | Sum(Monthly Recurring Revenue) | Membership |
| **Revenue/Staff** | Total Revenue ÷ Staff Count | Staff |
| **Utilization Rate** | (Actual Hours ÷ Available Hours) × 100 | Staff |
| **Completion Rate** | (Completed / Total Bookings) × 100 | Booking |

### Layer 3: Data Processing (APIs & Controllers)
**Location:** `backend/controllers/advanced-reports.controller.js`

Maps API endpoints to BI models:

```javascript
GET /api/reports/revenue      → getRevenueIntelligence()
GET /api/reports/bookings     → getBookingAnalytics()
GET /api/reports/customers    → getCustomerIntelligence()
GET /api/reports/staff        → getStaffPerformance()
GET /api/reports/memberships  → getMembershipAnalytics()
GET /api/reports/expenses     → getExpenseAnalysis()
GET /api/reports/services     → getServicePerformance()
GET /api/reports/smart        → getSmartAnalytics()
GET /api/reports/dashboard    → All modules combined
POST /api/reports/export/pdf  → PDF export
POST /api/reports/export/excel → Excel export
POST /api/reports/export/csv  → CSV export
GET /api/reports/drilldown/*  → Deep-dive drill-down
POST /api/reports/custom      → Custom report builder
```

### Layer 4: Data Warehouse (BI Schema)
**Location:** `database/schema/bi_warehouse.sql`

**Dimension Tables (SCD Type 2 - Slowly Changing Dimensions):**
- `dim_date` - Calendar dates with fiscal periods
- `dim_customer` - Customer attributes with time-series tracking
- `dim_staff` - Staff profiles with historical changes
- `dim_service` - Service catalog with versioning
- `dim_salon` - Salon master data

**Fact Tables (Aggregated Facts):**
- `fact_daily_revenue` - Daily revenue aggregation
- `fact_customer_transaction` - Individual transactions
- `fact_staff_performance` - Daily staff KPIs
- `fact_membership_analytics` - Membership lifecycle

**Materialized Views (Pre-aggregated):**
- `mv_revenue_trend` - 7/30/90 day rolling averages
- `mv_customer_cohort` - Cohort analysis with churn scoring
- `mv_service_performance` - Service-level KPIs
- `mv_expense_aggregation` - Expense categorization

**Stored Procedures:**
- `sp_refresh_daily_revenue()` - Nightly ETL
- `sp_calculate_clv()` - Customer lifetime value
- `sp_calculate_mrr()` - Monthly recurring revenue
- `sp_generate_cohort_analysis()` - Cohort analysis
- `sp_get_revenue_trend()` - Trend queries

### Layer 5: Source (OLTP Tables)
**Existing Tables Used:**
```
invoices          ← Revenue source
booking_items     ← Service detail transactions
customers         ← Customer master
memberships       ← Recurring revenue
expenses          ← Cost data
bookings          ← Appointment log
staff             ← Staff master
services          ← Service catalog
users             ← User accounts
salons            ← Salon master
```

---

## BI Modules

### Module 1: Revenue Intelligence
**KPIs:**
- Total Revenue
- Net Profit
- Profit Margin %
- Operating Ratio %
- Revenue Growth %
- Transaction Count
- Avg Transaction Value
- Payment Method Breakdown

**Data Sources:**
- invoices (status = 'paid')
- booking_items (prices)
- expenses (cost allocation)

**Chart Types:**
- Line chart (Revenue Trend)
- Pie chart (Payment Methods)
- Bar chart (Service Revenue)
- Metrics cards (KPIs)

---

### Module 2: Booking Analytics
**KPIs:**
- Total Bookings
- Completion Rate %
- Cancellation Rate %
- No-Show Rate %
- Unique Customers
- Avg Booking Duration
- Hourly Distribution

**Data Sources:**
- bookings (status, duration)
- booking_items (service count)

**Chart Types:**
- Donut chart (Status breakdown)
- Bar chart (Hourly distribution)
- Gauge (Completion rate)

---

### Module 3: Customer Intelligence
**KPIs:**
- Total Customers
- New Customers
- Repeat Customers
- Retention Rate %
- Churn Rate %
- Avg CLV
- Customer Segmentation (VIP, Premium, Regular, NewDeferred)

**Data Sources:**
- customers (created_at)
- invoices (spending)
- bookings (repeat visits)

**Chart Types:**
- Pie chart (Segmentation)
- Line chart (New vs Repeat)
- Heatmap (Churn risk)
- Leaderboard (Top customers)

---

### Module 4: Staff Performance
**KPIs:**
- Total Staff
- Avg Revenue/Staff
- Avg Bookings/Staff
- Top Performer
- Utilization Rate %
- Attendance Rate %

**Data Sources:**
- bookings (assigned_staff_id, status)
- booking_items (revenue)
- staff (master data)

**Chart Types:**
- Bar chart (Revenue per staff)
- Leaderboard (Rankings)
- Gauge (Utilization)
- Heatmap (Performance matrix)

---

### Module 5: Membership Analytics
**KPIs:**
- Active Memberships
- Expiring Soon
- MRR (Estimated)
- Renewal Rate %
- Expired Memberships

**Data Sources:**
- memberships (status, type, price)

**Chart Types:**
- Pie chart (Status breakdown)
- Line chart (MRR trend)
- Timeline (Expiration dates)
- Metric cards (KPIs)

---

### Module 6: Expense & Profit Analysis
**KPIs:**
- Total Expenses
- Total Revenue
- Net Profit
- Profit Margin %
- Operating Ratio %
- Avg Expense
- Expense Count

**Data Sources:**
- expenses (amount, category, date)
- invoices (revenue)

**Chart Types:**
- Pie chart (Expense distribution)
- Area chart (Profit & Loss)
- Stacked bar (Revenue vs Expenses)
- Metrics cards (P&L)

---

### Module 7: Service Performance
**KPIs:**
- Services Offered
- Top Service
- Service Revenue
- Market Share %
- Avg Service Price
- Growth Rate

**Data Sources:**
- services (catalog)
- booking_items (usage, revenue)

**Chart Types:**
- Bar chart (Service revenue)
- Pie chart (Market share)
- Ratings display
- Sparkline (Growth trend)

---

### Module 8: Smart AI & Advanced Analytics
**KPIs:**
- Churn Risk Score
- Revenue Forecast (7-day)
- Anomalies Detected
- Recommendations

**Data Sources:**
- All tables (comprehensive analysis)
- Historical trends
- Booking patterns

**Features:**
- **Churn Prediction:** Identifies high/medium risk customers based on:
  - Days since last booking
  - Booking frequency
  - Lifetime value trend
  
- **Revenue Forecast:** 7-day prediction using:
  - 30-day moving average
  - Seasonal patterns
  
- **Anomaly Detection:** Identifies unusual days:
  - Revenue deviations > 50% from average
  - Unusual booking patterns
  
- **Recommendations:** AI-powered suggestions based on:
  - Churn risk levels
  - Revenue trends
  - Service performance

---

## API Reference

### Base URL
```
http://localhost:3000/api/reports
```

### Authentication
All endpoints require JWT Bearer token:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### 1. Revenue Intelligence
```http
GET /api/reports/revenue?startDate=2026-01-13&endDate=2026-02-12
```

**Response:**
```json
{
  "summary": {
    "total_revenue": "15000.00",
    "total_expenses": "5000.00",
    "net_profit": "10000.00",
    "profit_margin_pct": "66.67",
    "revenue_growth_pct": "15.5",
    "transaction_count": 120,
    "avg_transaction_value": "125.00"
  },
  "payment_breakdown": {
    "cash": 3000,
    "card": 7000,
    "online": 3000,
    "membership": 2000
  },
  "service_breakdown": [...],
  "staff_breakdown": [...],
  "chart_data": {...}
}
```

#### 2. Booking Analytics
```http
GET /api/reports/bookings?startDate=2026-01-13&endDate=2026-02-12
```

#### 3. Customer Intelligence
```http
GET /api/reports/customers?startDate=2026-01-13&endDate=2026-02-12
```

#### 4. Staff Performance
```http
GET /api/reports/staff?startDate=2026-01-13&endDate=2026-02-12
```

#### 5. Membership Analytics
```http
GET /api/reports/memberships?startDate=2026-01-13&endDate=2026-02-12
```

#### 6. Expense Analysis
```http
GET /api/reports/expenses?startDate=2026-01-13&endDate=2026-02-12
```

#### 7. Service Performance
```http
GET /api/reports/services?startDate=2026-01-13&endDate=2026-02-12
```

#### 8. Smart Analytics
```http
GET /api/reports/smart?startDate=2026-01-13&endDate=2026-02-12
```

#### 9. Comprehensive Dashboard
```http
GET /api/reports/dashboard?startDate=2026-01-13&endDate=2026-02-12
```

**Response Structure:**
```json
{
  "dashboard": {
    "revenue": {...},
    "bookings": {...},
    "customers": {...},
    "staff": {...},
    "memberships": {...},
    "expenses": {...},
    "services": {...},
    "smart": {...}
  },
  "metadata": {
    "period": {"start": "2026-01-13", "end": "2026-02-12"},
    "generated_at": "2026-02-12T10:30:00Z",
    "salon_id": 1
  }
}
```

#### 10. Export Endpoints
```http
POST /api/reports/export/pdf
POST /api/reports/export/excel
POST /api/reports/export/csv

Body:
{
  "startDate": "2026-01-13",
  "endDate": "2026-02-12",
  "modules": ["revenue", "bookings", "customers"]
}
```

#### 11. Drill-Down Analytics
```http
GET /api/reports/drilldown/revenue?dimension=service&startDate=2026-01-13&endDate=2026-02-12
```

#### 12. Custom Report Builder
```http
POST /api/reports/custom

Body:
{
  "metrics": ["revenue", "profit", "margin"],
  "filters": {
    "startDate": "2026-01-13",
    "endDate": "2026-02-12",
    "staff_id": null
  },
  "groupBy": "service",
  "orderBy": "revenue DESC"
}
```

---

## Database Schema

### Dimension Tables

#### dim_date
```sql
- date_id (PK)
- calendar_date (UNIQUE)
- year, quarter, month, day
- month_name, day_name
- is_weekend, is_holiday
- INDEX: calendar_date, year_month
```

#### dim_customer (SCD Type 2)
```sql
- customer_sk (PK)
- customer_id, salon_id
- first_name, last_name, email
- customer_segment (VIP, Premium, Regular, NewDeferred)
- lifetime_status (Active, Churned, Promotional)
- registration_date, last_booking_date
- valid_from, valid_to (Historical tracking)
- is_current (Boolean)
- UNIQUE: (customer_id, salon_id, valid_from)
```

#### dim_staff (SCD Type 2)
```sql
- staff_sk (PK)
- staff_id, salon_id
- name, email, position
- employment_status (Active, OnLeave, Inactive)
- specialization (JSON or CSV)
- commission_rate
- valid_from, valid_to
- is_current
```

#### dim_service (SCD Type 2)
```sql
- service_sk (PK)
- service_id, salon_id
- name, category
- base_price
- average_duration_minutes
- service_status (Active, Inactive, Seasonal)
- valid_from, valid_to
- is_current
```

#### dim_salon
```sql
- salon_sk (PK)
- salon_id (UNIQUE)
- salon_name, location
- total_staff, total_services
- business_type, created_date
```

### Fact Tables

#### fact_daily_revenue
```sql
- revenue_fact_id (PK)
- date_sk (FK), salon_sk (FK), staff_sk (FK), service_sk (FK)
- total_revenue, total_cost, gross_profit
- booking_count, completed_booking_count
- customer_count, new_customer_count, repeat_customer_count
- payment breakdown (cash, card, memberships, online)
- avg_service_duration_minutes, avg_booking_value
- UNIQUE: (date_sk, salon_sk, staff_sk, service_sk)
- INDEX: (date_sk, salon_sk), (date_sk)
```

#### fact_customer_transaction
```sql
- transaction_fact_id (PK)
- invoice_id, date_sk (FK), salon_sk (FK), customer_sk (FK), staff_sk (FK)
- transaction_amount, transaction_type
- payment_method, booking_duration_minutes
- service_count, merchandise_sold
- discount_applied, tax_amount
- INDEX: (date_sk, salon_sk), (customer_sk), (invoice_id)
```

#### fact_staff_performance
```sql
- perf_fact_id (PK)
- date_sk (FK), salon_sk (FK), staff_sk (FK)
- bookings_completed, bookings_scheduled, bookings_no_show
- revenue_generated, avg_booking_value
- customer_satisfaction_score (0-5)
- attendance_score, punctuality_score (0-100)
- commission_earned, tips_received
- UNIQUE: (date_sk, salon_sk, staff_sk)
```

#### fact_membership_analytics
```sql
- membership_fact_id (PK)
- date_sk (FK), salon_sk (FK), customer_sk (FK)
- membership_id, membership_type
- membership_status (Active, Expiring, Expired, Cancelled)
- monthly_revenue, activation_date, expiry_date
- renewal_status, member_bookings, member_services_used
```

### Materialized Views

#### mv_revenue_trend
```sql
- salon_id, report_date
- daily_revenue, daily_cost, daily_profit, daily_profit_margin
- booking_count, customer_count, avg_transaction_value
- week_revenue_7day, month_revenue_30day, ytd_revenue
- UNIQUE: (salon_id, report_date)
```

#### mv_customer_cohort
```sql
- customer_sk, salon_id
- acquisition_date, acquisition_month
- total_lifetime_value, repeat_rate, churn_risk_score
- days_since_last_booking, customer_segment
```

#### mv_service_performance
```sql
- service_sk, salon_id, report_date
- bookings_count, revenue_generated, avg_service_price
- customer_satisfaction, growth_pct_vs_last_month
- market_share_pct
```

#### mv_expense_aggregation
```sql
- salon_id, report_date
- daily_expenses, weekly_expenses, monthly_expenses
- expense_category, expense_count
- daily_revenue, expense_ratio
```

---

## Implementation Guide

### Step 1: Create Database Schema
```bash
cd backend
mysql k < ../database/schema/bi_warehouse.sql
```

This creates:
- Dimension tables
- Fact tables
- Materialized views
- Stored procedures
- Triggers for ETL
- Indexes for performance

### Step 2: Populate Dimension Tables
```sql
-- Populate dim_date (Calendar)
INSERT INTO dim_date (calendar_date, year, quarter, ...)
SELECT ... FROM date_range_table;

-- Populate dim_customer (from customers table)
INSERT INTO dim_customer (customer_sk, customer_id, ...)
SELECT * FROM customers WHERE salon_id = ?;

-- Similar for dim_staff, dim_service, dim_salon
```

### Step 3: Initialize Fact Tables
```bash
# Run initial ETL to populate fact tables
# This happens nightly via triggers and stored procedures
CALL sp_refresh_daily_revenue(salon_id, current_date);
```

### Step 4: Enable Frontend UI
```html
<!-- In app.html, add stylesheet links -->
<link rel="stylesheet" href="/assets/css/advanced-bi-dashboard.css">
<link rel="stylesheet" href="/assets/css/template-showcase.css">
```

### Step 5: Test API Endpoints
```bash
# Test Revenue Intelligence
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/reports/revenue?startDate=2026-01-13&endDate=2026-02-12"

# Test Dashboard
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/reports/dashboard?startDate=2026-01-13&endDate=2026-02-12"
```

---

## Performance Optimization

### 1. Indexing Strategy
```sql
-- Fact Table Indexes (Critical for joins)
CREATE INDEX idx_fact_daily_revenue_date_salon 
ON fact_daily_revenue(date_sk, salon_sk);

CREATE INDEX idx_fact_customer_transaction_date_salon 
ON fact_customer_transaction(date_sk, salon_sk);

-- Dimension Table Indexes
CREATE INDEX idx_dim_customer_salon 
ON dim_customer(salon_id, is_current);

CREATE INDEX idx_dim_staff_salon 
ON dim_staff(salon_id, is_current);

-- Materialized View Indexes
CREATE INDEX idx_mv_revenue_salon_date 
ON mv_revenue_trend(salon_id, report_date);
```

### 2. Caching Strategy
```javascript
// Frontend caching (in-memory)
const reportCache = {
  revenue: { data: null, timestamp: null, ttl: 300000 } // 5 min
};

// Check cache before API call
if (reportCache.revenue.data && 
    Date.now() - reportCache.revenue.timestamp < reportCache.revenue.ttl) {
  return reportCache.revenue.data;
}
```

### 3. Query Optimization
```sql
-- Use materialized views instead of complex joins
SELECT * FROM mv_revenue_trend 
WHERE salon_id = ? AND report_date BETWEEN ? AND ?;

-- Instead of:
SELECT DATE(i.invoice_date), SUM(i.total), ...
FROM invoices i
LEFT JOIN expenses e ...
LEFT JOIN bookings b ...
... (complex joins)
```

### 4. Pagination for Large Datasets
```javascript
// Implement pagination for drill-down data
GET /api/reports/drilldown/revenue?dimension=service&page=1&limit=50

// Returns:
{
  data: [...],
  pagination: {
    page: 1,
    limit: 50,
    total: 250,
    pages: 5
  }
}
```

### 5. Batch Load Optimization
```javascript
// Load all 8 modules in parallel (not sequential)
const [revenue, bookings, customers, staff, memberships, expenses, services, smart] = 
  await Promise.all([
    api.reports.getRevenue(...),
    api.reports.getBookings(...),
    ...
  ]);
```

---

## Usage Examples

### Example 1: Monthly Revenue Report
```javascript
// Frontend
const startDate = '2026-01-13';
const endDate = '2026-02-12';

const revenueData = await api.reports.getRevenue(startDate, endDate);

console.log(`
  Total Revenue: $${revenueData.summary.total_revenue}
  Net Profit: $${revenueData.summary.net_profit}
  Profit Margin: ${revenueData.summary.profit_margin_pct}%
  Growth: ${revenueData.summary.revenue_growth_pct}%
`);
```

### Example 2: Customer Segmentation Analysis
```javascript
const customersData = await api.reports.getCustomers(startDate, endDate);

customersData.segmentation.forEach(segment => {
  console.log(`
    Segment: ${segment.segment}
    Count: ${segment.customer_count}
    Avg Value: $${segment.avg_segment_value}
  `);
});
```

### Example 3: Churn Risk Identification
```javascript
const smartData = await api.reports.getSmart(startDate, endDate);

console.log(`High Risk Customers: ${smartData.churn_prediction.high_risk_customers.length}`);
smartData.churn_prediction.high_risk_customers.forEach(customer => {
  // Send re-engagement email
  console.log(`Send offer to ${customer.first_name} (Days since booking: ${customer.days_since_booking})`);
});
```

### Example 4: Export Report
```javascript
const exportRequest = {
  startDate: '2026-01-13',
  endDate: '2026-02-12',
  modules: ['revenue', 'customers', 'staff']
};

const response = await fetch('/api/reports/export/pdf', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(exportRequest)
});

// Download PDF file
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
window.location.href = url;
```

---

## Maintenance & Monitoring

### Daily BI Refresh
```sql
-- Run nightly (e.g., 2:00 AM)
CALL sp_refresh_daily_revenue(salon_id, CURDATE() - INTERVAL 1 DAY);
CALL sp_generate_cohort_analysis(salon_id);
```

### Monitor Query Performance
```sql
-- Check slow queries
EXPLAIN SELECT ... FROM fact_daily_revenue WHERE date_sk = ? AND salon_sk = ?;

-- Check index usage
SHOW INDEX FROM fact_daily_revenue;
```

### Data Quality Checks
```sql
-- Verify fact table consistency
SELECT COUNT(*) FROM fact_daily_revenue WHERE total_revenue IS NULL;

-- Check dimension currency
SELECT COUNT(*) FROM dim_customer WHERE is_current = FALSE;
```

---

## Future Enhancements

1. **Real-time Analytics** - WebSocket updates for live dashboards
2. **Advanced Forecasting** - ML-based predictions (Prophet, ARIMA)
3. **Distributed BI** - Multi-salon aggregated reporting
4. **Mobile BI App** - Native iOS/Android reporting
5. **White-label BI** - Customizable dashboards for resale
6. **BI Data Marketplace** - Share benchmarks across salons
7. **Advanced Segmentation** - RFM, CHAID, k-means clustering
8. **Automated Alerts** - Anomaly detection with notifications

---

**Version:** 1.0  
**Last Updated:** Feb 12, 2026  
**Architecture:** Production-Ready Enterprise SaaS BI System
