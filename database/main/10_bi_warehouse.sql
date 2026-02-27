
CREATE TABLE IF NOT EXISTS dim_date (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `date` DATE NOT NULL,
  day INT,
  month INT,
  year INT,
  quarter INT,
  is_weekend BOOLEAN DEFAULT FALSE,
  is_holiday BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_date (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dim_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT,
  name VARCHAR(255),
  salon_id INT,
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_staff (staff_id, salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dim_service (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT,
  name VARCHAR(255),
  category VARCHAR(255),
  duration_minutes INT,
  price DECIMAL(10,2),
  salon_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_service (service_id, salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dim_customer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  full_name VARCHAR(511),
  email VARCHAR(255),
  phone VARCHAR(50),
  salon_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_customer (customer_id, salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fact_revenue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT,
  date_id INT,
  staff_id INT,
  service_id INT,
  customer_id INT,
  invoice_id INT,
  booking_id INT,
  amount DECIMAL(12,2),
  tax DECIMAL(12,2),
  discount DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_date_id (date_id),
  INDEX idx_staff_id (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fact_booking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT,
  date_id INT,
  booking_id INT,
  booking_items INT,
  total_amount DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_date_id (date_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fact_expense (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT,
  date_id INT,
  expense_id INT,
  amount DECIMAL(12,2),
  category VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_date_id (date_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
