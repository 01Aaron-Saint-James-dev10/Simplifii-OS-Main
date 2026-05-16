import React from 'react';
import {
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  GLASS_SURFACE, GLASS_BORDER,
  FONT_DISPLAY, FONT_SYSTEM, FONT_BODY,
  GRADIENT_EMERALD_CYAN,
} from '../../theme/tokens';

const LEVELS = [
  { icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', title: 'Primary school', body: 'Build curiosity early. Visual scaffolds, plain language, and reading comfort for younger learners.' },
  { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', title: 'Secondary school', body: 'From Year 7 to HSC. Translate assignment rubrics, plan multi-week assessments, verify every claim before submission.' },
  { icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5', title: 'Tertiary (undergrad)', body: 'Manage every subject in one place. Decode the brief. Build your space. Submit with confidence.' },
  { icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', title: 'Postgrad and research', body: 'Built for MRes, PhD, and research professionals. Phases, strands, chapters, citations, and methodology logs in one architecture.' },
  { icon: 'M11.42 15.17l-5.42 3.24V5.78l5.42 3.24m7.16-3.24v12.63l-5.42-3.24M3 5.78v12.63l5.42-3.24m0-6.15l5.42 3.24 5.42-3.24', title: 'TAFE and vocational', body: 'Practical learning, plain-language scaffolds, and assessment support that works with how vocational training actually flows.' },
  { icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25', title: 'Homeschooling', body: 'For families choosing their own learning path. Flexible spaces, strengths-based reflection, parental privacy controls.' },
  { icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10', title: 'Academics and educators', body: 'For staff writing research, grants, and teaching materials. Co-authoring, citation integrity, and version history that respects your voice.' },
  { icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21', title: 'Institutions', body: 'For universities, schools, and providers. Multi-user deployment, accessibility compliance reporting, and UDL alignment evidence.', cta: true },
];

export default function EducationLevels({ revealRef, revealCls }) {
  return (
    <section ref={revealRef} className={revealCls} style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 24px' }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', textAlign: 'center', margin: '0 0 12px', background: GRADIENT_EMERALD_CYAN, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        Wherever you are in your learning journey
      </h2>
      <p style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: TEXT_MUTED, textAlign: 'center', maxWidth: 580, margin: '0 auto 48px' }}>
        Simplifii-OS adapts to where you are. The tools, the language, and the cognitive load adjust to your stage.
      </p>

      <div className="lp-edu-grid">
        {LEVELS.map(l => (
          <div key={l.title} className="lp-edu-card" style={{ background: GLASS_SURFACE, border: `1px solid ${GLASS_BORDER}`, borderRadius: 12, padding: '24px 20px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT_PULSE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }} aria-hidden="true">
              <path d={l.icon} />
            </svg>
            <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_PRIMARY, margin: '0 0 8px' }}>{l.title}</h3>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: TEXT_MUTED, margin: 0 }}>{l.body}</p>
            {l.cta && (
              <a href="mailto:aaron@simplifii.com.au?subject=Institutional%20enquiry" style={{ display: 'inline-block', marginTop: 12, fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: ACCENT_PULSE, textDecoration: 'underline' }}>
                Talk to us about institutional pilots
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
