-- ============================================
-- STEP 1: ADD MISSING COLUMNS TO TABLES
-- ============================================

-- Add is_deleted to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add is_deleted to rooms table (service_rooms is a junction table, no soft delete needed)
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add is_deleted to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add commission_rate to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0.00;

-- ============================================
-- STEP 2: VERIFY/CORRECT TABLE STRUCTURES
-- ============================================

-- Services table structure
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id INT,
  duration_minutes INT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  description TEXT,
  allow_in_combo BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_id (salon_id),
  INDEX idx_category_id (category_id),
  INDEX idx_is_active (is_active),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rooms table structure (for service_rooms reference)
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  room_type VARCHAR(50) DEFAULT 'massage',
  capacity INT DEFAULT 1,
  description TEXT,
  bed_type VARCHAR(50) DEFAULT 'massage_table',
  shower_available BOOLEAN DEFAULT FALSE,
  steam_sauna_available BOOLEAN DEFAULT FALSE,
  jacuzzi_available BOOLEAN DEFAULT FALSE,
  ac_type VARCHAR(20) DEFAULT 'ac',
  lighting_type VARCHAR(20) DEFAULT 'adjustable',
  music_system BOOLEAN DEFAULT FALSE,
  special_equipment TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_id (salon_id),
  INDEX idx_is_active (is_active),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table structure
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_id INT DEFAULT NULL,
  level ENUM('main', 'sub') DEFAULT 'main',
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_id (salon_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_level (level),
  INDEX idx_is_active (is_active),
  INDEX idx_is_deleted (is_deleted),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff table structure with commission_rate
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
  services_qualified TEXT COMMENT 'JSON array of service IDs',
  primary_station VARCHAR(50),
  backup_station VARCHAR(50),
  status ENUM('active', 'inactive', 'suspended', 'terminated') DEFAULT 'active',
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  username VARCHAR(100),
  password VARCHAR(255),
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_id (salon_id),
  INDEX idx_department (department),
  INDEX idx_status (status),
  INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 3: UPDATE EXISTING DATA
-- ============================================

-- Set all existing records as not deleted
UPDATE services SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE rooms SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE categories SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE staff SET commission_rate = 0.00 WHERE commission_rate IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

SHOW COLUMNS FROM services;
SHOW COLUMNS FROM rooms;
SHOW COLUMNS FROM categories;
SHOW COLUMNS FROM staff;
