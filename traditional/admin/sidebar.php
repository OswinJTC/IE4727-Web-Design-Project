<aside class="admin-sidebar">
  <a class="brand admin-brand" href="menu_manage.php"><span class="logo"><?= admin_icon('logo') ?></span>FoodHub <span class="admin-tag">ADMIN</span></a>
  <nav class="admin-nav" aria-label="Administration">
    <a href="menu_manage.php"<?= $activePage === 'menu' ? ' class="active" aria-current="page"' : '' ?>><?= admin_icon('logo') ?> Manage menu</a>
    <a href="orders.php"<?= $activePage === 'orders' ? ' class="active" aria-current="page"' : '' ?>><?= admin_icon('orders') ?> Manage orders <span class="admin-count"><?= $pendingCount ?></span></a>
  </nav>
  <p class="admin-store-label">STORE</p>
  <a class="admin-store-link" href="../index.php"><?= admin_icon('external') ?> View storefront</a>
  <div class="admin-profile"><span class="admin-avatar dark"><?= e(admin_initials($admin['full_name'])) ?></span><div><strong><?= e($admin['full_name']) ?></strong><small>Administrator</small></div><a href="../logout.php" aria-label="Log out"><?= admin_icon('logout') ?></a></div>
</aside>
