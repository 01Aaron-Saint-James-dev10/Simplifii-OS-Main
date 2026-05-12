import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import SovereignCell from './SovereignCell';
import {
  SURFACE_BASE, SURFACE_RAISED,
  TEXT_LABEL, TEXT_FAINT,
  ACCENT_PULSE,
  BORDER_RADIUS,
  FONT_SYSTEM,
} from '../theme/tokens';
import { SOVEREIGN_DATA_READY } from '../core/Events';

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
// CSS injected once: add-tile hover + focus ring
// ============================================================

let galleryCSSInjected = false;
function injectGalleryCSS() {
  if (galleryCSSInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = `
.sov-add-tile {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  background: ${SURFACE_BASE}; border: 1px dashed ${SURFACE_RAISED}; border-radius: ${BORDER_RADIUS}px;
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
  fontFamily: FONT_SYSTEM,
  fontSize: 9, fontWeight: 700,
  letterSpacing: '0.15em', textTransform: 'uppercase',
  color: TEXT_LABEL,
};

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
        width: 28, height: 28, borderRadius: BORDER_RADIUS,
        background: SURFACE_RAISED,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Plus size={16} color={TEXT_FAINT} />
      </div>
      <span style={{ ...ML, color: TEXT_LABEL }}>Add Course</span>
      <span style={{
        fontSize: 10, color: SURFACE_RAISED,
        fontFamily: FONT_SYSTEM,
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

  // Re-render when extraction upgrades a course in the background.
  // Forward-compatible: when courses move to IndexedDB this handler will
  // re-read from the store. For now it forces a prop re-evaluation.
  const [, setRefreshTick] = useState(0);
  useEffect(() => {
    const handler = () => setRefreshTick(t => t + 1);
    window.addEventListener(SOVEREIGN_DATA_READY, handler);
    return () => window.removeEventListener(SOVEREIGN_DATA_READY, handler);
  }, []);

  const entries = Object.entries(courses);
  const total = entries.length;

  return (
    <div style={{
      flex: 1, background: SURFACE_BASE,
      overflowY: 'auto', padding: '28px 24px',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <p style={{ ...ML, marginBottom: 4 }}>Semester Command Map</p>
          <p style={{
            fontSize: 11, color: TEXT_FAINT,
            fontFamily: FONT_SYSTEM,
          }}>
            {total} {total === 1 ? 'course' : 'courses'} loaded
          </p>
        </div>
        <button
          type="button"
          onClick={onAddCourse}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: FONT_SYSTEM,
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            background: 'none', color: ACCENT_PULSE,
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: BORDER_RADIUS, padding: '5px 10px',
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
