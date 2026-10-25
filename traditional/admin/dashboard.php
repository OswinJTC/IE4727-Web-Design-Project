<?php
// Keep the existing admin login destination working until a dashboard is added.
require __DIR__ . '/auth_check.php';
header('Location: orders.php');
exit;
