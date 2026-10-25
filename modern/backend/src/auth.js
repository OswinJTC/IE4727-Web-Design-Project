// Guards routes that need a logged-in user (checkout, orders, cart changes)
export function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Login required' });
  return next();
}

export const userFromRow = (r) => ({
  id: r.user_id,
  name: r.full_name,
  email: r.email,
  phone: r.phone ?? '',
  address: r.address ?? '',
  role: r.role,
});
