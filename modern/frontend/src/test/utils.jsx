import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from '../App';
import { ShopProvider } from '../context/ShopContext';
import { api } from './fixtures/mockApi';

// Shows where the router currently is, so tests can assert on redirects
function Where() {
  const { pathname, search } = useLocation();
  return <div data-testid="where">{pathname + search}</div>;
}

// Render the whole app at a URL without waiting for the first load. Log in / fill the cart first
// through the fake server's data (`api`), like a returning visitor with a session cookie.
export function renderAppRaw(route = '/', { user, cart } = {}) {
  if (user) api.login(user, 'Password123');
  if (cart) api.saveCart(cart);
  return render(
    <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ShopProvider>
        <App />
        <Where />
      </ShopProvider>
    </MemoryRouter>,
  );
}

// Same, then wait until the app has loaded the session, catalog and cart
export async function renderApp(route, opts) {
  const result = renderAppRaw(route, opts);
  await waitFor(() => expect(document.querySelector('[aria-busy="true"]')).toBeNull());
  return result;
}

export const AISHA = 'aisha@example.com';
export const where = (s) => s.getByTestId('where').textContent;
