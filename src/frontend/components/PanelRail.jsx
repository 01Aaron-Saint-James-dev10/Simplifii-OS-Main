import React, { useState } from 'react';
import ToolModal from './ToolModal';
import { announceTransition } from '../services/PredictabilityService';
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
  FONT_BODY,
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
  { id: 'brief',      icon: 'B', label: 'Brief', tip: 'Brief: extracted assessment criteria',
    info: 'Shows the criteria, due dates, and key requirements extracted from your uploaded assessment brief. This is your reference point for what the marker expects.' },
  { id: 'tutor',      icon: 'T', label: 'Tutor', tip: 'Tutor: Socratic AI, asks questions',
    info: 'A Socratic AI tutor powered by Claude. It asks you questions to sharpen your thinking. It will never write content for you. Adapts to your year level and accessibility settings.' },
  { id: 'preview',    icon: 'P', label: 'Preview', tip: 'Preview: compile all sections',
    info: 'Compiles all your sections into one document preview. See exactly what your submission will look like before you export it.' },
  { id: 'sources',    icon: 'S', label: 'Sources', tip: 'Sources: uploaded documents',
    info: 'Lists all documents you have uploaded for this assessment: briefs, readings, rubrics, and notes. You can re-read or remove them here.' },
  { id: 'provenance', icon: 'A', label: 'Authenticity', tip: 'Authenticity: provenance + history',
    info: 'Your History of Thought: a timeline showing every step from blank page to final work. Every AI contribution is logged separately from your own writing. This is your integrity proof.' },
  { id: 'check',      icon: 'C', label: 'Check', tip: 'Check: verify against rubric',
    info: 'Checks your draft against the rubric criteria. Highlights which criteria you have addressed and which still need work.' },
  { id: 'pastqs',     icon: 'Q', label: "Past Q's", tip: "Past Q's: HSC practice questions",
    info: '26 years of past exam papers across NSW (NESA), VIC (VCE), QLD (QCE), and WA (WACE). Questions are matched to your current assessment. Includes marker feedback where available.' },
  { id: 'udl',        icon: 'U', label: 'UDL 3.0', tip: 'UDL 3.0: 4 ways to understand',
    info: 'Universal Design for Learning: get your brief presented in 4 different ways: Plain English, Visual Outline, Audio Script, and Chunked Tasks. Pick whichever helps you understand it best.' },
  { id: 'simplify',   icon: '\u2606', label: 'Simplify', tip: 'Simplify: week-by-week action plan',
    info: 'Turns your assessment brief into a week-by-week action plan with checkboxes. Each task is small enough to finish in under 30 minutes. Includes practical tips per week.' },
  { id: 'rubric',     icon: 'R', label: 'Rubric', tip: 'Rubric: plain language translation',
    info: 'Translates rubric criteria into plain language. For each criterion: what it actually means, what a top-band response looks like, and the common mistake to avoid.' },
  { id: 'scorer',     icon: '\u2714', label: 'Scorer', tip: 'Scorer: formative feedback on draft',
    info: 'Gives formative feedback on your draft against each rubric criterion. Not a grade predictor: it highlights what is strong and what needs more work, with specific suggestions.' },
  { id: 'hidden',     icon: '?', label: 'Hidden', tip: 'Hidden: decode what markers want',
    info: 'Decodes the hidden curriculum: the unstated expectations that markers have but the brief does not spell out. What "critical analysis" actually means in practice, what register to use, etc.' },
  { id: 'analysis',  icon: '\u2261', label: 'Analysis', tip: 'Analysis: real-time writing metrics',
    info: 'Shows reading level, average sentence length, passive voice percentage, filler words, and word repetition as you write. Helps you tighten your prose.' },
];

export default function PanelRail({ activePanel, onSelectPanel, panelContent }) {
  const [showInfo, setShowInfo] = useState(false);

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
              onClick={() => {
                const next = isActive ? null : p.id;
                if (next) announceTransition(p.label);
                onSelectPanel(next);
              }}
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

        {/* Info button at bottom of rail */}
        <div style={{ marginTop: 'auto', paddingBottom: 8 }}>
          <button
            type="button"
            aria-label="Tool guide: what each panel does"
            title="What does each tool do?"
            onClick={() => setShowInfo(true)}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: BORDER_RADIUS,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: FONT_SYSTEM,
              fontSize: 13,
              fontWeight: 700,
              color: TEXT_FAINT,
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            i
          </button>
        </div>
      </nav>

      {/* Tool explainer modal */}
      {showInfo && (
        <ToolModal
          title="Your Toolkit"
          statusBadge="beta"
          description="Every tool in the right rail, explained. Click a tab to open the tool."
          onClose={() => setShowInfo(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PANELS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setShowInfo(false); onSelectPanel(p.id); }}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '10px 12px', background: 'transparent',
                  border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
                  cursor: 'pointer', textAlign: 'left', outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = ACCENT_PULSE; }}
                onBlur={e => { e.currentTarget.style.borderColor = SURFACE_RAISED; }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, color: ACCENT_PULSE,
                  flexShrink: 0,
                }}>
                  {p.icon}
                </span>
                <div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{p.label}</div>
                  <div style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, lineHeight: 1.4, marginTop: 2 }}>{p.info}</div>
                </div>
              </button>
            ))}
          </div>
        </ToolModal>
      )}
    </div>
  );
}
