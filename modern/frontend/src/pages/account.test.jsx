import { describe, it, expect, vi } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, AISHA, where } from '../test/utils';
import { api } from '../test/fixtures/mockApi';
import { seedOrders } from '../test/fixtures/seedOrders';
import seedUsers from '../test/fixtures/users';

// A seeded order with the given status, and the email of the customer who owns it
const seeded = (status) => {
  const order = seedOrders.find((o) => o.status === status);
  return { id: order.id, userId: order.userId, email: seedUsers.find((u) => u.id === order.userId).email };
};

const fill = async (label, text, selector) => {
  const field = screen.getByLabelText(label, selector ? { selector } : undefined);
  await userEvent.clear(field);
  if (text) await userEvent.type(field, text);
  return field;
};

describe('Checkout', () => {
  it('sends guests to the login page', async () => {
    await renderApp('/checkout');
    await waitFor(() => expect(where(screen)).toBe('/login'));
  });

  it('prefills address and phone from the account and shows the summary', async () => {
    await renderApp('/checkout', { user: AISHA, cart: { 3: 1, 9: 2 } });
    expect(screen.getByLabelText('Delivery address')).toHaveValue('Blk 123 Ang Mo Kio Ave 3, #05-27, Singapore 560123');
    expect(screen.getByLabelText('Contact phone')).toHaveValue('91234567');
    expect(screen.getByRole('radio', { name: /Cash on delivery/ })).toBeChecked();
    expect(screen.getByText('Items (3)')).toBeInTheDocument();
    expect(screen.getAllByText('$11.60')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Back to cart' })).toHaveAttribute('href', '/cart');
  });

  it('validates on submit, shows every message, and places nothing', async () => {
    await renderApp('/checkout', { user: AISHA, cart: { 3: 1 } });
    await fill('Delivery address', '');
    await fill('Contact phone', '1234');
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
    expect(screen.getByText('Enter a delivery address (up to 255 characters).')).toBeInTheDocument();
    expect(screen.getByText('Enter an 8-digit number starting with 6, 8 or 9')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact phone')).toHaveAttribute('aria-invalid', 'true');
    expect(where(screen)).toBe('/checkout');
    expect(api.listOrders(1).some((o) => o.status === 'Pending' && o.total === 7.2)).toBe(false);
  });

  it('counts the notes live', async () => {
    await renderApp('/checkout', { user: AISHA, cart: { 3: 1 } });
    expect(screen.getByText('0 / 255')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Notes for the kitchen'), 'no sprouts');
    expect(screen.getByText('10 / 255')).toBeInTheDocument();
  });

  it('places a Pending order with the chosen payment, empties the cart and opens the order', async () => {
    await renderApp('/checkout', { user: AISHA, cart: { 3: 1, 9: 2 } });
    await userEvent.click(screen.getByRole('radio', { name: /PayNow/ }));
    await userEvent.type(screen.getByLabelText('Notes for the kitchen'), 'Less spicy');
    await fill('Contact phone', '98765432');
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
    await waitFor(() => expect(where(screen)).toMatch(/^\/orders\?id=\d+$/));
    const id = Number(where(screen).match(/^\/orders\?id=(\d+)$/)[1]);
    const order = api.listOrders(1).find((o) => o.id === id);
    expect(order).toMatchObject({ status: 'Pending', payment: 'paynow', notes: 'Less spicy', total: 11.6 });
    expect(api.getCart()).toEqual({});
    expect(screen.getByRole('heading', { name: `#${id}` })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cart, 0 items/ })).toBeInTheDocument();
  });

  it('shows the empty-cart message and no Place order button', async () => {
    await renderApp('/checkout', { user: AISHA });
    expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place order' })).toBeNull();
  });
});

describe('Orders', () => {
  it('sends guests to the login page', async () => {
    await renderApp('/orders');
    await waitFor(() => expect(where(screen)).toBe('/login'));
  });

  it('lists only my orders, newest first, with the newest selected', async () => {
    await renderApp('/orders', { user: AISHA });
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    const mine = api.listOrders(1);
    expect(rows).toHaveLength(mine.length);
    expect(within(rows[0]).getByRole('link')).toHaveTextContent(`#${mine[0].id}`);
    expect(rows[0]).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('heading', { name: `#${mine[0].id}` })).toBeInTheDocument();
  });

  it('filters by status group', async () => {
    await renderApp('/orders?filter=active', { user: AISHA });
    const active = api.listOrders(1).filter((o) => ['Pending', 'Preparing', 'Out for delivery'].includes(o.status));
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(active.length);
    expect(screen.getByRole('link', { name: 'Active' })).toHaveAttribute('aria-current', 'page');
  });

  it('an unknown filter means All', async () => {
    await renderApp('/orders?filter=bogus', { user: AISHA });
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(api.listOrders(1).length);
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows an empty-tab message and a first-order message', async () => {
    await renderApp('/orders?filter=cancelled', { user: AISHA }); // Aisha has no cancelled orders
    expect(screen.getByText(/No cancelled orders\./)).toBeInTheDocument();
    cleanup();
    const fresh = { name: 'New Person', phone: '91112222', email: 'fresh@example.com', address: '', password: 'Abcdefg1' };
    api.register(fresh);
    api.login(fresh.email, fresh.password);
    await renderApp('/orders');
    expect(screen.getByText(/You have not placed any orders yet\./)).toBeInTheDocument();
  });

  it('selecting a row opens that order in the panel', async () => {
    await renderApp('/orders', { user: AISHA });
    const mine = api.listOrders(1);
    const target = mine[1];
    await userEvent.click(screen.getByRole('link', { name: `#${target.id}` }));
    expect(where(screen)).toBe(`/orders?id=${target.id}`);
    expect(screen.getByRole('heading', { name: `#${target.id}` })).toBeInTheDocument();
  });

  it('ignores an id that is not mine', async () => {
    const other = seeded('Preparing'); // not Aisha's
    await renderApp(`/orders?id=${other.id}`, { user: AISHA });
    expect(screen.queryByRole('heading', { name: `#${other.id}` })).toBeNull();
    expect(screen.getByRole('heading', { name: `#${api.listOrders(1)[0].id}` })).toBeInTheDocument();
  });

  it('shows a timeline with done / current / upcoming steps and no cancel button once preparing', async () => {
    const { id, email } = seeded('Preparing');
    await renderApp(`/orders?id=${id}`, { user: email });
    const steps = within(screen.getByRole('list', { name: 'Order progress' })).getAllByRole('listitem');
    expect(steps.map((li) => li.dataset.state)).toEqual(['done', 'current', 'todo', 'todo']);
    expect(screen.queryByRole('button', { name: 'Cancel order' })).toBeNull();
  });

  it('shows the cancelled note instead of a timeline for a cancelled order', async () => {
    const { id, email } = seeded('Cancelled');
    await renderApp(`/orders?id=${id}`, { user: email });
    expect(screen.getByText(/This order was cancelled on/)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Order progress' })).toBeNull();
  });

  it('cancels a Pending order only after confirming', async () => {
    api.login(AISHA, 'Password123');
    api.saveCart({ 3: 1 });
    const { orderId } = api.placeOrder(1, { address: 'x', phone: '91234567', payment: 'cash', notes: '' }, { 3: 1 });
    const confirm = vi.spyOn(window, 'confirm');
    await renderApp(`/orders?id=${orderId}`);

    confirm.mockReturnValueOnce(false);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    expect(confirm).toHaveBeenCalledWith('Cancel this order? This cannot be undone.');
    expect(api.listOrders(1).find((o) => o.id === orderId).status).toBe('Pending');

    confirm.mockReturnValueOnce(true);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    expect(api.listOrders(1).find((o) => o.id === orderId).status).toBe('Cancelled');
    expect(screen.getByText(/This order was cancelled on/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel order' })).toBeNull();
    confirm.mockRestore();
  });
});

describe('Login and register', () => {
  it('logs in and goes home; a wrong password shows one generic error', async () => {
    await renderApp('/login');
    await userEvent.type(screen.getByLabelText('Email', { selector: '#login-email' }), AISHA);
    await userEvent.type(screen.getByLabelText('Password', { selector: '#login-password' }), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByText('Incorrect email or password.')).toBeInTheDocument();
    expect(where(screen)).toBe('/login');
    await userEvent.clear(screen.getByLabelText('Password', { selector: '#login-password' }));
    await userEvent.type(screen.getByLabelText('Password', { selector: '#login-password' }), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(where(screen)).toBe('/');
    expect(screen.getByText('Welcome, Aisha Lim')).toBeInTheDocument();
  });

  it('login shows both field errors on an empty submit and focuses the first', async () => {
    await renderApp('/login');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByLabelText('Email', { selector: '#login-email' }));
  });

  it('register validates on blur, then every field on submit with focus on the first bad one', async () => {
    await renderApp('/login');
    const name = screen.getByLabelText('Full name');
    await userEvent.type(name, 'Aisha1');
    await userEvent.tab();
    expect(screen.getByText('Use letters and spaces only.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Enter an 8-digit Singapore number starting with 6, 8 or 9.')).toBeInTheDocument();
    expect(screen.getByText('Use 8-72 characters with at least one letter and one digit.')).toBeInTheDocument();
    expect(screen.getByText('Confirm your password.')).toBeInTheDocument();
    expect(document.activeElement).toBe(name);
  });

  it('password strength bars and live confirmation check', async () => {
    await renderApp('/login');
    const bars = () => [...screen.getByTestId('strength').children].filter((s) => s.classList.contains('bg-brand')).length;
    expect(bars()).toBe(0);
    await userEvent.type(screen.getByLabelText('Password', { selector: '#password' }), 'Abcdefg1!');
    expect(bars()).toBe(4);
    await userEvent.type(screen.getByLabelText('Confirm password'), 'different');
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('rejects an email that is already registered', async () => {
    await renderApp('/login');
    await fill('Full name', 'Someone Else');
    await fill('Phone', '91112222');
    await fill('Email', AISHA, '#email');
    await fill('Password', 'Abcdefg1', '#password');
    await fill('Confirm password', 'Abcdefg1');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('This email is already registered. Use the log in form.')).toBeInTheDocument();
    expect(where(screen)).toBe('/login');
  });

  it('creates the account, shows the success page and lets the new user log in', async () => {
    await renderApp('/login');
    await fill('Full name', 'New Person');
    await fill('Phone', '91112222');
    await fill('Email', 'new.person@example.com', '#email');
    await fill('Password', 'Abcdefg1', '#password');
    await fill('Confirm password', 'Abcdefg1');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(where(screen)).toBe('/register-success');
    expect(screen.getByRole('heading', { name: 'Register success' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Back to log in' }));
    expect(where(screen)).toBe('/login');
    expect(api.login('new.person@example.com', 'Abcdefg1').ok).toBe(true);
  });
});
