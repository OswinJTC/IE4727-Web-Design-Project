<?php
require __DIR__ . '/includes/functions.php';
require __DIR__ . '/includes/db.php';

$errors      = [];   // register: field => message, shown under each field
$old         = [];   // register: submitted values, so the form is not wiped on error
$loginErrors = [];   // login: field => message
$loginEmail  = '';   // login: submitted email, so it is not wiped on error

// Add class="bad" to an input whose field has an error
function field_class(array $errors, string $key): string
{
    return isset($errors[$key]) ? ' class="bad"' : '';
}

$action = $_SERVER['REQUEST_METHOD'] === 'POST' ? ($_POST['action'] ?? '') : '';

if ($action === 'register') {
    $name    = trim($_POST['full_name'] ?? '');
    $phone   = preg_replace('/\s+/', '', $_POST['phone'] ?? '');   // accept "9123 4567"
    $email   = strtolower(trim($_POST['email'] ?? ''));
    $address = trim($_POST['address'] ?? '');
    $pass    = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';
    $old     = ['full_name' => $name, 'phone' => $phone, 'email' => $email, 'address' => $address];

    // Same rules as js/login_register.js. The checks here are the ones that count.
    if ($name === '') {
        $errors['name'] = 'Enter your full name.';
    } elseif (!preg_match('/^[A-Za-z ]+$/', $name) || strlen($name) > 100) {
        $errors['name'] = 'Use letters and spaces only.';
    }
    if (!preg_match('/^[689]\d{7}$/', $phone)) {
        $errors['phone'] = 'Enter an 8-digit Singapore number starting with 6, 8 or 9.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
        $errors['email'] = 'Enter a valid email address.';
    }
    if (strlen($address) > 255) {
        $errors['address'] = 'Address must be 255 characters or fewer.';
    }
    // 72 bytes is bcrypt's limit; anything longer would be silently truncated
    if (strlen($pass) < 8 || strlen($pass) > 72 || !preg_match('/[A-Za-z]/', $pass) || !preg_match('/\d/', $pass)) {
        $errors['password'] = 'Use 8-72 characters with at least one letter and one digit.';
    }
    if ($confirm === '') {
        $errors['confirm'] = 'Confirm your password.';
    } elseif ($confirm !== $pass) {
        $errors['confirm'] = 'Passwords do not match.';
    }

    if (!$errors) {
        try {
            // role is never read from the form: new accounts are always customers
            $stmt = db()->prepare(
                "INSERT INTO users (full_name, email, phone, address, password_hash, role)
                 VALUES (?, ?, ?, ?, ?, 'customer')"
            );
            $stmt->execute([
                $name,
                $email,
                $phone,
                $address !== '' ? $address : null,
                password_hash($pass, PASSWORD_DEFAULT),
            ]);

            header('Location: register_success.php');   // Post/Redirect/Get
            exit;
        } catch (PDOException $ex) {
            if ($ex->getCode() === '23000') {            // duplicate key: email is UNIQUE
                $errors['email'] = 'This email is already registered. Use the log in form.';
            } else {
                error_log('Register failed: ' . $ex->getMessage());
                $errors['form'] = 'Something went wrong. Please try again.';
            }
        }
    }
} elseif ($action === 'login') {
    $loginEmail = strtolower(trim($_POST['email'] ?? ''));
    $password   = $_POST['password'] ?? '';

    // Only check the fields are filled in. Password strength rules belong to register;
    // applying them here would reveal the policy and lock out older passwords.
    if (!filter_var($loginEmail, FILTER_VALIDATE_EMAIL) || strlen($loginEmail) > 150) {
        $loginErrors['email'] = 'Enter a valid email address.';
    }
    if ($password === '') {
        $loginErrors['password'] = 'Enter your password.';
    }

    if (!$loginErrors) {
        try {
            $stmt = db()->prepare('SELECT user_id, full_name, password_hash, role FROM users WHERE email = ?');
            $stmt->execute([$loginEmail]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                session_regenerate_id(true);             // new session ID on login
                $_SESSION['user_id'] = (int) $user['user_id'];
                $_SESSION['name']    = $user['full_name'];
                $_SESSION['role']    = $user['role'];

                header('Location: ' . ($user['role'] === 'admin' ? 'admin/dashboard.php' : 'index.php'));
                exit;
            }

            // Same message whether the email or the password was wrong, so it does not reveal which emails exist
            $loginErrors['form'] = 'Incorrect email or password.';
        } catch (PDOException $ex) {
            error_log('Login failed: ' . $ex->getMessage());
            $loginErrors['form'] = 'Something went wrong. Please try again.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoodHub | Log in or Sign up</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="page">
    <header class="topbar simple-header">
      <a class="brand" href="index.php"><span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg></span>FoodHub</a>
      <nav class="nav"><a href="index.php">Home</a><a href="menu.php">Menu</a><a href="#">Contact</a></nav>
      <?php if (isset($_SESSION['user_id'])) { require __DIR__ . '/includes/auth_nav.php'; } ?>
    </header>
    <main>
      <section class="signup-shell auth-shell">
        <aside class="signup-aside">
          <span class="auth-tag">Existing customer</span>
          <h1>Log in</h1>
          <p class="sub">Welcome back. Pick up where you left off.</p>
          <form class="login-form" id="login" method="post" action="login_register.php" novalidate>
            <input type="hidden" name="action" value="login">
            <div class="field">
              <label for="login-email">Email</label>
              <input id="login-email" name="email" type="email" value="<?= e($loginEmail) ?>"<?= field_class($loginErrors, 'email') ?> required>
              <p class="error-text" id="err-login-email" role="alert"><?= e($loginErrors['email'] ?? '') ?></p>
            </div>
            <div class="field">
              <label for="login-password">Password</label>
              <input id="login-password" name="password" type="password"<?= field_class($loginErrors, 'password') ?> required>
              <p class="error-text" id="err-login-password" role="alert"><?= e($loginErrors['password'] ?? '') ?></p>
            </div>
            <?php if (isset($loginErrors['form'])): ?><p class="error-text"><?= e($loginErrors['form']) ?></p><?php endif; ?>
            <button class="btn" type="submit">Log in</button>
            <p class="auth-note">Admins log in here too and are taken to the dashboard.</p>
          </form>
          <div class="why">
            <h2>Why have an account?</h2>
            <div class="benefit"><span class="mini-icon logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s6-5.1 6-10a6 6 0 0 0-12 0c0 4.9 6 10 6 10Z"/><circle cx="12" cy="11" r="2"/></svg></span><span><h3>Saved address</h3><p>Checkout fills in your delivery details.</p></span></div>
            <div class="benefit"><span class="mini-icon logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg></span><span><h3>Live order status</h3><p>Follow every order from kitchen to door.</p></span></div>
            <div class="benefit"><span class="mini-icon logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg></span><span><h3>Email updates</h3><p>Confirmation and status changes in your inbox.</p></span></div>
          </div>
        </aside>
        <div class="signup-main">
          <span class="auth-tag soft">New to FoodHub</span>
          <h1>Create your account</h1>
          <p>All fields are required unless marked optional.</p>
          <form class="signup-form" id="register" method="post" action="login_register.php" novalidate>
            <input type="hidden" name="action" value="register">
            <div class="field"><label for="name">Full name</label><input id="name" name="full_name" type="text" value="<?= e($old['full_name'] ?? '') ?>"<?= field_class($errors, 'name') ?> required><p class="error-text" id="err-name" role="alert"><?= e($errors['name'] ?? '') ?></p></div>
            <div class="field"><label for="phone">Phone</label><input id="phone" name="phone" type="tel" inputmode="numeric" pattern="[689][0-9]{7}" maxlength="8" value="<?= e($old['phone'] ?? '') ?>"<?= field_class($errors, 'phone') ?> required><p class="error-text" id="err-phone" role="alert"><?= e($errors['phone'] ?? '') ?></p><p class="hint">8-digit Singapore number</p></div>
            <div class="field wide"><label for="email">Email</label><input id="email" name="email" type="email" value="<?= e($old['email'] ?? '') ?>"<?= field_class($errors, 'email') ?> required><p class="error-text" id="err-email" role="alert"><?= e($errors['email'] ?? '') ?></p></div>
            <div class="field wide"><label for="address">Delivery address <span class="hint">(optional)</span></label><textarea id="address" name="address" placeholder="Block, street, unit, postal code"<?= field_class($errors, 'address') ?>><?= e($old['address'] ?? '') ?></textarea><?php if (isset($errors['address'])): ?><p class="error-text"><?= e($errors['address']) ?></p><?php endif; ?></div>
            <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" minlength="8"<?= field_class($errors, 'password') ?> required><div class="strength"><span></span><span></span><span></span><span></span></div><p class="error-text" id="err-password" role="alert"><?= e($errors['password'] ?? '') ?></p><p class="hint">Use 8+ characters with a letter and a digit.</p></div>
            <div class="field"><label for="confirm">Confirm password</label><input id="confirm" name="confirm" type="password"<?= field_class($errors, 'confirm') ?> required><p class="error-text" id="err-confirm" role="alert"><?= e($errors['confirm'] ?? '') ?></p></div>
            <div class="wide"><?php if (isset($errors['form'])): ?><p class="error-text"><?= e($errors['form']) ?></p><?php endif; ?><button class="btn" type="submit">Create account</button><p class="auth-footer">By creating an account you can order, track deliveries and view past orders.</p></div>
          </form>
        </div>
      </section>
    </main>
    <footer class="footer">
      <div class="footer-main">
        <div><div class="brand"><span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg></span>FoodHub</div><p>Freshly cooked meals from our kitchen to<br>your door.</p></div>
        <div><h3>Explore</h3><p><a href="menu.php">Menu</a><br><a href="orders.php">My orders</a><br><a href="#">Contact</a></p></div>
        <div><h3>Visit us</h3><p>[Restaurant address]</p><p>Daily, [opening hours]</p></div>
      </div>
      <div class="footer-bottom"><p>&copy; 2026 FoodHub</p></div>
    </footer>
  </div>
  <script src="js/login_register.js"></script>
</body>
</html>
