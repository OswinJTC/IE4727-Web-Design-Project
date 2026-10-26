// The only module that talks to the Express API. Same-origin (/api is proxied to Express in dev),
// so the session cookie is sent automatically.
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error ?? 'Something went wrong. Please try again.');
    this.status = status;
    this.errors = body?.errors ?? null; // { field: message } on validation failures
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, null); // network failure: the server could not be reached
  }
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* an error page that is not JSON */
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  me: () => request('GET', '/auth/me').then((r) => r.user),
  login: (email, password) => request('POST', '/auth/login', { email, password }).then((r) => r.user),
  register: (data) => request('POST', '/auth/register', data),
  logout: () => request('POST', '/auth/logout'),

  dishes: () => request('GET', '/dishes'),
  bestSellers: () => request('GET', '/dishes/best-sellers'),

  cart: () => request('GET', '/cart'),
  cartAdd: (dishId, qty) => request('POST', '/cart/items', { dishId, qty }), // -> { cart, added }
  cartDecrease: (id) => request('POST', `/cart/items/${id}/decrease`).then((r) => r.cart),
  cartRemove: (id) => request('DELETE', `/cart/items/${id}`).then((r) => r.cart),

  orders: () => request('GET', '/orders'),
  placeOrder: (details) => request('POST', '/orders', details), // -> { orderId }
  cancelOrder: (id) => request('POST', `/orders/${id}/cancel`),
};
