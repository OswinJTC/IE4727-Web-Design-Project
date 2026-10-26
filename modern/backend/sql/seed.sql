-- FoodHub dummy data for PostgreSQL (ported from traditional/sql/seed.sql).
-- 20 dishes (5 per category), 6 users and 15 orders. Dish images are public Wikimedia Commons links.
-- Re-running is safe: dishes and users are only inserted if missing, orders and lines use fixed ids with ON CONFLICT DO NOTHING.


-- Mains
INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Hainanese chicken rice', 'Mains', 'Poached chicken, fragrant rice, chilli sauce', 5.50, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Hainanese_chicken_rice_in_Singapore.jpg/960px-Hainanese_chicken_rice_in_Singapore.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Hainanese chicken rice');  -- image license: CC BY-SA 4.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Beef rendang bowl', 'Mains', 'Slow-cooked beef in rich coconut spices, served with rice', 9.80, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Beef_Rendang..JPG/960px-Beef_Rendang..JPG', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Beef rendang bowl');  -- image license: CC0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Curry laksa', 'Mains', 'Spicy coconut broth, prawns, tofu puffs', 7.20, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Curry_Laksa_served_in_Kuala_Lumpur.jpg/960px-Curry_Laksa_served_in_Kuala_Lumpur.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Curry laksa');  -- image license: CC BY-SA 3.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Char kway teow', 'Mains', 'Wok-fried flat rice noodles with prawns, egg and chives', 6.50, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Char_Kway_Teow_%281%29.jpg/960px-Char_Kway_Teow_%281%29.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Char kway teow');  -- image license: CC BY-SA 4.0

-- Sides
INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Crispy fries', 'Sides', 'Golden fries seasoned with sea salt and herbs', 3.50, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Truffle_oil_french_fries_%2833024792848%29.jpg/960px-Truffle_oil_french_fries_%2833024792848%29.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Crispy fries');  -- image license: CC BY-SA 2.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Vegetable spring rolls', 'Sides', 'Crisp rolls with sweet chilli dipping sauce', 4.20, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Golden_Vegetable_Spring_Rolls_Served_with_Dipping_Sauce.jpg/960px-Golden_Vegetable_Spring_Rolls_Served_with_Dipping_Sauce.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Vegetable spring rolls');  -- image license: CC BY-SA 4.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Chicken satay', 'Sides', 'Grilled skewers with peanut sauce and onion', 6.00, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/CHICKEN_SATAY.jpg/960px-CHICKEN_SATAY.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Chicken satay');  -- image license: CC BY-SA 4.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Onion rings', 'Sides', 'Light, crunchy battered onion rings', 3.80, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/Hand-Made_Crispy_Onion_Rings.jpg/960px-Hand-Made_Crispy_Onion_Rings.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Onion rings');  -- image license: CC BY 2.0

-- Drinks
INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Iced lemon tea', 'Drinks', 'Black tea over ice with fresh lemon', 2.20, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Iced_lemon_tea_-_Rawlab_Juice_%26_Tea.jpg/960px-Iced_lemon_tea_-_Rawlab_Juice_%26_Tea.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Iced lemon tea');  -- image license: CC0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Teh tarik', 'Drinks', 'Frothy pulled milk tea', 2.50, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/Teh_tarik_3.jpg/960px-Teh_tarik_3.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Teh tarik');  -- image license: CC BY-SA 3.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Fresh orange juice', 'Drinks', 'Freshly squeezed, no added sugar', 3.50, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Orange_juice_1_edit1.jpg/960px-Orange_juice_1_edit1.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Fresh orange juice');  -- image license: Public domain

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Iced white coffee', 'Drinks', 'Smooth white coffee served over ice', 3.20, 'https://upload.wikimedia.org/wikipedia/commons/f/f1/A_glass_of_Ipoh_iced_white_coffee.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Iced white coffee');  -- image license: CC BY-SA 2.0

-- Desserts
INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Mango sticky rice', 'Desserts', 'Ripe mango, coconut cream', 4.80, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Mango_sticky_rice_served_in_Thailand.jpg/960px-Mango_sticky_rice_served_in_Thailand.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Mango sticky rice');  -- image license: CC BY 4.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Chendol', 'Desserts', 'Shaved ice, pandan jelly, coconut milk and gula melaka', 4.20, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Chendol_in_Malaysia_-_December_2016.jpg/960px-Chendol_in_Malaysia_-_December_2016.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Chendol');  -- image license: CC BY 3.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Chocolate brownie', 'Desserts', 'Rich fudgy brownie squares', 3.90, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Chocolate_brownies_without_table.jpg/960px-Chocolate_brownies_without_table.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Chocolate brownie');  -- image license: CC BY-SA 3.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Blueberry cheesecake', 'Desserts', 'Creamy baked cheesecake with blueberry topping', 5.50, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/New_York_cheesecake_2.jpg/960px-New_York_cheesecake_2.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Blueberry cheesecake');  -- image license: CC BY-SA 4.0

-- More dishes: one extra per category (5 per category in total)

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Nasi lemak', 'Mains', 'Coconut rice with sambal, fried egg, anchovies and peanuts', 6.50, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Nasi_lemak_joh.jpg/960px-Nasi_lemak_joh.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Nasi lemak');  -- image license: CC BY-SA 4.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Popiah', 'Sides', 'Fresh rolls filled with turnip, egg and crisp vegetables', 4.50, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Popiah_cu.JPG/960px-Popiah_cu.JPG', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Popiah');  -- image license: CC BY-SA 3.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Bandung', 'Drinks', 'Rose syrup milk served over ice', 2.80, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Syrup_Bandung_with_Cincau.jpg/960px-Syrup_Bandung_with_Cincau.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bandung');  -- image license: CC BY-SA 2.0

INSERT INTO menu_items (name, category, description, price, image, is_available)
SELECT 'Tiramisu', 'Desserts', 'Coffee-soaked sponge layered with mascarpone cream', 5.80, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/Tiramisu_dessert.jpg/960px-Tiramisu_dessert.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Tiramisu');  -- image license: CC BY-SA 4.0

-- ===== Users =====
-- All seeded accounts use the password: Password123  (local testing only).
-- admin@foodhub.test is the only admin.

INSERT INTO users (full_name, email, phone, address, password_hash, role)
SELECT 'Admin FoodHub', 'admin@foodhub.test', '81234567', '1 Raffles Place, Singapore 048616', '$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@foodhub.test');

INSERT INTO users (full_name, email, phone, address, password_hash, role)
SELECT 'Aisha Lim', 'aisha@example.com', '91234567', 'Blk 123 Ang Mo Kio Ave 3, #05-27, Singapore 560123', '$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'aisha@example.com');

INSERT INTO users (full_name, email, phone, address, password_hash, role)
SELECT 'Daniel Tan', 'daniel@example.com', '98765432', '45 Jurong West St 42, #12-08, Singapore 640045', '$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'daniel@example.com');

INSERT INTO users (full_name, email, phone, address, password_hash, role)
SELECT 'Priya Nair', 'priya@example.com', '87654321', 'Blk 88 Tampines St 82, #03-15, Singapore 520088', '$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'priya@example.com');

INSERT INTO users (full_name, email, phone, address, password_hash, role)
SELECT 'Marcus Wong', 'marcus@example.com', '96543210', '12 Bukit Timah Road, #07-02, Singapore 259761', '$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'marcus@example.com');

INSERT INTO users (full_name, email, phone, address, password_hash, role)
SELECT 'Sofia Rahman', 'sofia@example.com', '81122334', 'Blk 301 Yishun Ring Rd, #10-44, Singapore 760301', '$2y$10$FtGyETZ.YLwahllzVTCEyefW97xZis51CRS.NlLjM6d5lWnGHSyDy', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sofia@example.com');

-- ===== Orders and order lines =====
-- Fixed IDs + ON CONFLICT DO NOTHING make re-running harmless. Prices are copied onto each line (unit_price).
-- Order 14 is Cancelled on purpose: cancelled orders must not count towards best sellers.

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 1, user_id, now() - INTERVAL '30 days', address, phone, 'cash', NULL, 'Delivered', 15.40 FROM users WHERE email = 'aisha@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 1, 1, item_id, 2, 5.50 FROM menu_items WHERE name = 'Hainanese chicken rice'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 2, 1, item_id, 2, 2.20 FROM menu_items WHERE name = 'Iced lemon tea'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 2, user_id, now() - INTERVAL '28 days', address, phone, 'card', 'Less spicy please', 'Delivered', 20.40 FROM users WHERE email = 'daniel@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 3, 2, item_id, 2, 7.20 FROM menu_items WHERE name = 'Curry laksa'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 4, 2, item_id, 1, 3.50 FROM menu_items WHERE name = 'Crispy fries'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 5, 2, item_id, 1, 2.50 FROM menu_items WHERE name = 'Teh tarik'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 3, user_id, now() - INTERVAL '26 days', address, phone, 'paynow', NULL, 'Delivered', 32.70 FROM users WHERE email = 'priya@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 6, 3, item_id, 3, 5.50 FROM menu_items WHERE name = 'Hainanese chicken rice'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 7, 3, item_id, 3, 2.20 FROM menu_items WHERE name = 'Iced lemon tea'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 8, 3, item_id, 2, 4.80 FROM menu_items WHERE name = 'Mango sticky rice'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 4, user_id, now() - INTERVAL '24 days', address, phone, 'cash', NULL, 'Delivered', 32.20 FROM users WHERE email = 'marcus@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 9, 4, item_id, 2, 9.80 FROM menu_items WHERE name = 'Beef rendang bowl'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 10, 4, item_id, 2, 4.20 FROM menu_items WHERE name = 'Vegetable spring rolls'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 11, 4, item_id, 1, 4.20 FROM menu_items WHERE name = 'Chendol'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 5, user_id, now() - INTERVAL '21 days', address, phone, 'card', 'Leave at the door', 'Delivered', 32.40 FROM users WHERE email = 'sofia@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 12, 5, item_id, 2, 5.50 FROM menu_items WHERE name = 'Hainanese chicken rice'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 13, 5, item_id, 2, 7.20 FROM menu_items WHERE name = 'Curry laksa'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 14, 5, item_id, 2, 3.50 FROM menu_items WHERE name = 'Fresh orange juice'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 6, user_id, now() - INTERVAL '18 days', address, phone, 'paynow', NULL, 'Delivered', 29.40 FROM users WHERE email = 'aisha@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 15, 6, item_id, 2, 6.50 FROM menu_items WHERE name = 'Char kway teow'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 16, 6, item_id, 2, 6.00 FROM menu_items WHERE name = 'Chicken satay'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 17, 6, item_id, 2, 2.20 FROM menu_items WHERE name = 'Iced lemon tea'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 7, user_id, now() - INTERVAL '15 days', address, phone, 'cash', NULL, 'Delivered', 40.30 FROM users WHERE email = 'daniel@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 18, 7, item_id, 4, 5.50 FROM menu_items WHERE name = 'Hainanese chicken rice'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 19, 7, item_id, 3, 3.50 FROM menu_items WHERE name = 'Crispy fries'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 20, 7, item_id, 2, 3.90 FROM menu_items WHERE name = 'Chocolate brownie'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 8, user_id, now() - INTERVAL '12 days', address, phone, 'card', NULL, 'Delivered', 33.60 FROM users WHERE email = 'priya@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 21, 8, item_id, 3, 7.20 FROM menu_items WHERE name = 'Curry laksa'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 22, 8, item_id, 2, 2.20 FROM menu_items WHERE name = 'Iced lemon tea'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 23, 8, item_id, 2, 3.80 FROM menu_items WHERE name = 'Onion rings'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 9, user_id, now() - INTERVAL '9 days', address, phone, 'paynow', 'Ring the bell twice', 'Delivered', 29.90 FROM users WHERE email = 'marcus@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 24, 9, item_id, 3, 5.50 FROM menu_items WHERE name = 'Hainanese chicken rice'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 25, 9, item_id, 2, 3.50 FROM menu_items WHERE name = 'Crispy fries'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 26, 9, item_id, 2, 3.20 FROM menu_items WHERE name = 'Iced white coffee'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 10, user_id, now() - INTERVAL '6 days', address, phone, 'cash', NULL, 'Delivered', 53.70 FROM users WHERE email = 'sofia@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 27, 10, item_id, 3, 9.80 FROM menu_items WHERE name = 'Beef rendang bowl'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 28, 10, item_id, 2, 7.20 FROM menu_items WHERE name = 'Curry laksa'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 29, 10, item_id, 2, 2.20 FROM menu_items WHERE name = 'Iced lemon tea'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 30, 10, item_id, 1, 5.50 FROM menu_items WHERE name = 'Blueberry cheesecake'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 11, user_id, now() - INTERVAL '3 days', address, phone, 'card', NULL, 'Out for delivery', 29.90 FROM users WHERE email = 'aisha@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 31, 11, item_id, 3, 5.50 FROM menu_items WHERE name = 'Hainanese chicken rice'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 32, 11, item_id, 2, 4.20 FROM menu_items WHERE name = 'Vegetable spring rolls'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 33, 11, item_id, 2, 2.50 FROM menu_items WHERE name = 'Teh tarik'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 12, user_id, now() - INTERVAL '2 days', address, phone, 'paynow', NULL, 'Preparing', 41.10 FROM users WHERE email = 'daniel@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 34, 12, item_id, 2, 7.20 FROM menu_items WHERE name = 'Curry laksa'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 35, 12, item_id, 3, 3.50 FROM menu_items WHERE name = 'Crispy fries'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 36, 12, item_id, 3, 2.20 FROM menu_items WHERE name = 'Iced lemon tea'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 37, 12, item_id, 2, 4.80 FROM menu_items WHERE name = 'Mango sticky rice'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 13, user_id, now() - INTERVAL '1 days', address, phone, 'cash', 'No chilli', 'Pending', 36.30 FROM users WHERE email = 'priya@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 38, 13, item_id, 2, 6.50 FROM menu_items WHERE name = 'Char kway teow'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 39, 13, item_id, 2, 6.00 FROM menu_items WHERE name = 'Chicken satay'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 40, 13, item_id, 1, 3.50 FROM menu_items WHERE name = 'Fresh orange juice'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 41, 13, item_id, 2, 3.90 FROM menu_items WHERE name = 'Chocolate brownie'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 14, user_id, now() - INTERVAL '10 days', address, phone, 'cash', 'Changed my mind', 'Cancelled', 33.40 FROM users WHERE email = 'marcus@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 42, 14, item_id, 10, 2.50 FROM menu_items WHERE name = 'Teh tarik'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 43, 14, item_id, 2, 4.20 FROM menu_items WHERE name = 'Chendol'
ON CONFLICT DO NOTHING;

INSERT INTO orders (order_id, user_id, order_date, delivery_address, contact_phone, payment_method, notes, status, total_amount)
SELECT 15, user_id, now() - INTERVAL '0 days', address, phone, 'card', NULL, 'Pending', 17.30 FROM users WHERE email = 'sofia@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 44, 15, item_id, 1, 5.50 FROM menu_items WHERE name = 'Hainanese chicken rice'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 45, 15, item_id, 1, 4.80 FROM menu_items WHERE name = 'Mango sticky rice'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 46, 15, item_id, 1, 3.80 FROM menu_items WHERE name = 'Onion rings'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price)
SELECT 47, 15, item_id, 1, 3.20 FROM menu_items WHERE name = 'Iced white coffee'
ON CONFLICT DO NOTHING;

-- Fixed ids were inserted above, so move the id counters past them (the next order gets id 16, not 1)
SELECT setval(pg_get_serial_sequence('orders', 'order_id'), (SELECT MAX(order_id) FROM orders));
SELECT setval(pg_get_serial_sequence('order_items', 'order_item_id'), (SELECT MAX(order_item_id) FROM order_items));
