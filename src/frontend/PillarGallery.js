import React, { useState } from 'react';
import { Brain, FlaskConical, BookOpen, Layout, Plus, ArrowRight } from 'lucide-react';

/**
 * PillarGallery: Semester Command Map
 *
 * Obsidian Bento Grid. Every course in the active semester is visible as a
 * high-density SovereignCell showing UDL health, next deadline, and tier.
 * Clicking a cell drills into that course's Authoring Cockpit.
 *
 * No cap on course count. All courses are shown.
 *
 * Props:
 *   courses        {Object}   keyed course map from ProjectContext
 *   activeCourseId {string}   currently selected course id
 *   onSelect       {Function} (id) called when a cell is clicked
 *   onAddCourse    {Function} called when the add tile is clicked
 */

// ============================================================
// Injected CSS: card hover, line-clamp, focus ring
// ============================================================

let galleryCSSInjected = false;
function injectGalleryCSS() {
  if (galleryCSSInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = `
.sov-cell {
  display: flex; flex-direction: column; gap: 12px;
  background: #18181b; border: 1px solid #27272a; border-radius: 3px;
  padding: 14px 14px 12px;
  cursor: pointer; text-align: left; width: 100%;
  transition: border 0.15s, background 0.15s;
  outline: none; min-height: 160px; position: relative;
}
.sov-cell:hover { border-color: #3f3f46; }
.sov-cell:focus-visible { box-shadow: 0 0 0 2px rgba(16,185,129,0.35); }
.sov-cell--active { border-color: #10b981; background: rgba(16,185,129,0.03); }
.sov-cell__cta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: #10b981; display: flex; align-items: center; gap: 4px;
  opacity: 0; transition: opacity 0.15s; margin-top: auto;
}
.sov-cell:hover .sov-cell__cta,
.sov-cell--active .sov-cell__cta { opacity: 1; }
.sov-cell__name {
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600; color: #e4e4e7;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.4;
}
.sov-add-tile {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  background: #09090b; border: 1px dashed #27272a; border-radius: 3px;
  padding: 20px 14px; cursor: pointer; min-height: 160px;
  transition: border 0.15s;
  outline: none;
}
.sov-add-tile:hover { border-color: rgba(16,185,129,0.3); }
.sov-add-tile:focus-visible { box-shadow: 0 0 0 2px rgba(16,185,129,0.35); }
  `.trim();
  document.head.appendChild(el);
  galleryCSSInjected = true;
}

// ============================================================
// Section label token
// ============================================================

const ML = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9, fontWeight: 700,
  letterSpacing: '0.15em', textTransform: 'uppercase',
  color: '#3f3f46',
};

// ============================================================
// Tier icon helper
// ============================================================

function TierChip({ tier }) {
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
      background: '#27272a', borderRadius: 3, padding: '2px 7px',
      ...ML, color: '#52525b',
    }}>
      {t.icon} {t.label}
    </span>
  );
}

// ============================================================
// UDL progress bar
// ============================================================

function UdlBar({ score }) {
  if (score == null) return null;
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={ML}>UDL Score</span>
        <span style={{ ...ML, color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#f43f5e' }}>
          {pct}/100
        </span>
      </div>
      <div style={{ height: 3, background: '#27272a', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(to right, #10b981, #34d399)',
          borderRadius: 1, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

// ============================================================
// SovereignCell
// ============================================================

function SovereignCell({ id, course, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);

  const tier = course.extractionData?.academicTier || 'General';
  const unitCode = course.extractionData?.unitCode || id.split('_')[1]?.toUpperCase() || 'UNKN101';
  const udlScore = course.extractionData?.udl3Score ?? course.extractionData?.udlScore ?? null;
  const nextTask = course.roadmap?.currentTask || course.roadmap?.nextAssessment || null;

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`sov-cell${isActive ? ' sov-cell--active' : ''}`}
    >
      {/* Tier chip + active dot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TierChip tier={tier} />
        {isActive && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 6px rgba(16,185,129,0.5)',
          }} />
        )}
      </div>

      {/* Course identity */}
      <div>
        <p style={{ ...ML, color: '#52525b', marginBottom: 3, letterSpacing: '0.15em' }}>
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
            fontSize: 11, color: '#71717a', margin: 0,
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

// ============================================================
// AddTile
// ============================================================

function AddTile({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sov-add-tile"
      aria-label="Add a new course"
    >
      <div style={{
        width: 28, height: 28, borderRadius: 3,
        background: '#27272a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Plus size={16} color="#52525b" />
      </div>
      <span style={{ ...ML, color: '#3f3f46' }}>Add Course</span>
      <span style={{
        fontSize: 10, color: '#27272a',
        fontFamily: "'JetBrains Mono', monospace",
        textAlign: 'center', lineHeight: 1.5,
      }}>
        Drop a syllabus to unlock
      </span>
    </button>
  );
}

// ============================================================
// PillarGallery
// ============================================================

export default function PillarGallery({ courses, activeCourseId, onSelect, onAddCourse }) {
  injectGalleryCSS();

  const entries = Object.entries(courses);
  const total = entries.length;

  return (
    <div style={{
      flex: 1, background: '#09090b',
      overflowY: 'auto', padding: '28px 24px',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <p style={{ ...ML, marginBottom: 4 }}>Semester Command Map</p>
          <p style={{
            fontSize: 11, color: '#52525b',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {total} {total === 1 ? 'course' : 'courses'} loaded
          </p>
        </div>
        <button
          type="button"
          onClick={onAddCourse}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            background: 'none', color: '#10b981',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 3, padding: '5px 10px',
            cursor: 'pointer', transition: 'border 0.15s',
          }}
        >
          <Plus size={11} /> Add Course
        </button>
      </header>

      {/* Bento grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 12,
      }}>
        {entries.map(([id, course]) => (
          <SovereignCell
            key={id}
            id={id}
            course={course}
            isActive={id === activeCourseId}
            onClick={onSelect}
          />
        ))}
        <AddTile onClick={onAddCourse} />
      </div>
    </div>
  );
}
