<?php
// Shared PDO connection. Use it from any page:
//   require __DIR__ . '/includes/db.php';
//   $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
//   $stmt->execute([$email]);

function db(): PDO
{
    static $pdo = null;               // one connection per request
    if ($pdo !== null) {
        return $pdo;
    }

    $config = require __DIR__ . '/config.php';
    $c = $config['db'];

    $dsn = "mysql:host={$c['host']};dbname={$c['name']};charset={$c['charset']}";
    try {
        $pdo = new PDO($dsn, $c['user'], $c['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false
        ]);
    } catch (PDOException $e) {
        exit('Sorry, the service is unavailable right now.');
    }
    return $pdo;
}
