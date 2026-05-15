import React from 'react';
import { Link } from 'react-router-dom';
import {
  SURFACE_BASE,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../theme/tokens';

export default function AccessibilityPage() {
  return (
    <div style={s.root}>
      <article style={s.card}>
        <Link to="/" style={s.backLink}>&larr; Back to Simplifii-OS</Link>

        <h1 style={s.h1}>Accessibility</h1>
        <p style={s.updated}>Last updated: 14 May 2026</p>

        <Section title="Our commitment">
          <P>Simplifii-OS is built for neurodivergent learners first. Accessibility is not a compliance layer added after the product shipped. It is an architectural decision made before the first line of code was written.</P>
          <P>We believe that if a tool works for someone with ADHD, dyslexia, or executive function differences, it works better for everyone. That is the starting point, not the afterthought.</P>
        </Section>

        <Section title="Standards we follow">
          <P>Simplifii-OS is designed to meet or exceed:</P>
          <Ul>
            <Li><strong>WCAG 2.2 Level AA</strong> (Web Content Accessibility Guidelines). This covers perceivable, operable, understandable, and robust criteria across the entire application.</Li>
            <Li><strong>UDL 3.0</strong> (Universal Design for Learning, CAST 2024). We apply UDL principles both to the product interface and to the curriculum content the product processes. Our UDL audit engine checks uploaded briefs and rubrics against 30+ barrier patterns.</Li>
            <Li><strong>Australian Disability Discrimination Act 1992</strong> (DDA). As an Australian company, we build to the accessibility standards expected under Australian law.</Li>
            <Li><strong>AHEAD Ireland guidelines</strong> for inclusive assessment practice, informing our rubric translation and assessment scaffolding tools.</Li>
          </Ul>
        </Section>

        <Section title="What we have built">
          <P>These are real features, not aspirational goals. Every item on this list is shipped and available in the current beta:</P>
          <Ul>
            <Li><strong>Keyboard navigation throughout.</strong> No mouse required. Every interactive element is reachable and operable via keyboard alone.</Li>
            <Li><strong>Visible focus indicators</strong> on all interactive elements (WCAG 2.4.13). Near-white ring with greater than 16:1 contrast on all dark surfaces.</Li>
            <Li><strong>Reduced motion support.</strong> Both the operating system media query (prefers-reduced-motion) and a manual toggle in settings. All animations stop when either is active.</Li>
            <Li><strong>High contrast theme.</strong> White-on-black with strengthened borders. Available as a toggle in the canvas settings.</Li>
            <Li><strong>OpenDyslexic and Atkinson Hyperlegible font options.</strong> Available in the editor. Atkinson Hyperlegible is designed for maximum character differentiation. OpenDyslexic is designed for readers with dyslexia.</Li>
            <Li><strong>BionicText reading mode.</strong> Bolds the first syllable of every word at five intensity levels. Includes academic word highlighting. Designed for faster scanning and reduced reading fatigue.</Li>
            <Li><strong>LiteralMode.</strong> Transforms all AI output into plain, imperative English. Strips jargon, hedging, and passive voice. You control how the AI speaks to you.</Li>
            <Li><strong>Reading comfort overlays.</strong> Mint, cream, or sky blue tints to reduce visual fatigue. Adjustable font scale (normal, large, extra large) and line spacing (normal, relaxed, loose).</Li>
            <Li><strong>Steering Drawer.</strong> Three detail levels (Compass, Sprint, Map) that control how much scaffolding and future information the system reveals. You set the pace.</Li>
            <Li><strong>Strengths-based, trauma-informed language.</strong> No guilt notifications. No deficit framing. No competitive ranking. No "you missed a day" shame. No "superpower" erasure of difficulty.</Li>
            <Li><strong>History of Thought.</strong> A transparent audit trail of every AI contribution and learner edit. The student always knows what the AI did and what they did.</Li>
            <Li><strong>Touch targets minimum 44 by 44 pixels</strong> throughout the application (WCAG 2.5.8).</Li>
          </Ul>
        </Section>

        <Section title="Known limitations">
          <P>We are honest about what is not yet done:</P>
          <Ul>
            <Li>Screen reader testing across NVDA, JAWS, and VoiceOver is ongoing. We have tested primarily with VoiceOver on macOS. If you encounter issues with another screen reader, please tell us.</Li>
            <Li>Mobile touch target audit is in progress. Some components may fall below the 44px minimum on smaller viewports.</Li>
            <Li>The reading ruler feature (state exists in settings) does not yet render visually. This is planned for a near-term sprint.</Li>
            <Li>Voice input support is planned but depends on upstream API availability.</Li>
            <Li>We have not yet achieved WCAG AAA compliance. Level AA is our current baseline.</Li>
          </Ul>
          <P>We welcome feedback on areas we have missed. Accessibility is iterative. We are committed to improving continuously.</P>
        </Section>

        <Section title="Feedback">
          <P>If you encounter an accessibility barrier in Simplifii-OS, please contact us. Accessibility feedback is treated as priority.</P>
          <P>
            Email: <a href="mailto:aaron@simplifii.com.au" style={s.link}>aaron@simplifii.com.au</a><br />
            Subject line: "Accessibility feedback"
          </P>
          <P>We aim to respond within 48 hours and to address confirmed barriers within the current or next sprint cycle.</P>
        </Section>

        <div style={{ marginTop: 32 }}>
          <Link to="/" style={s.backLink}>&larr; Back to Simplifii-OS</Link>
        </div>
      </article>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={s.h2}>{title}</h2>
      {children}
    </section>
  );
}

function P({ children }) {
  return <p style={s.body}>{children}</p>;
}

function Ul({ children }) {
  return <ul style={s.ul}>{children}</ul>;
}

function Li({ children }) {
  return <li style={s.li}>{children}</li>;
}

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    background: SURFACE_BASE,
    padding: '48px 24px',
  },
  card: {
    width: '100%',
    maxWidth: 720,
  },
  backLink: {
    fontFamily: FONT_SYSTEM,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: 24,
  },
  h1: {
    fontFamily: FONT_BODY,
    fontWeight: 800,
    fontSize: 32,
    margin: '0 0 4px',
  },
  h2: {
    fontFamily: FONT_BODY,
    fontWeight: 700,
    fontSize: 18,
    margin: '0 0 10px',
  },
  updated: {
    fontFamily: FONT_SYSTEM,
    fontSize: 11,
    letterSpacing: '0.06em',
    margin: '0 0 36px',
  },
  body: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    lineHeight: 1.7,
    margin: '0 0 12px',
  },
  ul: {
    margin: '0 0 12px',
    paddingLeft: 20,
  },
  li: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    lineHeight: 1.7,
    marginBottom: 8,
  },
  link: {
    textDecoration: 'underline',
  },
};
