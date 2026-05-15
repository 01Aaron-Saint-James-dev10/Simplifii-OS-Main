import { useState, useCallback, useRef } from 'react';

/**
 * useConfidenceDetector
 *
 * Monitors user messages for patterns indicating self-doubt or
 * external validation seeking. Fires trigger events that the
 * AffirmationBanner can respond to.
 *
 * Patterns detected:
 * - "is this right?" / "am I on track?" / "is this good?" (2+ times = self_doubt)
 * - "what should I do" / "what do I do next" (decision_moment)
 * - "do you think" / "should I" / "is it okay if" (external_validation_seeking)
 *
 * Returns:
 *   { activeTrigger, checkMessage, clearTrigger }
 */

const SELF_DOUBT_PATTERNS = [
  /\bis\s+this\s+(right|correct|good|okay|ok)\b/i,
  /\bam\s+i\s+(on\s+track|doing\s+(this|it)\s+right|correct)\b/i,
  /\bdoes\s+this\s+(make\s+sense|work|look\s+(right|okay|ok))\b/i,
  /\bis\s+this\s+what\s+(you|they)\s+want\b/i,
];

const DECISION_PATTERNS = [
  /\bwhat\s+should\s+i\s+do\b/i,
  /\bwhat\s+do\s+i\s+do\s+next\b/i,
  /\bwhat\s+now\b/i,
  /\bwhere\s+do\s+i\s+start\b/i,
  /\bi\s+don't\s+know\s+where\s+to\s+start\b/i,
];

const VALIDATION_PATTERNS = [
  /\bdo\s+you\s+think\b/i,
  /\bshould\s+i\b/i,
  /\bis\s+it\s+okay?\s+if\b/i,
  /\bcan\s+you\s+check\b/i,
  /\bwould\s+a?\s*marker\s+(like|accept|want)\b/i,
];

export default function useConfidenceDetector() {
  const [activeTrigger, setActiveTrigger] = useState(null);
  const doubtCountRef = useRef(0);

  const checkMessage = useCallback((text) => {
    if (!text) return null;

    // Check decision moment
    for (const re of DECISION_PATTERNS) {
      if (re.test(text)) {
        setActiveTrigger('decision_moment');
        return 'decision_moment';
      }
    }

    // Check self-doubt (needs 2+ occurrences in a session)
    for (const re of SELF_DOUBT_PATTERNS) {
      if (re.test(text)) {
        doubtCountRef.current += 1;
        if (doubtCountRef.current >= 2) {
          setActiveTrigger('self_doubt_detected');
          return 'self_doubt_detected';
        }
        return null;
      }
    }

    // Check external validation seeking
    for (const re of VALIDATION_PATTERNS) {
      if (re.test(text)) {
        setActiveTrigger('external_validation_seeking');
        return 'external_validation_seeking';
      }
    }

    return null;
  }, []);

  const clearTrigger = useCallback(() => {
    setActiveTrigger(null);
  }, []);

  return { activeTrigger, checkMessage, clearTrigger };
}
