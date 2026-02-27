CREATE TABLE IF NOT EXISTS salons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'Salon Management System',
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Additional salon information
  gstin VARCHAR(20),
  logo_url TEXT,
  
  -- Billing settings
  billing_currency VARCHAR(3) DEFAULT 'INR',
  billing_tax_rate DECIMAL(5,2) DEFAULT 18.00,
  billing_gst_enabled TINYINT(1) DEFAULT 1,
  billing_gst_type VARCHAR(10) DEFAULT 'intra',
  billing_gst_rate DECIMAL(5,2) DEFAULT 18.00,
  billing_cgst_rate DECIMAL(5,2) DEFAULT 9.00,
  billing_sgst_rate DECIMAL(5,2) DEFAULT 9.00,
  billing_igst_rate DECIMAL(5,2) DEFAULT 18.00,
  billing_invoice_prefix VARCHAR(10) DEFAULT 'INV',
  billing_next_invoice_number INT DEFAULT 1001,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default salon with all settings
INSERT INTO salons (
  id, 
  name, 
  billing_currency, 
  billing_tax_rate,
  currency_symbol
) VALUES (
  1, 
  'Salon Management System', 
  'INR', 
  18.00,
  '₹'
) ON DUPLICATE KEY UPDATE 
  updated_at = CURRENT_TIMESTAMP,
  billing_currency = 'INR',
  currency_symbol = '₹';
