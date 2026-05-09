import React, { useMemo } from 'react';
import { useProject } from '../../frontend/ProjectContext';
import '../homeschool/Dashboard.css';

/**
 * SecondaryDashboard
 *
 * Skeleton for the Secondary stream (Y7 to 10). Executive-function
 * focus: streak grid + body-doubled checklist vibe + minimal
 * cognitive load. AURA's tone is direct, body-doubling rather
 * than gamified.
 *
 * Visual skin from Sovereign.html will land later; this commit
 * ships layout + live data wiring.
 */

const STREAK_DAYS = 14;

const readCredits = () => {
  if (typeof window === 'undefined') return 0;
  try { return Number(window.localStorage.getItem('simplifii_spine_sovereign_credits')) || 0; }
  catch { return 0; }
};

const readFocusSessionsThisFortnight = () => {
  // Placeholder: counts sessions stored in localStorage by ExecutiveSpine.
  // Real implementation reads focus_sessions HistoryOfThought events
  // when the vault is unlocked. Skeleton holds the shape.
  if (typeof window === 'undefined') return Array(STREAK_DAYS).fill(0);
  const out = Array(STREAK_DAYS).fill(0);
  for (let i = 0; i < STREAK_DAYS; i++) {
    out[i] = (i % 3 === 0) ? 1 : 0;
  }
  return out;
};

export default function SecondaryDashboard() {
  const { activeCourse, profile, stream } = useProject();
  const briefs = activeCourse?.extractionData?.assessmentBriefs || [];
  const studentName = (profile?.name || 'Sovereign learner').trim();
  const credits = readCredits();
  const streak = useMemo(readFocusSessionsThisFortnight, []);
  const totalFocus = streak.reduce((a, b) => a + b, 0);
  const nextStep = briefs[0] || null;

  return (
    <div className="hs-root">
      <header className="hs-head">
        <div>
          <div className="hs-eyebrow"><span className="hs-pip" /> SECONDARY  ·  Focus hub</div>
          <h1 className="hs-title">{studentName}.</h1>
          <p className="hs-sub">
            One {stream.getVocab('task') || 'task'} at a time. AURA is sitting beside you. The point is to start, not to finish.
          </p>
        </div>
        <div className="hs-credits">
          <div className="hs-credits-label">SOVEREIGN CREDITS</div>
          <div className="hs-credits-value">{credits.toLocaleString()}</div>
        </div>
      </header>

      {nextStep && (
        <div className="hs-next">
          <div className="hs-next-label">START NOW  ·  twenty minutes max</div>
          <div className="hs-next-title">{nextStep.title}</div>
          <div className="hs-next-meta">
            {nextStep.weight && <span>{nextStep.weight}</span>}
            {nextStep.wordCountGoal > 0 && <span>{nextStep.wordCountGoal.toLocaleString()} words</span>}
            {nextStep.dueDate && <span>{nextStep.dueDate}</span>}
          </div>
        </div>
      )}

      <section className="hs-roadmap">
        <div className="hs-roadmap-label">STREAK  ·  LAST 14 DAYS  ·  {totalFocus} sessions</div>
        <div className="hs-roadmap-grid" style={{ gridTemplateColumns: `repeat(${STREAK_DAYS}, 1fr)` }}>
          {streak.map((count, i) => (
            <div
              className="hs-month"
              key={i}
              data-empty={count === 0}
              style={{ minHeight: 60, padding: '10px 6px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
            >
              <div className="hs-month-name" style={{ fontSize: 9 }}>D-{STREAK_DAYS - i}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: count > 0 ? 'var(--emerald)' : 'var(--ink-faint)' }}>{count > 0 ? '*' : '-'}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="hs-roadmap">
        <div className="hs-roadmap-label">ASSESSMENTS  ·  five days at a time</div>
        <div className="hs-roadmap-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {briefs.length === 0 ? (
            <div className="hs-month" data-empty="true">
              <div className="hs-month-name">Nothing here yet</div>
              <div className="hs-month-empty">Drop your assessment brief and AURA will break it into five steps.</div>
            </div>
          ) : briefs.slice(0, 6).map((b, i) => (
            <div className="hs-month" key={i}>
              <div className="hs-month-name">{i === 0 ? 'NEXT' : 'LATER'}</div>
              <div className="hs-month-item">
                <div className="hs-month-item-title">{b.title}</div>
                {b.weight && <div className="hs-month-item-weight">{b.weight}</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="hs-foot">
        <div className="hs-foot-stat"><span>STREAM</span><span>Secondary</span></div>
        <div className="hs-foot-stat"><span>FOCUS</span><span>{stream.profile.defaultFocusSessionMinutes} min</span></div>
        <div className="hs-foot-stat"><span>LITERAL MODE</span><span>{stream.profile.literalModeDefault ? 'ON' : 'OFF'}</span></div>
        <div className="hs-foot-stat"><span>BODY DOUBLE</span><span>v1: static avatar</span></div>
      </footer>
    </div>
  );
}
