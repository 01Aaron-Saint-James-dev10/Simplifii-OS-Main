import React, { useState } from 'react';
import { Brain, FlaskConical, BookOpen, Layout, ArrowRight } from 'lucide-react';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT, TEXT_LABEL,
  ACCENT_PULSE, ACCENT_GLOW,
  COLOUR_WARN, COLOUR_DANGER,
  BORDER_SHARP, BORDER_RADIUS,
  FONT_SYSTEM,
  ACCENT_FOCUS_STRONG, ACCENT_GLASS_FAINT, ACCENT_GLOW_50,
} from '../theme/tokens';

/**
 * SovereignCell
 *
 * A single high-density Bento card representing one course in the
 * Semester Command Map. Shows academic tier, unit code, course name,
 * UDL health bar, and next assessment. Clicking drills into that
 * course's Authoring Cockpit.
 *
 * Extracted from PillarGallery so it can be unit-tested independently
 * and reused in other views (e.g. a compact list variant).
 *
 * Props:
 *   id       {string}   course key from ProjectContext courses map
 *   course   {object}   course object from ProjectContext courses map
 *   isActive {boolean}  true when this course is the active course
 *   onClick  {Function} (id: string) called on click
 */

// ============================================================
// CSS injected once: cell hover, line-clamp, focus ring
// ============================================================

let cellCSSInjected = false;
function injectCellCSS() {
  if (cellCSSInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = `
.sov-cell {
  display: flex; flex-direction: column; gap: 12px;
  background: ${SURFACE_CARD}; border: 1px solid ${SURFACE_RAISED}; border-radius: ${BORDER_RADIUS}px;
  padding: 14px 14px 12px;
  cursor: pointer; text-align: left; width: 100%;
  transition: border 0.15s, background 0.15s;
  outline: none; min-height: 160px; position: relative;
}
.sov-cell:hover { border-color: ${TEXT_LABEL}; }
.sov-cell:focus-visible { box-shadow: 0 0 0 2px ${ACCENT_FOCUS_STRONG}; }
.sov-cell--active { border-color: ${ACCENT_PULSE}; background: ${ACCENT_GLASS_FAINT}; }
.sov-cell__cta {
  font-family: ${FONT_SYSTEM};
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: ${ACCENT_PULSE}; display: flex; align-items: center; gap: 4px;
  opacity: 0; transition: opacity 0.15s; margin-top: auto;
}
.sov-cell:hover .sov-cell__cta,
.sov-cell--active .sov-cell__cta { opacity: 1; }
.sov-cell__name {
  font-family: ${FONT_SYSTEM};
  font-size: 13px; font-weight: 600; color: ${TEXT_PRIMARY};
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.4;
}
  `.trim();
  document.head.appendChild(el);
  cellCSSInjected = true;
}

// ============================================================
// Section label token (local: not exported. Use TYPE_LABEL from tokens
// for external consumers)
// ============================================================

const ML = {
  fontFamily: FONT_SYSTEM,
  fontSize: 9, fontWeight: 700,
  letterSpacing: '0.15em', textTransform: 'uppercase',
  color: TEXT_LABEL,
};

// ============================================================
// TierChip
// ============================================================

export function TierChip({ tier }) {
  const map = {
    Lab:       { icon: <FlaskConical size={10} />, label: 'Lab' },
    Research:  { icon: <BookOpen size={10} />,     label: 'Research' },
    Practical: { icon: <Layout size={10} />,       label: 'Practical' },
    General:   { icon: <Brain size={10} />,        label: 'General' },
  };
  const t = map[tier] || map.General;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: SURFACE_RAISED, borderRadius: BORDER_RADIUS, padding: '2px 7px',
      ...ML, color: TEXT_FAINT,
    }}>
      {t.icon} {t.label}
    </span>
  );
}

// ============================================================
// UdlBar
// ============================================================

export function UdlBar({ score }) {
  if (score == null) return null;
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={ML}>UDL Score</span>
        <span style={{ ...ML, color: pct >= 70 ? ACCENT_PULSE : pct >= 40 ? COLOUR_WARN : COLOUR_DANGER }}>
          {pct}/100
        </span>
      </div>
      <div style={{ height: 3, background: SURFACE_RAISED, borderRadius: 1, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(to right, ${ACCENT_PULSE}, ${ACCENT_GLOW})`,
          borderRadius: 1, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

// ============================================================
// SovereignCell
// ============================================================

export default function SovereignCell({ id, course, isActive, onClick }) {
  injectCellCSS();

  const tier     = course.extractionData?.academicTier || 'General';
  const unitCode = course.extractionData?.unitCode || id.split('_')[1]?.toUpperCase() || 'UNKN101';
  const udlScore = course.extractionData?.udl3Score ?? course.extractionData?.udlScore ?? null;
  const nextTask = course.roadmap?.currentTask || course.roadmap?.nextAssessment || null;

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`sov-cell${isActive ? ' sov-cell--active' : ''}`}
    >
      {/* Tier chip + active dot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TierChip tier={tier} />
        {isActive && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: ACCENT_PULSE,
            boxShadow: `0 0 6px ${ACCENT_GLOW_50}`,
          }} />
        )}
      </div>

      {/* Course identity */}
      <div>
        <p style={{ ...ML, color: TEXT_FAINT, marginBottom: 3 }}>
          {unitCode}
        </p>
        <p className="sov-cell__name">{course.name || '(unnamed)'}</p>
      </div>

      {/* UDL bar */}
      <UdlBar score={udlScore} />

      {/* Next assessment */}
      {nextTask && (
        <div>
          <p style={{ ...ML, marginBottom: 2 }}>Next</p>
          <p style={{
            fontSize: 11, color: TEXT_MUTED, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.4,
          }}>{nextTask}</p>
        </div>
      )}

      {/* CTA */}
      <div className="sov-cell__cta">
        Open Cockpit <ArrowRight size={10} />
      </div>
    </button>
  );
}
