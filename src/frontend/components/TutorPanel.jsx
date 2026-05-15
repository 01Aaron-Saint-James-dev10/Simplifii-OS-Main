import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import useConfidenceDetector from '../hooks/useConfidenceDetector';
import AffirmationBanner from './AffirmationBanner';
import ResponseFeedback from './ResponseFeedback';
import { announceAction } from '../services/PredictabilityService';
import ComprehensionCheck from './ComprehensionCheck';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * TutorPanel
 *
 * Right panel. Socratic tutor chat powered by Claude.
 * Framing: asks questions, never writes for the user.
 * This protects the authenticity moat.
 *
 * Props:
 *   assessmentTitle - string
 */

const QUICK_PROMPTS = [
  'What is the main argument of this section?',
  'Can you say it in plainer language?',
  'What evidence supports that?',
  'What is the opposite view?',
];

const DOC_TYPE_LABELS = {
  exam_paper: 'exam paper practice',
  rubric: 'rubric',
  brief: 'assessment',
  reading: 'reading',
  notes: 'notes',
};

export default function TutorPanel({ assessmentTitle, briefText, documentType }) {
  const { activeTier, homeLanguage, easyRead, autismFirstEnabled, sensoryLevel, specialInterests, isLiteralMode } = useSettings();
  const { activeTrigger, checkMessage, clearTrigger } = useConfidenceDetector();
  const [messages, setMessages] = useState([
    { role: 'tutor', text: documentType && DOC_TYPE_LABELS[documentType]
      ? `Working on your ${DOC_TYPE_LABELS[documentType]}. What are you stuck on?`
      : `Working on "${assessmentTitle || 'your assessment'}". What are you stuck on?` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', text: text.trim() };
    checkMessage(text.trim());
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const proceed = await announceAction({
        type: 'ai_response',
        description: 'Send your question to the tutor',
        estimatedMs: 5000,
      });
      if (proceed === 'cancel') { setLoading(false); return; }

      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.slice(1), // skip the initial greeting
          assessmentTitle,
          tier: activeTier || 'tertiary',
          homeLanguage: homeLanguage || 'en',
          easyRead: easyRead || false,
          briefText: briefText || '',
          documentType: documentType || '',
          sensoryLevel: autismFirstEnabled ? sensoryLevel : undefined,
          specialInterests: autismFirstEnabled && specialInterests?.length > 0 ? specialInterests : undefined,
          literalMode: isLiteralMode || false,
          decisionSkeleton: autismFirstEnabled || false,
        }),
      });
      const data = await response.json();
      if (data.success && data.reply) {
        setMessages(prev => [...prev, { role: 'tutor', text: data.reply }]);
      } else {
        setError(data.error || 'Could not reach the tutor. Try again.');
        // Fallback: local Socratic response
        const fallback = getFallbackResponse();
        setMessages(prev => [...prev, { role: 'tutor', text: fallback }]);
      }
    } catch {
      setError('Network error. Using offline mode.');
      const fallback = getFallbackResponse();
      setMessages(prev => [...prev, { role: 'tutor', text: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
        <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: 0 }}>
          Socratic Tutor
        </h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_FAINT, margin: '4px 0 0' }}>
          I ask questions. I never write for you.
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: m.role === 'user' ? ACCENT_GLASS : 'transparent',
            border: `1px solid ${m.role === 'user' ? ACCENT_BORDER : SURFACE_RAISED}`,
            borderRadius: BORDER_RADIUS,
            padding: '8px 10px',
          }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.5 }}>
              {m.text}
            </p>
            {m.role === 'tutor' && i > 0 && autismFirstEnabled && (
              <ComprehensionCheck
                messageIndex={i}
                onConfused={() => send('I did not understand that. Can you explain it a different way?')}
                onSortOf={() => send('I sort of get it. Can you give me an example?')}
              />
            )}
            {m.role === 'tutor' && i > 0 && <ResponseFeedback toolName="tutor" context={{ messageIndex: i }} />}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%', padding: '8px 10px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: 0 }}>Thinking...</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: COLOUR_WARN, padding: '4px 16px', margin: 0 }}>
          {error}
        </p>
      )}

      {/* Quick prompts */}
      <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 4, borderTop: `1px solid ${SURFACE_RAISED}` }}>
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => send(p)}
            disabled={loading}
            style={{
              fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600, letterSpacing: '0.02em',
              color: TEXT_MUTED, background: 'transparent',
              border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
              padding: '4px 8px', cursor: loading ? 'wait' : 'pointer', outline: 'none', minHeight: 28,
              opacity: loading ? 0.5 : 1,
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Confidence reinforcement */}
      {activeTrigger && (
        <AffirmationBanner trigger={activeTrigger} visible={true} />
      )}

      {/* Input */}
      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${SURFACE_RAISED}`, display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(input); }}
          placeholder="Ask a question..."
          aria-label="Message the tutor"
          disabled={loading}
          style={{
            flex: 1, fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY,
            background: 'transparent', border: `1px solid ${SURFACE_RAISED}`,
            borderRadius: BORDER_RADIUS, padding: '8px 10px', outline: 'none',
            minHeight: 36,
          }}
        />
        <button
          type="button"
          onClick={() => send(input)}
          aria-label="Send"
          disabled={loading}
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, color: ACCENT_PULSE,
            background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`,
            borderRadius: BORDER_RADIUS, padding: '8px 12px',
            cursor: loading ? 'wait' : 'pointer',
            outline: 'none', minHeight: 44, minWidth: 44,
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function getFallbackResponse() {
  const responses = [
    'That is a good start. Can you be more specific about which evidence supports that claim?',
    'Interesting. What would someone who disagrees say?',
    'You mentioned the method. Can you describe what you actually measured?',
    'What is the one sentence that captures your whole argument?',
    'If I were the marker, what would I look for in this paragraph that you have not said yet?',
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
