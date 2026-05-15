import { useState, useEffect } from 'react';

/**
 * useRealtimeClock
 *
 * Returns live date/time state, updating every 60 seconds.
 * Detects user timezone from browser.
 */
export function useRealtimeClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const hour = now.getHours();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney';

  return {
    now,
    hour,
    timezone,
    dayOfWeek: now.toLocaleDateString('en-AU', { weekday: 'long' }),
    formattedDate: now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
    formattedTime: now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
    timeOfDay: hour < 6 ? 'late' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'late',
  };
}
