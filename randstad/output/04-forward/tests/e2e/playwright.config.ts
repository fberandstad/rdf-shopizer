import { defineConfig, devices } from '@playwright/test';

// E2E for the modern ShopiClaw app (served same-origin by the API server on :4000).
// Maps golden-master TEST-0001..0008 to the new React UI + REST API.
export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
