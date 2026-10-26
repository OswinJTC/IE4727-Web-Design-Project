import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Shell from '../components/Shell';
import { DishesFailed } from '../components/DishStatus';
import { CartIcon } from '../components/icons';
import { useShop } from '../context/ShopContext';
import { MAX_PER_DISH } from '../lib/cart';
import { money } from '../lib/format';
import { backLink, btn, container, loading, seeAll } from '../lib/ui';

// Up to 4 other dishes of the same category, starting after this one (stable, unlike PHP's RAND())
function moreInCategory(dishes, dish) {
  const same = dishes.filter((d) => d.category === dish.category);
  const start = same.findIndex((d) => d.id === dish.id);
  return [...same.slice(start + 1), ...same.slice(0, start)].slice(0, 4);
}

const crumb = 'mb-[14px] font-body text-[15px] text-muted';
const title = 'mb-[22px] text-[46px] leading-[1.05] font-black max-mobile:text-[34px]';
const desc = 'mb-[22px] border-b border-line pb-6 text-[17px] leading-[1.45] text-[#3c3733]';
const qtyBtn = 'h-full text-xl disabled:cursor-default disabled:text-[#bbb4ad]';
const infoCard = 'grid grid-cols-[48px_1fr] gap-[14px] rounded-2xl border border-line bg-white p-4';
const miniIcon = 'grid size-[42px] shrink-0 place-items-center rounded-[10px] bg-peach text-[#bf9f88] [&>svg]:block [&>svg]:size-5';

export default function Item() {
  const { id: rawId } = useParams();
  const id = /^[1-9]\d*$/.test(rawId) ? Number(rawId) : null;
  const navigate = useNavigate();
  const { dishes, dishesReady, dishesError, loadDishes, addToCart } = useShop();
  const dish = id === null ? null : dishes.find((d) => d.id === id) ?? null;
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState(null); // { text, cartLink }

  if (!dishesReady) {
    return <Shell title="Dish" active="menu"><main className={container}><p className={loading} role="status">Loading dish…</p></main></Shell>;
  }
  if (dishesError) {
    return <Shell title="Dish" active="menu"><main className={container}><DishesFailed onRetry={loadDishes} /></main></Shell>;
  }
  if (!dish) {
    return (
      <Shell title="Dish not found" active="menu">
        <main className={container}>
          <div className={crumb}><Link className="underline" to="/">Home</Link> / <Link className="underline" to="/menu">Menu</Link> / <strong>Dish not found</strong></div>
          <section className="pt-[6px]">
            <h1 className={title}>Dish not found</h1>
            <p className={desc}>This dish does not exist or is no longer available.</p>
            <Link className={backLink} to="/menu">&lt; Back to menu</Link>
          </section>
        </main>
      </Shell>
    );
  }

  const more = moreInCategory(dishes, dish);

  const add = async () => {
    const res = await addToCart(dish.id, qty);
    if (res.status === 'login') return navigate('/login');
    if (res.status === 'error') toast.error('Could not add to your cart. Please try again.');
    else if (res.status === 'added') toast.success(`Added ${res.added} to your cart.`);
    else toast.warn(`You already have the maximum (${MAX_PER_DISH}) of this dish in your cart.`);
    if (res.status === 'error') return setNote({ text: 'Could not add to your cart. Please try again.', cartLink: false });
    setNote(res.status === 'added'
      ? { text: `Added ${res.added} to your cart. `, cartLink: true }
      : { text: `You already have the maximum (${MAX_PER_DISH}) of this dish in your cart.`, cartLink: false });
  };

  return (
    <Shell title={dish.name} active="menu">
      <main className={container}>
        <div className={crumb}>
          <Link className="underline" to="/">Home</Link> / <Link className="underline" to="/menu">Menu</Link> / <Link className="underline" to={`/menu?category=${dish.category}`}>{dish.category}</Link> / <strong>{dish.name}</strong>
        </div>
        <section className="mt-10 grid grid-cols-[1.05fr_0.98fr] items-start gap-12 max-tablet:grid-cols-1">
          <div><div className="relative grid h-[450px] place-items-center overflow-hidden rounded-[22px] max-mobile:h-80"><img className="absolute inset-0 size-full object-cover" src={dish.image} alt={dish.name} /></div></div>
          <div className="pt-[6px]">
            <span className="mb-[22px] inline-flex rounded-full bg-brand-soft px-[13px] py-[9px] text-sm font-black text-brand-dark">{dish.category}</span>
            <h1 className={title}>{dish.name}</h1>
            <div className="mb-[26px] text-[40px] font-black">{money(dish.price)}</div>
            <p className={desc}>{dish.description}</p>
            <div className="grid grid-cols-[140px_1fr] gap-3 max-mobile:grid-cols-1">
              <div className="grid h-[50px] grid-cols-3 items-center rounded-[10px] border border-line bg-white text-center text-lg font-black">
                <button type="button" className={qtyBtn} aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(qty - 1)}>&minus;</button>
                <span data-testid="qty-value">{qty}</span>
                <button type="button" className={qtyBtn} aria-label="Increase quantity" disabled={qty >= MAX_PER_DISH} onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <button type="button" className={btn} onClick={add}>
                <CartIcon width="19" height="19" /> Add to cart - <span>{money(qty * dish.price)}</span>
              </button>
            </div>
            <p className="mt-[14px] rounded-[10px] bg-[#e6f4ea] px-[14px] py-3 font-body text-sm font-bold text-[#14532d] empty:hidden" role="status">
              {note && <>{note.text}{note.cartLink && <Link className="underline" to="/cart">View cart</Link>}</>}
            </p>
            <Link className={backLink} to="/menu">&lt; Back to menu</Link>
            <div className="grid grid-cols-2 gap-3 max-mobile:grid-cols-1">
              <div className={infoCard}><span className={miniIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 7h14v10H5z" /><path d="M8 12h8" /></svg></span><span><h3 className="mb-[3px] text-[15px]">Pay your way</h3><p className="m-0 text-sm leading-[1.55] text-muted">Cash, card on delivery or PayNow</p></span></div>
              <div className={infoCard}><span className={miniIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg></span><span><h3 className="mb-[3px] text-[15px]">Track your order</h3><p className="m-0 text-sm leading-[1.55] text-muted">Live status in My orders</p></span></div>
            </div>
          </div>
        </section>

        {more.length > 0 && (
          <>
            <div className="mt-[46px] mb-5 flex items-center justify-between"><h2 className="m-0 text-[26px]">More in {dish.category}</h2><Link className={seeAll} to={`/menu?category=${dish.category}`}>View all -&gt;</Link></div>
            <section className="grid grid-cols-4 gap-[14px] max-tablet:grid-cols-2 max-mobile:grid-cols-1">
              {more.map((o) => (
                <Link key={o.id} to={`/item/${o.id}`}>
                  <article className="rounded-[14px] border border-line bg-white p-3"><div className="relative mb-[14px] grid h-[132px] place-items-center overflow-hidden rounded-xl"><img className="absolute inset-0 size-full object-cover" src={o.image} alt={o.name} loading="lazy" /></div><h3 className="mb-[14px] text-base">{o.name}</h3><div className="text-[22px] font-black">{money(o.price)}</div></article>
                </Link>
              ))}
            </section>
          </>
        )}
      </main>
    </Shell>
  );
}
