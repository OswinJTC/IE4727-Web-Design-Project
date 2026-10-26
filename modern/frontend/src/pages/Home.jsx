import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Shell from '../components/Shell';
import { DishesLoading } from '../components/DishStatus';
import { api } from '../api/client';
import { money } from '../lib/format';
import { btn, container, homeGrid, seeAll, tone } from '../lib/ui';

const CATEGORY_CARDS = [
  { name: 'Mains', text: 'Rice, noodles and bowls', tone: 'peach', icon: <><path d="M5 12h14a7 7 0 0 1-14 0Z" /><path d="M8 7v2M14 6v3" /></> },
  { name: 'Sides', text: 'Snacks to share', tone: 'green', icon: <><path d="M7 11h10l-1 8H8l-1-8Z" /><path d="M10 11V6M14 11V5" /></> },
  { name: 'Drinks', text: 'Coffee, tea and juices', tone: 'blue', icon: <><path d="m8 8 1 12h6l1-12H8Z" /><path d="M10 8h8M14 8l2-4" /></> },
  { name: 'Desserts', text: 'Something sweet', tone: 'pink', icon: <><path d="M5 13h14l-1 6H6l-1-6Z" /><path d="M8 13a4 4 0 0 1 8 0" /><path d="M12 7V4" /></> },
];

export default function Home() {
  const [bestSellers, setBestSellers] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const load = () => {
    setStatus('loading');
    api.bestSellers()
      .then((list) => { setBestSellers(list); setStatus('ready'); })
      .catch(() => setStatus('error'));
  };
  useEffect(load, []);
  return (
    <Shell title="Home" active="home">
      <main className={container}>
        <section className="relative grid min-h-[355px] grid-cols-1 items-center gap-0 overflow-hidden rounded-[20px] bg-night px-12 py-[46px] text-white after:absolute after:-top-[112px] after:-right-[72px] after:size-[310px] after:rounded-full after:bg-[#672d18] after:content-[''] max-tablet:gap-7 max-mobile:px-6 max-mobile:py-8">
          <div className="relative z-10">
            <span className="inline-flex w-max rounded-full bg-sun px-3 py-[7px] text-xs font-black text-ink">Cooked to order, every order</span>
            <h1 className="mt-[22px] mb-4 max-w-[630px] text-5xl leading-[1.05] font-black max-mobile:text-[34px]">Hot meals from our kitchen, straight to your door.</h1>
            <p className="mb-[22px] max-w-[540px] text-base leading-[1.45] text-[#eee9e4]">Browse the menu, build your cart and follow your order from the kitchen to your doorstep.</p>
            <div className="flex items-center gap-[10px] max-mobile:flex-col max-mobile:items-stretch">
              <Link className={btn} to="/menu">Browse the menu <span>-&gt;</span></Link>
            </div>
          </div>
        </section>

        <section>
          <div className="mt-[52px] mb-5 flex items-end justify-between gap-5"><div><h2 className="text-[28px] leading-[1.1]">Shop by category</h2></div></div>
          <div className={homeGrid}>
            {CATEGORY_CARDS.map((c) => (
              <Link key={c.name} className="flex min-h-[78px] items-center gap-4 rounded-[14px] border border-line bg-white px-[18px] py-[14px]" to={`/menu?category=${c.name}`}>
                <span className={`grid size-[54px] shrink-0 place-items-center rounded-[10px] [&>svg]:block [&>svg]:size-5 ${tone[c.tone]}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{c.icon}</svg>
                </span>
                <span><h3 className="mb-[3px] text-[15px]">{c.name}</h3><p className="m-0 text-xs text-muted">{c.text}</p></span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mt-[52px] mb-5 flex items-end justify-between gap-5">
            <div><h2 className="text-[28px] leading-[1.1]">Best Selling Dishes</h2><p className="mt-1 text-[15px] text-muted">Our favourite orders of all time</p></div>
            <Link className={seeAll} to="/menu">See full menu -&gt;</Link>
          </div>
          {status !== 'ready' && <DishesLoading label="Loading best sellers…" count={4} compact />}
          {status === 'ready' && <div className={homeGrid}>
            {bestSellers.map((d) => (
              <article key={d.id} className="relative min-h-[252px] overflow-hidden rounded-2xl border border-line bg-white p-[14px]">
                <div className="relative mb-3 grid h-[150px] place-items-center overflow-hidden rounded-xl"><img className="absolute inset-0 size-full object-cover" src={d.image} alt={d.name} loading="lazy" /></div>
                <p className="m-0 mb-[2px] text-[13px] leading-[1.35] text-muted">{d.category}</p>
                <h3 className="m-0 mb-1 text-lg leading-[1.12]"><Link to={`/item/${d.id}`}>{d.name}</Link></h3>
                <p className="m-0 mb-[14px] min-h-[35px] text-sm leading-[1.35] text-muted">{d.description}</p>
                <div className="text-[22px] font-black">{money(d.price)}</div>
              </article>
            ))}
          </div>}
        </section>
      </main>
    </Shell>
  );
}
