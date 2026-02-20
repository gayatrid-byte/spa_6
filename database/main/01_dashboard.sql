-- Dashboard analytics / summary module
-- This file is intentionally minimal. Detailed warehouse and reporting tables
-- are placed under database/main/09_reports.sql to keep dashboard lightweight.

-- Place any lightweight materialized summary tables or views here if needed.
-- Example: today's bookings view (created where bookings exist)

CREATE OR REPLACE VIEW v_today_bookings AS
SELECT 
    ce.*,
    c.name AS customer_name,
    s.name AS service_name,
    u.name AS staff_name,
    r.name AS room_name
FROM calendar_events ce
LEFT JOIN customers c ON ce.customer_id = c.id
LEFT JOIN services s ON ce.service_id = s.id
LEFT JOIN users u ON ce.staff_id = u.id
LEFT JOIN rooms r ON ce.room_id = r.id
WHERE ce.deleted_at IS NULL
  AND DATE(ce.start_datetime) = CURDATE()
  AND ce.event_type = 'booking';
