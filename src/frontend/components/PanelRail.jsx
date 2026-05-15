import React from 'react';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  FONT_SYSTEM,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * PanelRail
 *
 * Right vertical rail. 5 panel tabs: Brief, Tutor, Preview, Sources, Check.
 * Click expands panel to ~360px overlay. Only one panel open at a time.
 *
 * Props:
 *   activePanel    - string | null ('brief'|'tutor'|'preview'|'sources'|'check')
 *   onSelectPanel  - callback(panelId | null)
 *   panelContent   - React node (the active panel component)
 */

const PANELS = [
  { id: 'brief',      icon: 'B', label: 'Brief', tip: 'Brief: extracted assessment criteria' },
  { id: 'tutor',      icon: 'T', label: 'Tutor', tip: 'Tutor: Socratic AI, asks questions' },
  { id: 'preview',    icon: 'P', label: 'Preview', tip: 'Preview: compile all sections' },
  { id: 'sources',    icon: 'S', label: 'Sources', tip: 'Sources: uploaded documents' },
  { id: 'provenance', icon: 'A', label: 'Authenticity', tip: 'Authenticity: provenance + history' },
  { id: 'check',      icon: 'C', label: 'Check', tip: 'Check: verify against rubric' },
  { id: 'pastqs',     icon: 'Q', label: "Past Q's", tip: "Past Q's: HSC practice questions" },
  { id: 'udl',        icon: 'U', label: 'UDL 3.0', tip: 'UDL 3.0: 4 ways to understand' },
  { id: 'simplify',   icon: '\u2606', label: 'Simplify', tip: 'Simplify: week-by-week action plan' },
  { id: 'rubric',     icon: 'R', label: 'Rubric', tip: 'Rubric: plain language translation' },
  { id: 'scorer',     icon: '\u2714', label: 'Scorer', tip: 'Scorer: formative feedback on draft' },
  { id: 'hidden',     icon: '?', label: 'Hidden', tip: 'Hidden: decode what markers want' },
  { id: 'break',      icon: '\u25CB', label: 'Break', tip: 'Break: 4-7-8 breathing exercise' },
];

export default function PanelRail({ activePanel, onSelectPanel, panelContent }) {
  return (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      {/* Panel content overlay */}
      {activePanel && panelContent && (
        <aside
          style={{
            width: 360,
            background: SURFACE_CARD,
            borderLeft: `1px solid ${SURFACE_RAISED}`,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
          role="complementary"
          aria-label={`${PANELS.find(p => p.id === activePanel)?.label || 'Panel'} panel`}
        >
          {panelContent}
        </aside>
      )}

      {/* Tab rail */}
      <nav
        style={{
          width: 44,
          background: SURFACE_CARD,
          borderLeft: `1px solid ${SURFACE_RAISED}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 8,
          gap: 2,
        }}
        role="tablist"
        aria-label="Canvas panels"
      >
        {PANELS.map(p => {
          const isActive = activePanel === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={p.label}
              title={p.tip}
              onClick={() => onSelectPanel(isActive ? null : p.id)}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? ACCENT_GLASS : 'transparent',
                border: isActive ? `1px solid ${ACCENT_BORDER}` : '1px solid transparent',
                borderRadius: BORDER_RADIUS,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: FONT_SYSTEM,
                fontSize: 11,
                fontWeight: 700,
                color: isActive ? ACCENT_PULSE : TEXT_FAINT,
                letterSpacing: '0.04em',
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {p.icon}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
