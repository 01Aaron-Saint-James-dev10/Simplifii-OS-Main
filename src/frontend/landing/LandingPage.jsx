import React from 'react';
import { Link } from 'react-router-dom';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT, TEXT_LABEL,
  ACCENT_PULSE, ACCENT_HOVER, ACCENT_BORDER, ACCENT_GLOW,
  ACCENT_GLASS, ACCENT_GLASS_STRONG, ACCENT_BORDER_STRONG,
  ACCENT_GLOW_50,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS, GRADIENT_EMERALD_CYAN,
} from '../../theme/tokens';

const PILLARS = [
  {
    title: 'Prepare',
    body: 'Decode the brief. Translate the rubric. Know what is actually being asked before you start.',
  },
  {
    title: 'Organise',
    body: 'Drop in your sources. Sort your thinking. Build a workspace that holds your ideas as you write.',
  },
  {
    title: 'Decide',
    body: "When you are stuck, surface the real options. When you are wrong, get told kindly.",
  },
  {
    title: 'Follow through',
    body: 'Every claim verified. Every citation real. Submission-ready, in your own words.',
  },
];

const BADGES = [
  'NDRP Research Leadership Award 2026',
  'ADCET Accessibility in Action 2023',
  'UN SDG Global Citizenship Award 2025',
];

export default function LandingPage() {
  const scrollToHow = (e) => {
    e.preventDefault();
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={s.root}>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <header style={s.hero}>
        <div style={s.heroInner}>
          <h1 style={s.headline}>
            Not AI that does your thinking.
            <br />
            AI that protects it.
          </h1>
          <p style={s.subheadline}>
            Simplifii-OS is the workflow layer between you and your ideas:
            whether that is an assignment, a thesis, a job application, or a
            hard decision. Prepare. Organise. Decide. Follow through. In your
            own voice.
          </p>
          <div style={s.ctaRow}>
            <Link to="/signup" style={s.ctaPrimary}>Start free</Link>
            <a href="#how-it-works" onClick={scrollToHow} style={s.ctaSecondary}>
              See how it works
            </a>
          </div>
          <p style={s.micro}>No credit card. No ads. Your data stays yours.</p>
        </div>
      </header>

      {/* ── Social proof ──────────────────────────────────────── */}
      <section style={s.proofStrip}>
        <p style={s.proofText}>
          Built by a neurodivergent UNSW researcher and award-winning advocate
        </p>
        <div style={s.badgeRow}>
          {BADGES.map((b) => (
            <span key={b} style={s.badge}>{b}</span>
          ))}
        </div>
      </section>

      {/* ── Pillars ───────────────────────────────────────────── */}
      <section id="how-it-works" style={s.section}>
        <h2 style={s.sectionTitle}>Built around how thinking actually works</h2>
        <div style={s.pillarGrid}>
          {PILLARS.map((p) => (
            <div key={p.title} style={s.pillarCard}>
              <h3 style={s.pillarTitle}>{p.title}</h3>
              <p style={s.pillarBody}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Differentiation ───────────────────────────────────── */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Not AI doing your homework</h2>
        <p style={s.bodyText}>
          Most AI tools write for you. Simplifii-OS works with you. Every
          claim is checked against sources you upload. Every word stays yours.
          The work is harder than ChatGPT. The results are actually defensible.
        </p>
      </section>

      {/* ── Founder note ──────────────────────────────────────── */}
      <section style={s.founderSection}>
        <blockquote style={s.founderQuote}>
          "I built Simplifii-OS because I am dyslexic, ADHD, and tired of
          academic tools that pretend everyone thinks the same way. This is the
          tool I needed at 17. And the one I still need at 36."
        </blockquote>
        <p style={s.founderName}>Aaron Saint-James, Founder</p>
        <p style={s.founderRole}>MRes Candidate, UNSW Sydney</p>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section style={s.finalCta}>
        <Link to="/signup" style={s.ctaPrimary}>Start free</Link>
        <p style={s.micro}>
          Built for students. Used by researchers. Free for all learners during beta.
        </p>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={s.footer}>
        <div style={s.footerBrand}>
          <span style={s.footerLogo}>S</span>
          <span style={s.footerTitle}>Simplifii-OS</span>
        </div>
        <nav style={s.footerNav} aria-label="Footer navigation">
          <Link to="/privacy" style={s.footerLink}>Privacy</Link>
          <Link to="/terms" style={s.footerLink}>Terms</Link>
          <Link to="/ai-use" style={s.footerLink}>AI Use</Link>
          <a href="mailto:aaron@simplifii.com.au" style={s.footerLink}>Contact</a>
        </nav>
        <p style={s.copyright}>&copy; 2026 Simplifii Pty Ltd. Built in Australia.</p>
      </footer>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  root: {
    minHeight: '100vh',
    background: SURFACE_BASE,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // Hero
  hero: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '80px 24px 48px',
  },
  heroInner: {
    maxWidth: 680,
    textAlign: 'center',
  },
  headline: {
    fontFamily: FONT_BODY,
    fontWeight: 800,
    fontSize: 'clamp(28px, 5vw, 48px)',
    lineHeight: 1.15,
    background: GRADIENT_EMERALD_CYAN,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 24px',
  },
  subheadline: {
    fontFamily: FONT_BODY,
    fontSize: 'clamp(15px, 2.2vw, 18px)',
    lineHeight: 1.65,
    maxWidth: 560,
    margin: '0 auto 32px',
  },
  ctaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  ctaPrimary: {
    display: 'inline-block',
    padding: '14px 36px',
    background: ACCENT_PULSE,
    borderRadius: BORDER_RADIUS + 2,
    fontFamily: FONT_BODY,
    fontSize: 16,
    fontWeight: 700,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  ctaSecondary: {
    fontFamily: FONT_BODY,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    borderBottom: `1px solid transparent`,
    cursor: 'pointer',
  },
  micro: {
    fontFamily: FONT_SYSTEM,
    fontSize: 11,
    letterSpacing: '0.04em',
    marginTop: 8,
  },

  // Social proof
  proofStrip: {
    width: '100%',
    maxWidth: 720,
    padding: '32px 24px',
    textAlign: 'center',
    borderTop: `1px solid ${SURFACE_RAISED}`,
    borderBottom: `1px solid ${SURFACE_RAISED}`,
  },
  proofText: {
    fontFamily: FONT_BODY,
    fontSize: 13,
    margin: '0 0 14px',
  },
  badgeRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  badge: {
    fontFamily: FONT_SYSTEM,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '5px 10px',
    border: `1px solid ${ACCENT_BORDER}`,
    borderRadius: BORDER_RADIUS,
  },

  // Sections
  section: {
    width: '100%',
    maxWidth: 800,
    padding: '64px 24px',
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: FONT_BODY,
    fontWeight: 700,
    fontSize: 'clamp(20px, 3vw, 28px)',
    margin: '0 0 32px',
  },
  bodyText: {
    fontFamily: FONT_BODY,
    fontSize: 16,
    lineHeight: 1.7,
    maxWidth: 600,
    margin: '0 auto',
  },

  // Pillars
  pillarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  pillarCard: {
    background: SURFACE_CARD,
    border: `1px solid ${ACCENT_BORDER}`,
    borderRadius: BORDER_RADIUS + 2,
    padding: '28px 20px',
    textAlign: 'left',
  },
  pillarTitle: {
    fontFamily: FONT_SYSTEM,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    margin: '0 0 10px',
  },
  pillarBody: {
    fontFamily: FONT_BODY,
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },

  // Founder
  founderSection: {
    width: '100%',
    maxWidth: 560,
    padding: '48px 24px',
    textAlign: 'center',
    borderTop: `1px solid ${SURFACE_RAISED}`,
  },
  founderQuote: {
    fontFamily: FONT_BODY,
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 1.7,
    margin: '0 0 16px',
    padding: 0,
    border: 'none',
  },
  founderName: {
    fontFamily: FONT_BODY,
    fontSize: 14,
    fontWeight: 600,
    margin: '0 0 2px',
  },
  founderRole: {
    fontFamily: FONT_SYSTEM,
    fontSize: 11,
    letterSpacing: '0.04em',
    margin: 0,
  },

  // Final CTA
  finalCta: {
    width: '100%',
    maxWidth: 600,
    padding: '48px 24px 64px',
    textAlign: 'center',
  },

  // Footer
  footer: {
    width: '100%',
    padding: '32px 24px',
    borderTop: `1px solid ${SURFACE_RAISED}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  footerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  footerLogo: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS,
    background: ACCENT_PULSE,
    fontFamily: FONT_SYSTEM,
    fontWeight: 800,
    fontSize: 11,
  },
  footerTitle: {
    fontFamily: FONT_BODY,
    fontWeight: 600,
    fontSize: 14,
  },
  footerNav: {
    display: 'flex',
    gap: 20,
  },
  footerLink: {
    fontFamily: FONT_BODY,
    fontSize: 13,
    textDecoration: 'none',
  },
  copyright: {
    fontFamily: FONT_SYSTEM,
    fontSize: 10,
    letterSpacing: '0.04em',
    margin: 0,
  },
};
