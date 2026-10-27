import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api/client';

const ShopContext = createContext(null);

const EMPTY_CART = { lines: [], items: 0, total: 0 };
const GENERIC = 'Something went wrong. Please try again.';

// Session user, catalog, cart and orders for every page. All of it comes from the Express API.
export function ShopProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [user, setUser] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [dishesReady, setDishesReady] = useState(false);
  const [dishesError, setDishesError] = useState(false);
  const [summary, setSummary] = useState(EMPTY_CART);
  const [orders, setOrders] = useState([]);
  const [ordersReady, setOrdersReady] = useState(false);

  // First load: who am I and what is in my cart. Protected pages wait for this, so they never flash a redirect.
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.me(), api.cart()])
      .then(([me, cart]) => {
        if (cancelled) return;
        setUser(me);
        setSummary(cart);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setReady(true);
      });
    return () => { cancelled = true; };
  }, []);

  // The menu loads on its own, so pages can show a loading state while it arrives (and a retry if it fails)
  const loadDishes = useCallback(() => {
    setDishesError(false);
    setDishesReady(false);
    return api.dishes()
      .then(setDishes)
      .catch(() => setDishesError(true))
      .finally(() => setDishesReady(true));
  }, []);
  useEffect(() => { loadDishes(); }, [loadDishes]);

  const refreshOrders = useCallback(async () => {
    setOrders(await api.orders());
    setOrdersReady(true);
  }, []);

  // Orders belong to the logged-in user: load them when someone is logged in, forget them when not
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setOrdersReady(false);
      return;
    }
    refreshOrders().catch(() => setOrdersReady(true));
  }, [user, refreshOrders]);

  // The server says the session is gone (cookie expired, server restarted): act logged out
  const sessionEnded = useCallback(() => {
    setUser(null);
    setSummary(EMPTY_CART);
  }, []);

  const value = useMemo(() => ({
    ready,
    loadError,
    user,
    dishes,
    dishesReady,
    dishesError,
    loadDishes,
    summary,
    orders,
    ordersReady,
    sessionEnded,

    async login(email, password) {
      try {
        const me = await api.login(email, password);
        setUser(me); // the server has logged us in: whatever happens next, we are logged in
        await api.cart().then(setSummary).catch(() => {}); // an empty cart shows until the next change
        return { ok: true, user: me };
      } catch (err) {
        if (err instanceof ApiError && err.status !== 0) return { ok: false, error: err.message, errors: err.errors };
        return { ok: false, error: GENERIC };
      }
    },

    async register(data) {
      try {
        await api.register(data);
        return { ok: true };
      } catch (err) {
        if (err instanceof ApiError && err.errors) return { ok: false, errors: err.errors };
        return { ok: false, errors: { form: GENERIC } };
      }
    },

    async logout() {
      try {
        await api.logout();
      } catch {
        /* the cookie is dropped by the browser either way when the server is reachable */
      }
      setUser(null);
      setSummary(EMPTY_CART);
    },

    // Guests cannot use the cart: the caller sends them to the login page
    async addToCart(id, qty = 1) {
      if (!user) return { status: 'login', added: 0 };
      try {
        const res = await api.cartAdd(id, qty);
        setSummary(res.cart);
        return res.added > 0 ? { status: 'added', added: res.added } : { status: 'max', added: 0 };
      } catch (err) {
        if (err.status === 401) {
          sessionEnded();
          return { status: 'login', added: 0 };
        }
        return { status: 'error', added: 0 };
      }
    },

    async decreaseInCart(id) {
      try {
        setSummary(await api.cartDecrease(id));
      } catch (err) {
        if (err.status === 401) sessionEnded();
      }
    },

    async removeFromCart(id) {
      try {
        setSummary(await api.cartRemove(id));
      } catch (err) {
        if (err.status === 401) sessionEnded();
      }
    },

    async placeOrder(details) {
      let orderId;
      let confirmationEmail;
      try {
        ({ orderId, confirmationEmail } = await api.placeOrder(details));
      } catch (err) {
        if (err.status === 401) {
          sessionEnded();
          return { ok: false, errors: { form: 'Please log in again.' } };
        }
        if (err.status === 422 && err.errors) {
          if (err.errors.form === 'Your cart is empty.') setSummary(await api.cart().catch(() => EMPTY_CART));
          return { ok: false, errors: err.errors };
        }
        return { ok: false, errors: { form: GENERIC } };
      }
      // From here the order exists on the server, so nothing below may report a failure
      setSummary(EMPTY_CART);
      await refreshOrders().catch(() => setOrdersReady(true));
      return { ok: true, orderId, confirmationEmail };
    },

    // Cancellation success is independent of email delivery and reloading the order list.
    async cancelOrder(orderId) {
      let result;
      try {
        result = await api.cancelOrder(orderId);
      } catch (err) {
        if (err.status === 401) sessionEnded();
        await refreshOrders().catch(() => {});
        return { ok: false };
      }
      setOrders((previous) => previous.map((order) => order.id === orderId ? { ...order, status: 'Cancelled' } : order));
      await refreshOrders().catch(() => {});
      return { ok: true, cancellationEmail: result.cancellationEmail };
    },
  }), [ready, loadError, user, dishes, dishesReady, dishesError, loadDishes, summary, orders, ordersReady, refreshOrders, sessionEnded]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside <ShopProvider>');
  return ctx;
}
