# PRODUCT_SPEC — Status Pills and Display Preferences

**Branch:** v2-rebuild-canvas-first
**Created:** 13 May 2026
**Status:** Source of truth. Overrides any conflicting decisions in earlier spec files.
**Scope:** Implementation contract for the three-pill status system and the Settings → Display preferences. Used across Screens 3 (Home), 4 (Writing canvas), and 5 (Settings).

This document closes two open product questions from the Screen 3 design phase. It is binding for the v1 build and supersedes any pill or layout assumptions made in PRODUCT_SPEC.md, PRODUCT_SPEC_TIER_UPDATE.md, or PRODUCT_SPEC_INCLUSION_AND_MOAT.md.

---

## 1. Status pill system

### 1.1 Three pills, not four

Tasks and assessments have exactly three status states. Adding a fourth (e.g. orange between amber and red) was considered and rejected. Reason: status is categorical, not gradient. A four-pill system overloads the categorical signal with urgency information that belongs in a separate visual channel. Urgency within "Due this week" is communicated through countdown text intensity, not pill colour.

| State | Pill colour | Shape glyph | Text label |
|---|---|---|---|
| On track | Emerald | Filled dot | "On track" |
| Due this week | Amber | Hollow ring | "Due this week" |
| Overdue | Red | Warning triangle | "Overdue" |

Every pill uses shape + colour + text. WCAG 1.4.1 (use of colour) is satisfied three ways. No information is communicated by colour alone.

Tier vocabulary may rename the labels (e.g. TAFE uses "In progress" / "Milestone this week" / "Past target") but the underlying three-state model is universal. Colours and glyphs do not change between tiers. Refer to PRODUCT_SPEC_TIER_UPDATE.md for the per-tier label map.

### 1.2 The algorithm

The pill state is derived from the task's due date relative to "now" (the user's local clock).

```javascript
// src/services/StatusService.js
export function getTaskStatus(dueDate, now = new Date()) {
  const due = new Date(dueDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysToDue = Math.floor((due - now) / msPerDay);

  if (daysToDue < 0) {
    return {
      state: 'overdue',
      pill: 'red',
      glyph: 'triangle',
      label: 'Overdue',
      daysOverdue: Math.abs(daysToDue),
      urgency: 'critical',
      countdownText: `${Math.abs(daysToDue)} day${Math.abs(daysToDue) === 1 ? '' : 's'} late`
    };
  }

  if (daysToDue <= 7) {
    let urgency;
    if (daysToDue <= 1) urgency = 'urgent';
    else if (daysToDue <= 3) urgency = 'soon';
    else urgency = 'this-week';

    return {
      state: 'due-this-week',
      pill: 'amber',
      glyph: 'ring',
      label: 'Due this week',
      daysToDue,
      urgency,
      countdownText: daysToDue === 0 ? 'Due today' : daysToDue === 1 ? 'Due tomorrow' : `in ${daysToDue} days`
    };
  }

  let urgency;
  if (daysToDue >= 15) urgency = 'plenty';
  else urgency = 'comfortable';

  return {
    state: 'on-track',
    pill: 'green',
    glyph: 'dot',
    label: 'On track',
    daysToDue,
    urgency,
    countdownText: `in ${daysToDue} days`
  };
}
```

### 1.3 Countdown text intensity

The `urgency` field controls the visual weight of the countdown text. The pill stays categorical; the countdown text escalates within each state. This gives the user the four-stage urgency progression (plenty / comfortable / soon / urgent / critical) without overloading the pill colour system.

| Urgency | Days to due | Countdown text style |
|---|---|---|
| Plenty | 15+ | `--text-muted`, font-weight 400 |
| Comfortable | 8–14 | `--text-soft`, font-weight 400 |
| This week | 4–7 | `--amber`, font-weight 400 |
| Soon | 2–3 | `--amber`, font-weight 500 |
| Urgent | 0–1 | `--amber-bright`, font-weight 500, faint pulse on hover |
| Critical | < 0 (overdue) | `--red`, font-weight 500 |

The "faint pulse on hover" must respect `prefers-reduced-motion: reduce` and degrade to a static brighter colour when motion is suppressed.

### 1.4 Tier-specific thresholds

The 7-day "due this week" window is the universal default. Some tiers may need adjustment via TierProfile config:

| Tier | "On track" threshold | "Due this week" window |
|---|---|---|
| Primary F-6 | 5+ days | 0–4 days |
| Secondary 7-10 | 7+ days | 0–6 days |
| Senior secondary 11-12 | 14+ days | 0–13 days |
| TAFE/VET | 7+ days | 0–6 days (or self-set milestone) |
| Uni undergrad | 7+ days | 0–6 days |
| Uni postgrad | 14+ days (thesis); 7+ days (coursework) | 0–13 / 0–6 days |

These thresholds are configured per tier in `src/streams/<tier>/TierProfile.js`. The algorithm reads thresholds from the active TierProfile at runtime.

### 1.5 Implementation requirements

- Single `StatusPill` React component used across Home, Writing canvas, and Settings preview.
- Receives a `status` prop (the object returned by `getTaskStatus`).
- Renders pill + glyph + text label.
- Exposes `aria-label` containing the full status description (e.g. "Status: On track, due in 12 days").
- Test coverage: snapshot test for each of the three states, axe-core a11y test, contrast verification.

### 1.6 What the pill does NOT communicate

- Grade weight (separate metadata field, shown in Up Next card)
- AI usage percentage (Work Provenance Record only)
- Tier (assumed from user profile, not pill)
- Course identity (separate course code/name)

---

## 2. Display preferences

### 2.1 Decision context

The Screen 3 design phase produced three viable layouts: grid-dominant (V1), today-dominant (V2), and timeline-first (V3). Rather than ship three layouts or force users to choose at sign-up, v1 ships a single hybrid default with composable toggles in Settings. This gives users meaningful personalisation without decision fatigue at onboarding.

A student who likes the default never adjusts anything. A student who wants a different view finds the toggle once and forgets about it. Settings is where preferences live; Home is where work happens. Clean separation.

### 2.2 The default home layout (hybrid)

| Section | Order | Purpose |
|---|---|---|
| Top nav | 1 | Logo, Add course, Settings, Talk to someone |
| 7-day timeline strip | 2 | Visual time externalisation (P0 reminder pattern) |
| Up Next hero card | 3 | Decision externalisation, one-tap to canvas |
| Decision row | 4 | "What should I do next?" button + body doubling line |
| Course grid | 5 | Browse all courses sorted by earliest next-due |

This default ships to every user in every tier. Tier vocabulary swaps but section order does not.

### 2.3 The five toggles

Settings → Display section. Each toggle is independent. Default state is shown in the table.

| Toggle ID | Label | Default | What it controls |
|---|---|---|---|
| `display.timeline` | Show 7-day timeline | On | Renders / hides the timeline strip below the top nav |
| `display.upNext` | Show Up Next hero card | On | Renders / hides the rich Up Next card |
| `display.cardDensity` | Course card density | Standard | Standard / Compact. Compact removes secondary meta lines (rubric extracted, course term, etc.) and reduces vertical padding |
| `display.bodyDoubling` | Body doubling indicator | On | Renders / hides "47 students working alongside you" line beneath the decision button |
| `display.overdueTally` | Show overdue count in nav | On | Renders / hides the red badge counter in the top-right of the nav |

Each toggle is a boolean except `display.cardDensity` which is an enum ('standard' | 'compact').

### 2.4 What toggles do NOT touch

The following are non-negotiable and never become preferences. They are spec-locked:

- "Talk to someone" link (P0 safety, undeletable for minors)
- "What should I do next?" decision button (P0 decision externalisation)
- Status pills (P0 WCAG compliance)
- Australian English vocabulary
- Obsidian Aesthetic colour system (light/dark is a separate theme preference, not a Display toggle)
- Tier language pack (set during first-time setup, changed only via Settings → Profile)

### 2.5 Behavioural rules

**Composability.** Each toggle is independent. A user can disable Timeline + Up Next + Body doubling and end up with a course-grid-only view. The Home screen accepts any combination of toggle states.

**Empty state override.** When the user has zero courses, all Home toggles are suppressed regardless of preference. The empty state shows only the upload affordance. This prevents the toggles from creating an even-more-empty Home that confuses first-run users.

**Settings preview.** The Display section must include a live preview thumbnail. The thumbnail re-renders as toggles change so the user sees the effect immediately. The preview can be a simplified miniature of the Home screen (~280px wide) — full fidelity not required, but section presence/absence must be accurate.

**Reset to default.** A "Reset to default" button at the bottom of the Display section restores all toggles to their factory defaults. Confirmation modal not required (it's a low-stakes action).

### 2.6 Persistence

Display preferences persist via two layers:

1. **Local first.** Write to IndexedDB on every toggle change. The Home screen reads from IndexedDB on mount. This ensures offline-mode compatibility (per spec 2.10).
2. **Server sync.** When online, sync to the user's profile via Supabase. On a new device sign-in, the user's preferences hydrate from the server before first render.

If local and server preferences conflict (e.g. user changed toggles offline on device A, then signed in on device B), the most-recently-modified preference wins. Conflict resolution at the toggle level, not the whole preference set.

```javascript
// Shape of the stored preferences
{
  display: {
    timeline: true,
    upNext: true,
    cardDensity: 'standard',
    bodyDoubling: true,
    overdueTally: true
  },
  display_meta: {
    lastModified: '2026-05-13T18:00:00.000Z',
    lastModifiedDevice: 'macbook-air-aaron'
  }
}
```

### 2.7 Component contract

```
src/frontend/HomeScreen.jsx
├─ reads useSettings() for display preferences
├─ conditionally renders <TimelineStrip /> if display.timeline
├─ conditionally renders <UpNextCard /> if display.upNext
├─ always renders <DecisionRow />
├─ conditionally renders <BodyDoublingLine /> if display.bodyDoubling
└─ renders <CourseGrid density={display.cardDensity} />

src/frontend/SettingsDisplay.jsx
├─ reads useSettings() for current preferences
├─ writes useSettings() on toggle change
├─ renders <DisplayToggle /> for each of the 5 toggles
├─ renders <DisplayPreview preferences={...} />
└─ renders <ResetToDefaultButton />

src/frontend/DisplayPreview.jsx
├─ accepts a preferences object
├─ renders a miniature of HomeScreen using mock data
└─ updates in real time as preferences change
```

### 2.8 Accessibility

- Each toggle is a standard checkbox/select with associated `<label>`.
- Toggles support full keyboard navigation (Tab, Space to toggle).
- Visible focus indicator on every toggle (WCAG 2.4.13).
- Toggle labels and descriptions are announced by screen readers.
- The preview thumbnail has `aria-label="Preview of your home screen with current settings"`.
- The "Reset to default" button is a clearly-labelled `<button>`, not a styled link.

### 2.9 Discoverability

A first-time user lands on the default Home with no awareness of the toggles. This is intentional — most users will be happy with the default and shouldn't be burdened with a "customise your view" prompt. For users who want to customise:

- Settings icon is always visible in the top-right of the nav.
- Settings → Display is the second section in Settings, just below Profile.
- The Display section header reads "Display preferences" with a short description: "Show or hide sections of your home screen."

No tutorial, no tooltip on first visit, no nudge. The toggles are there when the user goes looking.

---

## 3. Forbidden patterns

The following must not appear anywhere in the status pill or display preferences implementation:

- Four-pill systems (only three states ever)
- Colour-only status communication (always shape + colour + text)
- Layout selection during first-time setup (deferred to Settings)
- Three separate HomeScreen components (one component, conditional rendering)
- Hardcoded section visibility (must read from preferences)
- Localised preferences that don't sync (offline → server is mandatory)
- "Compact mode" that hides Status pills, Up Next CTAs, or accessibility affordances (compact reduces non-essential meta only)
- Animated transitions that don't respect `prefers-reduced-motion`
- Status pill colours that fail WCAG AA contrast on any background

---

## 4. Acceptance criteria

This spec is correctly implemented when:

1. `getTaskStatus()` returns the expected pill state for given due dates (unit tested).
2. `StatusPill` component renders correctly in all three states (snapshot tested).
3. WCAG AA contrast is verified for every pill colour on every background colour (dark, light, hover).
4. axe-core CI gate passes on Home, Settings → Display, and Writing canvas.
5. All 5 toggles in Settings → Display:
   - Persist locally on change
   - Sync to server when online
   - Hydrate from server on new-device sign-in
   - Re-render the live preview on change
6. Reset to default restores all 5 toggles to their factory state.
7. Empty state on Home suppresses all toggles regardless of preferences.
8. `prefers-reduced-motion: reduce` suppresses all pulse/glow animations on countdown text.
9. Keyboard navigation works for every toggle and the preview.
10. Screen reader correctly announces every pill, toggle, and preference state.

---

## 5. Out of scope for v1

- Theme preferences (light/dark/high-contrast). Lives in a separate Theme section of Settings, not Display.
- Font preferences (OpenDyslexic, Lexend, Atkinson Hyperlegible). Lives in Settings → Reading aids.
- Density beyond Standard/Compact (no "Spacious" or "Ultra-compact" in v1).
- Custom colour palettes (Obsidian Aesthetic is the only palette in v1).
- Saved layout presets (no "save my layout" feature in v1).
- Per-device preferences (preferences are per-user, not per-device).

These can be revisited in v2 once we have real user behaviour data.

---

**End of spec.**
