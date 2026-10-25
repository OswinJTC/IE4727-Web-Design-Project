<?php
require __DIR__ . '/auth_check.php';
require __DIR__ . '/../includes/mailer.php';
$activePage = 'orders';
$statuses = ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'];
$statusClasses = ['Pending' => 'pending', 'Preparing' => 'preparing', 'Out for delivery' => 'delivery', 'Delivered' => 'delivered', 'Cancelled' => 'cancelled'];
$payments = ['cash' => 'Cash', 'card' => 'Card', 'paynow' => 'PayNow'];
$filter = in_array($_GET['status'] ?? '', $statuses, true) ? $_GET['status'] : 'Pending';
if (($_GET['status'] ?? '') === 'all') $filter = 'all';
$q = trim($_GET['q'] ?? '');
$wantedId = max(0, (int) ($_GET['id'] ?? 0));
$errors = [];

function admin_orders_url(array $changes = []): string
{
    global $filter, $q;
    return 'orders.php?' . http_build_query(array_filter(array_merge(['status' => $filter, 'q' => $q], $changes), static fn($value) => $value !== '' && $value !== null));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'update_status') {
    $orderId = max(0, (int) ($_POST['order_id'] ?? 0));
    $status = $_POST['status'] ?? '';
    if (!in_array($status, $statuses, true)) $errors[] = 'Choose a valid order status.';
    if (!$errors) {
        try {
            $stmt = db()->prepare('SELECT o.status, u.email FROM orders o JOIN users u ON u.user_id = o.user_id WHERE o.order_id = ?');
            $stmt->execute([$orderId]);
            $order = $stmt->get_result()->fetch_assoc();
            if (!$order) $errors[] = 'This order no longer exists.';
            elseif ($order['status'] === $status) {
                $_SESSION['admin_flash'] = 'Order #' . $orderId . ' is already ' . $status . '. No email was sent.';
            } else {
                $stmt = db()->prepare('UPDATE orders SET status = ? WHERE order_id = ?');
                $stmt->execute([$status, $orderId]);
                $sent = email_order_status($order['email'], $orderId, $status);
                $_SESSION['admin_flash'] = 'Order #' . $orderId . ' is now ' . $status . '. ' . ($sent ? 'Email to ' . $order['email'] . ' was accepted by the mail service.' : 'The email was not sent. Check the Gmail App Password and SMTP connection.');
            }
            if (!$errors) {
                // Follow the updated order into its new tab so its detail remains visible.
                header('Location: ' . admin_orders_url(['status' => $filter === 'all' ? 'all' : $status, 'id' => $orderId]));
                exit;
            }
        } catch (mysqli_sql_exception $ex) {
            error_log('Admin orders: ' . $ex->getMessage());
            $errors[] = 'The order could not be updated. Please try again.';
        }
    }
}

$counts = array_fill_keys($statuses, 0);
foreach (db()->query('SELECT status, COUNT(*) AS count FROM orders GROUP BY status')->fetch_all(MYSQLI_ASSOC) as $row) $counts[$row['status']] = (int) $row['count'];
$where = [];
$params = [];
if ($filter !== 'all') { $where[] = 'o.status = ?'; $params[] = $filter; }
if ($q !== '') { $where[] = '(CAST(o.order_id AS CHAR) = ? OR u.full_name LIKE ?)'; $params[] = ltrim($q, '#'); $params[] = '%' . $q . '%'; }
$stmt = db()->prepare('SELECT o.*, u.full_name FROM orders o JOIN users u ON u.user_id = o.user_id' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY o.order_date DESC, o.order_id DESC');
$stmt->execute($params);
$orders = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$selected = $orders[0] ?? null;
foreach ($orders as $order) if ((int) $order['order_id'] === $wantedId) $selected = $order;
$orderItems = [];
if ($selected) {
    $stmt = db()->prepare('SELECT oi.quantity, oi.unit_price, m.name FROM order_items oi JOIN menu_items m ON m.item_id = oi.item_id WHERE oi.order_id = ? ORDER BY oi.order_item_id');
    $stmt->execute([$selected['order_id']]);
    $orderItems = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}
?>
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>FoodHub | Manage orders</title><link rel="stylesheet" href="../styles.css?v=<?= filemtime(__DIR__ . '/../styles.css') ?>"></head>
<body class="admin-body">
<div class="admin-layout">
<?php require __DIR__ . '/sidebar.php'; ?>
<main class="admin-main">
  <?php if ($flash): ?><div class="admin-flash" role="status">✓ &nbsp;<?= e($flash) ?></div><?php endif; ?>
  <?php if ($errors): ?><div class="admin-errors" role="alert"><?php foreach ($errors as $error): ?><p><?= e($error) ?></p><?php endforeach; ?></div><?php endif; ?>
  <header class="admin-heading"><div><h1>Manage orders</h1><p><?= $counts['Pending'] ?> <?= $counts['Pending'] === 1 ? 'order' : 'orders' ?> waiting for the kitchen</p></div><form method="get" class="admin-order-search"><input type="hidden" name="status" value="<?= e($filter) ?>"><label class="admin-search"><?= admin_icon('search') ?><input name="q" value="<?= e($q) ?>" placeholder="Order # or customer name" aria-label="Search orders"></label><button class="admin-search-submit">Search</button></form></header>
  <nav class="admin-status-tabs" aria-label="Order status"><a href="<?= e(admin_orders_url(['status' => 'all'])) ?>"<?= $filter === 'all' ? ' class="active" aria-current="page"' : '' ?>>All <span><?= array_sum($counts) ?></span></a><?php foreach ($statuses as $status): ?><a href="<?= e(admin_orders_url(['status' => $status])) ?>"<?= $filter === $status ? ' class="active" aria-current="page"' : '' ?>><?= e($status) ?> <span><?= $counts[$status] ?></span></a><?php endforeach; ?></nav>
  <div class="admin-columns admin-order-columns<?= !$selected ? ' no-panel' : '' ?>">
    <section class="admin-card admin-list" aria-label="Orders">
      <div class="admin-table-scroll"><table class="admin-table orders-admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>
      <?php foreach ($orders as $order): ?>
      <tr<?= $selected && (int) $selected['order_id'] === (int) $order['order_id'] ? ' class="selected"' : '' ?>>
        <td><a class="admin-order-id" href="<?= e(admin_orders_url(['id' => $order['order_id']])) ?>">#<?= (int) $order['order_id'] ?></a></td>
        <td><a class="admin-customer" href="<?= e(admin_orders_url(['id' => $order['order_id']])) ?>"><span class="admin-avatar"><?= e(admin_initials($order['full_name'])) ?></span><span><strong><?= e($order['full_name']) ?></strong><small><?= e($order['contact_phone']) ?></small></span></a></td>
        <td><time datetime="<?= e(date('c', strtotime($order['order_date']))) ?>" title="<?= e($order['order_date']) ?>"><?= e(date('d M', strtotime($order['order_date']))) ?><small><?= e(date('H:i', strtotime($order['order_date']))) ?></small></time></td>
        <td class="admin-money">$<?= number_format((float) $order['total_amount'], 2) ?></td><td><?= e($payments[$order['payment_method']] ?? $order['payment_method']) ?></td>
        <td><a href="<?= e(admin_orders_url(['id' => $order['order_id']])) ?>"><span class="admin-status <?= $statusClasses[$order['status']] ?>"><?= e($order['status']) ?></span></a></td>
      </tr>
      <?php endforeach; ?>
      <?php if (!$orders): ?><tr><td colspan="6" class="admin-empty">No orders found. Try another status or search.</td></tr><?php endif; ?>
      </tbody></table></div>
      <footer class="admin-table-footer">Showing <?= count($orders) ?> <?= $filter === 'all' ? '' : e(strtolower($filter)) . ' ' ?><?= count($orders) === 1 ? 'order' : 'orders' ?>, oldest at the bottom</footer>
    </section>
    <?php if ($selected): ?>
    <aside class="admin-card admin-editor admin-order-detail" aria-label="Order details">
      <div class="admin-detail-top"><p>Placed <?= e(date('d M, H:i', strtotime($selected['order_date']))) ?></p><span class="admin-status <?= $statusClasses[$selected['status']] ?>"><?= e($selected['status']) ?></span></div>
      <h2>Order #<?= (int) $selected['order_id'] ?></h2>
      <div class="admin-delivery"><strong><?= e($selected['full_name']) ?> · <?= e($selected['contact_phone']) ?></strong><p><?= nl2br(e($selected['delivery_address'])) ?></p><?php if ($selected['notes']): ?><p>Note: “<?= e($selected['notes']) ?>”</p><?php endif; ?></div>
      <div class="admin-order-lines"><?php foreach ($orderItems as $item): ?><div><span><strong><?= (int) $item['quantity'] ?> ×</strong> <?= e($item['name']) ?></span><span>$<?= number_format((float) $item['unit_price'] * (int) $item['quantity'], 2) ?></span></div><?php endforeach; ?></div>
      <div class="admin-order-total"><span>Total · <?= $selected['payment_method'] === 'cash' ? 'Cash on delivery' : ($selected['payment_method'] === 'card' ? 'Card on delivery' : 'PayNow') ?></span><strong>$<?= number_format((float) $selected['total_amount'], 2) ?></strong></div>
      <form method="post" action="<?= e(admin_orders_url(['id' => $selected['order_id']])) ?>"><input type="hidden" name="action" value="update_status"><input type="hidden" name="order_id" value="<?= (int) $selected['order_id'] ?>">
        <fieldset class="admin-status-options"><legend>Update status</legend><?php foreach ($statuses as $status): ?><label><input type="radio" name="status" value="<?= e($status) ?>"<?= $selected['status'] === $status ? ' checked' : '' ?> required><span class="admin-status <?= $statusClasses[$status] ?>"><?= e($status) ?></span></label><?php endforeach; ?></fieldset>
        <button class="btn admin-update-button" type="submit">Update and email customer</button>
      </form>
    </aside>
    <?php endif; ?>
  </div>
</main>
</div>
</body>
</html>
