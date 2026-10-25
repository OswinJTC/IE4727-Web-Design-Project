// express-session gives every request its own copy of the session and the last save wins. Two requests from the
// same browser that overlap (a double click on Place order, quick taps on +) would both read the old cart.
// So requests that change the cart or place/cancel orders wait their turn per session cookie. This runs BEFORE
// the session middleware, so the session is only loaded once the previous request has saved it.
// (Single process only: with several server processes this needs a shared store with locking.)
const COOKIE = 'foodhub.sid';
const tails = new Map(); // cookie value -> promise of the last queued request

const cookieValue = (header = '') => {
  const part = header.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`));
  return part ? part.slice(COOKIE.length + 1) : null;
};

export function serializeBySession(req, res, next) {
  const key = cookieValue(req.headers.cookie);
  const changes = req.method !== 'GET' && req.method !== 'HEAD';
  if (!key || !changes) return next(); // visitors without a session have nothing to protect

  const previous = tails.get(key) ?? Promise.resolve();
  let release;
  const mine = new Promise((resolve) => { release = resolve; });
  const tail = previous.then(() => mine);
  tails.set(key, tail);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    release();
    if (tails.get(key) === tail) tails.delete(key); // nothing queued behind us
  };
  res.on('finish', finish); // the session is saved before the response ends
  res.on('close', finish); // client went away
  previous.then(next);
  return undefined;
}
