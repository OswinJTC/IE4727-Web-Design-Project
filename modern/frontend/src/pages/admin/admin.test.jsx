import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, renderAppRaw, AISHA, where } from '../../test/utils';
import { fakeFetch } from '../../test/fakeBackend';

const admin = { id: 6, name: 'FoodHub Admin', email: 'admin@foodhub.test', role: 'admin' };
const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
let menu, orders, calls, signedIn, failSave, failRefresh, expire;

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  signedIn = true;
  failSave = false;
  failRefresh = false;
  expire = false;
  calls = [];
  menu = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: `Dish ${i + 1}`,
    category: i < 4 ? 'Mains' : 'Drinks',
    description: 'Freshly made',
    price: 5 + i,
    image: '',
    available: i !== 5,
  }));
  orders = [
    {
      id: 12,
      customer: 'Aisha Lim',
      email: AISHA,
      phone: '91234567',
      address: 'Blk 123 Test Street',
      payment: 'cash',
      notes: 'No chilli',
      date: '2026-10-27T08:00:00Z',
      status: 'Pending',
      total: 11,
      items: [{ dishId: 1, name: 'Dish 1', quantity: 2, unitPrice: 5.5 }],
    },
    {
      id: 11,
      customer: 'Daniel Tan',
      email: 'daniel@example.com',
      phone: '98765432',
      address: 'Blk 45 Test Street',
      payment: 'paynow',
      notes: '',
      date: '2026-10-27T07:00:00Z',
      status: 'Delivered',
      total: 6,
      items: [{ dishId: 2, name: 'Dish 2', quantity: 1, unitPrice: 6 }],
    },
  ];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      const method = options.method ?? 'GET';
      calls.push({ method, url, body: options.body });
      if (url === '/api/auth/me') return json(200, { user: signedIn ? admin : null });
      if (url === '/api/auth/login') {
        signedIn = true;
        return json(200, { user: admin });
      }
      if (!url.startsWith('/api/admin')) return fakeFetch(url, options);
      if (expire) return json(401, { error: 'Login required' });
      if (failRefresh && method === 'GET') return json(503, { error: 'Service unavailable' });
      if (url === '/api/admin/menu' && method === 'GET') return json(200, menu);
      if (url === '/api/admin/orders' && method === 'GET') return json(200, orders);
      if (/\/menu\/\d+\/visibility$/.test(url)) {
        const item = menu.find((dish) => dish.id === Number(url.split('/')[4]));
        item.available = JSON.parse(options.body).available;
        return json(200, item);
      }
      if (method === 'PUT' || method === 'POST') {
        if (failSave) return json(422, { errors: { name: 'This dish could not be saved.' } });
        const values = Object.fromEntries(options.body);
        const id = method === 'PUT' ? Number(url.split('/')[4]) : 7;
        const dish = {
          ...values,
          id,
          price: Number(values.price),
          available: values.available === 'true',
          image: '',
        };
        menu = [...menu.filter((item) => item.id !== id), dish].sort((a, b) => a.id - b.id);
        return json(method === 'PUT' ? 200 : 201, dish);
      }
      if (method === 'PATCH' && url.includes('/orders/')) {
        const order = orders.find((item) => item.id === Number(url.split('/')[4]));
        order.status = JSON.parse(options.body).status;
        return json(200, {
          changed: true,
          email: 'unconfigured',
          message: `Order #${order.id} is now ${order.status}. The email was not sent because email notifications are not configured.`,
        });
      }
      if (method === 'DELETE') {
        menu = menu.filter((item) => item.id !== Number(url.split('/')[4]));
        return json(200, { hidden: false, message: 'Dish deleted.' });
      }
      return json(404, { error: 'Not found' });
    }),
  );
});

describe('React administration', () => {
  it('redirects guests to login without fetching admin data', async () => {
    signedIn = false;
    renderAppRaw('/admin/menu');
    await waitFor(() => expect(where(screen)).toBe('/login'));
    expect(calls.some((call) => call.url.startsWith('/api/admin'))).toBe(false);
  });

  it('blocks customer accounts before fetching admin data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url, options) => {
        calls.push({ url });
        return fakeFetch(url, options);
      }),
    );
    await renderApp('/admin/orders', { user: AISHA });
    expect(
      await screen.findByRole('heading', { name: 'Administrator access required' }),
    ).toBeInTheDocument();
    expect(calls.some((call) => call.url.startsWith('/api/admin'))).toBe(false);
  });

  it('sends an admin login directly to the dashboard', async () => {
    signedIn = false;
    await renderApp('/login');
    await userEvent.type(screen.getByLabelText('Email', { selector: '#login-email' }), admin.email);
    await userEvent.type(
      screen.getByLabelText('Password', { selector: '#login-password' }),
      'Password123',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(where(screen)).toBe('/admin/dashboard');
  });

  it('paginates five dishes at a time and supports search, category and visibility filters', async () => {
    await renderApp('/admin/menu');
    await screen.findByRole('heading', { name: 'Manage menu' });
    const list = within(screen.getByRole('region', { name: 'Dishes' }));
    expect(list.getAllByRole('row')).toHaveLength(6);
    expect(list.getByText('Showing 1–5 of 6')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(list.getByText('Dish 6')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search dishes' }), 'Dish 2');
    expect(list.getByText('Showing 1–1 of 1')).toBeInTheDocument();
    await userEvent.clear(screen.getByRole('searchbox', { name: 'Search dishes' }));
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Filter category' }),
      'Drinks',
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Filter visibility' }),
      'hidden',
    );
    expect(list.getByText('Dish 6')).toBeInTheDocument();
    expect(list.queryByText('Dish 5')).toBeNull();
  });

  it('saves a dish using multipart data and refreshes the storefront catalog', async () => {
    await renderApp('/admin/menu');
    await screen.findByRole('heading', { name: 'Manage menu' });
    const editor = within(screen.getByRole('complementary', { name: 'Edit dish' }));
    await userEvent.clear(editor.getByLabelText('Name'));
    await userEvent.type(editor.getByLabelText('Name'), 'Chicken rice');
    await userEvent.click(editor.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Dish updated.')).toBeInTheDocument();
    const request = calls.find((call) => call.method === 'PUT');
    expect(request.body).toBeInstanceOf(FormData);
    expect(request.body.get('name')).toBe('Chicken rice');
    expect(
      within(screen.getByRole('region', { name: 'Dishes' })).getByText('Chicken rice'),
    ).toBeInTheDocument();
    expect(calls.filter((call) => call.url === '/api/dishes').length).toBeGreaterThan(1);
  });

  it('keeps unsaved values and displays server validation when saving fails', async () => {
    await renderApp('/admin/menu');
    await screen.findByRole('heading', { name: 'Manage menu' });
    failSave = true;
    const editor = within(screen.getByRole('complementary', { name: 'Edit dish' }));
    await userEvent.type(editor.getByLabelText('Name'), ' changed');
    await userEvent.click(editor.getByRole('button', { name: 'Save changes' }));
    expect(await editor.findByRole('alert')).toHaveTextContent('This dish could not be saved.');
    expect(editor.getByLabelText('Name')).toHaveValue('Dish 1 changed');
  });

  it('adds a dish and follows it onto its menu page', async () => {
    await renderApp('/admin/menu');
    await screen.findByRole('heading', { name: 'Manage menu' });
    await userEvent.click(screen.getByRole('button', { name: '＋ Add dish' }));
    const editor = within(screen.getByRole('complementary', { name: 'Add dish' }));
    await userEvent.type(editor.getByLabelText('Name'), 'New dish');
    await userEvent.type(editor.getByLabelText('Price ($)'), '7.50');
    await userEvent.click(editor.getByRole('button', { name: 'Add dish' }));
    expect(await screen.findByText('Dish added.')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Dishes' })).getByText('New dish'),
    ).toBeInTheDocument();
    expect(where(screen)).toContain('page=2');
  });

  it('requires confirmation before deleting and supports cancelling the confirmation', async () => {
    await renderApp('/admin/menu');
    await screen.findByRole('heading', { name: 'Manage menu' });
    await userEvent.click(screen.getByRole('button', { name: 'Delete Dish 1' }));
    let dialog = within(screen.getByRole('dialog'));
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Delete Dish 1' }));
    dialog = within(screen.getByRole('dialog'));
    await userEvent.click(dialog.getByRole('button', { name: 'Delete dish' }));
    expect(await screen.findByText('Dish deleted.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Delete Dish 1' })).toBeNull());
  });

  it('toggles menu visibility and displays the saved state', async () => {
    await renderApp('/admin/menu');
    await screen.findByRole('heading', { name: 'Manage menu' });
    await userEvent.click(screen.getByRole('switch', { name: 'Hide Dish 1' }));
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Show Dish 1' })).toHaveAttribute(
        'aria-checked',
        'false',
      ),
    );
    expect(await screen.findByText('Menu visibility updated.')).toBeInTheDocument();
  });

  it('shows order details at historical prices, updates status and follows the order to its new tab', async () => {
    await renderApp('/admin/orders');
    await screen.findByRole('heading', { name: 'Manage orders' });
    const details = within(screen.getByRole('complementary', { name: 'Order details' }));
    expect(details.getByText('Blk 123 Test Street')).toBeInTheDocument();
    expect(details.getAllByText('$11.00')).toHaveLength(2);
    await userEvent.click(details.getByRole('radio', { name: 'Preparing' }));
    await userEvent.click(details.getByRole('button', { name: 'Update and email customer' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Order #12 is now Preparing.');
    await waitFor(() => expect(where(screen)).toContain('status=Preparing'));
    expect(screen.getByRole('heading', { name: 'Order #12' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preparing 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('searches orders by exact number or customer, with a useful empty state', async () => {
    await renderApp('/admin/orders?status=all');
    await screen.findByRole('heading', { name: 'Manage orders' });
    await userEvent.type(screen.getByRole('searchbox'), '#11');
    expect(screen.getByRole('heading', { name: 'Order #11' })).toBeInTheDocument();
    await userEvent.clear(screen.getByRole('searchbox'));
    await userEvent.type(screen.getByRole('searchbox'), 'Aisha');
    expect(screen.getByRole('heading', { name: 'Order #12' })).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox'), ' missing');
    expect(screen.getByText('No orders found. Try another status or search.')).toBeInTheDocument();
  });

  it('redirects to login if the backend session expires during an admin mutation', async () => {
    await renderApp('/admin/menu');
    await screen.findByRole('heading', { name: 'Manage menu' });
    expire = true;
    await userEvent.click(screen.getByRole('switch', { name: 'Hide Dish 1' }));
    await waitFor(() => expect(where(screen)).toBe('/login'));
  });

  it.each(['save', 'visibility', 'delete'])(
    'keeps a confirmed menu %s visible when refreshing fails',
    async (action) => {
      await renderApp('/admin/menu');
      await screen.findByRole('heading', { name: 'Manage menu' });
      failRefresh = true;
      if (action === 'save') {
        const editor = within(screen.getByRole('complementary', { name: 'Edit dish' }));
        await userEvent.clear(editor.getByLabelText('Name'));
        await userEvent.type(editor.getByLabelText('Name'), 'Saved rice bowl');
        await userEvent.click(editor.getByRole('button', { name: 'Save changes' }));
        expect(await screen.findByText('Dish updated.')).toBeInTheDocument();
        expect(
          within(screen.getByRole('region', { name: 'Dishes' })).getByText('Saved rice bowl'),
        ).toBeInTheDocument();
      } else if (action === 'visibility') {
        await userEvent.click(screen.getByRole('switch', { name: 'Hide Dish 1' }));
        expect(await screen.findByRole('switch', { name: 'Show Dish 1' })).toHaveAttribute(
          'aria-checked',
          'false',
        );
      } else {
        await userEvent.click(screen.getByRole('button', { name: 'Delete Dish 1' }));
        await userEvent.click(
          within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete dish' }),
        );
        expect(await screen.findByText('Dish deleted.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete Dish 1' })).toBeNull();
      }
      expect(await screen.findByRole('alert')).toHaveTextContent('Could not refresh admin data.');
    },
  );

  it('keeps a saved order in its new status tab even if refreshing fails', async () => {
    await renderApp('/admin/orders');
    await screen.findByRole('heading', { name: 'Manage orders' });
    failRefresh = true;
    const details = within(screen.getByRole('complementary', { name: 'Order details' }));
    await userEvent.click(details.getByRole('radio', { name: 'Preparing' }));
    await userEvent.click(details.getByRole('button', { name: 'Update and email customer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not refresh admin data.');
    expect(screen.getByRole('heading', { name: 'Order #12' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preparing 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('radio', { name: 'Preparing' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('Order #12 is now Preparing.');
  });

  it('does not let an older refresh overwrite a newer confirmed change', async () => {
    failRefresh = true;
    await renderApp('/admin/menu');
    await screen.findByRole('button', { name: 'Retry' });
    failRefresh = false;
    const originalFetch = globalThis.fetch;
    let completeOlderRefresh;
    vi.stubGlobal('fetch', (url, options) => {
      if (url === '/api/admin/menu' && !completeOlderRefresh) {
        return new Promise((resolve) => {
          completeOlderRefresh = resolve;
        });
      }
      return originalFetch(url, options);
    });
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await userEvent.click(screen.getByRole('button', { name: '＋ Add dish' }));
    const editor = within(screen.getByRole('complementary', { name: 'Add dish' }));
    await userEvent.type(editor.getByLabelText('Name'), 'Newer saved dish');
    await userEvent.type(editor.getByLabelText('Price ($)'), '7.50');
    await userEvent.click(editor.getByRole('button', { name: 'Add dish' }));
    await screen.findByText('Dish added.');
    await act(async () => {
      completeOlderRefresh(json(200, []));
    });
    expect(
      within(screen.getByRole('region', { name: 'Dishes' })).getByText('Newer saved dish'),
    ).toBeInTheDocument();
  });
});

describe('Admin dashboard', () => {
  const metric = (name) => within(screen.getByRole('heading', { name }).closest('article, a'));

  it('opens the dashboard from /admin with real API summaries and useful management links', async () => {
    await renderApp('/admin');
    await screen.findByRole('region', { name: 'Store summary' });
    expect(where(screen)).toBe('/admin/dashboard');
    expect(metric('Total Revenue').getByText('$17.00')).toBeInTheDocument();
    expect(metric('Total Orders').getByText('2')).toBeInTheDocument();
    expect(metric('Total Products').getByText('6')).toBeInTheDocument();
    expect(metric('Pending Orders').getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Sales Overview' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Orders by Status' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Sales by Category' })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.recharts-area-area')).not.toBeNull();
      expect(document.querySelector('.recharts-pie-sector')).not.toBeNull();
      expect(document.querySelector('.recharts-bar-rectangle')).not.toBeNull();
    });
    expect(screen.getByRole('link', { name: /^Pending Orders/ })).toHaveAttribute(
      'href',
      '/admin/orders?status=Pending',
    );
    expect(screen.getByRole('link', { name: '#12' })).toHaveAttribute(
      'href',
      '/admin/orders?status=all&id=12',
    );
    expect(document.title).toBe('FoodHub | Dashboard');
  });

  it('changes the sales window without silently filtering the all-time summary cards', async () => {
    await renderApp('/admin/dashboard');
    const sales = within(await screen.findByRole('region', { name: 'Sales Overview' }));
    await userEvent.click(sales.getByRole('button', { name: '7 days' }));
    expect(sales.getByRole('button', { name: '7 days' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(sales.getByText('View chart data'));
    expect(within(sales.getByRole('table')).getAllByRole('row')).toHaveLength(8);
    expect(metric('Total Revenue').getByText('$17.00')).toBeInTheDocument();
    await userEvent.click(sales.getByRole('button', { name: '90 days' }));
    expect(within(sales.getByRole('table')).getAllByRole('row')).toHaveLength(91);
  });

  it('refreshes from the existing admin APIs and preserves the last successful values on failure', async () => {
    await renderApp('/admin/dashboard');
    await screen.findByRole('region', { name: 'Store summary' });
    orders[1].status = 'Cancelled';
    menu.push({ ...menu[0], id: 7, name: 'Extra dish', available: false });
    await userEvent.click(screen.getByRole('button', { name: 'Refresh data' }));
    await waitFor(() => expect(metric('Total Revenue').getByText('$11.00')).toBeInTheDocument());
    expect(metric('Total Products').getByText('7')).toBeInTheDocument();
    failRefresh = true;
    await userEvent.click(screen.getByRole('button', { name: 'Refresh data' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not refresh admin data.');
    expect(metric('Total Revenue').getByText('$11.00')).toBeInTheDocument();
  });

  it('shows genuine empty data separately from an unavailable backend', async () => {
    menu = [];
    orders = [];
    await renderApp('/admin/dashboard');
    await screen.findByRole('region', { name: 'Store summary' });
    expect(metric('Total Revenue').getByText('$0.00')).toBeInTheDocument();
    expect(metric('Total Orders').getByText('0')).toBeInTheDocument();
    expect(screen.getByText('No category sales yet.')).toBeInTheDocument();
  });

  it('does not turn an initial fetch error into zero statistics, and supports retry', async () => {
    failRefresh = true;
    await renderApp('/admin/dashboard');
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Store summary' })).toBeNull();
    failRefresh = false;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('region', { name: 'Store summary' })).toBeInTheDocument();
  });

  it('keeps the new dashboard behind the existing admin access guard', async () => {
    signedIn = false;
    renderAppRaw('/admin/dashboard');
    await waitFor(() => expect(where(screen)).toBe('/login'));
    expect(calls.some((call) => call.url.startsWith('/api/admin'))).toBe(false);
  });
});
