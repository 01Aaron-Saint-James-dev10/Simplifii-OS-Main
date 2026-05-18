import React, { useMemo } from 'react';
import { useProject } from '../../frontend/ProjectContext';
import '../homeschool/Dashboard.css';

/**
 * PrimaryDashboard
 *
 * Skeleton for the Primary stream (K to 6). Quest-flavoured
 * vocabulary, large pip target areas, AURA-as-Mango companion.
 * The Sovereign.html visual skin lands later; this commit ships
 * the layout + live data wiring.
 */

const READING_BOOSTERS = [
  { id: 'r1', name: 'Reading Champion', xp: 60, target: 100 },
  { id: 'r2', name: 'Story Builder',   xp: 30, target: 80 },
  { id: 'r3', name: 'Word Wizard',     xp: 12, target: 50 }
];

const readCredits = () => {
  if (typeof window === 'undefined') return 0;
  try { return Number(window.localStorage.getItem('simplifii_spine_sovereign_credits')) || 0; }
  catch { return 0; }
};

export default function PrimaryDashboard() {
  const { activeCourse, profile, stream } = useProject();
  const briefs = activeCourse?.extractionData?.assessmentBriefs || [];
  const auraName = stream.getVocab('aura_avatar_name') || 'AURA';
  const studentName = (profile?.name || 'mate').trim();
  const credits = readCredits();
  const nextQuest = briefs[0] || null;

  const quests = useMemo(() => briefs.slice(0, 3).map((b, i) => ({
    id: i,
    title: b.title,
    desc: b.weight ? `${b.weight} of your big task` : 'Your next quest',
    state: i === 0 ? 'active' : 'next'
  })), [briefs]);

  return (
    <div className="hs-root">
      <header className="hs-head">
        <div>
          <div className="hs-eyebrow"><span className="hs-pip" /> PRIMARY  ·  Quest log</div>
          <h1 className="hs-title">G'day, {studentName}!</h1>
          <p className="hs-sub">
            {auraName} is here. Three little quests to play through. Each one is a tiny win.
          </p>
        </div>
        <div className="hs-credits">
          <div className="hs-credits-label">XP TODAY</div>
          <div className="hs-credits-value">{credits.toLocaleString()}</div>
        </div>
      </header>

      {nextQuest && (
        <div className="hs-next">
          <div className="hs-next-label">PLAY NEXT  ·  one quest only</div>
          <div className="hs-next-title">{nextQuest.title}</div>
          <div className="hs-next-meta">
            {nextQuest.weight && <span>{nextQuest.weight}</span>}
            {nextQuest.dueDate && <span>{nextQuest.dueDate}</span>}
          </div>
        </div>
      )}

      <section className="hs-roadmap">
        <div className="hs-roadmap-label">QUEST LOG</div>
        <div className="hs-roadmap-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {quests.length === 0 ? (
            <div className="hs-month" data-empty="true">
              <div className="hs-month-name">No quests yet</div>
              <div className="hs-month-empty">Drop a worksheet or syllabus to get started.</div>
            </div>
          ) : quests.map((q) => (
            <div className="hs-month" key={q.id}>
              <div className="hs-month-name">{q.state === 'active' ? 'PLAYING NOW' : 'UP NEXT'}</div>
              <div className="hs-month-item">
                <div className="hs-month-item-title">{q.title}</div>
                <div className="hs-month-item-weight">{q.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="hs-roadmap">
        <div className="hs-roadmap-label">READING BOOSTERS</div>
        <div className="hs-roadmap-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {READING_BOOSTERS.map((r) => {
            const pct = Math.min(100, Math.round((r.xp / Math.max(1, r.target)) * 100));
            return (
              <div className="hs-month" key={r.id}>
                <div className="hs-month-name">{r.name}</div>
                <div className="hs-month-item">
                  <div className="hs-month-item-title">{pct}% there</div>
                  <div className="hs-month-item-weight">{r.xp} / {r.target} XP</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="hs-foot">
        <div className="hs-foot-stat"><span>STREAM</span><span>Primary</span></div>
        <div className="hs-foot-stat"><span>BUDDY</span><span>{auraName}</span></div>
        <div className="hs-foot-stat"><span>FOCUS</span><span>{stream.profile.defaultFocusSessionMinutes} min</span></div>
        <div className="hs-foot-stat"><span>LITERAL MODE</span><span>{stream.profile.literalModeDefault ? 'ON' : 'OFF'}</span></div>
      </footer>
    </div>
  );
}
