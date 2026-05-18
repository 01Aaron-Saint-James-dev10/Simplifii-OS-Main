/**
 * AuraTagWriter
 *
 * Pure functions. No React dependency. Safe to import from any context.
 *
 * Exports:
 *   computeCognitiveFrictionScore({ userId, emotionalBaseline })
 *     Async. Reads HistoryOfThought event log. Returns integer 0-100.
 *     Falls back to baseline-only score if the vault is locked.
 *
 *   computeAuraTags({ emotionalBaseline, cognitiveFrictionScore, activeTask, profile })
 *     Sync. Returns string[]. Writes toolIntentTags for AURA UI decisions
 *     and affiliate scaffold triggers.
 *
 * Tag registry (consumed by AURA, Scaffolder, and affiliate cards):
 *   burnout_risk        - high friction or burned_out/overwhelmed baseline
 *   micro_task_only     - show one Pareto step, hide the full roadmap
 *   scaffolder_trigger  - surface the Sovereign Scaffolder overlay
 *   high_friction       - mid-range CFS (51-75): surface one extra scaffold
 *   citation_needed     - active task is a literature review or essay
 *   zotero_upsell       - citation_needed + no Zotero linked
 *   gamma_upsell        - burnout_risk or visual mode + no Gamma linked
 *   lit_review_active   - task pattern matches literature review
 *   homeschool_mode     - learner selected Homeschool at onboarding
 *   platform_migration  - specific homeschool platform captured
 *   udl_transform       - full UDL 3.0 layout active (strips default platform UI)
 */

import { listEvents, isUnlocked } from '../core/HistoryOfThought';

// ============================================================
// Constants
// ============================================================

const BASELINE_FRICTION_POINTS = {
  overwhelmed: 20,
  burned_out:  20,
  starting:    10,
  on_top:       0,
};

// Homeschool platforms we support migration from.
// These map to specific ingestion templates in the PDF pipeline.
const KNOWN_PLATFORMS = ['euka', 'khan_academy', 'distance_ed'];

// CFS thresholds
const CFS_CRITICAL  = 76;
const CFS_HIGH      = 51;

// ============================================================
// Cognitive Friction Score
// ============================================================

/**
 * computeCognitiveFrictionScore
 *
 * Four-component score (0-100):
 *   Component 1 (0-40): nudge_triggered density in last 60 min
 *   Component 2 (0-30): task-initiation latency (focus_session_start -> first text_edit)
 *   Component 3 (0-20): emotional baseline modifier
 *   Component 4 (0-10): tier stagnation (no text_edit in last 30 min despite active session)
 *
 * Returns 0 if vault is locked (no events accessible).
 */
export async function computeCognitiveFrictionScore({ userId = 'local', emotionalBaseline = null } = {}) {
  // Component 3 can be computed without the event log.
  const score3 = BASELINE_FRICTION_POINTS[emotionalBaseline] ?? 5;

  // Bail early if vault is locked: return baseline-only estimate.
  if (!isUnlocked()) {
    return Math.round(score3);
  }

  let events = [];
  try {
    events = await listEvents({ user_id: userId, limit: 500 });
  } catch {
    return Math.round(score3);
  }

  if (!events || events.length === 0) {
    return Math.round(score3);
  }

  const now = Date.now();
  const HOUR_MS  = 60 * 60 * 1000;
  const HALF_MS  = 30 * 60 * 1000;

  // Sort ascending by timestamp so we can find "most recent session"
  const sorted = [...events].sort((a, b) =>
    new Date(a.timestamp_iso).getTime() - new Date(b.timestamp_iso).getTime()
  );

  // ---- Component 1: nudge_triggered density (last 60 min) ----
  const nudgesLastHour = sorted.filter(e =>
    e.event_type === 'nudge_triggered' &&
    (now - new Date(e.timestamp_iso).getTime()) <= HOUR_MS
  ).length;
  const score1 = Math.min(nudgesLastHour / 4, 1.0) * 40;

  // ---- Component 2: task-initiation latency ----
  // Find the most recent focus_session_start, then the first text_edit after it.
  let score2 = 30; // default: worst case (no session or no edit found)
  const sessionStarts = sorted.filter(e => e.event_type === 'focus_session_start');
  if (sessionStarts.length > 0) {
    const lastStart = sessionStarts[sessionStarts.length - 1];
    const startTs = new Date(lastStart.timestamp_iso).getTime();
    const firstEditAfter = sorted.find(e =>
      e.event_type === 'text_edit' &&
      new Date(e.timestamp_iso).getTime() > startTs
    );
    if (firstEditAfter) {
      const latencyMs = new Date(firstEditAfter.timestamp_iso).getTime() - startTs;
      const latencyMin = latencyMs / 60_000;
      score2 = Math.min(latencyMin / 20, 1.0) * 30;
    }
  }

  // ---- Component 4: tier stagnation (last 30 min) ----
  // No text_edit events in last 30 min despite a focus session being open.
  const hasOpenSession = sorted.some(e =>
    e.event_type === 'focus_session_start' &&
    (now - new Date(e.timestamp_iso).getTime()) <= HALF_MS
  );
  const hasRecentEdit = sorted.some(e =>
    e.event_type === 'text_edit' &&
    (now - new Date(e.timestamp_iso).getTime()) <= HALF_MS
  );
  const score4 = (hasOpenSession && !hasRecentEdit) ? 10 : 0;

  const raw = score1 + score2 + score3 + score4;
  return Math.round(Math.min(raw, 100));
}

// ============================================================
// AURA Tag-Writer
// ============================================================

/**
 * computeAuraTags
 *
 * Sync. Takes the computed friction score and profile context,
 * returns a deduplicated string[] of AURA action tags.
 *
 * Downstream consumers:
 *   - AURA: reads 'micro_task_only' to suppress the full roadmap
 *   - Scaffolder: activates on 'scaffolder_trigger'
 *   - Affiliate cards: surface Gamma.ai on 'gamma_upsell'
 *   - UDL transform layer: activates on 'udl_transform'
 */
export function computeAuraTags({
  emotionalBaseline = null,
  cognitiveFrictionScore = 0,
  activeTask = null,
  profile = {}
} = {}) {
  const tags = new Set();

  // ---- Baseline risk tags ----
  if (emotionalBaseline === 'burned_out' || emotionalBaseline === 'overwhelmed') {
    tags.add('burnout_risk');
    tags.add('micro_task_only');
  }

  // ---- Friction score tags ----
  if (cognitiveFrictionScore >= CFS_CRITICAL) {
    tags.add('burnout_risk');
    tags.add('scaffolder_trigger');
    tags.add('micro_task_only');
  } else if (cognitiveFrictionScore >= CFS_HIGH) {
    tags.add('high_friction');
    tags.add('scaffolder_trigger');
  }

  // ---- Task-context tags ----
  const taskLabel = (activeTask?.task || '').toLowerCase();
  if (/lit(erature)?\s*review|essay|report|critique/i.test(taskLabel)) {
    tags.add('lit_review_active');
    tags.add('citation_needed');
  }

  // ---- Upsell tags (affiliate triggers) ----
  // Zotero: surface when citation work is active and Zotero is not linked.
  if (tags.has('citation_needed') && !profile.integrations?.zotero) {
    tags.add('zotero_upsell');
  }
  // Gamma.ai: surface when the learner is burned out, overwhelmed, or in
  // visual scaffolding mode and has not yet linked Gamma.
  // TODO: wire 'gamma_linked' flag once the Gamma.ai affiliate link is set.
  if (
    (tags.has('burnout_risk') || profile.preferredMode === 'visual') &&
    !profile.integrations?.gamma
  ) {
    tags.add('gamma_upsell');
  }

  // ---- Homeschool migration tags ----
  if (profile.level === 'Homeschool') {
    tags.add('homeschool_mode');
    tags.add('udl_transform'); // strips default platform mascots, activates UDL 3.0 layout
    if (profile.homeschoolPlatform && KNOWN_PLATFORMS.includes(
      (profile.homeschoolPlatform || '').toLowerCase().replace(/\s/g, '_')
    )) {
      tags.add('platform_migration'); // tells ingestion hook to use migration templates
    }
  }

  return Array.from(tags);
}
