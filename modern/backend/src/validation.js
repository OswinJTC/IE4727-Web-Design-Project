// Same rules and messages as traditional/js/login_register.js, the PHP checks and
// modern/frontend/src/lib/validation.js. The server is the one that counts.
// Every validator returns '' when valid, so non-strings are rejected before any string method runs.
const PHONE_RE = /^[689]\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isString = (v) => typeof v === 'string';
const text = (v) => (isString(v) ? v : '');

export const normalizePhone = (v) => text(v).replace(/\s+/g, '');

export function validateName(v) {
  const t = text(v).trim();
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
  const t = text(v).trim();
  return EMAIL_RE.test(t) && t.length <= 150 ? '' : 'Enter a valid email address.';
}

export function validatePassword(v) {
  const s = text(v);
  const ok = s.length >= 8 && s.length <= 72 && /[A-Za-z]/.test(s) && /\d/.test(s);
  return ok ? '' : 'Use 8-72 characters with at least one letter and one digit.';
}

export function validateConfirm(confirm, password) {
  if (text(confirm) === '') return 'Confirm your password.';
  return confirm === password ? '' : 'Passwords do not match.';
}

export function validateAddress(v, { required }) {
  const t = text(v).trim();
  if (required && t === '') return 'Enter a delivery address (up to 255 characters).';
  if (t.length > 255) return required ? 'Enter a delivery address (up to 255 characters).' : 'Address must be 255 characters or fewer.';
  return '';
}

export function validateNotes(v) {
  return text(v).trim().length > 255 ? 'Notes must be 255 characters or fewer.' : '';
}
