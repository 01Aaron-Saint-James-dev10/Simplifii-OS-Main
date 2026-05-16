import React from 'react';
import { determinePhase, PHASE_LABELS } from '../../core/TaskLifecycleManager';
import { ACCENT_PULSE, SURFACE_RAISED } from '../../theme/tokens';

/**
 * PhaseIndicator
 *
 * 7-segment horizontal progress bar showing which lifecycle phase a task is in.
 * Renders below the course name on Pillar/CourseCard.
 *
 * Props:
 *   course - course object from ProjectContext
 */
export default function PhaseIndicator({ course }) {
  const phase = determinePhase(course);

  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 6, height: 3 }} title={PHASE_LABELS[phase]}>
      {[1, 2, 3, 4, 5, 6, 7].map(p => (
        <div
          key={p}
          style={{
            flex: 1,
            borderRadius: 1,
            background: p <= phase ? ACCENT_PULSE : SURFACE_RAISED,
            opacity: p === phase ? 1 : p < phase ? 0.6 : 0.3,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
