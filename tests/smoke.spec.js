// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://simplifii-os-main.vercel.app';

test.describe('Smoke Tests', () => {
  test('landing page loads and screenshot', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'tests/screenshots/01-landing.png', fullPage: true });

    const title = await page.title();
    console.log(`Page title: ${title}`);
    console.log(`Console errors: ${errors.length > 0 ? errors.join('\n') : 'none'}`);

    // Check for visible error messages in the DOM
    const errorElements = await page.locator('[role="alert"], .error, [class*="error"]').all();
    console.log(`Visible error elements: ${errorElements.length}`);

    expect(title).toBeTruthy();
  });

  test('start button exists', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Look for primary CTA (Start free, Sign in, Log in, Get started)
    const ctaBtn = page.locator('button:has-text("Start"), button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Get started"), a:has-text("Start")');
    const count = await ctaBtn.count();
    console.log(`CTA buttons found: ${count}`);

    await page.screenshot({ path: 'tests/screenshots/02-signin-state.png' });

    expect(count).toBeGreaterThan(0);
  });
});
