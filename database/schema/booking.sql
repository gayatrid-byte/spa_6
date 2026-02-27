-- booking.sql
-- Booking Module Tables (No Payment Integration)



-- Check and drop existing tables if needed
DROP TABLE IF EXISTS booking_items;
DROP TABLE IF EXISTS bookings;

-- ============================================
-- BOOKINGS TABLE (Fixed - No foreign key to non-existent tables)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL DEFAULT 1,
  customer_id INT NULL,
  booking_type ENUM('walk_in', 'calling') NOT NULL DEFAULT 'walk_in',
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NULL,
  total_duration INT DEFAULT 0 COMMENT 'Total minutes',
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  subtotal_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  wallet_applied DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_salon_id (salon_id),
  INDEX idx_booking_date (booking_date),
  INDEX idx_customer_id (customer_id),
  INDEX idx_booking_type (booking_type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BOOKING_ITEMS TABLE (Fixed)
-- ============================================
CREATE TABLE IF NOT EXISTS booking_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  category_id INT NOT NULL,
  subcategory_id INT NOT NULL,
  service_id INT NULL,
  room_id INT NULL,
  staff_id INT NULL,
  duration_minutes INT NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_booking_id (booking_id),
  INDEX idx_service_id (service_id),
  INDEX idx_staff_id (staff_id),
  INDEX idx_room_id (room_id),
  INDEX idx_category_id (category_id),
  INDEX idx_subcategory_id (subcategory_id),

  -- Foreign Keys
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT SAMPLE DATA FOR TESTING
-- ============================================

-- Sample booking (Walk-in)
INSERT INTO bookings (
  salon_id, customer_id, booking_type, booking_date, start_time, end_time,
  total_duration, status, subtotal_amount, discount_amount, total_amount, notes,
  created_by, updated_by
) VALUES (
  1, 1, 'walk_in', CURDATE(), '10:00:00', '11:30:00',
  90, 'completed', 2000.00, 100.00, 1900.00, 'Regular customer',
  1, 1
);

-- Sample booking (Calling appointment)
INSERT INTO bookings (
  salon_id, customer_id, booking_type, booking_date, start_time, end_time,
  total_duration, status, subtotal_amount, discount_amount, total_amount, notes,
  created_by, updated_by
) VALUES (
  1, 2, 'calling', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '15:00:00',
  60, 'confirmed', 1500.00, 0.00, 1500.00, 'Phone booking - new customer',
  1, 1
);

-- Sample booking items
INSERT INTO booking_items (
  booking_id, category_id, subcategory_id, service_id, room_id, staff_id,
  duration_minutes, price, notes
) VALUES
  (1, 4, 5, 1, 1, 1, 60, 1500.00, 'Swedish Body Massage'),
  (1, 3, 8, 5, 3, 2, 30, 500.00, 'Basic Facial');

INSERT INTO booking_items (
  booking_id, category_id, subcategory_id, service_id, room_id, staff_id,
  duration_minutes, price, notes
) VALUES
  (2, 4, 5, 1, 1, 1, 60, 1500.00, 'Swedish Body Massage');

-- ============================================
-- VIEW: Booking Details View
-- ============================================
CREATE OR REPLACE VIEW booking_details AS
SELECT
  b.*,
  c.name as customer_name,
  c.phone as customer_phone,
  c.email as customer_email,
  COUNT(bi.id) as total_services,
  SUM(bi.duration_minutes) as total_duration_minutes
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN booking_items bi ON b.id = bi.booking_id
GROUP BY b.id;

-- ============================================
-- VIEW: Booking Items with Service Details
-- ============================================
CREATE OR REPLACE VIEW booking_item_details AS
SELECT
  bi.*,
  s.name as service_name,
  s.duration_minutes as service_duration,
  s.base_price as service_price,
  cat.name as category_name,
  subcat.name as subcategory_name,
  r.name as room_name,
  st.name as staff_name
FROM booking_items bi
JOIN services s ON bi.service_id = s.id
JOIN categories cat ON bi.category_id = cat.id
JOIN categories subcat ON bi.subcategory_id = subcat.id
LEFT JOIN rooms r ON bi.room_id = r.id
LEFT JOIN staff st ON bi.staff_id = st.id;

-- Show created tables
SELECT '=== BOOKING TABLES CREATED ===' as info;
SHOW TABLES LIKE 'booking%';

SELECT '=== SAMPLE DATA ===' as info;
SELECT
  b.id,
  b.booking_type,
  b.booking_date,
  b.start_time,
  b.end_time,
  b.status,
  b.total_amount,
  c.name as customer_name,
  COUNT(bi.id) as services_count
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN booking_items bi ON b.id = bi.booking_id
GROUP BY b.id;