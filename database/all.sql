 -- =====================================================
-- MASTER DATABASE BUILD SCRIPT
-- Salon Management System + Business Intelligence
-- Production Grade | InnoDB | UTF8MB4
-- =====================================================

-- Step 1: Create Database
DROP DATABASE IF EXISTS salon_management;
CREATE DATABASE salon_management 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
USE salon_management;

-- =====================================================
-- LEVEL 1: BASE TABLES (No Foreign Keys)
-- =====================================================

-- -----------------------------------------------------
-- Table `salons`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `salons` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL DEFAULT 'Salon Management System',
  `address` TEXT NULL,
  `phone` VARCHAR(20) NULL,
  `email` VARCHAR(255) NULL,
  `gstin` VARCHAR(15) NULL COMMENT '15-character alphanumeric code for tax identification',
  `logo_url` VARCHAR(500) NULL,
  `working_hours_start` TIME DEFAULT '08:00:00',
  `working_hours_end` TIME DEFAULT '22:00:00',
  `billing_currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
  `billing_tax_rate` DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  `billing_invoice_prefix` VARCHAR(10) NOT NULL DEFAULT 'INV',
  `billing_next_invoice_number` INT UNSIGNED NOT NULL DEFAULT 1001,
  `billing_gst_enabled` TINYINT(1) DEFAULT 1,
  `billing_gst_type` VARCHAR(10) DEFAULT 'intra',
  `billing_gst_rate` DECIMAL(5,2) DEFAULT 18.00,
  `billing_cgst_rate` DECIMAL(5,2) DEFAULT 9.00,
  `billing_sgst_rate` DECIMAL(5,2) DEFAULT 9.00,
  `billing_igst_rate` DECIMAL(5,2) DEFAULT 18.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('owner', 'center', 'staff') NOT NULL DEFAULT 'staff',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email` (`email` ASC),
  INDEX `idx_salon_id` (`salon_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `parent_id` INT UNSIGNED NULL,
  `level` ENUM('main', 'sub') NOT NULL,
  `description` TEXT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_salon_category` (`salon_id` ASC, `parent_id` ASC, `name` ASC),
  INDEX `idx_salon_id` (`salon_id` ASC),
  INDEX `idx_parent_id` (`parent_id` ASC),
  INDEX `idx_level` (`level` ASC),
  INDEX `idx_is_active` (`is_active` ASC),
  INDEX `idx_display_order` (`display_order` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `rooms`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `room_type` ENUM('massage', 'spa', 'facial', 'hair', 'nails', 'multi_purpose', 'therapy', 'other') NOT NULL DEFAULT 'massage',
  `capacity` INT NOT NULL DEFAULT 1,
  `description` TEXT NULL,
  `bed_type` ENUM('single', 'double', 'adjustable', 'massage_table', 'none') NULL,
  `shower_available` BOOLEAN NOT NULL DEFAULT FALSE,
  `steam_sauna_available` BOOLEAN NOT NULL DEFAULT FALSE,
  `jacuzzi_available` BOOLEAN NOT NULL DEFAULT FALSE,
  `ac_type` ENUM('ac', 'non_ac', 'both') NULL,
  `lighting_type` ENUM('warm', 'ambient', 'adjustable', 'dim', 'bright') NULL,
  `music_system` BOOLEAN NOT NULL DEFAULT FALSE,
  `special_equipment` VARCHAR(255) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_salon_room` (`salon_id` ASC, `name` ASC),
  INDEX `idx_salon_id` (`salon_id` ASC),
  INDEX `idx_room_type` (`room_type` ASC),
  INDEX `idx_is_active` (`is_active` ASC),
  INDEX `idx_capacity` (`capacity` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEVEL 2: CORE BUSINESS ENTITIES
-- =====================================================

-- -----------------------------------------------------
-- Table `staff`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `employee_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NOT NULL,
  `date_of_birth` DATE NULL,
  `gender` ENUM('male', 'female', 'other') NULL,
  `address` TEXT NULL,
  `emergency_contact_name` VARCHAR(255) NULL,
  `emergency_contact_phone` VARCHAR(20) NULL,
  `joining_date` DATE NOT NULL,
  `department` VARCHAR(100) NULL,
  `designation` VARCHAR(100) NULL,
  `employment_type` ENUM('full_time', 'part_time', 'contract') NOT NULL DEFAULT 'full_time',
  `experience_years` INT NOT NULL DEFAULT 0,
  `qualifications` TEXT NULL,
  `skills` TEXT NULL,
  `primary_role` ENUM('service_provider', 'reception', 'admin', 'manager') NOT NULL DEFAULT 'service_provider',
  `services_qualified` JSON NULL COMMENT 'JSON array of service IDs',
  `primary_station` VARCHAR(100) NULL,
  `backup_station` VARCHAR(100) NULL,
  `status` ENUM('active', 'inactive', 'suspended', 'terminated') NOT NULL DEFAULT 'active',
  `username` VARCHAR(100) NULL,
  `password` VARCHAR(255) NULL,
  `created_by` INT UNSIGNED NULL,
  `updated_by` INT UNSIGNED NULL,
  `commission_rate` DECIMAL(5,2) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `employee_id` (`employee_id` ASC),
  UNIQUE INDEX `email` (`email` ASC),
  INDEX `idx_salon_id` (`salon_id` ASC),
  INDEX `idx_department` (`department` ASC),
  INDEX `idx_status` (`status` ASC),
  INDEX `idx_employee_id` (`employee_id` ASC),
  INDEX `idx_created_by` (`created_by` ASC),
  INDEX `idx_updated_by` (`updated_by` ASC),
  INDEX `idx_staff_department_status` (`department` ASC, `status` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `customers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NOT NULL,
  `address` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_salon_phone` (`salon_id` ASC, `phone` ASC),
  INDEX `idx_salon_id` (`salon_id` ASC),
  INDEX `idx_phone` (`phone` ASC),
  INDEX `idx_created_at` (`created_at` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEVEL 3: SERVICE CATALOG
-- =====================================================

-- -----------------------------------------------------
-- Table `services`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `services` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `duration_minutes` INT NOT NULL,
  `base_price` DECIMAL(10,2) NOT NULL,
  `description` TEXT NULL,
  `allow_in_combo` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_salon_id` (`salon_id` ASC),
  INDEX `idx_category_id` (`category_id` ASC),
  INDEX `idx_is_active` (`is_active` ASC),
  INDEX `idx_allow_in_combo` (`allow_in_combo` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `service_rooms`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_rooms` (
  `service_id` INT UNSIGNED NOT NULL,
  `room_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`service_id`, `room_id`),
  INDEX `idx_service_id` (`service_id` ASC),
  INDEX `idx_room_id` (`room_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `service_combos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_combos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `image_url` VARCHAR(500) NULL,
  `display_section` ENUM('combo', 'offer', 'both') NOT NULL DEFAULT 'combo',
  `original_price` DECIMAL(10,2) NULL,
  `combo_price` DECIMAL(10,2) NOT NULL,
  `discount_percentage` DECIMAL(5,2) NULL,
  `valid_from` DATE NOT NULL,
  `valid_till` DATE NULL,
  `applicable_days` JSON NULL,
  `show_on_website` BOOLEAN NOT NULL DEFAULT TRUE,
  `show_on_pos` BOOLEAN NOT NULL DEFAULT TRUE,
  `show_on_booking` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_salon_id` (`salon_id` ASC),
  INDEX `idx_is_active` (`is_active` ASC),
  INDEX `idx_validity` (`valid_from` ASC, `valid_till` ASC),
  INDEX `idx_display_section` (`display_section` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `combo_services`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `combo_services` (
  `combo_id` INT UNSIGNED NOT NULL,
  `service_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`combo_id`, `service_id`),
  INDEX `idx_combo_id` (`combo_id` ASC),
  INDEX `idx_service_id` (`service_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEVEL 4: TRANSACTIONS - BOOKINGS
-- =====================================================

-- -----------------------------------------------------
-- Table `bookings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `customer_id` INT UNSIGNED NULL,
  `booking_type` ENUM('walk_in', 'calling') NOT NULL DEFAULT 'walk_in',
  `booking_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `total_duration` INT NOT NULL COMMENT 'Total minutes',
  `status` ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `subtotal_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `tax_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `wallet_applied` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `created_by` INT UNSIGNED NULL,
  `updated_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_salon_id` (`salon_id` ASC),
  INDEX `idx_booking_date` (`booking_date` ASC),
  INDEX `idx_customer_id` (`customer_id` ASC),
  INDEX `idx_booking_type` (`booking_type` ASC),
  INDEX `idx_status` (`status` ASC),
  INDEX `idx_created_at` (`created_at` ASC),
  INDEX `idx_created_by` (`created_by` ASC),
  INDEX `idx_updated_by` (`updated_by` ASC),
  INDEX `idx_bookings_customer_date` (`customer_id` ASC, `booking_date` ASC),
  INDEX `idx_bookings_status_date` (`status` ASC, `booking_date` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `booking_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `booking_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_id` INT UNSIGNED NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `subcategory_id` INT UNSIGNED NOT NULL,
  `service_id` INT UNSIGNED NULL,
  `room_id` INT UNSIGNED NULL,
  `staff_id` INT UNSIGNED NULL,
  `duration_minutes` INT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_booking_id` (`booking_id` ASC),
  INDEX `idx_service_id` (`service_id` ASC),
  INDEX `idx_staff_id` (`staff_id` ASC),
  INDEX `idx_room_id` (`room_id` ASC),
  INDEX `idx_category_id` (`category_id` ASC),
  INDEX `idx_subcategory_id` (`subcategory_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEVEL 5: CALENDAR & SCHEDULING
-- =====================================================

-- -----------------------------------------------------
-- Table `calendar_events`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `booking_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `booking_id` INT UNSIGNED NULL COMMENT 'Link to bookings table if this is a booking event',
  `customer_id` INT UNSIGNED NULL COMMENT 'Link to customers table',
  `service_id` INT UNSIGNED NULL COMMENT 'Link to services table',
  `staff_id` INT UNSIGNED NULL COMMENT 'Link to staff table',
  `room_id` INT UNSIGNED NULL COMMENT 'Link to rooms table',
  `membership_id` INT UNSIGNED NULL COMMENT 'Link to memberships table',
  `event_type` ENUM('booking', 'block', 'leave', 'break', 'training', 'meeting', 'maintenance') NOT NULL DEFAULT 'booking',
  `status` ENUM('pending', 'confirmed', 'in_service', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'confirmed',
  `color_code` VARCHAR(7) NULL DEFAULT '#007bff',
  `all_day` BOOLEAN NOT NULL DEFAULT FALSE,
  `notes` TEXT NULL,
  `reminder_minutes` INT NULL,
  `created_by` INT UNSIGNED NULL COMMENT 'Link to users or staff table',
  `updated_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_salon_date` (`salon_id` ASC, `booking_date` ASC),
  INDEX `idx_booking_id` (`booking_id` ASC),
  INDEX `idx_staff_id` (`staff_id` ASC),
  INDEX `idx_room_id` (`room_id` ASC),
  INDEX `idx_customer_id` (`customer_id` ASC),
  INDEX `idx_status` (`status` ASC),
  INDEX `idx_event_type` (`event_type` ASC),
  INDEX `idx_start_end_time` (`start_time` ASC, `end_time` ASC),
  INDEX `idx_service_id` (`service_id` ASC),
  INDEX `idx_membership_id` (`membership_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `calendar_event_tags`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `calendar_event_tags` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `calendar_event_id` INT UNSIGNED NOT NULL,
  `tag` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_event_tag` (`calendar_event_id` ASC, `tag` ASC),
  INDEX `idx_event_tag` (`calendar_event_id` ASC),
  INDEX `idx_tag` (`tag` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `calendar_notifications`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `calendar_notifications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `calendar_event_id` INT UNSIGNED NOT NULL,
  `notification_type` ENUM('booking_confirmation', 'payment_pending', 'membership_expiry', 'staff_reschedule', 'leave', 'reminder', 'reminder_1h', 'reminder_30m', 'cancellation', 'follow_up') NOT NULL,
  `recipient_type` ENUM('customer', 'staff', 'admin') NOT NULL,
  `recipient_id` INT UNSIGNED NULL COMMENT 'customer_id or staff_id',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('pending', 'sent', 'failed', 'read', 'unread') NOT NULL DEFAULT 'pending',
  `channel` ENUM('in_app', 'email', 'whatsapp', 'sms', 'push') NOT NULL,
  `recipient_email` VARCHAR(255) NULL,
  `recipient_phone` VARCHAR(20) NULL,
  `scheduled_time` DATETIME NULL,
  `sent_at` DATETIME NULL,
  `read_at` DATETIME NULL,
  `metadata` JSON NULL,
  `error_message` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_salon_status` (`salon_id` ASC, `status` ASC),
  INDEX `idx_event_id` (`calendar_event_id` ASC),
  INDEX `idx_recipient` (`recipient_type` ASC, `recipient_id` ASC),
  INDEX `idx_scheduled_time` (`scheduled_time` ASC),
  INDEX `idx_unread` (`read_at` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `calendar_settings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `calendar_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` JSON NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_salon_setting` (`salon_id` ASC, `setting_key` ASC),
  INDEX `idx_salon_id` (`salon_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `staff_availability_exceptions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_availability_exceptions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `staff_id` INT UNSIGNED NOT NULL,
  `exception_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `exception_type` ENUM('leave', 'break', 'training', 'meeting', 'sick', 'vacation') NOT NULL,
  `is_available` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_recurring` BOOLEAN NOT NULL DEFAULT FALSE,
  `recurrence_pattern` ENUM('none', 'daily', 'weekly', 'monthly') NOT NULL DEFAULT 'none',
  `recurrence_end_date` DATE NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_staff_slot` (`staff_id` ASC, `exception_date` ASC, `start_time` ASC),
  INDEX `idx_staff_date` (`staff_id` ASC, `exception_date` ASC),
  INDEX `idx_type` (`exception_type` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `room_availability_exceptions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `room_availability_exceptions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `room_id` INT UNSIGNED NOT NULL,
  `exception_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `exception_type` ENUM('maintenance', 'block', 'unavailable', 'cleaning', 'renovation') NOT NULL,
  `status` ENUM('available', 'maintenance', 'unavailable') NOT NULL DEFAULT 'unavailable',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_room_slot` (`room_id` ASC, `exception_date` ASC, `start_time` ASC),
  INDEX `idx_room_date` (`room_id` ASC, `exception_date` ASC),
  INDEX `idx_status` (`status` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEVEL 6: FINANCIAL - BILLING
-- =====================================================

-- -----------------------------------------------------
-- Table `invoices`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `invoice_number` VARCHAR(50) NOT NULL,
  `customer_id` INT UNSIGNED NULL,
  `membership_id` INT NULL,
  `membership_plan` VARCHAR(255) NULL,
  `invoice_date` DATE NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `tax` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `status` ENUM('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
  `notes` TEXT NULL,
  `booking_ids` JSON NULL,
  `payment_methods` JSON NULL,
  `wallet_applied` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `payment_source` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cash_paid` DECIMAL(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `invoice_number` (`invoice_number` ASC),
  INDEX `idx_salon_id` (`salon_id` ASC),
  INDEX `idx_customer_id` (`customer_id` ASC),
  INDEX `idx_invoice_date` (`invoice_date` ASC),
  INDEX `idx_status` (`status` ASC),
  INDEX `idx_invoices_customer_date` (`customer_id` ASC, `invoice_date` ASC),
  INDEX `idx_invoices_status_date` (`status` ASC, `invoice_date` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `invoice_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id` INT UNSIGNED NOT NULL,
  `service_id` INT UNSIGNED NULL,
  `description` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10,2) NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_invoice_id` (`invoice_id` ASC),
  INDEX `idx_service_id` (`service_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEVEL 7: MEMBERSHIP
-- =====================================================

-- -----------------------------------------------------
-- Table `membership_plans`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `membership_plans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `tier` ENUM('silver', 'gold', 'platinum', 'diamond') NOT NULL DEFAULT 'silver',
  `duration_months` INT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `discount_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `wallet_credits` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `priority_level` ENUM('standard', 'priority', 'vip') NOT NULL DEFAULT 'standard',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_salon_tier` (`salon_id` ASC, `tier` ASC),
  INDEX `idx_active` (`is_active` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `memberships`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `memberships` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` INT UNSIGNED NOT NULL,
  `salon_id` INT UNSIGNED NOT NULL,
  `plan_id` INT UNSIGNED NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('active', 'expired', 'cancelled', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  `wallet_balance` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_customer` (`customer_id` ASC),
  INDEX `idx_plan` (`plan_id` ASC),
  INDEX `idx_status` (`status` ASC),
  INDEX `idx_salon_id` (`salon_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `membership_payments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `membership_payments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `membership_id` INT UNSIGNED NOT NULL,
  `customer_id` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `discount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `payment_method` ENUM('cash', 'upi', 'card') NOT NULL,
  `invoice_number` VARCHAR(50) NOT NULL,
  `transaction_reference` VARCHAR(255) NULL,
  `payment_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_membership` (`membership_id` ASC),
  INDEX `idx_customer` (`customer_id` ASC),
  INDEX `idx_salon` (`salon_id` ASC),
  INDEX `idx_payment_date` (`payment_date` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `membership_plan_allowed_categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `membership_plan_allowed_categories` (
  `plan_id` INT UNSIGNED NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`plan_id`, `category_id`),
  INDEX `idx_category` (`category_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `membership_plan_time_restrictions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `membership_plan_time_restrictions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `plan_id` INT UNSIGNED NOT NULL,
  `day_of_week` TINYINT NOT NULL COMMENT '0=Sunday, 6=Saturday',
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_plan_day` (`plan_id` ASC, `day_of_week` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `guest_passes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `guest_passes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `membership_id` INT UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `status` ENUM('unused', 'used', 'expired') NOT NULL DEFAULT 'unused',
  `issued_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` TIMESTAMP NULL,
  `expires_at` DATE NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `code` (`code` ASC),
  INDEX `idx_membership` (`membership_id` ASC),
  INDEX `idx_status` (`status` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEVEL 8: EXPENSES
-- =====================================================

-- -----------------------------------------------------
-- Table `expenses`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `description` VARCHAR(255) NULL,
  `expense_date` DATE NOT NULL,
  `payment_method` VARCHAR(50) NULL,
  `receipt_url` VARCHAR(500) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_expenses_salon` (`salon_id` ASC),
  INDEX `idx_expenses_category` (`category` ASC),
  INDEX `idx_expenses_date` (`expense_date` ASC),
  INDEX `idx_expenses_category_date` (`category` ASC, `expense_date` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEVEL 9: STAFF MANAGEMENT EXTENSIONS
-- =====================================================

-- -----------------------------------------------------
-- Table `staff_attendance`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_attendance` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` INT UNSIGNED NOT NULL,
  `attendance_date` DATE NOT NULL,
  `expected_shift_start` TIME NULL,
  `expected_shift_end` TIME NULL,
  `shift_type` VARCHAR(50) NULL,
  `clock_in` TIME NULL,
  `clock_out` TIME NULL,
  `total_hours` DECIMAL(5,2) NULL,
  `attendance_status` ENUM('present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'weekly_off') NOT NULL DEFAULT 'present',
  `late_minutes` INT NULL COMMENT 'in minutes',
  `early_exit_minutes` INT NULL COMMENT 'in minutes',
  `break_start` TIME NULL,
  `break_end` TIME NULL,
  `break_duration` INT NULL,
  `lunch_start` TIME NULL,
  `lunch_end` TIME NULL,
  `lunch_duration` INT NULL,
  `notes` TEXT NULL,
  `verified_by` INT UNSIGNED NULL,
  `verification_time` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_staff_date` (`staff_id` ASC, `attendance_date` ASC),
  INDEX `idx_attendance_date` (`attendance_date` ASC),
  INDEX `idx_status` (`attendance_status` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `staff_leaves`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_leaves` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` INT UNSIGNED NOT NULL,
  `leave_type` ENUM('casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid', 'other') NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_days` INT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  `approved_by` INT UNSIGNED NULL,
  `approved_date` DATE NULL,
  `reason` TEXT NULL,
  `contact_during_leave` VARCHAR(255) NULL,
  `handover_to` INT UNSIGNED NULL,
  `medical_certificate_url` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_staff_id` (`staff_id` ASC),
  INDEX `idx_status` (`status` ASC),
  INDEX `idx_date_range` (`start_date` ASC, `end_date` ASC),
  INDEX `idx_handover_to` (`handover_to` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `staff_leave_balance`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_leave_balance` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` INT UNSIGNED NOT NULL,
  `year` INT NOT NULL,
  `casual_leave_total` INT NOT NULL DEFAULT 12,
  `casual_leave_taken` INT NOT NULL DEFAULT 0,
  `casual_leave_remaining` INT NOT NULL DEFAULT 12,
  `sick_leave_total` INT NOT NULL DEFAULT 7,
  `sick_leave_taken` INT NOT NULL DEFAULT 0,
  `sick_leave_remaining` INT NOT NULL DEFAULT 7,
  `annual_leave_total` INT NOT NULL DEFAULT 21,
  `annual_leave_taken` INT NOT NULL DEFAULT 0,
  `annual_leave_remaining` INT NOT NULL DEFAULT 21,
  `special_leave_total` INT NOT NULL DEFAULT 2,
  `special_leave_taken` INT NOT NULL DEFAULT 0,
  `special_leave_remaining` INT NOT NULL DEFAULT 2,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_staff_year` (`staff_id` ASC, `year` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `staff_schedule`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_schedule` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` INT UNSIGNED NOT NULL,
  `week_start_date` DATE NOT NULL,
  `week_end_date` DATE NOT NULL,
  `monday_schedule` JSON NULL,
  `tuesday_schedule` JSON NULL,
  `wednesday_schedule` JSON NULL,
  `thursday_schedule` JSON NULL,
  `friday_schedule` JSON NULL,
  `saturday_schedule` JSON NULL,
  `sunday_schedule` JSON NULL,
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  `published_by` INT UNSIGNED NULL,
  `published_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_staff_id` (`staff_id` ASC),
  INDEX `idx_week` (`week_start_date` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `staff_performance`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_performance` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` INT UNSIGNED NOT NULL,
  `period_type` ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `revenue_target` DECIMAL(10,2) NULL,
  `revenue_achieved` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `service_revenue` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `product_revenue` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `customers_served` INT NOT NULL DEFAULT 0,
  `repeat_customers` INT NOT NULL DEFAULT 0,
  `new_customers` INT NOT NULL DEFAULT 0,
  `average_rating` DECIMAL(3,2) NULL,
  `total_reviews` INT NOT NULL DEFAULT 0,
  `services_completed` INT NOT NULL DEFAULT 0,
  `average_service_time` INT NULL COMMENT 'in minutes',
  `utilization_rate` DECIMAL(5,2) NULL COMMENT 'percentage',
  `efficiency_score` DECIMAL(5,2) NULL,
  `days_worked` INT NOT NULL DEFAULT 0,
  `days_present` INT NOT NULL DEFAULT 0,
  `days_absent` INT NOT NULL DEFAULT 0,
  `days_late` INT NOT NULL DEFAULT 0,
  `total_overtime_hours` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_staff_period` (`staff_id` ASC, `period_type` ASC, `period_start` ASC),
  INDEX `idx_period` (`period_start` ASC, `period_end` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `staff_commission`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_commission` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` INT UNSIGNED NOT NULL,
  `period_month` DATE NOT NULL COMMENT 'First day of month',
  `service_revenue` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `product_revenue` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total_revenue` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `service_commission_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `product_commission_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `performance_bonus_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `overtime_pay` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total_earnings` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `tax_deduction` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `advance_deduction` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `other_deductions` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total_deductions` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `net_payable` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `payment_status` ENUM('pending', 'processing', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
  `payment_date` DATE NULL,
  `payment_method` VARCHAR(50) NULL,
  `transaction_reference` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_staff_month` (`staff_id` ASC, `period_month` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `staff_documents`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_documents` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` INT UNSIGNED NOT NULL,
  `document_type` VARCHAR(100) NOT NULL,
  `document_name` VARCHAR(255) NOT NULL,
  `document_url` VARCHAR(500) NOT NULL,
  `expiry_date` DATE NULL,
  `verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `verified_by` INT UNSIGNED NULL,
  `verified_date` DATE NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_staff_id` (`staff_id` ASC),
  INDEX `idx_document_type` (`document_type` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `staff_training`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_training` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` INT UNSIGNED NOT NULL,
  `training_name` VARCHAR(255) NOT NULL,
  `training_type` VARCHAR(100) NULL,
  `trainer` VARCHAR(255) NULL,
  `training_date` DATE NOT NULL,
  `duration_hours` DECIMAL(5,2) NULL,
  `status` ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  `certificate_url` VARCHAR(500) NULL,
  `skills_acquired` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_staff_id` (`staff_id` ASC),
  INDEX `idx_training_date` (`training_date` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `staff_activity_log`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_activity_log` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` INT UNSIGNED NOT NULL,
  `activity_type` VARCHAR(100) NOT NULL,
  `activity_details` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_staff_id` (`staff_id` ASC),
  INDEX `idx_activity_type` (`activity_type` ASC),
  INDEX `idx_created_at` (`created_at` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `staff_settings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `salon_id` INT UNSIGNED NOT NULL,
  `setting_category` VARCHAR(100) NOT NULL,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` JSON NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_setting` (`salon_id` ASC, `setting_category` ASC, `setting_key` ASC),
  INDEX `idx_salon_id` (`salon_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEVEL 10: BI WAREHOUSE TABLES
-- =====================================================

-- -----------------------------------------------------
-- Dimension: dim_date
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `dim_date` (
  `date_key` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_date` DATE NOT NULL,
  `year` INT NOT NULL,
  `quarter` INT NOT NULL,
  `month` INT NOT NULL,
  `month_name` VARCHAR(20) NOT NULL,
  `week` INT NOT NULL,
  `day_of_week` INT NOT NULL,
  `day_name` VARCHAR(20) NOT NULL,
  `is_weekend` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_holiday` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`date_key`),
  UNIQUE INDEX `idx_full_date` (`full_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Dimension: dim_customer
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `dim_customer` (
  `customer_key` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` INT UNSIGNED NOT NULL,
  `salon_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `email` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `customer_created_date` DATE NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `valid_from` DATE NOT NULL,
  `valid_to` DATE NULL,
  `is_current` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`customer_key`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_salon_id` (`salon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Dimension: dim_staff
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `dim_staff` (
  `staff_key` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` INT UNSIGNED NOT NULL,
  `salon_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NULL,
  `department` VARCHAR(100) NULL,
  `designation` VARCHAR(100) NULL,
  `joining_date` DATE NULL,
  `employment_type` VARCHAR(50) NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `valid_from` DATE NOT NULL,
  `valid_to` DATE NULL,
  `is_current` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`staff_key`),
  INDEX `idx_staff_id` (`staff_id`),
  INDEX `idx_salon_id` (`salon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Dimension: dim_service
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `dim_service` (
  `service_key` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `service_id` INT UNSIGNED NOT NULL,
  `salon_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NULL,
  `category_id` INT UNSIGNED NULL,
  `category_name` VARCHAR(100) NULL,
  `main_category_name` VARCHAR(100) NULL,
  `duration_minutes` INT NULL,
  `base_price` DECIMAL(10,2) NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `valid_from` DATE NOT NULL,
  `valid_to` DATE NULL,
  `is_current` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`service_key`),
  INDEX `idx_service_id` (`service_id`),
  INDEX `idx_salon_id` (`salon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Fact: fact_revenue
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fact_revenue` (
  `revenue_key` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id` INT UNSIGNED NOT NULL,
  `date_key` INT UNSIGNED NOT NULL,
  `salon_id` INT UNSIGNED NOT NULL,
  `customer_key` INT UNSIGNED NULL,
  `staff_key` INT UNSIGNED NULL,
  `service_key` INT UNSIGNED NULL,
  `invoice_date` DATE NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `tax` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(50) NULL,
  `status` VARCHAR(20) NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`revenue_key`),
  INDEX `idx_date_key` (`date_key`),
  INDEX `idx_salon_id` (`salon_id`),
  INDEX `idx_customer_key` (`customer_key`),
  INDEX `idx_staff_key` (`staff_key`),
  INDEX `idx_service_key` (`service_key`),
  INDEX `idx_invoice_id` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Fact: fact_bookings
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fact_bookings` (
  `booking_key` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_id` INT UNSIGNED NOT NULL,
  `date_key` INT UNSIGNED NOT NULL,
  `salon_id` INT UNSIGNED NOT NULL,
  `customer_key` INT UNSIGNED NULL,
  `staff_key` INT UNSIGNED NULL,
  `booking_date` DATE NOT NULL,
  `booking_type` VARCHAR(20) NULL,
  `status` VARCHAR(20) NULL,
  `total_duration` INT NULL,
  `total_amount` DECIMAL(10,2) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`booking_key`),
  INDEX `idx_date_key` (`date_key`),
  INDEX `idx_salon_id` (`salon_id`),
  INDEX `idx_customer_key` (`customer_key`),
  INDEX `idx_staff_key` (`staff_key`),
  INDEX `idx_booking_id` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Fact: fact_expense
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fact_expense` (
  `expense_key` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `expense_id` INT UNSIGNED NOT NULL,
  `date_key` INT UNSIGNED NOT NULL,
  `salon_id` INT UNSIGNED NOT NULL,
  `expense_date` DATE NOT NULL,
  `expense_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `expense_category` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`expense_key`),
  INDEX `idx_date_key` (`date_key`),
  INDEX `idx_salon_id` (`salon_id`),
  INDEX `idx_expense_id` (`expense_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- ETL Control Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bi_etl_control` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `table_name` VARCHAR(100) NOT NULL,
  `last_etl_run` DATETIME NULL,
  `records_processed` INT DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'pending',
  `error_message` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_table_name` (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Materialized Views
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mv_revenue_daily` (
  `salon_id` INT UNSIGNED,
  `date_key` INT UNSIGNED,
  `full_date` DATE,
  `day_name` VARCHAR(20),
  `total_revenue` DECIMAL(12,2),
  `transaction_count` INT,
  `avg_transaction_value` DECIMAL(10,2),
  `cash_pct` DECIMAL(5,2),
  `card_pct` DECIMAL(5,2),
  `online_pct` DECIMAL(5,2),
  `membership_pct` DECIMAL(5,2),
  PRIMARY KEY (`salon_id`, `date_key`),
  INDEX `idx_full_date` (`full_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mv_revenue_by_service` (
  `salon_id` INT UNSIGNED,
  `service_key` INT UNSIGNED,
  `service_name` VARCHAR(255),
  `category` VARCHAR(100),
  `revenue` DECIMAL(12,2),
  `transaction_count` INT,
  `revenue_share_pct` DECIMAL(5,2),
  `avg_service_price` DECIMAL(10,2),
  PRIMARY KEY (`salon_id`, `service_key`),
  INDEX `idx_salon` (`salon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mv_revenue_by_staff` (
  `salon_id` INT UNSIGNED,
  `staff_key` INT UNSIGNED,
  `staff_name` VARCHAR(255),
  `total_revenue` DECIMAL(12,2),
  `booking_count` INT,
  `avg_booking_value` DECIMAL(10,2),
  `revenue_contribution_pct` DECIMAL(5,2),
  PRIMARY KEY (`salon_id`, `staff_key`),
  INDEX `idx_salon` (`salon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mv_customer_metrics` (
  `salon_id` INT UNSIGNED,
  `customer_segment` VARCHAR(50),
  `customer_count` INT,
  `total_revenue` DECIMAL(12,2),
  `avg_customer_value` DECIMAL(10,2),
  `retention_rate` DECIMAL(5,2),
  `churn_rate` DECIMAL(5,2),
  `avg_booking_frequency` DECIMAL(5,2),
  PRIMARY KEY (`salon_id`, `customer_segment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mv_profit_loss` (
  `salon_id` INT UNSIGNED,
  `date_key` INT UNSIGNED,
  `full_date` DATE,
  `total_revenue` DECIMAL(12,2),
  `total_expenses` DECIMAL(12,2),
  `gross_profit` DECIMAL(12,2),
  `profit_margin_pct` DECIMAL(5,2),
  `operating_ratio_pct` DECIMAL(5,2),
  PRIMARY KEY (`salon_id`, `date_key`),
  INDEX `idx_date` (`date_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CREATE VIEWS
-- =====================================================

-- View: booking_details
CREATE OR REPLACE VIEW `booking_details` AS
SELECT 
  b.*,
  c.name AS customer_name,
  c.phone AS customer_phone,
  c.email AS customer_email,
  COUNT(bi.id) AS total_services,
  SUM(bi.duration_minutes) AS total_duration_minutes
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN booking_items bi ON b.id = bi.booking_id
GROUP BY b.id;

-- View: booking_item_details
CREATE OR REPLACE VIEW `booking_item_details` AS
SELECT 
  bi.*,
  s.name AS service_name,
  s.duration_minutes AS service_duration,
  s.base_price AS service_price,
  cat.name AS category_name,
  subcat.name AS subcategory_name,
  r.name AS room_name,
  st.name AS staff_name
FROM booking_items bi
JOIN services s ON bi.service_id = s.id
JOIN categories cat ON bi.category_id = cat.id
JOIN categories subcat ON bi.subcategory_id = subcat.id
LEFT JOIN rooms r ON bi.room_id = r.id
LEFT JOIN staff st ON bi.staff_id = st.id;

-- View: v_calendar_events_full
CREATE OR REPLACE VIEW `v_calendar_events_full` AS
SELECT 
  ce.*,
  c.name AS customer_name,
  c.phone AS customer_phone,
  c.email AS customer_email,
  s.name AS service_name,
  s.duration_minutes AS service_duration,
  s.base_price AS service_price,
  st.name AS staff_name,
  st.department AS staff_department,
  st.designation AS staff_designation,
  st.phone AS staff_phone,
  r.name AS room_name,
  r.room_type AS room_type,
  r.capacity AS room_capacity,
  m.plan_id,
  mp.name AS membership_plan_name,
  mp.tier AS membership_tier,
  m.status AS membership_status,
  m.wallet_balance AS membership_wallet_balance,
  b.booking_type,
  b.total_amount AS booking_amount,
  CONCAT(ce.booking_date, ' ', ce.start_time) AS start_datetime,
  CONCAT(ce.booking_date, ' ', ce.end_time) AS end_datetime,
  CASE
    WHEN ce.event_type = 'booking' THEN CONCAT(IFNULL(c.name, 'Walk-in'), ' - ', IFNULL(s.name, 'Service'))
    WHEN ce.event_type = 'leave' THEN CONCAT('Leave - ', IFNULL(st.name, ''))
    WHEN ce.event_type = 'block' THEN CONCAT('Blocked: ', ce.title)
    ELSE ce.title
  END AS display_title
FROM calendar_events ce
LEFT JOIN customers c ON ce.customer_id = c.id
LEFT JOIN services s ON ce.service_id = s.id
LEFT JOIN staff st ON ce.staff_id = st.id
LEFT JOIN rooms r ON ce.room_id = r.id
LEFT JOIN memberships m ON ce.membership_id = m.id
LEFT JOIN membership_plans mp ON m.plan_id = mp.id
LEFT JOIN bookings b ON ce.booking_id = b.id
WHERE ce.event_type != 'deleted';

-- View: v_today_calendar_events
CREATE OR REPLACE VIEW `v_today_calendar_events` AS
SELECT 
  ce.*,
  c.name AS customer_name,
  s.name AS service_name,
  st.name AS staff_name,
  r.name AS room_name,
  CONCAT(ce.booking_date, ' ', ce.start_time) AS start_datetime,
  CONCAT(ce.booking_date, ' ', ce.end_time) AS end_datetime
FROM calendar_events ce
LEFT JOIN customers c ON ce.customer_id = c.id
LEFT JOIN services s ON ce.service_id = s.id
LEFT JOIN staff st ON ce.staff_id = st.id
LEFT JOIN rooms r ON ce.room_id = r.id
WHERE ce.booking_date = CURDATE()
  AND ce.event_type = 'booking'
  AND ce.status NOT IN ('cancelled', 'no_show')
ORDER BY ce.start_time ASC;

-- View: v_staff_schedule
CREATE OR REPLACE VIEW `v_staff_schedule` AS
SELECT 
  sae.*,
  st.name AS staff_name,
  st.department,
  st.designation,
  CASE
    WHEN sae.exception_type = 'leave' THEN '#e74a3b'
    WHEN sae.exception_type = 'break' THEN '#f6c23e'
    WHEN sae.exception_type = 'training' THEN '#36b9cc'
    WHEN sae.exception_type = 'meeting' THEN '#4e73df'
    WHEN sae.exception_type = 'sick' THEN '#dc3545'
    WHEN sae.exception_type = 'vacation' THEN '#fd7e14'
    ELSE '#6c757d'
  END AS color_code
FROM staff_availability_exceptions sae
JOIN staff st ON sae.staff_id = st.id
WHERE st.status = 'active';

-- View: v_room_exceptions
CREATE OR REPLACE VIEW `v_room_exceptions` AS
SELECT 
  rae.*,
  r.name AS room_name,
  r.room_type,
  r.capacity,
  CASE
    WHEN rae.exception_type = 'maintenance' THEN '#6c757d'
    WHEN rae.exception_type = 'block' THEN '#e74a3b'
    WHEN rae.exception_type = 'unavailable' THEN '#fd7e14'
    WHEN rae.exception_type = 'cleaning' THEN '#17a2b8'
    WHEN rae.exception_type = 'renovation' THEN '#6610f2'
    ELSE '#6c757d'
  END AS color_code
FROM room_availability_exceptions rae
JOIN rooms r ON rae.room_id = r.id
WHERE r.is_active = 1;

-- View: v_bookings_without_calendar_events
CREATE OR REPLACE VIEW `v_bookings_without_calendar_events` AS
SELECT 
  b.*,
  c.name AS customer_name,
  c.phone AS customer_phone,
  c.email AS customer_email,
  GROUP_CONCAT(
    CONCAT(s.name, ' (', bi.duration_minutes, ' min)')
    SEPARATOR ', '
  ) AS services_list,
  COUNT(bi.id) AS total_services,
  SUM(bi.duration_minutes) AS total_duration_minutes,
  CONCAT(b.booking_date, ' ', b.start_time) AS start_datetime,
  CONCAT(
    b.booking_date, ' ',
    IFNULL(b.end_time,
      DATE_ADD(
        CONCAT(b.booking_date, ' ', b.start_time),
        INTERVAL SUM(bi.duration_minutes) MINUTE
      )
    )
  ) AS end_datetime
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN booking_items bi ON b.id = bi.booking_id
LEFT JOIN services s ON bi.service_id = s.id
LEFT JOIN calendar_events ce ON b.id = ce.booking_id
WHERE ce.id IS NULL
  AND b.status IN ('pending', 'confirmed', 'in_progress')
  AND b.booking_date >= CURDATE()
GROUP BY b.id
ORDER BY b.booking_date, b.start_time;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default salon
INSERT INTO `salons` (
  `id`,
  `name`,
  `billing_currency`,
  `billing_tax_rate`,
  `billing_invoice_prefix`,
  `billing_next_invoice_number`,
  `billing_gst_enabled`,
  `billing_gst_type`,
  `billing_gst_rate`,
  `billing_cgst_rate`,
  `billing_sgst_rate`,
  `billing_igst_rate`
) VALUES
(1, 'Salon Management System', 'INR', 18.00, 'INV', 1001, 1, 'intra', 18.00, 9.00, 9.00, 18.00)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Insert default admin user (password: admin123)
INSERT INTO `users` (`id`, `salon_id`, `name`, `email`, `password`, `role`, `is_active`) VALUES
(1, 1, 'Admin User', 'admin@example.com', '$2a$10$XFEKH7ZP9LpV8n5qJQzQjOKlZXyHXzWzV3M4QnNxVpRrSsTtUuVvW', 'owner', 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Insert additional users
INSERT INTO `users` (`salon_id`, `name`, `email`, `password`, `role`, `is_active`) VALUES
(1, 'Salon Owner', 'owner@gmail.com', '$2a$10$C0FaMBCt7f83yc3PqNTumOTTYaZFuO74jsegXhA1dXVQXlK30WtoG', 'owner', 1),
(1, 'Center Manager', 'center@gmail.com', '$2a$10$sRk5fHqfvJoy80RposMr7.1Ivlf.iUxAny.xbhV3Vyy86Yovq1vFK', 'center', 1),
(1, 'Staff Member', 'staff@gmail.com', '$2a$10$YourHashedPasswordHereForStaff', 'staff', 1)
ON DUPLICATE KEY UPDATE `email` = `email`;

-- Insert sample categories
INSERT INTO `categories` (`salon_id`, `name`, `level`, `display_order`, `is_active`) VALUES
(1, 'Hair Services', 'main', 1, 1),
(1, 'Spa Services', 'main', 2, 1),
(1, 'Facial Services', 'main', 3, 1),
(1, 'Nail Services', 'main', 4, 1);

-- Insert sub-categories
INSERT INTO `categories` (`salon_id`, `name`, `parent_id`, `level`, `display_order`, `is_active`) VALUES
(1, 'Hair Cut', 1, 'sub', 1, 1),
(1, 'Hair Color', 1, 'sub', 2, 1),
(1, 'Hair Styling', 1, 'sub', 3, 1),
(1, 'Massage', 2, 'sub', 1, 1),
(1, 'Body Scrub', 2, 'sub', 2, 1),
(1, 'Aroma Therapy', 2, 'sub', 3, 1),
(1, 'Clean Up', 3, 'sub', 1, 1),
(1, 'Anti-aging', 3, 'sub', 2, 1),
(1, 'Manicure', 4, 'sub', 1, 1),
(1, 'Pedicure', 4, 'sub', 2, 1);

-- Insert sample rooms
INSERT INTO `rooms` (`salon_id`, `name`, `room_type`, `capacity`, `shower_available`, `is_active`) VALUES
(1, 'Massage Room 1', 'massage', 1, 1, 1),
(1, 'Massage Room 2', 'massage', 1, 1, 1),
(1, 'Spa Room 1', 'spa', 2, 1, 1),
(1, 'Facial Room 1', 'facial', 1, 0, 1),
(1, 'Hair Station 1', 'hair', 1, 0, 1),
(1, 'Nail Studio 1', 'nails', 2, 0, 1);

-- Insert sample services
INSERT INTO `services` (`salon_id`, `name`, `category_id`, `duration_minutes`, `base_price`, `is_active`) VALUES
(1, 'Men\'s Haircut', 5, 30, 500.00, 1),
(1, 'Women\'s Haircut', 5, 45, 800.00, 1),
(1, 'Hair Coloring - Full', 6, 120, 2500.00, 1),
(1, 'Hair Styling - Blow Dry', 7, 30, 400.00, 1),
(1, 'Swedish Massage', 8, 60, 1200.00, 1),
(1, 'Deep Tissue Massage', 8, 60, 1500.00, 1),
(1, 'Body Scrub', 9, 45, 1000.00, 1),
(1, 'Aroma Therapy', 10, 60, 1300.00, 1),
(1, 'Facial Clean Up', 11, 30, 600.00, 1),
(1, 'Anti-aging Facial', 12, 60, 1800.00, 1),
(1, 'Manicure', 13, 30, 400.00, 1),
(1, 'Pedicure', 14, 45, 600.00, 1);

-- Assign rooms to services
INSERT INTO `service_rooms` (`service_id`, `room_id`) VALUES
(1, 5), (2, 5), (3, 5), (4, 5),
(5, 1), (5, 2), (6, 1), (6, 2),
(7, 3), (8, 3), (9, 4), (10, 4),
(11, 6), (12, 6);

-- Insert sample customers
INSERT INTO `customers` (`salon_id`, `name`, `phone`, `email`, `address`, `created_at`) VALUES
(1, 'John Doe', '9876543210', 'john@example.com', '123 Main St, City', NOW() - INTERVAL 30 DAY),
(1, 'Jane Smith', '9876543211', 'jane@example.com', '456 Oak Ave, City', NOW() - INTERVAL 20 DAY),
(1, 'Robert Johnson', '9876543212', 'robert@example.com', '789 Pine Rd, City', NOW() - INTERVAL 15 DAY),
(1, 'Maria Garcia', '9876543213', 'maria@example.com', '321 Elm St, City', NOW() - INTERVAL 10 DAY),
(1, 'David Lee', '9876543214', 'david@example.com', '654 Maple Dr, City', NOW() - INTERVAL 5 DAY);

-- Insert sample staff
INSERT INTO `staff` (`salon_id`, `employee_id`, `name`, `email`, `phone`, `joining_date`, `department`, `designation`, `primary_role`, `status`) VALUES
(1, 'STF-25001', 'John Doe', 'john.d@salon.com', '9876540011', '2024-01-15', 'Hair Services', 'Senior Stylist', 'service_provider', 'active'),
(1, 'STF-25002', 'Jane Smith', 'jane.s@salon.com', '9876540012', '2024-02-10', 'Spa Services', 'Senior Therapist', 'service_provider', 'active'),
(1, 'STF-25003', 'Mike Wilson', 'mike.w@salon.com', '9876540013', '2024-01-20', 'Reception', 'Receptionist', 'reception', 'active'),
(1, 'STF-25004', 'Sarah Brown', 'sarah.b@salon.com', '9876540014', '2024-03-05', 'Nail Services', 'Nail Technician', 'service_provider', 'active'),
(1, 'STF-25005', 'Tom Harris', 'tom.h@salon.com', '9876540015', '2024-02-25', 'Admin', 'Manager', 'manager', 'active');

-- Insert sample bookings for today
INSERT INTO `bookings` (`salon_id`, `customer_id`, `booking_type`, `booking_date`, `start_time`, `end_time`, `total_duration`, `status`, `subtotal_amount`, `discount_amount`, `tax_amount`, `wallet_applied`, `total_amount`, `created_by`) VALUES
(1, 1, 'walk_in', CURDATE(), '10:00:00', '10:30:00', 30, 'confirmed', 500.00, 0, 25.00, 0, 525.00, 1),
(1, 2, 'calling', CURDATE(), '11:00:00', '12:00:00', 60, 'confirmed', 1200.00, 0, 60.00, 0, 1260.00, 1),
(1, 3, 'walk_in', CURDATE(), '14:00:00', '15:00:00', 60, 'in_progress', 1500.00, 0, 75.00, 0, 1575.00, 1),
(1, 4, 'calling', CURDATE() - INTERVAL 1 DAY, '15:30:00', '16:15:00', 45, 'completed', 800.00, 0, 40.00, 0, 840.00, 1),
(1, 5, 'walk_in', CURDATE() - INTERVAL 1 DAY, '17:00:00', '18:00:00', 60, 'completed', 1300.00, 0, 65.00, 0, 1365.00, 1);

-- Insert booking items
INSERT INTO `booking_items` (`booking_id`, `category_id`, `subcategory_id`, `service_id`, `room_id`, `staff_id`, `duration_minutes`, `price`, `notes`) VALUES
(1, 1, 5, 1, 5, 1, 30, 500.00, NULL),
(2, 2, 8, 5, 1, 2, 60, 1200.00, NULL),
(3, 2, 8, 6, 2, 2, 60, 1500.00, NULL),
(4, 3, 11, 9, 4, 2, 30, 600.00, NULL),
(5, 2, 10, 8, 3, 2, 60, 1300.00, NULL);

-- Insert calendar events for bookings
INSERT INTO `calendar_events` (`salon_id`, `title`, `booking_date`, `start_time`, `end_time`, `booking_id`, `customer_id`, `service_id`, `staff_id`, `room_id`, `event_type`, `status`) VALUES
(1, 'John Doe - Men\'s Haircut', CURDATE(), '10:00:00', '10:30:00', 1, 1, 1, 1, 5, 'booking', 'confirmed'),
(1, 'Jane Smith - Swedish Massage', CURDATE(), '11:00:00', '12:00:00', 2, 2, 5, 2, 1, 'booking', 'confirmed'),
(1, 'Robert Johnson - Deep Tissue Massage', CURDATE(), '14:00:00', '15:00:00', 3, 3, 6, 2, 2, 'booking', 'in_service'),
(1, 'Maria Garcia - Facial Clean Up', CURDATE() - INTERVAL 1 DAY, '15:30:00', '16:15:00', 4, 4, 9, 2, 4, 'booking', 'completed'),
(1, 'David Lee - Aroma Therapy', CURDATE() - INTERVAL 1 DAY, '17:00:00', '18:00:00', 5, 5, 8, 2, 3, 'booking', 'completed');

-- Insert sample invoices
INSERT INTO `invoices` (`salon_id`, `invoice_number`, `customer_id`, `invoice_date`, `subtotal`, `tax`, `discount`, `total`, `status`, `payment_methods`) VALUES
(1, 'INV1001', 4, CURDATE() - INTERVAL 1 DAY, 800.00, 40.00, 0, 840.00, 'paid', JSON_ARRAY('cash')),
(1, 'INV1002', 5, CURDATE() - INTERVAL 1 DAY, 1300.00, 65.00, 0, 1365.00, 'paid', JSON_ARRAY('card')),
(1, 'INV1003', 1, CURDATE() - INTERVAL 2 DAY, 1500.00, 75.00, 0, 1575.00, 'paid', JSON_ARRAY('upi')),
(1, 'INV1004', 2, CURDATE() - INTERVAL 2 DAY, 600.00, 30.00, 0, 630.00, 'pending', JSON_ARRAY('cash'));

-- Insert invoice items
INSERT INTO `invoice_items` (`invoice_id`, `service_id`, `description`, `quantity`, `price`, `total`) VALUES
(1, 9, 'Facial Clean Up', 1, 600.00, 600.00),
(1, NULL, 'Extra Towel', 2, 100.00, 200.00),
(2, 8, 'Aroma Therapy', 1, 1300.00, 1300.00),
(3, 6, 'Deep Tissue Massage', 1, 1500.00, 1500.00),
(4, 11, 'Manicure', 1, 400.00, 400.00);

-- Insert sample membership plans
INSERT INTO `membership_plans` (`salon_id`, `name`, `tier`, `duration_months`, `price`, `discount_percentage`, `wallet_credits`, `priority_level`, `is_active`) VALUES
(1, 'Silver Membership', 'silver', 3, 3000.00, 5, 3000.00, 'standard', 1),
(1, 'Gold Membership', 'gold', 6, 5500.00, 10, 5500.00, 'priority', 1),
(1, 'Platinum Membership', 'platinum', 12, 10000.00, 15, 10000.00, 'vip', 1);

-- Insert sample memberships
INSERT INTO `memberships` (`customer_id`, `salon_id`, `plan_id`, `start_date`, `end_date`, `status`, `wallet_balance`) VALUES
(1, 1, 2, CURDATE() - INTERVAL 30 DAY, CURDATE() + INTERVAL 150 DAY, 'active', 2500.00),
(2, 1, 1, CURDATE() - INTERVAL 45 DAY, CURDATE() + INTERVAL 45 DAY, 'active', 1000.00),
(3, 1, 3, CURDATE() - INTERVAL 60 DAY, CURDATE() + INTERVAL 300 DAY, 'active', 5000.00),
(4, 1, 1, CURDATE() - INTERVAL 90 DAY, CURDATE() - INTERVAL 1 DAY, 'expired', 0.00);

-- Insert sample expenses
INSERT INTO `expenses` (`salon_id`, `category`, `amount`, `description`, `expense_date`, `payment_method`, `notes`) VALUES
(1, 'Rent', 50000.00, 'Monthly rent', CURDATE() - INTERVAL 5 DAY, 'Bank Transfer', 'Office space rent'),
(1, 'Supplies', 15000.00, 'Hair products', CURDATE() - INTERVAL 10 DAY, 'UPI', 'Shampoos and conditioners'),
(1, 'Utilities', 8000.00, 'Electricity bill', CURDATE() - INTERVAL 7 DAY, 'Bank Transfer', 'Monthly electricity'),
(1, 'Salaries', 120000.00, 'Staff salaries', CURDATE() - INTERVAL 2 DAY, 'Bank Transfer', 'Monthly payroll'),
(1, 'Marketing', 5000.00, 'Social media ads', CURDATE() - INTERVAL 15 DAY, 'Card', 'Instagram promotion');

-- Insert staff attendance for today
INSERT INTO `staff_attendance` (`staff_id`, `attendance_date`, `clock_in`, `clock_out`, `total_hours`, `attendance_status`) VALUES
(1, CURDATE(), '09:00:00', '18:00:00', 9.00, 'present'),
(2, CURDATE(), '09:15:00', '18:00:00', 8.75, 'present'),
(3, CURDATE(), '08:45:00', '18:00:00', 9.25, 'present'),
(4, CURDATE(), '10:00:00', '18:00:00', 8.00, 'late'),
(5, CURDATE(), '09:00:00', '18:00:00', 9.00, 'present');

-- Insert staff attendance for yesterday
INSERT INTO `staff_attendance` (`staff_id`, `attendance_date`, `clock_in`, `clock_out`, `total_hours`, `attendance_status`) VALUES
(1, CURDATE() - INTERVAL 1 DAY, '09:00:00', '18:00:00', 9.00, 'present'),
(2, CURDATE() - INTERVAL 1 DAY, '09:00:00', '18:00:00', 9.00, 'present'),
(3, CURDATE() - INTERVAL 1 DAY, '09:30:00', '18:00:00', 8.50, 'late'),
(4, CURDATE() - INTERVAL 1 DAY, '09:00:00', '18:00:00', 9.00, 'present'),
(5, CURDATE() - INTERVAL 1 DAY, NULL, NULL, 0.00, 'absent');

-- Initialize BI ETL control
INSERT INTO `bi_etl_control` (`table_name`, `status`) VALUES
('dim_customer', 'pending'),
('dim_staff', 'pending'),
('dim_service', 'pending'),
('fact_revenue', 'pending'),
('fact_bookings', 'pending'),
('fact_expense', 'pending');

-- Populate dim_date table (last 2 years)
INSERT IGNORE INTO `dim_date` (`date_key`, `full_date`, `year`, `quarter`, `month`, `month_name`, `week`, `day_of_week`, `day_name`, `is_weekend`)
SELECT 
  DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL a.id DAY), '%Y%m%d') as date_key,
  DATE_SUB(CURDATE(), INTERVAL a.id DAY) as full_date,
  YEAR(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) as year,
  QUARTER(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) as quarter,
  MONTH(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) as month,
  DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL a.id DAY), '%M') as month_name,
  WEEK(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) as week,
  DAYOFWEEK(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) as day_of_week,
  DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL a.id DAY), '%W') as day_name,
  IF(DAYOFWEEK(DATE_SUB(CURDATE(), INTERVAL a.id DAY)) IN (1, 7), TRUE, FALSE) as is_weekend
FROM (SELECT @id := @id + 1 as id FROM (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t1, 
      (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t2, 
      (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t3, 
      (SELECT @id := -730) t4) a
WHERE a.id <= 730;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'DATABASE BUILD COMPLETE' as STATUS;
SELECT COUNT(*) as TOTAL_TABLES FROM information_schema.tables 
WHERE table_schema = 'salon_management';