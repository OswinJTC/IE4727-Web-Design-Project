<?php
require __DIR__ . '/includes/functions.php';

$_SESSION = [];                       // clear the data
if (ini_get('session.use_cookies')) { // expire the session cookie in the browser
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 3600, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
}
session_destroy();

header('Location: index.php');
exit;
