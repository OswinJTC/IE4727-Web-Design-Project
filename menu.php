<?php
require __DIR__ . '/includes/functions.php';
require __DIR__ . '/includes/cart.php';

// ?category=Mains|Sides|Drinks|Desserts marks that tab active; anything else means "All"
$tabs     = ['Mains' => 0, 'Sides' => 0, 'Drinks' => 0, 'Desserts' => 0];
$category = array_key_exists($_GET['category'] ?? '', $tabs) ? $_GET['category'] : '';

// ?q=text keeps only dishes whose name contains it. Any % or _ the user types is
// escaped so it is matched literally instead of acting as a LIKE wildcard.
$q       = mb_substr(trim($_GET['q'] ?? ''), 0, 100);
$pattern = '%' . addcslashes($q, '%_\\') . '%';

// Link to the menu that keeps the current category and search in the URL
function menu_url(string $category, string $q): string
{
    $query = array_filter(['category' => $category, 'q' => $q]);
    return 'menu.php' . ($query ? '?' . http_build_query($query) : '');
}

// Available dishes, filtered by the selected category and search (none selected = all dishes)
$sql    = 'SELECT * FROM menu_items WHERE is_available = 1';
$params = [];
if ($category !== '') {
    $sql     .= ' AND category = ?';
    $params[] = $category;
}
if ($q !== '') {
    $sql     .= ' AND name LIKE ?';
    $params[] = $pattern;
}
$stmt = db()->prepare($sql . ' ORDER BY name');
$stmt->execute($params);
$items = $stmt->fetchAll();

// Tab counts come from their own query, not from $items: $items is already filtered by the
// selected category, so counting it would zero out every other tab. The search still applies,
// so each number matches what its tab would show.
$countSql    = 'SELECT category, COUNT(*) AS n FROM menu_items WHERE is_available = 1';
$countParams = [];
if ($q !== '') {
    $countSql   .= ' AND name LIKE ?';
    $countParams = [$pattern];
}
$stmt = db()->prepare($countSql . ' GROUP BY category');
$stmt->execute($countParams);
foreach ($stmt as $row) {
    $tabs[$row['category']] = (int) $row['n'];
}

// ?product_id=ID adds a dish to the session cart, &action=decrease removes one
cart_handle_request(menu_url($category, $q));

// "Your order" panel and the quantity next to each + button
$cart    = $_SESSION['cart'] ?? [];
$summary = cart_summary();
?>
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
      <?php require __DIR__ . '/includes/search_bar.php'; ?>
      <nav class="nav"><a href="index.php">Home</a><a class="active" href="menu.php">Menu</a><a href="orders.php">My orders</a></nav>
      <a class="cart" href="cart.php"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span><?= $summary['items'] ?></span></a>
      <?php require __DIR__ . '/includes/auth_nav.php'; ?>
    </header>

    <main class="container">
      <div class="breadcrumb"><a href="index.php">Home</a> / Menu</div>
      <div class="menu-header">
        <div class="menu-title">
          <h1>Our menu</h1>
          <?php if ($q !== ''): ?>
          <p><?= count($items) ?> dish<?= count($items) === 1 ? '' : 'es' ?> matching &ldquo;<?= e($q) ?>&rdquo;</p>
          <?php else: ?>
          <p><?= array_sum($tabs) ?> dishes, cooked fresh when you order</p>
          <?php endif; ?>
        </div>
      </div>
      <nav class="tabs">
        <a<?= $category === '' ? ' class="active"' : '' ?> href="<?= e(menu_url('', $q)) ?>">All&nbsp; <?= array_sum($tabs) ?></a>
        <?php foreach ($tabs as $name => $count): ?>
        <a<?= $category === $name ? ' class="active"' : '' ?> href="<?= e(menu_url($name, $q)) ?>"><?= e($name) ?>&nbsp; <?= $count ?></a>
        <?php endforeach; ?>
      </nav>
      <div class="menu-layout">
        <section class="dish-grid">
          <?php foreach ($items as $item) { ?>
          <article class="dish-card">
            <span class="tag"><?= e($item['category']) ?></span>
            <a href="item.php?id=<?= (int) $item['item_id'] ?>"><div class="image"><img src="<?= e($item['image']) ?>" alt="<?= e($item['name']) ?>" loading="lazy"></div></a>
            <h3><?= e($item['name']) ?></h3><p><?= e($item['description']) ?></p><div class="price">$<?= number_format((float) $item['price'], 2) ?></div><div class="qty-stepper">
              <?php $qty = $cart[$item['item_id']]['count'] ?? 0; $link = array_filter(['category' => $category, 'q' => $q, 'product_id' => (int) $item['item_id']]); ?>
              <?php if ($qty > 0): ?>
              <a class="dec" href="menu.php?<?= e(http_build_query($link + ['action' => 'decrease'])) ?>" aria-label="Remove one <?= e($item['name']) ?>">&minus;</a><span class="stepper-qty"><?= (int) $qty ?></span>
              <?php endif; ?>
              <a class="add" href="menu.php?<?= e(http_build_query($link)) ?>" aria-label="Add <?= e($item['name']) ?> to cart">+</a>
            </div>
          </article>
          <?php }; ?>
          <?php if (!$items): ?><p>No dishes <?= $q !== '' ? 'match &ldquo;' . e($q) . '&rdquo;' : 'in this category' ?>. <a class="back-link" href="menu.php">View the full menu</a></p><?php endif; ?>
        </section>
        <aside class="order-card">
          <div class="order-head"><h2>Your order</h2><span><?= $summary['items'] ?> item<?= $summary['items'] === 1 ? '' : 's' ?></span></div>
          <?php foreach ($summary['lines'] as $line): ?>
          <div class="order-line"><span><?= (int) $line['count'] ?> x <?= e($line['name']) ?></span><span>$<?= number_format($line['subtotal'], 2) ?></span></div>
          <?php endforeach; ?>
          <?php if (!$summary['lines']): ?><p>Your cart is empty. Tap + on a dish to add it.</p><?php endif; ?>
          <div class="order-total"><span>Total</span><strong>$<?= number_format($summary['total'], 2) ?></strong></div>
          <a class="btn" href="cart.php">View cart</a>
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
