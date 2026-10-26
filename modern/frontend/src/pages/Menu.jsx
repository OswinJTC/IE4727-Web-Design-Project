import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Shell from '../components/Shell';
import Pagination from '../components/Pagination';
import { DishesLoading } from '../components/DishStatus';
import { useShop } from '../context/ShopContext';
import { CATEGORIES, categoryCounts, filterDishes, menuUrl, normalizeCategory, normalizeQuery } from '../lib/menuQuery';
import { money, plural } from '../lib/format';
import { btn, container, menuGrid } from '../lib/ui';
import { paginate } from '../lib/paginate';

const PAGE_SIZE = 9; // three rows of the three-column grid

export default function Menu() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { dishes, dishesReady, dishesError, summary, addToCart, decreaseInCart } = useShop();
  const inCart = Object.fromEntries(summary.lines.map((l) => [l.id, l.count]));

  const showDishes = dishesReady && !dishesError; // until then (or if the request failed) skeleton cards fill the page
  const category = normalizeCategory(params.get('category'));
  const q = normalizeQuery(params.get('q'));
  const matching = filterDishes(dishes, category, q);
  const { items, page, pages } = paginate(matching, params.get('page'), PAGE_SIZE);
  const counts = categoryCounts(dishes, q);
  const totalDishes = Object.values(counts).reduce((a, b) => a + b, 0);

  const add = async (id) => {
    const res = await addToCart(id, 1);
    if (res.status === 'login') navigate('/login');
    else if (res.status === 'added') toast.success('Added to your cart.');
    else if (res.status === 'max') toast.warn('You already have the maximum of this dish in your cart.');
    else toast.error('Could not add to your cart. Please try again.');
  };

  const tab = 'rounded-full border border-line bg-white px-[18px] py-[13px] text-[15px] font-black aria-[current=page]:border-night aria-[current=page]:bg-night aria-[current=page]:text-white';
  const stepBtn = 'grid size-[38px] place-items-center rounded-xl text-2xl leading-none font-black';

  return (
    <Shell title="Menu" active="menu">
      <main className={container}>
        <div className="mb-[14px] font-body text-[15px] text-muted"><Link className="underline" to="/">Home</Link> / Menu</div>
        <div className="mb-6 flex items-end justify-between gap-5 max-mobile:flex-col max-mobile:items-stretch">
          <div>
            <h1 className="m-0 text-[42px] leading-[1.05] font-black max-mobile:text-[34px]">Our menu</h1>
            <p className="mt-[6px] mb-0 text-muted">{!showDishes
              ? 'Loading the menu…'
              : q !== ''
                ? <>{matching.length} {plural(matching.length, 'dish', 'dishes')} matching &ldquo;{q}&rdquo;</>
                : `${totalDishes} dishes, cooked fresh when you order`}</p>
          </div>
        </div>
        <nav aria-label="Categories" className="mb-6 flex gap-[10px] max-mobile:flex-col max-mobile:items-stretch">
          <Link className={tab} aria-current={category === '' ? 'page' : undefined} to={menuUrl('', q)}>All{showDishes && <>&nbsp; {totalDishes}</>}</Link>
          {CATEGORIES.map((name) => (
            <Link key={name} className={tab} aria-current={category === name ? 'page' : undefined} to={menuUrl(name, q)}>{name}{showDishes && <>&nbsp; {counts[name]}</>}</Link>
          ))}
        </nav>
        <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-6 max-tablet:grid-cols-1">
          <div className="min-w-0">
            {!showDishes && <DishesLoading />}
            {showDishes && <>
              <section className={menuGrid}>
                {items.map((d) => {
                  const qty = inCart[d.id] ?? 0;
                  return (
                    <article key={d.id} className="relative min-h-[252px] overflow-hidden rounded-2xl border border-line bg-white p-[14px]">
                      <span className="absolute top-6 left-6 z-[1] rounded-full bg-white px-3 py-[7px] text-xs font-black">{d.category}</span>
                      <Link to={`/item/${d.id}`}><div className="relative mb-3 grid h-[180px] place-items-center overflow-hidden rounded-xl"><img className="absolute inset-0 size-full object-cover" src={d.image} alt={d.name} loading="lazy" /></div></Link>
                      <h3 className="m-0 mb-1 text-lg leading-[1.12]">{d.name}</h3>
                      <p className="m-0 mb-[14px] min-h-[35px] text-sm leading-[1.35] text-muted">{d.description}</p>
                      <div className="text-[22px] font-black">{money(d.price)}</div>
                      <div className="absolute right-[18px] bottom-5 flex items-center gap-2">
                        {qty > 0 && (
                          <>
                            <button type="button" className={`${stepBtn} border border-line bg-white text-ink`} aria-label={`Remove one ${d.name}`} onClick={() => decreaseInCart(d.id)}>&minus;</button>
                            <span className="min-w-5 text-center text-base font-black">{qty}</span>
                          </>
                        )}
                        <button type="button" className={`${stepBtn} bg-brand text-white`} aria-label={`Add ${d.name} to cart`} onClick={() => add(d.id)}>+</button>
                      </div>
                    </article>
                  );
                })}
                {matching.length === 0 && (
                  <p className="col-span-full">
                    No dishes {q !== '' ? <>match &ldquo;{q}&rdquo;</> : 'in this category'}.{' '}
                    <Link className="font-black text-brand" to="/menu">View the full menu</Link>
                  </p>
                )}
              </section>
              <Pagination page={page} pages={pages} to={(n) => menuUrl(category, q, n)} />
            </>}
          </div>
          <aside className="sticky top-[90px] self-start rounded-2xl border border-line bg-white px-[22px] py-[26px] max-tablet:static">
            <div className="mb-5 flex items-center justify-between"><h2 className="m-0 text-[22px]">Your order</h2><span className="font-body text-muted">{summary.items} {plural(summary.items, 'item', 'items')}</span></div>
            {summary.lines.map((l) => (
              <div key={l.id} className="my-4 flex items-center justify-between font-body"><span>{l.count} x {l.name}</span><span>{money(l.subtotal)}</span></div>
            ))}
            {summary.lines.length === 0 && <p className="mb-4 text-muted">Your cart is empty. Tap + on a dish to add it.</p>}
            <div className="flex items-center justify-between border-t border-line pt-[18px] font-black"><span>Total</span><strong className="text-[26px]">{money(summary.total)}</strong></div>
            <Link className={`${btn} mt-5 mb-[14px] w-full`} to="/cart">View cart</Link>
            <p className="mb-4 text-muted">Cart is kept in your session until you check out.</p>
          </aside>
        </div>
      </main>
    </Shell>
  );
}
