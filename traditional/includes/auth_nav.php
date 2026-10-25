<?php
// Right-hand side of the navbar: login button for guests, welcome + logout for members.
require_once __DIR__ . '/functions.php';

if (isset($_SESSION['user_id'])):
    $navName  = $_SESSION['name'] ?? '';
    $initials = $navInitial = mb_strtoupper(mb_substr($navName, 0, 1, 'UTF-8'), 'UTF-8');
?>
      <span class="avatar"><?= e($initials) ?></span><span class="user-name">Welcome, <?= e($navName) ?></span>
      <a class="btn light" href="logout.php">Log out</a>
<?php else: ?>
      <a class="btn light" href="login_register.php">Log in</a>
<?php endif; ?>
