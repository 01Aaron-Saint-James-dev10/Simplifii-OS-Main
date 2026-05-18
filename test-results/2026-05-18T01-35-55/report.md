# Regression Test Report
**Date:** 2026-05-18T01:36:19.568Z
**Playwright:** 1.60.0

## Results

| Test | Time |
|------|------|
| J1 dashboard (skipped) | 3622ms |
| J2 think-tab (skipped) | 1331ms |
| J3 ideas-tab (skipped) | 1305ms |
| J4 write-tab (skipped) | 1522ms |
| J5 aura-greeting (skipped) | 1424ms |
| 5.1 empty | 1449ms |
| 5.2 responsive | 2156ms |
| 5.3 perf | 1946ms |
| 6.1 persistence | 1308ms |
| 7.1 tab-navigation | 2584ms |
| 7.2 enter-activates | 784ms |
| 7.3 escape-closes-aura | 2163ms |

## Console Errors

None

## Screenshots

- 11-edge-empty.png
- 12-mobile-375.png
- 13-tablet-768.png
- 14-performance.png

## Notes

- Tests run against production by default (auth-gated: suites 2-4 detect elements only)
- For full authenticated testing: PLAYWRIGHT_LOCAL=true npx playwright test (starts local dev server with test mode)
