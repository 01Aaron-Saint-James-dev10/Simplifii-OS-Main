/**
 * PitStopOverlay.jsx
 *
 * Full-screen Pit Stop overlay triggered after a 25-minute Pomodoro sprint.
 * Blurs the background and centres a Reward Hub with three options:
 *   Play   - NeuralSnake or GameVault
 *   Move   - guided SVG stretch animation with ADHD-friendly prompt
 *   Fuel   - hydration/food reminder
 *
 * Props:
 *   isOpen   - boolean
 *   onDismiss - callback (user chooses to re-enter focus)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeuralSnake from '../games/NeuralSnake';
import GameVault from '../games/GameVault';
import { getRandomPrompt } from '../../../services/RecoveryReminders';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  SURFACE_BASE,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_GLASS_STRONG,
  ACCENT_BORDER,
  ACCENT_BORDER_STRONG,
  ACCENT_GLOW_50,
  ACCENT_GLASS_SUBTLE,
  OVERLAY_HEAVY,
  COLOUR_WARN_TINT,
  COLOUR_WARN_BORDER,
  COLOUR_DANGER_TINT,
  COLOUR_DANGER_BORDER_ALT,
} from '../../../theme/tokens';

const ROSE   = '#f43f5e';
const AMBER  = '#f59e0b';
const EMERALD = '#10b981';

function StretchAnimation({ prompt }) {
  const pathRef   = useRef(null);
  const [len, setLen] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setLen(pathRef.current.getTotalLength());
    }
  }, [prompt]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_PRIMARY, textAlign: 'center', maxWidth: 320, lineHeight: 1.7, margin: 0 }}>
        {prompt.text}
      </p>
      <svg viewBox="0 0 100 100" width={160} height={160} fill="none" aria-hidden="true">
        <rect width={100} height={100} rx={8} fill={SURFACE_BASE} />
        {len > 0 && (
          <motion.path
            ref={pathRef}
            d={prompt.svgPath}
            stroke={EMERALD}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            initial={{ strokeDasharray: len, strokeDashoffset: len }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${ACCENT_GLOW_50})` }}
          />
        )}
        <path
          ref={pathRef}
          d={prompt.svgPath}
          stroke="transparent"
          strokeWidth={2}
          fill="none"
          onLoad={() => { if (pathRef.current) setLen(pathRef.current.getTotalLength()); }}
        />
      </svg>
      <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, letterSpacing: '0.08em', margin: 0 }}>
        {prompt.label} (follow the green line)
      </p>
    </div>
  );
}

function FuelCard({ onDone }) {
  const hydrate = getRandomPrompt('hydrate');
  const fuel    = getRandomPrompt('fuel');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
      <div style={{ padding: '12px 16px', background: ACCENT_GLASS_SUBTLE, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS * 2 }}>
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: EMERALD, margin: '0 0 6px' }}>Hydrate</p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.7 }}>{hydrate}</p>
      </div>
      <div style={{ padding: '12px 16px', background: COLOUR_WARN_TINT, border: `1px solid ${COLOUR_WARN_BORDER}`, borderRadius: BORDER_RADIUS * 2 }}>
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: AMBER, margin: '0 0 6px' }}>Fuel</p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.7 }}>{fuel}</p>
      </div>
      <button
        type="button"
        onClick={onDone}
        style={{ alignSelf: 'flex-end', padding: '6px 16px', background: ACCENT_GLASS_STRONG, border: `1px solid ${ACCENT_BORDER_STRONG}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE, cursor: 'pointer' }}
      >
        Done
      </button>
    </div>
  );
}

export default function PitStopOverlay({ isOpen, onDismiss }) {
  const [mode, setMode] = useState(null); // null | 'snake' | 'vault' | 'stretch' | 'fuel'
  const stretchPrompt = useRef(getRandomPrompt('stretch'));

  // Reset to menu when overlay opens
  useEffect(() => {
    if (isOpen) {
      setMode(null);
      stretchPrompt.current = getRandomPrompt('stretch');
    }
  }, [isOpen]);

  const HUB_TINT = { [ROSE]: COLOUR_DANGER_TINT, [AMBER]: COLOUR_WARN_TINT, [EMERALD]: ACCENT_GLASS_SUBTLE };
  const HUB_BORDER = { [ROSE]: COLOUR_DANGER_BORDER_ALT, [AMBER]: COLOUR_WARN_BORDER, [EMERALD]: ACCENT_BORDER };
  const HUB_BTN_STYLE = (colour) => ({
    flex:          1,
    minWidth:      100,
    padding:       '18px 10px',
    background:    HUB_TINT[colour],
    border:        `1px solid ${HUB_BORDER[colour]}`,
    borderRadius:  BORDER_RADIUS * 2,
    cursor:        'pointer',
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           8,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'fixed', inset: 0, background: OVERLAY_HEAVY, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ width: mode === 'snake' ? 520 : 420, maxWidth: '95vw', maxHeight: '90vh', background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS * 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
              <div>
                <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, margin: 0 }}>
                  Pit Stop
                </p>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: TEXT_MUTED, margin: '2px 0 0' }}>
                  25-minute sprint complete. You earned this.
                </p>
              </div>
              {mode && (
                <button type="button" onClick={() => setMode(null)} style={{ background: 'transparent', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 10 }}>
                  Back
                </button>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '16px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Hub menu */}
              {!mode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setMode('snake')} style={HUB_BTN_STYLE(EMERALD)}>
                      <span style={{ fontSize: 22 }}>🐍</span>
                      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: EMERALD }}>Play</span>
                      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>BrOWSER Snake</span>
                    </button>
                    <button type="button" onClick={() => setMode('stretch')} style={HUB_BTN_STYLE(AMBER)}>
                      <span style={{ fontSize: 22 }}>🌀</span>
                      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: AMBER }}>Move</span>
                      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>Line Stretch</span>
                    </button>
                    <button type="button" onClick={() => setMode('fuel')} style={HUB_BTN_STYLE(ROSE)}>
                      <span style={{ fontSize: 22 }}>💧</span>
                      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ROSE }}>Fuel</span>
                      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>Hydrate</span>
                    </button>
                  </div>
                  <button type="button" onClick={() => setMode('vault')} style={{ padding: '8px', background: 'transparent', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS * 2, fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_MUTED, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Game Vault (external)
                  </button>
                </div>
              )}

              {/* NeuralSnake */}
              {mode === 'snake' && (
                <div style={{ position: 'relative', height: 380 }}>
                  <NeuralSnake onExit={() => setMode(null)} />
                </div>
              )}

              {/* Stretch */}
              {mode === 'stretch' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <StretchAnimation prompt={stretchPrompt.current} />
                  <button type="button" onClick={() => { stretchPrompt.current = getRandomPrompt('stretch'); setMode('stretch'); }} style={{ padding: '5px 14px', background: 'transparent', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_MUTED, cursor: 'pointer' }}>
                    Different stretch
                  </button>
                </div>
              )}

              {/* Fuel */}
              {mode === 'fuel' && <FuelCard onDone={() => setMode(null)} />}

              {/* Game Vault */}
              {mode === 'vault' && <div style={{ flex: 1, minHeight: 320 }}><GameVault onBack={() => setMode(null)} /></div>}
            </div>

            {/* Disclaimer */}
            <p style={{ padding: '6px 18px 0', margin: 0, fontFamily: FONT_BODY, fontSize: 10, color: TEXT_FAINT, lineHeight: 1.5, textAlign: 'center' }}>
              Stretches and breathing prompts are general suggestions, not medical advice. If you have a physical condition or are unsure, check with a qualified health professional.
            </p>

            {/* Footer */}
            <div style={{ padding: '10px 18px', borderTop: `1px solid ${SURFACE_RAISED}` }}>
              <button
                type="button"
                onClick={onDismiss}
                style={{ width: '100%', padding: '8px', background: ACCENT_GLASS_STRONG, border: `1px solid ${ACCENT_BORDER_STRONG}`, borderRadius: BORDER_RADIUS * 2, fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE, cursor: 'pointer' }}
              >
                Re-enter cockpit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
