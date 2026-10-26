import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, AISHA, where } from '../test/utils';

describe('layout (header, auth area, footer)', () => {
  it('guest sees Log in and no cart items', async () => {
    await renderApp('/');
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Cart, 0 items/ })).toBeInTheDocument();
    expect(screen.getByText('© 2026 FoodHub')).toBeInTheDocument();
    expect(document.title).toBe('FoodHub | Home');
  });

  it('member sees avatar, welcome and a working Log out', async () => {
    await renderApp('/menu', { user: AISHA, cart: { 1: 2 } });
    expect(screen.getByText('Welcome, Aisha Lim')).toBeInTheDocument();
    expect(screen.getByTestId('avatar')).toHaveTextContent('A');
    expect(screen.getByRole('link', { name: /Cart, 2 items/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(await screen.findByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(where(screen)).toBe('/');
    expect(screen.getByRole('link', { name: /Cart, 0 items/ })).toBeInTheDocument();
  });

  it('search submits to /menu?q= and keeps the text', async () => {
    await renderApp('/');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search dishes' }), 'laksa{Enter}');
    expect(where(screen)).toBe('/menu?q=laksa');
    expect(screen.getByRole('searchbox', { name: 'Search dishes' })).toHaveValue('laksa');
    expect(screen.getByText(/1 dish matching/)).toBeInTheDocument();
  });

  it('highlights the current section in the nav', async () => {
    await renderApp('/menu');
    const nav = within(screen.getByRole('navigation', { name: 'Main' }));
    expect(nav.getByRole('link', { name: 'Menu' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('shows a not-found page for unknown routes', async () => {
    await renderApp('/nope');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('Home', () => {
  it('shows four categories and four best sellers linking to dishes', async () => {
    await renderApp('/');
    const cats = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/menu?category='));
    expect(cats.map((a) => a.getAttribute('href'))).toEqual(['/menu?category=Mains', '/menu?category=Sides', '/menu?category=Drinks', '/menu?category=Desserts']);
    const best = screen.getByRole('heading', { name: 'Best Selling Dishes' }).closest('section');
    expect(within(best).getAllByRole('article')).toHaveLength(4);
    expect(within(best).getAllByRole('heading', { level: 3 })[0].querySelector('a')).toHaveAttribute('href', expect.stringMatching(/^\/item\/\d+$/));
    expect(within(best).getByRole('link', { name: /See full menu/ })).toHaveAttribute('href', '/menu');
  });
});

describe('Menu', () => {
  it('lists 20 dishes 9 to a page with tab counts, sorted by name', async () => {
    await renderApp('/menu');
    expect(screen.getByText('20 dishes, cooked fresh when you order')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(9);
    const names = screen.getAllByRole('article').map((a) => within(a).getByRole('heading').textContent);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    const tabs = within(screen.getByRole('navigation', { name: 'Categories' })).getAllByRole('link').map((a) => a.textContent.replace(/\s+/g, ' ').trim());
    expect(tabs).toEqual(['All 20', 'Mains 5', 'Sides 5', 'Drinks 5', 'Desserts 5']);
  });

  it('paginates: page links keep the filters, the last page holds the rest, a bad page means page 1', async () => {
    await renderApp('/menu?page=3');
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Prev/ })).toHaveAttribute('href', '/menu?page=2');
    expect(screen.queryByRole('link', { name: /Next/ })).toBeNull();
    await userEvent.click(screen.getByRole('link', { name: 'Page 1' }));
    expect(where(screen)).toBe('/menu');
    expect(screen.getAllByRole('article')).toHaveLength(9);
  });

  it('shows no pagination when everything fits on one page', async () => {
    await renderApp('/menu?category=Drinks');
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull();
  });

  it('filters by category and ignores an unknown category', async () => {
    await renderApp('/menu?category=Drinks');
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('link', { name: /Drinks\s*5/ })).toHaveAttribute('aria-current', 'page');
  });

  it('unknown category means All', async () => {
    await renderApp('/menu?category=Pizza');
    expect(screen.getAllByRole('article')).toHaveLength(9);
    expect(screen.getByRole('link', { name: /^All/ })).toHaveAttribute('aria-current', 'page');
  });

  it('search keeps counts per category and uses plural/singular wording', async () => {
    await renderApp('/menu?q=rice');
    expect(screen.getByText(/dishes matching “rice”/)).toBeInTheDocument();
    await renderApp('/menu?category=Mains&q=laksa');
    expect(screen.getByText(/1 dish matching “laksa”/)).toBeInTheDocument();
    // tab counts ignore the selected category but honour the search
    expect(screen.getAllByRole('link', { name: /Desserts\s*0/ }).length).toBeGreaterThan(0);
  });

  it('shows an empty state when nothing matches, and treats % literally', async () => {
    await renderApp('/menu?q=%25');
    expect(screen.getByText(/No dishes match “%”/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View the full menu' })).toHaveAttribute('href', '/menu');
  });

  it('guest pressing + is sent to the login page', async () => {
    await renderApp('/menu?q=laksa');
    await userEvent.click(screen.getByRole('button', { name: 'Add Curry laksa to cart' }));
    expect(where(screen)).toBe('/login');
  });

  it('member stepper: − and quantity only appear once the dish is in the cart; panel updates', async () => {
    await renderApp('/menu?q=laksa', { user: AISHA });
    expect(screen.getByText('Your cart is empty. Tap + on a dish to add it.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove one/ })).toBeNull();
    const add = screen.getByRole('button', { name: 'Add Curry laksa to cart' });
    await userEvent.click(add);
    await userEvent.click(add);
    expect(screen.getByRole('button', { name: 'Remove one Curry laksa' })).toBeInTheDocument();
    expect(screen.getByText('2 x Curry laksa')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getAllByText('$14.40').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Remove one Curry laksa' }));
    expect(screen.getByText('1 item')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove one Curry laksa' }));
    expect(screen.queryByRole('button', { name: /Remove one/ })).toBeNull();
  });
});

describe('Item', () => {
  it('shows a not-found page for unknown or non-numeric ids', async () => {
    await renderApp('/item/999');
    expect(screen.getByRole('heading', { name: 'Dish not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '< Back to menu' })).toHaveAttribute('href', '/menu');
    await renderApp('/item/abc');
    expect(screen.getAllByRole('heading', { name: 'Dish not found' })).toHaveLength(2);
  });

  it('shows the dish, breadcrumb and up to four others from the same category', async () => {
    await renderApp('/item/3'); // Curry laksa, Mains
    expect(screen.getByRole('heading', { level: 1, name: 'Curry laksa' })).toBeInTheDocument();
    expect(screen.getByText('$7.20', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mains' })).toHaveAttribute('href', '/menu?category=Mains');
    expect(document.title).toBe('FoodHub | Curry laksa');
    const more = screen.getByRole('heading', { name: 'More in Mains' }).closest('div').nextElementSibling;
    const links = within(more).getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(links.every((a) => a.getAttribute('href') !== '/item/3')).toBe(true);
  });

  it('quantity stays between 1 and 20 and the button shows the total', async () => {
    await renderApp('/item/3');
    const dec = screen.getByRole('button', { name: 'Decrease quantity' });
    const inc = screen.getByRole('button', { name: 'Increase quantity' });
    expect(dec).toBeDisabled();
    await userEvent.click(inc);
    await userEvent.click(inc);
    expect(screen.getByTestId('qty-value')).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: 'Add to cart - $21.60' })).toBeInTheDocument();
    for (let i = 0; i < 25; i++) await userEvent.click(inc);
    expect(screen.getByTestId('qty-value')).toHaveTextContent('20');
    expect(inc).toBeDisabled();
  });

  it('guest adding is sent to login', async () => {
    await renderApp('/item/3');
    await userEvent.click(screen.getByRole('button', { name: /Add to cart/ }));
    expect(where(screen)).toBe('/login');
  });

  it('member adding shows a confirmation with a cart link and respects the 20 cap', async () => {
    await renderApp('/item/3', { user: AISHA, cart: { 3: 18 } });
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await userEvent.click(screen.getByRole('button', { name: /Add to cart/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Added 2 to your cart. View cart');
    expect(screen.getByRole('link', { name: /Cart, 20 items/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Add to cart/ }));
    expect(screen.getByRole('status')).toHaveTextContent('You already have the maximum (20) of this dish in your cart.');
  });
});

describe('Cart', () => {
  it('is empty for a guest, with no checkout button', async () => {
    await renderApp('/cart');
    expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Proceed to checkout/ })).toBeNull();
    expect(screen.getByText('Items (0)')).toBeInTheDocument();
  });

  it('shows lines, subtotals and the total, and links to checkout', async () => {
    await renderApp('/cart', { user: AISHA, cart: { 3: 1, 9: 2 } });
    expect(screen.getByText('Items (3)')).toBeInTheDocument();
    expect(screen.getAllByText('$11.60')).toHaveLength(2);
    expect(screen.getByText('$4.40')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Proceed to checkout/ })).toHaveAttribute('href', '/checkout');
    expect(screen.getByText('Quantities between 1 and 20 per dish')).toBeInTheDocument();
  });

  it('changes quantity, removes at 1 and removes with the bin; persists across a re-render', async () => {
    const { unmount } = await renderApp('/cart', { user: AISHA, cart: { 3: 1, 9: 2 } });
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity of Curry laksa' }));
    expect(screen.getByText('Items (4)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Iced lemon tea' }));
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Iced lemon tea' }));
    expect(screen.queryByText('Iced lemon tea')).toBeNull();
    unmount();
    await renderApp('/cart'); // a refresh: state comes back from storage
    expect(screen.getByText('Items (2)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Curry laksa' }));
    expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
  });

  it('disables + at 20 per dish', async () => {
    await renderApp('/cart', { user: AISHA, cart: { 3: 20 } });
    expect(screen.getByRole('button', { name: 'Increase quantity of Curry laksa' })).toBeDisabled();
  });
});
