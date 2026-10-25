// Express 4 does not catch rejected promises, so every async handler goes through wrap()
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Positive integer that fits an INT UNSIGNED column, or null
export function parseId(raw) {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const s = String(raw);
  if (!/^[1-9]\d{0,9}$/.test(s)) return null;
  const n = Number(s);
  return n <= 4294967295 ? n : null;
}

const DB_DOWN = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ENOTFOUND']);

// Last middleware: JSON errors that never leak internals
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  if (DB_DOWN.has(err.code) || err.errors?.some?.((e) => DB_DOWN.has(e.code))) {
    return res.status(503).json({ error: 'Service unavailable' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong' });
}
