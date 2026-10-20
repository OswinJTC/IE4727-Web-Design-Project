<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// SMTP notification for the customer who placed the updated order.
function email_order_status(string $email, int $orderId, string $status): bool
{
    $config = require __DIR__ . '/config.php';
    $smtp = $config['smtp'];
    $from = $config['mail']['from'];
    $replyTo = $config['mail']['reply_to'] ?: $from;
    $password = preg_replace('/\s+/', '', $smtp['password']);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $orderId < 1
        || !in_array($status, ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'], true)) return false;
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
        $mail->Subject = "FoodHub order #{$orderId}: {$status}";
        $mail->Body = "Your FoodHub order #{$orderId} is now {$status}.\n\n"
            . "Log in to FoodHub to view your order details.\n"
            . 'Thank you for ordering with us.';
        return $mail->send();
    } catch (Exception $ex) {
        // Never expose credentials or SMTP debug transcripts in the page or log.
        error_log('FoodHub: SMTP notification failed for order #' . $orderId . '. Check the SMTP login and connection settings.');
        return false;
    }
}
