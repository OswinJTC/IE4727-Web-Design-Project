import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { fakeBackend, fakeFetch } from './fakeBackend';

beforeEach(() => {
  localStorage.clear();
  fakeBackend.fail = false;
  fakeBackend.failOn = null;
  vi.stubGlobal('fetch', fakeFetch);
});
afterEach(() => cleanup());
