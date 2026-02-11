const db = require('../config/database');

exports.getEvents = async ({ start, end, staff_id, room_id }) => {

  let query = `
    SELECT DISTINCT
      b.id,
      b.booking_date,
      b.start_time,
      b.end_time,
      b.status,
      c.name AS customer_name
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN booking_items bi ON bi.booking_id = b.id
    WHERE b.booking_date >= ? 
      AND b.booking_date < ?
  `;

  const params = [start, end];

  if (staff_id) {
    query += " AND bi.staff_id = ?";
    params.push(staff_id);
  }

  if (room_id) {
    query += " AND bi.room_id = ?";
    params.push(room_id);
  }

  query += " ORDER BY b.booking_date, b.start_time";

  const [rows] = await db.query(query, params);

  return rows.map(row => {

    // Ensure seconds exist
    const startTime = row.start_time.length === 5 
      ? row.start_time + ':00' 
      : row.start_time;

    const endTime = row.end_time.length === 5 
      ? row.end_time + ':00' 
      : row.end_time;

    return {
      id: row.id,
      title: row.customer_name || "Walk-in",
      start: `${row.booking_date}T${startTime}`,
      end: `${row.booking_date}T${endTime}`,
      status: row.status,
      extendedProps: {
        status: row.status
      }
    };
  });
};

exports.updateBookingTime = async (id, data) => {

  const { booking_date, start_time, end_time } = data;

  await db.query(
    `UPDATE bookings 
     SET booking_date = ?, start_time = ?, end_time = ?
     WHERE id = ?`,
    [booking_date, start_time, end_time, id]
  );
};
