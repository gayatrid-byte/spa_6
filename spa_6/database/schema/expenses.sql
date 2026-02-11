-- ===================================
-- Expenses Table
-- ===================================

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,

  salon_id INT NOT NULL,

  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,

  description TEXT DEFAULT NULL,
  expense_date DATE NOT NULL,

  payment_method VARCHAR(50) DEFAULT NULL,
  receipt_url VARCHAR(255) DEFAULT NULL,
  notes TEXT DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes for performance
  INDEX idx_expenses_salon (salon_id),
  INDEX idx_expenses_category (category),
  INDEX idx_expenses_date (expense_date)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
