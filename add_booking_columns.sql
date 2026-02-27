-- Add missing columns to bookings table
USE k;

-- Add tax_amount and wallet_applied columns if they don't exist
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0 AFTER discount_amount,
ADD COLUMN IF NOT EXISTS wallet_applied DECIMAL(10,2) DEFAULT 0 AFTER tax_amount;

-- Check the table structure
DESCRIBE bookings;