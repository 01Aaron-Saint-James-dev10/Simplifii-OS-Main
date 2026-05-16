import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../SettingsContext';
import { useProject } from '../ProjectContext';
import { useRouter } from '../../contexts/RouterContext';
import useLearnerContext from '../hooks/useLearnerContext';
import {
  SURFACE_CARD, SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  OVERLAY_BACKDROP,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * AuraChatOverlay
 *
 * Floating chat panel triggered by clicking the AURA orb.
 * Portaled to document.body. Calls /api/tutor directly.
 * Dispatches aura-state events to drive orb animations.
 */

function dispatchAuraState(state) {
  window.dispatchEvent(new CustomEvent('simplifii:aura-state', { detail: { state } }));
}

export default function AuraChatOverlay({ open, onClose }) {
  const { user } = useAuth();
  const { isLiteralMode, accessibilityProfile, activeTier } = useSettings();
  const { courses } = useProject();
  const { courseId, assessmentTitle: routerAssessment } = useRouter();
  const { learnerContext } = useLearnerContext();

  // Derive active task context for AURA
  const activeCourse = courseId ? courses?.[courseId] : null;
  const activeAssessmentTitle = routerAssessment
    || activeCourse?.extractionData?.assessmentBriefs?.[0]?.title
    || '';
  const activeBriefText = activeCourse?.extractionData?.assessmentBriefs?.[0]?.body || '';
  const activeDocType = activeCourse?.extractionData?.documentType || '';
  const greetingText = activeAssessmentTitle
    ? `Working on "${activeAssessmentTitle}". What do you need help with?`
    : 'What are you working on? I can help you figure out the next step.';
  const defaultGreeting = [{ role: 'tutor', text: greetingText }];
  const [messages, setMessages] = useState(() => {
    try {
      const cached = sessionStorage.getItem('simplifii_aura_chat');
      if (cached) { const parsed = JSON.parse(cached); if (Array.isArray(parsed) && parsed.length > 0) return parsed; }
    } catch { /* ignore */ }
    return defaultGreeting;
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Persist chat to sessionStorage
  useEffect(() => {
    if (messages.length > 1) sessionStorage.setItem('simplifii_aura_chat', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', text: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    dispatchAuraState('thinking');

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.slice(1), // skip greeting
          assessmentTitle: activeAssessmentTitle,
          briefText: activeBriefText.slice(0, 2000),
          documentType: activeDocType,
          tier: activeTier || 'tertiary',
          literalMode: isLiteralMode || false,
          accessibilityProfile: accessibilityProfile || 'standard',
          learnerContext: learnerContext || undefined,
          user_id: user?.id || null,
        }),
      });
      const data = await response.json();
      if (data.success && data.reply) {
        dispatchAuraState('speaking');
        setMessages(prev => [...prev, { role: 'tutor', text: data.reply }]);
        // Return to idle after a short display period
        setTimeout(() => dispatchAuraState('idle'), 2000);
      } else {
        setMessages(prev => [...prev, { role: 'tutor', text: 'Could not connect. Try again.' }]);
        dispatchAuraState('idle');
      }
    } catch {
      setMessages(prev => [...prev, { role: 'tutor', text: 'Network error. Try again.' }]);
      dispatchAuraState('idle');
    } finally {
      setLoading(false);
    }
  }, [messages, loading, activeTier, isLiteralMode, accessibilityProfile, learnerContext, user]);

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 92,
        right: 20,
        width: 360,
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: 480,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        background: SURFACE_CARD,
        border: `1px solid ${ACCENT_BORDER}`,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 48px rgba(16,185,129,0.1)',
        overflow: 'hidden',
      }}
      role="dialog"
      aria-modal="false"
      aria-label="AURA assistant"
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${SURFACE_RAISED}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE }}>
            AURA
          </span>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, marginLeft: 8 }}>
            {loading ? 'Thinking...' : 'Your cognitive GPS'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AURA"
          style={{ background: 'none', border: 'none', color: TEXT_FAINT, cursor: 'pointer', fontSize: 16, padding: 4, minHeight: 28, minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          &times;
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: m.role === 'user' ? ACCENT_GLASS : 'transparent',
            border: `1px solid ${m.role === 'user' ? ACCENT_BORDER : SURFACE_RAISED}`,
            borderRadius: BORDER_RADIUS + 4,
            padding: '8px 10px',
          }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.5 }}>
              {m.text}
            </p>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '8px 10px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS + 4 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: 0 }}>...</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px 12px', borderTop: `1px solid ${SURFACE_RAISED}`, display: 'flex', gap: 6 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(input); }}
          placeholder="Ask AURA anything..."
          disabled={loading}
          style={{
            flex: 1, fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY,
            background: 'transparent', border: `1px solid ${SURFACE_RAISED}`,
            borderRadius: BORDER_RADIUS + 2, padding: '8px 10px', outline: 'none',
            minHeight: 36,
          }}
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          aria-label="Send"
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, color: ACCENT_PULSE,
            background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`,
            borderRadius: BORDER_RADIUS + 2, padding: '8px 12px',
            cursor: loading ? 'wait' : 'pointer', outline: 'none',
            minHeight: 36, minWidth: 44, opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>,
    document.body
  );
}
