import React, { useState, useEffect } from 'react';
import {
  SURFACE_CARD,
  TEXT_PRIMARY, TEXT_FAINT,
  ACCENT_PULSE,
  GLASS_BORDER,
  FONT_DISPLAY, FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * JokeOverlay
 *
 * Ephemeral joke display. Triggered by /joke text command or
 * "tell me a joke" voice command. Dismisses on click or after 10s.
 * Lives in CanvasScreen, listens for simplifii:joke-request event.
 */
export default function JokeOverlay() {
  const [joke, setJoke] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = async () => {
      setLoading(true);
      setVisible(true);
      try {
        const res = await fetch('/api/joke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ style: 'observational' }),
        });
        const data = await res.json();
        setJoke(data.success ? data.joke : 'Could not fetch a joke right now.');
      } catch {
        setJoke('Could not reach the joke service.');
      }
      setLoading(false);
      setTimeout(() => setVisible(false), 10000);
    };

    window.addEventListener('simplifii:joke-request', handler);
    return () => window.removeEventListener('simplifii:joke-request', handler);
  }, []);

  if (!visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 9000, maxWidth: 400, width: '90vw', padding: '28px 24px',
        background: SURFACE_CARD, border: `1px solid ${GLASS_BORDER}`,
        borderRadius: 12, textAlign: 'center', cursor: 'pointer',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {loading ? (
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_FAINT }}>Thinking of something funny...</p>
      ) : (
        <>
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.6, margin: '0 0 12px' }}>
            {joke}
          </p>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: 0 }}>
            Click anywhere to dismiss | Type /joke for another
          </p>
        </>
      )}
    </div>
  );
}
