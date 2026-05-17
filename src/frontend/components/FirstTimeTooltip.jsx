import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  SURFACE_CARD, SHADOW_CARD,
  TEXT_PRIMARY,
  ACCENT_PULSE, ACCENT_BORDER,
  FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * FirstTimeTooltip
 *
 * Shows a small tooltip bubble once per user.
 * Dismissed on click. Stored in localStorage by user ID + tooltip ID.
 *
 * Props:
 *   id       - unique tooltip identifier
 *   text     - tooltip message
 *   position - 'top' | 'bottom' | 'left' | 'right'
 *   delay    - ms before showing (default 1500)
 */
export default function FirstTimeTooltip({ id, text, position = 'bottom', delay = 1500, children }) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const key = `simplifii_tip_${id}_${user?.id || 'anon'}`;

  useEffect(() => {
    if (localStorage.getItem(key)) return;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [key, delay]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(key, 'true');
  };

  const posStyles = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {children}
      {visible && (
        <div
          onClick={dismiss}
          style={{
            position: 'absolute',
            ...posStyles[position],
            background: SURFACE_CARD,
            border: `1px solid ${ACCENT_BORDER}`,
            borderRadius: BORDER_RADIUS + 2,
            padding: '8px 12px',
            width: 200,
            zIndex: 500,
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${SHADOW_CARD}`,
          }}
          role="tooltip"
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT_PULSE, display: 'inline-block', marginRight: 6, animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_PRIMARY, lineHeight: 1.4 }}>
            {text}
          </span>
        </div>
      )}
    </div>
  );
}
