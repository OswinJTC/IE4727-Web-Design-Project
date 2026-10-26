import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Shell from '../components/Shell';
import Stepper from '../components/Stepper';
import DishImage from '../components/DishImage';
import { LockIcon, TrashIcon } from '../components/icons';
import { useShop } from '../context/ShopContext';
import { MAX_PER_DISH } from '../lib/cart';
import { money } from '../lib/format';
import { backLink, btn, container } from '../lib/ui';

const row = 'grid grid-cols-[minmax(0,2.4fr)_1fr_1.4fr_1fr_56px] items-center gap-4 border-b border-line px-[26px] py-5 max-mobile:grid-cols-[1fr_auto] max-mobile:gap-3';
const qtyBtn = 'h-full text-xl text-ink disabled:cursor-default disabled:text-[#bbb4ad]';

export default function Cart() {
  const { summary, addToCart, decreaseInCart, removeFromCart } = useShop();
  return (
    <Shell title="Your cart">
      <main className={container}>
        <div className="mb-[30px] flex items-center justify-between gap-5 max-tablet:flex-col max-tablet:items-start"><h1 className="text-5xl leading-[1.05] font-black max-mobile:text-[34px]">Your cart</h1><Stepper step={1} /></div>
        <div className="grid grid-cols-[minmax(0,1fr)_390px] items-start gap-8 max-tablet:grid-cols-1">
          <section className="rounded-2xl border border-line bg-white">
            <div className={`${row} font-body text-[13px] font-bold tracking-[0.04em] text-muted uppercase max-mobile:hidden`}><span>Dish</span><span>Price</span><span>Quantity</span><span>Subtotal</span><span></span></div>
            {summary.lines.map((l) => (
              <div key={l.id} className={row}>
                <div className="flex items-center gap-4 max-mobile:col-span-full"><DishImage dish={l} /><span><h3 className="mb-[3px] text-[17px]">{l.name}</h3><p className="m-0 text-sm text-muted">{l.category}</p></span></div>
                <div className="font-body text-lg">{money(l.price)}</div>
                <div className="grid h-[50px] w-[140px] grid-cols-3 items-center rounded-[10px] border border-line bg-white text-center text-lg font-black">
                  <button type="button" className={qtyBtn} aria-label={`Decrease quantity of ${l.name}`} onClick={() => decreaseInCart(l.id)}>&minus;</button>
                  <span>{l.count}</span>
                  <button type="button" className={qtyBtn} aria-label={`Increase quantity of ${l.name}`} disabled={l.count >= MAX_PER_DISH} onClick={() => addToCart(l.id, 1)}>+</button>
                </div>
                <div className="text-lg font-black">{money(l.subtotal)}</div>
                <button type="button" className="grid size-11 place-items-center rounded-[10px] border border-line bg-white text-muted [&>svg]:size-[18px]" aria-label={`Remove ${l.name}`} onClick={async () => { await removeFromCart(l.id); toast.info(`${l.name} removed from your cart.`); }}><TrashIcon /></button>
              </div>
            ))}
            {summary.lines.length === 0 && (
              <div className={row}><span>Your cart is empty. <Link className={backLink} to="/menu">Browse the menu</Link></span></div>
            )}
            <div className="flex items-center justify-between gap-4 px-[26px] py-[18px] font-body text-sm text-muted max-mobile:flex-col max-mobile:items-start"><Link className={`${backLink} m-0!`} to="/menu">&larr; Continue browsing</Link><span>Quantities between 1 and {MAX_PER_DISH} per dish</span></div>
          </section>
          <aside className="sticky top-[90px] self-start rounded-[20px] border border-line bg-white px-8 py-[30px] max-tablet:static max-mobile:px-5 max-mobile:py-[22px]">
            <h2 className="mb-[18px] text-[26px]">Order summary</h2>
            <div className="my-4 flex items-center justify-between pb-[18px] font-body text-lg text-muted"><span>Items ({summary.items})</span><span>{money(summary.total)}</span></div>
            <div className="flex items-center justify-between border-t border-line pt-[18px] text-[17px] font-black"><span>Total</span><strong className="text-[26px]">{money(summary.total)}</strong></div>
            {summary.lines.length > 0 && <Link className={`${btn} mt-6 mb-[18px] min-h-14! w-full text-[17px]`} to="/checkout">Proceed to checkout &rarr;</Link>}
            <p className="flex items-start gap-3 rounded-xl bg-[#f4f2f0] p-4 font-body text-[15px]/[1.45] text-muted"><span className="[&>svg]:block [&>svg]:size-5"><LockIcon /></span>Prices are confirmed again at checkout.</p>
          </aside>
        </div>
      </main>
    </Shell>
  );
}
