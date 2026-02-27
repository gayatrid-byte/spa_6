-- Bookings module: bookings, booking_items, views

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  customer_id INT,
  booking_number VARCHAR(100) UNIQUE,
  status ENUM('scheduled','completed','cancelled','no_show') DEFAULT 'scheduled',
  start_datetime DATETIME,
  end_datetime DATETIME,
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  created_by INT,
  assigned_to INT,
  room_id INT,
  source ENUM('web','pos','phone','mobile') DEFAULT 'web',
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_id (salon_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  INDEX idx_start_datetime (start_datetime),
  INDEX idx_assigned_to (assigned_to),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  service_id INT,
  staff_id INT,
  duration_minutes INT DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_booking_id (booking_id),
  INDEX idx_service_id (service_id),
  INDEX idx_staff_id (staff_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional view for booking details
CREATE VIEW IF NOT EXISTS v_booking_details AS
SELECT b.*, c.full_name AS customer_name, s.name AS service_name, st.name AS staff_name
FROM bookings b
LEFT JOIN customers c ON c.id = b.customer_id
LEFT JOIN booking_items bi ON bi.booking_id = b.id
LEFT JOIN services s ON s.id = bi.service_id
LEFT JOIN staff st ON st.id = bi.staff_id;
