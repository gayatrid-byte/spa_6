USE k;

-- 1️⃣ Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_salon_id (salon_id),
    INDEX idx_phone (phone),
    INDEX idx_created_at (created_at),

    -- Unique constraint: phone should be unique within a salon
    UNIQUE KEY unique_salon_phone (salon_id, phone)
);

-- 2️⃣ Insert sample customers
INSERT INTO customers (salon_id, name, email, phone, address, notes) VALUES
(1, 'John Doe', 'john@example.com', '+1234567890', '123 Main St, City', 'Regular customer, prefers morning appointments'),
(1, 'Jane Smith', 'jane@example.com', '+0987654321', '456 Oak Ave, Town', 'Allergic to certain hair products'),
(1, 'Walk-in Customer', NULL, '+1122334455', NULL, 'Walk-in customer'),
(2, 'Bob Johnson', 'bob@example.com', '+5566778899', '789 Pine Rd, Village', 'Corporate client'),
(2, 'Alice Brown', 'alice@example.com', '+6677889900', '321 Elm St, City', 'VIP customer');

-- 3️⃣ Check data
SELECT * FROM customers;
