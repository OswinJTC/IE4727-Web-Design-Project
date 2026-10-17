<?php
require __DIR__ . '/includes/functions.php';
require __DIR__ . '/includes/db.php';



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
          <a class="category-card" href="menu.php">
            <span class="food-icon t-peach"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14a7 7 0 0 1-14 0Z"/><path d="M8 7v2M14 6v3"/></svg></span>
            <span><h3>Mains</h3><p>Rice, noodles and bowls</p></span>
          </a>
          <a class="category-card" href="menu.php">
            <span class="food-icon t-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 11h10l-1 8H8l-1-8Z"/><path d="M10 11V6M14 11V5"/></svg></span>
            <span><h3>Sides</h3><p>Snacks to share</p></span>
          </a>
          <a class="category-card" href="menu.php">
            <span class="food-icon t-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m8 8 1 12h6l1-12H8Z"/><path d="M10 8h8M14 8l2-4"/></svg></span>
            <span><h3>Drinks</h3><p>Coffee, tea and juices</p></span>
          </a>
          <a class="category-card" href="menu.php">
            <span class="food-icon t-pink"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 13h14l-1 6H6l-1-6Z"/><path d="M8 13a4 4 0 0 1 8 0"/><path d="M12 7V4"/></svg></span>
            <span><h3>Desserts</h3><p>Something sweet</p></span>
          </a>
        </div>
      </section>

      <section>
        <div class="section-head">
          <div>
            <h2>Featured dishes</h2>
            <p>Picked by our chefs this week</p>
          </div>
          <a class="see-all" href="menu.php">See full menu -></a>
        </div>
        <div class="dish-grid">
          <article class="dish-card small">
            <div class="image t-peach"><span class="food-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14a7 7 0 0 1-14 0Z"/><path d="M8 7v2M14 6v3"/></svg></span></div>
            <p>Mains</p>
            <h3>Hainanese chicken rice</h3>
            <p>Poached chicken, fragrant rice, chilli sauce</p>
            <div class="price">$5.50</div>
            <button class="add" type="button">+</button>
          </article>
          <article class="dish-card small">
            <div class="image t-cream"><span class="food-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14a7 7 0 0 1-14 0Z"/><path d="M8 7v2M14 6v3"/></svg></span></div>
            <p>Mains</p>
            <h3>Beef rendang bowl</h3>
            <p>Slow-cooked beef, coconut rice</p>
            <div class="price">$9.80</div>
            <button class="add" type="button">+</button>
          </article>
          <article class="dish-card small">
            <div class="image t-green"><span class="food-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14a7 7 0 0 1-14 0Z"/><path d="M8 7v2M14 6v3"/></svg></span></div>
            <p>Mains</p>
            <h3>Curry laksa</h3>
            <p>Spicy coconut broth, prawns, tofu puffs</p>
            <div class="price">$7.20</div>
            <button class="add" type="button">+</button>
          </article>
          <article class="dish-card small">
            <div class="image t-pink"><span class="food-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 13h14l-1 6H6l-1-6Z"/><path d="M8 13a4 4 0 0 1 8 0"/><path d="M12 7V4"/></svg></span></div>
            <p>Desserts</p>
            <h3>Mango sticky rice</h3>
            <p>Ripe mango, coconut cream</p>
            <div class="price">$4.80</div>
            <button class="add" type="button">+</button>
          </article>
        </div>
      </section>

      <section id="how" class="best-layout">
        <div class="best-panel">
          <h2>Best sellers this week</h2>
          <p>Ranked by quantity ordered</p>
          <div class="rank-grid">
            <div class="rank-item"><span class="rank-no">1</span><span class="swatch t-peach"></span><span><h3>Hainanese chicken rice</h3><p>128 sold</p></span><strong>$5.50</strong></div>
            <div class="rank-item"><span class="rank-no">2</span><span class="swatch t-blue"></span><span><h3>Iced lemon tea</h3><p>96 sold</p></span><strong>$2.20</strong></div>
            <div class="rank-item"><span class="rank-no">3</span><span class="swatch t-green"></span><span><h3>Curry laksa</h3><p>81 sold</p></span><strong>$7.20</strong></div>
            <div class="rank-item"><span class="rank-no">4</span><span class="swatch t-cream"></span><span><h3>Crispy fries</h3><p>64 sold</p></span><strong>$3.50</strong></div>
          </div>
        </div>
        <aside class="steps-panel">
          <h2>How it works</h2>
          <div class="step"><span class="step-no">1</span><span><h3>Pick your dishes</h3><p>Filter by category or search by name.</p></span></div>
          <div class="step"><span class="step-no">2</span><span><h3>Check out</h3><p>Add your address and pay on delivery or PayNow.</p></span></div>
          <div class="step"><span class="step-no">3</span><span><h3>Track it live</h3><p>Status updates by email and in My orders.</p></span></div>
        </aside>
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
