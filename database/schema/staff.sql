-- ============================================
-- STAFF MANAGEMENT SYSTEM TABLES - UPDATED (NO COMPENSATION)
-- ============================================

-- Drop existing staff table and recreate without compensation columns
DROP TABLE IF EXISTS staff;

-- ============================================
-- STAFF MANAGEMENT SYSTEM TABLES - FINAL FIXED VERSION
-- ============================================

-- Drop existing staff table if exists (or use ALTER if you have data)
-- DROP TABLE IF EXISTS staff;

-- Staff main table - WITHOUT COMPENSATION COLUMNS
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other') DEFAULT 'male',
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  
  -- Professional details
  joining_date DATE NOT NULL,
  department VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  employment_type ENUM('full_time', 'part_time', 'contract') DEFAULT 'full_time',
  experience_years INT DEFAULT 0,
  qualifications TEXT,
  skills TEXT,
  
  -- Job assignment
  primary_role ENUM('service_provider', 'reception', 'admin', 'manager') DEFAULT 'service_provider',
  services_qualified TEXT COMMENT 'JSON array of service IDs',
  primary_station VARCHAR(50),
  backup_station VARCHAR(50),
  
  -- Status
  status ENUM('active', 'inactive', 'suspended', 'terminated') DEFAULT 'active',
  
  -- Login credentials (if separate from users table)
  username VARCHAR(100),
  password VARCHAR(255),
  
  -- Audit fields
  created_by INT,
  updated_by INT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_id (salon_id),
  INDEX idx_department (department),
  INDEX idx_status (status),
  INDEX idx_employee_id (employee_id),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance table
CREATE TABLE IF NOT EXISTS staff_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  
  -- Shift details
  expected_shift_start TIME,
  expected_shift_end TIME,
  shift_type VARCHAR(50),
  
  -- Actual timings
  clock_in TIME,
  clock_out TIME,
  total_hours DECIMAL(4,2) DEFAULT 0,
  
  -- Status
  attendance_status ENUM('present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'weekly_off') DEFAULT 'absent',
  late_minutes INT DEFAULT 0,
  early_exit_minutes INT DEFAULT 0,
  
  -- Breaks
  break_start TIME,
  break_end TIME,
  break_duration INT DEFAULT 0 COMMENT 'in minutes',
  lunch_start TIME,
  lunch_end TIME,
  lunch_duration INT DEFAULT 0 COMMENT 'in minutes',
  
  -- Work details
  notes TEXT,
  verified_by INT,
  verification_time TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_staff_date (staff_id, attendance_date),
  INDEX idx_attendance_date (attendance_date),
  INDEX idx_status (attendance_status),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave management table
CREATE TABLE IF NOT EXISTS staff_leaves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  leave_type ENUM('casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid', 'other') DEFAULT 'casual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  
  -- Status
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  approved_by INT,
  approved_date DATE,
  
  -- Details
  reason TEXT,
  contact_during_leave VARCHAR(20),
  handover_to INT,
  medical_certificate_url VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_id (staff_id),
  INDEX idx_status (status),
  INDEX idx_date_range (start_date, end_date),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (handover_to) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave balance table
CREATE TABLE IF NOT EXISTS staff_leave_balance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  year YEAR NOT NULL,
  
  -- Leave balances
  casual_leave_total INT DEFAULT 12,
  casual_leave_taken INT DEFAULT 0,
  casual_leave_remaining INT DEFAULT 12,
  
  sick_leave_total INT DEFAULT 7,
  sick_leave_taken INT DEFAULT 0,
  sick_leave_remaining INT DEFAULT 7,
  
  annual_leave_total INT DEFAULT 21,
  annual_leave_taken INT DEFAULT 0,
  annual_leave_remaining INT DEFAULT 21,
  
  special_leave_total INT DEFAULT 2,
  special_leave_taken INT DEFAULT 0,
  special_leave_remaining INT DEFAULT 2,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_staff_year (staff_id, year),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff schedule table
CREATE TABLE IF NOT EXISTS staff_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Daily schedules (store as JSON)
  monday_schedule JSON,
  tuesday_schedule JSON,
  wednesday_schedule JSON,
  thursday_schedule JSON,
  friday_schedule JSON,
  saturday_schedule JSON,
  sunday_schedule JSON,
  
  -- Status
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  published_by INT,
  published_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_id (staff_id),
  INDEX idx_week (week_start_date, week_end_date),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff performance metrics
CREATE TABLE IF NOT EXISTS staff_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  period_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Revenue metrics
  revenue_target DECIMAL(10,2) DEFAULT 0,
  revenue_achieved DECIMAL(10,2) DEFAULT 0,
  service_revenue DECIMAL(10,2) DEFAULT 0,
  product_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Customer metrics
  customers_served INT DEFAULT 0,
  repeat_customers INT DEFAULT 0,
  new_customers INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  
  -- Productivity metrics
  services_completed INT DEFAULT 0,
  average_service_time INT DEFAULT 0 COMMENT 'in minutes',
  utilization_rate DECIMAL(5,2) DEFAULT 0 COMMENT 'percentage',
  efficiency_score DECIMAL(5,2) DEFAULT 0,
  
  -- Attendance metrics
  days_worked INT DEFAULT 0,
  days_present INT DEFAULT 0,
  days_absent INT DEFAULT 0,
  days_late INT DEFAULT 0,
  total_overtime_hours DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_staff_period (staff_id, period_type, period_start),
  INDEX idx_period (period_start, period_end),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commission table (Simplified - no compensation rates)
CREATE TABLE IF NOT EXISTS staff_commission (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  period_month DATE NOT NULL COMMENT 'First day of month',
  
  -- Revenue breakdown
  service_revenue DECIMAL(10,2) DEFAULT 0,
  product_revenue DECIMAL(10,2) DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Commission amounts (rates removed)
  service_commission_amount DECIMAL(10,2) DEFAULT 0,
  product_commission_amount DECIMAL(10,2) DEFAULT 0,
  performance_bonus_amount DECIMAL(10,2) DEFAULT 0,
  overtime_pay DECIMAL(10,2) DEFAULT 0,
  
  -- Total earnings
  total_earnings DECIMAL(10,2) DEFAULT 0,
  
  -- Deductions
  tax_deduction DECIMAL(10,2) DEFAULT 0,
  advance_deduction DECIMAL(10,2) DEFAULT 0,
  other_deductions DECIMAL(10,2) DEFAULT 0,
  total_deductions DECIMAL(10,2) DEFAULT 0,
  
  -- Net pay
  net_payable DECIMAL(10,2) DEFAULT 0,
  
  -- Payment details
  payment_status ENUM('pending', 'processing', 'paid', 'cancelled') DEFAULT 'pending',
  payment_date DATE,
  payment_method VARCHAR(50),
  transaction_reference VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_staff_month (staff_id, period_month),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff activity log
CREATE TABLE IF NOT EXISTS staff_activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  activity_details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_staff_id (staff_id),
  INDEX idx_activity_type (activity_type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff documents
CREATE TABLE IF NOT EXISTS staff_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_url VARCHAR(255) NOT NULL,
  expiry_date DATE,
  verified BOOLEAN DEFAULT FALSE,
  verified_by INT,
  verified_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_id (staff_id),
  INDEX idx_document_type (document_type),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff training records
CREATE TABLE IF NOT EXISTS staff_training (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  training_name VARCHAR(255) NOT NULL,
  training_type VARCHAR(100),
  trainer VARCHAR(255),
  training_date DATE,
  duration_hours INT,
  status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
  certificate_url VARCHAR(255),
  skills_acquired TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_id (staff_id),
  INDEX idx_training_date (training_date),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff settings (store as JSON for flexibility)
CREATE TABLE IF NOT EXISTS staff_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  setting_category VARCHAR(100) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSON,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_setting (salon_id, setting_category, setting_key),
  INDEX idx_salon_id (salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default staff settings (No commission settings)
INSERT IGNORE INTO staff_settings (salon_id, setting_category, setting_key, setting_value, description) VALUES
(1, 'attendance', 'grace_period', '15', 'Grace period for late arrival in minutes'),
(1, 'attendance', 'auto_clockout', '30', 'Auto clock-out after inactivity in minutes'),
(1, 'attendance', 'min_hours_full_day', '7.5', 'Minimum hours for full day'),
(1, 'attendance', 'overtime_rate', '1.5', 'Overtime multiplier rate'),
(1, 'attendance', 'break_allowance', '60', 'Daily break allowance in minutes'),
(1, 'scheduling', 'default_shift_hours', '9', 'Default shift duration in hours'),
(1, 'scheduling', 'min_shift_gap', '12', 'Minimum gap between shifts in hours'),
(1, 'scheduling', 'max_consecutive_days', '6', 'Maximum consecutive working days'),
(1, 'performance', 'rating_calculation_days', '30', 'Days to consider for rating calculation'),
(1, 'performance', 'min_rating_for_bonus', '4.0', 'Minimum rating for bonus eligibility');

-- Insert sample staff data
INSERT IGNORE INTO staff (salon_id, employee_id, name, email, phone, department, designation, joining_date, status) VALUES
(1, 'STF-25001', 'John Doe', 'john@example.com', '9876543210', 'Hair Services', 'Senior Stylist', '2024-01-15', 'active'),
(1, 'STF-25002', 'Jane Smith', 'jane@example.com', '9876543211', 'Spa Services', 'Therapist', '2024-02-01', 'active'),
(1, 'STF-25003', 'Bob Wilson', 'bob@example.com', '9876543212', 'Reception', 'Front Desk Executive', '2024-03-10', 'active'),
(1, 'STF-25004', 'Alice Johnson', 'alice@example.com', '9876543213', 'Admin', 'Manager', '2024-01-01', 'active');

-- Create leave balances for staff
INSERT IGNORE INTO staff_leave_balance (staff_id, year) 
SELECT id, YEAR(CURRENT_DATE) FROM staff 
ON DUPLICATE KEY UPDATE year = VALUES(year);

-- Show final table structure
SELECT '=== STAFF TABLE STRUCTURE ===' as info;
SHOW COLUMNS FROM staff;

SELECT '=== TOTAL TABLES CREATED ===' as info;
SHOW TABLES LIKE 'staff%';