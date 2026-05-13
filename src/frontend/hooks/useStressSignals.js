import { useState, useEffect, useRef } from 'react';

export function useStressSignals(blockId, onLogEffort) {
  const [pulseLevel, setPulseLevel] = useState(0); 
  const [isTyping, setIsTyping] = useState(false);
  const metricsRef = useRef({
    startTime: null,
    keystrokes: 0,
    deletions: 0,
    lastKeystrokeTime: 0,
    burstCount: 0
  });

  const typingTimerRef = useRef(null);
  const logTimerRef = useRef(null);

  const handleKeyDown = (e) => {
    const now = Date.now();
    const metrics = metricsRef.current;

    if (!metrics.startTime) {
      metrics.startTime = now;
    }

    const timeSinceLastKey = now - metrics.lastKeystrokeTime;
    
    if (e.key === 'Backspace' || e.key === 'Delete') {
      metrics.deletions++;
    } else if (e.key.length === 1) { 
      metrics.keystrokes++;
      
      if (timeSinceLastKey < 50) {
        metrics.burstCount++; 
      } else {
        metrics.burstCount = 0; 
      }
    }

    metrics.lastKeystrokeTime = now;
    setIsTyping(true);

    if (metrics.burstCount > 5) {
      setPulseLevel(3); 
    } else if (timeSinceLastKey < 200) {
      setPulseLevel(2); 
    } else {
      setPulseLevel(1); 
    }

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setPulseLevel(0);
    }, 1000);
    
    clearTimeout(logTimerRef.current);
    logTimerRef.current = setTimeout(() => {
      commitLog();
    }, 5000);
  };

  const commitLog = () => {
    const metrics = metricsRef.current;
    if (metrics.keystrokes > 0 || metrics.deletions > 0) {
      const timeSpent = Date.now() - (metrics.startTime || Date.now());
      onLogEffort(blockId, {
        timestamp: Date.now(),
        keystrokes: metrics.keystrokes,
        deletions: metrics.deletions,
        timeSpentMs: timeSpent,
        bursts: metrics.burstCount > 10 ? 1 : 0
      });
      metricsRef.current = {
        startTime: null,
        keystrokes: 0,
        deletions: 0,
        lastKeystrokeTime: 0,
        burstCount: 0
      };
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current);
      clearTimeout(logTimerRef.current);
      commitLog();
    };
  }, [blockId]);

  return { handleKeyDown, isTyping, pulseLevel };
}
