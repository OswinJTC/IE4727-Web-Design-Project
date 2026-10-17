<?php
require __DIR__ . '/includes/cart.php';

// Order summary: everything comes from the session cart
$summary = cart_summary();

$errors  = [];          // field => message, shown under each field
$payment = 'cash';
$notes   = '';

// Delivery details start from the logged-in user's saved address and phone, and stay editable
$address = '';
$phone   = '';
if (isset($_SESSION['user_id'])) {
    $stmt = db()->prepare('SELECT address, phone FROM users WHERE user_id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    if ($user) {
        $address = (string) $user['address'];
        $phone   = (string) $user['phone'];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'place_order') {
    if (!isset($_SESSION['user_id'])) {
        header('Location: login_register.php');          // an order belongs to a user
        exit;
    }

    $address = trim($_POST['address'] ?? '');
    $phone   = preg_replace('/\s+/', '', $_POST['phone'] ?? '');
    $payment = $_POST['payment'] ?? '';
    $notes   = trim($_POST['notes'] ?? '');

    // These checks are the ones that count; the form's own checks are only a convenience
    if ($address === '' || strlen($address) > 255) {
        $errors['address'] = 'Enter a delivery address (up to 255 characters).';
    }
    if (!preg_match('/^[689]\d{7}$/', $phone)) {
        $errors['phone'] = 'Enter an 8-digit number starting with 6, 8 or 9';
    }
    if (!in_array($payment, ['cash', 'card', 'paynow'], true)) {
        $errors['payment'] = 'Choose a payment method.';
    }
    if (strlen($notes) > 255) {
        $errors['notes'] = 'Notes must be 255 characters or fewer.';
    }
    if (!$summary['lines']) {
        $errors['form'] = 'Your cart is empty.';
    }

    if (!$errors) {
        try {
            // Prices are read from the database again: the session copy may be out of date
            $stmt  = db()->prepare('SELECT price FROM menu_items WHERE item_id = ?');
            $rows  = [];
            $total = 0.0;
            foreach ($summary['lines'] as $line) {
                $stmt->execute([$line['item_id']]);
                $price  = (float) $stmt->fetchColumn();
                $rows[] = ['item_id' => $line['item_id'], 'count' => $line['count'], 'price' => $price];
                $total += $price * $line['count'];
            }

            // The order and its lines are saved together, or not at all
            db()->beginTransaction();
            $stmt = db()->prepare(
                'INSERT INTO orders (user_id, delivery_address, contact_phone, payment_method, notes, total_amount)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $_SESSION['user_id'],
                $address,
                $phone,
                $payment,
                $notes !== '' ? $notes : null,
                number_format($total, 2, '.', ''),
            ]);
            $orderId = (int) db()->lastInsertId();

            $stmt = db()->prepare('INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
            foreach ($rows as $row) {
                $stmt->execute([$orderId, $row['item_id'], $row['count'], number_format($row['price'], 2, '.', '')]);
            }
            db()->commit();

            unset($_SESSION['cart']);                    // the cart is now an order
            header('Location: orders.php?id=' . $orderId);   // Post/Redirect/Get, showing the new order
            exit;
        } catch (PDOException $ex) {
            if (db()->inTransaction()) {
                db()->rollBack();
            }
            error_log('Place order failed: ' . $ex->getMessage());
            $errors['form'] = 'Something went wrong. Please try again.';
        }
    }
}
?>
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
      <nav class="nav"><a href="index.php">Home</a><a href="menu.php">Menu</a><a href="orders.php">My orders</a></nav>
      <a class="cart" href="cart.php"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span><?= $summary['items'] ?></span></a>
      <?php require __DIR__ . '/includes/auth_nav.php'; ?>
    </header>
    <main class="container">
      <div class="page-head"><h1>Checkout</h1><ol class="stepper"><li class="done"><span class="step-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></span>Cart</li><li class="current"><span class="step-dot">2</span>Checkout</li><li class=""><span class="step-dot">3</span>Confirmed</li></ol></div>
      <form class="checkout-layout" action="checkout.php" method="post">
        <input type="hidden" name="action" value="place_order">
        <div class="checkout-forms">
          <section class="panel form-card">
            <h2><span class="mini-icon t-peach"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>Delivery details</h2>
            <div class="field">
              <label for="address">Delivery address</label>
              <textarea id="address" name="address" required<?= isset($errors['address']) ? ' class="bad"' : '' ?>><?= e($address) ?></textarea>
              <p class="error-text" id="address-error" role="alert"><?= e($errors['address'] ?? '') ?></p>
              <p class="hint"><?= isset($_SESSION['user_id']) ? 'Pre-filled from your account. Edit for this order only.' : '<a class="back-link" href="login_register.php">Log in</a> to fill this in from your account.' ?></p>
            </div>
            <div class="field phone-field">
              <label for="phone">Contact phone</label>
              <input id="phone" name="phone" type="tel" value="<?= e($phone) ?>" inputmode="numeric" pattern="[689][0-9]{7}" maxlength="8" required aria-describedby="phone-error"<?= isset($errors['phone']) ? ' class="bad"' : '' ?>>
              <p class="error-text" id="phone-error" role="alert"><?= e($errors['phone'] ?? '') ?></p>
            </div>
          </section>
          <section class="panel form-card">
            <h2><span class="mini-icon t-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg></span>Payment method</h2>
            <div class="pay-grid">
              <label class="pay-option"><input type="radio" name="payment" value="cash"<?= $payment === 'cash' ? ' checked' : '' ?>><span><strong>Cash on delivery</strong><small>Pay the rider in cash</small></span></label>
              <label class="pay-option"><input type="radio" name="payment" value="card"<?= $payment === 'card' ? ' checked' : '' ?>><span><strong>Card on delivery</strong><small>Rider brings a card reader</small></span></label>
              <label class="pay-option"><input type="radio" name="payment" value="paynow"<?= $payment === 'paynow' ? ' checked' : '' ?>><span><strong>PayNow</strong><small>Scan the QR on delivery</small></span></label>
            </div>
            <p class="error-text" role="alert"><?= e($errors['payment'] ?? '') ?></p>
          </section>
          <section class="panel form-card">
            <h2><span class="mini-icon t-peach"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg></span>Notes for the kitchen <small>(optional)</small></h2>
            <textarea id="notes" name="notes" maxlength="255" placeholder="e.g. Less spicy, no bean sprouts" aria-label="Notes for the kitchen"><?= e($notes) ?></textarea>
            <p class="error-text" role="alert"><?= e($errors['notes'] ?? '') ?></p>
            <p class="counter">0 / 255</p>
          </section>
        </div>
        <aside class="order-card summary">
          <h2>Order summary</h2>
          <?php foreach ($summary['lines'] as $line): ?>
          <div class="sum-item"><?php if ($line['image'] !== ''): ?><img class="swatch-lg" src="<?= e($line['image']) ?>" alt=""><?php else: ?><span class="swatch-lg t-peach"></span><?php endif; ?><span><h3><?= e($line['name']) ?></h3><p>Qty <?= (int) $line['count'] ?></p></span><strong>$<?= number_format($line['subtotal'], 2) ?></strong></div>
          <?php endforeach; ?>
          <?php if (!$summary['lines']): ?><p class="fine">Your cart is empty. <a class="back-link" href="menu.php">Browse the menu</a></p><?php endif; ?>
          <div class="order-line muted-line"><span>Items (<?= $summary['items'] ?>)</span><span>$<?= number_format($summary['total'], 2) ?></span></div>
          <div class="order-total"><span>Total</span><strong>$<?= number_format($summary['total'], 2) ?></strong></div>
          <p class="error-text" role="alert"><?= e($errors['form'] ?? '') ?></p>
          <?php if ($summary['lines']): ?><button class="btn" type="submit">Place order</button><?php endif; ?>
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
