import { defineConfig } from 'vitest/config';

// Tests always run against the throwaway foodhub_test database, never the live foodhub
export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    env: { DB_NAME: 'foodhub_test' },
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
