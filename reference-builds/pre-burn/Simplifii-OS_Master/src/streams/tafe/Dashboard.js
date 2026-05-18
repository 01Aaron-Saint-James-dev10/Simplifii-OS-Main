import React from 'react';
import { useProject } from '../../frontend/ProjectContext';
import '../homeschool/Dashboard.css';

/**
 * TafeDashboard
 *
 * Skeleton for the TAFE stream. Trade / VET register: competencies,
 * unit-of-competency labels, evidence portfolio. Real rubric data
 * waits on a TAFE-specific schema upload (deferred per the
 * Blueprint, same path BABS1201 took for tertiary).
 *
 * Visual skin from Sovereign.html will land later.
 */

const PLACEHOLDER_COMPS = [
  { code: 'BSBPMG540', title: 'Manage project integration', state: 'active' },
  { code: 'BSBLDR511', title: 'Develop and use emotional intelligence', state: 'next' },
  { code: 'BSBOPS502', title: 'Manage business operational plans', state: 'next' }
];

const readCredits = () => {
  if (typeof window === 'undefined') return 0;
  try { return Number(window.localStorage.getItem('simplifii_spine_sovereign_credits')) || 0; }
  catch { return 0; }
};

export default function TafeDashboard() {
  const { activeCourse, profile, stream } = useProject();
  const briefs = activeCourse?.extractionData?.assessmentBriefs || [];
  const competencies = briefs.length > 0
    ? briefs.slice(0, 6).map((b, i) => ({ code: b.title.split(' ')[0] || `UoC ${i + 1}`, title: b.title, state: i === 0 ? 'active' : 'next' }))
    : PLACEHOLDER_COMPS;
  const credits = readCredits();
  const studentName = (profile?.name || 'Apprentice').trim();

  return (
    <div className="hs-root">
      <header className="hs-head">
        <div>
          <div className="hs-eyebrow"><span className="hs-pip" /> TAFE  ·  Skill lab</div>
          <h1 className="hs-title">G'day, {studentName}.</h1>
          <p className="hs-sub">
            Units of competency, evidence portfolio, on-the-job tasks. {stream.getVocab('rubric') || 'Competency criteria'} pulled from your uploaded brief.
          </p>
        </div>
        <div className="hs-credits">
          <div className="hs-credits-label">SOVEREIGN CREDITS</div>
          <div className="hs-credits-value">{credits.toLocaleString()}</div>
        </div>
      </header>

      {competencies[0] && (
        <div className="hs-next">
          <div className="hs-next-label">CURRENT UNIT  ·  active</div>
          <div className="hs-next-title">{competencies[0].code}  ·  {competencies[0].title}</div>
          <div className="hs-next-meta">
            <span>Evidence required</span>
            <span>Workplace task pending</span>
          </div>
        </div>
      )}

      <section className="hs-roadmap">
        <div className="hs-roadmap-label">UNITS OF COMPETENCY</div>
        <div className="hs-roadmap-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {competencies.map((c, i) => (
            <div className="hs-month" key={i} data-empty={c.state !== 'active'}>
              <div className="hs-month-name">{c.code}</div>
              <div className="hs-month-item">
                <div className="hs-month-item-title">{c.title}</div>
                <div className="hs-month-item-weight">{c.state === 'active' ? 'IN PROGRESS' : 'QUEUED'}</div>
              </div>
            </div>
          ))}
        </div>
        {briefs.length === 0 && (
          <div className="hs-pending">
            <div className="hs-pending-label">PLACEHOLDER UNITS  ·  drop a real training package brief to replace</div>
            <div className="hs-pending-item">A TAFE-specific schema upload will populate real competencies once available.</div>
          </div>
        )}
      </section>

      <footer className="hs-foot">
        <div className="hs-foot-stat"><span>STREAM</span><span>TAFE</span></div>
        <div className="hs-foot-stat"><span>FOCUS</span><span>{stream.profile.defaultFocusSessionMinutes} min</span></div>
        <div className="hs-foot-stat"><span>LITERAL MODE</span><span>{stream.profile.literalModeDefault ? 'ON' : 'OFF'}</span></div>
        <div className="hs-foot-stat"><span>RUBRIC SCHEMA</span><span>Pending upload</span></div>
      </footer>
    </div>
  );
}
