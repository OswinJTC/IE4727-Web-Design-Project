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
      <a class="brand" href="index.html"><span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg></span>FoodHub</a>
      <nav class="nav"><a href="index.html">Home</a><a href="menu.html">Menu</a><a href="#">Contact</a></nav>
    </header>
    <main>
      <section class="signup-shell auth-shell">
        <aside class="signup-aside">
          <span class="auth-tag">Existing customer</span>
          <h1>Log in</h1>
          <p class="sub">Welcome back. Pick up where you left off.</p>
          <form class="login-form" id="login">
            <div class="field"><label for="login-email">Email</label><input id="login-email" name="email" type="email" required></div>
            <div class="field"><label for="login-password">Password</label><input id="login-password" name="password" type="password" required></div>
            <label class="remember"><input type="checkbox" name="remember" checked> Remember my email for 30 days</label>
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
          <form class="signup-form" id="register">
            <div class="field"><label for="name">Full name</label><input id="name" name="full_name" type="text" required></div>
            <div class="field"><label for="phone">Phone</label><input id="phone" name="phone" type="tel" inputmode="numeric" pattern="[689][0-9]{7}" maxlength="8" required><p class="hint">8-digit Singapore number</p></div>
            <div class="field wide"><label for="email">Email</label><input id="email" name="email" type="email" required></div>
            <div class="field wide"><label for="address">Delivery address <span class="hint">(optional)</span></label><textarea id="address" name="address" placeholder="Block, street, unit, postal code"></textarea></div>
            <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" minlength="8" required><div class="strength"><span></span><span></span><span></span><span></span></div><p class="hint">Use 8+ characters with a letter and a digit.</p></div>
            <div class="field"><label for="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" required></div>
            <div class="wide"><button class="btn" type="submit">Create account</button><p class="auth-footer">By creating an account you can order, track deliveries and view past orders.</p></div>
          </form>
        </div>
      </section>
    </main>
    <footer class="footer">
      <div class="footer-main">
        <div><div class="brand"><span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12a6 6 0 0 1-12 0Z"/><path d="M8 6v2M14 5v3"/></svg></span>FoodHub</div><p>Freshly cooked meals from our kitchen to<br>your door.</p></div>
        <div><h3>Explore</h3><p><a href="menu.html">Menu</a><br><a href="orders.html">My orders</a><br><a href="#">Contact</a></p></div>
        <div><h3>Visit us</h3><p>[Restaurant address]</p><p>Daily, [opening hours]</p></div>
      </div>
      <div class="footer-bottom"><p>&copy; 2026 FoodHub</p></div>
    </footer>
  </div>
</body>
</html>
