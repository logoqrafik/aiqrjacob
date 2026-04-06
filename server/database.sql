CREATE DATABASE qrmenu;

\c qrmenu;

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Örnek Veriler (Seed Data)
INSERT INTO categories (name, description) VALUES 
('Ana Yemekler', 'Birbirinden lezzetli ana yemeklerimiz'),
('Tatlılar', 'Yemeğinizi tatlandıracak seçenekler'),
('İçecekler', 'Serinletici ve sıcak içecekler');

INSERT INTO menu_items (category_id, name, description, price, image_url) VALUES 
(1, 'Izgara Antrikot', 'Özel baharatlarla marine edilmiş ızgara antrikot, patates püresi ile', 350.00, 'https://images.unsplash.com/photo-1544025162-83cd15f5bc98?q=80&w=800&auto=format&fit=crop'),
(1, 'Tavuk Şiş', 'Kömür ateşinde pişmiş tavuk şiş, bulgur pilavı ile', 180.00, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop'),
(2, 'San Sebastian Cheesecake', 'Ev yapımı, frambuaz soslu enfes San Sebastian', 120.00, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?q=80&w=800&auto=format&fit=crop'),
(3, 'Ev Yapımı Limonata', 'Taze nane ve limonla hazırlanmış serinletici limonata', 60.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop');
