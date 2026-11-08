import { defineConfig, devices } from '@playwright/test';
import { POLICY_VERSION } from './src/lib/policyVersion';

const baseURL = process.env.BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  use: {
    baseURL,
    // Pre-answer the cookie banner (reject all) so it doesn't cover buttons in tests.
    storageState: {
      cookies: [],
      origins: [{
        origin: new URL(baseURL).origin,
        localStorage: [{
          name: 'bm-cookie-choice',
          value: JSON.stringify({ analytics: false, ads: false, version: POLICY_VERSION, decidedAt: '2026-11-07T00:00:00Z' }),
        }],
      }],
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
