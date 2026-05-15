import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import '@fontsource/geist-sans/800.css';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT, TEXT_LABEL,
  ACCENT_PULSE, ACCENT_HOVER, ACCENT_BORDER, ACCENT_GLOW,
  ACCENT_GLASS, ACCENT_GLASS_STRONG, ACCENT_BORDER_STRONG,
  ACCENT_GLOW_50, ACCENT_CYAN, ACCENT_AMBER, ACCENT_BORDER_FAINT,
  ACCENT_GLASS_FAINT, ACCENT_GLASS_SUBTLE,
  GLASS_SURFACE, GLASS_BORDER, GLASS_BORDER_HOVER,
  GLOW_EMERALD, ACCENT_SHADOW_FAINT,
  FONT_BODY, FONT_SYSTEM, FONT_DISPLAY, TEXT_LINK,
  BORDER_RADIUS, GRADIENT_EMERALD_CYAN,
} from '../../theme/tokens';
import NeuralAvatar from '../components/visuals/NeuralAvatar';
import MatrixRain from '../components/MatrixRain';
import ShowcasePreview from './ShowcasePreview';
import EducationLevels from './EducationLevels';
import './LandingPage.css';

const MQ_REDUCE = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ── Data ────────────────────────────────────────────────────────── */

const PILLARS = [
  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', title: 'Prepare', body: 'Decode the brief. Translate the rubric. Know what is actually being asked before you start.' },
  { icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', title: 'Organise', body: 'Drop in your sources. Sort your thinking. Build a workspace that holds your ideas as you write.' },
  { icon: 'M8 9l4-4 4 4m0 6l-4 4-4-4', title: 'Decide', body: 'When you are stuck, surface the real options. When you are wrong, get told kindly.' },
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Follow through', body: 'Every claim verified. Every citation real. Submission-ready, in your own words.' },
];

// Awards removed: belong to Aaron personally, not the app. See Sprint V backlog.

const SHOWCASE = [
  { id: 'upload', label: '1. Upload', desc: 'Drop a PDF or paste a URL. We extract your assessments, due dates, rubric criteria, and build your workspace automatically.' },
  { id: 'editor', label: '2. Write', desc: 'Full editor with real-time citation flagging. Every claim checked against your uploaded sources. Voice input available.' },
  { id: 'tutor', label: '3. Ask', desc: 'Socratic tutor powered by Claude. Asks questions to sharpen your thinking. Never writes for you. Adapts to your year level.' },
  { id: 'voice', label: '4. Speak', desc: 'Voice-to-text input. Speak your thoughts, text appears at cursor. Free, browser-native, no recordings stored.' },
  { id: 'hsc', label: '5. Practice', desc: '26 years of HSC past papers across NSW, VIC, QLD, WA. Matched to your assessment. Marker feedback included.' },
  { id: 'reset', label: '6. Reset', desc: 'Built-in breaks designed for sustainable thinking. No guilt. No streaks. No shame. Just good work habits.' },
  { id: 'joke', label: '7. Joy', desc: 'Type /joke or say "tell me a joke" to get a clean, ND-friendly joke when you need a brain break. Stays until you dismiss it.' },
];

const COMPARISON = [
  { them: 'Writes for you', us: 'Works with you' },
  { them: 'Hallucinates citations', us: 'Verifies every claim' },
  { them: 'Flattens your voice', us: 'Preserves your voice' },
  { them: 'Black box', us: 'Full history of your thinking' },
];

const FAQS = [
  { q: 'Is this allowed under my university\'s AI policy?', a: 'Simplifii-OS is a workflow and verification tool, not a content generator. Most institutions permit tools that support your own thinking. We make disclosure easy with our AI Use Receipt feature. Always check your institution\'s specific policy.' },
  { q: 'Will my grades improve?', a: 'We cannot promise any specific academic outcome. Simplifii-OS helps you organise, verify, and strengthen your work. Better work habits tend to produce better results, but grades depend on many factors outside our control.' },
  { q: 'How is this different from ChatGPT or Grammarly?', a: 'ChatGPT writes for you. Grammarly polishes what you wrote. Simplifii-OS works with you across the entire workflow: from decoding the brief, to organising sources, to verifying every claim before submission. Your voice stays yours.' },
  { q: 'What happens to my data?', a: 'Your data is stored encrypted in Sydney, Australia. We do not sell it, share it with advertisers, or use it to train AI models. You can export or delete your data at any time.' },
  { q: 'Is it really free?', a: 'Yes. Simplifii-OS is free for all individual learners during beta. When we introduce paid plans, free accounts will always have a free tier.' },
  { q: 'Does it work for high school students?', a: 'Yes. Simplifii-OS works for Year 7 through Year 12, including HSC preparation, as well as primary school students with parental support. The UI and language adapt to the learner\'s stage.', link: '/accessibility', linkText: 'Read more on our accessibility page' },
  { q: 'What if I have ADHD or dyslexia?', a: 'Simplifii-OS was built by a dyslexic, ADHD founder specifically for neurodivergent learners. Executive function support, clear visual hierarchy, no guilt notifications, and calm transitions are core to the design.', link: '/accessibility', linkText: 'Read more on our accessibility page' },
  { q: 'Can I use it for non-academic work?', a: 'The current beta is optimised for academic workflows: assignments, theses, and research. Job applications, reports, and decision-making workflows are on the roadmap.' },
];

const A11Y_FEATURES = [
  { icon: 'M4 6h16M4 12h16M4 18h7', title: 'BionicText reading mode', body: 'Bold the first syllable of every word. Five intensity levels. Academic word highlighting built in.' },
  { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', title: 'OpenDyslexic and Atkinson Hyperlegible', body: 'Choose fonts designed for readability. Available across the entire editor.' },
  { icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129', title: 'LiteralMode', body: 'AI output translated to plain English. No jargon, no academic posturing. You control the voice.' },
  { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', title: 'Reading comfort overlays', body: 'Mint, cream, or sky blue tints. Adjustable font scale and line spacing for reduced visual fatigue.' },
  { icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', title: 'Steering Drawer', body: 'Control how much the system scaffolds you. Compass, Sprint, or Map: you set the detail level.' },
  { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', title: 'No guilt. No deficit framing.', body: 'Zero competitive ranking. Zero shame notifications. Strengths-based, trauma-informed design throughout.' },
];

/* ── Scroll reveal hook ──────────────────────────────────────────── */

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, cls: `lp-section ${visible ? 'visible' : ''}` };
}

/* ── Component ───────────────────────────────────────────────────── */

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('workspace');
  const [openFaq, setOpenFaq] = useState(null);

  const scrollToHow = (e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); };
  const toggleFaq = useCallback((i) => setOpenFaq(prev => prev === i ? null : i), []);
  const handleTabKey = useCallback((e) => {
    const ids = SHOWCASE.map(t => t.id);
    const idx = ids.indexOf(activeTab);
    if (e.key === 'ArrowRight') { e.preventDefault(); setActiveTab(ids[(idx + 1) % ids.length]); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setActiveTab(ids[(idx - 1 + ids.length) % ids.length]); }
  }, [activeTab]);

  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal(), r4 = useReveal(), r5 = useReveal(), r6 = useReveal(), r7 = useReveal(), rA = useReveal(), rE = useReveal();

  return (
    <div className="lp-root" style={{ minHeight: '100vh', background: SURFACE_BASE, position: 'relative' }}>
      <MatrixRain />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <a href="#main-content" className="lp-skip-link">Skip to main content</a>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <header className="lp-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 64px', position: 'relative' }}>
        <div className="lp-hero-grid">
          <div className="lp-hero-content">
            <p className="lp-fade-1" style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 16px' }}>
              For every kind of mind
            </p>
            <h1 className="lp-fade-1" style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(2.5rem, 8vw, 5rem)', lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
              <span style={{ background: GRADIENT_EMERALD_CYAN, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Not AI that does your thinking.
              </span>
              <br />
              <span style={{ color: TEXT_PRIMARY }}>AI that protects it.</span>
            </h1>

            <p className="lp-fade-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(1rem, 2.4vw, 1.25rem)', lineHeight: 1.7, maxWidth: 520, margin: '24px 0 36px', color: TEXT_MUTED }}>
              The neuroinclusive thinking layer for every kind of mind.<br />
              Prepare. Organise. Decide. In your own voice.
            </p>

            <div className="lp-fade-3" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
              <Link to="/signup" className="lp-cta-primary" style={{ display: 'inline-block', padding: '16px 40px', background: ACCENT_PULSE, borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, textDecoration: 'none', boxShadow: GLOW_EMERALD, color: SURFACE_BASE }}>
                Start free
              </Link>
              <a href="#how-it-works" onClick={scrollToHow} style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, textDecoration: 'none', color: TEXT_LINK, cursor: 'pointer' }}>
                See it work &#8595;
              </a>
            </div>

            <p className="lp-fade-4" style={{ fontFamily: FONT_SYSTEM, fontSize: 12, letterSpacing: '0.04em', color: TEXT_FAINT }}>
              No credit card. No ads. Your data, never sold.
            </p>
          </div>

          <motion.div
            className="lp-hero-visual lp-fade-3"
            animate={MQ_REDUCE ? {} : { y: [0, -8, 0] }}
            transition={MQ_REDUCE ? {} : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div style={{ position: 'relative', background: GLASS_SURFACE, border: `1px solid ${GLASS_BORDER}`, borderRadius: 16, padding: '40px 40px 32px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: GLOW_EMERALD, overflow: 'visible' }}>
              {/* Typewriter name above avatar */}
              <div className="lp-typewriter" style={{ textAlign: 'center', marginBottom: 20, height: 24 }}>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 14, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT_PULSE, textShadow: `0 0 12px ${ACCENT_GLOW_50}, 0 0 24px ${ACCENT_BORDER_FAINT}` }}>
                  Simplifii-OS
                </span>
                <span className="lp-cursor" style={{ display: 'inline-block', width: 2, height: 16, background: ACCENT_PULSE, marginLeft: 2, verticalAlign: 'middle', boxShadow: `0 0 8px ${ACCENT_PULSE}` }} />
              </div>

              {/* Pulse rings behind avatar */}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div
                  animate={MQ_REDUCE ? {} : { scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                  transition={MQ_REDUCE ? {} : { duration: 3, repeat: Infinity, ease: 'easeOut' }}
                  style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: `1px solid ${ACCENT_PULSE}`, opacity: 0.3 }}
                />
                <motion.div
                  animate={MQ_REDUCE ? {} : { scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                  transition={MQ_REDUCE ? {} : { duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                  style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: `1px solid ${ACCENT_PULSE}`, opacity: 0.2 }}
                />
                <motion.div
                  animate={MQ_REDUCE ? {} : { scale: [1, 1.02, 1] }}
                  transition={MQ_REDUCE ? {} : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <NeuralAvatar persona="browser" size={180} state="listening" />
                </motion.div>
              </div>

              {/* Status line below avatar */}
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_FAINT }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: ACCENT_PULSE, marginRight: 6, boxShadow: `0 0 8px ${ACCENT_PULSE}`, verticalAlign: 'middle' }} />
                  sovereign runtime active
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <main id="main-content">

      {/* Awards removed: belong to Aaron personally. See Sprint V backlog. */}
      <section ref={r1.ref} className={r1.cls} style={{ padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_FAINT, margin: 0 }}>
          Built by a neurodivergent UNSW researcher. Accessibility-first by design, not by deadline.
        </p>
      </section>

      {/* ── PILLARS ───────────────────────────────────────────── */}
      <section id="how-it-works" ref={r2.ref} className={r2.cls} style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', textAlign: 'center', margin: '0 0 12px', background: GRADIENT_EMERALD_CYAN, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Built around how thinking actually works
        </h2>
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: TEXT_MUTED, textAlign: 'center', maxWidth: 520, margin: '0 auto 48px' }}>
          Four stages. One workflow. Every tool you need, nothing you do not.
        </p>

        <div className="lp-pillar-grid">
          {PILLARS.map(p => (
            <div key={p.title} className="lp-pillar-card" style={{ background: GLASS_SURFACE, border: `1px solid ${GLASS_BORDER}`, borderRadius: 10, padding: '32px 24px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT_PULSE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }} aria-hidden="true">
                <path d={p.icon} />
              </svg>
              <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_PRIMARY, margin: '0 0 12px' }}>{p.title}</h3>
              <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: TEXT_MUTED, margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BUILT FOR EVERY KIND OF MIND (accessibility features) ── */}
      <section ref={rA.ref} className={rA.cls} style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', textAlign: 'center', margin: '0 0 12px', background: GRADIENT_EMERALD_CYAN, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Built for every kind of mind
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: TEXT_MUTED, textAlign: 'center', maxWidth: 560, margin: '0 auto 48px' }}>
          Neuroinclusive by architecture. Every feature designed with UDL 3.0 principles and WCAG 2.2 AA as the baseline.
        </p>
        <div className="lp-a11y-grid">
          {A11Y_FEATURES.map(f => (
            <div key={f.title} className="lp-a11y-card" style={{ background: GLASS_SURFACE, border: `1px solid ${GLASS_BORDER}`, borderRadius: 10, padding: '28px 24px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT_PULSE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14 }} aria-hidden="true">
                <path d={f.icon} />
              </svg>
              <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 10px' }}>{f.title}</h3>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: TEXT_MUTED, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_FAINT, textAlign: 'center', marginTop: 32 }}>
          Simplifii-OS meets WCAG 2.2 Level AA. Not because we had to. Because it is the baseline.{' '}
          <Link to="/accessibility" style={{ color: ACCENT_PULSE, textDecoration: 'underline' }}>Read our accessibility commitment</Link>
        </p>
      </section>

      {/* ── EDUCATION LEVELS ─────────────────────────────────── */}
      <EducationLevels revealRef={rE.ref} revealCls={rE.cls} />

      {/* ── PRODUCT SHOWCASE ──────────────────────────────────── */}
      <section ref={r3.ref} className={r3.cls} style={{ maxWidth: 960, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', textAlign: 'center', margin: '0 0 40px', color: TEXT_PRIMARY }}>
          See it in action
        </h2>
        <div role="tablist" aria-label="Product showcase" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32, flexWrap: 'wrap' }} onKeyDown={handleTabKey}>
          {SHOWCASE.map(t => (
            <button key={t.id} type="button" role="tab" id={`showcase-tab-${t.id}`} aria-selected={activeTab === t.id} aria-controls={`showcase-panel-${t.id}`} tabIndex={activeTab === t.id ? 0 : -1} onClick={() => setActiveTab(t.id)} style={{ padding: '8px 20px', background: activeTab === t.id ? ACCENT_GLASS_STRONG : 'transparent', border: `1px solid ${activeTab === t.id ? ACCENT_BORDER_STRONG : GLASS_BORDER}`, borderRadius: 20, fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: activeTab === t.id ? ACCENT_PULSE : TEXT_MUTED, cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`showcase-panel-${activeTab}`} aria-labelledby={`showcase-tab-${activeTab}`} tabIndex={0} style={{ background: GLASS_SURFACE, border: `1px solid ${GLASS_BORDER}`, borderRadius: 12, overflow: 'hidden', boxShadow: GLOW_EMERALD }}>
          <ShowcasePreview activeTab={activeTab} />
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: TEXT_MUTED, textAlign: 'center', marginTop: 20 }}>
          {SHOWCASE.find(t => t.id === activeTab)?.desc}
        </p>
      </section>

      {/* ── DIFFERENTIATION ───────────────────────────────────── */}
      <section ref={r4.ref} className={r4.cls} style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px' }}>
        <div className="lp-diff-grid">
          <div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', margin: '0 0 20px', color: TEXT_PRIMARY }}>Not AI doing your homework</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 17, lineHeight: 1.75, color: TEXT_MUTED }}>
              Most AI tools write for you. Simplifii-OS works with you. Every claim is checked against sources you upload. Every word stays yours. The work is harder than ChatGPT. The results are actually defensible.
            </p>
          </div>
          <table className="lp-comparison-table" aria-label="Feature comparison: ChatGPT versus Simplifii-OS">
            <thead>
              <tr>
                <th scope="col" style={{ color: ACCENT_AMBER }}>ChatGPT</th>
                <th scope="col" style={{ color: ACCENT_PULSE }}>Simplifii-OS</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_FAINT }}>
                    <span aria-hidden="true" style={{ marginRight: 6, opacity: 0.5 }}>{'\u2717'}</span>{c.them}
                  </td>
                  <td style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY }}>
                    <span aria-hidden="true" style={{ marginRight: 6, color: ACCENT_PULSE }}>{'\u2713'}</span>{c.us}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section ref={r5.ref} className={r5.cls} style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', textAlign: 'center', margin: '0 0 48px', color: TEXT_PRIMARY }}>Common questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {FAQS.map((f, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
              <button type="button" id={`faq-q-${i}`} onClick={() => toggleFaq(i)} aria-expanded={openFaq === i} aria-controls={`faq-answer-${i}`} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 44 }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 500, color: TEXT_PRIMARY, paddingRight: 16 }}>{f.q}</span>
                <span aria-hidden="true" style={{ fontFamily: FONT_SYSTEM, fontSize: 18, color: TEXT_FAINT, flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              <div id={`faq-answer-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className={`lp-faq-answer ${openFaq === i ? 'open' : ''}`}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.7, color: TEXT_MUTED, margin: '0 0 20px' }}>
                  {f.a}
                  {f.link && <>{' '}<Link to={f.link} style={{ color: ACCENT_PULSE, textDecoration: 'underline' }}>{f.linkText}</Link></>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOUNDER ───────────────────────────────────────────── */}
      <section ref={r6.ref} className={r6.cls} style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: ACCENT_GLASS_STRONG, border: `2px solid ${ACCENT_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 20, fontWeight: 800, color: ACCENT_PULSE }}>A</span>
        </div>
        <div style={{ borderLeft: `2px solid ${ACCENT_BORDER}`, paddingLeft: 24, textAlign: 'left', maxWidth: 520, margin: '0 auto' }}>
          <blockquote style={{ fontFamily: FONT_BODY, fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontStyle: 'italic', lineHeight: 1.75, margin: '0 0 20px', padding: 0, border: 'none', color: TEXT_PRIMARY }}>
            {"I built Simplifii-OS because I'm dyslexic, ADHD, and tired of academic tools that pretend everyone thinks the same way. This is the tool I needed at 17 and still need at 36."}
          </blockquote>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 12, letterSpacing: '0.04em', color: TEXT_FAINT, margin: 0 }}>Aaron Saint-James, Founder + MRes, UNSW</p>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section ref={r6.ref} className={r6.cls} style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', textAlign: 'center', margin: '0 0 12px', color: TEXT_PRIMARY }}>Pricing</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: TEXT_MUTED, textAlign: 'center', margin: '0 auto 48px', maxWidth: 480 }}>Free for learners. Sustainable for the platform.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* Learner */}
          <div style={{ background: GLASS_SURFACE, border: `2px solid ${ACCENT_PULSE}`, borderRadius: 10, padding: '28px 24px', backdropFilter: 'blur(8px)' }}>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 8px' }}>Learner</p>
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 16px' }}>Free forever</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Every feature', 'No credit card', 'No ads', 'Your data, never sold'].map(b => (
                <li key={b} style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: ACCENT_PULSE, fontSize: 12 }}>{'\u2713'}</span> {b}
                </li>
              ))}
            </ul>
            <Link to="/signup" style={{ display: 'block', textAlign: 'center', padding: '12px 0', background: ACCENT_PULSE, borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, textDecoration: 'none', color: SURFACE_BASE }}>Start free</Link>
          </div>
          {/* Plus */}
          <div style={{ background: GLASS_SURFACE, border: `1px solid ${GLASS_BORDER}`, borderRadius: 10, padding: '28px 24px', backdropFilter: 'blur(8px)' }}>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 8px' }}>Plus</p>
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 4px' }}>$9.99/mo</p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: '0 0 16px' }}>or $89/year AUD. Same product. Supporting the mission.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Everything in Learner', 'Unlimited course history', 'Priority AI response', 'Custom themes', 'Early access to new features'].map(b => (
                <li key={b} style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: ACCENT_PULSE, fontSize: 12 }}>{'\u2713'}</span> {b}
                </li>
              ))}
            </ul>
            <Link to="/signup?tier=plus" style={{ display: 'block', textAlign: 'center', padding: '12px 0', background: 'transparent', border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, textDecoration: 'none', color: TEXT_MUTED }}>Choose Plus</Link>
          </div>
          {/* Institutional */}
          <div style={{ background: GLASS_SURFACE, border: `1px solid ${GLASS_BORDER}`, borderRadius: 10, padding: '28px 24px', backdropFilter: 'blur(8px)' }}>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 8px' }}>Institutional</p>
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 4px' }}>Custom</p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: '0 0 16px' }}>For universities, schools, and providers.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Multi-user deployment', 'Accessibility compliance reporting', 'UDL alignment evidence', 'Anonymised cohort analytics', 'SSO + admin dashboard'].map(b => (
                <li key={b} style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: ACCENT_PULSE, fontSize: 12 }}>{'\u2713'}</span> {b}
                </li>
              ))}
            </ul>
            <a href="mailto:aaron@simplifii.com.au?subject=Institutional%20pilot" style={{ display: 'block', textAlign: 'center', padding: '12px 0', background: 'transparent', border: `1px solid ${GLASS_BORDER}`, borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, textDecoration: 'none', color: TEXT_MUTED }}>Talk to us about pilots</a>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section style={{ width: '100%', padding: '80px 24px', textAlign: 'center', background: `radial-gradient(ellipse at center bottom, ${ACCENT_GLASS_SUBTLE} 0%, transparent 60%)` }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', margin: '0 0 12px', color: TEXT_PRIMARY }}>
          Stop using AI tools that erase your voice.
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: TEXT_MUTED, margin: '0 0 32px' }}>
          Simplifii-OS is free during beta. Built for every kind of mind. Used from Year 7 to PhD.
        </p>
        <Link to="/signup" className="lp-cta-primary" style={{ display: 'inline-block', padding: '16px 48px', background: ACCENT_PULSE, borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, textDecoration: 'none', boxShadow: GLOW_EMERALD, color: SURFACE_BASE }}>
          Start free
        </Link>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, marginTop: 16 }}>
          Already have an account? <Link to="/login" style={{ color: ACCENT_PULSE, textDecoration: 'underline' }}>Sign in</Link>
        </p>
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, letterSpacing: '0.04em', marginTop: 8 }}>
          No credit card. No ads. Your data, never sold.
        </p>
      </section>

      </main>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{ width: '100%', borderTop: `1px solid ${GLASS_BORDER}`, padding: '48px 24px 32px' }}>
        <div className="lp-footer-grid" style={{ maxWidth: 960, margin: '0 auto' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, justifyContent: 'inherit' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, background: ACCENT_PULSE, fontFamily: FONT_SYSTEM, fontWeight: 800, fontSize: 12, color: SURFACE_BASE }}>S</span>
              <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: TEXT_PRIMARY }}>Simplifii-OS</span>
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_FAINT, margin: '0 0 6px', lineHeight: 1.6 }}>
              The thinking layer between you and the work that matters.
            </p>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_LABEL, margin: 0 }}>
              Built in Sydney, Australia
            </p>
          </div>
          <div>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 12px' }}>Product</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-label="Product links">
              <Link to="/accessibility" style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, textDecoration: 'none' }}>Accessibility</Link>
              <Link to="/privacy" style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, textDecoration: 'none' }}>Privacy</Link>
              <Link to="/terms" style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, textDecoration: 'none' }}>Terms</Link>
              <Link to="/ai-use" style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, textDecoration: 'none' }}>AI Use</Link>
            </nav>
          </div>
          <div>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 12px' }}>Connect</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-label="Connect links">
              <a href="mailto:aaron@simplifii.com.au" style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, textDecoration: 'none' }}>Email</a>
            </nav>
          </div>
        </div>
        <div style={{ maxWidth: 960, margin: '32px auto 0', paddingTop: 20, borderTop: `1px solid ${GLASS_BORDER}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_LABEL, letterSpacing: '0.04em', margin: 0 }}>&copy; 2026 Simplifii Pty Ltd, ABN [Aaron will provide]. Patent pending.</p>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_LABEL, letterSpacing: '0.04em', margin: 0 }}>
            Made with care for every kind of mind | <a href="https://buymeacoffee.com/simplifii" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT_PULSE, textDecoration: 'none' }}>Buy us a coffee</a>
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}
