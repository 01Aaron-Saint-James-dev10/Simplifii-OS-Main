import React, { useState } from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  FOCUS_RING,
} from '../../theme/tokens';

/**
 * TutorPanel
 *
 * Right panel. Socratic tutor chat interface.
 * Framing: asks questions, never writes for the user.
 * This protects the authenticity moat.
 *
 * For v1: stub responses (questions only).
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

// TODO: wire to /api/tutor (Anthropic API, Socratic mode only)
function getSocraticResponse(userMessage) {
  const responses = [
    'That is a good start. Can you be more specific about which evidence supports that claim?',
    'Interesting. What would someone who disagrees say?',
    'You mentioned the method. Can you describe what you actually measured?',
    'What is the one sentence that captures your whole argument?',
    'If I were the marker, what would I look for in this paragraph that you have not said yet?',
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export default function TutorPanel({ assessmentTitle }) {
  const [messages, setMessages] = useState([
    { role: 'tutor', text: `Working on "${assessmentTitle || 'your assessment'}". What are you stuck on?` },
  ]);
  const [input, setInput] = useState('');

  const send = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text: text.trim() };
    const tutorMsg = { role: 'tutor', text: getSocraticResponse(text) };
    setMessages(prev => [...prev, userMsg, tutorMsg]);
    setInput('');
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
          </div>
        ))}
      </div>

      {/* Quick prompts */}
      <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 4, borderTop: `1px solid ${SURFACE_RAISED}` }}>
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => send(p)}
            style={{
              fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 600, letterSpacing: '0.02em',
              color: TEXT_MUTED, background: 'transparent',
              border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS,
              padding: '4px 8px', cursor: 'pointer', outline: 'none', minHeight: 28,
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${SURFACE_RAISED}`, display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(input); }}
          placeholder="Ask a question..."
          aria-label="Message the tutor"
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
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, color: ACCENT_PULSE,
            background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`,
            borderRadius: BORDER_RADIUS, padding: '8px 12px', cursor: 'pointer',
            outline: 'none', minHeight: 44, minWidth: 44,
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
