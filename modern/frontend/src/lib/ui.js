// Class strings shared by several pages. Tailwind finds them here because they are plain string literals.

export const btn = 'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[10px] bg-brand px-[22px] font-black text-white hover:bg-brand-dark disabled:cursor-wait disabled:opacity-65';
export const btnLight = 'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-[22px] font-black text-ink';
export const btnDanger = 'mt-[18px] mb-[14px] min-h-12 w-full rounded-[10px] border border-[#f0cfcc] bg-white font-black text-danger disabled:cursor-wait disabled:opacity-65';

export const label = 'mb-2 block text-sm font-bold text-ink';
export const input = 'min-h-[46px] w-full rounded-[10px] border border-[#d2cbc4] bg-white px-[14px] text-[15px] text-ink aria-invalid:border-[#e11d20] aria-invalid:bg-[#fff9f9]';
export const textarea = 'min-h-20 w-full resize-y rounded-[10px] border border-[#d2cbc4] bg-white px-[14px] pt-4 text-[15px] text-ink aria-invalid:border-[#e11d20] aria-invalid:bg-[#fff9f9]';
export const errorText = 'mt-2 flex items-center gap-2 font-body text-[13px] font-bold text-[#d71920] empty:hidden';
export const hint = 'mt-2 font-body text-[13px] font-normal text-muted';

export const panel = 'rounded-2xl border border-line bg-white';
export const card = 'rounded-2xl border border-line bg-white p-7';
export const backLink = 'mt-[26px] mb-7 inline-block font-black text-brand';
export const seeAll = 'text-sm font-black text-brand';
export const loading = 'mx-auto my-20 max-w-[1260px] px-[14px] text-center font-body text-base text-muted';
export const container = 'mx-auto w-full max-w-[1260px] px-[14px] pt-10 pb-[86px] max-mobile:pt-6 max-mobile:pb-[60px]';

// Tinted icon backgrounds
export const tone = {
  peach: 'bg-peach text-[#bf9f88]',
  green: 'bg-mint text-[#87a77e]',
  blue: 'bg-sky text-[#7293ac]',
  pink: 'bg-blush text-[#bd7f91]',
};

export const h1 = 'font-black';

// Dish card grids: 3 columns beside the cart panel on the menu, 4 on the home page
export const menuGrid = 'grid grid-cols-3 gap-[14px] max-tablet:grid-cols-2 max-mobile:grid-cols-1';
export const homeGrid = 'grid grid-cols-4 gap-[14px] max-tablet:grid-cols-2 max-mobile:grid-cols-1';
