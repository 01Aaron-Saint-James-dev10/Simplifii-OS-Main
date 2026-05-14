import React from 'react';
import { motion } from 'framer-motion';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER, ACCENT_GLASS_FAINT, ACCENT_GLASS_SUBTLE,
  ACCENT_AMBER, COLOUR_WARN,
  GLASS_SURFACE, GLASS_BORDER,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
} from '../../theme/tokens';
import NeuralAvatar from '../components/visuals/NeuralAvatar';

const MQ_REDUCE = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const f = { fontFamily: FONT_SYSTEM };
const fb = { fontFamily: FONT_BODY };
const pill = { display: 'inline-block', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', ...f };

function WorkspacePreview() {
  return (
    <div style={{ display: 'flex', gap: 12, height: '100%', padding: 16 }}>
      {/* Left sidebar */}
      <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ ...f, fontSize: 8, fontWeight: 700, color: TEXT_FAINT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Phases</div>
        {['Phase 1: MRes', 'Phase 2: PhD', 'Phase 3: Postdoc'].map((p, i) => (
          <div key={p} style={{ padding: '8px 10px', background: i === 0 ? ACCENT_GLASS_FAINT : 'transparent', border: `1px solid ${i === 0 ? ACCENT_PULSE : GLASS_BORDER}`, borderRadius: 6, ...f, fontSize: 10, color: i === 0 ? ACCENT_PULSE : TEXT_MUTED, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{p}</span>
            <span style={{ fontSize: 8, opacity: 0.5 }}>{'\u203A'}</span>
          </div>
        ))}
      </div>
      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: 'Methodology', n: '5', c: TEXT_MUTED }, { label: 'Reflexivity', n: '5', c: TEXT_MUTED }, { label: 'Feedback', n: '3', c: COLOUR_WARN }].map(s => (
            <div key={s.label} style={{ flex: 1, padding: '10px 12px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 6 }}>
              <div style={{ ...f, fontSize: 8, color: TEXT_FAINT, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ ...f, fontSize: 18, fontWeight: 700, color: s.c, marginTop: 4 }}>{s.n}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 16px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 6, flex: 1 }}>
          <div style={{ ...f, fontSize: 8, color: TEXT_FAINT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Active chapter</div>
          <div style={{ ...fb, fontSize: 13, color: TEXT_PRIMARY, fontWeight: 600, marginBottom: 8 }}>Chapter 5: Findings (Interviews)</div>
          <div style={{ display: 'inline-block', padding: '5px 14px', background: ACCENT_GLASS_FAINT, border: `1px solid ${ACCENT_PULSE}`, borderRadius: 4, ...f, fontSize: 9, fontWeight: 700, color: ACCENT_PULSE, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Resume</div>
        </div>
      </div>
    </div>
  );
}

function DraftPreview() {
  const lines = [
    { text: 'The audit found that 42 Australian universities are at varying', normal: true },
    { text: 'stages of UDL adoption (Meyer et al., 2024).', flagged: true },
    { text: '' },
    { text: 'However, only 12 institutions have embedded UDL principles', normal: true },
    { text: 'into their formal curriculum approval processes.', normal: true },
  ];
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 8px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: '6px 6px 0 0', marginBottom: 0 }}>
        {['B', 'I', 'S', 'H1', 'H2', 'H3'].map(b => (
          <span key={b} style={{ ...f, fontSize: 9, fontWeight: 700, color: TEXT_FAINT, padding: '2px 4px', borderRadius: 2 }}>{b}</span>
        ))}
      </div>
      {/* Editor body */}
      <div style={{ flex: 1, padding: '16px 14px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderTop: 'none', borderRadius: '0 0 6px 6px', position: 'relative' }}>
        {lines.map((l, i) => (
          <div key={i} style={{ ...fb, fontSize: 12, lineHeight: 2, color: l.normal || l.flagged ? TEXT_PRIMARY : 'transparent', position: 'relative' }}>
            {l.flagged ? (
              <span style={{ position: 'relative' }}>
                {l.text}
                {/* Amber wavy underline */}
                <svg style={{ position: 'absolute', bottom: 2, left: 0, width: '100%', height: 4 }} aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 4">
                  <path d="M0 2 Q 5 0, 10 2 T 20 2 T 30 2 T 40 2 T 50 2 T 60 2 T 70 2 T 80 2 T 90 2 T 100 2" fill="none" stroke={COLOUR_WARN} strokeWidth="1.5" />
                </svg>
                {/* Tooltip */}
                <span style={{ position: 'absolute', bottom: '100%', left: '20%', marginBottom: 6, padding: '4px 8px', background: SURFACE_RAISED, border: `1px solid ${COLOUR_WARN}`, borderRadius: 4, ...f, fontSize: 8, color: COLOUR_WARN, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                  Unverified: check source
                </span>
              </span>
            ) : l.text}
            {!l.text && <br />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResetPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, height: '100%', padding: 24, background: `radial-gradient(ellipse at center, ${ACCENT_GLASS_SUBTLE} 0%, transparent 70%)` }}>
      {/* Avatar with pulse rings */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: `1px solid ${ACCENT_PULSE}`, opacity: 0.15 }}
          animate={MQ_REDUCE ? {} : { scale: [1, 1.4], opacity: [0.15, 0] }}
          transition={MQ_REDUCE ? {} : { duration: 3, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.div
          style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: `1px solid ${ACCENT_PULSE}`, opacity: 0.1 }}
          animate={MQ_REDUCE ? {} : { scale: [1, 1.6], opacity: [0.1, 0] }}
          transition={MQ_REDUCE ? {} : { duration: 3, repeat: Infinity, ease: 'easeOut', delay: 1 }}
        />
        <NeuralAvatar persona="browser" size={64} />
      </div>
      {/* Option cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 280, width: '100%' }}>
        {['Play game', 'Stretch', 'Hydrate', 'Game Vault'].map(opt => (
          <div key={opt} style={{ padding: '10px 12px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, textAlign: 'center', ...f, fontSize: 10, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.04em' }}>
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShowcasePreview({ activeTab }) {
  const views = { workspace: WorkspacePreview, draft: DraftPreview, reset: ResetPreview };
  const View = views[activeTab] || views.workspace;
  return (
    <div style={{ aspectRatio: '16/9', minHeight: 320, background: SURFACE_BASE, overflow: 'hidden' }}>
      <View />
    </div>
  );
}
