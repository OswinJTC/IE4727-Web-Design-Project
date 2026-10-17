<?php
require __DIR__ . '/includes/functions.php';
require __DIR__ . '/includes/cart.php';

// ?id=ITEM_ID: show one available dish, or a "not found" message
$id   = filter_var($_GET['id'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
$item = false;
if ($id !== false) {
    // "Add to cart" sends ?product_id=ID&qty=N here; add it, then reload this page
    cart_handle_request('item.php?id=' . $id);

    $stmt = db()->prepare('SELECT * FROM menu_items WHERE item_id = ? AND is_available = 1');
    $stmt->execute([$id]);
    $item = $stmt->fetch();
}
if (!$item) {
    http_response_code(404);
}

// "More in <category>": up to 4 other available dishes from the same category, in random order
$more = [];
if ($item) {
    $stmt = db()->prepare('SELECT item_id, name, price, image FROM menu_items WHERE category = ? AND item_id <> ? AND is_available = 1 ORDER BY RAND() LIMIT 4');
    $stmt->execute([$item['category'], $item['item_id']]);
    $more = $stmt->fetchAll();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoodHub | <?= e($item['name'] ?? 'Dish not found') ?></title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="page">
    <header class="topbar">
      <a class="brand" href="index.php"><span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg></span>FoodHub</a>
      <div class="search"><span class="search-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></span><span>Search dishes, e.g. laksa</span></div>
      <nav class="nav"><a href="index.php">Home</a><a class="active" href="menu.php">Menu</a><a href="orders.php">My orders</a></nav>
      <a class="cart" href="cart.php"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span>3</span></a>
      <?php require __DIR__ . '/includes/auth_nav.php'; ?>
    </header>
    <main class="container">
      <?php if (!$item): ?>
      <div class="breadcrumb"><a href="index.php">Home</a> / <a href="menu.php">Menu</a> / <strong>Dish not found</strong></div>
      <section class="product-info">
        <h1>Dish not found</h1>
        <p class="desc">This dish does not exist or is no longer available.</p>
        <a class="back-link" href="menu.php">&lt; Back to menu</a>
      </section>
      <?php else: ?>
      <div class="breadcrumb"><a href="index.php">Home</a> / <a href="menu.php">Menu</a> / <a href="menu.php?category=<?= urlencode($item['category']) ?>"><?= e($item['category']) ?></a> / <strong><?= e($item['name']) ?></strong></div>
      <section class="product">
        <div>
          <div class="product-visual"><img src="<?= e($item['image']) ?>" alt="<?= e($item['name']) ?>"></div>
        </div>
        <div class="product-info">
          <span class="label"><?= e($item['category']) ?></span>
          <h1><?= e($item['name']) ?></h1>
          <div class="big-price">$<?= number_format((float) $item['price'], 2) ?></div>
          <p class="desc"><?= e($item['description']) ?></p>
          <div class="buy-row">
            <div class="qty"><button type="button" id="qty-dec" aria-label="Decrease quantity">&minus;</button><span id="qty-value">1</span><button type="button" id="qty-inc" aria-label="Increase quantity">+</button></div>
            <a class="btn" id="add-to-cart" href="item.php?id=<?= (int) $item['item_id'] ?>&amp;product_id=<?= (int) $item['item_id'] ?>&amp;qty=1" data-base-href="item.php?id=<?= (int) $item['item_id'] ?>&amp;product_id=<?= (int) $item['item_id'] ?>" data-price="<?= e(number_format((float) $item['price'], 2, '.', '')) ?>"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg> Add to cart - <span id="add-total">$<?= number_format((float) $item['price'], 2) ?></span></a>
          </div>
          <p class="added-note" id="added-note" role="status"></p>
          <a class="back-link" href="menu.php">&lt; Back to menu</a>
          <div class="detail-grid">
            <div class="detail-card"><span class="mini-icon t-peach"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 7h14v10H5z"/><path d="M8 12h8"/></svg></span><span><h3>Pay your way</h3><p>Cash, card on delivery or PayNow</p></span></div>
            <div class="detail-card"><span class="mini-icon t-peach"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg></span><span><h3>Track your order</h3><p>Live status in My orders</p></span></div>
          </div>
        </div>
      </section>
      <?php endif; ?>

      <?php if ($more): ?>
      <div class="more-row"><h2>More in <?= e($item['category']) ?></h2><a class="see-all" href="menu.php?category=<?= urlencode($item['category']) ?>">View all -></a></div>
      <section class="thumb-grid">
        <?php foreach ($more as $other): ?>
        <a href="item.php?id=<?= (int) $other['item_id'] ?>">
          <article class="thumb-card"><div class="image"><img src="<?= e($other['image']) ?>" alt="<?= e($other['name']) ?>" loading="lazy"></div><h3><?= e($other['name']) ?></h3><div class="price">$<?= number_format((float) $other['price'], 2) ?></div></article>
        </a>
        <?php endforeach; ?>
      </section>
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
  <script src="js/item.js"></script>
</body>
</html>
