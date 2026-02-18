/**
 * ============================================
 * BI WAREHOUSE ETL/SEED SCRIPT
 * Extract from OLTP → Load to BI Schema
 * ============================================
 */

USE k;

-- ============================================
-- STEP 1: POPULATE DIMENSION TABLES
-- ============================================

-- Load dim_staff from existing staff table
INSERT IGNORE INTO dim_staff (staff_id, salon_id, staff_name, designation, hire_date, status, commission_rate, is_current)
SELECT 
  id as staff_id,
  salon_id,
  name as staff_name,
  COALESCE(role, 'Staff') as designation,
  CURDATE() as hire_date,
  'active' as status,
  0.10 as commission_rate,
  TRUE
FROM staff
WHERE deleted_at IS NULL;

-- Load dim_service from existing services table
INSERT IGNORE INTO dim_service (service_id, salon_id, service_name, category, base_price, duration_minutes, status, is_current)
SELECT 
  id as service_id,
  salon_id,
  name as service_name,
  COALESCE(category, 'General') as category,
  COALESCE(price, 0) as base_price,
  COALESCE(duration, 30) as duration_minutes,
  'active' as status,
  TRUE
FROM services
WHERE deleted_at IS NULL;

-- Load dim_customer from existing customers table
INSERT IGNORE INTO dim_customer (customer_id, salon_id, customer_name, customer_phone, customer_email, customer_segment, first_visit_date, is_current)
SELECT 
  id as customer_id,
  salon_id,
  name as customer_name,
  COALESCE(phone, '') as customer_phone,
  COALESCE(email, '') as customer_email,
  'Regular' as customer_segment,
  CURDATE() as first_visit_date,
  TRUE
FROM customers
WHERE deleted_at IS NULL;

-- ============================================
-- STEP 2: POPULATE FACT TABLES
-- ============================================

-- Load fact_revenue from bookings + invoices
INSERT INTO fact_revenue (salon_id, date_id, staff_dim_id, service_dim_id, customer_dim_id, booking_id, invoice_id, transaction_count, total_revenue, tax_amount, discount_amount, net_revenue)
SELECT 
  b.salon_id,
  DATE_FORMAT(b.appointment_date, '%Y%m%d') as date_id,
  ds.staff_dim_id,
  dsvc.service_dim_id,
  dc.customer_dim_id,
  b.id as booking_id,
  i.id as invoice_id,
  1 as transaction_count,
  COALESCE(i.total_amount, 0) as total_revenue,
  COALESCE(i.tax_amount, 0) as tax_amount,
  COALESCE(i.discount_amount, 0) as discount_amount,
  COALESCE(i.total_amount - COALESCE(i.discount_amount, 0), 0) as net_revenue
FROM bookings b
LEFT JOIN invoices i ON b.id = i.booking_id
LEFT JOIN dim_staff ds ON b.staff_id = ds.staff_id AND ds.is_current = TRUE
LEFT JOIN dim_service dsvc ON b.service_id = dsvc.service_id AND dsvc.is_current = TRUE
LEFT JOIN dim_customer dc ON b.customer_id = dc.customer_id AND dc.is_current = TRUE
WHERE b.deleted_at IS NULL
  AND b.status IN ('completed', 'confirmed')
  AND b.appointment_date IS NOT NULL
ON DUPLICATE KEY UPDATE
  total_revenue = VALUES(total_revenue),
  net_revenue = VALUES(net_revenue),
  updated_at = CURRENT_TIMESTAMP;

-- Load fact_booking from bookings table
INSERT INTO fact_booking (salon_id, date_id, staff_dim_id, service_dim_id, customer_dim_id, booking_id, booking_count, completed_bookings, cancelled_bookings, total_duration, avg_booking_value)
SELECT 
  b.salon_id,
  DATE_FORMAT(b.appointment_date, '%Y%m%d') as date_id,
  ds.staff_dim_id,
  dsvc.service_dim_id,
  dc.customer_dim_id,
  b.id as booking_id,
  1 as booking_count,
  CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END as completed_bookings,
  CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END as cancelled_bookings,
  COALESCE(dsvc.duration_minutes, 30) as total_duration,
  COALESCE(dsvc.base_price, 0) as avg_booking_value
FROM bookings b
LEFT JOIN dim_staff ds ON b.staff_id = ds.staff_id AND ds.is_current = TRUE
LEFT JOIN dim_service dsvc ON b.service_id = dsvc.service_id AND dsvc.is_current = TRUE
LEFT JOIN dim_customer dc ON b.customer_id = dc.customer_id AND dc.is_current = TRUE
WHERE b.deleted_at IS NULL
  AND b.appointment_date IS NOT NULL
ON DUPLICATE KEY UPDATE
  booking_count = VALUES(booking_count),
  completed_bookings = VALUES(completed_bookings),
  updated_at = CURRENT_TIMESTAMP;

-- Load fact_expense from expenses table
INSERT INTO fact_expense (salon_id, date_id, expense_id, expense_count, expense_amount, employee_cost, inventory_cost, utility_cost, other_cost)
SELECT 
  e.salon_id,
  DATE_FORMAT(e.expense_date, '%Y%m%d') as date_id,
  e.id as expense_id,
  1 as expense_count,
  COALESCE(e.amount, 0) as expense_amount,
  CASE 
    WHEN LOWER(COALESCE(e.category, '')) LIKE '%salary%' OR LOWER(COALESCE(e.category, '')) LIKE '%employee%' 
    THEN COALESCE(e.amount, 0) ELSE 0 
  END as employee_cost,
  CASE 
    WHEN LOWER(COALESCE(e.category, '')) LIKE '%inventory%' OR LOWER(COALESCE(e.category, '')) LIKE '%supply%' 
    THEN COALESCE(e.amount, 0) ELSE 0 
  END as inventory_cost,
  CASE 
    WHEN LOWER(COALESCE(e.category, '')) LIKE '%utility%' OR LOWER(COALESCE(e.category, '')) LIKE '%electric%' OR LOWER(COALESCE(e.category, '')) LIKE '%water%'
    THEN COALESCE(e.amount, 0) ELSE 0 
  END as utility_cost,
  CASE 
    WHEN LOWER(COALESCE(e.category, '')) NOT LIKE '%salary%' 
      AND LOWER(COALESCE(e.category, '')) NOT LIKE '%employee%'
      AND LOWER(COALESCE(e.category, '')) NOT LIKE '%inventory%'
      AND LOWER(COALESCE(e.category, '')) NOT LIKE '%supply%'
      AND LOWER(COALESCE(e.category, '')) NOT LIKE '%utility%'
      AND LOWER(COALESCE(e.category, '')) NOT LIKE '%electric%'
      AND LOWER(COALESCE(e.category, '')) NOT LIKE '%water%'
    THEN COALESCE(e.amount, 0) ELSE 0 
  END as other_cost
FROM expenses e
WHERE e.deleted_at IS NULL
  AND e.expense_date IS NOT NULL
ON DUPLICATE KEY UPDATE
  expense_amount = VALUES(expense_amount),
  updated_at = CURRENT_TIMESTAMP;

-- Load fact_membership from memberships table (if exists)
INSERT INTO fact_membership (salon_id, date_id, customer_dim_id, active_memberships, new_memberships, membership_revenue)
SELECT 
  m.salon_id,
  DATE_FORMAT(m.created_at, '%Y%m%d') as date_id,
  dc.customer_dim_id,
  CASE WHEN m.status = 'active' THEN 1 ELSE 0 END as active_memberships,
  CASE WHEN m.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END as new_memberships,
  COALESCE(m.price, 0) as membership_revenue
FROM memberships m
LEFT JOIN dim_customer dc ON m.customer_id = dc.customer_id AND dc.is_current = TRUE
WHERE m.deleted_at IS NULL
ON DUPLICATE KEY UPDATE
  active_memberships = VALUES(active_memberships),
  membership_revenue = VALUES(membership_revenue),
  updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- STEP 3: REFRESH MATERIALIZED VIEWS
-- ============================================

-- Refresh mv_revenue_daily
TRUNCATE TABLE mv_revenue_daily;
INSERT INTO mv_revenue_daily (salon_id, date_id, full_date, day_name, total_revenue, transaction_count, avg_transaction_value, cash_pct, card_pct, online_pct, membership_pct)
SELECT 
  fr.salon_id,
  dd.date_id,
  dd.full_date,
  dd.day_name,
  COALESCE(SUM(fr.total_revenue), 0) as total_revenue,
  COALESCE(COUNT(fr.revenue_fact_id), 0) as transaction_count,
  COALESCE(AVG(fr.total_revenue), 0) as avg_transaction_value,
  ROUND(COALESCE(SUM(fr.cash_revenue), 0) / NULLIF(SUM(fr.total_revenue), 1) * 100, 2) as cash_pct,
  ROUND(COALESCE(SUM(fr.card_revenue), 0) / NULLIF(SUM(fr.total_revenue), 1) * 100, 2) as card_pct,
  ROUND(COALESCE(SUM(fr.online_revenue), 0) / NULLIF(SUM(fr.total_revenue), 1) * 100, 2) as online_pct,
  ROUND(COALESCE(SUM(fr.membership_revenue), 0) / NULLIF(SUM(fr.total_revenue), 1) * 100, 2) as membership_pct
FROM fact_revenue fr
INNER JOIN dim_date dd ON fr.date_id = dd.date_id
GROUP BY fr.salon_id, dd.date_id, dd.full_date, dd.day_name;

-- Refresh mv_revenue_by_service
TRUNCATE TABLE mv_revenue_by_service;
INSERT INTO mv_revenue_by_service (salon_id, service_dim_id, service_name, category, revenue, transaction_count, revenue_share_pct, avg_service_price)
SELECT 
  fr.salon_id,
  ds.service_dim_id,
  ds.service_name,
  ds.category,
  COALESCE(SUM(fr.total_revenue), 0) as revenue,
  COALESCE(COUNT(fr.revenue_fact_id), 0) as transaction_count,
  ROUND(
    COALESCE(SUM(fr.total_revenue), 0) / 
    NULLIF((SELECT SUM(total_revenue) FROM fact_revenue WHERE salon_id = fr.salon_id), 0) * 100, 2
  ) as revenue_share_pct,
  COALESCE(AVG(fr.total_revenue), 0) as avg_service_price
FROM dim_service ds
LEFT JOIN fact_revenue fr ON ds.service_dim_id = fr.service_dim_id
WHERE ds.is_current = TRUE
GROUP BY fr.salon_id, ds.service_dim_id, ds.service_name, ds.category
ORDER BY revenue DESC
LIMIT 10;

-- Refresh mv_revenue_by_staff
TRUNCATE TABLE mv_revenue_by_staff;
INSERT INTO mv_revenue_by_staff (salon_id, staff_dim_id, staff_name, total_revenue, booking_count, avg_booking_value, revenue_contribution_pct)
SELECT 
  fr.salon_id,
  ds.staff_dim_id,
  ds.staff_name,
  COALESCE(SUM(fr.total_revenue), 0) as total_revenue,
  COALESCE(COUNT(DISTINCT fr.booking_id), 0) as booking_count,
  COALESCE(AVG(fr.total_revenue), 0) as avg_booking_value,
  ROUND(
    COALESCE(SUM(fr.total_revenue), 0) / 
    NULLIF((SELECT SUM(total_revenue) FROM fact_revenue WHERE salon_id = fr.salon_id), 0) * 100, 2
  ) as revenue_contribution_pct
FROM dim_staff ds
LEFT JOIN fact_revenue fr ON ds.staff_dim_id = fr.staff_dim_id
WHERE ds.is_current = TRUE
GROUP BY fr.salon_id, ds.staff_dim_id, ds.staff_name;

-- Refresh mv_customer_metrics
TRUNCATE TABLE mv_customer_metrics;
INSERT INTO mv_customer_metrics (salon_id, customer_segment, customer_count, total_revenue, avg_customer_value, retention_rate, churn_rate, avg_booking_frequency)
SELECT 
  dc.salon_id,
  dc.customer_segment,
  COUNT(DISTINCT dc.customer_dim_id) as customer_count,
  COALESCE(SUM(fr.total_revenue), 0) as total_revenue,
  ROUND(COALESCE(SUM(fr.total_revenue), 0) / NULLIF(COUNT(DISTINCT dc.customer_dim_id), 0), 2) as avg_customer_value,
  85.0 as retention_rate,
  15.0 as churn_rate,
  ROUND(COUNT(DISTINCT fr.booking_id) / NULLIF(COUNT(DISTINCT dc.customer_dim_id), 0), 2) as avg_booking_frequency
FROM dim_customer dc
LEFT JOIN fact_revenue fr ON dc.customer_dim_id = fr.customer_dim_id
WHERE dc.is_current = TRUE
GROUP BY dc.salon_id, dc.customer_segment;

-- Refresh mv_profit_loss
TRUNCATE TABLE mv_profit_loss;
INSERT INTO mv_profit_loss (salon_id, date_id, full_date, total_revenue, total_expenses, gross_profit, profit_margin_pct, operating_ratio_pct)
SELECT 
  COALESCE(fr.salon_id, fe.salon_id) as salon_id,
  COALESCE(fr.date_id, fe.date_id) as date_id,
  dd.full_date,
  COALESCE(SUM(fr.total_revenue), 0) as total_revenue,
  COALESCE(SUM(fe.expense_amount), 0) as total_expenses,
  COALESCE(SUM(fr.total_revenue), 0) - COALESCE(SUM(fe.expense_amount), 0) as gross_profit,
  ROUND(
    (COALESCE(SUM(fr.total_revenue), 0) - COALESCE(SUM(fe.expense_amount), 0)) / 
    NULLIF(COALESCE(SUM(fr.total_revenue), 0), 0) * 100, 2
  ) as profit_margin_pct,
  ROUND(
    COALESCE(SUM(fe.expense_amount), 0) / 
    NULLIF(COALESCE(SUM(fr.total_revenue), 0), 0) * 100, 2
  ) as operating_ratio_pct
FROM fact_revenue fr
FULL OUTER JOIN fact_expense fe ON fr.date_id = fe.date_id AND fr.salon_id = fe.salon_id
INNER JOIN dim_date dd ON COALESCE(fr.date_id, fe.date_id) = dd.date_id
GROUP BY COALESCE(fr.salon_id, fe.salon_id), COALESCE(fr.date_id, fe.date_id), dd.full_date;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check dimension tables
SELECT 'dim_staff' as table_name, COUNT(*) as row_count FROM dim_staff
UNION ALL
SELECT 'dim_service', COUNT(*) FROM dim_service
UNION ALL
SELECT 'dim_customer', COUNT(*) FROM dim_customer
UNION ALL
SELECT 'fact_revenue', COUNT(*) FROM fact_revenue
UNION ALL
SELECT 'fact_booking', COUNT(*) FROM fact_booking
UNION ALL
SELECT 'fact_expense', COUNT(*) FROM fact_expense
UNION ALL
SELECT 'fact_membership', COUNT(*) FROM fact_membership;

-- Sample revenue data
SELECT 
  'Revenue Summary' as metric,
  COALESCE(SUM(total_revenue), 0) as value,
  'Total' as period
FROM fact_revenue
WHERE DATE(loaded_at) = CURDATE();

-- Sample booking data
SELECT 
  'Booking Count' as metric,
  COALESCE(SUM(booking_count), 0) as value,
  'Total' as period
FROM fact_booking
WHERE DATE(loaded_at) = CURDATE();

-- Sample expense data
SELECT 
  'Total Expenses' as metric,
  COALESCE(SUM(expense_amount), 0) as value,
  'Total' as period
FROM fact_expense
WHERE DATE(loaded_at) = CURDATE();

-- ============================================
-- END OF ETL SCRIPT
-- ============================================
