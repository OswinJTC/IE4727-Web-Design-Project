import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useShop } from '../context/ShopContext';
import { CartIcon, LogoIcon, SearchIcon } from './icons';
import { btnLight } from '../lib/ui';

const Brand = () => (
  <>
    <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-brand text-white [&>svg]:block [&>svg]:size-5"><LogoIcon /></span>
    FoodHub
  </>
);
const brandClass = 'flex items-center gap-3 text-[22px] font-black whitespace-nowrap';
const topbar = 'flex min-h-[72px] items-center border-b border-line bg-white px-6 max-tablet:h-auto max-tablet:flex-wrap max-tablet:px-4 max-tablet:py-3';
const navLink = 'rounded-[10px] px-4 py-[13px] whitespace-nowrap aria-[current=page]:bg-brand-soft aria-[current=page]:text-brand-dark';

function AuthArea() {
  const { ready, user, logout } = useShop();
  const navigate = useNavigate();
  if (!ready) return null; // not known yet whether someone is logged in
  if (!user) return <Link className={`${btnLight} whitespace-nowrap`} to="/login">Log in</Link>;
  return (
    <>
      <span data-testid="avatar" className="grid size-[42px] shrink-0 place-items-center rounded-full bg-sun text-[15px] font-black">{user.name.charAt(0).toUpperCase()}</span>
      <span className="font-black whitespace-nowrap">Welcome, {user.name}</span>
      <button type="button" className={`${btnLight} whitespace-nowrap`} onClick={() => { navigate('/'); logout(); toast.info('You have been logged out.'); }}>Log out</button>
    </>
  );
}

// Navbar search: submitting opens /menu?q=...; the box keeps the current search text
function SearchBar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const urlQuery = pathname === '/menu' ? params.get('q') ?? '' : '';
  const [text, setText] = useState(urlQuery);
  useEffect(() => setText(urlQuery), [urlQuery]);

  return (
    <form
      className="flex h-[46px] w-[min(520px,42vw)] min-w-0 items-center gap-3 overflow-hidden rounded-full border border-line bg-[#f6f4f2] px-[18px] font-body text-[15px] whitespace-nowrap text-muted focus-within:border-brand max-tablet:order-3 max-tablet:w-full"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = text.trim();
        navigate(q ? `/menu?q=${encodeURIComponent(q)}` : '/menu');
      }}
    >
      <span className="[&>svg]:block [&>svg]:size-5"><SearchIcon /></span>
      <input className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted" type="search" name="q" placeholder="Search dishes, e.g. laksa" aria-label="Search dishes" maxLength={100} value={text} onChange={(e) => setText(e.target.value)} />
    </form>
  );
}

function ShopHeader({ active }) {
  const { summary } = useShop();
  const current = (name) => (active === name ? 'page' : undefined);
  return (
    <header className={`${topbar} gap-[26px]`}>
      <Link className={brandClass} to="/"><Brand /></Link>
      <SearchBar />
      <nav aria-label="Main" className="ml-auto flex items-center gap-[22px] text-base font-black max-tablet:gap-1">
        <Link className={navLink} aria-current={current('home')} to="/">Home</Link>
        <Link className={navLink} aria-current={current('menu')} to="/menu">Menu</Link>
        <Link className={navLink} aria-current={current('orders')} to="/orders">My orders</Link>
      </nav>
      <Link className="relative grid size-[50px] shrink-0 place-items-center rounded-full border border-line bg-white [&>svg]:block [&>svg]:size-5" to="/cart" aria-label={`Cart, ${summary.items} items`}>
        <CartIcon />
        <span className="absolute -top-1 right-[5px] grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand text-xs text-white">{summary.items}</span>
      </Link>
      <AuthArea />
    </header>
  );
}

function SimpleHeader() {
  const { user } = useShop();
  const simpleLink = 'rounded-[10px] px-3 py-[10px] whitespace-nowrap max-mobile:px-2';
  return (
    <header className={`${topbar} flex-wrap gap-4 py-3`}>
      <Link className={brandClass} to="/"><Brand /></Link>
      <nav aria-label="Main" className="ml-auto flex items-center gap-2 text-base font-black max-mobile:gap-1 max-mobile:text-sm"><Link className={simpleLink} to="/">Home</Link><Link className={simpleLink} to="/menu">Menu</Link></nav>
      {user && (
        <div className="flex min-w-0 max-w-[min(440px,48vw)] items-center gap-3 max-mobile:max-w-full max-mobile:basis-full [&>button]:shrink-0 max-mobile:[&>button]:ml-auto [&>span:nth-child(2)]:min-w-0 [&>span:nth-child(2)]:truncate">
          <AuthArea />
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const footLink = 'mb-[15px] font-body text-[15px] leading-[1.45] text-[#eee9e4]';
  return (
    <footer className="mt-auto bg-night text-white">
      <div className="mx-auto grid max-w-[1260px] grid-cols-[1.5fr_1fr_1fr] gap-20 px-[14px] pt-[46px] pb-14 max-mobile:grid-cols-1">
        <div>
          <div className={`${brandClass} mb-[18px]`}><Brand /></div>
          <p className={footLink}>Freshly cooked meals from our kitchen to<br />your door.</p>
        </div>
        <div><h3 className="mb-3 text-base">Explore</h3><p className={footLink}><Link to="/menu">Menu</Link><br /><Link to="/orders">My orders</Link><br /><a href="#contact">Contact</a></p></div>
        <div><h3 className="mb-3 text-base">Visit us</h3><p className={footLink}>[Restaurant address]</p><p className={footLink}>Daily, [opening hours]</p></div>
      </div>
      <div className="border-t border-white/[0.14] px-[14px] py-[18px]"><p className={`${footLink} mx-auto mb-0! max-w-[1260px]`}>&copy; 2026 FoodHub</p></div>
    </footer>
  );
}

// Page frame: header, content, footer. `simple` is the login/register layout.
export default function Shell({ title, active, simple = false, footer = true, children }) {
  const { ready } = useShop();
  useEffect(() => { document.title = `FoodHub | ${title}`; }, [title]);
  return (
    <div className="flex min-h-screen flex-col" aria-busy={!ready}>
      {simple ? <SimpleHeader /> : <ShopHeader active={active} />}
      {children}
      {footer && <Footer />}
    </div>
  );
}
