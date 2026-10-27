import { describe, it, expect, vi } from 'vitest';
import { toast } from 'react-toastify';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, renderAppRaw, AISHA, where } from '../test/utils';
import { api } from '../test/fixtures/mockApi';
import { fakeBackend } from '../test/fakeBackend';

describe('loading and failure states', () => {
  it('has no full-page loading screen and does not redirect a protected page before the session is known', async () => {
    renderAppRaw('/orders', { user: AISHA });
    expect(screen.queryByText('Loading…')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'My orders' })).toBeNull(); // the page waits for the session
    expect(where(screen)).toBe('/orders');
    expect(await screen.findByRole('heading', { name: 'My orders' })).toBeInTheDocument();
    expect(where(screen)).toBe('/orders');
  });

  it('keeps skeleton cards on the home and menu pages when the dishes cannot be loaded', async () => {
    fakeBackend.fail = true;
    renderAppRaw('/menu');
    expect(await screen.findByText('Loading the menu…')).toBeInTheDocument();
    expect(screen.getByText('Loading dishes…')).toBeInTheDocument();
    expect(screen.queryByText(/could not load/)).toBeNull();
    cleanup();
    renderAppRaw('/');
    expect(await screen.findByText('Loading best sellers…')).toBeInTheDocument();
    expect(screen.queryByText(/could not load/)).toBeNull();
  });

  it('a network failure while logging in shows a friendly message', async () => {
    await renderApp('/login');
    fakeBackend.fail = true;
    await userEvent.type(screen.getByLabelText('Email', { selector: '#login-email' }), AISHA);
    await userEvent.type(screen.getByLabelText('Password', { selector: '#login-password' }), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(where(screen)).toBe('/login');
  });
});

describe('logging out', () => {
  it('goes to the home page even from a login-only page (like logout.php)', async () => {
    await renderApp('/orders', { user: AISHA });
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument());
    expect(where(screen)).toBe('/');
  });
});

describe('session expiry', () => {
  it('a 401 from the server sends the user to the login page', async () => {
    await renderApp('/menu?q=laksa', { user: AISHA });
    api.logout(); // the server forgot the session (cookie expired / server restarted)
    await userEvent.click(screen.getByRole('button', { name: 'Add Curry laksa to cart' }));
    await waitFor(() => expect(where(screen)).toBe('/login'));
  });
});

describe('server-side validation reaches the page', () => {
  it('shows the server message when the cart was emptied elsewhere before placing the order', async () => {
    await renderApp('/checkout', { user: AISHA, cart: { 3: 1 } });
    api.saveCart({}); // e.g. the order was already placed from another tab
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
    await waitFor(() => expect(within(screen.getByRole('complementary')).getByText('Your cart is empty.')).toBeInTheDocument());
    expect(where(screen)).toBe('/checkout');
  });
});

describe('things that go wrong after the server already said yes', () => {
  it('an order that was saved is not reported as failed when reloading the order list fails', async () => {
    await renderApp('/checkout', { user: AISHA, cart: { 3: 1 } });
    fakeBackend.failOn = (method, path) => method === 'GET' && path === '/orders';
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
    await waitFor(() => expect(where(screen)).toMatch(/^\/orders\?id=\d+$/));
    expect(screen.queryByText('Something went wrong. Please try again.')).toBeNull();
    expect(api.listOrders(1).some((o) => o.status === 'Pending' && o.total === 7.2)).toBe(true);
  });

  it('a login that worked is not reported as failed when loading the cart fails', async () => {
    await renderApp('/login');
    fakeBackend.failOn = (method, path) => method === 'GET' && path === '/cart';
    await userEvent.type(screen.getByLabelText('Email', { selector: '#login-email' }), AISHA);
    await userEvent.type(screen.getByLabelText('Password', { selector: '#login-password' }), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(where(screen)).toBe('/'));
    expect(await screen.findByText('Welcome, Aisha Lim')).toBeInTheDocument();
  });
});

describe('double submit', () => {
  it('Place order is disabled while the request is running, so one click makes one order', async () => {
    await renderApp('/checkout', { user: AISHA, cart: { 3: 1 } });
    const before = api.listOrders(1).length;
    const button = screen.getByRole('button', { name: 'Place order' });
    await userEvent.dblClick(button);
    expect(button).toBeDisabled();
    await waitFor(() => expect(where(screen)).toMatch(/^\/orders\?id=\d+$/));
    expect(api.listOrders(1)).toHaveLength(before + 1);
  });
});

describe('checkout email feedback', () => {
  it.each(['accepted', 'failed', 'unconfigured'])('confirms the saved order when email is %s', async (state) => {
    const originalFetch = globalThis.fetch;
    vi.stubGlobal('fetch', async (url, options = {}) => {
      const response = await originalFetch(url, options);
      if (url !== '/api/orders' || options.method !== 'POST' || !response.ok) return response;
      return new Response(JSON.stringify({ ...await response.json(), confirmationEmail: state }), {
        status: 201, headers: { 'Content-Type': 'application/json' },
      });
    });
    const notify = vi.spyOn(toast, state === 'accepted' ? 'success' : 'warn').mockImplementation(() => {});
    try {
      await renderApp('/checkout', { user: AISHA, cart: { 3: 1 } });
      await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
      await waitFor(() => expect(where(screen)).toMatch(/^\/orders\?id=\d+$/));
      expect(notify).toHaveBeenCalledWith(expect.stringContaining(
        state === 'accepted' ? 'confirmation email is on its way' : "couldn't send the confirmation email",
      ));
      expect(screen.queryByText('Something went wrong. Please try again.')).toBeNull();
    } finally { notify.mockRestore(); }
  });
});

describe('customer cancellation email feedback', () => {
  it.each(['accepted', 'failed', 'unconfigured', 'refresh-failed'])('keeps cancellation successful when email is %s', async (state) => {
    api.login(AISHA, 'Password123');
    const { orderId } = api.placeOrder(1, { address: '1 Test Street', phone: '91234567', payment: 'cash', notes: '' }, { 3: 1 });
    const originalFetch = globalThis.fetch;
    const email = state === 'refresh-failed' ? 'accepted' : state;
    vi.stubGlobal('fetch', async (url, options = {}) => {
      const response = await originalFetch(url, options);
      if (url !== `/api/orders/${orderId}/cancel` || !response.ok) return response;
      return new Response(JSON.stringify({ ...await response.json(), cancellationEmail: email }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const notify = vi.spyOn(toast, email === 'accepted' ? 'success' : 'warn').mockImplementation(() => {});
    try {
      await renderApp(`/orders?id=${orderId}`);
      if (state === 'refresh-failed') fakeBackend.failOn = (method, path) => method === 'GET' && path === '/orders';
      await userEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
      await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.stringContaining(
        email === 'accepted' ? 'cancellation email is on its way' : "couldn't send the cancellation email",
      )));
      expect(await screen.findByText(/This order was cancelled on/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cancel order' })).toBeNull();
    } finally { confirm.mockRestore(); notify.mockRestore(); }
  });
});
