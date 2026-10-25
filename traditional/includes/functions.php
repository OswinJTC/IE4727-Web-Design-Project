<?php
// Shared helpers: session, output escaping, flash messages.

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Escape a value for safe output inside HTML.
function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}