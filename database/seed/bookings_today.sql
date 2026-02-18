USE k;

-- Insert sample bookings for today (2026-02-11)
INSERT INTO bookings (salon_id, customer_id, booking_type, booking_date, start_time, end_time, total_duration, status, notes) VALUES
(1, 1, 'calling', '2026-02-11', '09:00:00', '10:00:00', 60, 'confirmed', 'Hair wash and hot oil massage'),
(1, 2, 'calling', '2026-02-11', '10:30:00', '11:30:00', 60, 'confirmed', 'Facial treatment'),
(1, 1, 'walk_in', '2026-02-11', '14:00:00', '15:30:00', 90, 'pending', 'Full body massage'),
(1, 2, 'calling', '2026-02-11', '16:00:00', '17:00:00', 60, 'confirmed', 'Manicure and pedicure'),
(1, 3, 'walk_in', '2026-02-11', '11:00:00', '12:00:00', 60, 'confirmed', 'Walk-in massage');

-- Insert booking items linking to staff/services
-- Assuming staff_id 1 and category_id/subcategory_id exist
INSERT INTO booking_items (booking_id, category_id, subcategory_id, staff_id, room_id, item_name, duration, price) VALUES
-- Booking 1 items
((SELECT LAST_INSERT_ID() - 4), 1, 1, 1, 1, 'Hair Wash', 30, 500),
((SELECT LAST_INSERT_ID() - 4), 2, 1, 1, 2, 'Hot Oil Massage', 30, 800),
-- Booking 2 items
((SELECT LAST_INSERT_ID() - 3), 3, 1, 2, 3, 'Facial Treatment', 60, 1500),
-- Booking 3 items
((SELECT LAST_INSERT_ID() - 2), 2, 1, 1, 2, 'Full Body Massage', 90, 2000),
-- Booking 4 items
((SELECT LAST_INSERT_ID() - 1), 1, 2, 2, 1, 'Manicure', 30, 600),
((SELECT LAST_INSERT_ID() - 1), 1, 3, 2, 1, 'Pedicure', 30, 600),
-- Booking 5 items
((SELECT LAST_INSERT_ID()), 2, 1, 1, 2, 'Relaxation Massage', 60, 1200);

SELECT 'Today\'s bookings added successfully!' AS Status;
SELECT * FROM bookings WHERE booking_date = '2026-02-11';
