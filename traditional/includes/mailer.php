<?php
use PHPMailer\PHPMailer\PHPMailer;

// Checkout confirmations and admin status updates share one SMTP transport.
function foodhub_send_email(string $email, string $subject, string $body, string $html): bool
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
        $mail->isHTML(true);
        $mail->Body = $html;
        $mail->AltBody = $body;
        return $mail->send();
    } catch (Throwable $ex) {
        // Never expose credentials or SMTP debug transcripts in the page or log.
        error_log('FoodHub: SMTP notification failed. Check the SMTP login and connection settings.');
        return false;
    }
}

function foodhub_email_escape($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function foodhub_email_status_content(string $status): array
{
    $statuses = [
        'Pending' => ['title' => 'Order received.', 'description' => 'Your order is confirmed and waiting to be prepared.', 'background' => '#fff2df', 'color' => '#a34e06'],
        'Preparing' => ['title' => 'Your order is being prepared.', 'description' => 'Our kitchen is preparing your meal. We’ll keep you updated on its progress.', 'background' => '#e8eeff', 'color' => '#234fce'],
        'Out for delivery' => ['title' => 'Your order is out for delivery.', 'description' => 'Your order is out for delivery. Please keep your phone nearby so the delivery team can reach you.', 'background' => '#f1e8ff', 'color' => '#7428d5'],
        'Delivered' => ['title' => 'Your order has been delivered.', 'description' => 'Your order has been marked as delivered. Thank you for choosing FoodHub.', 'background' => '#e6f4e9', 'color' => '#198246'],
        'Cancelled' => ['title' => 'Your order has been cancelled.', 'description' => 'You can review the details of this cancelled order in My orders.', 'background' => '#eeece9', 'color' => '#625b55'],
    ];
    return $statuses[$status];
}

// Presentation tables and inline styles also work in email clients with limited CSS support.
function foodhub_email_layout(int $orderId, string $status, string $title, string $description, string $content = '', string $label = 'ORDER STATUS UPDATE', ?float $total = null): string
{
    $appearance = foodhub_email_status_content($status);
    $progress = '';
    if ($status !== 'Cancelled') {
        $stages = ['Pending', 'Preparing', 'Out for delivery', 'Delivered'];
        $labels = ['Received', 'Preparing', 'Delivery', 'Delivered'];
        $current = array_search($status, $stages, true);
        $progress = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;table-layout:fixed"><tr>';
        foreach ($stages as $index => $stage) {
            $padding = $index === 3 ? 0 : 6;
            $color = $index <= $current ? '#c2410c' : '#e7e3df';
            $weight = $index === $current ? 700 : 400;
            $textColor = $index === $current ? $appearance['color'] : '#78716c';
            $progress .= '<td width="25%" valign="top" style="padding-right:' . $padding . 'px"><div style="height:4px;background:' . $color . ';border-radius:4px;font-size:1px;line-height:4px">&nbsp;</div><p style="margin:8px 0 0;font-size:11px;line-height:1.5;font-weight:' . $weight . ';color:' . $textColor . '"><span style="display:block;margin-bottom:3px;font-size:10px;line-height:1.4">STEP ' . ($index + 1) . '</span>' . $labels[$index] . '</p></td>';
        }
        $progress .= '</tr></table>';
    }
    $value = $total === null
        ? '<span style="display:inline-block;padding:7px 11px;border-radius:20px;background:' . $appearance['background'] . ';color:' . $appearance['color'] . ';font-size:12px;line-height:1.5;font-weight:700">' . foodhub_email_escape($status) . '</span>'
        : '<p style="margin:0;font-size:28px;line-height:1.1;font-weight:700;color:#c2410c">$' . number_format($total, 2, '.', '') . '</p>';
    $statusRow = $total === null ? '' : '<tr><td colspan="2" style="padding:12px 18px;border-top:1px solid #e7e3df;font-size:12px;line-height:1.6;color:#6d6560"><strong style="color:#a34e06">Pending</strong> &middot; Waiting for preparation</td></tr>';
    $summary = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border:1px solid #e7e3df;border-radius:12px"><tr>'
        . '<td width="50%" valign="top" style="padding:18px"><p style="margin:0 0 8px;font-size:10px;letter-spacing:1px;white-space:nowrap;color:#78716c">ORDER NUMBER</p><p style="margin:0;font-size:24px;font-weight:700">#' . (int) $orderId . '</p></td>'
        . '<td width="50%" align="right" valign="top" style="padding:18px"><p style="margin:0 0 8px;font-size:10px;letter-spacing:1px;white-space:nowrap;color:#78716c">' . ($total === null ? 'CURRENT STATUS' : 'ORDER TOTAL') . '</p>' . $value . '</td>'
        . '</tr>' . $statusRow . '</table>';
    $tracking = $progress === '' ? '' : '<p style="margin:24px 0 0;font-size:10px;font-weight:700;letter-spacing:1px;color:#78716c">ORDER PROGRESS</p>' . $progress;
    return strtr(<<<'HTML'
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>FoodHub · Order #{{ORDER_ID}}</title>
<style>@media only screen and (max-width:480px){.email-padding{padding:24px 20px!important}.email-title{font-size:28px!important}.email-outer{padding:16px 8px!important}}</style></head>
<body style="margin:0;padding:0;background:#f6f5f3;color:#1c1917;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;font-size:1px;color:#f6f5f3;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">{{DESCRIPTION}} Order #{{ORDER_ID}}.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f5f3"><tr><td align="center" class="email-outer" style="padding:36px 12px">
<!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e7e3df;border-radius:16px;overflow:hidden">
<tr><td style="height:5px;background:#c2410c;font-size:1px;line-height:5px">&nbsp;</td></tr>
<tr><td class="email-padding" style="padding:32px">
<p style="margin:0 0 24px;font-size:24px;font-weight:700;letter-spacing:-1px"><span style="color:#c2410c">●</span> FoodHub</p>
<p style="margin:0;color:#c2410c;font-size:11px;font-weight:700;letter-spacing:1.5px">{{LABEL}}</p>
<h1 class="email-title" style="margin:12px 0 14px;font-size:32px;line-height:1.2;letter-spacing:-1px;font-weight:700">{{TITLE}}</h1>
<p style="margin:0 0 24px;color:#6d6560;font-size:15px;line-height:1.7">{{DESCRIPTION}}</p>
{{SUMMARY}}{{TRACKING}}{{CONTENT}}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:28px"><tr><td style="padding:18px;background:#fff4ee;border-radius:10px"><p style="margin:0;font-size:13px;line-height:1.7;color:#7c3a1e">View your order in <strong>My orders</strong> when you log in to FoodHub.</p></td></tr></table>
</td></tr>
<tr><td class="email-padding" style="padding:22px 32px;background:#faf9f7;border-top:1px solid #e7e3df"><p style="margin:0 0 6px;font-size:13px;font-weight:700">Thanks for choosing FoodHub.</p><p style="margin:0;color:#78716c;font-size:11px;line-height:1.7">This is an automatic update about your order. Keep this email for your records.</p></td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
<p style="margin:20px 0 0;color:#a8a29e;font-size:11px">FoodHub · Freshly cooked, thoughtfully delivered.</p>
</td></tr></table></body></html>
HTML, [
        '{{ORDER_ID}}' => foodhub_email_escape($orderId),
        '{{DESCRIPTION}}' => foodhub_email_escape($description),
        '{{LABEL}}' => foodhub_email_escape($label),
        '{{TITLE}}' => foodhub_email_escape($title),
        '{{SUMMARY}}' => $summary,
        '{{TRACKING}}' => $tracking,
        '{{CONTENT}}' => $content,
    ]);
}

function email_order_status(string $email, int $orderId, string $status): bool
{
    if ($orderId < 1 || !in_array($status, ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'], true)) return false;
    $appearance = foodhub_email_status_content($status);
    return foodhub_send_email($email, "FoodHub order #{$orderId}: {$status}",
        "Your FoodHub order #{$orderId} is now {$status}.\n\n"
        . "Log in to FoodHub to view your order details.\n"
        . 'Thank you for ordering with us.',
        foodhub_email_layout($orderId, $status, $appearance['title'], $appearance['description']));
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
    $rowsHtml = '';
    foreach ($order['items'] as $item) {
        $lines[] = $item['quantity'] . ' × ' . $item['name']
            . ' @ $' . number_format($item['unit_price'], 2, '.', '')
            . ' = $' . number_format($item['quantity'] * $item['unit_price'], 2, '.', '');
        $rowsHtml .= '<tr><td style="padding:16px 12px 16px 0;border-bottom:1px solid #eeeae6;overflow-wrap:anywhere"><p style="margin:0 0 5px;font-size:14px;line-height:1.5;font-weight:700">' . foodhub_email_escape($item['name'])
            . '</p><p style="margin:0;font-size:12px;color:#78716c">$' . number_format($item['unit_price'], 2, '.', '') . ' each</p></td><td align="center" style="padding:16px 8px;border-bottom:1px solid #eeeae6;font-size:13px">' . (int) $item['quantity']
            . '</td><td align="right" style="padding:16px 0;border-bottom:1px solid #eeeae6;font-size:14px;white-space:nowrap">$' . number_format($item['quantity'] * $item['unit_price'], 2, '.', '') . '</td></tr>';
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
    $content = '<h2 style="margin:28px 0 14px;font-size:16px;font-weight:700">Your order</h2>'
        . '<table aria-label="Order items" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse"><thead><tr style="color:#78716c;font-size:10px;letter-spacing:1px;text-align:left"><th scope="col" style="padding:10px 0;border-bottom:1px solid #e7e3df">ITEM</th><th scope="col" width="40" style="padding:10px 8px;border-bottom:1px solid #e7e3df;text-align:center">QTY</th><th scope="col" width="90" style="padding:10px 0;border-bottom:1px solid #e7e3df;text-align:right">AMOUNT</th></tr></thead><tbody>' . $rowsHtml . '</tbody></table>'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:20px 0;font-size:15px;font-weight:700">Total</td><td align="right" style="padding:20px 0;font-size:26px;font-weight:700;color:#c2410c">$' . number_format($order['total'], 2, '.', '') . '</td></tr></table>'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border:1px solid #e7e3df;border-radius:10px"><tr><td style="padding:20px;overflow-wrap:anywhere"><p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:1px;color:#78716c">DELIVERY DETAILS</p><p style="margin:0;font-size:14px;line-height:1.7"><strong>' . foodhub_email_escape($order['name']) . '</strong><br>' . nl2br(foodhub_email_escape($order['address']), false) . '<br>' . foodhub_email_escape($order['phone']) . '</p><p style="margin:18px 0 6px;font-size:10px;font-weight:700;letter-spacing:1px;color:#78716c">PAYMENT</p><p style="margin:0;font-size:14px;line-height:1.7">' . foodhub_email_escape($payments[$order['payment']]) . '</p>';
    if ($order['notes'] !== '') {
        $content .= '<p style="margin:18px 0 6px;font-size:10px;font-weight:700;letter-spacing:1px;color:#78716c">KITCHEN NOTES</p><p style="margin:0;font-size:14px;line-height:1.7">' . nl2br(foodhub_email_escape($order['notes']), false) . '</p>';
    }
    $content .= '</td></tr></table>';
    $html = foodhub_email_layout($order['id'], 'Pending', 'Order placed successfully.',
        'Hi ' . $order['name'] . ', we’ve received your order. We’ll let you know when preparation starts.',
        $content, 'ORDER CONFIRMATION', $order['total']);
    return foodhub_send_email($email, 'FoodHub: Order #' . $order['id'] . ' confirmed', implode("\n", $lines), $html);
}
