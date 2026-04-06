-- Create tables for the QR Menu system

-- 1. Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    items JSONB NOT NULL, -- using JSONB which is more efficient in PostgreSQL than plain JSON
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Add some index for faster lookups
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Insert Sample Data for testing
INSERT INTO products (name, description, price, image_url, category) VALUES 
('Grilled Salmon', 'Fresh Norwegian salmon with asparagus', 42.00, 'https://images.unsplash.com/photo-1485921325833-c519f76c4927', 'Main Course'),
('Beef Steak', 'Premium beef steak with mashed potatoes', 55.00, 'https://images.unsplash.com/photo-1544025162-83cd15f5bc98', 'Main Course'),
('San Sebastian Cheesecake', 'Delicious creamy cheesecake', 12.00, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43', 'Dessert');
