import React, { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import {
  SURFACE_CARD,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  GLASS_BORDER,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * NextStepBanner
 *
 * AI-powered contextual suggestion bar at the top of CanvasScreen.
 * Calls /api/next-step with current context (brief, draft, word count)
 * and shows a one-line suggestion of what tool to use next.
 *
 * Props:
 *   briefText, rubricText, draftText, wordCount, targetWords,
 *   assessmentTitle, courseId, activePanel, onSelectPanel
 */
export default function NextStepBanner({
  briefText, rubricText, draftText, wordCount, targetWords,
  assessmentTitle, activePanel, onSelectPanel,
}) {
  const { activeTier } = useSettings();
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [toolsUsed, setToolsUsed] = useState([]);

  // Track which panels the user has opened
  useEffect(() => {
    if (activePanel && !toolsUsed.includes(activePanel)) {
      setToolsUsed(prev => [...prev, activePanel]);
    }
  }, [activePanel, toolsUsed]);

  // Fetch suggestion on mount and when context changes significantly
  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/next-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            briefText: (briefText || '').slice(0, 500),
            rubricText: (rubricText || '').slice(0, 300),
            draftText: '',
            wordCount, targetWords, assessmentTitle,
            tier: activeTier, toolsUsed, currentPanel: activePanel,
          }),
        });
        const data = await response.json();
        if (data.success) setSuggestion(data.suggestion);
      } catch { /* network error, non-blocking */ }
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [briefText?.length > 0, wordCount > 100, dismissed]); // eslint-disable-line

  if (dismissed || (!suggestion && !loading)) return null;

  // Parse tool name from suggestion to make it clickable
  const toolMap = {
    'Brief Simplifier': 'simplify', 'Rubric Decoder': 'rubric', 'Socratic Tutor': 'tutor',
    'Essay Scorer': 'scorer', 'Hidden Curriculum': 'hidden', 'UDL': 'udl',
    'Past Questions': 'pastqs', 'Voice Input': null,
  };

  const handleClick = () => {
    for (const [name, panel] of Object.entries(toolMap)) {
      if (suggestion.includes(name) && panel) {
        onSelectPanel(panel);
        setDismissed(true);
        return;
      }
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 16px', margin: '0 0 1px',
      background: ACCENT_GLASS, borderBottom: `1px solid ${ACCENT_BORDER}`,
      cursor: suggestion ? 'pointer' : 'default',
    }} onClick={handleClick} role="status" aria-live="polite">
      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, flexShrink: 0 }}>
        {loading ? 'Thinking...' : 'Next step'}
      </span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, flex: 1 }}>
        {loading ? '' : suggestion.split('\n')[0]?.replace(/^NEXT:\s*/i, '')}
      </span>
      <button type="button" onClick={e => { e.stopPropagation(); setDismissed(true); }}
        aria-label="Dismiss suggestion"
        style={{ background: 'none', border: 'none', color: TEXT_FAINT, cursor: 'pointer', fontSize: 14, padding: 4, minWidth: 28, minHeight: 28 }}>
        {'\u2715'}
      </button>
    </div>
  );
}
