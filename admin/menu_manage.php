<?php
require __DIR__ . '/auth_check.php';
$activePage = 'menu';
$categories = ['Mains', 'Sides', 'Drinks', 'Desserts'];
$q = trim($_GET['q'] ?? '');
$category = in_array($_GET['category'] ?? '', $categories, true) ? $_GET['category'] : '';
$visibility = in_array($_GET['visibility'] ?? '', ['shown', 'hidden'], true) ? $_GET['visibility'] : '';
$page = max(1, (int) ($_GET['page'] ?? 1));

function menu_url(array $changes = []): string
{
    global $q, $category, $visibility, $page;
    $params = array_merge(['q' => $q, 'category' => $category, 'visibility' => $visibility, 'page' => $page], $changes);
    return 'menu_manage.php?' . http_build_query(array_filter($params, static fn($value) => $value !== '' && $value !== null));
}

$errors = [];
$editId = max(0, (int) ($_GET['edit'] ?? 0));
$adding = isset($_GET['add']);
$editing = null;
if ($editId) {
    $stmt = db()->prepare('SELECT * FROM menu_items WHERE item_id = ?');
    $stmt->execute([$editId]);
    $editing = $stmt->get_result()->fetch_assoc() ?: null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $itemId = max(0, (int) ($_POST['item_id'] ?? 0));
    try {
        if ($action === 'toggle') {
            $stmt = db()->prepare('UPDATE menu_items SET is_available = 1 - is_available WHERE item_id = ?');
            $stmt->execute([$itemId]);
            $_SESSION['admin_flash'] = 'Menu visibility updated.';
        } elseif ($action === 'delete') {
            // Keep old orders readable: dishes used by an order can only be hidden.
            $stmt = db()->prepare('SELECT COUNT(*) FROM order_items WHERE item_id = ?');
            $stmt->execute([$itemId]);
            if (($stmt->get_result()->fetch_row()[0] ?? 0)) {
                $stmt = db()->prepare('UPDATE menu_items SET is_available = 0 WHERE item_id = ?');
                $stmt->execute([$itemId]);
                $_SESSION['admin_flash'] = 'This dish belongs to past orders, so it was hidden instead of deleted.';
            } else {
                $stmt = db()->prepare('DELETE FROM menu_items WHERE item_id = ?');
                $stmt->execute([$itemId]);
                $_SESSION['admin_flash'] = 'Dish deleted.';
            }
        } elseif ($action === 'save') {
            // Read the saved image from the database, never from a hidden form field.
            $stmt = db()->prepare('SELECT * FROM menu_items WHERE item_id = ?');
            $stmt->execute([$itemId]);
            $saved = $stmt->get_result()->fetch_assoc();
            $editing = [
                'item_id' => $itemId,
                'name' => trim($_POST['name'] ?? ''),
                'category' => $_POST['category'] ?? '',
                'price' => trim($_POST['price'] ?? ''),
                'description' => trim($_POST['description'] ?? ''),
                'is_available' => isset($_POST['is_available']) ? 1 : 0,
                'image' => $saved['image'] ?? '',
            ];
            $adding = !$itemId;
            if ($itemId && !$saved) $errors[] = 'This dish no longer exists.';
            if ($editing['name'] === '' || mb_strlen($editing['name']) > 100) $errors[] = 'Enter a dish name up to 100 characters.';
            if (!in_array($editing['category'], $categories, true)) $errors[] = 'Choose a category.';
            if (!preg_match('/^\d{1,4}(\.\d{1,2})?$/', $editing['price']) || (float) $editing['price'] <= 0) $errors[] = 'Enter a price from $0.01 to $9,999.99, with up to two decimal places.';
            if (strlen($editing['description']) > 5000) $errors[] = 'Keep the description within 5,000 bytes.';
            $photo = $_FILES['photo'] ?? null;
            $newPhoto = null;
            if ($photo && $photo['error'] !== UPLOAD_ERR_NO_FILE) {
                if ($photo['error'] !== UPLOAD_ERR_OK || $photo['size'] > 2 * 1024 * 1024) {
                    $errors[] = 'Choose a JPG or PNG photo up to 2 MB.';
                } else {
                    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($photo['tmp_name']);
                    $extension = ['image/jpeg' => 'jpg', 'image/png' => 'png'][$mime] ?? null;
                    if (!$extension || !getimagesize($photo['tmp_name'])) $errors[] = 'The photo must be a valid JPG or PNG image.';
                    else $newPhoto = 'uploads/' . bin2hex(random_bytes(16)) . '.' . $extension;
                }
            }
            if (!$errors && $newPhoto) {
                $directory = __DIR__ . '/../uploads';
                if ((!is_dir($directory) && !mkdir($directory, 0755, true)) || !move_uploaded_file($photo['tmp_name'], __DIR__ . '/../' . $newPhoto)) {
                    $errors[] = 'The photo could not be saved. Please try again.';
                } else $editing['image'] = $newPhoto;
            }
            if (!$errors) {
                $values = [$editing['name'], $editing['category'], $editing['description'], $editing['price'], $editing['image'] ?: null, $editing['is_available']];
                if ($itemId) {
                    $stmt = db()->prepare('UPDATE menu_items SET name = ?, category = ?, description = ?, price = ?, image = ?, is_available = ? WHERE item_id = ?');
                    $stmt->execute([...$values, $itemId]);
                } else {
                    $stmt = db()->prepare('INSERT INTO menu_items (name, category, description, price, image, is_available) VALUES (?, ?, ?, ?, ?, ?)');
                    $stmt->execute($values);
                }
                $_SESSION['admin_flash'] = $itemId ? 'Dish updated.' : 'Dish added.';
            }
        }
        if (!$errors) {
            header('Location: ' . menu_url());
            exit;
        }
    } catch (mysqli_sql_exception $ex) {
        error_log('Admin menu: ' . $ex->getMessage());
        if (!empty($newPhoto)) @unlink(__DIR__ . '/../' . $newPhoto);
        $errors[] = 'The change could not be saved. Please try again.';
    }
}

$totals = db()->query('SELECT COUNT(*) AS total, COALESCE(SUM(is_available = 1), 0) AS shown FROM menu_items')->fetch_assoc();
$where = [];
$params = [];
if ($q !== '') { $where[] = '(name LIKE ? OR description LIKE ?)'; $params[] = '%' . $q . '%'; $params[] = '%' . $q . '%'; }
if ($category !== '') { $where[] = 'category = ?'; $params[] = $category; }
if ($visibility !== '') { $where[] = 'is_available = ?'; $params[] = $visibility === 'shown' ? 1 : 0; }
$sqlWhere = $where ? ' WHERE ' . implode(' AND ', $where) : '';
$stmt = db()->prepare('SELECT COUNT(*) FROM menu_items' . $sqlWhere);
$stmt->execute($params);
$total = (int) ($stmt->get_result()->fetch_row()[0] ?? 0);
$pages = max(1, (int) ceil($total / 5));
$page = min($page, $pages);
$offset = ($page - 1) * 5;
$stmt = db()->prepare('SELECT * FROM menu_items' . $sqlWhere . ' ORDER BY item_id LIMIT 5 OFFSET ' . $offset);
$stmt->execute($params);
$items = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
// Open the first dish by default, like the reference. Cancel closes the editor.
if (!$editing && !$adding && !$errors && !isset($_GET['closed'])) $editing = $items[0] ?? null;
if ($adding && !$editing) $editing = ['item_id' => 0, 'name' => '', 'category' => 'Mains', 'price' => '', 'description' => '', 'image' => '', 'is_available' => 1];
?>
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>FoodHub | Manage menu</title><link rel="stylesheet" href="../styles.css?v=<?= filemtime(__DIR__ . '/../styles.css') ?>"></head>
<body class="admin-body">
<div class="admin-layout">
<?php require __DIR__ . '/sidebar.php'; ?>
<main class="admin-main">
  <?php if ($flash): ?><div class="admin-flash" role="status">✓ &nbsp;<?= e($flash) ?></div><?php endif; ?>
  <header class="admin-heading"><div><h1>Manage menu</h1><p><?= (int) $totals['total'] ?> dishes · <?= (int) $totals['shown'] ?> on the menu, <?= (int) $totals['total'] - (int) $totals['shown'] ?> hidden</p></div><a class="btn" href="<?= e(menu_url(['add' => 1])) ?>">＋ Add dish</a></header>
  <div class="admin-columns<?= !$editing ? ' no-panel' : '' ?>">
    <section class="admin-card admin-list" aria-label="Dishes">
      <form class="admin-filters" method="get">
        <label class="admin-search"><?= admin_icon('search') ?><input name="q" value="<?= e($q) ?>" placeholder="Search dishes" aria-label="Search dishes"></label>
        <select name="category" aria-label="Filter category" onchange="this.form.submit()"><option value="">All categories</option><?php foreach ($categories as $value): ?><option<?= $category === $value ? ' selected' : '' ?>><?= e($value) ?></option><?php endforeach; ?></select>
        <select name="visibility" aria-label="Filter visibility" onchange="this.form.submit()"><option value="">Any status</option><option value="shown"<?= $visibility === 'shown' ? ' selected' : '' ?>>Shown</option><option value="hidden"<?= $visibility === 'hidden' ? ' selected' : '' ?>>Hidden</option></select>
        <button class="admin-search-submit" type="submit">Search</button>
      </form>
      <div class="admin-table-scroll"><table class="admin-table menu-admin-table"><thead><tr><th>Dish</th><th>Category</th><th>Price</th><th>On menu</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>
      <?php foreach ($items as $item): ?>
        <tr<?= $editing && (int) $editing['item_id'] === (int) $item['item_id'] ? ' class="selected"' : '' ?>>
          <td><a class="admin-dish" href="<?= e(menu_url(['edit' => $item['item_id']])) ?>"><span class="admin-thumbnail category-<?= strtolower($item['category']) ?>"><?php if ($item['image']): ?><img src="<?= e(preg_match('~^https?://~i', $item['image']) ? $item['image'] : '../' . $item['image']) ?>" alt=""><?php endif; ?></span><span><strong><?= e($item['name']) ?></strong><small><?= e($item['description']) ?></small></span></a></td>
          <td><?= e($item['category']) ?></td><td class="admin-money">$<?= number_format((float) $item['price'], 2) ?></td>
          <td><form method="post" action="<?= e(menu_url()) ?>"><input type="hidden" name="action" value="toggle"><input type="hidden" name="item_id" value="<?= (int) $item['item_id'] ?>"><button class="admin-toggle-button" type="submit" aria-label="<?= e(($item['is_available'] ? 'Hide ' : 'Show ') . $item['name']) ?>"><span class="admin-switch<?= $item['is_available'] ? ' on' : '' ?>"></span><?= $item['is_available'] ? 'Shown' : 'Hidden' ?></button></form></td>
          <td><div class="admin-row-actions"><a class="admin-icon-button" href="<?= e(menu_url(['edit' => $item['item_id']])) ?>" aria-label="<?= e('Edit ' . $item['name']) ?>"><?= admin_icon('edit') ?></a><form method="post" action="<?= e(menu_url()) ?>" onsubmit="return confirm('Delete this dish? Dishes used in past orders will be hidden instead.')"><input type="hidden" name="action" value="delete"><input type="hidden" name="item_id" value="<?= (int) $item['item_id'] ?>"><button class="admin-icon-button danger" aria-label="<?= e('Delete ' . $item['name']) ?>"><?= admin_icon('delete') ?></button></form></div></td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$items): ?><tr><td colspan="5" class="admin-empty">No dishes found. Try another search or add a dish.</td></tr><?php endif; ?>
      </tbody></table></div>
      <footer class="admin-table-footer"><span>Showing <?= $total ? $offset + 1 : 0 ?>–<?= min($offset + 5, $total) ?> of <?= $total ?></span><nav class="admin-pagination" aria-label="Menu pages"><?php if ($page > 1): ?><a href="<?= e(menu_url(['page' => $page - 1])) ?>" aria-label="Previous page">‹</a><?php endif; ?><?php for ($i = 1; $i <= $pages; $i++): ?><a href="<?= e(menu_url(['page' => $i])) ?>"<?= $i === $page ? ' class="active" aria-current="page"' : '' ?>><?= $i ?></a><?php endfor; ?><?php if ($page < $pages): ?><a href="<?= e(menu_url(['page' => $page + 1])) ?>" aria-label="Next page">›</a><?php endif; ?></nav></footer>
    </section>
    <?php if ($editing): ?>
    <aside class="admin-card admin-editor">
      <div class="admin-panel-heading"><h2><?= $adding ? 'Add dish' : 'Edit dish' ?></h2><a href="<?= e(menu_url(['closed' => 1])) ?>" aria-label="Close editor">×</a></div>
      <?php endif; ?>
      <?php if ($errors): ?><div class="admin-errors" role="alert"><?php foreach ($errors as $error): ?><p><?= e($error) ?></p><?php endforeach; ?></div><?php endif; ?>
      <?php if ($editing): ?>
      <form method="post" enctype="multipart/form-data" action="<?= e(menu_url($adding ? ['add' => 1] : ['edit' => $editing['item_id']])) ?>">
        <input type="hidden" name="action" value="save"><input type="hidden" name="item_id" value="<?= (int) $editing['item_id'] ?>">
        <label class="admin-photo"><span class="admin-thumbnail category-<?= strtolower($editing['category']) ?>" id="photo-preview"><?php if ($editing['image']): ?><img src="<?= e(preg_match('~^https?://~i', $editing['image']) ? $editing['image'] : '../' . $editing['image']) ?>" alt="Dish photo"><?php endif; ?></span><span><strong id="photo-label"><?= $editing['image'] ? 'Replace photo' : 'Upload photo' ?></strong><small>JPG or PNG, up to 2 MB</small></span><input id="dish-photo" type="file" name="photo" accept="image/jpeg,image/png" aria-label="Upload dish photo"></label>
        <label class="admin-field">Name<input name="name" value="<?= e($editing['name']) ?>" maxlength="100" required></label>
        <div class="admin-field-pair"><label class="admin-field">Category<select name="category"><?php foreach ($categories as $value): ?><option<?= $editing['category'] === $value ? ' selected' : '' ?>><?= e($value) ?></option><?php endforeach; ?></select></label><label class="admin-field">Price ($)<input name="price" type="number" min="0.01" max="9999.99" step="0.01" value="<?= e((string) $editing['price']) ?>" required></label></div>
        <label class="admin-field">Description<textarea name="description" rows="4" maxlength="5000"><?= e($editing['description']) ?></textarea></label>
        <label class="admin-checkbox"><input type="checkbox" name="is_available" value="1"<?= $editing['is_available'] ? ' checked' : '' ?>><span class="admin-switch"></span>Show on customer menu</label>
        <div class="admin-form-actions"><button class="btn" type="submit"><?= $adding ? 'Add dish' : 'Save changes' ?></button><a class="btn light" href="<?= e(menu_url(['closed' => 1])) ?>">Cancel</a></div>
      </form>
    </aside>
    <?php endif; ?>
  </div>
</main>
</div>
<script src="../js/admin.js"></script>
</body>
</html>
