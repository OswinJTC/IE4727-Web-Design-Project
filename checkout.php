<?php require __DIR__ . '/includes/functions.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoodHub | Checkout</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="page">
    <header class="topbar">
      <a class="brand" href="index.php"><span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg></span>FoodHub</a>
      <div class="search"><span class="search-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></span><span>Search dishes, e.g. laksa</span></div>
      <nav class="nav"><a href="index.php">Home</a><a href="menu.php">Menu</a><a href="orders.php">My orders</a><a href="#">Contact</a></nav>
      <a class="cart" href="cart.php"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span>3</span></a>
      <?php require __DIR__ . '/includes/auth_nav.php'; ?>
    </header>
    <main class="container">
      <div class="page-head"><h1>Checkout</h1><ol class="stepper"><li class="done"><span class="step-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></span>Cart</li><li class="current"><span class="step-dot">2</span>Checkout</li><li class=""><span class="step-dot">3</span>Confirmed</li></ol></div>
      <form class="checkout-layout" action="orders.php" method="get">
        <div class="checkout-forms">
          <section class="panel form-card">
            <h2><span class="mini-icon t-peach"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>Delivery details</h2>
            <div class="field">
              <label for="address">Delivery address</label>
              <textarea id="address" name="address" required>Blk 123 Tampines Street 11, #05-67, Singapore 521123</textarea>
              <p class="hint">Pre-filled from your account. Edit for this order only.</p>
            </div>
            <div class="field phone-field">
              <label for="phone">Contact phone</label>
              <input id="phone" name="phone" type="tel" class="error" value="1234" inputmode="numeric" pattern="[689][0-9]{7}" maxlength="8" required aria-describedby="phone-error">
              <p class="error-text" id="phone-error"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16v1"/></svg>Enter an 8-digit number starting with 6, 8 or 9</p>
            </div>
          </section>
          <section class="panel form-card">
            <h2><span class="mini-icon t-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg></span>Payment method</h2>
            <div class="pay-grid">
              <label class="pay-option"><input type="radio" name="payment" value="cash" checked><span><strong>Cash on delivery</strong><small>Pay the rider in cash</small></span></label>
              <label class="pay-option"><input type="radio" name="payment" value="card"><span><strong>Card on delivery</strong><small>Rider brings a card reader</small></span></label>
              <label class="pay-option"><input type="radio" name="payment" value="paynow"><span><strong>PayNow</strong><small>Scan the QR on delivery</small></span></label>
            </div>
          </section>
          <section class="panel form-card">
            <h2><span class="mini-icon t-peach"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg></span>Notes for the kitchen <small>(optional)</small></h2>
            <textarea id="notes" name="notes" maxlength="255" placeholder="e.g. Less spicy, no bean sprouts" aria-label="Notes for the kitchen"></textarea>
            <p class="counter">0 / 255</p>
          </section>
        </div>
        <aside class="order-card summary">
          <h2>Order summary</h2>
          <div class="sum-item"><span class="swatch-lg t-green"></span><span><h3>Curry laksa</h3><p>Qty 1</p></span><strong>$7.20</strong></div>
          <div class="sum-item"><span class="swatch-lg t-blue"></span><span><h3>Iced lemon tea</h3><p>Qty 2</p></span><strong>$4.40</strong></div>
          <div class="order-line muted-line"><span>Items (3)</span><span>$11.60</span></div>
          <div class="order-total"><span>Total</span><strong>$11.60</strong></div>
          <button class="btn" type="submit">Place order</button>
          <a class="back-link center" href="cart.php">Back to cart</a>
          <p class="fine">You'll get a confirmation email once the order is placed.</p>
        </aside>
      </form>
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
