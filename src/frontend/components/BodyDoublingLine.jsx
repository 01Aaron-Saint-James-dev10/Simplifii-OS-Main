import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  FONT_BODY,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  SURFACE_CARD,
  SURFACE_BASE,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_GLASS_SUBTLE,
  ACCENT_BORDER,
  ACCENT_BORDER_FAINT,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * BodyDoublingLine
 *
 * Body doubling Level 1: solo focus mode with AURA as the body double.
 * Three modes: Focus (25 min), Short Break (5 min), Long Break (15 min).
 * Includes: circular timer, session goal, ambient sound, AURA presence,
 * halfway check-in, session complete summary, active student count.
 */

const MODES = {
  focus: { label: 'Focus', seconds: 1500 },
  short: { label: 'Short Break', seconds: 300 },
  long: { label: 'Long Break', seconds: 900 },
};

const AMBIENT_OPTIONS = [
  { key: 'none', label: 'Silence' },
  { key: 'brown', label: 'Brown noise' },
  { key: 'rain', label: 'Rain' },
  { key: 'ocean', label: 'Ocean' },
];

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getStoredNumber(key, fallback = 0) {
  try {
    const today = new Date().toDateString();
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed.date !== today) return fallback;
    return parsed.value || fallback;
  } catch { return fallback; }
}

function storeNumber(key, value) {
  localStorage.setItem(key, JSON.stringify({ date: new Date().toDateString(), value }));
}

/* ---- Brown noise generator via Web Audio API ---- */
function createBrownNoise(audioCtx) {
  const bufferSize = 4096;
  const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
  let lastOut = 0.0;
  node.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      output[i] = lastOut * 3.5;
    }
  };
  return node;
}

export default function BodyDoublingLine() {
  const { user } = useAuth();

  // Session state
  const [phase, setPhase] = useState('entry'); // entry | active | complete
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionGoal, setSessionGoal] = useState('');
  const [sessionsToday, setSessionsToday] = useState(() => getStoredNumber('bd_sessions'));
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(() => getStoredNumber('bd_focus_seconds'));
  const [ambientSound, setAmbientSound] = useState('none');
  const [checkInShown, setCheckInShown] = useState(false);
  const [checkInDismissed, setCheckInDismissed] = useState(false);
  const [studentsNow, setStudentsNow] = useState(null);

  const intervalRef = useRef(null);
  const pingRef = useRef(null);
  const audioCtxRef = useRef(null);
  const audioNodeRef = useRef(null);
  const elapsedRef = useRef(0);
  const totalForSession = MODES[mode].seconds;

  // Fetch active student count
  const fetchStudentCount = useCallback(async () => {
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('active_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_ping', fiveMinAgo);
      setStudentsNow(count || 0);
    } catch { setStudentsNow(0); }
  }, []);

  useEffect(() => {
    fetchStudentCount();
  }, [fetchStudentCount]);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          handleSessionComplete();
          return 0;
        }
        const next = prev - 1;
        elapsedRef.current += 1;
        // Halfway check-in
        if (!checkInDismissed && next === Math.floor(totalForSession / 2)) {
          setCheckInShown(true);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [isRunning, checkInDismissed, totalForSession]);

  // Supabase active session ping
  useEffect(() => {
    if (phase !== 'active' || !user?.id) return;
    const upsertSession = async () => {
      await supabase.from('active_sessions').upsert({
        user_id: user.id,
        started_at: new Date().toISOString(),
        last_ping: new Date().toISOString(),
      });
    };
    upsertSession();
    pingRef.current = setInterval(async () => {
      await supabase.from('active_sessions').upsert({
        user_id: user.id,
        last_ping: new Date().toISOString(),
      });
    }, 60000);
    return () => {
      clearInterval(pingRef.current);
      supabase.from('active_sessions').delete().eq('user_id', user.id);
    };
  }, [phase, user?.id]);

  // Ambient sound
  useEffect(() => {
    // Clean up previous
    if (audioNodeRef.current) {
      audioNodeRef.current.disconnect();
      audioNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (ambientSound === 'none' || phase !== 'active') return;
    if (ambientSound === 'brown') {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const node = createBrownNoise(ctx);
      const gain = ctx.createGain();
      gain.gain.value = 0.3;
      node.connect(gain);
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      audioNodeRef.current = node;
    }
    return () => {
      if (audioNodeRef.current) {
        audioNodeRef.current.disconnect();
        audioNodeRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [ambientSound, phase]);

  function handleSessionComplete() {
    const elapsed = elapsedRef.current;
    if (mode === 'focus') {
      const newSessions = sessionsToday + 1;
      const newFocus = totalFocusSeconds + elapsed;
      setSessionsToday(newSessions);
      setTotalFocusSeconds(newFocus);
      storeNumber('bd_sessions', newSessions);
      storeNumber('bd_focus_seconds', newFocus);
    }
    setPhase('complete');
  }

  function handleStart() {
    elapsedRef.current = 0;
    setCheckInShown(false);
    setCheckInDismissed(false);
    setTimeLeft(MODES[mode].seconds);
    setIsRunning(true);
    setPhase('active');
  }

  function handlePause() {
    setIsRunning(prev => !prev);
  }

  function handleEndEarly() {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    handleSessionComplete();
  }

  function handleCheckInYes() {
    setCheckInShown(false);
    setCheckInDismissed(true);
  }

  function handleCheckInBreak() {
    setCheckInShown(false);
    setCheckInDismissed(true);
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setMode('short');
    setTimeLeft(MODES.short.seconds);
    // Stay in active phase but paused
  }

  function handleDone() {
    setPhase('entry');
    setMode('focus');
    setTimeLeft(MODES.focus.seconds);
    elapsedRef.current = 0;
    setCheckInShown(false);
    setCheckInDismissed(false);
    fetchStudentCount();
  }

  function handleModeChange(newMode) {
    setMode(newMode);
    setTimeLeft(MODES[newMode].seconds);
  }

  // Progress for circular timer (0 to 1)
  const progress = 1 - (timeLeft / MODES[mode].seconds);
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress);

  const pillStyle = (active) => ({
    fontFamily: FONT_BODY,
    fontSize: 13,
    padding: '6px 16px',
    borderRadius: 20,
    border: `1px solid ${active ? ACCENT_PULSE : ACCENT_BORDER_FAINT}`,
    background: active ? ACCENT_GLASS : 'transparent',
    color: active ? ACCENT_PULSE : TEXT_MUTED,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const buttonStyle = (primary) => ({
    fontFamily: FONT_BODY,
    fontSize: 14,
    fontWeight: 500,
    padding: primary ? '10px 32px' : '8px 20px',
    borderRadius: BORDER_RADIUS,
    border: primary ? 'none' : `1px solid ${ACCENT_BORDER}`,
    background: primary ? ACCENT_PULSE : 'transparent',
    color: primary ? '#fff' : TEXT_MUTED,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  // ---- ENTRY SCREEN ----
  if (phase === 'entry') {
    return (
      <div style={{
        fontFamily: FONT_BODY,
        background: SURFACE_CARD,
        borderRadius: BORDER_RADIUS,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <h3 style={{ color: TEXT_PRIMARY, margin: 0, fontSize: 18, fontWeight: 600 }}>
          Focus with AURA
        </h3>
        <p style={{ color: TEXT_MUTED, margin: 0, fontSize: 13, textAlign: 'center' }}>
          AURA will be here with you the whole time.
        </p>

        {/* Students working now */}
        <div style={{
          background: ACCENT_GLASS_SUBTLE,
          borderRadius: 20,
          padding: '4px 14px',
          fontSize: 12,
          color: TEXT_MUTED,
        }} aria-live="polite">
          {studentsNow === null
            ? 'Checking who is online...'
            : studentsNow > 0
              ? `${studentsNow} student${studentsNow === 1 ? '' : 's'} working right now`
              : 'Be the first to start a session today'}
        </div>

        {/* Session goal */}
        <input
          type="text"
          value={sessionGoal}
          onChange={e => setSessionGoal(e.target.value)}
          placeholder="What will you focus on?"
          maxLength={120}
          aria-label="Session goal"
          style={{
            fontFamily: FONT_BODY,
            fontSize: 14,
            width: '100%',
            maxWidth: 320,
            padding: '8px 12px',
            borderRadius: BORDER_RADIUS,
            border: `1px solid ${ACCENT_BORDER_FAINT}`,
            background: SURFACE_BASE,
            color: TEXT_PRIMARY,
            outline: 'none',
          }}
        />

        {/* Mode pills */}
        <div style={{ display: 'flex', gap: 8 }} role="radiogroup" aria-label="Timer mode">
          {Object.entries(MODES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => handleModeChange(key)}
              style={pillStyle(mode === key)}
              role="radio"
              aria-checked={mode === key}
            >
              {val.label} ({val.seconds / 60} min)
            </button>
          ))}
        </div>

        {/* Ambient sound */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: TEXT_FAINT }}>Sound:</span>
          {AMBIENT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setAmbientSound(opt.key)}
              style={{
                ...pillStyle(ambientSound === opt.key),
                fontSize: 11,
                padding: '4px 10px',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Stats row */}
        {sessionsToday > 0 && (
          <p style={{ color: TEXT_FAINT, fontSize: 12, margin: 0 }}>
            Today: {sessionsToday} session{sessionsToday === 1 ? '' : 's'},
            {' '}{Math.round(totalFocusSeconds / 60)} minutes focused
          </p>
        )}

        {/* Start button */}
        <button onClick={handleStart} style={buttonStyle(true)}>
          Start
        </button>
      </div>
    );
  }

  // ---- ACTIVE SESSION ----
  if (phase === 'active') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: SURFACE_BASE,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_BODY,
        gap: 20,
      }} role="dialog" aria-label="Focus session active">
        {/* Session goal */}
        {sessionGoal && (
          <p style={{ color: TEXT_FAINT, fontSize: 13, margin: 0, maxWidth: 400, textAlign: 'center' }}>
            {sessionGoal}
          </p>
        )}

        {/* Circular timer */}
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
            {/* Background circle */}
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke={ACCENT_BORDER_FAINT}
              strokeWidth="4"
            />
            {/* Progress arc */}
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke={ACCENT_PULSE}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span
              style={{ fontSize: 42, fontWeight: 300, color: TEXT_PRIMARY, fontVariantNumeric: 'tabular-nums' }}
              aria-live="polite"
              aria-label={`${Math.floor(timeLeft / 60)} minutes ${timeLeft % 60} seconds remaining`}
            >
              {formatTime(timeLeft)}
            </span>
            <span style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>
              {MODES[mode].label}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handlePause} style={buttonStyle(false)}>
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button onClick={handleEndEarly} style={buttonStyle(false)}>
            End early
          </button>
        </div>

        {/* AURA check-in overlay */}
        {checkInShown && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: SURFACE_CARD,
            borderRadius: BORDER_RADIUS,
            padding: '24px 32px',
            textAlign: 'center',
            border: `1px solid ${ACCENT_BORDER}`,
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }} role="alertdialog" aria-label="AURA check-in">
            <p style={{ color: TEXT_PRIMARY, fontSize: 15, margin: 0 }}>
              Still going? You are halfway through.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={handleCheckInYes} style={buttonStyle(true)}>Yes</button>
              <button onClick={handleCheckInBreak} style={buttonStyle(false)}>Take a break</button>
            </div>
          </div>
        )}

        {/* AURA presence indicator */}
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: ACCENT_PULSE,
            display: 'inline-block',
            animation: 'bodyDoublePulse 2s ease-in-out infinite',
          }} aria-hidden="true" />
          <span style={{ fontSize: 12, color: TEXT_FAINT }}>
            AURA is here with you
          </span>
        </div>
      </div>
    );
  }

  // ---- SESSION COMPLETE ----
  if (phase === 'complete') {
    const elapsedMinutes = Math.round(elapsedRef.current / 60);
    return (
      <div style={{
        fontFamily: FONT_BODY,
        background: SURFACE_CARD,
        borderRadius: BORDER_RADIUS,
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
      }} role="status" aria-label="Session complete">
        <p style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 500, margin: 0 }}>
          You worked for {elapsedMinutes} minute{elapsedMinutes === 1 ? '' : 's'}. That counts.
        </p>
        <div style={{ color: TEXT_MUTED, fontSize: 13 }}>
          <p style={{ margin: '4px 0' }}>Sessions today: {sessionsToday}</p>
          <p style={{ margin: '4px 0' }}>Total focus time: {Math.round(totalFocusSeconds / 60)} minutes</p>
        </div>
        <button onClick={handleDone} style={buttonStyle(true)}>
          Done
        </button>
      </div>
    );
  }

  return null;
}
