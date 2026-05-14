/**
 * usePomodoro.js
 *
 * Pomodoro focus timer hook.
 * Default sprint: 25 minutes. When it hits zero, `isPitStop` flips true
 * so the caller can render the PitStopOverlay.
 *
 * Returns:
 *   timeLeft    - seconds remaining in current sprint
 *   isRunning   - boolean
 *   isPitStop   - boolean (true when sprint complete, overlay should show)
 *   start()     - begin or resume counting
 *   pause()     - pause counting
 *   reset()     - reset to SPRINT_SECONDS, clears pitStop
 *   dismiss()   - clear pitStop flag without resetting
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const SPRINT_SECONDS = 25 * 60; // 25 minutes

export default function usePomodoro(sprintSeconds = SPRINT_SECONDS) {
  const [timeLeft,  setTimeLeft]  = useState(sprintSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPitStop, setIsPitStop] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setIsPitStop(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const start   = useCallback(() => { if (timeLeft > 0) setIsRunning(true); },  [timeLeft]);
  const pause   = useCallback(() => setIsRunning(false), []);
  const reset   = useCallback(() => { setIsRunning(false); setIsPitStop(false); setTimeLeft(sprintSeconds); }, [sprintSeconds]);
  const dismiss = useCallback(() => { setIsPitStop(false); setTimeLeft(sprintSeconds); }, [sprintSeconds]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const label   = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { timeLeft, isRunning, isPitStop, label, start, pause, reset, dismiss };
}
