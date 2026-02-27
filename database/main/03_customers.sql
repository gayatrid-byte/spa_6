-- Customers module

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  external_id VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name VARCHAR(511),
  email VARCHAR(255),
  phone VARCHAR(50),
  phone_normalized VARCHAR(50),
  dob DATE,
  gender ENUM('male', 'female', 'other') DEFAULT 'other',
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'IN',
  notes TEXT,
  loyalty_points INT DEFAULT 0,
  total_visits INT DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit DATE,
  preferred_staff_id INT,
  preferred_room VARCHAR(100),
  marketing_opt_in BOOLEAN DEFAULT TRUE,
  is_vip BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_salon_phone (salon_id, phone_normalized),
  INDEX idx_salon_id (salon_id),
  INDEX idx_email (email),
  INDEX idx_last_visit (last_visit),
  INDEX idx_preferred_staff (preferred_staff_id),
  FOREIGN KEY (preferred_staff_id) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  label VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_id (customer_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer notes and tags
CREATE TABLE IF NOT EXISTS customer_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  note_text TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_id (customer_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  tag VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_id (customer_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
