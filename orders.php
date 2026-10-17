<?php require __DIR__ . '/includes/functions.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoodHub | My orders</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="page">
    <header class="topbar">
      <a class="brand" href="index.php"><span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg></span>FoodHub</a>
      <div class="search"><span class="search-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></span><span>Search dishes, e.g. laksa</span></div>
      <nav class="nav"><a href="index.php">Home</a><a href="menu.php">Menu</a><a class="active" href="orders.php">My orders</a><a href="#">Contact</a></nav>
      <a class="cart" href="cart.php"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span>3</span></a>
      <?php require __DIR__ . '/includes/auth_nav.php'; ?>
    </header>
    <main class="container">
      <div class="alert-success">
        <span class="alert-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></span>
        <span><strong>Order #1042 placed</strong><br>A confirmation email is on its way to aisha@example.com.</span>
        <a href="menu.php">Order more</a>
      </div>
      <div class="page-head"><h1>My orders</h1>
        <div class="filter-tabs"><a class="active" href="#">All</a><a href="#">Active</a><a href="#">Completed</a><a href="#">Cancelled</a></div>
      </div>
      <div class="orders-layout">
        <section class="panel orders-table">
          <table>
            <thead><tr><th>Order</th><th>Placed</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              <tr class="selected"><td><a href="#">#1042</a></td><td>8 Oct, 14:52</td><td>3</td><td><strong>$11.60</strong></td><td><span class="status pending">Pending</span></td></tr>
              <tr><td><a href="#">#1038</a></td><td>6 Oct, 19:10</td><td>2</td><td><strong>$15.30</strong></td><td><span class="status preparing">Preparing</span></td></tr>
              <tr><td><a href="#">#1031</a></td><td>3 Oct, 12:25</td><td>4</td><td><strong>$22.40</strong></td><td><span class="status delivery">Out for delivery</span></td></tr>
              <tr><td><a href="#">#1024</a></td><td>28 Sep, 18:40</td><td>2</td><td><strong>$9.70</strong></td><td><span class="status delivered">Delivered</span></td></tr>
              <tr><td><a href="#">#1019</a></td><td>24 Sep, 13:05</td><td>1</td><td><strong>$5.50</strong></td><td><span class="status cancelled">Cancelled</span></td></tr>
            </tbody>
          </table>
        </section>
        <aside class="order-card detail-panel">
          <div class="detail-top"><span>Order details</span><span class="status pending">Pending</span></div>
          <h2>#1042</h2>
          <ol class="timeline">
            <li class="current"><span class="tl-dot"></span><span><strong>Order received</strong><small>8 Oct, 14:52</small></span></li>
            <li class=""><span class="tl-dot"></span><span><strong>Preparing</strong></span></li>
            <li class=""><span class="tl-dot"></span><span><strong>Out for delivery</strong></span></li>
            <li class=""><span class="tl-dot"></span><span><strong>Delivered</strong></span></li>
          </ol>
          <div class="sum-item"><span class="swatch-lg t-green"></span><span><h3>Curry laksa &times; 1</h3></span><strong>$7.20</strong></div>
          <div class="sum-item"><span class="swatch-lg t-blue"></span><span><h3>Iced lemon tea &times; 2</h3></span><strong>$4.40</strong></div>
          <div class="order-total"><span>Total</span><strong>$11.60</strong></div>
          <div class="note-box block"><p><span>Deliver to</span> Blk 123 Tampines St 11, #05-67</p><p><span>Phone</span> 9123 4567 &middot; <span>Payment</span> Cash on delivery</p></div>
          <button type="button" class="btn-outline-danger">Cancel order</button>
          <p class="fine">Orders can be cancelled until the kitchen starts preparing.</p>
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
