-- FoodHub schema. Import in phpMyAdmin (Import tab), then import seed.sql.
-- Re-running is safe: it creates the database and tables only if missing.

CREATE DATABASE IF NOT EXISTS foodhub;
USE foodhub;

-- Members and admins
CREATE TABLE IF NOT EXISTS users (
  user_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  phone         VARCHAR(20)  NULL,
  address       VARCHAR(255) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- The dishes. Hide with is_available = 0 instead of deleting.
CREATE TABLE IF NOT EXISTS menu_items (
  item_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  category     ENUM('Mains','Sides','Drinks','Desserts') NOT NULL,
  description  TEXT NULL,
  price        DECIMAL(6,2) NOT NULL,
  image        VARCHAR(255) NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id),
  KEY idx_menu_category (category, is_available)
) ENGINE=InnoDB;

-- One row per checkout
CREATE TABLE IF NOT EXISTS orders (
  order_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED NOT NULL,
  order_date       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivery_address VARCHAR(255) NOT NULL,
  contact_phone    VARCHAR(20)  NOT NULL,
  payment_method   ENUM('cash','card','paynow') NOT NULL DEFAULT 'cash',
  notes            VARCHAR(255) NULL,
  status           ENUM('Pending','Preparing','Out for delivery','Delivered','Cancelled')
                   NOT NULL DEFAULT 'Pending',
  total_amount     DECIMAL(8,2) NOT NULL,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  KEY idx_orders_user (user_id),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Lines of each order. unit_price is copied at checkout so later price changes
-- do not alter past orders.
CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id      INT UNSIGNED NOT NULL,
  item_id       INT UNSIGNED NOT NULL,
  quantity      INT UNSIGNED NOT NULL,
  unit_price    DECIMAL(6,2) NOT NULL,
  PRIMARY KEY (order_item_id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_item (item_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders (order_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_item
    FOREIGN KEY (item_id) REFERENCES menu_items (item_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;