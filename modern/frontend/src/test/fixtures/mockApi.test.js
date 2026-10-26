import { describe, it, expect } from 'vitest';
import { api } from './mockApi';

const AISHA = 1;

describe('mockApi', () => {
  it('logs in a seeded customer and rejects bad credentials with one generic message', () => {
    expect(api.login('aisha@example.com', 'Password123').ok).toBe(true);
    expect(api.getSession().name).toBe('Aisha Lim');
    expect(api.getSession()).not.toHaveProperty('password');
    expect(api.login('aisha@example.com', 'wrong')).toEqual({ ok: false, error: 'Incorrect email or password.' });
    expect(api.login('nobody@example.com', 'Password123').error).toBe('Incorrect email or password.');
  });

  it('registers a customer, rejects a duplicate email, and lets the new user log in', () => {
    const data = { name: 'New Person', phone: '91112222', email: 'New@Example.com', address: '', password: 'Abcdefg1' };
    expect(api.register(data).ok).toBe(true);
    expect(api.register(data)).toMatchObject({ ok: false, field: 'email' });
    expect(api.login('new@example.com', 'Abcdefg1').ok).toBe(true);
  });

  it('logout clears the session and the cart', () => {
    api.login('aisha@example.com', 'Password123');
    api.saveCart({ 1: 2 });
    api.logout();
    expect(api.getSession()).toBeNull();
    expect(api.getCart()).toEqual({});
  });

  it('lists only the user\'s orders, newest first, with item counts', () => {
    const orders = api.listOrders(AISHA);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.every((o) => o.userId === AISHA)).toBe(true);
    const dates = orders.map((o) => o.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(orders[0].itemCount).toBe(orders[0].items.reduce((n, l) => n + l.quantity, 0));
  });

  it('places an order as Pending using catalog prices and empties the cart', () => {
    api.saveCart({ 3: 1, 9: 2 });
    const res = api.placeOrder(AISHA, { address: ' Blk 1 ', phone: '9123 4567', payment: 'cash', notes: '  ' }, { 3: 1, 9: 2 });
    expect(res.ok).toBe(true);
    const order = api.listOrders(AISHA).find((o) => o.id === res.orderId);
    expect(order).toMatchObject({ status: 'Pending', total: 11.6, address: 'Blk 1', phone: '91234567', notes: null });
    expect(order.items).toEqual([
      { dishId: 3, quantity: 1, unitPrice: 7.2 },
      { dishId: 9, quantity: 2, unitPrice: 2.2 },
    ]);
    expect(api.getCart()).toEqual({});
  });

  it('refuses to place an order from an empty cart', () => {
    expect(api.placeOrder(AISHA, { address: 'x', phone: '91234567', payment: 'cash', notes: '' }, {}).ok).toBe(false);
  });

  it('cancels only own Pending orders', () => {
    const { orderId } = api.placeOrder(AISHA, { address: 'x', phone: '91234567', payment: 'cash', notes: '' }, { 1: 1 });
    expect(api.cancelOrder(2, orderId)).toBe(false); // someone else's order
    expect(api.cancelOrder(AISHA, orderId)).toBe(true);
    expect(api.listOrders(AISHA).find((o) => o.id === orderId).status).toBe('Cancelled');
    expect(api.cancelOrder(AISHA, orderId)).toBe(false); // already cancelled
    const delivered = api.listOrders(AISHA).find((o) => o.status === 'Delivered');
    expect(api.cancelOrder(AISHA, delivered.id)).toBe(false);
  });

  it('best sellers: top 4, cancelled orders excluded', () => {
    const top = api.bestSellers();
    expect(top).toHaveLength(4);
    expect(new Set(top.map((d) => d.id)).size).toBe(4);
  });

  it('best sellers ignore cancelled orders', () => {
    const before = api.bestSellers().map((d) => d.id);
    // A dish outside the top 4 jumps in when 20 are ordered, and drops out again once that order is cancelled
    const outsider = api.listDishes().find((d) => !before.includes(d.id)).id;
    api.saveCart({ [outsider]: 20 });
    const { orderId } = api.placeOrder(AISHA, { address: 'x', phone: '91234567', payment: 'cash', notes: '' }, { [outsider]: 20 });
    expect(api.bestSellers().map((d) => d.id)).toContain(outsider);
    api.cancelOrder(AISHA, orderId);
    expect(api.bestSellers().map((d) => d.id)).toEqual(before);
  });
});
