<?php
// Navbar account controls, including a return link to administration for admins.
require_once __DIR__ . '/functions.php';

if (isset($_SESSION['user_id'])):
    $navName  = $_SESSION['name'] ?? '';
    $initials = mb_strtoupper(mb_substr($navName, 0, 1, 'UTF-8'), 'UTF-8');
?>
      <span class="avatar"><?= e($initials) ?></span><span class="user-name">Welcome, <?= e($navName) ?></span>
      <?php if (($_SESSION['role'] ?? '') === 'admin'): ?>
      <a class="btn light" href="admin/orders.php">Admin</a>
      <?php endif; ?>
      <a class="btn light" href="logout.php">Log out</a>
<?php else: ?>
      <a class="btn light" href="login_register.php">Log in</a>
<?php endif; ?>
