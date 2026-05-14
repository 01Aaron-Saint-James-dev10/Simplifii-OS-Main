import React from 'react';
import { Link } from 'react-router-dom';
import {
  SURFACE_BASE,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_BORDER,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../theme/tokens';

export default function AiUsePage() {
  return (
    <div style={s.root}>
      <article style={s.card}>
        <Link to="/" style={s.backLink}>&larr; Back to Simplifii-OS</Link>

        <h1 style={s.h1}>How Simplifii-OS uses AI</h1>
        <p style={s.updated}>Last updated: 14 May 2026</p>

        <Section title="What we use AI for">
          <Ul>
            <Li>Translating assignment briefs into plainer language.</Li>
            <Li>Suggesting structure, headings, or outlines.</Li>
            <Li>Drafting starting points you then edit in your own voice.</Li>
            <Li>Identifying citations in your text and matching them against your uploaded sources.</Li>
            <Li>Flagging claims that may not be supported by what you have uploaded.</Li>
            <Li>Summarising long documents you have uploaded.</Li>
            <Li>Suggesting which task to focus on next.</Li>
            <Li>Offering stretches, breaks, and focus prompts.</Li>
          </Ul>
        </Section>

        <Section title="What we do not use AI for">
          <Ul>
            <Li>We do not use AI to grade your work.</Li>
            <Li>We do not use AI to predict your grade or future performance.</Li>
            <Li>We do not use AI to make decisions about your academic standing.</Li>
            <Li>We do not use AI to surveil, track, or profile you for any third party.</Li>
            <Li>We do not use AI to write your final submission for you.</Li>
          </Ul>
        </Section>

        <Section title="Which AI models we use">
          <P>Currently, Simplifii-OS uses:</P>
          <Ul>
            <Li>Anthropic's Claude family of models for most text reasoning tasks (briefs, suggestions, drafts).</Li>
            <Li>Local browser-based detection (no AI model required) for citation pattern matching.</Li>
            <Li>Future local-first models for offline use (planned, not yet active).</Li>
          </Ul>
          <P>We will update this section as our model use changes.</P>
        </Section>

        <Section title="Your data and AI training">
          <P>We do not use your private content (documents, drafts, notes, citations, ingested files) to train any AI model, ours or anyone else's.</P>
          <P>When we send text to an AI provider (such as Anthropic) for processing, we send only what is needed to perform the task. We do not retain this for training. We have contracts in place with our AI providers that prohibit training on user content. Where possible, we use providers' zero-data-retention APIs.</P>
        </Section>

        <Section title="What you should always verify">
          <Ul>
            <Li>Every citation. AI can hallucinate sources that look real but do not exist.</Li>
            <Li>Every claim of fact. AI can confidently state things that are wrong.</Li>
            <Li>Every interpretation of a rubric. AI can misread tone, context, or implicit expectations.</Li>
            <Li>Every suggested rewrite. AI can flatten your voice, miss your meaning, or change your argument.</Li>
          </Ul>
        </Section>

        <Section title="How to disclose AI use to your institution">
          <P>Many institutions now require disclosure of AI-assisted work. We make this easy:</P>
          <Ul>
            <Li>Simplifii-OS keeps a log of AI suggestions, edits, and citations within your project (the "History of Thought" feature).</Li>
            <Li>You can export an "AI Use Receipt" that lists where AI was used in your work.</Li>
            <Li>This receipt is for your records or to share with your teacher if requested.</Li>
            <Li>Submitting it to your institution is your responsibility.</Li>
          </Ul>
        </Section>

        <Section title="How to report a problem">
          <P>If Simplifii-OS gives you misleading, incorrect, or harmful AI output, please tell us. Email <a href="mailto:aaron@simplifii.com.au" style={s.link}>aaron@simplifii.com.au</a> with the subject line "AI output report" and we will investigate.</P>
          <P>We learn from these reports. Your feedback makes the tool safer for everyone.</P>
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
    marginBottom: 6,
  },
  link: {
    textDecoration: 'underline',
  },
};
