<?php require __DIR__ . '/includes/functions.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoodHub | Menu</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="page">
    <header class="topbar">
      <a class="brand" href="index.php"><span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg></span>FoodHub</a>
      <div class="search"><span class="search-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></span><span>Search dishes, e.g. laksa</span></div>
      <nav class="nav"><a href="index.php">Home</a><a class="active" href="menu.php">Menu</a><a href="orders.php">My orders</a><a href="#">Contact</a></nav>
      <a class="cart" href="cart.php"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span>3</span></a>
      <?php require __DIR__ . '/includes/auth_nav.php'; ?>
    </header>

    <main class="container">
      <div class="breadcrumb"><a href="index.php">Home</a> / Menu</div>
      <div class="menu-header">
        <div class="menu-title">
          <h1>Our menu</h1>
          <p>16 dishes, cooked fresh when you order</p>
        </div>
        <label class="sorter">Sort by
          <select><option>Most popular</option></select>
        </label>
      </div>
      <nav class="tabs"><a class="active" href="#">All&nbsp; 16</a><a href="#">Mains&nbsp; 4</a><a href="#">Sides&nbsp; 4</a><a href="#">Drinks&nbsp; 4</a><a href="#">Desserts&nbsp; 4</a></nav>
      <div class="menu-layout">
        <section class="dish-grid">
          <article class="dish-card">
            <span class="tag">Mains</span>
            <a href="item.php"><div class="image t-peach"><span class="food-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14a7 7 0 0 1-14 0Z"/><path d="M8 7v2M14 6v3"/></svg></span></div></a>
            <h3>Hainanese chicken rice</h3><p>Poached chicken, fragrant rice</p><div class="price">$5.50</div><button class="add" type="button">+</button>
          </article>
          <article class="dish-card">
            <span class="tag">Mains</span>
            <a href="item.php"><div class="image t-cream"><span class="food-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14a7 7 0 0 1-14 0Z"/><path d="M8 7v2M14 6v3"/></svg></span></div></a>
            <h3>Beef rendang bowl</h3><p>Slow-cooked beef, coconut rice</p><div class="price">$9.80</div><button class="add" type="button">+</button>
          </article>
          <article class="dish-card">
            <span class="tag">Mains</span>
            <a href="item.php"><div class="image t-green"><span class="food-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14a7 7 0 0 1-14 0Z"/><path d="M8 7v2M14 6v3"/></svg></span></div></a>
            <h3>Curry laksa</h3><p>Coconut broth, prawns, tofu puffs</p><div class="price">$7.20</div><button class="add" type="button">+</button>
          </article>
          <article class="dish-card">
            <span class="tag">Sides</span>
            <div class="image t-peach"><span class="food-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 11h10l-1 8H8l-1-8Z"/><path d="M10 11V6M14 11V5"/></svg></span></div>
            <h3>Crispy fries</h3><p>Sea salt, house dip</p><div class="price">$3.50</div><button class="add" type="button">+</button>
          </article>
          <article class="dish-card">
            <span class="tag">Sides</span>
            <div class="image t-cream"><span class="food-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 11h10l-1 8H8l-1-8Z"/><path d="M10 11V6M14 11V5"/></svg></span></div>
            <h3>Vegetable spring rolls</h3><p>Four pieces, sweet chilli</p><div class="price">$4.20</div><button class="add" type="button">+</button>
          </article>
          <article class="dish-card">
            <span class="tag">Drinks</span>
            <div class="image t-blue"><span class="food-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m8 8 1 12h6l1-12H8Z"/><path d="M10 8h8M14 8l2-4"/></svg></span></div>
            <h3>Iced lemon tea</h3><p>Brewed fresh daily</p><div class="price">$2.20</div><button class="add" type="button">+</button>
          </article>
        </section>
        <aside class="order-card">
          <div class="order-head"><h2>Your order</h2><span>3 items</span></div>
          <div class="order-line"><span>1 x Curry laksa</span><span>$7.20</span></div>
          <div class="order-line"><span>2 x Iced lemon tea</span><span>$4.40</span></div>
          <div class="order-total"><span>Total</span><strong>$11.60</strong></div>
          <a class="btn" href="#">View cart</a>
          <p>Cart is kept in your session until you check out.</p>
        </aside>
      </div>
    </main>

    <footer class="footer">
      <div class="footer-main">
        <div><div class="brand"><span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg></span>FoodHub</div><p>Freshly cooked meals from our kitchen to<br>your door.</p></div>
        <div><h3>Explore</h3><p><a href="menu.php">Menu</a><br><a href="orders.php">My orders</a><br><a href="#">Contact</a></p></div>
        <div><h3>Visit us</h3><p>[Restaurant address]</p><p>Daily, [opening hours]</p></div>
      </div>
      <div class="footer-bottom"><p>&copy; 2026 FoodHub</p></div>
    </footer>
  </div>
</body>
</html>
