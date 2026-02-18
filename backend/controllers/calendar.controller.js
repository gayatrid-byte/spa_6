const model = require('../models/calendar.model');

exports.getEvents = async (req, res) => {
  try {

    const { start, end, staff_id, room_id } = req.query;

    const events = await model.getEvents({
      start,
      end,
      staff_id,
      room_id
    });

    res.json(events);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {

    const id = req.params.id;
    const { booking_date, start_time, end_time } = req.body;

    await model.updateBookingTime(id, {
      booking_date,
      start_time,
      end_time
    });

    res.json({ message: "Booking updated successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
