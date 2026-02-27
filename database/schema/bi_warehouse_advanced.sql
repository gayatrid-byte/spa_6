/**
 * ============================================
 * ENTERPRISE BI WAREHOUSE LAYER
 * Production-Ready Data Warehouse
 * ============================================
 * 
 * 5-Layer Architecture:
 * Layer 1: Source (OLTP Tables)
 * Layer 2: Warehouse (Fact & Dimension Tables)
 * Layer 3: Data Processing (Views & Aggregations)
 * Layer 4: Analytics (Stored Procedures)
 * Layer 5: Presentation (API Endpoints)
 */



-- ============================================
-- DIMENSION TABLES (SLOWLY CHANGING DIMENSIONS)
-- ============================================

-- Dimension: Date
CREATE TABLE IF NOT EXISTS dim_date (
  date_id INT PRIMARY KEY,
  full_date DATE NOT NULL UNIQUE,
  year INT,
  quarter INT,
  month INT,
  day INT,
  week INT,
  day_of_week INT,
  is_weekend BOOLEAN,
  is_holiday BOOLEAN,
  day_name VARCHAR(20),
  month_name VARCHAR(20),
  quarter_name VARCHAR(10),
  INDEX idx_full_date (full_date),
  INDEX idx_year_month (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dimension: Staff (SCD Type 2)
CREATE TABLE IF NOT EXISTS dim_staff (
  staff_dim_id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT,
  salon_id INT,
  staff_name VARCHAR(255),
  designation VARCHAR(100),
  hire_date DATE,
  status ENUM('active', 'inactive', 'on_leave'),
  commission_rate DECIMAL(5,2),
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_to TIMESTAMP NULL,
  is_current BOOLEAN DEFAULT TRUE,
  INDEX idx_staff_id (staff_id),
  INDEX idx_salon_id (salon_id),
  INDEX idx_is_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dimension: Service
CREATE TABLE IF NOT EXISTS dim_service (
  service_dim_id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT,
  salon_id INT,
  service_name VARCHAR(255),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  base_price DECIMAL(10,2),
  duration_minutes INT,
  status ENUM('active', 'inactive'),
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_to TIMESTAMP NULL,
  is_current BOOLEAN DEFAULT TRUE,
  INDEX idx_service_id (service_id),
  INDEX idx_category (category),
  INDEX idx_is_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dimension: Customer
CREATE TABLE IF NOT EXISTS dim_customer (
  customer_dim_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  salon_id INT,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  total_visits INT DEFAULT 0,
  customer_segment VARCHAR(50) COMMENT 'VIP, Regular, New, At-Risk',
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  first_visit_date DATE,
  last_visit_date DATE,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_to TIMESTAMP NULL,
  is_current BOOLEAN DEFAULT TRUE,
  INDEX idx_customer_id (customer_id),
  INDEX idx_salon_id (salon_id),
  INDEX idx_customer_segment (customer_segment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FACT TABLES
-- ============================================

-- Fact Table: Revenue Transactions (Grain: Daily, by Service, by Staff)
CREATE TABLE IF NOT EXISTS fact_revenue (
  revenue_fact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  date_id INT NOT NULL,
  staff_dim_id INT,
  service_dim_id INT,
  customer_dim_id INT,
  booking_id INT,
  invoice_id INT,
  
  -- Measures
  transaction_count INT DEFAULT 1,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  cash_revenue DECIMAL(10,2) DEFAULT 0,
  card_revenue DECIMAL(10,2) DEFAULT 0,
  online_revenue DECIMAL(10,2) DEFAULT 0,
  membership_revenue DECIMAL(10,2) DEFAULT 0,
  net_revenue DECIMAL(12,2) DEFAULT 0,
  
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (date_id) REFERENCES dim_date(date_id),
  FOREIGN KEY (staff_dim_id) REFERENCES dim_staff(staff_dim_id),
  FOREIGN KEY (service_dim_id) REFERENCES dim_service(service_dim_id),
  FOREIGN KEY (customer_dim_id) REFERENCES dim_customer(customer_dim_id),
  
  INDEX idx_salon_date (salon_id, date_id),
  INDEX idx_staff (staff_dim_id),
  INDEX idx_service (service_dim_id),
  INDEX idx_customer (customer_dim_id),
  INDEX idx_date (date_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fact Table: Booking Analytics
CREATE TABLE IF NOT EXISTS fact_booking (
  booking_fact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  date_id INT NOT NULL,
  staff_dim_id INT,
  service_dim_id INT,
  customer_dim_id INT,
  booking_id INT,
  
  -- Measures
  booking_count INT DEFAULT 1,
  completed_bookings INT DEFAULT 0,
  cancelled_bookings INT DEFAULT 0,
  no_show_bookings INT DEFAULT 0,
  total_duration INT DEFAULT 0,
  avg_booking_value DECIMAL(10,2) DEFAULT 0,
  
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (date_id) REFERENCES dim_date(date_id),
  FOREIGN KEY (staff_dim_id) REFERENCES dim_staff(staff_dim_id),
  FOREIGN KEY (service_dim_id) REFERENCES dim_service(service_dim_id),
  FOREIGN KEY (customer_dim_id) REFERENCES dim_customer(customer_dim_id),
  
  INDEX idx_salon_date (salon_id, date_id),
  INDEX idx_booking_status (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fact Table: Expense Analysis
CREATE TABLE IF NOT EXISTS fact_expense (
  expense_fact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  date_id INT NOT NULL,
  expense_id INT,
  
  -- Measures
  expense_count INT DEFAULT 1,
  expense_amount DECIMAL(12,2) DEFAULT 0,
  employee_cost DECIMAL(12,2) DEFAULT 0,
  inventory_cost DECIMAL(12,2) DEFAULT 0,
  utility_cost DECIMAL(12,2) DEFAULT 0,
  other_cost DECIMAL(12,2) DEFAULT 0,
  
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (date_id) REFERENCES dim_date(date_id),
  INDEX idx_salon_date (salon_id, date_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fact Table: Membership Analytics
CREATE TABLE IF NOT EXISTS fact_membership (
  membership_fact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  date_id INT NOT NULL,
  customer_dim_id INT,
  
  -- Measures
  active_memberships INT DEFAULT 0,
  new_memberships INT DEFAULT 0,
  cancelled_memberships INT DEFAULT 0,
  membership_revenue DECIMAL(12,2) DEFAULT 0,
  renewal_rate DECIMAL(5,2) DEFAULT 0,
  avg_membership_value DECIMAL(10,2) DEFAULT 0,
  
  loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (date_id) REFERENCES dim_date(date_id),
  FOREIGN KEY (customer_dim_id) REFERENCES dim_customer(customer_dim_id),
  INDEX idx_salon_date (salon_id, date_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MATERIALIZED VIEWS (Pre-aggregated Data)
-- ============================================

-- Revenue Aggregation View (Daily)
CREATE TABLE IF NOT EXISTS mv_revenue_daily (
  salon_id INT,
  date_id INT,
  full_date DATE,
  day_name VARCHAR(20),
  total_revenue DECIMAL(12,2),
  transaction_count INT,
  avg_transaction_value DECIMAL(10,2),
  cash_pct DECIMAL(5,2),
  card_pct DECIMAL(5,2),
  online_pct DECIMAL(5,2),
  membership_pct DECIMAL(5,2),
  
  PRIMARY KEY (salon_id, date_id),
  INDEX idx_full_date (full_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Revenue by Service (Top 10)
CREATE TABLE IF NOT EXISTS mv_revenue_by_service (
  salon_id INT,
  service_dim_id INT,
  service_name VARCHAR(255),
  category VARCHAR(100),
  revenue DECIMAL(12,2),
  transaction_count INT,
  revenue_share_pct DECIMAL(5,2),
  avg_service_price DECIMAL(10,2),
  
  PRIMARY KEY (salon_id, service_dim_id),
  INDEX idx_salon (salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Revenue by Staff (Performance)
CREATE TABLE IF NOT EXISTS mv_revenue_by_staff (
  salon_id INT,
  staff_dim_id INT,
  staff_name VARCHAR(255),
  total_revenue DECIMAL(12,2),
  booking_count INT,
  avg_booking_value DECIMAL(10,2),
  revenue_contribution_pct DECIMAL(5,2),
  
  PRIMARY KEY (salon_id, staff_dim_id),
  INDEX idx_salon (salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer Metrics (Segmentation)
CREATE TABLE IF NOT EXISTS mv_customer_metrics (
  salon_id INT,
  customer_segment VARCHAR(50),
  customer_count INT,
  total_revenue DECIMAL(12,2),
  avg_customer_value DECIMAL(10,2),
  retention_rate DECIMAL(5,2),
  churn_rate DECIMAL(5,2),
  avg_booking_frequency DECIMAL(5,2),
  
  PRIMARY KEY (salon_id, customer_segment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profit & Loss Summary
CREATE TABLE IF NOT EXISTS mv_profit_loss (
  salon_id INT,
  date_id INT,
  full_date DATE,
  total_revenue DECIMAL(12,2),
  total_expenses DECIMAL(12,2),
  gross_profit DECIMAL(12,2),
  profit_margin_pct DECIMAL(5,2),
  operating_ratio_pct DECIMAL(5,2),
  
  PRIMARY KEY (salon_id, date_id),
  INDEX idx_date (date_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STORED PROCEDURES FOR AGGREGATION & CALCULATIONS
-- ============================================

DELIMITER $$

-- Procedure: Calculate Revenue Intelligence
CREATE PROCEDURE IF NOT EXISTS sp_calculate_revenue_intelligence(
  IN p_salon_id INT,
  IN p_start_date DATE,
  IN p_end_date DATE
)
READS SQL DATA
BEGIN
  SELECT 
    COALESCE(SUM(total_revenue), 0) as total_revenue,
    COALESCE(COUNT(DISTINCT booking_id), 0) as transaction_count,
    COALESCE(AVG(total_revenue), 0) as avg_transaction_value,
    COALESCE(SUM(cash_revenue), 0) as cash_revenue,
    COALESCE(SUM(card_revenue), 0) as card_revenue,
    COALESCE(SUM(online_revenue), 0) as online_revenue,
    COALESCE(SUM(membership_revenue), 0) as membership_revenue,
    COALESCE(SUM(tax_amount), 0) as tax_collected,
    COALESCE(SUM(discount_amount), 0) as total_discount,
    ROUND(
      (COALESCE(SUM(cash_revenue), 0) / NULLIF(SUM(total_revenue), 0)) * 100, 2
    ) as cash_pct,
    ROUND(
      (COALESCE(SUM(card_revenue), 0) / NULLIF(SUM(total_revenue), 0)) * 100, 2
    ) as card_pct
  FROM fact_revenue fr
  INNER JOIN dim_date dd ON fr.date_id = dd.date_id
  WHERE fr.salon_id = p_salon_id
    AND dd.full_date BETWEEN p_start_date AND p_end_date;
END$$

-- Procedure: Get Profit & Loss
CREATE PROCEDURE IF NOT EXISTS sp_calculate_profit_loss(
  IN p_salon_id INT,
  IN p_start_date DATE,
  IN p_end_date DATE
)
READS SQL DATA
BEGIN
  SELECT 
    total_revenue,
    total_expenses,
    (total_revenue - total_expenses) as net_profit,
    ROUND(
      ((total_revenue - total_expenses) / NULLIF(total_revenue, 0)) * 100, 2
    ) as profit_margin_pct,
    ROUND(
      (total_expenses / NULLIF(total_revenue, 0)) * 100, 2
    ) as operating_ratio_pct
  FROM (
    SELECT 
      COALESCE(SUM(CASE WHEN fr.salon_id = p_salon_id THEN fr.total_revenue ELSE 0 END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN fe.salon_id = p_salon_id THEN fe.expense_amount ELSE 0 END), 0) as total_expenses
    FROM fact_revenue fr
    LEFT JOIN fact_expense fe ON fr.date_id = fe.date_id
    INNER JOIN dim_date dd ON fr.date_id = dd.date_id
    WHERE dd.full_date BETWEEN p_start_date AND p_end_date
  ) subquery;
END$$

-- Procedure: Get Service Performance
CREATE PROCEDURE IF NOT EXISTS sp_get_service_performance(
  IN p_salon_id INT,
  IN p_start_date DATE,
  IN p_end_date DATE,
  IN p_limit INT
)
READS SQL DATA
BEGIN
  SELECT 
    ds.service_name,
    ds.category,
    ds.subcategory,
    COALESCE(COUNT(fr.revenue_fact_id), 0) as service_count,
    COALESCE(SUM(fr.total_revenue), 0) as service_revenue,
    COALESCE(AVG(fr.total_revenue), 0) as avg_service_price,
    ROUND(
      (COALESCE(SUM(fr.total_revenue), 0) / NULLIF(
        (SELECT SUM(total_revenue) FROM fact_revenue 
         INNER JOIN dim_date ON fact_revenue.date_id = dim_date.date_id
         WHERE fact_revenue.salon_id = p_salon_id 
           AND dim_date.full_date BETWEEN p_start_date AND p_end_date), 0)) * 100, 2
    ) as revenue_share_pct
  FROM dim_service ds
  LEFT JOIN fact_revenue fr ON ds.service_dim_id = fr.service_dim_id
  LEFT JOIN dim_date dd ON fr.date_id = dd.date_id
  WHERE ds.is_current = TRUE 
    AND fr.salon_id = p_salon_id
    AND dd.full_date BETWEEN p_start_date AND p_end_date
  GROUP BY ds.service_dim_id, ds.service_name, ds.category
  ORDER BY service_revenue DESC
  LIMIT p_limit;
END$$

-- Procedure: Get Staff Performance
CREATE PROCEDURE IF NOT EXISTS sp_get_staff_performance(
  IN p_salon_id INT,
  IN p_start_date DATE,
  IN p_end_date DATE
)
READS SQL DATA
BEGIN
  SELECT 
    ds.staff_name,
    ds.designation,
    COALESCE(COUNT(DISTINCT fr.booking_id), 0) as bookings_completed,
    COALESCE(SUM(fr.total_revenue), 0) as revenue_generated,
    COALESCE(AVG(fr.total_revenue), 0) as avg_booking_value,
    ROUND(
      (COALESCE(SUM(fr.total_revenue), 0) / NULLIF(
        (SELECT SUM(total_revenue) FROM fact_revenue 
         INNER JOIN dim_date ON fact_revenue.date_id = dim_date.date_id
         WHERE fact_revenue.salon_id = p_salon_id 
           AND dim_date.full_date BETWEEN p_start_date AND p_end_date), 0)) * 100, 2
    ) as revenue_contribution_pct
  FROM dim_staff ds
  LEFT JOIN fact_revenue fr ON ds.staff_dim_id = fr.staff_dim_id
  LEFT JOIN dim_date dd ON fr.date_id = dd.date_id
  WHERE ds.is_current = TRUE 
    AND ds.salon_id = p_salon_id
    AND dd.full_date BETWEEN p_start_date AND p_end_date
  GROUP BY ds.staff_dim_id, ds.staff_name
  ORDER BY revenue_generated DESC;
END$$

-- Procedure: Get Customer Intelligence
CREATE PROCEDURE IF NOT EXISTS sp_get_customer_intelligence(
  IN p_salon_id INT,
  IN p_start_date DATE,
  IN p_end_date DATE
)
READS SQL DATA
BEGIN
  SELECT 
    dc.customer_segment,
    COUNT(DISTINCT dc.customer_dim_id) as customer_count,
    COALESCE(SUM(fr.total_revenue), 0) as total_revenue,
    ROUND(
      COALESCE(SUM(fr.total_revenue), 0) / NULLIF(COUNT(DISTINCT dc.customer_dim_id), 0), 2
    ) as avg_customer_value,
    ROUND(
      COUNT(DISTINCT CASE WHEN dd.full_date >= DATE_SUB(p_end_date, INTERVAL 30 DAY) THEN dc.customer_dim_id ELSE NULL END) 
      / NULLIF(COUNT(DISTINCT dc.customer_dim_id), 0) * 100, 2
    ) as retention_rate
  FROM dim_customer dc
  LEFT JOIN fact_revenue fr ON dc.customer_dim_id = fr.customer_dim_id
  LEFT JOIN dim_date dd ON fr.date_id = dd.date_id
  WHERE dc.is_current = TRUE 
    AND dc.salon_id = p_salon_id
    AND dd.full_date BETWEEN p_start_date AND p_end_date
  GROUP BY dc.customer_segment
  ORDER BY total_revenue DESC;
END$$

-- Procedure: Calculate Membership Analytics
CREATE PROCEDURE IF NOT EXISTS sp_get_membership_analytics(
  IN p_salon_id INT,
  IN p_start_date DATE,
  IN p_end_date DATE
)
READS SQL DATA
BEGIN
  SELECT 
    COALESCE(SUM(fm.active_memberships), 0) as active_memberships,
    COALESCE(SUM(fm.new_memberships), 0) as new_memberships,
    COALESCE(SUM(fm.cancelled_memberships), 0) as cancelled_memberships,
    COALESCE(SUM(fm.membership_revenue), 0) as membership_revenue,
    ROUND(
      COALESCE(SUM(fm.renewal_rate), 0) / NULLIF(COUNT(*), 0), 2
    ) as avg_renewal_rate,
    COALESCE(AVG(fm.avg_membership_value), 0) as avg_membership_value
  FROM fact_membership fm
  INNER JOIN dim_date dd ON fm.date_id = dd.date_id
  WHERE fm.salon_id = p_salon_id
    AND dd.full_date BETWEEN p_start_date AND p_end_date;
END$$

-- Procedure: Calculate Moving Average (7-day forecast)
CREATE PROCEDURE IF NOT EXISTS sp_get_revenue_forecast(
  IN p_salon_id INT,
  IN p_days INT
)
READS SQL DATA
BEGIN
  SELECT 
    dd.full_date,
    dd.day_name,
    COALESCE(SUM(fr.total_revenue), 0) as actual_revenue,
    ROUND(
      AVG(COALESCE(SUM(fr.total_revenue), 0)) OVER (
        ORDER BY dd.full_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
      ), 2
    ) as moving_avg_7day,
    ROUND(
      AVG(COALESCE(SUM(fr.total_revenue), 0)) OVER (
        ORDER BY dd.full_date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
      ), 2
    ) as moving_avg_30day
  FROM fact_revenue fr
  INNER JOIN dim_date dd ON fr.date_id = dd.date_id
  WHERE fr.salon_id = p_salon_id
  GROUP BY dd.date_id, dd.full_date
  ORDER BY dd.full_date DESC
  LIMIT p_days;
END$$

DELIMITER ;

-- ============================================
-- INDEXING STRATEGY FOR PERFORMANCE
-- ============================================

-- Create composite indexes for common queries
ALTER TABLE fact_revenue ADD INDEX idx_salon_date_staff (salon_id, date_id, staff_dim_id);
ALTER TABLE fact_revenue ADD INDEX idx_salon_date_service (salon_id, date_id, service_dim_id);
ALTER TABLE fact_revenue ADD INDEX idx_salon_date_customer (salon_id, date_id, customer_dim_id);
ALTER TABLE fact_booking ADD INDEX idx_salon_date_status (salon_id, date_id);
ALTER TABLE fact_membership ADD INDEX idx_salon_date_customer (salon_id, date_id, customer_dim_id);

-- ============================================
-- SAMPLE DATA POPULATION (FOR TESTING)
-- ============================================

-- Populate dim_date table (last 2 years)
INSERT IGNORE INTO dim_date (date_id, full_date, year, quarter, month, day, week, day_of_week, is_weekend, day_name, month_name, quarter_name)
SELECT 
  DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL a.id DAY), '%Y%m%d') as date_id,
  DATE_SUB(CURDATE(), INTERVAL a.id DAY) as full_date,
  YEAR(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) as year,
  QUARTER(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) as quarter,
  MONTH(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) as month,
  DAY(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) as day,
  WEEK(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) as week,
  DAYOFWEEK(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) as day_of_week,
  IF(DAYOFWEEK(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) IN (1, 7), TRUE, FALSE) as is_weekend,
  DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL a.id DAY), '%W') as day_name,
  DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL a.id DAY), '%M') as month_name,
  CONCAT('Q', QUARTER(DATE_SUB(CURDATE(), INTERVAL a.id DAY))) as quarter_name
FROM (SELECT @id := @id + 1 as id FROM (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t1, (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t2, (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t3, (SELECT @id := -730) t4) a
WHERE a.id <= 730;
