import React from 'react';
import { Link } from 'react-router-dom';
import {
  SURFACE_BASE, SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER, ACCENT_GLASS,
  GLASS_SURFACE, GLASS_BORDER,
  FONT_DISPLAY, FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../theme/tokens';

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color: TEXT_PRIMARY, margin: '0 0 12px', paddingBottom: 8, borderBottom: `1px solid ${SURFACE_RAISED}` }}>{title}</h2>
      {children}
    </section>
  );
}

function P({ children }) {
  return <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.75, color: TEXT_MUTED, margin: '0 0 12px' }}>{children}</p>;
}

function Li({ children }) {
  return (
    <li style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.75, color: TEXT_MUTED, marginBottom: 6, display: 'flex', gap: 8 }}>
      <span style={{ color: ACCENT_PULSE, flexShrink: 0 }}>{'\u2713'}</span>
      <span>{children}</span>
    </li>
  );
}

function NeverLi({ children }) {
  return (
    <li style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.75, color: TEXT_MUTED, marginBottom: 6, display: 'flex', gap: 8 }}>
      <span style={{ color: '#f43f5e', flexShrink: 0 }}>{'\u2717'}</span>
      <span>{children}</span>
    </li>
  );
}

export default function AiUsePage() {
  return (
    <div style={{ minHeight: '100vh', background: SURFACE_BASE, padding: '48px 24px 80px' }}>
      <article style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link to="/" style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, textDecoration: 'none', letterSpacing: '0.06em' }}>{'\u2190'} Back to Simplifii-OS</Link>

        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', color: TEXT_PRIMARY, margin: '24px 0 8px' }}>
          How Simplifii-OS uses AI
        </h1>
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT, margin: '0 0 32px', letterSpacing: '0.06em' }}>Last updated: 16 May 2026</p>

        <Section title="We see you.">
          <P>You came here because the system was never built for your brain. You learned to hide your difficulty, or fight it alone, or pretend you were keeping up when you were not.</P>
          <P>AI is being marketed to you as a shortcut. We do not think you need a shortcut. We think you need a tool that respects how you actually think.</P>
          <P>This page tells you exactly how AI is used here. No marketing fog. No hidden defaults. You decide what is right for you.</P>
        </Section>

        <div style={{ padding: '20px 24px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS + 4, marginBottom: 32 }}>
          <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: ACCENT_PULSE, margin: '0 0 8px' }}>Our promise to you</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Li><strong>You stay the author.</strong> AI assists. You decide. Always.</Li>
            <Li><strong>Your voice is yours.</strong> We will never train models on what you write here.</Li>
            <Li><strong>Your work stays defensible.</strong> Every AI suggestion is logged so you can show exactly what AI did and what you did.</Li>
            <Li><strong>You can opt out.</strong> Of any feature, at any time, with no penalty.</Li>
          </ul>
        </div>

        <Section title="What AI does in Simplifii-OS">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Li><strong>Translating</strong> complex assignment briefs into plain language</Li>
            <Li><strong>Suggesting</strong> structure, headings, or outlines when you are stuck</Li>
            <Li><strong>Drafting</strong> starting points you rewrite in your own voice</Li>
            <Li><strong>Matching</strong> citations in your text against sources you have uploaded</Li>
            <Li><strong>Flagging</strong> claims that do not have support in your sources</Li>
            <Li><strong>Summarising</strong> long documents so you can find what matters</Li>
            <Li><strong>Suggesting</strong> which task to focus on next when overwhelm sets in</Li>
            <Li><strong>Offering</strong> breaks, focus prompts, and gentle nudges when you need them</Li>
          </ul>
        </Section>

        <Section title="What AI will never do here">
          <P>We chose to draw these lines. They will not move.</P>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <NeverLi>AI will <strong>never grade</strong> your work.</NeverLi>
            <NeverLi>AI will <strong>never predict</strong> your grade or your future performance.</NeverLi>
            <NeverLi>AI will <strong>never make decisions</strong> about your academic standing.</NeverLi>
            <NeverLi>AI will <strong>never surveil, track, or profile</strong> you for any third party.</NeverLi>
            <NeverLi>AI will <strong>never write</strong> your final submission for you.</NeverLi>
          </ul>
          <P>If a future feature could blur any of these lines, we will not ship it.</P>
        </Section>

        <Section title="Which AI models we use">
          <P>Currently, Simplifii-OS uses <strong>Anthropic's Claude family</strong> for text reasoning (briefs, suggestions, tutoring, scoring). Local browser-based detection (no AI model) for citation pattern matching. Your text never leaves your device for that.</P>
          <P>We will update this section every time our model use changes. Transparency is not a feature. It is the foundation.</P>
        </Section>

        <Section title="Your data and AI training">
          <div style={{ padding: '16px 20px', background: GLASS_SURFACE, border: `1px solid ${GLASS_BORDER}`, borderRadius: BORDER_RADIUS + 4, marginBottom: 12 }}>
            <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: TEXT_PRIMARY, margin: '0 0 4px' }}>We do not use your content to train any AI model.</p>
            <P>Not ours. Not anyone else's. When we send text to Anthropic for processing, they process it and return the response. They do not retain it. They do not train on it.</P>
          </div>
          <P>Your drafts. Your ideas. Your voice. Yours.</P>
        </Section>

        <Section title="What you should always verify">
          <P>AI is powerful. AI is also confidently wrong sometimes. Trust nothing without checking:</P>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Li><strong>Every citation.</strong> AI can hallucinate sources that look real but do not exist.</Li>
            <Li><strong>Every claim of fact.</strong> AI can state wrong things with absolute confidence.</Li>
            <Li><strong>Every interpretation of a rubric.</strong> Your teacher knows what they want.</Li>
            <Li><strong>Every suggested rewrite.</strong> AI can flatten your voice or change your argument.</Li>
          </ul>
          <P>Your judgement is the final word. Always.</P>
        </Section>

        <Section title="How to disclose AI use to your institution">
          <P><strong>History of Thought</strong>: Simplifii-OS keeps a transparent log of every AI suggestion in your project.</P>
          <P><strong>AI Use Receipt</strong>: You can export a one-page summary showing exactly where AI was used.</P>
          <P><strong>Your decision</strong>: Submitting the receipt is your choice. We give you the document. You decide what to share.</P>
        </Section>

        <Section title="If something goes wrong">
          <P>If Simplifii-OS gives you AI output that is misleading, incorrect, biased, or harmful, please tell us.</P>
          <P>Email <a href="mailto:aaron@simplifii.com.au?subject=AI%20output%20report" style={{ color: ACCENT_PULSE }}>aaron@simplifii.com.au</a> with subject line "AI output report".</P>
          <P>You are not bothering us. You are helping us.</P>
        </Section>

        <div style={{ padding: '24px', borderLeft: `2px solid ${ACCENT_BORDER}`, marginTop: 40 }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, fontStyle: 'italic', lineHeight: 1.75, color: TEXT_PRIMARY, margin: '0 0 12px' }}>
            {"I am dyslexic. I am ADHD. I have spent my life in classrooms that were not built for how I think. Simplifii-OS exists because I needed it at 17 and I still need it at 36. I do not use AI to replace your thinking. I use AI to remove the barriers that stop your thinking from reaching the page."}
          </p>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 12, color: TEXT_FAINT, margin: 0, letterSpacing: '0.04em' }}>
            Aaron Saint-James, Founder + MRes, UNSW Sydney
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/" style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: ACCENT_PULSE, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            {'\u2190'} Back to Simplifii-OS
          </Link>
        </div>
      </article>
    </div>
  );
}
