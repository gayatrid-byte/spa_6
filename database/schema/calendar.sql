-- ============================================
-- ENHANCED CALENDAR & RESOURCES SCHEMA
-- ============================================

-- Resources table for stations, rooms, equipment
CREATE TABLE IF NOT EXISTS resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('station', 'room', 'equipment', 'other') DEFAULT 'station',
  code VARCHAR(20) UNIQUE,
  description TEXT,
  capacity INT DEFAULT 1,
  status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  color_code VARCHAR(10) DEFAULT '#007bff',
  position VARCHAR(50) COMMENT 'Physical location/position',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_id (salon_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced appointments table with calendar features
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS color_code VARCHAR(10) DEFAULT '#007bff';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence_pattern ENUM('none', 'daily', 'weekly', 'monthly', 'custom') DEFAULT 'none';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence_days VARCHAR(20) COMMENT 'e.g., "1,3,5" for Mon,Wed,Fri';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS resource_id INT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS buffer_before INT DEFAULT 0 COMMENT 'Minutes before appointment';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS buffer_after INT DEFAULT 0 COMMENT 'Minutes after appointment';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Resource bookings table
CREATE TABLE IF NOT EXISTS resource_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resource_id INT NOT NULL,
  appointment_id INT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('scheduled', 'in_use', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_resource_time (resource_id, booking_date, start_time),
  INDEX idx_booking_date (booking_date),
  INDEX idx_status (status),
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Calendar settings table
CREATE TABLE IF NOT EXISTS calendar_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSON,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_salon_setting (salon_id, setting_key),
  INDEX idx_salon_id (salon_id),
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Business hours table
CREATE TABLE IF NOT EXISTS business_hours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  day_of_week INT NOT NULL COMMENT '0=Sunday, 1=Monday, etc.',
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  break_start TIME,
  break_end TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_salon_day (salon_id, day_of_week),
  INDEX idx_salon_id (salon_id),
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff availability exceptions
CREATE TABLE IF NOT EXISTS staff_availability_exceptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  exception_date DATE NOT NULL,
  exception_type ENUM('leave', 'training', 'meeting', 'other') DEFAULT 'leave',
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_staff_date (staff_id, exception_date),
  INDEX idx_staff_id (staff_id),
  INDEX idx_exception_date (exception_date),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Calendar analytics
CREATE TABLE IF NOT EXISTS calendar_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  analytics_date DATE NOT NULL,
  total_bookings INT DEFAULT 0,
  completed_bookings INT DEFAULT 0,
  cancelled_bookings INT DEFAULT 0,
  no_show_bookings INT DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  avg_wait_time INT DEFAULT 0 COMMENT 'Minutes',
  peak_hour TIME,
  staff_utilization DECIMAL(5,2) DEFAULT 0 COMMENT 'Percentage',
  resource_utilization DECIMAL(5,2) DEFAULT 0 COMMENT 'Percentage',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_salon_date (salon_id, analytics_date),
  INDEX idx_analytics_date (analytics_date),
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default calendar settings
INSERT INTO calendar_settings (salon_id, setting_key, setting_value, description) VALUES
(1, 'business_hours', '{"monday": {"open": "09:00", "close": "20:00", "break_start": "13:00", "break_end": "14:00"}, "tuesday": {"open": "09:00", "close": "20:00", "break_start": "13:00", "break_end": "14:00"}, "wednesday": {"open": "09:00", "close": "20:00", "break_start": "13:00", "break_end": "14:00"}, "thursday": {"open": "09:00", "close": "20:00", "break_start": "13:00", "break_end": "14:00"}, "friday": {"open": "09:00", "close": "21:00", "break_start": "13:00", "break_end": "14:00"}, "saturday": {"open": "09:00", "close": "21:00", "break_start": "13:00", "break_end": "14:00"}, "sunday": {"open": "10:00", "close": "18:00", "break_start": "13:00", "break_end": "14:00"}}', 'Default business hours'),
(1, 'calendar_settings', '{"default_view": "week", "slot_duration": "15", "time_range_start": "08:00", "time_range_end": "22:00", "show_breaks": true, "color_by": "status", "allow_overlap": false}', 'Calendar display settings'),
(1, 'booking_rules', '{"advance_booking_days": 90, "same_day_cutoff_hours": 2, "buffer_between_appointments": 15, "cancellation_hours": 24, "deposit_required": true, "deposit_percentage": 20}', 'Booking rules and policies'),
(1, 'notifications', '{"customer_confirmation": true, "customer_reminder_hours": 24, "customer_followup": true, "staff_new_assignment": true, "staff_schedule_changes": true, "admin_high_wait_time": 20, "admin_double_booking": true}', 'Notification settings');

-- Insert default business hours
INSERT INTO business_hours (salon_id, day_of_week, open_time, close_time, is_closed, break_start, break_end) VALUES
(1, 1, '09:00', '20:00', FALSE, '13:00', '14:00'), -- Monday
(1, 2, '09:00', '20:00', FALSE, '13:00', '14:00'), -- Tuesday
(1, 3, '09:00', '20:00', FALSE, '13:00', '14:00'), -- Wednesday
(1, 4, '09:00', '20:00', FALSE, '13:00', '14:00'), -- Thursday
(1, 5, '09:00', '21:00', FALSE, '13:00', '14:00'), -- Friday
(1, 6, '09:00', '21:00', FALSE, '13:00', '14:00'), -- Saturday
(1, 0, '10:00', '18:00', FALSE, '13:00', '14:00'); -- Sunday

-- Insert sample resources
INSERT INTO resources (salon_id, name, type, code, description, capacity, color_code) VALUES
(1, 'Station #1', 'station', 'STN-001', 'Basic haircut station', 1, '#4CAF50'),
(1, 'Station #2', 'station', 'STN-002', 'Premium station with TV', 1, '#2196F3'),
(1, 'Station #3', 'station', 'STN-003', 'Express service station', 1, '#FF9800'),
(1, 'Spa Room #1', 'room', 'ROOM-001', 'Signature spa suite', 1, '#9C27B0'),
(1, 'Facial Room', 'room', 'ROOM-002', 'Facial and treatment room', 1, '#E91E63'),
(1, 'Massage Chair #1', 'equipment', 'CHAIR-001', 'Full body massage chair', 1, '#00BCD4'),
(1, 'Massage Chair #2', 'equipment', 'CHAIR-002', 'Head and shoulder massage', 1, '#8BC34A');

-- Create calendar events view
CREATE OR REPLACE VIEW calendar_events AS
SELECT 
  a.id,
  a.salon_id,
  a.customer_id,
  a.service_id,
  a.appointment_date,
  a.appointment_time,
  a.duration,
  a.status,
  a.color_code,
  a.resource_id,
  c.name as customer_name,
  c.phone as customer_phone,
  s.name as service_name,
  s.price as service_price,
  s.duration as service_duration,
  st.name as staff_name,
  r.name as resource_name,
  r.type as resource_type,
  r.color_code as resource_color,
  -- Calculate end time
  ADDTIME(a.appointment_time, SEC_TO_TIME(a.duration * 60)) as end_time,
  -- JSON for full event data
  JSON_OBJECT(
    'id', a.id,
    'title', CONCAT(c.name, ' - ', s.name),
    'start', CONCAT(a.appointment_date, 'T', a.appointment_time),
    'end', CONCAT(a.appointment_date, 'T', ADDTIME(a.appointment_time, SEC_TO_TIME(a.duration * 60))),
    'status', a.status,
    'color', a.color_code,
    'customer', c.name,
    'service', s.name,
    'staff', st.name,
    'resource', r.name,
    'duration', a.duration
  ) as event_data
FROM appointments a
LEFT JOIN customers c ON a.customer_id = c.id
LEFT JOIN services s ON a.service_id = s.id
LEFT JOIN staff st ON a.created_by = st.id
LEFT JOIN resources r ON a.resource_id = r.id
WHERE a.status != 'cancelled';

-- Show created tables
SELECT '=== CALENDAR TABLES CREATED ===' as info;
SHOW TABLES LIKE '%calendar%';
SHOW TABLES LIKE '%resource%';
SHOW TABLES LIKE '%business%';