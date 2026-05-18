import React from 'react';
import { motion } from 'framer-motion';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER, ACCENT_GLASS, ACCENT_GLASS_FAINT, ACCENT_GLASS_SUBTLE,
  GLASS_BORDER,
  FONT_SYSTEM, FONT_BODY,
} from '../../theme/tokens';

const MQ_REDUCE = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const f = { fontFamily: FONT_SYSTEM };
const fb = { fontFamily: FONT_BODY };

function PlanPreview() {
  const tasks = [
    { label: 'Beginning of week', items: ['Read the rubric criteria', 'Highlight key terms'], done: [true, true] },
    { label: 'Throughout',        items: ['Find 3 peer-reviewed sources', 'Draft introduction paragraph'], done: [true, false] },
    { label: 'End of week',       items: ['Self-check against rubric', 'Submit draft for review'], done: [false, false] },
  ];
  return (
    <div style={{ padding: 20, display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ ...f, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, marginBottom: 4 }}>Week 1 plan</div>
        {tasks.map((section, si) => (
          <div key={si} style={{ border: `1px solid ${GLASS_BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ padding: '6px 10px', background: SURFACE_CARD, ...f, fontSize: 9, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {section.label}
            </div>
            {section.items.map((item, ii) => (
              <div key={ii} style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8, borderTop: `1px solid ${GLASS_BORDER}` }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${section.done[ii] ? ACCENT_PULSE : GLASS_BORDER}`, background: section.done[ii] ? ACCENT_PULSE : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {section.done[ii] && <span style={{ ...f, fontSize: 8, color: SURFACE_BASE, fontWeight: 700 }}>{'\u2713'}</span>}
                </div>
                <span style={{ ...fb, fontSize: 11, color: section.done[ii] ? TEXT_FAINT : TEXT_PRIMARY, textDecoration: section.done[ii] ? 'line-through' : 'none' }}>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ width: 160, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ ...f, fontSize: 8, fontWeight: 700, color: TEXT_FAINT, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Assessment</div>
        <div style={{ padding: '10px 12px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 6 }}>
          <div style={{ ...fb, fontSize: 11, color: TEXT_PRIMARY, marginBottom: 4 }}>Literature Review</div>
          <div style={{ ...f, fontSize: 8, color: TEXT_FAINT }}>25% weight</div>
          <div style={{ ...f, fontSize: 8, color: TEXT_FAINT, marginTop: 2 }}>Due 15 Jul</div>
          <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: SURFACE_RAISED, overflow: 'hidden' }}>
            <div style={{ width: '40%', height: '100%', background: ACCENT_PULSE, borderRadius: 2 }} />
          </div>
          <div style={{ ...f, fontSize: 8, color: ACCENT_PULSE, marginTop: 3 }}>40% complete</div>
        </div>
        <div style={{ padding: '6px 10px', background: ACCENT_GLASS_FAINT, border: `1px solid ${ACCENT_BORDER}`, borderRadius: 6, ...f, fontSize: 9, color: ACCENT_PULSE, fontWeight: 700, textAlign: 'center' }}>Glossary: 12 terms</div>
      </div>
    </div>
  );
}

function AskAuraPreview() {
  const msgs = [
    { role: 'aura', text: 'Your Literature Review is due in 12 days. What do you already know about this topic, even one thing?' },
    { role: 'user', text: 'I know it needs 3 peer-reviewed sources' },
    { role: 'aura', text: "Good. That is your foundation. Now, what is the one question you are trying to answer? Finish this sentence: this review asks whether..." },
    { role: 'user', text: 'Whether UDL actually helps neurodivergent students' },
  ];
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #d0bfe8, #b49fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#ede9f7', fontWeight: 700 }}>{'>_<'}</span>
        </div>
        <div style={{ ...f, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#b49fd4' }}>AURA</div>
        <div style={{ ...f, fontSize: 8, color: TEXT_FAINT, marginLeft: 'auto' }}>Asks questions. Never writes for you.</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'hidden' }}>
        {msgs.map((m, i) => (
          <motion.div key={i}
            initial={MQ_REDUCE ? {} : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.25, duration: 0.35 }}
            style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%', padding: '7px 11px', background: m.role === 'user' ? ACCENT_GLASS : SURFACE_CARD, border: `1px solid ${m.role === 'user' ? ACCENT_BORDER : GLASS_BORDER}`, borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px' }}>
            <p style={{ ...fb, fontSize: 11, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.5 }}>{m.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TimetablePreview() {
  const courses = [
    { name: 'EDST2101: Literature Review', due: '12 days', urgency: 0.75, color: '#ef4444', label: 'Due soon' },
    { name: 'PSYC3302: Lab Report',        due: '28 days', urgency: 0.4,  color: '#f59e0b', label: 'On track' },
    { name: 'COMP1511: Final Exam',        due: '61 days', urgency: 0.15, color: '#10b981', label: 'Plenty of time' },
  ];
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ ...f, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE }}>Your assessments</div>
        <div style={{ ...f, fontSize: 8, color: ACCENT_PULSE, padding: '3px 8px', border: `1px solid ${ACCENT_BORDER}`, borderRadius: 4, fontWeight: 700 }}>Export to Calendar</div>
      </div>
      {courses.map((c, i) => (
        <div key={i} style={{ padding: '12px 14px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ ...fb, fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600 }}>{c.name}</div>
            <div style={{ ...f, fontSize: 8, color: TEXT_FAINT, flexShrink: 0, marginLeft: 8 }}>{c.due}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: SURFACE_RAISED, overflow: 'hidden' }}>
              <div style={{ width: `${c.urgency * 100}%`, height: '100%', background: c.color, borderRadius: 2 }} />
            </div>
            <span style={{ ...f, fontSize: 8, color: c.color, fontWeight: 700, flexShrink: 0 }}>{c.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FocusPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, height: '100%', padding: 20 }}>
      <div style={{ position: 'relative', width: 90, height: 90 }}>
        <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden="true">
          <circle cx="45" cy="45" r="40" fill="none" stroke={SURFACE_RAISED} strokeWidth="6" />
          <circle cx="45" cy="45" r="40" fill="none" stroke={ACCENT_PULSE} strokeWidth="6" strokeDasharray="251" strokeDashoffset="67" strokeLinecap="round" transform="rotate(-90 45 45)" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...f, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: '-0.02em' }}>24:32</span>
          <span style={{ ...f, fontSize: 7, color: TEXT_FAINT, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Focus</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['Silence', 'Rain', 'Cafe'].map((s, i) => (
          <div key={s} style={{ padding: '5px 10px', borderRadius: 12, border: `1px solid ${i === 0 ? ACCENT_PULSE : GLASS_BORDER}`, background: i === 0 ? ACCENT_GLASS : 'transparent', ...f, fontSize: 9, fontWeight: 700, color: i === 0 ? ACCENT_PULSE : TEXT_FAINT }}>
            {s}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <motion.div
          animate={MQ_REDUCE ? {} : { opacity: [1, 0.4, 1] }}
          transition={MQ_REDUCE ? {} : { duration: 2, repeat: Infinity }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: '#b49fd4' }}
        />
        <span style={{ ...f, fontSize: 10, color: '#b49fd4', fontWeight: 700 }}>AURA is here with you</span>
      </div>
      <div style={{ padding: '5px 12px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 12 }}>
        <span style={{ ...f, fontSize: 9, color: TEXT_FAINT }}>3 students working right now</span>
      </div>
    </div>
  );
}

function CanvasPreview() {
  const lines = [
    'The evidence suggests that UDL 3.0 frameworks',
    'significantly reduce cognitive load for students',
    'with executive function differences (Rose, 2024).',
    '',
    'However, implementation varies widely across...',
  ];
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {['THINK', 'IDEAS', 'WRITE'].map((tab, i) => (
          <div key={tab} style={{ padding: '5px 14px', borderRadius: '6px 6px 0 0', border: `1px solid ${i === 2 ? ACCENT_PULSE : GLASS_BORDER}`, borderBottom: i === 2 ? `1px solid ${SURFACE_CARD}` : undefined, background: i === 2 ? SURFACE_CARD : 'transparent', ...f, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: i === 2 ? ACCENT_PULSE : TEXT_FAINT }}>
            {tab}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: '12px 14px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: '0 6px 6px 6px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {lines.map((line, i) => (
            <div key={i} style={{ ...fb, fontSize: 11, color: line ? TEXT_PRIMARY : 'transparent', lineHeight: 1.7 }}>
              {line || '\u00a0'}
            </div>
          ))}
          <span style={{ ...fb, fontSize: 11, color: ACCENT_PULSE }}>|</span>
        </div>
        <div style={{ position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #d0bfe8, #b49fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 7, color: '#ede9f7', fontWeight: 700 }}>{'>_<'}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['Rubric check', 'Score essay', 'AI risk'].map(tool => (
          <div key={tool} style={{ padding: '4px 8px', border: `1px solid ${GLASS_BORDER}`, borderRadius: 4, ...f, fontSize: 8, color: TEXT_FAINT }}>
            {tool}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShowcasePreview({ activeTab }) {
  const views = { plan: PlanPreview, ask: AskAuraPreview, timetable: TimetablePreview, focus: FocusPreview, canvas: CanvasPreview };
  const View = views[activeTab] || views.plan;
  return (
    <div style={{ aspectRatio: '16/9', minHeight: 320, background: SURFACE_BASE, overflow: 'hidden' }}>
      <View />
    </div>
  );
}
