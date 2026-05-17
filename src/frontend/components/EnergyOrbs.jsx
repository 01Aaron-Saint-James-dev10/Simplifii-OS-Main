import React, { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import {
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * EnergyOrbs
 *
 * Visual energy tracking based on Spoon Theory.
 * Orange spheres with star inside (Dragon Ball Z inspired).
 * Stacked vertically in bottom-left of canvas.
 *
 * Each orb represents one unit of focus energy.
 * Learner sets how many they start with (default 7).
 * Tasks cost 1-3 orbs. When empty: rest signal.
 *
 * No guilt. No shame. Just awareness.
 */

const STORAGE_KEY_PREFIX = 'simplifii_energy_';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function OrbSVG({ filled, size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {/* Sphere */}
      <circle cx="16" cy="16" r="14" fill={filled ? '#f97316' : '#27272a'} stroke={filled ? '#fb923c' : '#3f3f46'} strokeWidth="1.5" />
      {/* Inner glow */}
      {filled && <circle cx="13" cy="12" r="4" fill="rgba(255,255,255,0.25)" />}
      {/* Star (DBZ style) */}
      <path
        d="M16 8 L17.5 13.5 L23 14 L18.5 17.5 L20 23 L16 19.5 L12 23 L13.5 17.5 L9 14 L14.5 13.5 Z"
        fill={filled ? '#fbbf24' : '#52525b'}
        stroke={filled ? '#f59e0b' : '#3f3f46'}
        strokeWidth="0.5"
        opacity={filled ? 1 : 0.4}
      />
    </svg>
  );
}

export default function EnergyOrbs({ userId }) {
  const { setGritLevel } = useSettings();
  const [clusterPos, setClusterPos] = useState(() => {
    try {
      const stored = localStorage.getItem('simplifii:dragon-position');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [total, setTotal] = useState(() => {
    try {
      return parseInt(localStorage.getItem(`${STORAGE_KEY_PREFIX}total_${userId}`) || '7', 10);
    } catch { return 7; }
  });

  const [spent, setSpent] = useState(() => {
    try {
      const key = `${STORAGE_KEY_PREFIX}spent_${userId}_${getTodayKey()}`;
      return parseInt(localStorage.getItem(key) || '0', 10);
    } catch { return 0; }
  });

  const [showTooltip, setShowTooltip] = useState(false);
  const remaining = Math.max(0, total - spent);

  // Persist spent count
  useEffect(() => {
    try {
      const key = `${STORAGE_KEY_PREFIX}spent_${userId}_${getTodayKey()}`;
      localStorage.setItem(key, String(spent));
    } catch { /* storage unavailable */ }
  }, [spent, userId]);

  // Persist total setting
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}total_${userId}`, String(total));
    } catch { /* storage unavailable */ }
  }, [total, userId]);

  // Listen for energy spend events from focus sessions
  useEffect(() => {
    const handler = (e) => {
      const cost = e.detail?.cost || 1;
      setSpent(prev => Math.min(prev + cost, total));
    };
    window.addEventListener('simplifii:energy-spend', handler);
    return () => window.removeEventListener('simplifii:energy-spend', handler);
  }, [total]);

  // Map remaining orb count to grit level in SettingsContext
  useEffect(() => {
    if (remaining >= 6) setGritLevel('socratic');
    else if (remaining >= 3) setGritLevel('balanced');
    else setGritLevel('literal');
  }, [remaining]); // eslint-disable-line

  // Dispatch AURA message when energy is depleted
  useEffect(() => {
    if (remaining === 0 && spent > 0) {
      window.dispatchEvent(new CustomEvent('simplifii:aura-state', { detail: { state: 'lowEnergy' } }));
    }
  }, [remaining, spent]);

  return (
    <div
      style={{
        position: 'fixed',
        ...(clusterPos ? { left: clusterPos.x, top: clusterPos.y } : { bottom: 20, left: 16 }),
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'center',
        cursor: 'grab',
      }}
      onMouseDown={(e) => {
        if (e.target.closest('button')) return;
        const startX = e.clientX;
        const startY = e.clientY;
        const rect = e.currentTarget.getBoundingClientRect();
        const startLeft = rect.left;
        const startTop = rect.top;
        const onMove = (me) => {
          const newPos = { x: startLeft + (me.clientX - startX), y: startTop + (me.clientY - startY) };
          setClusterPos(newPos);
          try { localStorage.setItem('simplifii:dragon-position', JSON.stringify(newPos)); } catch { /* ok */ }
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      aria-label={`Energy: ${remaining} of ${total} remaining`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={remaining}
    >
      {/* + button: increase active energy */}
      <button
        type="button"
        aria-label="Increase energy level"
        onClick={() => setSpent(s => Math.max(0, s - 1))}
        style={{ minHeight: 44, minWidth: 44, background: 'none', border: `1px solid ${ACCENT_PULSE}`, borderRadius: BORDER_RADIUS, cursor: 'pointer', fontSize: 18, color: ACCENT_PULSE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >+</button>

      {/* Count display */}
      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, color: ACCENT_PULSE, textAlign: 'center' }}>
        {remaining}
      </span>

      {/* Orbs stack: display only */}
      {Array.from({ length: total }, (_, i) => (
        <div key={i} aria-hidden="true" style={{ display: 'flex' }}>
          <OrbSVG filled={i < remaining} size={24} />
        </div>
      ))}

      {/* - button: decrease active energy */}
      <button
        type="button"
        aria-label="Decrease energy level"
        onClick={() => setSpent(s => Math.min(total, s + 1))}
        style={{ minHeight: 44, minWidth: 44, background: 'none', border: `1px solid ${ACCENT_PULSE}`, borderRadius: BORDER_RADIUS, cursor: 'pointer', fontSize: 18, color: ACCENT_PULSE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >-</button>

      {/* Tooltip */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          left: 40,
          bottom: 0,
          width: 220,
          padding: '10px 12px',
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: BORDER_RADIUS + 2,
          zIndex: 100,
        }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
            Energy orbs ({remaining}/{total})
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: '0 0 8px', lineHeight: 1.4 }}>
            Based on Spoon Theory: each orb is one unit of focus energy for today. Tasks use 1 to 3 orbs. When they run out, that is your signal to rest. No guilt.
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setTotal(t => Math.max(1, t - 1))}
              style={{ width: 24, height: 24, borderRadius: '50%', background: '#27272a', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >-</button>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT }}>
              {total} today
            </span>
            <button
              type="button"
              onClick={() => setTotal(t => Math.min(13, t + 1))}
              style={{ width: 24, height: 24, borderRadius: '50%', background: '#27272a', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >+</button>
          </div>
        </div>
      )}
    </div>
  );
}
