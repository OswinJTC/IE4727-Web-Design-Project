"""Exercise real PHP checkout against an isolated MySQL database and a fake mail transport.

Run: python3 traditional/script/test_checkout_email.py (XAMPP MySQL must be running).
No real emails are sent and the existing foodhub database is never changed.
"""
import http.cookiejar
import json
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request
import uuid

SOURCE = Path(__file__).resolve().parents[1]
PHP = '/Applications/XAMPP/xamppfiles/bin/php'
MYSQL = '/Applications/XAMPP/xamppfiles/bin/mysql'
DATABASE = 'foodhub_checkout_test_' + uuid.uuid4().hex[:12]


def sql(statement):
    return subprocess.check_output([MYSQL, '-uroot', '-N', '-B', '-e', statement], text=True).strip()


FAKE_MAILER = r'''<?php
namespace PHPMailer\PHPMailer;
class PHPMailer {
    public function __construct($exceptions = false) {}
    public function isSMTP() {}
    public function setFrom($email, $name = '') {}
    public function addReplyTo($email, $name = '') {}
    public function addAddress($email) { $this->recipient = $email; }
    public function send() {
        preg_match('/order #(\d+)/i', $this->Subject, $match);
        $id = (int) ($match[1] ?? 0);
        $db = new \mysqli('localhost', 'root', '', getenv('FOODHUB_TEST_DB'));
        $order = $db->query('SELECT status, total_amount FROM orders WHERE order_id = ' . $id)->fetch_assoc();
        $count = $db->query('SELECT COUNT(*) FROM order_items WHERE order_id = ' . $id)->fetch_row()[0];
        file_put_contents(getenv('FOODHUB_TEST_MAILBOX'), json_encode([
            'to' => $this->recipient, 'subject' => $this->Subject, 'body' => $this->Body,
            'committed' => $order !== null && $count > 0, 'order' => $order,
        ]) . PHP_EOL, FILE_APPEND | LOCK_EX);
        if (is_file(getenv('FOODHUB_TEST_FAIL_MAIL'))) throw new \RuntimeException('Test SMTP failure');
        return true;
    }
}
'''


def main():
    server = None
    try:
        with tempfile.TemporaryDirectory(prefix='foodhub-checkout-') as directory:
            work = Path(directory)
            app = work / 'app'
            shutil.copytree(SOURCE, app, ignore=shutil.ignore_patterns('vendor', 'config.local.php', '__pycache__'))
            for filename in ['schema.sql', 'seed.sql']:
                source = (SOURCE / 'sql' / filename).read_text()
                isolated = re.sub(r'\b(CREATE DATABASE IF NOT EXISTS|USE) foodhub;', r'\1 ' + DATABASE + ';', source)
                sql(isolated)
            (app / 'includes/config.local.php').write_text("<?php return ["
                f"'db' => ['name' => '{DATABASE}'],"
                "'smtp' => ['password' => 'test-password']];")
            (app / 'vendor').mkdir()
            (app / 'vendor/autoload.php').write_text(FAKE_MAILER)
            mailbox = work / 'mail.jsonl'
            fail_mail = work / 'fail-mail'
            sessions = work / 'sessions'
            sessions.mkdir()
            with socket.socket() as probe:
                probe.bind(('127.0.0.1', 0))
                port = probe.getsockname()[1]
            env = {**os.environ, 'FOODHUB_TEST_DB': DATABASE, 'FOODHUB_TEST_MAILBOX': str(mailbox), 'FOODHUB_TEST_FAIL_MAIL': str(fail_mail)}
            with (work / 'server.log').open('w') as log:
                server = subprocess.Popen([PHP, '-d', f'session.save_path={sessions}', '-S', f'127.0.0.1:{port}', '-t', str(app)], env=env, stdout=log, stderr=log)
            opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
            base = f'http://127.0.0.1:{port}'

            def request(path, data=None):
                encoded = urllib.parse.urlencode(data).encode() if data is not None else None
                with opener.open(base + path, encoded, timeout=10) as response:
                    return response.geturl(), response.read().decode()

            def messages():
                return [json.loads(line) for line in mailbox.read_text().splitlines()] if mailbox.exists() else []

            def count_orders():
                return int(sql(f'SELECT COUNT(*) FROM {DATABASE}.orders'))

            for attempt in range(40):
                try:
                    request('/login_register.php')
                    break
                except (OSError, urllib.error.URLError):
                    if server.poll() is not None or attempt == 39:
                        raise RuntimeError('The isolated PHP server could not start')
                    time.sleep(.1)

            assert 'href="admin/orders.php"' not in request('/index.php')[1]
            request('/login_register.php', {'action': 'login', 'email': 'aisha@example.com', 'password': 'Password123'})
            assert 'href="admin/orders.php"' not in request('/index.php')[1]
            dish_id = int(sql(f"SELECT item_id FROM {DATABASE}.menu_items WHERE name = 'Curry laksa'"))
            add = f'/cart.php?product_id={dish_id}&action=add&qty=2'
            details = {'action': 'place_order', 'address': ' 1 Test Street ', 'phone': '9123 4567', 'payment': 'cash', 'notes': ' Less spicy '}
            before = count_orders()

            request(add)
            sql(f'UPDATE {DATABASE}.menu_items SET price = 8.15 WHERE item_id = {dish_id}')
            url, page = request('/checkout.php', {**details, 'email': 'attacker@example.com', 'total': '.01'})
            assert 'orders.php?id=' in url, 'Checkout did not redirect to the saved order'
            assert 'Your confirmation email is on its way.' in page
            assert count_orders() == before + 1
            receipt = messages()[0]
            assert receipt['to'] == 'aisha@example.com' and receipt['committed']
            for value in ['Aisha Lim', '2 × Curry laksa @ $8.15 = $16.30', 'Total: $16.30', '1 Test Street', '91234567', 'Cash on delivery', 'Less spicy']:
                assert value in receipt['body'], f'Missing receipt detail: {value}'
            print('PASS: confirmation is sent after commit to the account email, using current DB prices.')

            request('/checkout.php', details)
            request('/orders.php')
            assert count_orders() == before + 1 and len(messages()) == 1
            print('PASS: duplicate submission and success-page refresh do not duplicate orders or emails.')

            request(add)
            request('/checkout.php', {**details, 'address': ''})
            assert count_orders() == before + 1 and len(messages()) == 1
            print('PASS: invalid checkout does not create an order or send an email.')

            sql(f'UPDATE {DATABASE}.menu_items SET is_available = 0 WHERE item_id = {dish_id}')
            _, page = request('/checkout.php', details)
            assert 'A dish is no longer available. Please review your cart.' in page
            assert count_orders() == before + 1 and len(messages()) == 1
            sql(f'UPDATE {DATABASE}.menu_items SET is_available = 1 WHERE item_id = {dish_id}')
            print('PASS: dishes hidden after adding to the cart cannot be ordered or emailed.')

            fail_mail.touch()
            url, page = request('/checkout.php', details)
            assert 'orders.php?id=' in url and "couldn't send the confirmation email" in page
            assert count_orders() == before + 2 and len(messages()) == 2
            request('/checkout.php', details)
            assert count_orders() == before + 2 and len(messages()) == 2
            fail_mail.unlink()
            print('PASS: SMTP failure preserves the order and empties the cart.')

            sql(f"CREATE TRIGGER {DATABASE}.fail_checkout BEFORE INSERT ON {DATABASE}.order_items FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'test failure'")
            request(add)
            _, page = request('/checkout.php', details)
            assert 'Something went wrong. Please try again.' in page
            assert count_orders() == before + 2 and len(messages()) == 2
            sql(f'DROP TRIGGER {DATABASE}.fail_checkout')
            print('PASS: rolled-back checkout sends no confirmation.')

            order_id = int(urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)['id'][0])
            request('/login_register.php', {'action': 'login', 'email': 'admin@foodhub.test', 'password': 'Password123'})
            assert 'href="admin/orders.php"' in request('/index.php')[1]
            request('/admin/orders.php', {'action': 'update_status', 'order_id': order_id, 'status': 'Preparing'})
            assert len(messages()) == 3 and 'Preparing' in messages()[-1]['subject']
            print('PASS: admin status emails still use the shared mail transport.')
            print('PASS: the storefront Admin link is visible only to administrators.')
    finally:
        if server is not None:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()
        assert DATABASE.startswith('foodhub_checkout_test_')
        sql(f'DROP DATABASE IF EXISTS {DATABASE}')


if __name__ == '__main__':
    main()
