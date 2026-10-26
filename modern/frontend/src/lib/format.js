const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 7.2 -> "$7.20"
export function money(amount) {
  return '$' + Number(amount).toFixed(2);
}

// ISO string -> "8 Oct, 14:52" (same as PHP date('j M, H:i'))
export function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function plural(n, one, many) {
  return n === 1 ? one : many;
}
