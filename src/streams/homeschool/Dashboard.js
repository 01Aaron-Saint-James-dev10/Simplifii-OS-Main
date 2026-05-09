import React, { useMemo } from 'react';
import { useProject } from '../../frontend/ProjectContext';

/**
 * HomeschoolDashboard
 *
 * Skeleton per the Sovereign Handoff doc step 5. Renders the visual
 * shape of the Homeschooling self-paced dashboard:
 *   - Year-level header with progress strip
 *   - Six-month roadmap (Jan-Jun) with milestone tiles
 *   - 'Next Step' badge that surfaces the very next micro-task
 *   - Sovereign Credits balance
 *
 * What this skeleton DOES today:
 *   - Renders from real activeCourse data (assessment briefs, name)
 *   - Reads stream vocab so labels say 'project' / 'topic' instead of
 *     'assignment' / 'course'
 *   - Reads SovereignCredits from ExecutiveSpine
 *   - Listens for live focus session state via the data attribute
 *
 * What this skeleton DEFERS (Blueprint out-of-scope for v1):
 *   - Real Australian Curriculum (ACARA) outcome mapping
 *   - Per-month ACARA standards alignment
 *   - Term/semester scheduling synced to the AU school calendar
 *
 * The visual skin will land when the Sovereign.html design URL
 * resolves; this file holds the layout + data wiring so the visual
 * pass is purely CSS work, not data plumbing.
 */

import './Dashboard.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const monthIndexFromDate = (dateStr) => {
  if (!dateStr) return -1;
  const lower = String(dateStr).toLowerCase();
  for (let i = 0; i < MONTHS.length; i++) {
    if (lower.includes(MONTHS[i].toLowerCase())) return i;
  }
  // Try ISO-ish date (e.g. '2026-03-15')
  const m = lower.match(/(\d{4})-(\d{2})/);
  if (m) {
    const month = parseInt(m[2], 10) - 1;
    if (month >= 0 && month < 6) return month;
  }
  return -1;
};

const readCredits = () => {
  if (typeof window === 'undefined') return 0;
  try { return Number(window.localStorage.getItem('simplifii_spine_sovereign_credits')) || 0; }
  catch { return 0; }
};

export default function HomeschoolDashboard() {
  const { activeCourse, profile, stream } = useProject();
  const briefs = activeCourse?.extractionData?.assessmentBriefs || [];
  const courseName = activeCourse?.name || stream.getVocab('course') || 'Topic';
  const lit = (key, fallback) => stream.getVocab(key) || fallback;

  // Bin briefs into the six-month roadmap by parsed dueDate. Briefs
  // without a parseable month go into a 'pending' bucket rendered at
  // the bottom.
  const calendar = useMemo(() => {
    const months = MONTHS.map((m) => ({ name: m, items: [] }));
    const pending = [];
    for (const b of briefs) {
      const idx = monthIndexFromDate(b.dueDate);
      if (idx >= 0 && idx < months.length) months[idx].items.push(b);
      else pending.push(b);
    }
    return { months, pending };
  }, [briefs]);

  const nextStep = briefs[0] || null;
  const credits = readCredits();
  const studentName = (profile?.name || 'Sovereign learner').trim();

  return (
    <div className="hs-root">
      <header className="hs-head">
        <div>
          <div className="hs-eyebrow"><span className="hs-pip" /> HOMESCHOOL · {courseName.toUpperCase()}</div>
          <h1 className="hs-title">G'day, {studentName}.</h1>
          <p className="hs-sub">Your self-paced {lit('course', 'topic')} for {courseName}. One {lit('task', 'step')} at a time. No marker over your shoulder.</p>
        </div>
        <div className="hs-credits">
          <div className="hs-credits-label">SOVEREIGN CREDITS</div>
          <div className="hs-credits-value">{credits.toLocaleString()}</div>
        </div>
      </header>

      {nextStep && (
        <div className="hs-next">
          <div className="hs-next-label">NEXT STEP · only this</div>
          <div className="hs-next-title">{nextStep.title}</div>
          <div className="hs-next-meta">
            {nextStep.weight && <span>{nextStep.weight}</span>}
            {nextStep.wordCountGoal > 0 && <span>{nextStep.wordCountGoal.toLocaleString()} words</span>}
            {nextStep.dueDate && <span>{nextStep.dueDate}</span>}
          </div>
        </div>
      )}

      <section className="hs-roadmap">
        <div className="hs-roadmap-label">SEMESTER ROADMAP · JAN to JUN</div>
        <div className="hs-roadmap-grid">
          {calendar.months.map((m) => (
            <div className="hs-month" key={m.name} data-empty={m.items.length === 0}>
              <div className="hs-month-name">{m.name}</div>
              {m.items.length === 0 ? (
                <div className="hs-month-empty">No {lit('pillar', 'task')} yet</div>
              ) : m.items.map((it, i) => (
                <div className="hs-month-item" key={i}>
                  <div className="hs-month-item-title">{it.title}</div>
                  {it.weight && <div className="hs-month-item-weight">{it.weight}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
        {calendar.pending.length > 0 && (
          <div className="hs-pending">
            <div className="hs-pending-label">UNSCHEDULED · awaiting due date</div>
            {calendar.pending.map((it, i) => (
              <div className="hs-pending-item" key={i}>{it.title}{it.weight ? `  ·  ${it.weight}` : ''}</div>
            ))}
          </div>
        )}
      </section>

      <footer className="hs-foot">
        <div className="hs-foot-stat"><span>STREAM</span><span>{stream.profile.displayName}</span></div>
        <div className="hs-foot-stat"><span>FOCUS</span><span>{stream.profile.defaultFocusSessionMinutes} min default</span></div>
        <div className="hs-foot-stat"><span>LITERAL MODE</span><span>{stream.profile.literalModeDefault ? 'ON' : 'OFF'}</span></div>
        <div className="hs-foot-stat"><span>ACARA MAPPING</span><span>Pending</span></div>
      </footer>
    </div>
  );
}
