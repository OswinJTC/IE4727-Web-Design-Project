import { describe, expect, it } from 'vitest';
import { buildDashboardData } from './Dashboard';

const now = new Date('2026-10-27T09:00:00Z');
const menu = [
  { id: 1, category: 'Mains', price: 99, available: true },
  { id: 2, category: 'Drinks', price: 50, available: false },
];
const orders = [
  {
    id: 1,
    date: '2026-10-26T16:30:00Z',
    status: 'Delivered',
    total: 10.35,
    items: [{ dishId: 1, quantity: 3, unitPrice: 3.45 }],
  },
  {
    id: 2,
    date: '2026-10-27T08:00:00Z',
    status: 'Cancelled',
    total: 8,
    items: [{ dishId: 2, quantity: 2, unitPrice: 4 }],
  },
  {
    id: 3,
    date: '2026-10-25T15:59:00Z',
    status: 'Pending',
    total: 0.3,
    items: [{ dishId: 2, quantity: 3, unitPrice: 0.1 }],
  },
  {
    id: 4,
    date: '2026-10-01T08:00:00Z',
    status: 'Preparing',
    total: 5,
    items: [{ dishId: 1, quantity: 1, unitPrice: 5 }],
  },
];

describe('dashboard analytics', () => {
  it('counts each order once, excludes cancellations from revenue, and counts hidden products', () => {
    const data = buildDashboardData(menu, orders, 3, now);
    expect(data).toMatchObject({
      revenue: 15.65,
      totalOrders: 4,
      totalProducts: 2,
      availableProducts: 1,
      pendingOrders: 1,
    });
    expect(data.statuses.reduce((sum, status) => sum + status.count, 0)).toBe(4);
    expect(data.statuses.find((status) => status.name === 'Cancelled').count).toBe(1);
  });

  it('uses historical line prices and reconciles category sales to revenue without floating-point drift', () => {
    const data = buildDashboardData(menu, orders, 3, now);
    expect(data.categories.find((category) => category.name === 'Mains')).toMatchObject({
      revenue: 15.35,
      units: 4,
    });
    expect(data.categories.find((category) => category.name === 'Drinks')).toMatchObject({
      revenue: 0.3,
      units: 3,
    });
    expect(
      data.categories.reduce((cents, category) => cents + Math.round(category.revenue * 100), 0),
    ).toBe(1565);
  });

  it('buckets dates in Singapore time, includes today, and fills days with no orders with zero', () => {
    const data = buildDashboardData(menu, orders, 3, now);
    expect(data.sales).toEqual([
      { date: '2026-10-25', revenue: 0.3, orders: 1 },
      { date: '2026-10-26', revenue: 0, orders: 0 },
      { date: '2026-10-27', revenue: 10.35, orders: 1 },
    ]);
    expect(data.revenue).toBe(15.65); // All-time summaries stay independent of the chart's date window.
  });

  it('keeps multi-item orders at order grain and preserves an unmapped category instead of dropping sales', () => {
    const data = buildDashboardData(
      menu,
      [
        {
          id: 1,
          date: now,
          status: 'Pending',
          total: 0.3,
          items: [
            { dishId: 1, quantity: 1, unitPrice: 0.1 },
            { dishId: 99, quantity: 1, unitPrice: 0.2 },
          ],
        },
      ],
      7,
      now,
    );
    expect(data.totalOrders).toBe(1);
    expect(data.revenue).toBe(0.3);
    expect(data.categories.find((category) => category.name === 'Uncategorised')).toMatchObject({
      revenue: 0.2,
      units: 1,
    });
  });

  it('represents empty data as measured zero, with no invented chart observations', () => {
    const data = buildDashboardData([], [], 90, now);
    expect(data).toMatchObject({
      revenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      pendingOrders: 0,
      recentOrders: [],
    });
    expect(data.sales).toHaveLength(90);
    expect(data.sales.every((day) => day.revenue === 0 && day.orders === 0)).toBe(true);
    expect(data.statuses.every((status) => status.count === 0)).toBe(true);
  });

  it('sorts the five most recent orders without changing the shared order list', () => {
    const source = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      date: now,
      status: 'Pending',
      total: 1,
      items: [],
    }));
    expect(buildDashboardData(menu, source, 7, now).recentOrders.map((order) => order.id)).toEqual([
      7, 6, 5, 4, 3,
    ]);
    expect(source.map((order) => order.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
