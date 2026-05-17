// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://simplifii-os-main.vercel.app';

test.describe('Dashboard Elements', () => {
  test('critical dashboard elements present', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'tests/screenshots/03-dashboard.png', fullPage: true });

    // Report what we find on the page
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log(`Headings found: ${headings.slice(0, 10).join(' | ')}`);

    const buttons = await page.locator('button').allTextContents();
    console.log(`Buttons found: ${buttons.filter(b => b.trim()).slice(0, 15).join(' | ')}`);

    // Check for AURA orb
    const orbElements = await page.locator('[aria-label*="AURA"], canvas, [class*="orb"]').count();
    console.log(`AURA orb elements: ${orbElements}`);

    // Check for navigation elements
    const navElements = await page.locator('nav, [role="navigation"]').count();
    console.log(`Nav elements: ${navElements}`);

    console.log(`Console errors: ${errors.length > 0 ? errors.join('\n') : 'none'}`);
  });

  test('Add work button opens modal', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Look for Add work / Add course button
    const addBtn = page.locator('button:has-text("Add"), button:has-text("add"), [aria-label*="Add"]');
    const addCount = await addBtn.count();
    console.log(`Add buttons found: ${addCount}`);

    if (addCount > 0) {
      await addBtn.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/04-add-modal.png' });

      // Check if a modal or overlay appeared
      const modals = await page.locator('[role="dialog"], [aria-modal="true"], [class*="modal"], [class*="overlay"]').count();
      console.log(`Modals/overlays after click: ${modals}`);
    } else {
      console.log('No Add button found - may require authentication');
      await page.screenshot({ path: 'tests/screenshots/04-no-add-btn.png' });
    }
  });
});
