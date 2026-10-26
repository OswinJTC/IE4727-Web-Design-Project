import { Link } from 'react-router-dom';

const item = 'inline-flex h-[42px] min-w-[42px] items-center justify-center rounded-[10px] border border-line bg-white px-[14px] text-ink max-[520px]:h-[38px] max-[520px]:min-w-[38px] max-[520px]:px-[10px]';
const link = `${item} hover:border-brand hover:text-brand aria-[current=page]:border-night aria-[current=page]:bg-night aria-[current=page]:text-white`;
const off = `${item} text-muted opacity-50`;

// Page links for a list. `to(page)` builds the URL so each page keeps the other filters.
export default function Pagination({ page, pages, to, className = 'mt-7 mb-2' }) {
  if (pages <= 1) return null;
  return (
    <nav className={`flex flex-wrap items-center justify-center gap-[6px] font-body text-[15px] font-black ${className}`} aria-label="Pagination">
      {page > 1
        ? <Link className={link} to={to(page - 1)} rel="prev">&lsaquo; Prev</Link>
        : <span className={off} aria-disabled="true">&lsaquo; Prev</span>}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link key={n} className={link} to={to(n)} aria-current={n === page ? 'page' : undefined} aria-label={`Page ${n}`}>{n}</Link>
      ))}
      {page < pages
        ? <Link className={link} to={to(page + 1)} rel="next">Next &rsaquo;</Link>
        : <span className={off} aria-disabled="true">Next &rsaquo;</span>}
    </nav>
  );
}
