<?php
require __DIR__ . '/includes/functions.php';
require __DIR__ . '/includes/db.php';

// Top 4 most ordered dishes (cancelled orders do not count). Dishes never ordered
// sort last, so the section still fills up on a fresh database.
$items = db()->query(
    "SELECT m.item_id, m.name, m.category, m.description, m.price, m.image, COALESCE(s.sold, 0) AS sold
     FROM menu_items m
     LEFT JOIN (
         SELECT oi.item_id, SUM(oi.quantity) AS sold
         FROM order_items oi
         JOIN orders o ON o.order_id = oi.order_id
         WHERE o.status <> 'Cancelled'
         GROUP BY oi.item_id
     ) s ON s.item_id = m.item_id
     WHERE m.is_available = 1
     ORDER BY sold DESC, m.name
     LIMIT 4"
)->fetchAll();
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoodHub | Home</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="page">
    <header class="topbar">
      <a class="brand" href="index.php">
        <span class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg>
        </span>
        FoodHub
      </a>
      <div class="search">
        <span class="search-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></span>
        <span>Search dishes, e.g. laksa</span>
      </div>
      <nav class="nav">
        <a class="active" href="index.php">Home</a>
        <a href="menu.php">Menu</a>
        <a href="#">Contact</a>
      </nav>
      <?php require __DIR__ . '/includes/auth_nav.php'; ?>
    </header>

    <main class="container">
      <section class="hero">
        <div class="hero-content">
          <span class="pill">Cooked to order, every order</span>
          <h1>Hot meals from our kitchen, straight to your door.</h1>
          <p>Browse the menu, build your cart and follow your order from the kitchen to your doorstep.</p>
          <div class="hero-actions">
            <a class="btn" href="menu.php">Browse the menu <span>-></span></a>
          </div>
        </div>
      </section>

      <section>
        <div class="section-head">
          <div>
            <h2>Shop by category</h2>
          </div>
        </div>
        <div class="category-grid">
          <a class="category-card" href="menu.php?category=Mains">
            <span class="food-icon t-peach"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14a7 7 0 0 1-14 0Z"/><path d="M8 7v2M14 6v3"/></svg></span>
            <span><h3>Mains</h3><p>Rice, noodles and bowls</p></span>
          </a>
          <a class="category-card" href="menu.php?category=Sides">
            <span class="food-icon t-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 11h10l-1 8H8l-1-8Z"/><path d="M10 11V6M14 11V5"/></svg></span>
            <span><h3>Sides</h3><p>Snacks to share</p></span>
          </a>
          <a class="category-card" href="menu.php?category=Drinks">
            <span class="food-icon t-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m8 8 1 12h6l1-12H8Z"/><path d="M10 8h8M14 8l2-4"/></svg></span>
            <span><h3>Drinks</h3><p>Coffee, tea and juices</p></span>
          </a>
          <a class="category-card" href="menu.php?category=Desserts">
            <span class="food-icon t-pink"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 13h14l-1 6H6l-1-6Z"/><path d="M8 13a4 4 0 0 1 8 0"/><path d="M12 7V4"/></svg></span>
            <span><h3>Desserts</h3><p>Something sweet</p></span>
          </a>
        </div>
      </section>

      <section>
        <div class="section-head">
          <div>
            <h2>Best Selling Dishes</h2>
            <p>Our favourite orders of all time</p>
          </div>
          <a class="see-all" href="menu.php">See full menu -></a>
        </div>
        <div class="dish-grid">
          <?php foreach ($items as $item) { ?>
          <article class="dish-card small">
            <div class="image"><img src="<?= e($item['image']) ?>" alt="<?= e($item['name']) ?>" loading="lazy"></div>
            <p class="category"><?= e($item['category']) ?></p>
            <h3><a href="item.php?id=<?= (int) $item['item_id'] ?>"><?= e($item['name']) ?></a></h3>
            <p><?= e($item['description']) ?></p>
            <div class="price">$<?= number_format((float) $item['price'], 2) ?></div>
            <button class="add" type="button">+</button>
          </article>
          <?php }; ?>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="footer-main">
        <div>
          <div class="brand"><span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg></span>FoodHub</div>
          <p>Freshly cooked meals from our kitchen to<br>your door.</p>
        </div>
        <div><h3>Explore</h3><p><a href="menu.php">Menu</a><br><a href="orders.php">My orders</a><br><a href="#">Contact</a></p></div>
        <div><h3>Visit us</h3><p>[Restaurant address]</p><p>Daily, [opening hours]</p></div>
      </div>
      <div class="footer-bottom"><p>&copy; 2026 FoodHub</p></div>
    </footer>
  </div>
</body>
</html>
