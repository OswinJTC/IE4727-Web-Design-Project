<?php
use PHPMailer\PHPMailer\PHPMailer;

// Checkout confirmations and admin status updates share one SMTP transport.
function foodhub_send_email(string $email, string $subject, string $body): bool
{
    $config = require __DIR__ . '/config.php';
    $smtp = $config['smtp'];
    $from = $config['mail']['from'];
    $replyTo = $config['mail']['reply_to'] ?: $from;
    $password = preg_replace('/\s+/', '', $smtp['password']);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return false;
    if ($password === '') {
        error_log('FoodHub: set the Gmail App Password in includes/config.local.php.');
        return false;
    }
    $autoload = __DIR__ . '/../vendor/autoload.php';
    if (!is_file($autoload)) {
        error_log('FoodHub: SMTP dependency missing. Run composer install.');
        return false;
    }
    require_once $autoload;

    try {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $smtp['host'];
        $mail->Port = (int) $smtp['port'];
        $mail->SMTPSecure = $smtp['encryption'];
        $mail->SMTPAuth = true;
        $mail->Username = $smtp['username'];
        $mail->Password = $password;
        $mail->Timeout = 10;
        $mail->Timelimit = 15;
        $mail->SMTPDebug = 0;
        $mail->CharSet = 'UTF-8';
        $mail->setFrom($from, 'FoodHub');
        $mail->addReplyTo($replyTo, 'FoodHub');
        $mail->addAddress($email);
        $mail->Subject = $subject;
        $mail->Body = $body;
        return $mail->send();
    } catch (Throwable $ex) {
        // Never expose credentials or SMTP debug transcripts in the page or log.
        error_log('FoodHub: SMTP notification failed. Check the SMTP login and connection settings.');
        return false;
    }
}

function email_order_status(string $email, int $orderId, string $status): bool
{
    if ($orderId < 1 || !in_array($status, ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'], true)) return false;
    return foodhub_send_email($email, "FoodHub order #{$orderId}: {$status}",
        "Your FoodHub order #{$orderId} is now {$status}.\n\n"
        . "Log in to FoodHub to view your order details.\n"
        . 'Thank you for ordering with us.');
}

function email_order_confirmation(string $email, array $order): bool
{
    $payments = ['cash' => 'Cash on delivery', 'card' => 'Card on delivery', 'paynow' => 'PayNow'];
    $lines = [
        'Hi ' . $order['name'] . ',',
        '',
        'Thank you! Your FoodHub order #' . $order['id'] . ' has been placed.',
        'Status: Pending',
        '',
    ];
    foreach ($order['items'] as $item) {
        $lines[] = $item['quantity'] . ' × ' . $item['name']
            . ' @ $' . number_format($item['unit_price'], 2, '.', '')
            . ' = $' . number_format($item['quantity'] * $item['unit_price'], 2, '.', '');
    }
    $lines[] = 'Total: $' . number_format($order['total'], 2, '.', '');
    $lines[] = '';
    $lines[] = 'Payment: ' . $payments[$order['payment']];
    $lines[] = 'Delivery address: ' . $order['address'];
    $lines[] = 'Contact phone: ' . $order['phone'];
    if ($order['notes'] !== '') $lines[] = 'Kitchen notes: ' . $order['notes'];
    $lines[] = '';
    $lines[] = 'Log in to FoodHub to track your order.';
    $lines[] = 'Thank you for ordering with us.';
    return foodhub_send_email($email, 'FoodHub: Order #' . $order['id'] . ' confirmed', implode("\n", $lines));
}
