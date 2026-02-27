-- Staff module: users and staff related tables

-- Users table (accounts)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('owner', 'center', 'staff') DEFAULT 'staff',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff main table
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
  joining_date DATE NOT NULL,
  department VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  employment_type ENUM('full_time', 'part_time', 'contract') DEFAULT 'full_time',
  experience_years INT DEFAULT 0,
  qualifications TEXT,
  skills TEXT,
  primary_role ENUM('service_provider', 'reception', 'admin', 'manager') DEFAULT 'service_provider',
  services_qualified TEXT,
  primary_station VARCHAR(50),
  backup_station VARCHAR(50),
  status ENUM('active', 'inactive', 'suspended', 'terminated') DEFAULT 'active',
  username VARCHAR(100),
  password VARCHAR(255),
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

-- Staff attendance
CREATE TABLE IF NOT EXISTS staff_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  expected_shift_start TIME,
  expected_shift_end TIME,
  shift_type VARCHAR(50),
  clock_in TIME,
  clock_out TIME,
  total_hours DECIMAL(4,2) DEFAULT 0,
  attendance_status ENUM('present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'weekly_off') DEFAULT 'absent',
  late_minutes INT DEFAULT 0,
  early_exit_minutes INT DEFAULT 0,
  break_start TIME,
  break_end TIME,
  break_duration INT DEFAULT 0,
  lunch_start TIME,
  lunch_end TIME,
  lunch_duration INT DEFAULT 0,
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

-- Staff leaves
CREATE TABLE IF NOT EXISTS staff_leaves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  leave_type ENUM('casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid', 'other') DEFAULT 'casual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  approved_by INT,
  approved_date DATE,
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

-- Staff leave balance
CREATE TABLE IF NOT EXISTS staff_leave_balance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  year YEAR NOT NULL,
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

-- Staff schedule, performance, commission, activity log, documents, training, settings
CREATE TABLE IF NOT EXISTS staff_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  monday_schedule JSON,
  tuesday_schedule JSON,
  wednesday_schedule JSON,
  thursday_schedule JSON,
  friday_schedule JSON,
  saturday_schedule JSON,
  sunday_schedule JSON,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  published_by INT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_id (staff_id),
  INDEX idx_week (week_start_date, week_end_date),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  period_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue_target DECIMAL(10,2) DEFAULT 0,
  revenue_achieved DECIMAL(10,2) DEFAULT 0,
  service_revenue DECIMAL(10,2) DEFAULT 0,
  product_revenue DECIMAL(10,2) DEFAULT 0,
  customers_served INT DEFAULT 0,
  repeat_customers INT DEFAULT 0,
  new_customers INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  services_completed INT DEFAULT 0,
  average_service_time INT DEFAULT 0,
  utilization_rate DECIMAL(5,2) DEFAULT 0,
  efficiency_score DECIMAL(5,2) DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS staff_commission (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  period_month DATE NOT NULL,
  service_revenue DECIMAL(10,2) DEFAULT 0,
  product_revenue DECIMAL(10,2) DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  service_commission_amount DECIMAL(10,2) DEFAULT 0,
  product_commission_amount DECIMAL(10,2) DEFAULT 0,
  performance_bonus_amount DECIMAL(10,2) DEFAULT 0,
  overtime_pay DECIMAL(10,2) DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  tax_deduction DECIMAL(10,2) DEFAULT 0,
  advance_deduction DECIMAL(10,2) DEFAULT 0,
  other_deductions DECIMAL(10,2) DEFAULT 0,
  total_deductions DECIMAL(10,2) DEFAULT 0,
  net_payable DECIMAL(10,2) DEFAULT 0,
  payment_status ENUM('pending', 'processing', 'paid', 'cancelled') DEFAULT 'pending',
  payment_date DATE,
  payment_method VARCHAR(50),
  transaction_reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_staff_month (staff_id, period_month),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  INDEX idx_salon_id (salon_id),
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
