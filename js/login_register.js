(function () {
    window.addEventListener('load', init)

    function init() {
        initLogin();
        initRegister();
    }

    function initLogin() {
        var form = document.getElementById('login');
        if (!form) return;

        form.email.addEventListener('blur', checkLoginEmail);
        form.addEventListener('submit', validateLogin);
    }

    function initRegister() {
        var form = document.getElementById('register');
        if (!form) return;                       // other pages have no register form

        form.full_name.addEventListener('blur', checkName);
        form.phone.addEventListener('blur', checkPhone);
        form.email.addEventListener('blur', checkEmail);
        form.password.addEventListener('input', onPasswordInput);
        form.confirm.addEventListener('input', function () { checkConfirm(false); });
        form.addEventListener('submit', validateForm);
    }

    function setError(field, id, msg) {
        document.getElementById('err-' + id).textContent = msg;
        field.classList.toggle('bad', msg !== '');
        return msg === '';
    }

    function checkLoginEmail() {
        var f = document.getElementById('login').email;
        return setError(f, 'login-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()) ? '' : 'Enter a valid email address.');
    }

    // Only check the password is filled in; the server decides whether it is correct
    function checkLoginPassword() {
        var f = document.getElementById('login').password;
        return setError(f, 'login-password', f.value === '' ? 'Enter your password.' : '');
    }

    function validateLogin(e) {
        var form = document.getElementById('login');
        var results = [checkLoginEmail(), checkLoginPassword()];   // run both so every error shows
        if (results.indexOf(false) !== -1) {
            e.preventDefault();
            form.querySelector('.bad').focus();
        }
    }

    function checkName() {
        var f = document.getElementById('register').full_name;
        var v = f.value.trim();
        if (v === '') return setError(f, 'name', 'Enter your full name.');
        return setError(f, 'name', /^[A-Za-z ]+$/.test(v) ? '' : 'Use letters and spaces only.');
    }

    function checkPhone() {
        var f = document.getElementById('register').phone;
        var v = f.value.replace(/\s/g, '');        // allow "9123 4567"
        return setError(f, 'phone', /^[689]\d{7}$/.test(v) ? '' : 'Enter an 8-digit Singapore number starting with 6, 8 or 9.');
    }

    function checkEmail() {
        var f = document.getElementById('register').email;
        return setError(f, 'email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()) ? '' : 'Enter a valid email address.');
    }

    // onSubmit is true when the form is being submitted, so an empty field counts as an error
    function checkPassword(onSubmit) {
        var f = document.getElementById('register').password;
        var v = f.value;
        var ok = v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
        if (v === '' && !onSubmit) return setError(f, 'password', '');
        return setError(f, 'password', ok ? '' : 'Use 8+ characters with at least one letter and one digit.');
    }

    function checkConfirm(onSubmit) {
        var form = document.getElementById('register');
        var v = form.confirm.value;
        if (v === '' && !onSubmit) return setError(form.confirm, 'confirm', '');
        return setError(form.confirm, 'confirm', v === '' ? 'Confirm your password.' : v !== form.password.value ? 'Passwords do not match.' : '');
    }

    function onPasswordInput() {
        var form = document.getElementById('register');
        var v = form.password.value, score = 0;
        if (v.length >= 8) score++;
        if (/[A-Za-z]/.test(v) && /\d/.test(v)) score++;
        if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
        if (v.length >= 12 || /[^A-Za-z0-9]/.test(v)) score++;

        var bars = form.querySelectorAll('.strength span');
        for (var i = 0; i < bars.length; i++) bars[i].classList.toggle('on', i < score);

        checkPassword();
        if (form.confirm.value) checkConfirm();
    }

    function validateForm(e) {
        var form = document.getElementById('register');
        // run every check (no short-circuit) so all errors show at once
        var results = [checkName(), checkPhone(), checkEmail(), checkPassword(true), checkConfirm(true)];
        if (results.indexOf(false) !== -1) {
            e.preventDefault();
            var first = form.querySelector('.bad');
            if (first) first.focus();
        }
    }
})()