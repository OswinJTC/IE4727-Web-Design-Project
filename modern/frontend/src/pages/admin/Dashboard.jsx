import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CATEGORIES, STATUSES, StatusBadge, useAdmin } from './Admin';

const TIME_ZONE = 'Asia/Singapore';
const dateParts = new Intl.DateTimeFormat('en', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const currencyFormat = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
});
const compactFormat = new Intl.NumberFormat('en-SG', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const currency = (value) => currencyFormat.format(value);
const compactCurrency = (value) => `$${compactFormat.format(value)}`;
const shortDate = (value) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString('en-SG', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  });
const calendarDate = (value) => {
  const parts = Object.fromEntries(
    dateParts.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const STATUS_COLORS = {
  Pending: '#c2410c',
  Preparing: '#3b6fc9',
  'Out for delivery': '#8b5cf6',
  Delivered: '#2f7a45',
  Cancelled: '#a8a29e',
};
const tooltipStyle = { border: '1px solid #ded9d4', borderRadius: 10, fontSize: 12 };

// Orders are counted once. Category sales use historical line prices, never today's menu prices.
export function buildDashboardData(menu, orders, days = 30, now = new Date()) {
  const today = calendarDate(now);
  const firstDay = new Date(`${today}T00:00:00Z`);
  firstDay.setUTCDate(firstDay.getUTCDate() - days + 1);
  const daily = new Map();
  for (let index = 0; index < days; index += 1) {
    const day = new Date(firstDay);
    day.setUTCDate(day.getUTCDate() + index);
    const key = day.toISOString().slice(0, 10);
    daily.set(key, { date: key, cents: 0, orders: 0 });
  }
  const dishes = new Map(menu.map((dish) => [dish.id, dish]));
  const categories = new Map(CATEGORIES.map((name) => [name, { name, cents: 0, units: 0 }]));
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  let revenueCents = 0;
  for (const order of orders) {
    counts[order.status] += 1;
    if (order.status === 'Cancelled') continue;
    const cents = Math.round(Number(order.total) * 100);
    revenueCents += cents;
    const day = daily.get(calendarDate(order.date));
    if (day) {
      day.cents += cents;
      day.orders += 1;
    }
    for (const item of order.items) {
      const name = dishes.get(item.dishId)?.category ?? 'Uncategorised';
      if (!categories.has(name)) categories.set(name, { name, cents: 0, units: 0 });
      const category = categories.get(name);
      category.cents += Math.round(Number(item.unitPrice) * 100) * item.quantity;
      category.units += item.quantity;
    }
  }
  return {
    revenue: revenueCents / 100,
    totalOrders: orders.length,
    totalProducts: menu.length,
    availableProducts: menu.filter((dish) => dish.available).length,
    pendingOrders: counts.Pending,
    statuses: STATUSES.map((name) => ({ name, count: counts[name], color: STATUS_COLORS[name] })),
    categories: [...categories.values()].map(({ cents, ...category }) => ({
      ...category,
      revenue: cents / 100,
    })),
    sales: [...daily.values()].map(({ cents, ...day }) => ({ ...day, revenue: cents / 100 })),
    recentOrders: [...orders]
      .sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id)
      .slice(0, 5),
  };
}

function MetricIcon({ name }) {
  const paths = {
    revenue: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18m-6 5h3" />
      </>
    ),
    orders: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6m-6 4h6m-6 4h4" />
      </>
    ),
    products: (
      <>
        <path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10" />
      </>
    ),
    pending: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function MetricCard({ title, value, hint, icon, to }) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold text-muted">{title}</h2>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <MetricIcon name={icon} />
        </span>
      </div>
      <p className="mt-3 break-words text-[28px] leading-tight font-bold tracking-[-0.8px] text-ink">
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{hint}</p>
    </>
  );
  const classes = 'block min-w-0 rounded-2xl border border-line bg-white p-5';
  return to ? (
    <Link
      className={`${classes} transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
      to={to}
    >
      {content}
    </Link>
  ) : (
    <article className={classes}>{content}</article>
  );
}

function ChartPanel({ title, hint, action, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-white p-5" aria-label={title}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base text-ink">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ChartData({ headings, rows }) {
  return (
    <details className="mt-4 border-t border-line pt-3 text-xs text-muted">
      <summary className="w-fit cursor-pointer rounded font-semibold focus-visible:outline-2 focus-visible:outline-brand">
        View chart data
      </summary>
      <div className="mt-3 max-h-64 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {headings.map((heading) => (
                <th className="border-b border-line px-2 py-2 font-semibold" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((value, j) => (
                  <td className="border-b border-line/60 px-2 py-2 whitespace-nowrap" key={j}>
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function EmptyChart({ children }) {
  return (
    <div className="grid min-h-[240px] place-items-center rounded-xl bg-bg px-6 text-center text-sm leading-relaxed text-muted">
      {children}
    </div>
  );
}

// Kept separate from fetching so the same view is easy to test and the admin panel owns data access.
export function DashboardView({ menu, orders, reload, refreshedAt }) {
  const [days, setDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const data = useMemo(() => buildDashboardData(menu, orders, days), [menu, orders, days]);
  const activeStatuses = data.statuses.filter((status) => status.count > 0);
  const periodRevenue =
    data.sales.reduce((total, day) => total + Math.round(day.revenue * 100), 0) / 100;
  const periodOrders = data.sales.reduce((total, day) => total + day.orders, 0);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-5 font-body">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight tracking-[-1px] text-ink">Dashboard</h1>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            All-time summaries · Singapore time
            {refreshedAt && (
              <>
                {' '}
                · Updated{' '}
                {new Date(refreshedAt).toLocaleTimeString('en-SG', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                  timeZone: TIME_ZONE,
                })}
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={refreshing}
          onClick={refresh}
          className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-line bg-white px-4 text-xs font-semibold text-ink hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
        >
          <span aria-hidden="true">↻</span>
          {refreshing ? 'Refreshing…' : 'Refresh data'}
        </button>
      </header>

      <section
        aria-label="Store summary"
        className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          title="Total Revenue"
          value={currency(data.revenue)}
          hint="Non-cancelled order value · SGD"
          icon="revenue"
        />
        <MetricCard
          title="Total Orders"
          value={data.totalOrders.toLocaleString('en-SG')}
          hint="All orders, including cancellations"
          icon="orders"
          to="/admin/orders?status=all"
        />
        <MetricCard
          title="Total Products"
          value={data.totalProducts.toLocaleString('en-SG')}
          hint={`Current menu · ${data.availableProducts} shown, ${data.totalProducts - data.availableProducts} hidden`}
          icon="products"
          to="/admin/menu"
        />
        <MetricCard
          title="Pending Orders"
          value={data.pendingOrders.toLocaleString('en-SG')}
          hint="Orders waiting for preparation"
          icon="pending"
          to="/admin/orders?status=Pending"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">
        <ChartPanel
          title="Sales Overview"
          hint="Daily non-cancelled order value · SGD"
          action={
            <div
              role="group"
              aria-label="Sales overview period"
              className="flex gap-1 rounded-lg bg-bg p-1"
            >
              {[7, 30, 90].map((period) => (
                <button
                  type="button"
                  key={period}
                  aria-pressed={days === period}
                  onClick={() => setDays(period)}
                  className="rounded-md px-3 py-2 text-xs text-muted aria-pressed:bg-white aria-pressed:font-bold aria-pressed:text-ink aria-pressed:shadow-sm focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {period} days
                </button>
              ))}
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-2xl font-bold text-ink" aria-label="Sales in selected period">
              {currency(periodRevenue)}
            </p>
            <p className="text-xs text-muted">
              {periodOrders} {periodOrders === 1 ? 'order' : 'orders'} ·{' '}
              {shortDate(data.sales[0].date)}–{shortDate(data.sales.at(-1).date)}
            </p>
          </div>
          {periodOrders ? (
            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                initialDimension={{ width: 480, height: 260 }}
              >
                <AreaChart
                  data={data.sales}
                  margin={{ top: 12, right: 10, bottom: 8, left: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid stroke="#e7e3df" strokeDasharray="3 4" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    interval="preserveStartEnd"
                    minTickGap={32}
                    tick={{ fontSize: 11, fill: '#6d6560' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    width={60}
                    domain={[0, 'auto']}
                    tickFormatter={compactCurrency}
                    tick={{ fontSize: 11, fill: '#6d6560' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [currency(value), 'Order value']}
                    labelFormatter={shortDate}
                  />
                  <Area
                    type="linear"
                    dataKey="revenue"
                    name="Order value"
                    stroke="#c2410c"
                    fill="#fff0ea"
                    strokeWidth={2.5}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart>
              No sales in this period. New non-cancelled orders will appear here.
            </EmptyChart>
          )}
          <ChartData
            headings={['Date (Singapore)', 'Revenue (SGD)', 'Orders']}
            rows={data.sales.map((day) => [day.date, currency(day.revenue), day.orders])}
          />
        </ChartPanel>

        <ChartPanel title="Orders by Status" hint="All time · every order status">
          {data.totalOrders ? (
            <div className="relative mx-auto h-[220px] max-w-[320px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                initialDimension={{ width: 320, height: 220 }}
              >
                <PieChart accessibilityLayer>
                  <Pie
                    data={activeStatuses}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={64}
                    outerRadius={88}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {activeStatuses.map((status) => (
                      <Cell key={status.name} fill={status.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} orders`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[28px] font-bold text-ink">{data.totalOrders}</span>
                <span className="mt-1 text-xs text-muted">total orders</span>
              </div>
            </div>
          ) : (
            <EmptyChart>No orders yet.</EmptyChart>
          )}
          <ul className="mt-2 space-y-3">
            {data.statuses.map((status) => (
              <li key={status.name}>
                <Link
                  to={`/admin/orders?status=${encodeURIComponent(status.name)}`}
                  className="flex items-center justify-between gap-3 rounded py-1 text-xs hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: status.color }}
                      aria-hidden="true"
                    />
                    {status.name}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {status.count}{' '}
                    <span className="ml-2 font-normal text-muted">
                      {data.totalOrders ? Math.round((status.count / data.totalOrders) * 100) : 0}%
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ChartPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel
          title="Sales by Category"
          hint="All time · non-cancelled items at checkout prices"
        >
          {data.categories.some((category) => category.units > 0) ? (
            <div className="h-[240px] w-full min-w-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                initialDimension={{ width: 480, height: 240 }}
              >
                <BarChart
                  data={data.categories}
                  layout="vertical"
                  margin={{ top: 0, right: 68, bottom: 0, left: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid stroke="#e7e3df" strokeDasharray="3 4" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 'auto']}
                    tickFormatter={compactCurrency}
                    tick={{ fontSize: 11, fill: '#6d6560' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tick={{ fontSize: 12, fill: '#6d6560' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [currency(value), 'Sales']}
                    cursor={{ fill: '#f6f5f3' }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#c2410c"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={24}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="revenue"
                      position="right"
                      formatter={compactCurrency}
                      style={{ fontSize: 11, fill: '#1c1917' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart>No category sales yet.</EmptyChart>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Grouped by each dish’s current category.
          </p>
          <ChartData
            headings={['Category', 'Sales (SGD)', 'Units sold']}
            rows={data.categories.map((category) => [
              category.name,
              currency(category.revenue),
              category.units,
            ])}
          />
        </ChartPanel>

        <ChartPanel
          title="Recent Orders"
          hint="The five most recent orders"
          action={
            <Link
              to="/admin/orders?status=all"
              className="rounded text-xs font-semibold text-brand focus-visible:outline-2 focus-visible:outline-brand"
            >
              View all orders →
            </Link>
          }
        >
          {data.recentOrders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[410px] border-collapse text-left text-xs">
                <thead>
                  <tr className="text-[10px] tracking-wide text-muted uppercase">
                    <th className="border-b border-line py-3 pr-3">Order</th>
                    <th className="border-b border-line px-3 py-3">Customer</th>
                    <th className="border-b border-line px-3 py-3 text-right">Total</th>
                    <th className="border-b border-line py-3 pl-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="border-b border-line/60 py-4 pr-3">
                        <Link
                          className="font-bold text-brand underline-offset-2 hover:underline"
                          to={`/admin/orders?status=all&id=${order.id}`}
                        >
                          #{order.id}
                        </Link>
                      </td>
                      <td className="border-b border-line/60 px-3 py-4">{order.customer}</td>
                      <td className="border-b border-line/60 px-3 py-4 text-right whitespace-nowrap">
                        {currency(order.total)}
                      </td>
                      <td className="border-b border-line/60 py-4 pl-3 text-right">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyChart>No orders yet. New orders will appear here.</EmptyChart>
          )}
        </ChartPanel>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { menu, orders, reload, dataReady, refreshedAt, error } = useAdmin();
  if (!dataReady)
    return (
      <div className="rounded-2xl border border-line bg-white p-8 font-body">
        <h1 className="text-2xl text-ink">Dashboard</h1>
        <p className="mt-3 text-sm text-muted">
          {error
            ? 'Dashboard data is unavailable. Use Retry above to load the latest figures.'
            : 'Loading dashboard data…'}
        </p>
      </div>
    );
  return <DashboardView menu={menu} orders={orders} reload={reload} refreshedAt={refreshedAt} />;
}
