-- Memberships Schema

DROP TABLE IF EXISTS membership_plan_time_restrictions;
DROP TABLE IF EXISTS membership_plan_allowed_categories;
DROP TABLE IF EXISTS guest_passes;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS membership_plans;

-- 1. Membership Plans
CREATE TABLE IF NOT EXISTS membership_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  tier ENUM('silver', 'gold', 'platinum', 'diamond') NOT NULL DEFAULT 'silver',
  duration_months INT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  wallet_credits DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  priority_level ENUM('standard','priority','vip') NOT NULL DEFAULT 'standard',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salon_tier (salon_id, tier),
  INDEX idx_active (is_active),
  CONSTRAINT fk_membership_plans_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 2. Memberships (assignment to users)
CREATE TABLE IF NOT EXISTS memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  salon_id INT NOT NULL,
  plan_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('active','expired','cancelled','suspended','pending') NOT NULL DEFAULT 'active',
  wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer (customer_id),
  INDEX idx_plan (plan_id),
  INDEX idx_status (status),
  CONSTRAINT fk_memberships_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_memberships_plan FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_memberships_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Guest Passes issued under a membership
CREATE TABLE IF NOT EXISTS guest_passes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  membership_id INT NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('unused','used','expired') NOT NULL DEFAULT 'unused',
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME NULL,
  expires_at DATETIME NULL,
  INDEX idx_membership (membership_id),
  INDEX idx_status (status),
  CONSTRAINT fk_guest_passes_membership FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Category Access Rules (allowed categories for plan)
CREATE TABLE IF NOT EXISTS membership_plan_allowed_categories (
  plan_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (plan_id, category_id),
  INDEX idx_category (category_id),
  CONSTRAINT fk_allowed_categories_plan FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_allowed_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Time Restrictions (plan usable at certain times)
CREATE TABLE IF NOT EXISTS membership_plan_time_restrictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL,
  day_of_week TINYINT NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CONSTRAINT fk_time_restrictions_plan FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_plan_day (plan_id, day_of_week)
);

-- Seed example plans (optional)
INSERT INTO membership_plans (salon_id, name, description, tier, duration_months, price, discount_percentage, wallet_credits, priority_level, is_active)
VALUES
(1, 'Silver 3-Month', 'Entry-level membership', 'silver', 3, 99.00, 5.00, 20.00, 'standard', TRUE),
(1, 'Gold 6-Month', 'Mid-tier with extra perks', 'gold', 6, 199.00, 10.00, 50.00, 'priority', TRUE),
(1, 'Platinum 12-Month', 'High-tier membership', 'platinum', 12, 349.00, 15.00, 100.00, 'vip', TRUE);

CREATE TABLE IF NOT EXISTS membership_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    salon_id INT NOT NULL,
    membership_id INT NOT NULL,
    customer_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0.00,
    payment_method ENUM('cash','upi','card') NOT NULL,
    invoice_number VARCHAR(100),
    transaction_reference VARCHAR(100),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_membership (membership_id),
    INDEX idx_customer (customer_id),
    INDEX idx_salon (salon_id),
    INDEX idx_payment_date (payment_date),
    CONSTRAINT fk_mp_membership FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE,
    CONSTRAINT fk_mp_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_mp_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
);
