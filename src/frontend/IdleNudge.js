import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useProject } from './ProjectContext';
import { useSettings } from './SettingsContext';
import { startIdleDetection, stopIdleDetection } from '../core/ExecutiveSpine';
import { getAvatarByStream } from './AvatarVault';

/**
 * IdleNudge
 *
 * UI consumer for the simplifii:idle CustomEvent fired by
 * ExecutiveSpine. When the student goes silent for longer than
 * the stream's idle threshold during a focus session, a low-friction
 * banner appears with the avatar's name (Mango for primary, AURA
 * elsewhere) and a literal one-step instruction. The point is to
 * notice the drift, not to scold.
 *
 * Idle detection is gated by simplifii:focus-start so the nudge
 * only fires inside an active focus block. simplifii:focus-end
 * tears the watcher down.
 */

const ONE_STEP_LINES = [
  'One sentence. That is the whole step.',
  'Open the document. Nothing else yet.',
  'Read the next dot point out loud.',
  'Type one word. Then pause.',
  'Look at the brief. Twenty seconds.'
];

export default function IdleNudge() {
  const { stream } = useProject();
  const { gritLevel } = useSettings();
  const [nudge, setNudge] = useState(null);
  const avatarName = stream?.getVocab?.('aura_avatar_name') || 'AURA';
  const idleThreshold = stream?.profile?.idleThresholdMs || 180_000;
  const StreamAvatar = getAvatarByStream(stream?.streamId || 'tertiary', { gritLevel });

  useEffect(() => {
    const onFocusStart = () => {
      startIdleDetection({ thresholdMs: idleThreshold });
    };
    const onFocusEnd = () => {
      stopIdleDetection();
      setNudge(null);
    };
    const onIdle = (e) => {
      const line = ONE_STEP_LINES[Math.floor(Math.random() * ONE_STEP_LINES.length)];
      setNudge({ line, sinceMs: e.detail?.sinceMs || 0 });
    };
    window.addEventListener('simplifii:focus-start', onFocusStart);
    window.addEventListener('simplifii:focus-end', onFocusEnd);
    window.addEventListener('simplifii:idle', onIdle);
    return () => {
      window.removeEventListener('simplifii:focus-start', onFocusStart);
      window.removeEventListener('simplifii:focus-end', onFocusEnd);
      window.removeEventListener('simplifii:idle', onIdle);
      stopIdleDetection();
    };
  }, [idleThreshold]);

  if (!nudge) return null;

  const minutes = Math.round(nudge.sinceMs / 60000);
  const isMango = avatarName.toLowerCase() === 'mango';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1400,
        maxWidth: 480,
        width: 'calc(100% - 48px)',
        background: isMango ? 'linear-gradient(135deg, #fff8ec, #ffe6b3)' : '#0f172a',
        border: isMango ? '1px solid #f5b851' : '1px solid #334155',
        color: isMango ? '#5a3d00' : '#e2e8f0',
        borderRadius: 14,
        padding: '14px 16px',
        boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'inherit'
      }}
    >
      <div style={{ flexShrink: 0 }} aria-hidden="true">
        <StreamAvatar size={36} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity: 0.7,
            marginBottom: 2
          }}
        >
          {avatarName}  ·  {minutes} min idle
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>
          {nudge.line}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setNudge(null)}
        aria-label="Dismiss nudge"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          opacity: 0.6,
          padding: 4,
          display: 'flex'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
