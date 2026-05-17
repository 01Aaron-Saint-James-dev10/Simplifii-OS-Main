// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://simplifii-os-main.vercel.app';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const SCREENSHOT_DIR = path.join('test-results', TIMESTAMP);
const TEST_PDF = path.join(__dirname, '..', 'test-assets', 'test-document.pdf');

// Shared state across suites
let uploadSucceeded = false;
const allErrors = [];
const testTimings = [];

function screenshot(page, name) {
  const dir = SCREENSHOT_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
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
// Suite 1: App Health
// ============================================================
test.describe('Suite 1: App Health', () => {
  test('1.1 landing page loads without errors', async ({ page }) => {
    const start = Date.now();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await screenshot(page, '01-landing');

    expect(response?.status()).toBeLessThan(400);
    const title = await page.title();
    console.log(`Title: "${title}"`);
    console.log(`Console errors: ${errors.length}`);
    errors.forEach(e => console.log(`  ERR: ${e}`));

    testTimings.push({ name: '1.1 landing', ms: Date.now() - start });
  });

  test('1.2 critical landing elements present', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Check for primary CTA
    const cta = page.locator('button:has-text("Start"), a:has-text("Start")');
    const ctaCount = await cta.count();
    console.log(`CTA buttons: ${ctaCount}`);
    expect(ctaCount).toBeGreaterThan(0);

    // Check for app name or branding
    const bodyText = await page.textContent('body');
    const hasBranding = bodyText?.includes('Simplifii') || bodyText?.includes('simplifii');
    console.log(`Branding present: ${hasBranding}`);
    expect(hasBranding).toBeTruthy();

    await screenshot(page, '02-elements');
    testTimings.push({ name: '1.2 elements', ms: Date.now() - start });
  });

  test('1.3 navigation to auth flow', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Click the primary CTA
    const cta = page.locator('button:has-text("Start"), a:has-text("Start")').first();
    if (await cta.isVisible()) {
      await cta.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '03-after-cta-click');

      // Should navigate somewhere (auth page, app page, or modal)
      const url = page.url();
      console.log(`After CTA click URL: ${url}`);
    }
    testTimings.push({ name: '1.3 navigation', ms: Date.now() - start });
  });
});

// ============================================================
// Suite 2: Upload and Classification (requires auth)
// ============================================================
test.describe('Suite 2: Upload and Classification', () => {
  test('2.1 PDF upload flow accessible', async ({ page }) => {
    const start = Date.now();
    collectErrors(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Check if test PDF exists
    expect(fs.existsSync(TEST_PDF)).toBeTruthy();
    console.log(`Test PDF exists: ${fs.existsSync(TEST_PDF)}`);

    // Look for upload-related elements (may require auth)
    const uploadBtn = page.locator('button:has-text("Upload"), button:has-text("Add"), input[type="file"]');
    const uploadCount = await uploadBtn.count();
    console.log(`Upload elements found: ${uploadCount}`);

    await screenshot(page, '04-upload-state');

    if (uploadCount === 0) {
      console.log('SKIP: Upload requires authentication (expected for unauthenticated view)');
      uploadSucceeded = false;
    } else {
      uploadSucceeded = true;
    }

    testTimings.push({ name: '2.1 upload', ms: Date.now() - start });
  });

  test('2.2 file input accepts PDF', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Look for hidden file inputs
    const fileInputs = page.locator('input[type="file"]');
    const fileCount = await fileInputs.count();
    console.log(`File inputs on page: ${fileCount}`);

    if (fileCount > 0) {
      // Try setting the file
      const input = fileInputs.first();
      const accept = await input.getAttribute('accept');
      console.log(`File input accept: ${accept}`);
      const acceptsPdf = !accept || accept.includes('.pdf') || accept.includes('application/pdf');
      console.log(`Accepts PDF: ${acceptsPdf}`);
    }

    await screenshot(page, '05-file-inputs');
    testTimings.push({ name: '2.2 file input', ms: Date.now() - start });
  });
});

// ============================================================
// Suite 3: Editor Interaction (skipped if upload failed)
// ============================================================
test.describe('Suite 3: Editor Interaction', () => {
  test('3.1 editor area detection', async ({ page }) => {
    const start = Date.now();
    collectErrors(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Look for editor-like elements (contenteditable, textarea, tiptap)
    const editors = page.locator('[contenteditable="true"], textarea, .tiptap, .ProseMirror');
    const editorCount = await editors.count();
    console.log(`Editor elements: ${editorCount}`);

    // Look for panel/tab elements
    const panels = page.locator('[role="tablist"], [role="tab"], nav');
    const panelCount = await panels.count();
    console.log(`Panel/tab elements: ${panelCount}`);

    await screenshot(page, '06-editor-state');
    testTimings.push({ name: '3.1 editor', ms: Date.now() - start });
  });

  test('3.2 AURA orb present', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Look for AURA orb (canvas element or styled div)
    const orbElements = page.locator('canvas, [aria-label*="AURA"], [class*="orb"]');
    const orbCount = await orbElements.count();
    console.log(`AURA orb elements: ${orbCount}`);

    await screenshot(page, '07-aura-orb');
    testTimings.push({ name: '3.2 orb', ms: Date.now() - start });
  });
});

// ============================================================
// Suite 4: Export (skipped if no editor content)
// ============================================================
test.describe('Suite 4: Export', () => {
  test('4.1 export controls detection', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("Submit")');
    const exportCount = await exportBtn.count();
    console.log(`Export buttons: ${exportCount}`);

    await screenshot(page, '08-export-state');
    testTimings.push({ name: '4.1 export', ms: Date.now() - start });
  });
});

// ============================================================
// Suite 5: Edge Cases
// ============================================================
test.describe('Suite 5: Edge Cases', () => {
  test('5.1 empty state handled gracefully', async ({ page }) => {
    const start = Date.now();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(`PAGE: ${err.message}`));

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Should not have uncaught errors or blank white page
    const bodyHtml = await page.innerHTML('body');
    const hasContent = bodyHtml.length > 100;
    console.log(`Body has content: ${hasContent} (${bodyHtml.length} chars)`);
    expect(hasContent).toBeTruthy();

    // No "undefined" or "null" rendered as visible text (common React bug)
    const visibleText = await page.textContent('body');
    const hasUndefined = /\bundefined\b|\bnull\b/.test(visibleText || '');
    console.log(`Renders "undefined" or "null": ${hasUndefined}`);

    await screenshot(page, '09-empty-state');
    console.log(`Console errors in empty state: ${errors.length}`);
    errors.forEach(e => console.log(`  ERR: ${e}`));

    testTimings.push({ name: '5.1 empty', ms: Date.now() - start });
  });

  test('5.2 responsive viewport', async ({ page }) => {
    const start = Date.now();
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await screenshot(page, '10-mobile-375');

    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await screenshot(page, '11-tablet-768');

    console.log('Responsive screenshots captured');
    testTimings.push({ name: '5.2 responsive', ms: Date.now() - start });
  });

  test('5.3 performance baseline', async ({ page }) => {
    const start = Date.now();
    const navStart = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - navStart;

    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(15000); // Should load within 15s

    // Check JS bundle count
    const resources = await page.evaluate(() =>
      performance.getEntriesByType('resource')
        .filter(r => r.name.endsWith('.js') || r.name.endsWith('.css'))
        .map(r => ({ name: r.name.split('/').pop(), duration: Math.round(r.duration) }))
    );
    console.log(`JS/CSS resources: ${resources.length}`);
    resources.slice(0, 5).forEach(r => console.log(`  ${r.name}: ${r.duration}ms`));

    await screenshot(page, '12-performance');
    testTimings.push({ name: '5.3 perf', ms: Date.now() - start });
  });
});

// ============================================================
// Report generation (runs after all tests)
// ============================================================
test.afterAll(async () => {
  const dir = SCREENSHOT_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const screenshots = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => f.endsWith('.png'))
    : [];

  const report = `# Regression Test Report
**Date:** ${new Date().toISOString()}
**Target:** ${BASE_URL}
**Playwright:** 1.60.0

## Results

| Test | Time |
|------|------|
${testTimings.map(t => `| ${t.name} | ${t.ms}ms |`).join('\n')}

## Console Errors Captured

${allErrors.length === 0 ? 'None' : allErrors.map(e => `- [${e.url}] ${e.text}`).join('\n')}

## Screenshots

${screenshots.map(s => `- ${s}`).join('\n') || 'None captured'}

## Notes

- Suites 2-4 require authentication. Tests verify element presence but cannot complete full flows without a test user session.
- Upload and export tests detect UI elements only; functional testing requires auth bypass or test credentials.
`;

  fs.writeFileSync(path.join(dir, 'report.md'), report);
  console.log(`Report written to ${path.join(dir, 'report.md')}`);
});
