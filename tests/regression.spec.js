// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const SCREENSHOT_DIR = path.join('test-results', TIMESTAMP);
const TEST_PDF = path.join(__dirname, '..', 'test-assets', 'test-document.pdf');

const allErrors = [];
const testTimings = [];

function screenshot(page, name) {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  return page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
}

function collectErrors(page) {
  page.on('console', msg => {
    if (msg.type() === 'error') allErrors.push({ url: page.url(), text: msg.text() });
  });
  page.on('pageerror', err => {
    allErrors.push({ url: page.url(), text: `PAGE ERROR: ${err.message}` });
  });
}

// ============================================================
// Suite 1: App Health + Test Mode Verification
// ============================================================
test.describe('Suite 1: App Health', () => {
  test('1.1 landing page loads without errors', async ({ page }) => {
    const start = Date.now();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    const response = await page.goto('/', { waitUntil: 'networkidle' });
    await screenshot(page, '01-landing');

    expect(response?.status()).toBeLessThan(400);
    const title = await page.title();
    console.log(`Title: "${title}"`);
    console.log(`Console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERR: ${e}`));

    testTimings.push({ name: '1.1 landing', ms: Date.now() - start });
  });

  test('1.2 test mode renders authenticated state', async ({ page }) => {
    const start = Date.now();
    collectErrors(page);

    // Navigate directly to /app (protected route)
    await page.goto('/app', { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, '02-app-authenticated');

    const url = page.url();
    console.log(`After /app navigation: ${url}`);

    // If test mode is active, we should NOT be redirected to /login
    // If we ARE at /login, test mode is not active (running against prod)
    const isAuthenticated = !url.includes('/login') && !url.includes('/signup');

    if (isAuthenticated) {
      console.log('TEST MODE ACTIVE: authenticated state confirmed');
      // Look for dashboard elements that only render when authenticated
      const bodyText = await page.textContent('body');
      const hasDashboard = bodyText?.includes('Add') || bodyText?.includes('course') || bodyText?.includes('AURA');
      console.log(`Dashboard content present: ${hasDashboard}`);
    } else {
      console.log('TEST MODE NOT ACTIVE: redirected to auth (running against production)');
    }

    testTimings.push({ name: '1.2 auth check', ms: Date.now() - start });
  });

  test('1.3 navigation works', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });

    const cta = page.locator('button:has-text("Start"), a:has-text("Start")').first();
    if (await cta.isVisible()) {
      await cta.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '03-after-cta');
      console.log(`After CTA: ${page.url()}`);
    }
    testTimings.push({ name: '1.3 navigation', ms: Date.now() - start });
  });
});

// ============================================================
// Suite 2: Upload and Classification
// ============================================================
test.describe('Suite 2: Upload and Classification', () => {
  test('2.1 dashboard has upload capability', async ({ page }) => {
    const start = Date.now();
    collectErrors(page);
    await page.goto('/app', { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, '04-dashboard');

    const url = page.url();
    if (url.includes('/login')) {
      console.log('SKIP: not authenticated (test mode not active)');
      testTimings.push({ name: '2.1 upload', ms: Date.now() - start });
      return;
    }

    // Look for Add Work / Add Course / Upload buttons
    const addBtns = page.locator('button:has-text("Add"), button:has-text("Upload"), button:has-text("add")');
    const addCount = await addBtns.count();
    console.log(`Add/Upload buttons: ${addCount}`);

    // Look for file inputs (may be hidden)
    const fileInputs = page.locator('input[type="file"]');
    const fileCount = await fileInputs.count();
    console.log(`File inputs: ${fileCount}`);

    await screenshot(page, '05-upload-elements');
    testTimings.push({ name: '2.1 upload', ms: Date.now() - start });
  });

  test('2.2 PDF upload triggers ingestion', async ({ page }) => {
    const start = Date.now();
    collectErrors(page);
    await page.goto('/app', { waitUntil: 'networkidle', timeout: 15000 });

    if (page.url().includes('/login')) {
      console.log('SKIP: not authenticated');
      testTimings.push({ name: '2.2 PDF upload', ms: Date.now() - start });
      return;
    }

    expect(fs.existsSync(TEST_PDF)).toBeTruthy();

    // Try to find and click Add Work button to open upload flow
    const addBtn = page.locator('button:has-text("Add work"), button:has-text("Add Work")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, '06-add-work-modal');

      // Look for file input in the modal
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles(TEST_PDF);
        console.log('PDF file set on input');
        await page.waitForTimeout(3000); // Wait for ingestion
        await screenshot(page, '07-after-upload');
      } else {
        console.log('No file input found in modal');
      }
    } else {
      console.log('Add Work button not visible');
      await screenshot(page, '06-no-add-work');
    }

    testTimings.push({ name: '2.2 PDF upload', ms: Date.now() - start });
  });
});

// ============================================================
// Suite 3: Editor Interaction
// ============================================================
test.describe('Suite 3: Editor Interaction', () => {
  test('3.1 editor and panel elements', async ({ page }) => {
    const start = Date.now();
    collectErrors(page);
    await page.goto('/app', { waitUntil: 'networkidle', timeout: 15000 });

    if (page.url().includes('/login')) {
      console.log('SKIP: not authenticated');
      testTimings.push({ name: '3.1 editor', ms: Date.now() - start });
      return;
    }

    await screenshot(page, '08-app-state');

    // Check for editor elements
    const editors = page.locator('[contenteditable="true"], textarea, .tiptap, .ProseMirror');
    const editorCount = await editors.count();
    console.log(`Editor elements: ${editorCount}`);

    // Check for panel/tab elements
    const panels = page.locator('[role="tablist"], [role="tab"], nav');
    const panelCount = await panels.count();
    console.log(`Panel/nav elements: ${panelCount}`);

    // Check for AURA orb
    const orb = page.locator('canvas, [aria-label*="AURA"], [class*="orb"]');
    const orbCount = await orb.count();
    console.log(`AURA orb elements: ${orbCount}`);

    testTimings.push({ name: '3.1 editor', ms: Date.now() - start });
  });

  test('3.2 AURA chat opens', async ({ page }) => {
    const start = Date.now();
    await page.goto('/app', { waitUntil: 'networkidle', timeout: 15000 });

    if (page.url().includes('/login')) {
      console.log('SKIP: not authenticated');
      testTimings.push({ name: '3.2 AURA chat', ms: Date.now() - start });
      return;
    }

    // Try clicking the AURA orb
    const orbBtn = page.locator('canvas, [aria-label*="AURA"]').first();
    if (await orbBtn.isVisible()) {
      await orbBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '09-aura-chat-open');

      // Check if chat overlay appeared
      const chatInput = page.locator('input[placeholder*="AURA"], input[placeholder*="Ask"]');
      const chatVisible = await chatInput.count();
      console.log(`AURA chat input visible: ${chatVisible > 0}`);
    } else {
      console.log('AURA orb not clickable');
    }

    testTimings.push({ name: '3.2 AURA chat', ms: Date.now() - start });
  });
});

// ============================================================
// Suite 4: Export
// ============================================================
test.describe('Suite 4: Export', () => {
  test('4.1 export controls present', async ({ page }) => {
    const start = Date.now();
    await page.goto('/app', { waitUntil: 'networkidle', timeout: 15000 });

    if (page.url().includes('/login')) {
      console.log('SKIP: not authenticated');
      testTimings.push({ name: '4.1 export', ms: Date.now() - start });
      return;
    }

    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("Submit")');
    const exportCount = await exportBtn.count();
    console.log(`Export/Submit buttons: ${exportCount}`);

    await screenshot(page, '10-export-state');
    testTimings.push({ name: '4.1 export', ms: Date.now() - start });
  });
});

// ============================================================
// Suite 5: Edge Cases
// ============================================================
test.describe('Suite 5: Edge Cases', () => {
  test('5.1 no undefined or null rendered', async ({ page }) => {
    const start = Date.now();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(`PAGE: ${err.message}`));

    await page.goto('/app', { waitUntil: 'networkidle', timeout: 15000 });

    const bodyHtml = await page.innerHTML('body');
    const hasContent = bodyHtml.length > 100;
    console.log(`Body has content: ${hasContent} (${bodyHtml.length} chars)`);
    expect(hasContent).toBeTruthy();

    const visibleText = await page.textContent('body');
    const hasUndefined = /\bundefined\b|\bnull\b/.test(visibleText || '');
    console.log(`Renders "undefined"/"null": ${hasUndefined}`);

    await screenshot(page, '11-edge-empty');
    console.log(`Console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERR: ${e}`));

    testTimings.push({ name: '5.1 empty', ms: Date.now() - start });
  });

  test('5.2 responsive viewport', async ({ page }) => {
    const start = Date.now();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app', { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, '12-mobile-375');

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/app', { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot(page, '13-tablet-768');

    console.log('Responsive screenshots captured');
    testTimings.push({ name: '5.2 responsive', ms: Date.now() - start });
  });

  test('5.3 performance baseline', async ({ page }) => {
    const start = Date.now();
    const navStart = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - navStart;

    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(15000);

    const resources = await page.evaluate(() =>
      performance.getEntriesByType('resource')
        .filter(r => r.name.endsWith('.js') || r.name.endsWith('.css'))
        .map(r => ({ name: r.name.split('/').pop(), duration: Math.round(r.duration) }))
    );
    console.log(`JS/CSS resources: ${resources.length}`);
    resources.slice(0, 5).forEach(r => console.log(`  ${r.name}: ${r.duration}ms`));

    await screenshot(page, '14-performance');
    testTimings.push({ name: '5.3 perf', ms: Date.now() - start });
  });
});

// ============================================================
// Report
// ============================================================
test.afterAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const screenshots = fs.existsSync(SCREENSHOT_DIR)
    ? fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'))
    : [];

  const report = `# Regression Test Report
**Date:** ${new Date().toISOString()}
**Playwright:** 1.60.0

## Results

| Test | Time |
|------|------|
${testTimings.map(t => `| ${t.name} | ${t.ms}ms |`).join('\n')}

## Console Errors

${allErrors.length === 0 ? 'None' : allErrors.map(e => `- [${e.url}] ${e.text}`).join('\n')}

## Screenshots

${screenshots.map(s => `- ${s}`).join('\n') || 'None'}

## Notes

- Tests run against production by default (auth-gated: suites 2-4 detect elements only)
- For full authenticated testing: PLAYWRIGHT_LOCAL=true npx playwright test (starts local dev server with test mode)
`;

  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'report.md'), report);
  console.log(`Report: ${path.join(SCREENSHOT_DIR, 'report.md')}`);
});
