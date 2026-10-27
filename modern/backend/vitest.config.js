import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Both URLs come from .env
if (existsSync('.env')) process.loadEnvFile('.env');

const testUrl = process.env.TEST_DATABASE_URL ?? '';
if (testUrl && testUrl === process.env.DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL must be a different database from DATABASE_URL: the tests wipe it',
  );
}

// The tests see the test database as DATABASE_URL, so the real one is never reached
export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    // Tests must never send real mail to seeded accounts. Mailer tests inject a fake SMTP transport.
    env: { DATABASE_URL: testUrl, SMTP_HOST: '', SMTP_USER: '', SMTP_PASSWORD: '' },
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
