import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';
if (process.env.WT_E2E_BASE_URL) throw new Error('WT-002 fixtures require the disposable loopback server');
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/helpers/global-setup.ts',
  metadata: { database: process.env.WT_E2E_DATABASE ?? 'h2' },
  timeout: 60_000,
  retries: 0,
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: true,
  workers: 1,
  use: {
    baseURL,
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [['list'], ['junit', { outputFile: 'test-results/junit.xml' }], ['json', { outputFile: 'test-results/results.json' }], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results',
  projects: [
    { name: 'chromium', testIgnore: '**/mobile.spec.ts', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testMatch: /(?:full-flow|compatibility)\.spec\.ts/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: /(?:full-flow|compatibility)\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chromium', testMatch: '**/mobile.spec.ts', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
