import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { api } from '../../api/client';
import { useShop } from '../../context/ShopContext';
import { LogoIcon, SearchIcon } from '../../components/icons';
import './admin.css';

export const CATEGORIES = ['Mains', 'Sides', 'Drinks', 'Desserts'];
export const STATUSES = ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'];
export const money = (amount) => `$${Number(amount).toFixed(2)}`;
export const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
export const payments = { cash: 'Cash', card: 'Card', paynow: 'PayNow' };

// Shared admin UI and state keep all admin screens on the same session and data.
const AdminContext = createContext(null);
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminLayout');
  return context;
}

export function AdminIcon({ name }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    orders: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7M21 3 10 14" />
        <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
      </>
    ),
    logout: (
      <>
        <path d="M9 4H4v16h5M10 12h11m-5-5 5 5-5 5" />
      </>
    ),
    edit: (
      <>
        <path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function StatusBadge({ status }) {
  const style = {
    Pending: 'pending',
    Preparing: 'preparing',
    'Out for delivery': 'delivery',
    Delivered: 'delivered',
    Cancelled: 'cancelled',
  };
  return <span className={`admin-status ${style[status] ?? ''}`}>{status}</span>;
}

export function AdminSearch({ value, onChange, label, className = '' }) {
  return (
    <label className={`admin-search ${className}`}>
      <SearchIcon />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        aria-label={label}
        maxLength={100}
      />
    </label>
  );
}

export function Errors({ errors }) {
  return errors && Object.values(errors).some(Boolean) ? (
    <div className="admin-errors" role="alert">
      {Object.entries(errors)
        .filter(([, value]) => value)
        .map(([key, value]) => (
          <p key={key}>{value}</p>
        ))}
    </div>
  ) : null;
}

function AdminWorkspace() {
  const { user, logout, sessionEnded, loadDishes } = useShop();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [notice, setNotice] = useState('');
  const [dataReady, setDataReady] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(null);
  // Ignore older reads after a newer refresh, a confirmed write, or unmounting.
  const requestVersion = useRef(0);

  useEffect(() => {
    const title = pathname.includes('/menu')
      ? 'Manage menu'
      : pathname.includes('/orders')
        ? 'Manage orders'
        : 'Dashboard';
    document.title = `FoodHub | ${title}`;
  }, [pathname]);

  const handleError = useCallback(
    (err) => {
      if (err.status === 401) {
        sessionEnded();
        navigate('/login', { replace: true });
      }
      if (err.status === 403) setForbidden(true);
    },
    [navigate, sessionEnded],
  );

  const reload = useCallback(async () => {
    const version = ++requestVersion.current;
    setError('');
    try {
      const [nextMenu, nextOrders] = await Promise.all([api.adminMenu(), api.adminOrders()]);
      if (version !== requestVersion.current) return;
      setMenu(nextMenu);
      setOrders(nextOrders);
      setDataReady(true);
      setRefreshedAt(new Date().toISOString());
      return { menu: nextMenu, orders: nextOrders };
    } catch (err) {
      if (version !== requestVersion.current) return;
      handleError(err);
      setError('Could not refresh admin data. Please try again.');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [handleError]);
  useEffect(() => {
    reload();
    return () => {
      requestVersion.current += 1;
    };
  }, [reload]);

  // Apply confirmed writes immediately; a failed background refresh must not undo a saved change.
  const updateDish = (dish) => {
    requestVersion.current += 1;
    setMenu((previous) =>
      [...previous.filter((item) => item.id !== dish.id), dish].sort((a, b) => a.id - b.id),
    );
  };
  const removeDish = (id) => {
    requestVersion.current += 1;
    setMenu((previous) => previous.filter((dish) => dish.id !== id));
  };
  const updateOrder = (id, status) => {
    requestVersion.current += 1;
    setOrders((previous) =>
      previous.map((order) => (order.id === id ? { ...order, status } : order)),
    );
  };

  if (forbidden)
    return (
      <div className="admin-access" role="alert">
        <h1>Administrator access required</h1>
        <p>Your account no longer has access to administration.</p>
        <Link to="/">Back to storefront</Link>
      </div>
    );

  const pending = orders.filter((order) => order.status === 'Pending').length;
  return (
    <AdminContext.Provider
      value={{
        menu,
        orders,
        reload,
        loading,
        setNotice,
        handleError,
        loadDishes,
        updateDish,
        removeDish,
        updateOrder,
        dataReady,
        refreshedAt,
        error,
      }}
    >
      <div className="admin-body admin-layout">
        <aside className="admin-sidebar">
          <Link className="admin-brand" to="/admin/dashboard">
            <span className="logo">
              <LogoIcon />
            </span>
            FoodHub <span className="admin-tag">ADMIN</span>
          </Link>
          <nav className="admin-nav" aria-label="Administration">
            <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              <AdminIcon name="dashboard" />
              Dashboard
            </NavLink>
            <NavLink to="/admin/menu" className={({ isActive }) => (isActive ? 'active' : '')}>
              <LogoIcon />
              Manage menu
            </NavLink>
            <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
              <AdminIcon name="orders" />
              Manage orders <span className="admin-count">{pending}</span>
            </NavLink>
          </nav>
          <p className="admin-store-label">STORE</p>
          <Link className="admin-store-link" to="/">
            <AdminIcon name="external" />
            View storefront
          </Link>
          <div className="admin-profile">
            <span className="admin-avatar dark">{initials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>Administrator</small>
            </div>
            <button
              type="button"
              aria-label="Log out"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <AdminIcon name="logout" />
            </button>
          </div>
        </aside>
        <main className="admin-main" aria-busy={loading}>
          {notice && (
            <div className="admin-flash" role="status">
              {notice}
              <button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}>
                ×
              </button>
            </div>
          )}
          {error && (
            <div className="admin-errors" role="alert">
              {error}{' '}
              <button type="button" className="admin-text-button" onClick={reload}>
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <p className="admin-loading" role="status">
              Loading administration…
            </p>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </AdminContext.Provider>
  );
}

export default function AdminLayout() {
  const { ready, user, loadError } = useShop();
  if (!ready)
    return (
      <div className="admin-access" aria-busy="true">
        Checking your account…
      </div>
    );
  if (loadError)
    return (
      <div className="admin-access" role="alert">
        <h1>Could not check your account</h1>
        <p>Please check that the backend is running.</p>
        <button className="admin-text-button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin')
    return (
      <div className="admin-access">
        <h1>Administrator access required</h1>
        <p>This page is only available to FoodHub administrators.</p>
        <Link to="/">Back to storefront</Link>
      </div>
    );
  return <AdminWorkspace />;
}

const date = (value) =>
  new Date(value).toLocaleDateString('en-SG', { day: '2-digit', month: 'short' });
const time = (value) =>
  new Date(value).toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

function OrderDetails({ order, onUpdated }) {
  const { reload, setNotice, handleError, updateOrder } = useAdmin();
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const lock = useRef(false);
  const submit = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setErrors({});
    let result;
    try {
      result = await api.adminOrderStatus(order.id, status);
    } catch (err) {
      handleError(err);
      setErrors(err.errors ?? { form: err.message });
    }
    if (result) {
      updateOrder(order.id, status);
      setNotice(result.message);
      onUpdated(order.id, status);
      await reload();
    }
    lock.current = false;
    setSaving(false);
  };
  return (
    <aside className="admin-card admin-editor admin-order-detail" aria-label="Order details">
      <div className="admin-detail-top">
        <p>
          Placed {date(order.date)}, {time(order.date)}
        </p>
        <StatusBadge status={order.status} />
      </div>
      <h2>Order #{order.id}</h2>
      <div className="admin-delivery">
        <strong>
          {order.customer} · {order.phone}
        </strong>
        <p>{order.address}</p>
        {order.notes && <p>Note: “{order.notes}”</p>}
      </div>
      <div className="admin-order-lines">
        {order.items.map((item) => (
          <div key={item.dishId}>
            <span>
              <strong>{item.quantity} ×</strong> {item.name}
            </span>
            <span>{money(item.quantity * item.unitPrice)}</span>
          </div>
        ))}
      </div>
      <div className="admin-order-total">
        <span>
          Total ·{' '}
          {order.payment === 'cash'
            ? 'Cash on delivery'
            : order.payment === 'card'
              ? 'Card on delivery'
              : 'PayNow'}
        </span>
        <strong>{money(order.total)}</strong>
      </div>
      <Errors errors={errors} />
      <form onSubmit={submit}>
        <fieldset className="admin-status-options" disabled={saving}>
          <legend>Update status</legend>
          {STATUSES.map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="status"
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
              />
              <StatusBadge status={value} />
            </label>
          ))}
        </fieldset>
        <button className="btn admin-update-button" type="submit" disabled={saving}>
          {saving ? 'Updating…' : 'Update and email customer'}
        </button>
      </form>
    </aside>
  );
}

export function ManageOrders() {
  const { orders } = useAdmin();
  const [params, setParams] = useSearchParams();
  const status = ['all', ...STATUSES].includes(params.get('status'))
    ? params.get('status')
    : 'Pending';
  const q = params.get('q') ?? '';
  const updateParams = (changes) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes))
      value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  const filtered = orders.filter(
    (order) =>
      (status === 'all' || order.status === status) &&
      (!q ||
        String(order.id) === q.replace(/^#/, '').trim() ||
        order.customer.toLowerCase().includes(q.trim().toLowerCase())),
  );
  const selected = filtered.find((order) => order.id === Number(params.get('id'))) ?? filtered[0];
  return (
    <>
      <header className="admin-heading">
        <div>
          <h1>Manage orders</h1>
          <p>Track and update incoming orders</p>
        </div>
        <AdminSearch
          className="admin-order-search"
          label="Search order # or customer"
          value={q}
          onChange={(value) => updateParams({ q: value, id: '' })}
        />
      </header>
      <nav className="admin-status-tabs" aria-label="Order statuses">
        {['all', ...STATUSES].map((value) => (
          <button
            type="button"
            key={value}
            className={status === value ? 'active' : ''}
            aria-current={status === value ? 'page' : undefined}
            onClick={() => updateParams({ status: value, id: '' })}
          >
            {value === 'all' ? 'All orders' : value}{' '}
            <span>
              {value === 'all'
                ? orders.length
                : orders.filter((order) => order.status === value).length}
            </span>
          </button>
        ))}
      </nav>
      <div className={`admin-columns${selected ? '' : ' no-panel'}`}>
        <section className="admin-card admin-list" aria-label="Orders">
          <div className="admin-table-scroll">
            <table className="admin-table orders-admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Placed</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className={selected?.id === order.id ? 'selected' : ''}>
                    <td>
                      <button
                        type="button"
                        className="admin-order-id"
                        onClick={() => updateParams({ id: order.id })}
                      >
                        #{order.id}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-customer"
                        onClick={() => updateParams({ id: order.id })}
                      >
                        <span className="admin-avatar">{initials(order.customer)}</span>
                        <span>
                          <strong>{order.customer}</strong>
                          <small>{order.phone}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <time dateTime={order.date}>
                        {date(order.date)}
                        <small>{time(order.date)}</small>
                      </time>
                    </td>
                    <td className="admin-money">{money(order.total)}</td>
                    <td>{payments[order.payment] ?? order.payment}</td>
                    <td>
                      <button
                        type="button"
                        aria-label={`View order #${order.id}, ${order.status}`}
                        onClick={() => updateParams({ id: order.id })}
                      >
                        <StatusBadge status={order.status} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={6} className="admin-empty">
                      No orders found. Try another status or search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className="admin-table-footer">
            Showing {filtered.length} {status === 'all' ? '' : `${status.toLowerCase()} `}
            {filtered.length === 1 ? 'order' : 'orders'}, oldest at the bottom
          </footer>
        </section>
        {selected && (
          <OrderDetails
            key={`${selected.id}-${selected.status}`}
            order={selected}
            onUpdated={(id, value) =>
              updateParams({ status: status === 'all' ? 'all' : value, id })
            }
          />
        )}
      </div>
    </>
  );
}
