import React from 'react';
import { motion } from 'framer-motion';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER, ACCENT_GLASS, ACCENT_GLASS_FAINT, ACCENT_GLASS_SUBTLE,
  COLOUR_WARN,
  GLASS_BORDER,
  FONT_SYSTEM, FONT_BODY,
} from '../../theme/tokens';

const MQ_REDUCE = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const f = { fontFamily: FONT_SYSTEM };
const fb = { fontFamily: FONT_BODY };

function UploadPreview() {
  const steps = [
    { n: '1', label: 'Drop your brief', detail: 'PDF, DOCX, or paste a URL', done: true },
    { n: '2', label: 'Assessments extracted', detail: '3 assessments, 2 due dates, rubric found', done: true },
    { n: '3', label: 'Workspace built', detail: 'Sections, checklist, roadmap generated', done: true },
    { n: '4', label: 'Start writing', detail: 'AI tutor ready, voice input available', active: true },
  ];
  return (
    <div style={{ padding: 20, display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...f, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, marginBottom: 4 }}>How it works</div>
        {steps.map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', background: s.active ? ACCENT_GLASS_FAINT : 'transparent', border: `1px solid ${s.active ? ACCENT_PULSE : s.done ? SURFACE_RAISED : GLASS_BORDER}`, borderRadius: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: s.done ? ACCENT_PULSE : s.active ? ACCENT_GLASS : SURFACE_RAISED, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...f, fontSize: 10, fontWeight: 700, color: s.done ? SURFACE_BASE : s.active ? ACCENT_PULSE : TEXT_FAINT }}>
              {s.done ? '\u2713' : s.n}
            </div>
            <div>
              <div style={{ ...fb, fontSize: 12, fontWeight: 600, color: s.active ? ACCENT_PULSE : s.done ? TEXT_PRIMARY : TEXT_MUTED }}>{s.label}</div>
              <div style={{ ...f, fontSize: 9, color: TEXT_FAINT, marginTop: 1 }}>{s.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ width: 180, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ ...f, fontSize: 8, fontWeight: 700, color: TEXT_FAINT, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Extracted</div>
        {['Literature Review (25%)', 'Lab Report (30%)', 'Final Exam (45%)'].map((a, i) => (
          <div key={a} style={{ padding: '8px 10px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 6, ...fb, fontSize: 10, color: TEXT_PRIMARY }}>
            {a}
            <div style={{ ...f, fontSize: 8, color: TEXT_FAINT, marginTop: 2 }}>{i === 0 ? 'Due 15 Jul' : i === 1 ? 'Due 4 Aug' : 'Due 20 Oct'}</div>
          </div>
        ))}
        <div style={{ padding: '6px 10px', background: ACCENT_GLASS_FAINT, border: `1px solid ${ACCENT_BORDER}`, borderRadius: 6, ...f, fontSize: 9, color: ACCENT_PULSE, textAlign: 'center', fontWeight: 700 }}>Rubric detected</div>
      </div>
    </div>
  );
}

function EditorPreview() {
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: 40, background: SURFACE_CARD, borderRight: `1px solid ${GLASS_BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10, gap: 4 }}>
        {['I', 'B', 'C'].map((s, i) => (
          <div key={s} style={{ width: 28, height: 28, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', ...f, fontSize: 10, fontWeight: 700, color: i === 1 ? ACCENT_PULSE : TEXT_FAINT, background: i === 1 ? ACCENT_GLASS : 'transparent', border: `1px solid ${i === 1 ? ACCENT_BORDER : 'transparent'}` }}>{s}</div>
        ))}
      </div>
      <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 6, padding: '4px 0 8px', borderBottom: `1px solid ${GLASS_BORDER}`, marginBottom: 8 }}>
          {['B', 'I', 'H2', 'Link', 'Quote'].map(b => (<span key={b} style={{ ...f, fontSize: 8, fontWeight: 700, color: TEXT_FAINT, padding: '2px 4px' }}>{b}</span>))}
          <span style={{ marginLeft: 'auto', ...f, fontSize: 8, color: TEXT_FAINT }}>847 / 2000 words</span>
        </div>
        <div style={{ ...fb, fontSize: 11, lineHeight: 2, color: TEXT_PRIMARY }}>
          The audit found that 42 Australian universities are at varying stages of UDL adoption.{' '}
          <span style={{ borderBottom: `2px solid ${COLOUR_WARN}`, position: 'relative' }}>
            (Meyer et al., 2024)
            <span style={{ position: 'absolute', top: -20, left: 0, ...f, fontSize: 7, color: COLOUR_WARN, background: SURFACE_RAISED, padding: '1px 4px', borderRadius: 2, whiteSpace: 'nowrap' }}>Unverified: check source</span>
          </span>
        </div>
        <div style={{ ...fb, fontSize: 11, lineHeight: 2, color: TEXT_PRIMARY, marginTop: 4 }}>However, only 12 institutions have embedded UDL principles into their formal curriculum approval processes.</div>
        <div style={{ ...fb, fontSize: 11, lineHeight: 2, color: TEXT_FAINT, marginTop: 4, fontStyle: 'italic' }}><span style={{ color: ACCENT_PULSE }}>|</span> Type or speak here...</div>
      </div>
      <div style={{ width: 40, background: SURFACE_CARD, borderLeft: `1px solid ${GLASS_BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10, gap: 4 }}>
        {['B', 'T', 'P', 'S', 'Q'].map((s, i) => (
          <div key={s} style={{ width: 28, height: 28, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', ...f, fontSize: 10, fontWeight: 700, color: i === 1 ? ACCENT_PULSE : TEXT_FAINT, background: i === 1 ? ACCENT_GLASS : 'transparent', border: `1px solid ${i === 1 ? ACCENT_BORDER : 'transparent'}` }}>{s}</div>
        ))}
      </div>
    </div>
  );
}

function TutorPreview() {
  const msgs = [
    { role: 'tutor', text: "Working on your Literature Review. What are you stuck on?" },
    { role: 'user', text: "I don't know how to start the introduction" },
    { role: 'tutor', text: "What is the one question your whole review is trying to answer?" },
    { role: 'user', text: "Whether UDL 3.0 actually improves outcomes for neurodivergent students" },
    { role: 'tutor', text: "Good. That is your thesis seed. Can you name one study that says yes, and one that says not yet?" },
  ];
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <div style={{ ...f, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE }}>Socratic Tutor (powered by Claude)</div>
      <div style={{ ...f, fontSize: 8, color: TEXT_FAINT, marginBottom: 4 }}>Asks questions. Never writes for you.</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {msgs.map((m, i) => (
          <motion.div key={i} initial={MQ_REDUCE ? {} : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.3, duration: 0.4 }}
            style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '6px 10px', background: m.role === 'user' ? ACCENT_GLASS : 'transparent', border: `1px solid ${m.role === 'user' ? ACCENT_BORDER : SURFACE_RAISED}`, borderRadius: 6 }}>
            <p style={{ ...fb, fontSize: 11, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.5 }}>{m.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function VoicePreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '100%', padding: 24 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={MQ_REDUCE ? {} : { scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }} transition={MQ_REDUCE ? {} : { duration: 1.5, repeat: Infinity }}
          style={{ position: 'absolute', width: 64, height: 64, borderRadius: '50%', border: `1px solid ${ACCENT_PULSE}` }} />
        <div style={{ width: 48, height: 48, borderRadius: 24, background: ACCENT_PULSE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SURFACE_BASE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </div>
      </div>
      <div style={{ padding: '8px 16px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 20, maxWidth: 300 }}>
        <p style={{ ...fb, fontSize: 12, color: TEXT_MUTED, margin: 0, textAlign: 'center' }}>"The main finding was that inclusive design reduced dropout rates by..."</p>
      </div>
      <p style={{ ...f, fontSize: 9, color: TEXT_FAINT }}>Speak. Text appears at cursor. Chrome + Safari.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ ...f, fontSize: 8, color: TEXT_FAINT, padding: '3px 8px', border: `1px solid ${GLASS_BORDER}`, borderRadius: 4 }}>Cmd+Shift+V</span>
        <span style={{ ...f, fontSize: 8, color: TEXT_FAINT, padding: '3px 8px', border: `1px solid ${GLASS_BORDER}`, borderRadius: 4 }}>en-AU</span>
      </div>
    </div>
  );
}

function HSCPreview() {
  const qs = [
    { year: 2024, text: 'Explain how the composer represents human experience...', marks: 8 },
    { year: 2023, text: 'Analyse how language shapes meaning in the prescribed text...', marks: 6 },
    { year: 2022, text: 'Compare how both texts present perspectives on identity...', marks: 5 },
  ];
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <div style={{ ...f, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE }}>HSC Past Questions</div>
      <p style={{ ...fb, fontSize: 10, color: TEXT_FAINT, margin: 0 }}>26 years of past papers across NSW, VIC, QLD, WA. Matched to your assessment.</p>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {qs.map((q, i) => (
          <div key={i} style={{ padding: '8px 10px', border: `1px solid ${GLASS_BORDER}`, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <p style={{ ...fb, fontSize: 11, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.4 }}>{q.text}</p>
              <p style={{ ...f, fontSize: 8, color: TEXT_FAINT, marginTop: 3 }}>HSC {q.year} | NESA English Standard | {q.marks} marks</p>
            </div>
            <span style={{ ...f, fontSize: 8, fontWeight: 700, color: ACCENT_PULSE, padding: '3px 6px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: 3, flexShrink: 0 }}>Use</span>
          </div>
        ))}
      </div>
      <p style={{ ...f, fontSize: 8, color: TEXT_FAINT, textAlign: 'center' }}>Marker feedback included. Search by year, subject, marks.</p>
    </div>
  );
}

function ResetPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '100%', padding: 24, background: `radial-gradient(ellipse at center, ${ACCENT_GLASS_SUBTLE} 0%, transparent 70%)` }}>
      <div style={{ ...f, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE }}>Time for a break</div>
      <p style={{ ...fb, fontSize: 13, color: TEXT_MUTED, textAlign: 'center', maxWidth: 240, lineHeight: 1.6 }}>You have been writing for 45 minutes. Your brain needs a reset. No guilt.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 260, width: '100%' }}>
        {['Stretch (2 min)', 'Hydrate', 'Walk away (5 min)', 'Play a game'].map(opt => (
          <div key={opt} style={{ padding: '10px 12px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, textAlign: 'center', ...f, fontSize: 9, fontWeight: 600, color: TEXT_MUTED }}>{opt}</div>
        ))}
      </div>
      <p style={{ ...f, fontSize: 8, color: TEXT_FAINT }}>No streaks. No shame. Just sustainable work.</p>
    </div>
  );
}

function JokePreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '100%', padding: 24, background: `radial-gradient(ellipse at center, ${ACCENT_GLASS_SUBTLE} 0%, transparent 70%)` }}>
      <div style={{ ...f, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE }}>Joy Moments</div>
      <div style={{ padding: '16px 20px', background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, maxWidth: 340, textAlign: 'center' }}>
        <p style={{ ...fb, fontSize: 13, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.6 }}>Why did the neuron break up with the synapse?</p>
        <p style={{ ...fb, fontSize: 13, color: ACCENT_PULSE, margin: '8px 0 0', lineHeight: 1.6, fontWeight: 600 }}>There was no connection.</p>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ ...f, fontSize: 8, color: TEXT_FAINT, padding: '3px 8px', border: `1px solid ${GLASS_BORDER}`, borderRadius: 4 }}>/joke</span>
        <span style={{ ...f, fontSize: 8, color: TEXT_FAINT }}>or</span>
        <span style={{ ...f, fontSize: 8, color: TEXT_FAINT, padding: '3px 8px', border: `1px solid ${GLASS_BORDER}`, borderRadius: 4 }}>"tell me a joke"</span>
      </div>
      <p style={{ ...f, fontSize: 9, color: TEXT_FAINT, textAlign: 'center', maxWidth: 260 }}>Clean puns, wordplay, dad jokes. ND-friendly. Stays on screen until you click away.</p>
    </div>
  );
}

export default function ShowcasePreview({ activeTab }) {
  const views = { upload: UploadPreview, editor: EditorPreview, tutor: TutorPreview, voice: VoicePreview, hsc: HSCPreview, reset: ResetPreview, joke: JokePreview };
  const View = views[activeTab] || views.upload;
  return (
    <div style={{ aspectRatio: '16/9', minHeight: 320, background: SURFACE_BASE, overflow: 'hidden' }}>
      <View />
    </div>
  );
}
