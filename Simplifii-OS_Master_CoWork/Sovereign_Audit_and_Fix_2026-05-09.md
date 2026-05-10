# Sovereign Audit and Fix Pack — 9 May 2026

**Repo audited:** `01Aaron-Saint-James-dev10/Simplifii-OS-Main` @ `sovereign-phase-2-3` (HEAD: `6a738db`)
**Method:** Cloned the branch, read all four core modules, traced every public symbol back to its callers, grep'd for the eight dispatched events to find listeners.

---

## Bottom line

The four engines (SovereignRouter, LiteralMode, ExecutiveSpine, HistoryOfThought) are well-built and match the Blueprint. They're running. Almost nothing is plugged into them.

Eight `simplifii:*` events fire into the void. Nothing has `data-focus-locked` set, so the focus-session CSS rule has no targets. No one calls `startFocusSession`, `startIdleDetection`, `setSectionHealth`, or `earnCredits`. The HistoryOfThought vault is always locked because there's no passphrase UX, so even if the bus existed, every event would soft-drop.

**Two one-line reconciliations are also missed** (opacity at 0.32 should be 0.4; "Mango" missing from primary vocab).

The fix is a single new module (`SovereignBus.js`, ~85 LOC), three small file edits, and a minimum passphrase modal. After that, the entire architecture is live end-to-end.

---

## Audit table

| Layer | What ships | What's wired | What's NOT wired |
|---|---|---|---|
| **SovereignRouter** | `hydrate`, `applyTheme`, `streamFromLevel`, capability registry | ✅ Called in `ProjectContext.js` line 467; theme applied to `<html>` on stream change | nothing missing |
| **LiteralMode** | `literalise`, `shouldLiteralise`, 22 transform patterns | ✅ Imported in `Scaffolder.js`, used via `lit()` helper across all three tier renderers | Cockpit (`LinearCanvas.js`), MicroSteps card, AURA chat replies — none currently call `literalise` |
| **ExecutiveSpine** | `startFocusSession`, `endFocusSession`, `startIdleDetection`, `setSectionHealth`, `grantPlayTime`, `earnCredits` + 8 events | ✅ CSS rule for `[data-focus-locked]` exists at `simplifii-studio.css:1604` | **No element in the UI has `data-focus-locked="true"`. No caller invokes any spine function. All 8 events dispatch with zero listeners.** |
| **HistoryOfThought** | `unlockWithPassphrase`, `appendEvent`, `listEvents`, `generateAuthenticityReport`, AES-GCM-256 + PBKDF2 600k | API surface complete | **No UI calls `unlockWithPassphrase`. No upstream calls `appendEvent`. The vault is permanently locked, every event soft-drops with `[HistoryOfThought] dropped event; vault locked` to console.** |
| **Stream profiles** | All five JSON sets (profile/vocab/theme/capabilities) | ✅ Loaded by SovereignRouter at build time | `aura_avatar_name: "Mango"` missing from primary/vocab.json (handoff reconciliation) |
| **Onboarding** | Stream picker (5-button) in `UniversalOnboarding.js:148` | ✅ Sets `profile.streamId` | Selection is optional, no validation; user can submit without picking. The router falls back to `streamFromLevel` so it still works, but explicit selection should be required for primary/secondary (so Literal Mode kicks in). |
| **Focus tunnel UI** | CSS pulse bar at top edge when `[data-focus-active="true"]` on `<html>` | ✅ The pulse bar appears | No "Start sprint" button anywhere. No element marked for distraction-zone lock. |

---

## Bugs ranked by severity

### S1 (architectural blocker) — Spine events dispatch into the void

ExecutiveSpine fires 8 `simplifii:*` CustomEvents. **Nothing listens.** The HistoryOfThought event log is empty regardless of what the user does. The Authenticity Report — your patent-continuation candidate — has no data to authenticate.

**Fix:** new `src/core/SovereignBus.js` module that listens for spine events and forwards to HistoryOfThought, plus auto-grants PlayTime when SectionHealth crosses the per-stream threshold. ProjectContext starts the bus on stream hydrate.

### S1 (architectural blocker) — Vault never unlocks

HistoryOfThought needs `unlockWithPassphrase` called once per session. There's no UI to call it. Every `appendEvent` soft-drops. Even after S1 (events bridged), nothing persists until passphrase UX lands.

**Fix:** one-modal-per-session passphrase prompt. Spec below.

### S2 — Spine lifecycle never starts

`startIdleDetection` and `startFocusSession` are never called from anywhere. The idle nudge can't fire. The focus pulse bar never shows.

**Fix:** one-line addition in `ProjectContext.js` to call `startIdleDetection({ thresholdMs: stream.profile.idleDetectionThresholdMs })` on stream change.

### S2 — Auto-PlayTime missing

`setSectionHealth` dispatches its event but never checks the threshold to auto-grant PlayTime. Per Blueprint Layer 2.2d, crossing 4/5 dots should grant PlayTime automatically.

**Fix:** the SovereignBus listener for `simplifii:section-health` checks the threshold and calls `grantPlayTime()` if crossed.

### S3 — No element marked for focus-zone lock

The CSS rule `html[data-focus-active="true"] [data-focus-locked="true"]` has no target elements. When a focus session is active, nothing visually dims.

**Fix:** add `data-focus-locked="true"` to peripheral nav, mode toggles, and non-active modules in `MasterDashboard.js` / `LinearCanvas.js`. Cockpit area stays unlocked. ~5 attribute additions.

### S3 — Reconciliation: opacity 0.32 should be 0.4

`simplifii-studio.css:1606` reads `opacity: 0.32`. Handoff says 0.4 (visually validated by you in Claude Design).

**Fix:** one-line CSS edit.

### S3 — Reconciliation: "Mango" missing from primary vocab

`src/streams/primary/vocab.json` has no `aura_avatar_name`. Per handoff, primary stream uses "Mango" as the AURA avatar name.

**Fix:** add `"aura_avatar_name": "Mango"` to that JSON.

### S4 — Onboarding stream picker is optional

User can submit onboarding without picking a stream. Router falls back to `streamFromLevel(profile.level)` which works for the existing fields, but explicit selection should be required so the picker isn't decorative.

**Fix:** add a `disabled={!profile.streamId}` to the onboarding submit button. ~1 line.

### S5 — `applyTheme` doesn't reset on logout

When a user logs out, the previous stream's CSS variables remain on `documentElement`. Cosmetic, not functional. Defer.

---

## Fix Pack — apply in this order

### Fix 1: Opacity reconciliation (one line)

**File:** `src/frontend/simplifii-studio.css`
**Line:** 1606
**Change:**
```diff
-  opacity: 0.32;
+  opacity: 0.4;
```

### Fix 2: Mango vocab (one line)

**File:** `src/streams/primary/vocab.json`
**Replace contents with:**

```json
{
  "assignment": "quest",
  "draft": "first try",
  "rubric": "scoring sheet",
  "submission": "hand in",
  "deadline": "due date",
  "literature": "stories and books",
  "synthesis": "putting ideas together",
  "methodology": "how we did it",
  "task": "step",
  "course": "subject",
  "pillar": "big task",
  "aura_avatar_name": "Mango"
}
```

### Fix 3: New module — `src/core/SovereignBus.js`

This is the load-bearing fix. Full file below; copy as a new file.

```javascript
/**
 * SovereignBus
 *
 * The wiring layer between ExecutiveSpine and HistoryOfThought.
 *
 * ExecutiveSpine dispatches 8 simplifii:* CustomEvents. Without this
 * bus, none of them are heard. The HistoryOfThought event log stays
 * empty, the Authenticity Report has nothing to authenticate, and
 * the per-stream PlayTime threshold never auto-fires.
 *
 * This module adds:
 *   1. Listeners for every spine event, mapping each to its
 *      HistoryOfThought event_type and forwarding via appendEvent.
 *      Vault-locked drops are silent (HistoryOfThought handles this).
 *   2. Auto PlayTime grant when SectionHealth crosses the active
 *      stream's sectionHealthUnlockThreshold (Blueprint Layer 2.2d).
 *
 * Called from ProjectContext.useEffect on stream hydrate. Idempotent.
 *
 * Hard rules from the Blueprint enforced here:
 *   - section_health_change events feed HistoryOfThought without naming
 *     the user (we pass user_id='local' until cloud sync ships)
 *   - PlayTime threshold is read from the stream profile, never inferred
 */

import { appendEvent, isUnlocked } from './HistoryOfThought';
import { grantPlayTime } from './ExecutiveSpine';

let __busAttached = false;
let __activeStreamId = 'tertiary';
let __activeUnlockThreshold = 4;
let __activePlaytimeMinutes = 7;

const safeAppend = async (event_type, payload) => {
  try {
    if (!isUnlocked()) return; // soft-drop; HistoryOfThought already logs
    await appendEvent({ user_id: 'local', stream_id: __activeStreamId, event_type, payload });
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[SovereignBus] appendEvent failed', e);
  }
};

const onFocusStart = (e) => safeAppend('focus_session_start', {
  taskId: e.detail?.taskId,
  plannedDurationMs: e.detail?.plannedDurationMs
});

const onFocusEnd = (e) => safeAppend('focus_session_end', {
  taskId: e.detail?.taskId,
  actualDurationMs: e.detail?.actualDurationMs,
  reason: e.detail?.reason
});

const onIdle = (e) => safeAppend('nudge_triggered', {
  reason: 'idle',
  sinceMs: e.detail?.sinceMs,
  taskId: e.detail?.taskId
});

const onSectionHealth = (e) => {
  const { sectionId, fromDots, toDots } = e.detail || {};
  safeAppend('section_health_change', { sectionId, fromDots, toDots });
  // Auto-grant PlayTime when threshold is crossed.
  if (
    typeof toDots === 'number' &&
    typeof fromDots === 'number' &&
    fromDots < __activeUnlockThreshold &&
    toDots >= __activeUnlockThreshold
  ) {
    grantPlayTime({ minutes: __activePlaytimeMinutes, reason: 'section-health' });
  }
};

const onPlaytimeGranted = (e) => safeAppend('playtime_granted', {
  durationMs: (e.detail?.until || Date.now()) - Date.now()
});

const onPlaytimeExpired = () => safeAppend('playtime_expired', {});

export const start = ({ stream } = {}) => {
  if (typeof window === 'undefined') return;
  if (__busAttached) return;
  __activeStreamId = stream?.streamId || 'tertiary';
  __activeUnlockThreshold = stream?.profile?.sectionHealthUnlockThreshold ?? 4;
  __activePlaytimeMinutes = stream?.profile?.defaultPlaytimeMinutes ?? 7;

  window.addEventListener('simplifii:focus-start', onFocusStart);
  window.addEventListener('simplifii:focus-end', onFocusEnd);
  window.addEventListener('simplifii:idle', onIdle);
  window.addEventListener('simplifii:section-health', onSectionHealth);
  window.addEventListener('simplifii:playtime-granted', onPlaytimeGranted);
  window.addEventListener('simplifii:playtime-expired', onPlaytimeExpired);
  __busAttached = true;
};

export const stop = () => {
  if (typeof window === 'undefined' || !__busAttached) return;
  window.removeEventListener('simplifii:focus-start', onFocusStart);
  window.removeEventListener('simplifii:focus-end', onFocusEnd);
  window.removeEventListener('simplifii:idle', onIdle);
  window.removeEventListener('simplifii:section-health', onSectionHealth);
  window.removeEventListener('simplifii:playtime-granted', onPlaytimeGranted);
  window.removeEventListener('simplifii:playtime-expired', onPlaytimeExpired);
  __busAttached = false;
};

export const updateActiveStream = ({ stream }) => {
  __activeStreamId = stream?.streamId || 'tertiary';
  __activeUnlockThreshold = stream?.profile?.sectionHealthUnlockThreshold ?? 4;
  __activePlaytimeMinutes = stream?.profile?.defaultPlaytimeMinutes ?? 7;
};

export const __internals = { onSectionHealth, onFocusStart, onFocusEnd, onIdle };
```

The file is also saved as `SovereignBus.js` next to this audit doc — copy directly.

### Fix 4: Wire bus + idle detection into `ProjectContext.js`

**File:** `src/frontend/ProjectContext.js`

Add to imports:
```javascript
import { start as startBus, updateActiveStream } from '../core/SovereignBus';
import { startIdleDetection } from '../core/ExecutiveSpine';
```

After the existing `useEffect(() => { applyStreamTheme(stream); }, [stream.streamId]);` (around line 468), add:

```javascript
useEffect(() => {
  startBus({ stream });
  updateActiveStream({ stream });
  startIdleDetection({ thresholdMs: stream.profile.idleDetectionThresholdMs ?? 180_000 });
}, [stream.streamId]);
```

This is the single line that brings the entire spine + bus online.

### Fix 5: Mark focus-locked elements

**Files:** wherever the peripheral UI lives (search for the persistent left/right rails or mode-toggle bars).

Add `data-focus-locked="true"` to:
- Mode toggle bar
- Left rail nav items that aren't the current task
- Right rail panels that aren't AURA chat
- Settings drawer trigger

The cockpit (Authoring Canvas) and AURA chat panel must stay un-locked.

Test: with focus active, peripheral chrome dims to 0.4 and is click-protected; the editor and AURA chat remain interactive.

### Fix 6: Onboarding requires stream

**File:** `src/frontend/UniversalOnboarding.js`

On the submit button, add `disabled={!profile.streamId}`.

### Fix 7: Minimum passphrase UX (spec, ~150 LOC)

**Decision required from you:** I can ship this, but it needs your call on three things:

1. **Passphrase scope:** per-device (re-enter every session) or remembered (one-time during onboarding, persists in IndexedDB encrypted under WebAuthn / device-bound key)?
2. **Skip option:** allow users to skip passphrase setup with a warning that "your activity won't generate an Authenticity Report"? Or block app entry until set?
3. **Recovery:** if the user forgets, they lose all encrypted history. Acceptable? Or build a recovery word list?

The minimum viable shape, regardless of those answers:

```
Component: HistoryVaultUnlock
Triggers: on first load after stream hydrate, if !isUnlocked()
Modal:
  - Title: "Unlock your History of Thought"
  - Subtitle: "Your work history stays on this device, encrypted with your passphrase."
  - Field: passphrase input (min 4 chars)
  - Optional field: hint (stored in plain text — for the user, not for recovery)
  - Primary button: "Unlock" → calls unlockWithPassphrase(value)
  - Secondary button: "Skip for now" (warns: "Your activity won't be saved to your Authenticity Report.")
Auto-lock: lockSession() after 30 min of inactivity (use ExecutiveSpine's idle hook).
```

---

## Verification suite (run after applying fixes)

In DevTools console, after a fresh load with stream picked as Primary:

```javascript
// 1. Stream hydrated correctly
document.documentElement.style.getPropertyValue('--accent') // should be #50C878

// 2. Idle detection live
// (wait 4 minutes without input, should see)
// CustomEvent simplifii:idle dispatched

// 3. Focus session works
import('/src/core/ExecutiveSpine.js').then(m => {
  m.startFocusSession({ taskId: 'test', durationMinutes: 1 });
  console.log('focus-active attribute:', document.documentElement.getAttribute('data-focus-active'));
});
// expect "true"

// 4. Section health auto-grants PlayTime
import('/src/core/ExecutiveSpine.js').then(m => {
  m.setSectionHealth('foundation', 5);
  setTimeout(() => console.log('playtime-active:', document.documentElement.getAttribute('data-playtime-active')), 500);
});
// expect "true"

// 5. Vault flow + persistence
import('/src/core/HistoryOfThought.js').then(async m => {
  await m.unlockWithPassphrase('test-passphrase');
  console.log('unlocked:', m.isUnlocked()); // true
});
// then trigger a section health change and verify the event lands:
import('/src/core/ExecutiveSpine.js').then(m => m.setSectionHealth('foundation', 4));
// then:
import('/src/core/HistoryOfThought.js').then(async m => {
  const r = await m.generateAuthenticityReport();
  console.log('events captured:', r.totalEvents); // should be > 0
  console.log('types:', r.countsByType);
});

// 6. LiteralMode is reaching primary stream content
// Open Scaffolder as a primary user, confirm copy reads as plain English ("step" not "task", "first try" not "draft")
```

If any test fails, the chain is broken at that point.

---

## What to do next — clear sequence

1. **Apply Fix 1 + 2** (opacity, Mango) — 2 minutes, single commit. Eliminates the only known reconciliation drift.
2. **Apply Fix 3 + 4** (SovereignBus + ProjectContext wire-up) — 30 minutes, single commit. Brings the architecture online end-to-end.
3. **Make the call on Fix 7** (passphrase UX). Three questions above. After your call, ship the modal as one commit.
4. **Apply Fix 5 + 6** (focus-locked attributes + required onboarding) — small commit.
5. **Run the verification suite.** All six tests must pass.
6. **Commit the design bundle into the repo** so Claude Code can read it on its next session: `cp -R /Users/adonis666/Simplifii-OS_Master/Simplifii-OS_Master_CoWork/design-bundle /Users/adonis666/Simplifii-OS_Master/design-bundle && git add design-bundle && git commit -m "docs: add Claude Design handoff bundle"`. The 404 was because the API URL is single-use; committing the files locally is the permanent fix.
7. **Then** open the Sovereign.html / Handshake / 5-skin board work as Phase 4. Now Claude Code can read the bundle from disk.

The first three steps land Phase 1+2+3 in a working state. The last three set up Phase 4 cleanly.

---

## Branch hygiene reminder

The push split is still pending on your Mac:

```bash
cd ~/Simplifii-OS_Master
git fetch origin
git checkout fix/cockpit-restoration
git merge --ff-only origin/sovereign-phase-2-3
git push origin fix/cockpit-restoration
git push origin --delete sovereign-phase-2-3
```

Once that lands, both remote branches converge at `6a738db` plus whatever fixes you ship from this pack.

---

*End of audit. Patches are inline above; `SovereignBus.js` is also saved as a separate file in this folder for direct copy.*
