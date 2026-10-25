<?php
// Shared mysqli connection. Use it from any page:
//   require __DIR__ . '/includes/db.php';
//   $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
//   $stmt->execute([$email]);                       // values are bound as strings
//   $user = $stmt->get_result()->fetch_assoc();     // one row, or null

function db(): mysqli
{
    static $db = null;                // one connection per request
    if ($db !== null) {
        return $db;
    }

    $config = require __DIR__ . '/config.php';
    $c = $config['db'];

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);   // failures throw mysqli_sql_exception
    try {
        $db = new mysqli($c['host'], $c['user'], $c['pass'], $c['name']);
        $db->set_charset($c['charset']);
        $db->options(MYSQLI_OPT_INT_AND_FLOAT_NATIVE, 1);        // ints stay ints for plain query() too
    } catch (mysqli_sql_exception $e) {
        exit('Sorry, the service is unavailable right now.');
    }
    return $db;
}
