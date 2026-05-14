import React from 'react';
import { Link } from 'react-router-dom';
import {
  SURFACE_BASE, SURFACE_CARD,
  TEXT_PRIMARY, TEXT_MUTED,
  ACCENT_PULSE, ACCENT_BORDER,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../theme/tokens';

export default function TermsPage() {
  return (
    <div style={s.root}>
      <div style={s.card}>
        <Link to="/" style={s.backLink}>&larr; Back to home</Link>
        <h1 style={s.heading}>Terms of Service</h1>
        <p style={s.updated}>Last updated: 14 May 2026</p>
        <p style={s.body}>
          We are using Termly to generate compliant terms. Final version
          coming soon. For now, contact{' '}
          <a href="mailto:aaron@simplifii.com.au" style={s.link}>
            aaron@simplifii.com.au
          </a>{' '}
          with questions.
        </p>
        <p style={s.body}>
          In brief: Simplifii-OS is free for individual learners during beta.
          You own your work. We do not claim rights over content you create.
          Full terms will be published here before public launch.
        </p>
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: SURFACE_BASE,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    background: SURFACE_CARD,
    border: `1px solid ${ACCENT_BORDER}`,
    borderRadius: BORDER_RADIUS + 2,
    padding: '40px 32px',
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
  heading: {
    fontFamily: FONT_BODY,
    fontWeight: 700,
    fontSize: 24,
    margin: '0 0 4px',
  },
  updated: {
    fontFamily: FONT_SYSTEM,
    fontSize: 10,
    letterSpacing: '0.06em',
    margin: '0 0 24px',
  },
  body: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    lineHeight: 1.7,
    margin: '0 0 16px',
  },
  link: {
    textDecoration: 'underline',
  },
};
