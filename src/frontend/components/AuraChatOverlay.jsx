import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../SettingsContext';
import { useProject } from '../ProjectContext';
import { useRouter } from '../../contexts/RouterContext';
import useLearnerContext from '../hooks/useLearnerContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { checkDocumentStaleness, logResponseFlag } from '../../services/AccuracyLogger';
import { getQueuedAuraMessages } from '../../core/TaskLifecycleManager';
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

  // Derive active task context from ALL uploaded documents (not just [0])
  const activeCourse = courseId ? courses?.[courseId] : null;
  const allDocs = activeCourse?.extractionData?.assessmentBriefs || [];
  const activeDocType = activeCourse?.extractionData?.documentType || '';

  // Use highest-priority doc for primary title (assessment brief > rubric > other)
  const primaryDoc = allDocs.find(d => d.source === 'explicit' || d.weight) || allDocs[0];
  const activeAssessmentTitle = routerAssessment || primaryDoc?.title || '';

  // Build aggregated brief text from ALL docs (cap each at 600 chars, total 3200)
  const activeBriefText = useMemo(() => {
    if (allDocs.length === 0) return '';
    return allDocs
      .slice(0, 6)
      .map((doc, i) => {
        const body = (doc?.body || '').slice(0, 600);
        if (!body) return '';
        return `[DOC ${i + 1}: ${doc?.title || 'Untitled'}]\n${body}`;
      })
      .filter(Boolean)
      .join('\n\n---\n\n')
      .slice(0, 3200);
  }, [allDocs]);

  // Document inventory for AURA context
  const docInventory = useMemo(() => {
    if (allDocs.length === 0) return '';
    return `LOADED DOCUMENTS (${allDocs.length} total):\n` +
      allDocs.map((d, i) => `- ${d.title || `Document ${i + 1}`}`).join('\n');
  }, [allDocs]);

  const greetingText = useMemo(() => {
    if (!activeAssessmentTitle) return 'What are you working on? I can help you figure out the next step.';
    return allDocs.length > 1
      ? `Working on "${activeAssessmentTitle}". I have ${allDocs.length} documents loaded for this course. What do you need help with?`
      : `Working on "${activeAssessmentTitle}". What do you need help with?`;
  }, [activeAssessmentTitle, allDocs.length]);

  const [messages, setMessages] = useState(() => {
    try {
      const cached = sessionStorage.getItem('simplifii_aura_chat');
      if (cached) { const parsed = JSON.parse(cached); if (Array.isArray(parsed) && parsed.length > 0) return parsed; }
    } catch { /* ignore */ }
    return [{ role: 'tutor', text: greetingText }];
  });

  // Update greeting when context arrives async (courses load after mount)
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'tutor' && prev[0].text !== greetingText) {
        return [{ role: 'tutor', text: greetingText }];
      }
      return prev;
    });
  }, [greetingText]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const { isListening, interimTranscript, start: startVoice, stop: stopVoice, isSupported: voiceSupported } = useSpeechToText();

  // Use a ref so the voice handler always calls the latest send
  const sendRef = useRef(null);

  // When voice transcript arrives, auto-send it via ref (avoids stale closure)
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const text = e.detail?.text;
      if (text && text.trim() && sendRef.current) sendRef.current(text.trim());
    };
    window.addEventListener('simplifii:voice-transcript', handler);
    return () => window.removeEventListener('simplifii:voice-transcript', handler);
  }, [open]);

  // Persist chat to sessionStorage
  useEffect(() => {
    if (messages.length > 1) sessionStorage.setItem('simplifii_aura_chat', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Focus input when opened + surface queued phase-transition messages
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 100);
    const queued = getQueuedAuraMessages();
    if (queued.length > 0) {
      const phaseMessages = queued.map(q => ({ role: 'tutor', text: q.message }));
      setMessages(prev => [...prev, ...phaseMessages]);
    }
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
    if (isListening) stopVoice();
    dispatchAuraState('thinking');

    try {
      // Staleness check: warn if document is expired
      let stalenessWarning = '';
      if (courseId && user?.id) {
        const staleness = await checkDocumentStaleness(courseId, user.id);
        if (staleness?.stale) {
          stalenessWarning = `[STALENESS WARNING: Document was ingested ${staleness.daysOld} days ago. Treat rubric data as unverified.]`;
        }
      }

      const hasDocContext = activeBriefText && activeBriefText.length >= 100;
      const hasPartialContext = activeBriefText && activeBriefText.length > 0 && activeBriefText.length < 100;
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: stalenessWarning
            ? [{ role: 'user', text: stalenessWarning }, ...updated.slice(1)]
            : updated.slice(1),
          assessmentTitle: activeAssessmentTitle || undefined,
          briefText: hasDocContext ? activeBriefText.slice(0, 3200) : undefined,
          documentType: activeDocType || undefined,
          documentCount: allDocs.length,
          documentInventory: docInventory || undefined,
          documentContextAvailable: allDocs.length > 0 && hasDocContext,
          documentContextPartial: hasPartialContext,
          voiceMode: isListening || false,
          tier: activeTier || 'tertiary',
          literalMode: isLiteralMode || false,
          accessibilityProfile: accessibilityProfile || 'standard',
          learnerContext: learnerContext || undefined,
          user_id: user?.id || null,
        }),
      });
      const data = await response.json();
      if (data.success && data.reply && data.reply.trim()) {
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
  }, [messages, loading, activeTier, isLiteralMode, accessibilityProfile, learnerContext, user, isListening, stopVoice, activeAssessmentTitle, activeBriefText, activeDocType]);
  sendRef.current = send;

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
      aria-modal="true"
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
            position: 'relative',
          }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.5 }}>
              {m.text}
            </p>
            {m.role === 'tutor' && i > 0 && (
              <button
                type="button"
                onClick={() => logResponseFlag({ userId: user?.id, callId: `msg_${i}`, sessionId: courseId || 'global', flagCategory: 'inaccurate' })}
                aria-label="Flag this response as inaccurate"
                title="Flag as wrong"
                style={{ position: 'absolute', bottom: 2, right: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: TEXT_FAINT, opacity: 0.4, padding: 2, lineHeight: 1 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = TEXT_FAINT; }}
              >
                &#9872;
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '8px 10px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS + 4 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: 0 }}>...</p>
          </div>
        )}
      </div>

      {/* Voice interim indicator */}
      {isListening && interimTranscript && (
        <div style={{ padding: '4px 12px', fontFamily: FONT_BODY, fontSize: 11, color: TEXT_FAINT, borderTop: `1px solid ${SURFACE_RAISED}` }}>
          {interimTranscript}...
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '8px 12px 12px', borderTop: isListening && interimTranscript ? 'none' : `1px solid ${SURFACE_RAISED}`, display: 'flex', gap: 6 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(input); }}
          placeholder={isListening ? 'Listening...' : 'Ask AURA anything...'}
          disabled={loading || isListening}
          style={{
            flex: 1, fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY,
            background: 'transparent', border: `1px solid ${isListening ? ACCENT_BORDER : SURFACE_RAISED}`,
            borderRadius: BORDER_RADIUS + 2, padding: '8px 10px', outline: 'none',
            minHeight: 36,
          }}
        />
        {voiceSupported && (
          <button
            type="button"
            onClick={isListening ? stopVoice : startVoice}
            aria-label={isListening ? 'Stop listening' : 'Voice input'}
            style={{
              fontFamily: FONT_SYSTEM, fontSize: 14, color: isListening ? '#ef4444' : ACCENT_PULSE,
              background: isListening ? 'rgba(239,68,68,0.1)' : ACCENT_GLASS,
              border: `1px solid ${isListening ? 'rgba(239,68,68,0.3)' : ACCENT_BORDER}`,
              borderRadius: BORDER_RADIUS + 2, padding: '0 10px',
              cursor: 'pointer', outline: 'none', minHeight: 36, minWidth: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isListening ? '\u25A0' : '\u{1F3A4}'}
          </button>
        )}
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
