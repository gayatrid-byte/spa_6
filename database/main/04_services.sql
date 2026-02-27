-- Services module: categories, services, rooms, combos

CREATE TABLE IF NOT EXISTS service_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_salon_category (salon_id, name),
  INDEX idx_salon_id (salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  capacity INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_salon_room (salon_id, name),
  INDEX idx_salon_id (salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  category_id INT,
  room_id INT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100),
  duration_minutes INT DEFAULT 30,
  price DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  commission_percent DECIMAL(5,2) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_combo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_salon_service (salon_id, name),
  INDEX idx_salon_id (salon_id),
  INDEX idx_category_id (category_id),
  INDEX idx_room_id (room_id),
  FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_combos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_salon_combo (salon_id, name),
  INDEX idx_salon_id (salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS combo_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  combo_id INT NOT NULL,
  service_id INT NOT NULL,
  position INT DEFAULT 0,
  quantity INT DEFAULT 1,
  FOREIGN KEY (combo_id) REFERENCES service_combos(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
