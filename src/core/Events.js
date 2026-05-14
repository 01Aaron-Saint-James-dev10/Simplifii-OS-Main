/**
 * Events.js
 *
 * Single source of truth for all CustomEvent name constants in Simplifii-OS.
 * Import these constants wherever an event is dispatched or listened for.
 * Never hard-code event name strings across files.
 *
 * Usage:
 *   import { SOVEREIGN_DATA_READY } from '../core/Events';
 *   window.dispatchEvent(new CustomEvent(SOVEREIGN_DATA_READY, { detail: { courseId } }));
 *   window.addEventListener(SOVEREIGN_DATA_READY, handler);
 */

// ============================================================
// Ingestion pipeline events
// ============================================================

/** Fired by useIngestion when a course has been fully parsed and added to
 *  ProjectContext. Payload: { courseId: string, extractionData: object }
 */
export const SOVEREIGN_DATA_READY = 'sovereign-data-ready';

/** Fired when Ollama extraction completes and upgrades a shadow-state course.
 *  Payload: { courseId: string }
 */
export const INGEST_COMPLETE = 'ingest-complete';

/** Fired when a raw text snapshot is written to localStorage for AuraHUD.
 *  No payload required.
 */
export const RAW_TEXT_READY = 'raw-text-ready';

// ============================================================
// Sovereign Format (.sm) events
// ============================================================

/** Fired when AuraHUD completes a .sm conversion and writes the result to
 *  localStorage. Triggers MasterDashboard to switch to SmViewer.
 *  No payload required; consumer reads 'simplifii_last_sm' from localStorage.
 */
export const SM_READY = 'sm-ready';

// ============================================================
// Reasoning / streaming events (already used by RewriteService)
// ============================================================

/** Fired when Ollama begins a reasoning chain. Used by AuraHUD to show the
 *  thinking indicator. Re-exported here so all consumers use one import path.
 *  (Canonical definition remains in RewriteService.js; keep in sync.)
 */
export const REASONING_START = 'reasoning-start';

/** Fired when Ollama finishes a reasoning chain. */
export const REASONING_END = 'reasoning-end';

// ============================================================
// UI lifecycle events
// ============================================================

/** Fired by DashboardNav or keyboard shortcut to open the accessibility panel. */
export const TOGGLE_ACCESSIBILITY = 'toggle-accessibility';

/** Fired when the learner exits Zen Mode, triggering the metacognitive reflection. */
export const ZEN_MODE_EXIT = 'zen-mode-exit';

/** Fired by MessagingHub when a system voice message is dispatched. */
export const SYSTEM_VOICE_MESSAGE = 'system-voice-message';

// ============================================================
// History of Thought / Authenticity Report events
// ============================================================

/** Fired on every tier transition (Tier 1 -> 2 -> 3) to feed HistoryOfThought.
 *  Payload: { from: 1|2|3, to: 1|2|3, blockId: string, timestamp: number }
 */
export const TIER_TRANSITION = 'tier-transition';

/** Fired when a focus session starts. */
export const FOCUS_SESSION_START = 'focus-session-start';

/** Fired when a focus session ends (manual or idle timeout). */
export const FOCUS_SESSION_END = 'focus-session-end';

// ============================================================
// Sprint 3: Citation Integrity Engine events
// ============================================================

/** Fired when a citation is inserted into the editor.
 *  Payload: { sourceId, citationKey, style, projectId }
 */
export const CITATION_INSERTED = 'citation-inserted';

/** Fired when a source is marked as verified by the user.
 *  Payload: { sourceId, citationKey, projectId }
 */
export const CITATION_VERIFIED = 'citation-verified';

/** Fired when a new source is added to the corpus.
 *  Payload: { sourceId, citationKey, projectId, verified: false }
 */
export const SOURCE_ADDED = 'source-added';

/** Fired when the hallucination scanner detects a citation that is not
 *  in the corpus or is unverified. Payload: { author, year, projectId }
 */
export const HALLUCINATION_FLAGGED = 'hallucination-flagged';
