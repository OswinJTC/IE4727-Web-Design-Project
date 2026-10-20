<?php
// Shared defaults. Keep credentials in the git-ignored config.local.php.
$config = [
    'mail' => [
        'from' => 'oswin9089@gmail.com',
        'reply_to' => 'oswin9089@gmail.com',
    ],
    'smtp' => [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'encryption' => 'tls', // STARTTLS, with certificate verification enabled.
        'username' => 'oswin9089@gmail.com',
        'password' => getenv('FOODHUB_SMTP_PASSWORD') ?: '',
    ],
    'db' => [
        'host'    => 'localhost',
        'name'    => 'foodhub',
        'user'    => 'root',   // XAMPP default
        'pass'    => '',       // XAMPP default is empty; local testing only
        'charset' => 'utf8mb4',
    ],
];

// Local settings override defaults without committing credentials to Git.
$localFile = __DIR__ . '/config.local.php';
if (is_file($localFile)) {
    $config = array_replace_recursive($config, require $localFile);
}
return $config;
