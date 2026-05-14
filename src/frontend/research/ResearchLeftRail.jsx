/**
 * ResearchLeftRail.jsx
 *
 * Collapsible Phase > Strand > Chapter project tree for the Bowser-OS dashboard.
 * Shows corpus count, unverified source count, and authenticity receipt score.
 *
 * Props:
 *   phases           - Phase[]
 *   strands          - Strand[]
 *   chapters         - Chapter[]
 *   corpusCount      - number (total sources)
 *   unverifiedCount  - number
 *   receiptScore     - number (0-100) or null
 *   activeChapterId  - string | null
 *   onSelectChapter  - callback(chapter)
 */

import React, { useState } from 'react';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  COLOUR_WARN,
} from '../../theme/tokens';

const STATUS_DOT = {
  not_started: '#3f3f46',
  drafting:    '#f59e0b',
  revising:    '#3b82f6',
  reviewed:    '#8b5cf6',
  complete:    '#10b981',
};

export default function ResearchLeftRail({
  phases, strands, chapters,
  corpusCount, unverifiedCount, receiptScore,
  activeChapterId, onSelectChapter,
}) {
  const [expanded, setExpanded] = useState(() => {
    const m = {};
    (phases || []).forEach(p => { m[p.phaseId] = p.status === 'active'; });
    return m;
  });
  const [strandExpanded, setStrandExpanded] = useState(() => {
    const m = {};
    (strands || []).forEach(s => { m[s.strandId] = true; });
    return m;
  });

  function togglePhase(id) { setExpanded(prev => ({ ...prev, [id]: !prev[id] })); }
  function toggleStrand(id) { setStrandExpanded(prev => ({ ...prev, [id]: !prev[id] })); }

  function getStrandsForPhase(phaseId) {
    return (strands || []).filter(s => s.phaseId === phaseId);
  }
  function getChaptersForStrand(strandId) {
    return (chapters || []).filter(c => c.strandId === strandId);
  }
  function getCrossStrandChapters(phaseId) {
    return (chapters || []).filter(c => c.phaseId === phaseId && !c.strandId);
  }

  return (
    <div style={{ width: 220, flexShrink: 0, background: SURFACE_CARD, borderRight: `1px solid ${SURFACE_RAISED}`, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_FAINT, padding: '0 14px', marginBottom: 8 }}>
          Project
        </p>

        {(phases || []).map(phase => {
          const isActive = phase.status === 'active';
          const phaseStrands = getStrandsForPhase(phase.phaseId);
          const crossChapters = getCrossStrandChapters(phase.phaseId);
          const open = expanded[phase.phaseId];

          return (
            <div key={phase.phaseId}>
              <button
                type="button"
                onClick={() => isActive && togglePhase(phase.phaseId)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  background: 'transparent',
                  border: 'none',
                  cursor: isActive ? 'pointer' : 'default',
                  textAlign: 'left',
                }}
                aria-expanded={open}
              >
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, flexShrink: 0 }}>
                  {isActive ? (open ? '▼' : '▶') : '▷'}
                </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: isActive ? TEXT_PRIMARY : TEXT_FAINT, fontWeight: isActive ? 600 : 400, lineHeight: 1.3 }}>
                  {phase.title}
                </span>
              </button>

              {open && isActive && (
                <div style={{ paddingLeft: 14 }}>
                  {phaseStrands.map(strand => {
                    const strandChapters = getChaptersForStrand(strand.strandId);
                    const sOpen = strandExpanded[strand.strandId];
                    return (
                      <div key={strand.strandId}>
                        <button
                          type="button"
                          onClick={() => toggleStrand(strand.strandId)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0 4px 10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                          aria-expanded={sOpen}
                        >
                          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE, flexShrink: 0 }}>
                            {sOpen ? '▼' : '▶'}
                          </span>
                          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: ACCENT_PULSE, fontWeight: 600, lineHeight: 1.3 }}>
                            {strand.title.replace(/^Strand \d+:\s*/, '')}
                          </span>
                        </button>
                        {sOpen && strandChapters.map(ch => (
                          <ChapterRow key={ch.chapterId} chapter={ch} active={ch.chapterId === activeChapterId} onSelect={() => onSelectChapter?.(ch)} />
                        ))}
                      </div>
                    );
                  })}
                  {crossChapters.map(ch => (
                    <ChapterRow key={ch.chapterId} chapter={ch} active={ch.chapterId === activeChapterId} onSelect={() => onSelectChapter?.(ch)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Corpus and receipt indicators */}
      <div style={{ borderTop: `1px solid ${SURFACE_RAISED}`, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT }}>Corpus</span>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: unverifiedCount > 0 ? COLOUR_WARN : TEXT_MUTED }}>
            {corpusCount} sources{unverifiedCount > 0 ? ` • ${unverifiedCount} unverified` : ''}
          </span>
        </div>
        {receiptScore !== null && receiptScore !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT }}>Receipt</span>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: ACCENT_PULSE }}>{receiptScore}% auth.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ChapterRow({ chapter, active, onSelect }) {
  const dotCol = STATUS_DOT[chapter.status] || STATUS_DOT.not_started;
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 0 4px 20px',
        background: active ? ACCENT_GLASS : 'transparent',
        border: active ? `1px solid ${ACCENT_BORDER}` : '1px solid transparent',
        borderRadius: BORDER_RADIUS,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotCol, flexShrink: 0 }} aria-hidden="true" />
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: active ? ACCENT_PULSE : TEXT_MUTED, lineHeight: 1.3 }}>
        {chapter.number ? `Ch ${chapter.number}` : ''} {chapter.title.replace(/^Chapter \d+:\s*/i, '')}
      </span>
    </button>
  );
}
