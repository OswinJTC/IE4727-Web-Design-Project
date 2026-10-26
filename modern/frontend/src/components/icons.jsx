const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 };

export const LogoIcon = () => (
  <svg {...base} strokeLinecap="round"><path d="M6 12h12a6 6 0 0 1-12 0Z" /><path d="M8 6v2M14 5v3" /></svg>
);
export const CartIcon = (props) => (
  <svg {...base} {...props}><path d="M6 6h15l-2 8H8L6 3H3" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
);
export const SearchIcon = () => (
  <svg {...base}><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
);
export const TrashIcon = () => (
  <svg {...base}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const LockIcon = () => (
  <svg {...base}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const CheckIcon = () => (
  <svg {...base} strokeWidth="3"><path d="m5 12 5 5 9-10" /></svg>
);
