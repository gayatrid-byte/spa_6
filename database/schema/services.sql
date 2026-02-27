-- ============================================
-- SERVICES MODULE - FINAL SCHEMA (Matches backend code)
-- ============================================

-- Clean up existing conflicting tables
DROP TABLE IF EXISTS service_rooms;
DROP TABLE IF EXISTS combo_services;
DROP TABLE IF EXISTS service_combos;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS categories;

-- ============================================
-- SERVICES MODULE - Complete Schema
-- ============================================


-- ============================================
-- 1. CATEGORIES TABLE (Main and Sub categories)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  parent_id INT DEFAULT NULL,
  level ENUM('main', 'sub') NOT NULL DEFAULT 'main',
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_id (salon_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_level (level),
  INDEX idx_is_active (is_active),
  INDEX idx_display_order (display_order),
  UNIQUE KEY uk_salon_category (salon_id, name, parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  room_type ENUM('massage', 'spa', 'facial', 'hair', 'nails', 'multi_purpose', 'therapy', 'other') NOT NULL DEFAULT 'massage',
  capacity INT DEFAULT 1,
  description TEXT,
  bed_type ENUM('single', 'double', 'adjustable', 'massage_table', 'none') DEFAULT 'massage_table',
  shower_available BOOLEAN DEFAULT FALSE,
  steam_sauna_available BOOLEAN DEFAULT FALSE,
  jacuzzi_available BOOLEAN DEFAULT FALSE,
  ac_type ENUM('ac', 'non_ac', 'both') DEFAULT 'ac',
  lighting_type ENUM('warm', 'ambient', 'adjustable', 'dim', 'bright') DEFAULT 'adjustable',
  music_system BOOLEAN DEFAULT FALSE,
  special_equipment TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_id (salon_id),
  INDEX idx_room_type (room_type),
  INDEX idx_is_active (is_active),
  INDEX idx_capacity (capacity),
  UNIQUE KEY uk_salon_room (salon_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  duration_minutes INT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  description TEXT,
  allow_in_combo BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_id (salon_id),
  INDEX idx_category_id (category_id),
  INDEX idx_is_active (is_active),
  INDEX idx_allow_in_combo (allow_in_combo),
  FOREIGN KEY fk_service_category (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. SERVICE-ROOMS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS service_rooms (
  service_id INT NOT NULL,
  room_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (service_id, room_id),
  INDEX idx_service_id (service_id),
  INDEX idx_room_id (room_id),
  FOREIGN KEY fk_service_rooms_service (service_id) REFERENCES services(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY fk_service_rooms_room (room_id) REFERENCES rooms(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. SERVICE COMBOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS service_combos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  display_section ENUM('combo', 'offer', 'both') DEFAULT 'combo',
  original_price DECIMAL(10,2) DEFAULT 0.00,
  combo_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  valid_from DATE NOT NULL,
  valid_till DATE,
  applicable_days JSON,
  show_on_website BOOLEAN DEFAULT TRUE,
  show_on_pos BOOLEAN DEFAULT TRUE,
  show_on_booking BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_id (salon_id),
  INDEX idx_is_active (is_active),
  INDEX idx_validity (valid_from, valid_till),
  INDEX idx_display_section (display_section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. COMBO-SERVICES JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS combo_services (
  combo_id INT NOT NULL,
  service_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (combo_id, service_id),
  INDEX idx_combo_id (combo_id),
  INDEX idx_service_id (service_id),
  FOREIGN KEY fk_combo_services_combo (combo_id) REFERENCES service_combos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY fk_combo_services_service (service_id) REFERENCES services(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT SAMPLE DATA (Matches backend expectations)
-- ============================================

-- Insert main categories
INSERT INTO categories (salon_id, name, level, description, display_order) VALUES
(1, 'Spa', 'main', 'Spa and wellness treatments', 1),
(1, 'Hair', 'main', 'Hair care and styling services', 2),
(1, 'Facial', 'main', 'Facial treatments and skincare', 3),
(1, 'Massage', 'main', 'Massage and body therapy', 4);

-- Insert sub-categories
INSERT INTO categories (salon_id, name, parent_id, level, description, display_order) VALUES
(1, 'Body Massage', 1, 'sub', 'Full body massage therapies', 1),
(1, 'Swedish Massage', 4, 'sub', 'Relaxation massage', 2),
(1, 'Haircut', 2, 'sub', 'Hair cutting services', 3),
(1, 'Basic Facial', 3, 'sub', 'Standard facial cleaning', 4);

-- Insert rooms
INSERT INTO rooms (salon_id, name, room_type, capacity, description) VALUES
(1, 'Therapy Room 1', 'massage', 1, 'Standard massage room'),
(1, 'Hair Station 1', 'hair', 1, 'Hair styling station'),
(1, 'Facial Room', 'facial', 1, 'Facial treatment room');

-- Insert services (category_id must match sub-category IDs from above)
INSERT INTO services (salon_id, name, category_id, duration_minutes, base_price, description, allow_in_combo) VALUES
(1, 'Swedish Body Massage', 5, 60, 1500.00, 'Relaxing full body massage', TRUE),
(1, 'Deep Tissue Massage', 5, 90, 2200.00, 'Therapeutic deep tissue massage', TRUE),
(1, 'Men Haircut', 7, 30, 500.00, 'Basic haircut for men', TRUE),
(1, 'Women Haircut', 7, 45, 800.00, 'Stylish haircut for women', TRUE),
(1, 'Basic Facial', 8, 45, 1000.00, 'Basic facial cleaning', TRUE),
(1, 'Relaxing Swedish Massage', 6, 60, 1600.00, 'Classic Swedish relaxation massage', TRUE);

-- Insert service-room relationships
INSERT INTO service_rooms (service_id, room_id) VALUES
(1, 1), -- Swedish Body Massage in Therapy Room 1
(2, 1), -- Deep Tissue Massage in Therapy Room 1
(3, 2), -- Men Haircut in Hair Station 1
(4, 2), -- Women Haircut in Hair Station 1
(5, 3), -- Basic Facial in Facial Room
(6, 1); -- Relaxing Swedish Massage in Therapy Room 1

-- Insert combos
INSERT INTO service_combos (salon_id, name, description, original_price, combo_price, discount_percentage, valid_from, valid_till, applicable_days) VALUES
(1, 'Spa Day Package', 'Full body massage + facial treatment', 2500.00, 1999.99, 20.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY), '["mon", "tue", "wed", "thu", "fri", "sat"]'),
(1, 'Weekend Special', 'Haircut + facial treatment', 1800.00, 1499.99, 16.67, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY), '["sat", "sun"]');

-- Insert combo-service relationships
INSERT INTO combo_services (combo_id, service_id) VALUES
(1, 1), -- Spa Day Package includes Swedish Body Massage
(1, 5), -- Spa Day Package includes Basic Facial
(2, 4), -- Weekend Special includes Women Haircut
(2, 5); -- Weekend Special includes Basic Facial