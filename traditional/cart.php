<?php
require __DIR__ . '/includes/cart.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login_register.php');              // the cart is for logged-in members only
    exit;
}

// ?product_id=ID&action=add|decrease|remove changes the session cart, then comes back here
cart_handle_request('cart.php');

$summary = cart_summary();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoodHub | Your cart</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="page">
    <header class="topbar">
      <a class="brand" href="index.php"><span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg></span>FoodHub</a>
      <?php require __DIR__ . '/includes/search_bar.php'; ?>
      <nav class="nav"><a href="index.php">Home</a><a href="menu.php">Menu</a><a href="orders.php">My orders</a></nav>
      <a class="cart" href="cart.php"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span><?= $summary['items'] ?></span></a>
      <?php require __DIR__ . '/includes/auth_nav.php'; ?>
    </header>
    <main class="container">
      <div class="page-head"><h1>Your cart</h1><ol class="stepper"><li class="current"><span class="step-dot">1</span>Cart</li><li class=""><span class="step-dot">2</span>Checkout</li><li class=""><span class="step-dot">3</span>Confirmed</li></ol></div>
      <div class="cart-layout">
        <section class="cart-table panel">
          <div class="cart-row cart-head"><span>Dish</span><span>Price</span><span>Quantity</span><span>Subtotal</span><span></span></div>
          <?php foreach ($summary['lines'] as $line): ?>
          <?php $pid = (int) $line['item_id']; ?>
          <div class="cart-row">
            <div class="cart-dish"><?php if ($line['image'] !== ''): ?><img class="swatch-lg" src="<?= e($line['image']) ?>" alt=""><?php else: ?><span class="swatch-lg t-peach"></span><?php endif; ?><span><h3><?= e($line['name']) ?></h3><p><?= e($line['category']) ?></p></span></div>
            <div class="cart-price">$<?= number_format($line['price'], 2) ?></div>
            <div class="qty qty-sm"><a href="cart.php?product_id=<?= $pid ?>&amp;action=decrease" aria-label="Decrease quantity">&minus;</a><span><?= (int) $line['count'] ?></span><a href="cart.php?product_id=<?= $pid ?>&amp;action=add" aria-label="Increase quantity">+</a></div>
            <div class="cart-sub">$<?= number_format($line['subtotal'], 2) ?></div>
            <a class="icon-btn" href="cart.php?product_id=<?= $pid ?>&amp;action=remove" aria-label="Remove <?= e($line['name']) ?>"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></a>
          </div>
          <?php endforeach; ?>
          <?php if (!$summary['lines']): ?>
          <div class="cart-row"><span>Your cart is empty. <a class="back-link" href="menu.php">Browse the menu</a></span></div>
          <?php endif; ?>
          <div class="cart-foot"><a class="back-link" href="menu.php">&larr; Continue browsing</a><span>Quantities between 1 and 20 per dish</span></div>
        </section>
        <aside class="order-card summary">
          <h2>Order summary</h2>
          <div class="order-line muted-line"><span>Items (<?= $summary['items'] ?>)</span><span>$<?= number_format($summary['total'], 2) ?></span></div>
          <div class="order-total"><span>Total</span><strong>$<?= number_format($summary['total'], 2) ?></strong></div>
          <?php if ($summary['lines']): ?><a class="btn" href="checkout.php">Proceed to checkout &rarr;</a><?php endif; ?>
          <p class="note-box"><span class="note-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>Prices are confirmed again at checkout.</p>
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
