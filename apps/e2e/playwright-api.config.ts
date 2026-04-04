import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '*-api.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.API_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  // No web server for API tests
  webServer: undefined,
});
