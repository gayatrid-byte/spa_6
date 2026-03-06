-- Fix: Add missing 'status' column to staff table
-- Run this against your Aiven database if the staff table is missing this column

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'suspended', 'terminated') DEFAULT 'active'
  AFTER backup_station;

-- Also add commission_rate column if missing (used in dashboard.controller.js line 274)
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0
  AFTER status;

-- Set all existing staff to active by default
UPDATE staff SET status = 'active' WHERE status IS NULL;

SELECT 'Staff table updated successfully' as result;
SHOW COLUMNS FROM staff LIKE 'status';
SHOW COLUMNS FROM staff LIKE 'commission_rate';
