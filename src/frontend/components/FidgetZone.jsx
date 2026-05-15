import React, { useState, useRef, useCallback } from 'react';
import { useSettings } from '../SettingsContext';
import { ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER, FONT_SYSTEM } from '../../theme/tokens';

/**
 * FidgetZone
 *
 * Small interactive element bottom-left of canvas.
 * Click creates ripples, drag moves it. Does not affect work state.
 * Visible only when autism-first is enabled.
 */
export default function FidgetZone() {
  const { autismFirstEnabled, reducedMotion } = useSettings();
  const [ripples, setRipples] = useState([]);
  const [pos, setPos] = useState({ x: 24, y: null }); // bottom-left default
  const dragRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleClick = useCallback((e) => {
    if (dragRef.current) return;
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev.slice(-4), { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  }, [reducedMotion]);

  const handleMouseDown = useCallback((e) => {
    dragRef.current = false;
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - (pos.y ?? (window.innerHeight - 80)) };
    const handleMove = (me) => {
      dragRef.current = true;
      setPos({ x: me.clientX - offsetRef.current.x, y: me.clientY - offsetRef.current.y });
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      setTimeout(() => { dragRef.current = false; }, 50);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [pos]);

  if (!autismFirstEnabled) return null;

  const bottom = pos.y != null ? undefined : 24;
  const top = pos.y != null ? pos.y : undefined;

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      role="img"
      aria-label="Fidget zone: click for ripples, drag to move"
      title="Click or drag. Does nothing to your work."
      style={{
        position: 'fixed',
        left: pos.x,
        top,
        bottom,
        zIndex: 80,
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: ACCENT_GLASS,
        border: `2px solid ${ACCENT_BORDER}`,
        cursor: 'pointer',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Centre dot */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 8, height: 8, borderRadius: '50%',
        background: ACCENT_PULSE,
      }} />

      {/* Ripples */}
      {ripples.map(r => (
        <div
          key={r.id}
          style={{
            position: 'absolute',
            left: r.x - 15, top: r.y - 15,
            width: 30, height: 30, borderRadius: '50%',
            border: `1px solid ${ACCENT_PULSE}`,
            animation: 'fidgetRipple 600ms ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}

      <style>{`
        @keyframes fidgetRipple {
          from { transform: scale(0.5); opacity: 0.8; }
          to { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
