# Session Log: Canvas UX Sprint
Date: 2026-05-17

## What was built

### ACTION 1: Vertical tab sidebar
**File:** `src/frontend/CanvasScreen.jsx`

Removed horizontal tab bar from inside `canvas-centre`. Added 48px vertical `<nav role="tablist">` as flex sibling before `canvas-centre` inside `canvas-body`.

Details:
- Three tabs: THINK / IDEAS / WRITE (short rotated labels, full label in `aria-label` and `title`)
- `writingMode: 'vertical-rl'`, `transform: 'rotate(180deg)'` for vertical text
- Active tab: 3px `borderLeft` in `var(--sov-line, #10b981)`
- Content dots rendered below label when `hasThinkContent` / `hasIdeasContent`
- ARIA: `role="tab"`, `aria-selected`, `aria-label` with full label
- Restores left column visual anchoring that was lost when tabs moved to horizontal bar

### ACTION 2: AURA overlay fixes
**File:** `src/frontend/components/AuraChatOverlay.jsx`

**Fix 1: Duplicate border removed**
Removed `border: 1px solid ${ACCENT_BORDER}` from outer container. The `boxShadow` green glow is the sole visual boundary. Eliminates the hard-line + glow double-border appearance.

**Fix 2: Collapse toggle**
- `const [collapsed, setCollapsed] = useState(false)` 
- Container: `maxHeight: collapsed ? 44 : 480`, `transition: 'max-height 180ms ease'`
- Collapse/expand button added to header button group (chevron up/down)
- All content below header wrapped in `{!collapsed && (<> ... </>)}`
- Header `borderBottom` set to `'none'` when collapsed

**Fix 3: Drag to reposition**
- `overlayPos` state initialised from `localStorage.getItem('simplifii:aura-position')`
- Header `onMouseDown` captures start position, listens for `mousemove`/`mouseup` on document
- Skips drag when target is a button (voice, collapse, close are still clickable)
- Position stored immediately on move: `localStorage.setItem('simplifii:aura-position', JSON.stringify(newPos))`
- Container position: spreads `{ left, top }` from state or defaults `{ bottom: 92, right: 20 }`
- Header `cursor: 'grab'`, `userSelect: 'none'`

### ACTION 3: Dragon Ball orbs
**File:** `src/frontend/components/EnergyOrbs.jsx`

**Fix 1: Orbs clickable, cycle 1-7**
Each orb wrapped in a `<button>` element. `onClick` sets `remaining` to `i + 1`, or `0` if the clicked orb was already the highest active one (tap top filled orb to drain all).

**Fix 2: Active count maps to grit level**
- Imports `useSettings` from `../SettingsContext`
- `useEffect` on `remaining`: `>= 6` sets `'socratic'`, `>= 3` sets `'balanced'`, `< 3` sets `'literal'`
- Student's energy level now directly steers how challenging AURA's prompts are

**Fix 3: Cluster draggable**
- `clusterPos` state initialised from `localStorage.getItem('simplifii:dragon-position')`
- Same drag pattern as AURA: `onMouseDown` on outer div, skips when target is button
- Position stored on move: `localStorage.setItem('simplifii:dragon-position', JSON.stringify(newPos))`
- `cursor: 'grab'` on outer div

## Commit SHAs

| SHA | Description |
|---|---|
| `122bdfad` | ux: tabs moved to 48px vertical left sidebar — restores left column anchoring, ARIA roles |
| `2c25d34e` | ux: AURA collapse + drag + border fix; Dragon Ball orbs wired to grit + draggable |

## Tests
- Build: clean (16 rgba() warnings, non-blocking, legacy migration pending)
- Regression: 12/12 passed

## Files changed this session

| File | Type | Summary |
|---|---|---|
| `src/frontend/CanvasScreen.jsx` | Modified | Vertical tab sidebar replaces horizontal bar |
| `src/frontend/components/AuraChatOverlay.jsx` | Modified | Collapse, drag, duplicate border fix |
| `src/frontend/components/EnergyOrbs.jsx` | Modified | Clickable orbs, grit mapping, draggable cluster |

## Next session
**Sprint 11: Secondary tier, HSC and homework support.**
Read tester feedback first before scoping.

Sprint 11 scope (from BACKLOG, subject to tester feedback):
1. Secondary ingestion mode: detect HSC question format on upload
2. AURA secondary prompt variant: exam technique language, mark-allocation awareness, dot-point structure
3. Word count targets adjusted for Secondary tier (default 400 not 1500)
4. "4 Ways" UDL tool verified and extended

Depends on: SovereignRouter Secondary tier selectable at login
