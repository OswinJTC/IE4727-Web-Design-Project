<?php
require __DIR__ . '/includes/cart.php';
require __DIR__ . '/includes/mailer.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login_register.php');              // orders belong to a logged-in user
    exit;
}

$checkoutNotice = $_SESSION['checkout_notice'] ?? null;
unset($_SESSION['checkout_notice']);
$orderNotice = $_SESSION['order_notice'] ?? '';
unset($_SESSION['order_notice']);

// Cancel a pending order. The WHERE clause is the whole rule: it must be this user's order
// and still Pending, so other people's orders and orders already being prepared are untouched.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'cancel_order') {
    $cancelId = filter_var($_POST['order_id'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($cancelId !== false) {
        try {
            $stmt = db()->prepare('SELECT email FROM users WHERE user_id = ?');
            $stmt->execute([$_SESSION['user_id']]);
            $email = $stmt->get_result()->fetch_assoc()['email'] ?? '';
            $stmt = db()->prepare("UPDATE orders SET status = 'Cancelled' WHERE order_id = ? AND user_id = ? AND status = 'Pending'");
            $stmt->execute([$cancelId, $_SESSION['user_id']]);
            if ($stmt->affected_rows === 1) {
                // Autocommit has saved the cancellation; SMTP failure must never undo it.
                try {
                    $sent = email_order_status($email, $cancelId, 'Cancelled');
                } catch (Throwable $ex) {
                    $sent = false;
                    error_log('FoodHub: cancellation email failed for order #' . $cancelId . '.');
                }
                $_SESSION['order_notice'] = 'Order #' . $cancelId . ' cancelled. '
                    . ($sent ? 'Your cancellation email is on its way.' : "We couldn't send the cancellation email. Your order is cancelled.");
            } else {
                $_SESSION['order_notice'] = 'This order can no longer be cancelled.';
            }
        } catch (mysqli_sql_exception $ex) {
            error_log('FoodHub: order cancellation failed.');
            $_SESSION['order_notice'] = 'We could not cancel your order. Please try again.';
        }
        header('Location: orders.php?id=' . $cancelId);   // Post/Redirect/Get, showing the order's new status
        exit;
    }
}

// All of this user's orders, newest first, with how many items each has
$stmt = db()->prepare(
    'SELECT o.*, (SELECT SUM(quantity) FROM order_items WHERE order_id = o.order_id) AS item_count
     FROM orders o
     WHERE o.user_id = ?
     ORDER BY o.order_date DESC, o.order_id DESC'
);
$stmt->execute([$_SESSION['user_id']]);
$orders    = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$hasOrders = (bool) $orders;                             // before filtering, to tell "no orders" from "none in this tab"

// ?filter=all|active|completed|cancelled narrows the list to those statuses
$tabs   = ['all' => 'All', 'active' => 'Active', 'completed' => 'Completed', 'cancelled' => 'Cancelled'];
$groups = [
    'active'    => ['Pending', 'Preparing', 'Out for delivery'],
    'completed' => ['Delivered'],
    'cancelled' => ['Cancelled'],
];
$filter = array_key_exists($_GET['filter'] ?? '', $tabs) ? $_GET['filter'] : 'all';
if ($filter !== 'all') {
    $orders = array_values(array_filter($orders, function ($order) use ($groups, $filter) {
        return in_array($order['status'], $groups[$filter], true);
    }));
}

// Link to an order (or just a tab) that keeps the current filter in the URL
function orders_url(string $filter, ?int $id = null): string
{
    $query = array_filter(['filter' => $filter === 'all' ? '' : $filter, 'id' => $id]);
    return 'orders.php' . ($query ? '?' . http_build_query($query) : '');
}

// The order shown in the detail panel: ?id=ORDER_ID if it is one of this user's orders, else the newest
$selected = $orders[0] ?? null;
$wantedId = filter_var($_GET['id'] ?? '', FILTER_VALIDATE_INT);
foreach ($orders as $order) {
    if ($order['order_id'] === $wantedId) {
        $selected = $order;
    }
}

$orderItems = [];
if ($selected) {
    $stmt = db()->prepare(
        'SELECT oi.quantity, oi.unit_price, m.name, m.image
         FROM order_items oi
         JOIN menu_items m ON m.item_id = oi.item_id
         WHERE oi.order_id = ?
         ORDER BY oi.order_item_id'
    );
    $stmt->execute([$selected['order_id']]);
    $orderItems = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

// Status name => CSS class for the badge, and the steps shown in the timeline
$statusClass = ['Pending' => 'pending', 'Preparing' => 'preparing', 'Out for delivery' => 'delivery', 'Delivered' => 'delivered', 'Cancelled' => 'cancelled'];
$steps       = ['Pending' => 'Order received', 'Preparing' => 'Preparing', 'Out for delivery' => 'Out for delivery', 'Delivered' => 'Delivered'];
$payments    = ['cash' => 'Cash on delivery', 'card' => 'Card on delivery', 'paynow' => 'PayNow'];
$summary     = cart_summary();                           // for the cart badge
?>
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
      <?php require __DIR__ . '/includes/search_bar.php'; ?>
      <nav class="nav"><a href="index.php">Home</a><a href="menu.php">Menu</a><a class="active" href="orders.php">My orders</a></nav>
      <a class="cart" href="cart.php"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span><?= $summary['items'] ?></span></a>
      <?php require __DIR__ . '/includes/auth_nav.php'; ?>
    </header>
    <main class="container">
      <?php if ($orderNotice !== ''): ?>
      <div class="checkout-notice" role="status"><?= e($orderNotice) ?></div>
      <?php endif; ?>
      <?php if ($checkoutNotice): ?>
      <div class="checkout-notice" role="status">Order #<?= (int) $checkoutNotice['order_id'] ?> placed.
        <?= $checkoutNotice['email_sent'] ? 'Your confirmation email is on its way.' : "We couldn't send the confirmation email. Your order is saved." ?>
      </div>
      <?php endif; ?>
      <div class="page-head"><h1>My orders</h1>
        <div class="filter-tabs">
          <?php foreach ($tabs as $key => $label): ?>
          <a<?= $filter === $key ? ' class="active"' : '' ?> href="<?= e(orders_url($key)) ?>"><?= e($label) ?></a>
          <?php endforeach; ?>
        </div>
      </div>
      <?php if (!$orders): ?>
      <section class="panel orders-table"><p class="fine" style="padding: 28px"><?= $hasOrders ? 'No ' . e(strtolower($tabs[$filter])) . ' orders.' : 'You have not placed any orders yet.' ?> <a class="back-link" href="menu.php">Browse the menu</a></p></section>
      <?php else: ?>
      <div class="orders-layout">
        <section class="panel orders-table">
          <table>
            <thead><tr><th>Order</th><th>Placed</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              <?php foreach ($orders as $order): ?>
              <tr data-href="<?= e(orders_url($filter, $order['order_id'])) ?>"<?= $order['order_id'] === $selected['order_id'] ? ' class="selected"' : '' ?>><td><a href="<?= e(orders_url($filter, $order['order_id'])) ?>">#<?= (int) $order['order_id'] ?></a></td><td><?= e(date('j M, H:i', strtotime($order['order_date']))) ?></td><td><?= (int) $order['item_count'] ?></td><td><strong>$<?= number_format((float) $order['total_amount'], 2) ?></strong></td><td><span class="status <?= $statusClass[$order['status']] ?>"><?= e($order['status']) ?></span></td></tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </section>
        <aside class="order-card detail-panel">
          <div class="detail-top"><span>Order details</span><span class="status <?= $statusClass[$selected['status']] ?>"><?= e($selected['status']) ?></span></div>
          <h2>#<?= (int) $selected['order_id'] ?></h2>
          <?php if ($selected['status'] === 'Cancelled'): ?>
          <p class="fine">This order was cancelled on <?= e(date('j M, H:i', strtotime($selected['updated_at']))) ?>.</p>
          <?php else: ?>
          <ol class="timeline">
            <?php $reached = true; ?>
            <?php foreach ($steps as $status => $label): ?>
            <?php $isCurrent = $status === $selected['status']; ?>
            <li class="<?= $isCurrent ? 'current' : ($reached ? 'done' : '') ?>"><span class="tl-dot"></span><span><strong><?= e($label) ?></strong><?php if ($isCurrent): ?><small><?= e(date('j M, H:i', strtotime($status === 'Pending' ? $selected['order_date'] : $selected['updated_at']))) ?></small><?php endif; ?></span></li>
            <?php if ($isCurrent) { $reached = false; } ?>
            <?php endforeach; ?>
          </ol>
          <?php endif; ?>
          <?php foreach ($orderItems as $item): ?>
          <div class="sum-item"><?php if (!empty($item['image'])): ?><img class="swatch-lg" src="<?= e($item['image']) ?>" alt=""><?php else: ?><span class="swatch-lg t-peach"></span><?php endif; ?><span><h3><?= e($item['name']) ?> &times; <?= (int) $item['quantity'] ?></h3></span><strong>$<?= number_format($item['unit_price'] * $item['quantity'], 2) ?></strong></div>
          <?php endforeach; ?>
          <div class="order-total"><span>Total</span><strong>$<?= number_format((float) $selected['total_amount'], 2) ?></strong></div>
          <div class="note-box block">
            <p><span>Deliver to</span> <?= e($selected['delivery_address']) ?></p>
            <p><span>Phone</span> <?= e($selected['contact_phone']) ?> &middot; <span>Payment</span> <?= e($payments[$selected['payment_method']]) ?></p>
            <?php if ($selected['notes'] !== null && $selected['notes'] !== ''): ?><p><span>Notes</span> <?= e($selected['notes']) ?></p><?php endif; ?>
          </div>
          <?php if ($selected['status'] === 'Pending'): ?>
          <form method="post" action="orders.php" id="cancel-form">
            <input type="hidden" name="action" value="cancel_order">
            <input type="hidden" name="order_id" value="<?= (int) $selected['order_id'] ?>">
            <button type="submit" class="btn-outline-danger">Cancel order</button>
          </form>
          <p class="fine">Orders can be cancelled until the kitchen starts preparing.</p>
          <?php endif; ?>
        </aside>
      </div>
      <?php endif; ?>
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
  <script src="js/orders.js"></script>
</body>
</html>
