// Same rules as traditional/js/login_register.js and the PHP checks. Each returns '' when valid.
const PHONE_RE = /^[689]\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizePhone = (v) => String(v ?? '').replace(/\s+/g, '');

export function validateName(v) {
  const t = String(v ?? '').trim();
  if (t === '') return 'Enter your full name.';
  if (!/^[A-Za-z ]+$/.test(t) || t.length > 100) return 'Use letters and spaces only.';
  return '';
}

export function validatePhone(v) {
  return PHONE_RE.test(normalizePhone(v)) ? '' : 'Enter an 8-digit Singapore number starting with 6, 8 or 9.';
}

// Checkout uses a shorter message for the same rule
export function validateCheckoutPhone(v) {
  return PHONE_RE.test(normalizePhone(v)) ? '' : 'Enter an 8-digit number starting with 6, 8 or 9';
}

export function validateEmail(v) {
  const t = String(v ?? '').trim();
  return EMAIL_RE.test(t) && t.length <= 150 ? '' : 'Enter a valid email address.';
}

export function validatePassword(v) {
  const s = String(v ?? '');
  const ok = s.length >= 8 && s.length <= 72 && /[A-Za-z]/.test(s) && /\d/.test(s);
  return ok ? '' : 'Use 8-72 characters with at least one letter and one digit.';
}

export function validateConfirm(confirm, password) {
  if (confirm === '') return 'Confirm your password.';
  return confirm === password ? '' : 'Passwords do not match.';
}

export function validateLoginPassword(v) {
  return v === '' ? 'Enter your password.' : '';
}

export function validateAddress(v, { required }) {
  const t = String(v ?? '').trim();
  if (required && t === '') return 'Enter a delivery address (up to 255 characters).';
  if (t.length > 255) return required ? 'Enter a delivery address (up to 255 characters).' : 'Address must be 255 characters or fewer.';
  return '';
}

export function validateNotes(v) {
  return String(v ?? '').trim().length > 255 ? 'Notes must be 255 characters or fewer.' : '';
}

// 0-4 bars, same scoring as the PHP page's script
export function passwordStrength(v) {
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Za-z]/.test(v) && /\d/.test(v)) score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (v.length >= 12 || /[^A-Za-z0-9]/.test(v)) score++;
  return score;
}
