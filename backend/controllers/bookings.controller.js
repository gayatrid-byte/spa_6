const Booking = require('../models/appointment.model');
const Membership = require('../models/membership.model');
// Lazy import pool when needed to avoid circulars
async function getServiceBasePrice(serviceId) {
  try {
    const { pool } = require('../config/database');
    const [rows] = await pool.query('SELECT base_price FROM services WHERE id = ?', [serviceId]);
    if (rows && rows.length > 0) {
      const bp = parseFloat(rows[0].base_price);
      return Number.isFinite(bp) ? bp : 0;
    }
    return 0;
  } catch (error) {
    console.warn('[Bookings] Failed to fetch base price for service', serviceId, error.message);
    return 0;
  }
}

// Customer search API
async function searchCustomers(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const customers = await Booking.searchCustomers(salonId, q.trim());
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get all bookings
async function getAllBookings(req, res) {
  try {
    const salonId = req.user.salon_id;
    const filters = req.query;
    
    const bookings = await Booking.getAll(salonId, filters);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get booking by ID
async function getBookingById(req, res) {
  try {
    const { id } = req.params;
    const booking = await Booking.getById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create new booking
async function createBooking(req, res) {
  try {
    const {
      customer_id,
      booking_type,
      booking_date,
      start_time,
      items,
      discount_amount = 0,
      tax_amount: frontend_tax_amount = 0,
      wallet_applied: frontend_wallet_applied = 0,
      notes,
      membership_apply = true,
      apply_percent = true,
      apply_wallet = true,
      subtotal_preview,
      plan_deduction_preview,
      wallet_applied_preview,
      total_amount_preview
    } = req.body;

    // Validate required fields
    if (!booking_date || !start_time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one service item is required' });
    }

    // Normalize item prices (fallback to service base_price when missing/zero) and calculate totals
    let subtotal = 0;
    let totalDuration = 0;
    for (const item of items) {
      if (!item.service_id || item.duration_minutes === undefined) {
        return res.status(400).json({ error: 'Each item must have service_id and duration_minutes' });
      }
      let priceNum = parseFloat(item.price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        priceNum = await getServiceBasePrice(item.service_id);
        item.price = priceNum; // mutate so downstream inserts have correct price
      }
      if (!Number.isFinite(priceNum) || priceNum < 0) priceNum = 0;
      subtotal += priceNum;
      totalDuration += parseInt(item.duration_minutes);
    }

    // Validate discount
    if (discount_amount > subtotal) {
      return res.status(400).json({ error: 'Discount cannot exceed subtotal' });
    }

    // Membership/Wallet calculations
    const manualDiscount = parseFloat(discount_amount) || 0;
    let planDiscount = 0;
    let walletApplied = 0;

    // Calculate end time
    const endTime = await calculateEndTime(start_time, totalDuration);

    // Check availability
    const isAvailable = await Booking.checkAvailability(
      req.user.salon_id,
      booking_date,
      start_time,
      totalDuration
    );

    if (!isAvailable) {
      return res.status(400).json({ error: 'Time slot is not available' });
    }

    // Apply membership plan and wallet if customer has active membership
    // Only recalculate if frontend didn't provide wallet values
    console.log('[Bookings] Checking membership for customer:', customer_id, 'membership_apply:', membership_apply, 'apply_wallet:', apply_wallet);
    if (customer_id && membership_apply && walletApplied === 0) {
      try {
        const membership = await Membership.getUserMembership(customer_id);
        console.log('[Bookings] Found membership:', membership ? { 
          id: membership.id, 
          wallet_balance: membership.wallet_balance, 
          status: membership.status,
          discount_percentage: membership.discount_percentage
        } : null);
        
        if (membership && (membership.status === 'active' || membership.status === 'pending')) {
          const percent = parseFloat(membership.discount_percentage || 0);
          // Percentage discount applies on the subtotal
          planDiscount = (apply_percent && percent > 0) ? (subtotal * (percent / 100)) : 0;
          
          console.log('[Bookings] Discount calculations:', {
            subtotal,
            planDiscount,
            manualDiscount
          });
          
          // Wallet covers remaining total after manual + plan
          const walletBalance = parseFloat(membership.wallet_balance || 0);
          const remainingAfterDiscounts = Math.max(0, subtotalAfterFree - planDiscount - manualDiscount);
          
          console.log('[Bookings] Before wallet application:', {
            walletBalance,
            subtotalAfterFree,
            planDiscount,
            manualDiscount,
            remainingAfterDiscounts,
            apply_wallet
          });
          
          if (apply_wallet && walletBalance > 0 && remainingAfterDiscounts > 0) {
            walletApplied = Math.min(walletBalance, remainingAfterDiscounts);
            console.log('[Bookings] Wallet applied:', walletApplied);
          } else {
            console.log('[Bookings] Wallet not applied because:', {
              apply_wallet,
              walletBalance: walletBalance > 0,
              remainingAfterDiscounts: remainingAfterDiscounts > 0
            });
          }

          // Update membership balances only if we actually applied something
          if (walletApplied > 0) {
            const newWallet = Math.max(0, walletBalance - walletApplied);
            await Membership.updateMembership(membership.id, {
              wallet_balance: newWallet
            });
            console.log('[Bookings] Updated membership wallet balance:', { newWallet });
          }
        } else {
          console.log('[Bookings] Membership not active or not found');
        }
      } catch (e) {
        console.log('[Bookings] Error in membership application:', e.message);
        // Ignore membership application errors
      }
    }

    // Use frontend calculated values if provided, otherwise calculate on backend
    walletApplied = parseFloat(frontend_wallet_applied || wallet_applied_preview || 0);
    let taxAmount = parseFloat(frontend_tax_amount || 0);
    
    console.log('[Bookings] Frontend values received:', {
      frontend_wallet_applied,
      wallet_applied_preview,
      frontend_tax_amount,
      apply_wallet,
      customer_id
    });
    
    // If no tax provided from frontend, calculate 5% tax on subtotal
    if (taxAmount === 0) {
      taxAmount = subtotal * 0.05;
    }

    const totalBeforeWallet = Math.max(0, subtotal + taxAmount - manualDiscount - planDiscount);
    const total = Math.max(0, totalBeforeWallet - walletApplied);

    console.log('[Bookings] Final calculations:', {
      subtotal,
      taxAmount,
      manualDiscount,
      planDiscount,
      walletApplied,
      totalBeforeWallet,
      total
    });

    // Use server calculated values for consistency
    const persistSubtotal = subtotal;
    const persistTotal = total;

    // Prepare booking data
    const bookingData = {
      salon_id: req.user.salon_id,
      customer_id: customer_id || null,
      booking_type: booking_type || 'walk_in',
      booking_date,
      start_time,
      end_time: endTime,
      total_duration: totalDuration,
      status: 'confirmed',
      subtotal_amount: persistSubtotal,
      discount_amount: parseFloat((manualDiscount + planDiscount).toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      wallet_applied: parseFloat(walletApplied.toFixed(2)),
      total_amount: persistTotal,
      notes: notes || '',
      created_by: req.user.id,
      updated_by: req.user.id
    };

    // Optional: log mismatch if client preview totals differ significantly
    try {
      if (subtotal_preview !== undefined || total_amount_preview !== undefined) {
        const previewSubtotal = parseFloat(subtotal_preview || subtotal);
        const previewTotal = parseFloat(total_amount_preview || total);
        const diffSubtotal = Math.abs(previewSubtotal - subtotal);
        const diffTotal = Math.abs(previewTotal - total);
        if (diffSubtotal > 0.01 || diffTotal > 0.01) {
          console.warn('[Bookings] Preview totals differ from server calc', {
            previewSubtotal, subtotal, diffSubtotal,
            previewTotal, total, diffTotal,
            plan_deduction_preview, wallet_applied_preview,
            serverPlanDiscount: planDiscount, serverWalletApplied: walletApplied
          });
        }
      }
    } catch (_) {}

    // Diagnostic: if computed total is 0 but subtotal > 0, log item price breakdown
    try {
      if (subtotal > 0 && total === 0) {
        console.warn('[Bookings] Computed total is 0 with positive subtotal', {
          subtotal,
          manualDiscount,
          planDiscount,
          walletApplied,
          items: items.map(i => ({ service_id: i.service_id, price: i.price, duration: i.duration_minutes }))
        });
      }
    } catch (_) {}

    // Create booking
    const bookingId = await Booking.create(bookingData, items);
    const booking = await Booking.getById(bookingId);

    res.status(201).json({
      message: 'Booking created successfully',
      booking_id: bookingId,
      booking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update booking
async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const {
      customer_id,
      booking_type,
      booking_date,
      start_time,
      items,
      discount_amount = 0,
      notes,
      status
    } = req.body;

    // Get existing booking
    const existing = await Booking.getById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // If changing date/time, check availability
    if ((booking_date && booking_date !== existing.booking_date) ||
        (start_time && start_time !== existing.start_time) ||
        (items && items.length > 0)) {
      
      // Calculate new totals if items are provided
      let subtotal = existing.subtotal_amount;
      let totalDuration = existing.total_duration;
      
      if (items && Array.isArray(items)) {
        subtotal = 0;
        totalDuration = 0;
        for (const item of items) {
          subtotal += parseFloat(item.price);
          totalDuration += parseInt(item.duration_minutes);
        }
      }

      const endTime = await calculateEndTime(start_time || existing.start_time, totalDuration);
      
      const isAvailable = await Booking.checkAvailability(
        req.user.salon_id,
        booking_date || existing.booking_date,
        start_time || existing.start_time,
        totalDuration,
        id
      );

      if (!isAvailable) {
        return res.status(400).json({ error: 'Time slot is not available' });
      }
    }

    // Calculate totals
    const subtotal = items && Array.isArray(items) ? 
      items.reduce((sum, item) => sum + parseFloat(item.price), 0) : 
      existing.subtotal_amount;
    
    const totalDuration = items && Array.isArray(items) ?
      items.reduce((sum, item) => sum + parseInt(item.duration_minutes), 0) :
      existing.total_duration;

    // Validate discount
    if (discount_amount > subtotal) {
      return res.status(400).json({ error: 'Discount cannot exceed subtotal' });
    }

    const total = subtotal - parseFloat(discount_amount || existing.discount_amount);
    const endTime = await calculateEndTime(start_time || existing.start_time, totalDuration);

    // Prepare update data
    const updateData = {
      customer_id: customer_id !== undefined ? customer_id : existing.customer_id,
      booking_type: booking_type || existing.booking_type,
      booking_date: booking_date || existing.booking_date,
      start_time: start_time || existing.start_time,
      end_time: endTime,
      total_duration: totalDuration,
      status: status || existing.status,
      subtotal_amount: subtotal,
      discount_amount: parseFloat(discount_amount || existing.discount_amount),
      total_amount: total,
      notes: notes || existing.notes,
      updated_by: req.user.id
    };

    // Update booking
    const updated = await Booking.update(id, updateData, items || null);
    
    if (!updated) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = await Booking.getById(id);
    
    res.json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update booking status
async function updateBookingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    const updated = await Booking.updateStatus(id, status);
    
    if (!updated) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ 
      message: 'Booking status updated successfully',
      status 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete booking
async function deleteBooking(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Booking.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Check availability
async function checkAvailability(req, res) {
  try {
    const { date, time, duration } = req.query;
    const salonId = req.user.salon_id;
    
    if (!date || !time || !duration) {
      return res.status(400).json({ error: 'Date, time, and duration are required' });
    }
    
    const isAvailable = await Booking.checkAvailability(salonId, date, time, parseInt(duration));
    
    res.json({ 
      available: isAvailable,
      date,
      time,
      duration
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get available slots
async function getAvailableSlots(req, res) {
  try {
    const { date, duration } = req.query;
    const salonId = req.user.salon_id;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const slots = await Booking.getAvailableSlots(salonId, date, parseInt(duration || 60));
    
    res.json({
      date,
      duration: duration || 60,
      slots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get dashboard statistics
async function getDashboardStats(req, res) {
  try {
    const salonId = req.user.salon_id;
    const stats = await Booking.getDashboardStats(salonId);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Helper function to calculate end time
async function calculateEndTime(startTime, totalDuration) {
  try {
    const { pool } = require('../config/database');
    const [result] = await pool.query(
      'SELECT ADDTIME(?, SEC_TO_TIME(? * 60)) as end_time',
      [startTime, totalDuration]
    );
    return result[0].end_time;
  } catch (error) {
    throw new Error(`Error calculating end time: ${error.message}`);
  }
}

module.exports = {
  searchCustomers,
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  checkAvailability,
  getAvailableSlots,
  getDashboardStats
};