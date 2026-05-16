import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  FONT_BODY, FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * WelcomeBanner
 *
 * Shows ONCE after onboarding is complete (first dashboard visit).
 * Explains what to do next in plain language.
 * Dismisses on click. Never shows again for this user.
 */
export default function WelcomeBanner() {
  const { user } = useAuth();
  const storageKey = `simplifii_welcome_seen_${user?.id}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    if (localStorage.getItem(storageKey)) return;
    // Show after a short delay so dashboard renders first
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, [user?.id, storageKey]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(storageKey, 'true');
  };

  if (!visible) return null;

  return (
    <div style={{
      background: ACCENT_GLASS,
      border: `1px solid ${ACCENT_BORDER}`,
      borderRadius: BORDER_RADIUS + 4,
      padding: '16px 20px',
      marginBottom: 16,
      position: 'relative',
    }}>
      <button type="button" onClick={dismiss} aria-label="Dismiss"
        style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontSize: 14 }}>
        &times;
      </button>

      <h3 style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 8px' }}>
        You are all set up. Here is what to do next:
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Step num="1" text="Tap '+ Add work' to upload your assignment, rubric, or exam paper." />
        <Step num="2" text="AURA (the glowing orb) will read your document and build a plan for you." />
        <Step num="3" text="Open your subject to start writing. AURA guides you step by step." />
      </div>

      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, margin: '12px 0 0', lineHeight: 1.4 }}>
        Not sure where to start? Click the AURA orb (bottom-right) and ask: "What should I do first?"
      </p>
    </div>
  );
}

function Step({ num, text }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 12, fontWeight: 700, color: ACCENT_PULSE, flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: ACCENT_GLASS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {num}
      </span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.4 }}>
        {text}
      </span>
    </div>
  );
}
