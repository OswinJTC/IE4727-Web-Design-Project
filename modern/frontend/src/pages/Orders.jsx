import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Shell from '../components/Shell';
import Pagination from '../components/Pagination';
import DishImage from '../components/DishImage';
import { useShop } from '../context/ShopContext';
import { formatDate, money } from '../lib/format';
import { paginate } from '../lib/paginate';
import { btnDanger, container, loading } from '../lib/ui';

const PAGE_SIZE = 9;

const TABS = { all: 'All', active: 'Active', completed: 'Completed', cancelled: 'Cancelled' };
const GROUPS = {
  active: ['Pending', 'Preparing', 'Out for delivery'],
  completed: ['Delivered'],
  cancelled: ['Cancelled'],
};
const STATUS_CLASS = {
  Pending: 'bg-st-pending text-[#b4510a]',
  Preparing: 'bg-st-preparing text-[#1f4fb4]',
  'Out for delivery': 'bg-st-delivery text-[#6a2bc4]',
  Delivered: 'bg-st-delivered text-ok',
  Cancelled: 'bg-st-cancelled text-[#4a443f]',
};
const statusPill = "inline-flex items-center gap-[7px] rounded-full px-3 py-[6px] font-body text-[13px] font-bold whitespace-nowrap before:size-[6px] before:rounded-full before:bg-current before:content-['']";
const filterTab = 'rounded-[9px] px-5 py-[11px] text-[15px] font-black text-[#4a443f] aria-[current=page]:bg-white aria-[current=page]:text-ink aria-[current=page]:shadow-[0_1px_3px_rgba(26,24,22,0.12)] max-mobile:px-[14px] max-mobile:py-[10px]';
const cell = 'border-b border-[#eee8e2] p-5 group-last:border-b-0';
const STEPS = [['Pending', 'Order received'], ['Preparing', 'Preparing'], ['Out for delivery', 'Out for delivery'], ['Delivered', 'Delivered']];
const PAYMENT_LABEL = { cash: 'Cash on delivery', card: 'Card on delivery', paynow: 'PayNow' };

export default function Orders() {
  const { ready, user, orders: allOrders, ordersReady, cancelOrder } = useShop();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [cancelling, setCancelling] = useState(false);
  if (!ready) return <Shell title="My orders" active="orders"><main className={container} /></Shell>;
  if (!user) return <Navigate to="/login" replace />; // orders belong to a logged-in user
  if (!ordersReady) return <Shell title="My orders" active="orders"><main className={container}><p className={loading} role="status">Loading orders…</p></main></Shell>;

  const requested = params.get('filter');
  const filter = Object.hasOwn(TABS, requested) ? requested : 'all';
  const matching = filter === 'all' ? allOrders : allOrders.filter((o) => GROUPS[filter].includes(o.status));

  // The selected order: ?id= if it is in the list, otherwise the newest. The table shows the page that holds it.
  const wantedId = Number(params.get('id'));
  const selected = matching.find((o) => o.id === wantedId) ?? matching[0] ?? null;
  const { items: orders, page, pages } = paginate(matching, params.get('page'), PAGE_SIZE);

  const ordersUrl = (key, id, pageNo = 1) => {
    const p = new URLSearchParams();
    if (key !== 'all') p.set('filter', key);
    if (id) p.set('id', id);
    if (pageNo > 1) p.set('page', pageNo);
    const s = p.toString();
    return '/orders' + (s ? '?' + s : '');
  };

  const cancel = async () => {
    // Cancelling cannot be undone, so ask first
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    const ok = await cancelOrder(selected.id);
    setCancelling(false);
    if (ok) toast.success(`Order #${selected.id} cancelled.`);
    else toast.error('This order can no longer be cancelled.');
  };

  return (
    <Shell title="My orders" active="orders">
      <main className={container}>
        <div className="mb-[30px] flex items-center justify-between gap-5 max-tablet:flex-col max-tablet:items-start">
          <h1 className="text-5xl leading-[1.05] font-black max-mobile:text-[34px]">My orders</h1>
          <nav aria-label="Order filter" className="flex gap-1 rounded-xl bg-[#ebe8e5] p-[5px] max-mobile:w-full max-mobile:overflow-x-auto">
            {Object.entries(TABS).map(([key, label]) => (
              <Link key={key} className={filterTab} aria-current={filter === key ? 'page' : undefined} to={ordersUrl(key)}>{label}</Link>
            ))}
          </nav>
        </div>

        {!selected ? (
          <section className="overflow-hidden rounded-2xl border border-line bg-white">
            <p className="m-0 p-7 text-center text-sm leading-[1.45] text-muted">
              {allOrders.length > 0 ? `No ${TABS[filter].toLowerCase()} orders.` : 'You have not placed any orders yet.'}{' '}
              <Link className="font-black text-brand" to="/menu">Browse the menu</Link>
            </p>
          </section>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_390px] items-start gap-6 max-tablet:grid-cols-1">
            <section className="overflow-hidden rounded-2xl border border-line bg-white max-mobile:overflow-x-auto">
              <table className="w-full font-body text-base">
                <thead><tr>{['Order', 'Placed', 'Items', 'Total', 'Status'].map((h) => <th key={h} className="border-b border-line px-5 py-[18px] text-left text-[13px] font-normal tracking-[0.04em] text-muted uppercase">{h}</th>)}</tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="group aria-[current=true]:bg-[#fff8f3]" aria-current={o.id === selected.id ? 'true' : undefined} onClick={() => navigate(ordersUrl(filter, o.id, page))}>
                      <td className={cell}><Link className="font-black text-brand" to={ordersUrl(filter, o.id, page)}>#{o.id}</Link></td>
                      <td className={cell}>{formatDate(o.date)}</td>
                      <td className={cell}>{o.itemCount}</td>
                      <td className={cell}><strong>{money(o.total)}</strong></td>
                      <td className={cell}><span className={`${statusPill} ${STATUS_CLASS[o.status]}`}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination className="border-t border-line p-4" page={page} pages={pages} to={(n) => ordersUrl(filter, 0, n)} />
            </section>
            <OrderDetail order={selected} onCancel={cancel} cancelling={cancelling} />
          </div>
        )}
      </main>
    </Shell>
  );
}

function OrderDetail({ order, onCancel, cancelling }) {
  let reached = true;
  return (
    <aside className="sticky top-[90px] self-start rounded-[20px] border border-line bg-white p-6 max-tablet:static">
      <div className="flex items-center justify-between font-body text-[15px] text-muted"><span>Order details</span><span className={`${statusPill} ${STATUS_CLASS[order.status]}`}>{order.status}</span></div>
      <h2 className="mt-[6px] mb-5 text-[28px]">#{order.id}</h2>
      {order.status === 'Cancelled' ? (
        <p className="m-0 text-center text-[13px] leading-[1.45] text-muted">This order was cancelled on {formatDate(order.updatedAt)}.</p>
      ) : (
        <ol aria-label="Order progress" className="relative m-0 mb-[22px] list-none border-b border-line p-0 pb-[22px]">
          {STEPS.map(([status, label]) => {
            const isCurrent = status === order.status;
            const state = isCurrent ? 'current' : reached ? 'done' : 'todo';
            if (isCurrent) reached = false;
            return (
              <li key={status} data-state={state} className={`relative flex items-start gap-[14px] pb-[14px] font-black last:pb-0 not-last:before:absolute not-last:before:top-6 not-last:before:-bottom-[2px] not-last:before:left-[10px] not-last:before:w-[2px] not-last:before:bg-line not-last:before:content-[''] ${state === 'todo' ? 'text-muted' : 'text-ink'}`}>
                <span className={`size-[22px] shrink-0 rounded-full border-2 ${
                  state === 'current' ? 'border-brand bg-white shadow-[inset_0_0_0_4px_#fff,inset_0_0_0_20px_var(--color-brand)]' : state === 'done' ? 'border-brand bg-brand' : 'border-line bg-white'
                }`}></span>
                <span><strong>{label}</strong>{isCurrent && <small className="mt-[3px] block font-body text-[13px] font-normal text-muted">{formatDate(status === 'Pending' ? order.date : order.updatedAt)}</small>}</span>
              </li>
            );
          })}
        </ol>
      )}
      {order.items.map((line) => (
        <div key={line.dishId} className="mb-4 grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-[14px]">
          <DishImage dish={line} className="size-10" />
          <span><h3 className="m-0 text-[15px]">{line.name} &times; {line.quantity}</h3></span>
          <strong className="font-body text-lg font-bold">{money(line.unitPrice * line.quantity)}</strong>
        </div>
      ))}
      <div className="mb-[18px] flex items-center justify-between border-t border-line pt-[18px] font-black"><span>Total</span><strong className="text-[26px]">{money(order.total)}</strong></div>
      <div className="block rounded-xl bg-[#f4f2f0] p-4 font-body text-sm/[1.45] text-muted [&_p]:mb-[6px]">
        <p><span>Deliver to</span> {order.address}</p>
        <p><span>Phone</span> {order.phone} &middot; <span>Payment</span> {PAYMENT_LABEL[order.payment]}</p>
        {order.notes && <p><span>Notes</span> {order.notes}</p>}
      </div>
      {order.status === 'Pending' && (
        <>
          <button type="button" className={btnDanger} onClick={onCancel} disabled={cancelling}>{cancelling ? 'Cancelling…' : 'Cancel order'}</button>
          <p className="m-0 text-center text-[13px] leading-[1.45] text-muted">Orders can be cancelled until the kitchen starts preparing.</p>
        </>
      )}
    </aside>
  );
}
