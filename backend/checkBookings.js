const { pool } = require('./config/database');

async function checkBookings() {
  try {
    const connection = await pool.getConnection();
    
    // Check all bookings
    console.log('\n=== ALL BOOKINGS IN DATABASE ===');
    const [allRows] = await connection.query("SELECT id, booking_date, start_time, end_time, status, customer_id FROM bookings ORDER BY booking_date, start_time");
    console.log(`Total bookings: ${allRows.length}`);
    allRows.forEach(row => {
      console.log(`ID: ${row.id}, Date: ${row.booking_date}, Time: ${row.start_time}-${row.end_time}, Status: ${row.status}, Customer: ${row.customer_id}`);
    });
    
    // Check specifically for 2026-02-11
    console.log('\n=== BOOKINGS FOR 2026-02-11 ===');
    const [todayRows] = await connection.query("SELECT * FROM bookings WHERE booking_date = '2026-02-11' ORDER BY start_time");
    console.log(`Found ${todayRows.length} bookings for 2026-02-11`);
    todayRows.forEach(row => {
      console.log(`- ${row.start_time} to ${row.end_time}: ${row.notes}`);
    });
    
    // Check date types
    console.log('\n=== CHECKING BOOKING_DATE DATA TYPES ===');
    const [sampleRow] = await connection.query("SELECT booking_date, typeof(booking_date) as type FROM bookings LIMIT 1");
    console.log(`Sample booking_date value: ${sampleRow[0]?.booking_date}`);
    console.log(`Type: ${typeof sampleRow[0]?.booking_date}`);
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBookings();
