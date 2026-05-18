/**
 * Agent Test: AI-driven end-to-end testing using Playwright + Anthropic Vision.
 *
 * Navigates the live site as a confused first-year student, takes screenshots,
 * asks Claude what to do next, executes actions, and logs every issue found.
 *
 * Usage: ANTHROPIC_API_KEY=sk-... node tests/agent-test.js
 *        TEST_URL=https://... node tests/agent-test.js
 */

const { chromium } = require('playwright');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const TEST_URL = process.env.TEST_URL || 'https://simplifii-os-main.vercel.app';
const GOAL = 'You are testing a student study web app. Act as a confused first-year university student. Navigate the site, go through signup, onboarding, upload a document, open the canvas, ask AURA a question. Report every broken element, confusing UI, and error message you encounter.';

async function takeScreenshot(page) {
  const buffer = await page.screenshot({ fullPage: false });
  return buffer.toString('base64');
}

async function askClaude(screenshotBase64, history) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 },
        },
        {
          type: 'text',
          text: `Goal: ${GOAL}\n\nPrevious actions: ${JSON.stringify(history.slice(-5))}\n\nWhat do you see? What is broken or confusing? What should you do next?\n\nRespond as JSON only: { "observation": "string", "issues": ["string"], "action": { "type": "click|type|navigate|wait|done", "selector": "CSS selector if click", "text": "text if type", "url": "url if navigate", "reason": "why" } }`,
        },
      ],
    }],
  });

  const raw = response.content[0].text;
  try {
    // Handle markdown-wrapped JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
  } catch {
    return { observation: raw, issues: [], action: { type: 'wait', reason: 'parse failed' } };
  }
}

async function runAgentTest() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set. Export it or pass via environment.');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const history = [];
  const allIssues = [];
  const consoleErrors = [];
  let iterations = 0;

  // Capture console errors
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('Agent test starting. URL:', TEST_URL);
  console.log('Goal:', GOAL);
  console.log('');

  await page.goto(TEST_URL, { waitUntil: 'networkidle', timeout: 30000 });

  while (iterations < 25) {
    iterations++;
    console.log(`\n--- Iteration ${iterations} ---`);

    const screenshot = await takeScreenshot(page);

    // Save screenshot for debugging
    const ssDir = path.join(__dirname, 'screenshots');
    fs.mkdirSync(ssDir, { recursive: true });
    fs.writeFileSync(
      path.join(ssDir, `agent-${String(iterations).padStart(2, '0')}.png`),
      Buffer.from(screenshot, 'base64')
    );

    let result;
    try {
      result = await askClaude(screenshot, history);
    } catch (err) {
      console.error('Claude API error:', err.message);
      allIssues.push(`[API Error] ${err.message}`);
      break;
    }

    console.log('Observation:', result.observation);
    if (result.issues?.length) {
      console.log('Issues found:', result.issues.length);
      result.issues.forEach(issue => console.log(`  - ${issue}`));
      allIssues.push(...result.issues);
    }

    if (result.action?.type === 'done') {
      console.log('Agent completed the journey.');
      break;
    }

    history.push({
      iteration: iterations,
      observation: result.observation,
      action: result.action,
    });

    // Execute the action
    try {
      if (result.action?.type === 'click' && result.action.selector) {
        await page.click(result.action.selector, { timeout: 5000 }).catch(async () => {
          // Fallback: try text-based click
          const sel = result.action.selector.replace(/['"]/g, '');
          await page.getByText(sel, { exact: false }).first().click({ timeout: 5000 });
        });
        console.log(`Clicked: ${result.action.selector} (${result.action.reason})`);
      } else if (result.action?.type === 'type' && result.action.selector) {
        await page.fill(result.action.selector, result.action.text || '', { timeout: 5000 });
        console.log(`Typed: "${result.action.text}" into ${result.action.selector}`);
      } else if (result.action?.type === 'navigate' && result.action.url) {
        await page.goto(result.action.url, { waitUntil: 'networkidle', timeout: 15000 });
        console.log(`Navigated to: ${result.action.url}`);
      } else {
        await page.waitForTimeout(2000);
        console.log('Waited 2s');
      }
    } catch (e) {
      console.log(`Action failed: ${e.message}`);
      allIssues.push(`Action failed: ${result.action?.reason}: ${e.message}`);
    }

    await page.waitForTimeout(1500);
  }

  // Add console errors as issues
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => allIssues.push(`[Console Error] ${e}`));
  }

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    goal: GOAL,
    url: TEST_URL,
    totalIssues: allIssues.length,
    uniqueIssues: [...new Set(allIssues)],
    actionsCompleted: iterations,
    consoleErrors: consoleErrors.length,
    history,
  };

  const reportPath = path.join(__dirname, 'agent-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n=== AGENT TEST REPORT ===');
  console.log(`URL: ${report.url}`);
  console.log(`Issues found: ${report.totalIssues} (${report.uniqueIssues.length} unique)`);
  console.log(`Actions completed: ${report.actionsCompleted}`);
  console.log(`Console errors: ${report.consoleErrors}`);
  if (report.uniqueIssues.length > 0) {
    console.log('\nUnique issues:');
    report.uniqueIssues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  }
  console.log(`\nFull report: ${reportPath}`);
  console.log(`Screenshots: ${path.join(__dirname, 'screenshots', 'agent-*.png')}`);

  await browser.close();
}

runAgentTest().catch(err => {
  console.error('Agent test crashed:', err);
  process.exit(1);
});
