# Stage 01 — Obsidian Gate (landing)

**Branch:** sovereign-refactor-handshake
**Journey reference:** docs/USER_JOURNEY.md, Stage 01
**Trace performed by:** @tracer subagent
**Status:** WORKING WITH GAPS
**Last updated:** 2026-05-13

---

## What this stage is

The user arrives at Simplifii-OS for the first time. The browser loads `public/index.html`, which mounts the React root into `<div id="root">`. The provider tree hydrates (`GoogleOAuthProvider`, `AuthProvider`, `SettingsProvider`, `ProjectProvider`, `InstitutionalProvider`). `AuthProvider` fires `supabase.auth.getSession()` on mount to check for an existing session. If no session exists and `simplifii_onboarding_complete` is not set in `localStorage`, `AppContent` renders the `LandingPage` component. The user sees the Obsidian Gate: a blurred glass card centred on a near-black background, with the brand mark (a blinking cursor glyph), the words "Simplifii-OS" and "> Sovereign Handshake", a Google OAuth sign-in button, a data sovereignty reassurance line, and a system status footer. No course data is loaded. No IndexedDB writes occur. The gate waits for the user to authenticate.

---

## The six links

### Link 1 — User action

**What the user does:** Navigates to the Simplifii-OS URL in a browser (or opens the app for the first time).
**Where they do it:** Browser address bar or bookmark.
**What they expect to happen:** A landing page loads. They see something that tells them what the product is and how to sign in.

### Link 2 — Frontend event

**Event fired:** React mount of `AppContent` component; `useEffect` at `src/App.js:44-51` checks `window.location.search` for a `?reset=true` parameter. `AuthProvider.useEffect` at `src/contexts/AuthContext.js:11-25` fires `supabase.auth.getSession()` and registers `supabase.auth.onAuthStateChange()`.
**File:** `src/App.js:40-66`, `src/contexts/AuthContext.js:11-25`
**Listener:** `AppContent` reads `isReturning` from `localStorage.getItem('simplifii_onboarding_complete')` at `src/App.js:41`. When it is not `'true'`, `currentView` is set to `VIEW.LANDING` and the `LandingPage` component renders at `src/App.js:60`.

Status: INTACT

### Link 3 — Service layer

**Service or function called:** `supabase.auth.getSession()`
**File:** `src/contexts/AuthContext.js:12`
**Input shape:** No arguments. Called on the Supabase client instance created at `src/lib/supabaseClient.js:6-12`.
**Output shape:** `{ data: { session: Session | null } }`. If `session` is null, `user` is set to null, `isAuthenticated` resolves to `false`, `loading` is set to `false`.
**External dependencies:** Supabase Auth service at `https://aqcreatryuvuuynwvnqy.supabase.co` (URL hardcoded at `src/lib/supabaseClient.js:3`). Requires the anon key from `REACT_APP_SUPABASE_ANON_KEY` environment variable; defaults to empty string if unset (`src/lib/supabaseClient.js:4`).

Status: INTACT

### Link 4 — Persistence

**Where data is written:** NONE on first landing. No writes to IndexedDB or Supabase occur during the Obsidian Gate render. The `SettingsProvider` (`src/frontend/SettingsContext.js:40-64`) reads from `localStorage` on mount to hydrate its state (mode, eduLevel, highContrast, etc.) and writes all settings back to `localStorage` via a `useEffect` on every state change, but these are reads of pre-existing defaults, not new data creation.
**File:** `src/frontend/SettingsContext.js:40-64` (localStorage read/write of settings)
**Schema version:** NOT APPLICABLE
**Shape written:**

```json
{
  "note": "No new data written at this stage. SettingsContext persists its own defaults to localStorage on mount."
}
```

Status: INTACT

### Link 5 — Event emission

**Custom Event fired:** `simplifii:lod-change` is dispatched by `SettingsContext` at `src/frontend/SettingsContext.js:62` whenever any setting changes (including on initial mount hydration). Payload: `{ detail: { lodLevel } }`. No other Custom Events fire during the Obsidian Gate render.
**File:** `src/frontend/SettingsContext.js:62`
**Listeners that react:** No component in the Stage 01 path listens for `simplifii:lod-change`. It is consumed by downstream components (ExecutiveSpine, cockpit views) that are not mounted at this stage.

Status: INTACT (the event fires but has no Stage 01 consumers, which is correct: nothing should react at this stage)

### Link 6 — Render update

**Component that re-renders:** `LandingPage`
**File:** `src/frontend/LandingPage.js:111-322`
**What the user sees:**
- Full-viewport dark background (`#09090b`) with a subtle emerald radial gradient at the top.
- A centred glass card (440px max width, blurred backdrop, 1px `#27272a` border, 4px border-radius).
- Inside the card (top to bottom):
  - A blinking underscore cursor glyph (`_`) in emerald (`#10b981`), rendered in JetBrains Mono at 2.4rem (`src/frontend/LandingPage.js:223`).
  - "Simplifii-OS" in uppercase, 13px, `#a1a1aa`, letter-spacing 0.38em (`src/frontend/LandingPage.js:225-229`).
  - "> Sovereign Handshake" in 10px, `#52525b` (`src/frontend/LandingPage.js:230-235`).
  - A divider labelled "AUTHORISE" (`src/frontend/LandingPage.js:81-84`).
  - The Google sign-in button (rendered by `@react-oauth/google`'s `GoogleLogin` component, filled_black theme, rectangular, `src/frontend/LandingPage.js:86-95`).
  - Privacy reassurance text: "> Your data stays on this device. Zero disclosure to institutions." (`src/frontend/LandingPage.js:96-103`).
  - Status line: "Status: Awaiting Authorisation" (`src/frontend/LandingPage.js:288-296`).
- Top-right corner: a UDL Mode toggle button ("Clarity Mode" / "Focus Mode Active") using Eye/EyeOff icons (`src/frontend/LandingPage.js:180-191`).
- Footer: "[ SYSTEM // LOCAL_VAULT_ENCRYPTED ]" on the left, "AU-EN // SOVEREIGN v1.0.0" on the right (`src/frontend/LandingPage.js:302-319`).
- The entire card animates in via Framer Motion: `opacity: 0 -> 1`, `scale: 0.98 -> 1`, `y: 10 -> 0`, duration 0.6s, cubic-bezier ease `[0.16, 1, 0.3, 1]` (`src/frontend/LandingPage.js:203-206`).

**Token compliance:** FAIL (see Token compliance check section below)

Status: INTACT

---

## Gaps and breaks

- Gap 1: The `LandingPage` component does not import or use design tokens from `src/theme/tokens.js`. All colour values are hardcoded as raw hex strings inline (`#09090b`, `#10b981`, `#27272a`, `#a1a1aa`, `#52525b`, `#3f3f46`, `#18181b`, `#e4e4e7`, `#71717a`). The values match the token definitions, but they bypass the token system entirely.
- Gap 2: The `LandingPage` component does not import from `src/core/Events.js`. No stage-completion event is emitted when the gate renders. The USER_JOURNEY.md description says "No data is loaded yet", which is correct, but there is no explicit "gate rendered" signal for telemetry or the EventBus.
- Gap 3: The `ViewBoundary` error boundary at `src/App.js:12-37` uses raw hex values (`#07080D`, `#10b981`, `#000`, `#a1a1aa`) instead of design tokens.
- Gap 4: The `INJECTED_CSS` block at `src/frontend/LandingPage.js:14-65` injects a `@import` for Google Fonts (JetBrains Mono and Inter) at runtime via a `<style>` tag. This duplicates the font loading already handled by `public/index.html:8` (which loads Geist and JetBrains Mono). Inter is loaded by the CSS `@import` but not by the HTML `<link>`. Geist is loaded by the HTML `<link>` but never referenced in LandingPage. This is not broken but is redundant and creates two competing font loading paths.
- Gap 5: `src/index.css:8` sets `background-color: #07080D` on `body`, but the LandingPage's root div uses `#09090b` (Zinc 950 / `SURFACE_BASE`). The body background flashes `#07080D` before React hydrates. These are different colours.

---

## Error path

- **Failure mode A: Supabase unreachable.** `supabase.auth.getSession()` at `src/contexts/AuthContext.js:12` returns a rejected promise. The `.then()` chain does not have a `.catch()`. This would result in an unhandled promise rejection. The `loading` state would remain `true` indefinitely, and the user would see the "AUTHENTICATING..." spinner forever (`src/frontend/LandingPage.js:240-247`). The `ViewBoundary` error boundary does not catch promise rejections that occur outside the render path.
- **Failure mode B: Google OAuth client ID missing.** `process.env.REACT_APP_GOOGLE_CLIENT_ID` defaults to empty string at `src/App.js:69`. The `GoogleOAuthProvider` receives an empty `clientId`. The `GoogleLogin` component may render a broken or non-functional button. No error surface exists for this case.
- **Failure mode C: localStorage unavailable.** `SettingsContext` wraps reads in bare calls (`localStorage.getItem(...)` at `src/frontend/SettingsContext.js:6-38`) without try/catch. If localStorage is blocked (private browsing on some browsers), the provider would throw on mount, caught by `ViewBoundary`, and the user would see the "Cockpit recovered" crash screen with a "Reload OS" button.
- **Failure mode D: React render crash.** `ViewBoundary` at `src/App.js:12-37` catches render errors and shows a recovery screen on `#07080D` background with an emerald "Reload OS" button. The user can click to reload. No telemetry is sent on crash.

---

## Side effects

- Side effect 1: `SettingsContext` writes approximately 19 keys to `localStorage` on every mount, even when no values have changed (`src/frontend/SettingsContext.js:40-64`). This fires on every render cycle where the dependency array changes, which includes the initial mount.
- Side effect 2: `SettingsContext` dispatches a `simplifii:lod-change` CustomEvent on mount (`src/frontend/SettingsContext.js:62`), broadcasting the current `lodLevel` to all window listeners. No component consumes this at Stage 01.
- Side effect 3: `supabase.auth.onAuthStateChange()` at `src/contexts/AuthContext.js:18-22` registers a persistent listener on the Supabase auth state. This listener remains active for the lifetime of the `AuthProvider` component. It fires on every auth state transition (sign-in, sign-out, token refresh).
- Side effect 4: The `INJECTED_CSS` `<style>` tag at `src/frontend/LandingPage.js:177` triggers a network request to `fonts.googleapis.com` to load JetBrains Mono and Inter font faces on every mount of `LandingPage`.

---

## Verdict

**WORKING WITH GAPS** (happy path) / **BROKEN** (Error Path A: Supabase unreachable = infinite spinner, no recovery)

All six links are intact and the user sees the correct Obsidian Gate on first load. The gate correctly waits for authentication before proceeding. Gaps are cosmetic (raw hex values bypassing the token system) and architectural (body background colour mismatch, duplicate font loading). The happy path works. Error Path A is broken: if Supabase is unreachable, the user is permanently stuck on an infinite spinner with no recovery.

Error path A scoped into Sprint 3.5. Token violations in LandingPage.js, App.js ViewBoundary, and index.css scoped into a dedicated legacy-migration sprint (Sprint 3.6 or later).

**Recommended next action:** Sprint 3.5: fix the missing `.catch()` on `supabase.auth.getSession()`, reconcile body background `#07080D` with `SURFACE_BASE`, and deduplicate font loading. Sprint 3.6+: sweep raw hex values in LandingPage.js and App.js ViewBoundary into token imports.

---

## Token compliance check

Did this trace surface any Obsidian Aesthetic violations? Log them here for the next style sweep. Do not fix them in this trace.

- [x] Raw hex value found in: `src/frontend/LandingPage.js` (lines 25, 27, 38, 39, 40, 41, 53, 59, 81, 84, 97, 98, 169, 211, 212, 213, 214, 215, 216, 221, 226, 227, 231, 233, 243, 271, 275, 281, 289, 291, 310, 313, 316); `src/App.js:19-20` (ViewBoundary); `src/index.css:8` (`#07080D`)
- [x] Raw font string found in: `src/frontend/LandingPage.js:28` (`'JetBrains Mono', monospace`), `src/frontend/LandingPage.js:41-42` (same), `src/frontend/LandingPage.js:173` (`'Inter', sans-serif`). These should reference `FONT_SYSTEM` and `FONT_BODY` from `src/theme/tokens.js`.
- [ ] Em-dash found in: None detected.
- [ ] Linear easing found in: `src/frontend/LandingPage.js:243` uses `animation: spin 1s linear infinite` on the Loader2 icon. This is a spinner animation; linear is standard for spinners and arguably not a violation. Flagged for review.
- [ ] American spelling found in: None detected. "Authorise" is correctly spelt at `src/frontend/LandingPage.js:83`. "Colour" is not used on this page (no need for it).
- [ ] Other: Body background in `src/index.css:8` is `#07080D`, which is not a defined token in `src/theme/tokens.js`. The closest token is `SURFACE_BASE` (`#09090b`). These are visibly different shades.
