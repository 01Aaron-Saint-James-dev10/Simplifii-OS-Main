import React, { useState } from 'react';
import {
  ACCENT_PULSE,
  ACCENT_GLOW,
  SURFACE_RAISED,
  SURFACE_CARD,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  BORDER_RADIUS,
  FONT_SYSTEM,
} from '../../theme/tokens';

/**
 * TaskPhaseBar
 *
 * Horizontal 5-phase progress bar rendered at the top of the canvas.
 * Each chip shows the phase label and estimated time. The current phase
 * is highlighted. Completed phases are dimmed. Locked phases are grey.
 * Clicking an unlocked phase calls onSelectPhase(phaseId).
 * Pressing Enter or Space on a focused chip does the same.
 *
 * Props:
 *   phases          - array of phase objects from taskSequence.phases
 *   currentPhaseId  - string: ID of the active phase
 *   onSelectPhase   - callback(phaseId: string)
 */
export default function TaskPhaseBar({ phases = [], currentPhaseId, onSelectPhase }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!phases || phases.length === 0) return null;

  const currentIndex = phases.findIndex(p => p.id === currentPhaseId);

  const getPhaseStatus = (phase, index) => {
    if (index < currentIndex) return 'complete';
    if (phase.id === currentPhaseId) return 'active';
    return 'locked';
  };

  const handleSelect = (phase, index) => {
    const status = getPhaseStatus(phase, index);
    if (status === 'locked') return;
    if (expandedId === phase.id) {
      setExpandedId(null);
    } else {
      setExpandedId(phase.id);
      if (onSelectPhase) onSelectPhase(phase.id);
    }
  };

  const handleKeyDown = (e, phase, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(phase, index);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Phase chips row */}
      <div
        role="tablist"
        aria-label="Assessment phases"
        style={{
          display: 'flex',
          gap: 4,
          padding: '6px 0',
        }}
      >
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase, index);
          const isActive = status === 'active';
          const isComplete = status === 'complete';
          const isLocked = status === 'locked';
          const isExpanded = expandedId === phase.id;

          const chipBg = isActive
            ? `linear-gradient(135deg, ${ACCENT_PULSE}, ${ACCENT_GLOW})`
            : isComplete
            ? SURFACE_RAISED
            : SURFACE_CARD;

          const textColor = isActive
            ? '#09090b'
            : isComplete
            ? TEXT_MUTED
            : isLocked
            ? TEXT_FAINT
            : TEXT_PRIMARY;

          return (
            <div
              key={phase.id}
              role="tab"
              tabIndex={isLocked ? -1 : 0}
              aria-selected={isActive}
              aria-disabled={isLocked}
              aria-expanded={isExpanded}
              aria-label={`${phase.label}, ${phase.estimatedMinutes} minutes${isComplete ? ', complete' : isActive ? ', current phase' : ', locked'}`}
              onClick={() => handleSelect(phase, index)}
              onKeyDown={(e) => handleKeyDown(e, phase, index)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '5px 4px',
                borderRadius: BORDER_RADIUS || 6,
                background: chipBg,
                border: isActive
                  ? `1px solid ${ACCENT_PULSE}`
                  : `1px solid transparent`,
                cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? 0.45 : 1,
                transition: 'opacity 0.15s',
                outline: 'none',
                minWidth: 0,
                userSelect: 'none',
              }}
              onFocus={(e) => {
                if (!isLocked) e.currentTarget.style.outline = `2px solid #f4f4f5`;
              }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
            >
              {/* Phase step number */}
              <span
                aria-hidden="true"
                style={{
                  fontFamily: FONT_SYSTEM,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: isActive ? '#09090b' : TEXT_FAINT,
                  lineHeight: 1,
                }}
              >
                {isComplete ? '\u2713' : String(index + 1)}
              </span>

              {/* Phase label */}
              <span
                style={{
                  fontFamily: FONT_SYSTEM,
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: textColor,
                  lineHeight: 1.2,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {phase.label}
              </span>

              {/* Estimated minutes */}
              <span
                style={{
                  fontFamily: FONT_SYSTEM,
                  fontSize: 9,
                  color: isActive ? '#09090b' : TEXT_FAINT,
                  lineHeight: 1,
                }}
              >
                {phase.estimatedMinutes}m
              </span>
            </div>
          );
        })}
      </div>

      {/* Expanded phase instruction */}
      {expandedId && (() => {
        const phase = phases.find(p => p.id === expandedId);
        if (!phase) return null;
        const status = getPhaseStatus(phase, phases.findIndex(p => p.id === expandedId));
        return (
          <div
            role="region"
            aria-label={`${phase.label} details`}
            style={{
              marginTop: 4,
              padding: '10px 12px',
              background: SURFACE_CARD,
              borderRadius: BORDER_RADIUS || 6,
              borderLeft: `3px solid ${status === 'active' ? ACCENT_PULSE : SURFACE_RAISED}`,
            }}
          >
            <p style={{
              fontFamily: FONT_SYSTEM,
              fontSize: 11,
              color: TEXT_PRIMARY,
              margin: '0 0 4px 0',
              lineHeight: 1.5,
            }}>
              {phase.instruction}
            </p>
            <p style={{
              fontFamily: FONT_SYSTEM,
              fontSize: 10,
              color: TEXT_MUTED,
              margin: 0,
              lineHeight: 1.4,
            }}>
              {phase.whyThisPhase}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
