-- =========================
-- QuantumShop Database Init
-- =========================

-- Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    emoji VARCHAR(10)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Cart
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL
);

-- =========================
-- Initial Products
-- =========================

INSERT INTO products
(name, description, price, emoji)
VALUES
('Quantum Sneakers', 'Lightweight everyday sneakers.', 2499, '👟'),
('Quantum T-Shirt', 'Comfortable cotton t-shirt.', 799, '👕'),
('Quantum Backpack', 'Durable backpack for daily use.', 1499, '🎒'),
('Quantum Headphones', 'Wireless headphones for work and travel.', 3999, '🎧')
ON CONFLICT DO NOTHING;
