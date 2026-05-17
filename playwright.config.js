// @ts-check
const { defineConfig } = require('@playwright/test');
const path = require('path');

// Load .env.test so REACT_APP_TEST_MODE is available to the dev server
require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    // When running against local dev server with test mode
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://simplifii-os-main.vercel.app',
  },
  reporter: 'list',
  // To run with local dev server and test mode auth bypass:
  // 1. Copy .env.test to .env.local (CRA reads .env.local automatically)
  // 2. Run: PLAYWRIGHT_LOCAL=true npx playwright test tests/regression.spec.js
  ...(process.env.PLAYWRIGHT_LOCAL === 'true' ? {
    webServer: {
      command: 'npm start',
      port: 3000,
      timeout: 90000,
      reuseExistingServer: true,
    },
  } : {}),
});
