<?php
// Cart helpers shared by menu.php and cart.php.
// The cart lives in $_SESSION['cart'] as item_id => ['name', 'category', 'image', 'price', 'count'].
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/db.php';

const CART_MAX_PER_DISH = 20;

// Add $qty of a dish (never past the per-dish limit) and return how many were added.
// Name, price etc. are read from the database, never from the URL.
function cart_add(int $id, int $qty = 1): int
{
    $stmt = db()->prepare('SELECT name, category, image, price FROM menu_items WHERE item_id = ? AND is_available = 1');
    $stmt->execute([$id]);
    $dish = $stmt->fetch();
    $count = $_SESSION['cart'][$id]['count'] ?? 0;

    $added = min($qty, CART_MAX_PER_DISH - $count);

    if (!$dish || $added <= 0) {
        return 0;                                    // unknown/hidden dish, or already at the limit
    }
    $_SESSION['cart'][$id] = [
        'name'     => $dish['name'],
        'category' => $dish['category'],
        'image'    => $dish['image'],
        'price'    => (float) $dish['price'],
        'count'    => $count + $added,
    ];
    return $added;
}

// Remove one of a dish; the dish leaves the cart when its count reaches 0.
function cart_decrease(int $id): void
{
    if (!isset($_SESSION['cart'][$id])) {
        return;
    }
    $_SESSION['cart'][$id]['count'] -= 1;
    if ($_SESSION['cart'][$id]['count'] <= 0) {
        unset($_SESSION['cart'][$id]);
    }
}

// Remove a dish completely, whatever its count.
function cart_remove(int $id): void
{
    unset($_SESSION['cart'][$id]);
}

// Apply ?product_id=ID&action=add|decrease|remove (add when no action; &qty=N adds N at once),
// then redirect so refreshing the page does not repeat it.
function cart_handle_request(string $redirect): void
{
    $raw = $_GET['product_id'] ?? '';
    if ($raw === '') {
        return;
    }

    $id     = filter_var($raw, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $qty    = filter_var($_GET['qty'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => CART_MAX_PER_DISH]]);
    $action = $_GET['action'] ?? 'add';
    if ($id !== false) {
        if ($action === 'add' && $qty !== false) {
            cart_add($id, $qty);
        } elseif ($action === 'decrease') {
            cart_decrease($id);
        } elseif ($action === 'remove') {
            cart_remove($id);
        }
    }

    header('Location: ' . $redirect);
    exit;
}

// Cart lines with subtotals, plus the number of items and the total price.
function cart_summary(): array
{
    $lines = [];
    $items = 0;
    $total = 0.0;
    // Carts saved before category/image were stored lack them: fill them in from the database once
    $stmt = db()->prepare('SELECT category, image FROM menu_items WHERE item_id = ?');
    foreach ($_SESSION['cart'] ?? [] as $id => $line) {
        if (!isset($line['category'], $line['image'])) {
            $stmt->execute([$id]);
            $_SESSION['cart'][$id] = $line = array_merge($line, $stmt->fetch() ?: ['category' => '', 'image' => '']);
        }
        $subtotal = $line['price'] * $line['count'];
        $lines[]  = $line + ['item_id' => $id, 'subtotal' => $subtotal];
        $items   += $line['count'];
        $total   += $subtotal;
    }
    return ['lines' => $lines, 'items' => $items, 'total' => $total];
}
