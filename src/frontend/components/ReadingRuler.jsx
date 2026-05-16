import React, { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import { ACCENT_PULSE, OVERLAY_RULER } from '../../theme/tokens';

/**
 * ReadingRuler
 *
 * Horizontal highlight line that follows the mouse cursor.
 * Helps with dyslexia and ADHD focus.
 * Toggle in Settings > Accessibility > Reading ruler.
 */
export default function ReadingRuler() {
  const { isRulerActive } = useSettings();
  const [y, setY] = useState(-100);

  useEffect(() => {
    if (!isRulerActive) return;
    const handler = (e) => setY(e.clientY);
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [isRulerActive]);

  if (!isRulerActive) return null;

  return (
    <>
      {/* Darkened regions above and below */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: Math.max(0, y - 20),
        background: OVERLAY_RULER,
        pointerEvents: 'none', zIndex: 9990,
        transition: 'height 50ms linear',
      }} />
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        top: y + 20,
        background: OVERLAY_RULER,
        pointerEvents: 'none', zIndex: 9990,
        transition: 'top 50ms linear',
      }} />
      {/* Highlighted line */}
      <div style={{
        position: 'fixed', left: 0, right: 0,
        top: y - 20, height: 40,
        borderTop: `1px solid ${ACCENT_PULSE}`,
        borderBottom: `1px solid ${ACCENT_PULSE}`,
        pointerEvents: 'none', zIndex: 9990,
        transition: 'top 50ms linear',
      }} />
    </>
  );
}
