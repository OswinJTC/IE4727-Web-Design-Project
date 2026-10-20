<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/db.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: ../login_register.php');
    exit;
}
// Check the database too, so a removed admin role takes effect immediately.
$stmt = db()->prepare('SELECT full_name, role FROM users WHERE user_id = ?');
$stmt->execute([$_SESSION['user_id']]);
$admin = $stmt->get_result()->fetch_assoc();
if (!$admin || $admin['role'] !== 'admin') {
    http_response_code(403);
    exit('You do not have permission to access this page.');
}
$pendingCount = (int) (db()->query("SELECT COUNT(*) FROM orders WHERE status = 'Pending'")->fetch_row()[0] ?? 0);
$flash = $_SESSION['admin_flash'] ?? '';
unset($_SESSION['admin_flash']);

function admin_initials(string $name): string
{
    $parts = preg_split('/\s+/', trim($name));
    return mb_strtoupper(mb_substr($parts[0] ?? '', 0, 1) . (count($parts) > 1 ? mb_substr(end($parts), 0, 1) : ''));
}

function admin_icon(string $name): string
{
    $paths = [
        'logo' => '<path d="M5 12h14a7 7 0 0 1-14 0ZM8 5v3m4-4v3m4-2v3"/>',
        'dashboard' => '<path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/>',
        'orders' => '<path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4"/>',
        'external' => '<path d="M14 3h7v7m0-7L10 14M10 5H4v15h15v-6"/>',
        'logout' => '<path d="M14 3h6v18h-6M3 12h13m-5-5 5 5-5 5"/>',
        'search' => '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
        'edit' => '<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14z"/>',
        'delete' => '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    ];
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . ($paths[$name] ?? $paths['logo']) . '</svg>';
}
