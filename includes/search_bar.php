<?php
// Navbar search box: a plain GET form that opens menu.php?q=... (Enter submits, no JavaScript needed).
// The box keeps the current search text so it is still visible on the results page.
require_once __DIR__ . '/functions.php';
?>
      <form class="search" action="menu.php" method="get" role="search">
        <span class="search-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></span>
        <input type="search" name="q" placeholder="Search dishes, e.g. laksa" aria-label="Search dishes" maxlength="100" value="<?= e($_GET['q'] ?? '') ?>">
      </form>
