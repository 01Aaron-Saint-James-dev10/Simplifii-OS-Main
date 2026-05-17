import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../SettingsContext';
import { useProject } from '../ProjectContext';
import { useRouter } from '../../contexts/RouterContext';
import useLearnerContext from '../hooks/useLearnerContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useAuraVoice } from '../hooks/useAuraVoice';
import { checkDocumentStaleness, logResponseFlag } from '../../services/AccuracyLogger';
import { getQueuedAuraMessages } from '../../core/TaskLifecycleManager';
import { buildAssessmentKey, getCurrentPhase } from '../../core/TaskSequenceManager';
import { loadLastSession } from '../../services/SessionSummaryService';
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
  const { isLiteralMode, accessibilityProfile, activeTier, scaffoldingLevel, gritLevel, lodLevel, persona } = useSettings();
  const { courses } = useProject();
  const { courseId, assessmentTitle: routerAssessment } = useRouter();
  const { learnerContext } = useLearnerContext();

  // Derive active task context
  const activeCourse = courseId ? courses?.[courseId] : null;
  // All documents for this course (stable ref for downstream useMemo)
  const allCourseDocs = useMemo(() => {
    const ext = activeCourse?.extractionData;
    if (!ext) return [];
    return ext.assessmentBriefs || ext.documents || ext.files || [];
  }, [activeCourse?.extractionData]);
  const activeDocType = activeCourse?.extractionData?.documentType || '';

  // Scope to active assessment: filter by routerAssessment title if set.
  // Fallback to all docs if no match found (backwards compatible).
  const allDocs = useMemo(() => {
    if (!routerAssessment || allCourseDocs.length <= 1) return allCourseDocs;
    const matched = allCourseDocs.filter(d => {
      const display = d.weight ? `${d.title} (${d.weight})` : d.title;
      return display === routerAssessment || d.title === routerAssessment;
    });
    return matched.length > 0 ? matched : allCourseDocs;
  }, [routerAssessment, allCourseDocs]);

  // Use highest-priority doc for primary title (assessment brief > rubric > other)
  const primaryDoc = allDocs.find(d => d.source === 'explicit' || d.weight) || allDocs[0];
  const activeAssessmentTitle = routerAssessment || primaryDoc?.title || '';
  const activeWeight = primaryDoc?.weight || '';

  // Sprint 5: current task phase for AURA context
  const taskPhases = activeCourse?.extractionData?.taskSequence?.phases || [];
  const currentPhase = useMemo(() => {
    if (!taskPhases.length || !courseId || !activeAssessmentTitle) return null;
    return getCurrentPhase(buildAssessmentKey(courseId, activeAssessmentTitle), taskPhases);
  }, [courseId, activeAssessmentTitle, taskPhases]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeDueDate = primaryDoc?.dueDate || '';
  const rubricCriteria = activeCourse?.extractionData?.rubricCriteria || [];

  // Build structured assessment summary (confirmed accurate data the canvas uses)
  const assessmentSummary = useMemo(() => {
    const parts = [];
    if (activeAssessmentTitle) parts.push(`ASSESSMENT: ${activeAssessmentTitle}`);
    if (activeWeight) parts.push(`Weight: ${activeWeight}`);
    if (activeDueDate) parts.push(`Due: ${activeDueDate}`);
    if (allDocs.length > 1) {
      parts.push(`Other assessments in this course:`);
      allDocs.slice(1, 5).forEach(d => {
        parts.push(`  - ${d.title || 'Untitled'}${d.weight ? ' (' + d.weight + ')' : ''}${d.dueDate ? ' due ' + d.dueDate : ''}`);
      });
    }
    if (rubricCriteria.length > 0) {
      parts.push(`Rubric criteria: ${rubricCriteria.map(r => r.criterion || r).join('; ')}`);
    }
    return parts.length > 0 ? parts.join('\n') : '';
  }, [activeAssessmentTitle, activeWeight, activeDueDate, allDocs, rubricCriteria]);

  // Build structured document context for AURA (INGESTION CONTRACT)
  // Priority: typed nodes[] > typed documents[] > assessmentBriefs[].body > rawText fallback
  const activeBriefText = useMemo(() => {
    const ext = activeCourse?.extractionData;
    if (!ext) return '';

    // Highest priority: typed nodes (XN, YN, Z schema from Sprint 4)
    const nodes = ext.nodes;
    if (nodes && nodes.length > 0) {
      const findNode = (type) => nodes.find(n => n.nodeType === type && n.content && n.confidence > 0);
      const parts = [];
      const xn1 = findNode('XN1');
      if (xn1) parts.push(`[TASK DESCRIPTION]\n${xn1.content}`);
      const xn2 = findNode('XN2');
      if (xn2) parts.push(`[FORMAT REQUIREMENTS]\n${xn2.content}`);
      const xn3 = findNode('XN3');
      if (xn3) parts.push(`[DUE DATE] ${xn3.content}`);
      const xn4 = findNode('XN4');
      if (xn4) parts.push(`[LEARNING OUTCOMES]\n${xn4.content}`);
      const xn5 = findNode('XN5');
      if (xn5) parts.push(`[HIDDEN CURRICULUM]\n${xn5.content}`);
      const yn1 = findNode('YN1');
      if (yn1) parts.push(`[RUBRIC CRITERIA]\n${yn1.content}`);
      const yn2 = findNode('YN2');
      if (yn2) parts.push(`[GRADE BANDS]\n${yn2.content}`);
      const yn4 = findNode('YN4');
      if (yn4) parts.push(`[RUBRIC HIDDEN CURRICULUM]\n${yn4.content}`);
      const z1 = findNode('Z1');
      if (z1) parts.push(`[COURSE METADATA]\n${z1.content}`);
      const z5 = findNode('Z5');
      if (z5) parts.push(`[POLICIES]\n${z5.content}`);
      if (parts.length > 0) return parts.join('\n\n').slice(0, 3200);
    }

    // Second priority: typed documents array from per-file classification
    const typedDocs = ext.documents;
    if (typedDocs && typedDocs.length > 0) {
      const parts = [];
      for (const doc of typedDocs.slice(0, 5)) {
        const header = `[${doc.type.toUpperCase()}: ${doc.title || doc.filename}]`;
        const meta = [];
        if (doc.weighting) meta.push(`Weight: ${doc.weighting}%`);
        if (doc.words) meta.push(`Word count: ${doc.words}`);
        if (doc.dueDate) meta.push(`Due: ${doc.dueDate}`);
        if (doc.rubricCriteria?.length > 0) meta.push(`Rubric criteria: ${doc.rubricCriteria.join('; ')}`);
        const metaLine = meta.length > 0 ? `\n${meta.join(' | ')}` : '';
        const content = doc.text ? doc.text.slice(0, 600) : '';
        parts.push(`${header}${metaLine}\n${content}`);
      }
      return parts.join('\n\n---\n\n').slice(0, 3200);
    }

    // Fallback: structured briefs with bodies
    const docsWithBodies = allDocs.filter(d => d.body && d.body.length > 20);
    if (docsWithBodies.length > 0) {
      const labelled = docsWithBodies
        .slice(0, 4)
        .map((doc, i) => `[${doc.title || `Document ${i + 1}`}]\n${doc.body.slice(0, 800)}`)
        .join('\n\n---\n\n');
      return labelled.slice(0, 3200);
    }

    // Last resort: raw text blob (legacy courses)
    const rawText = ext.rawText || ext.primaryRawText || '';
    if (rawText) return rawText.slice(0, 3200);

    return '';
  }, [allDocs, activeCourse]);

  // Dashboard context: when no canvas is active, give AURA awareness of all courses
  const dashboardContext = useMemo(() => {
    if (courseId) return ''; // Inside a canvas, not needed
    const entries = Object.entries(courses || {});
    if (entries.length === 0) return '';
    const lines = entries.slice(0, 8).map(([, c]) => {
      const briefs = c.extractionData?.assessmentBriefs || [];
      const primary = briefs[0];
      const code = c.code || c.name || 'Untitled';
      const title = primary?.title || 'Assessment';
      const due = primary?.dueDate || 'date unknown';
      const weight = primary?.weight || '?';
      return `${code}: ${title} due ${due} (${weight}%)`;
    });
    return `DASHBOARD VIEW - Student's current workload:\n${lines.join('\n')}\n\nThe student is on the dashboard, not inside a specific assessment. Respond with awareness of their full workload. If they ask what to work on next, look at due dates and suggest the most urgent assessment.`;
  }, [courseId, courses]);

  // Document inventory for AURA context
  const docInventory = useMemo(() => {
    if (allDocs.length === 0) return '';
    return `LOADED DOCUMENTS (${allDocs.length} total):\n` +
      allDocs.map((d, i) => `- ${d.title || `Document ${i + 1}`}`).join('\n');
  }, [allDocs]);

  // Session continuity: load last session for cross-session memory
  const [lastSession, setLastSession] = useState(null);
  useEffect(() => {
    if (!user?.id) return;
    loadLastSession(user.id).then(s => { if (s) setLastSession(s); });
  }, [user?.id]);

  const greetingText = useMemo(() => {
    // If returning from a previous session, reference it
    if (lastSession && lastSession.days_ago > 0 && lastSession.growth_signals?.length > 0) {
      const signal = lastSession.growth_signals[0];
      return `Last time you ${signal}. Ready to pick up where you left off?`;
    }
    if (lastSession && lastSession.days_ago > 0 && lastSession.tasks_touched?.length > 0) {
      return `Welcome back. Last session you worked on ${lastSession.tasks_touched[0]}. Want to continue, or start something new?`;
    }
    if (!activeAssessmentTitle) return 'What are you working on? Tap "+ Add work" to upload your assignment, or just tell me what you need help with.';

    // Contextual greeting with specific next action
    const details = [activeWeight, activeDueDate ? `due ${activeDueDate}` : ''].filter(Boolean).join(', ');
    const hasContent = activeBriefText && activeBriefText.length > 100;
    const paretoStep = activeCourse?.extractionData?.paretoSteps?.[0] || '';

    if (!hasContent) {
      // No documents loaded yet
      return `Working on "${activeAssessmentTitle}"${details ? ` (${details})` : ''}. To get started, tap "Add docs" to upload your assignment brief or rubric. I will build your plan from there.`;
    }
    if (paretoStep) {
      // Documents loaded, has Pareto steps
      return `Working on "${activeAssessmentTitle}"${details ? ` (${details})` : ''}. Your first focus is: ${paretoStep}. Tap "Starters" on the left when you are ready, or ask me anything.`;
    }
    // Documents loaded, no Pareto
    return `Working on "${activeAssessmentTitle}"${details ? ` (${details})` : ''}. I have your documents loaded. What would you like to start with?`;
  }, [activeAssessmentTitle, activeWeight, activeDueDate, activeBriefText, activeCourse, lastSession]);

  const { speak, stopSpeaking, isSpeaking, startContinuousListening, stopContinuousListening, isListeningContinuous } = useAuraVoice();
  const [voiceMode, setVoiceMode] = useState(false);

  const [messages, setMessages] = useState(() => {
    try {
      const cached = sessionStorage.getItem(`simplifii_aura_chat_${user?.id || 'anon'}`);
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
    if (messages.length > 1) sessionStorage.setItem(`simplifii_aura_chat_${user?.id || 'anon'}`, JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // BUG 3 FIX: Reset AURA chat when courseId changes
  const prevCourseRef = useRef(courseId);
  useEffect(() => {
    if (courseId && courseId !== prevCourseRef.current) {
      prevCourseRef.current = courseId;
      sessionStorage.removeItem(`simplifii_aura_chat_${user?.id || 'anon'}`);
      setMessages([{ role: 'tutor', text: greetingText }]);
    }
  }, [courseId, greetingText]);

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

  // Listen for injected AURA messages (from DecisionButton, proactive triggers)
  useEffect(() => {
    const handler = (e) => {
      const msg = e.detail?.message;
      if (msg) setMessages(prev => [...prev, { role: 'tutor', text: msg }]);
    };
    window.addEventListener('simplifii:aura-inject', handler);
    return () => window.removeEventListener('simplifii:aura-inject', handler);
  }, []);

  // Detect new documents added mid-session and proactively acknowledge
  const prevDocCountRef = useRef(allDocs.length);
  useEffect(() => {
    const prevCount = prevDocCountRef.current;
    const newCount = allDocs.length;
    if (newCount > prevCount && prevCount > 0) {
      // A new document was added mid-session
      const newest = allDocs[allDocs.length - 1];
      const docType = newest?.type || activeDocType || 'document';
      const docTitle = newest?.title || 'a new document';
      const actionMap = {
        brief: `decode the requirements and build you a scaffold`,
        rubric: `decode the rubric into plain language actions`,
        exam_paper: `break down the questions and create a practice plan`,
        course_outline: `extract your assessments and due dates`,
        reading: `summarise the key points`,
      };
      const action = actionMap[docType] || 'help you work with it';
      const suggestedTool = docType === 'rubric' ? 'rubric' : docType === 'exam_paper' ? 'pastqs' : 'simplify';
      setMessages(prev => [...prev, {
        role: 'tutor',
        text: `I can see you added ${docTitle} (${docType}). Want me to ${action}?`,
        toolSuggestion: suggestedTool,
      }]);
    }
    prevDocCountRef.current = newCount;
  }, [allDocs.length]);

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

      // Detect overwhelm signal from quick-reply chips
      const isOverwhelmed = text.trim().toLowerCase().includes('overwhelm');

      // Use dashboard context when no canvas is active, otherwise use brief text
      const effectiveBriefText = activeBriefText || dashboardContext || '';
      const hasDocContext = effectiveBriefText && effectiveBriefText.length >= 100;
      const hasPartialContext = effectiveBriefText && effectiveBriefText.length > 0 && effectiveBriefText.length < 100;
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: stalenessWarning
            ? [{ role: 'user', text: stalenessWarning }, ...updated.slice(1)]
            : updated.slice(1),
          assessmentTitle: activeAssessmentTitle || undefined,
          assessmentSummary: assessmentSummary || undefined,
          briefText: hasDocContext ? effectiveBriefText.slice(0, 3200) : undefined,
          documentType: activeDocType || undefined,
          documentCount: allDocs.length || Object.keys(courses || {}).length,
          documentInventory: docInventory || undefined,
          overwhelmSignal: isOverwhelmed || undefined,
          documentContextAvailable: hasDocContext,
          documentContextPartial: hasPartialContext,
          voiceMode: isListening || false,
          tier: activeTier || 'tertiary',
          literalMode: isLiteralMode || false,
          accessibilityProfile: accessibilityProfile || 'standard',
          learnerContext: learnerContext || undefined,
          steeringDials: {
            persona: persona || 'Literal',
            scaffolding: scaffoldingLevel === 'heavy' ? 'Heavy' : scaffoldingLevel === 'light' ? 'Light' : 'Heavy',
            grit: gritLevel === 'socratic' ? 'Hard Socratic' : gritLevel === 'literal' ? 'Literal Assistant' : 'Literal Assistant',
            lod: lodLevel === 'map' ? 'Map' : lodLevel === 'compass' ? 'Compass' : 'Sprint',
          },
          lastSession: lastSession ? {
            days_ago: lastSession.days_ago,
            tasks_touched: lastSession.tasks_touched,
            growth_signals: lastSession.growth_signals,
            blocks_completed: lastSession.blocks_completed,
          } : undefined,
          user_id: user?.id || null,
          currentPhase: currentPhase || undefined,
        }),
      });
      const data = await response.json();
      if (data.success && data.reply && data.reply.trim()) {
        // Strip markdown from AURA response (no raw **bold**, __italic__, [links]())
        const clean = data.reply
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/__(.+?)__/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/_(.+?)_/g, '$1')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/^#{1,4}\s+/gm, '');
        dispatchAuraState('speaking');
        setMessages(prev => [...prev, { role: 'tutor', text: clean, toolSuggestion: data.toolSuggestion || null }]);
        // Speak response if voice mode is on OR if the user used any voice input
        if (voiceMode || isListeningContinuous || isListening) speak(clean);
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
  }, [messages, loading, activeTier, isLiteralMode, accessibilityProfile, learnerContext, user, isListening, stopVoice, activeAssessmentTitle, activeBriefText, activeDocType, dashboardContext, courses]);
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
            {isSpeaking ? 'Speaking...' : loading ? 'Thinking...' : isListeningContinuous ? 'Listening...' : 'Your cognitive GPS'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              const next = !voiceMode;
              setVoiceMode(next);
              if (next) {
                startContinuousListening((text) => { if (sendRef.current) sendRef.current(text); });
              } else {
                stopContinuousListening();
                stopSpeaking();
              }
            }}
            aria-label={voiceMode ? 'Exit voice mode' : 'Enter voice mode'}
            title={voiceMode ? 'Voice mode ON' : 'Voice mode OFF'}
            style={{
              background: voiceMode ? ACCENT_GLASS : 'none',
              border: voiceMode ? `1px solid ${ACCENT_BORDER}` : '1px solid transparent',
              borderRadius: BORDER_RADIUS, cursor: 'pointer', padding: '2px 6px',
              fontSize: 12, color: voiceMode ? ACCENT_PULSE : TEXT_FAINT,
              minHeight: 28, minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {voiceMode ? '\u{1F50A}' : '\u{1F507}'}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AURA"
            style={{ background: 'none', border: 'none', color: TEXT_FAINT, cursor: 'pointer', fontSize: 16, padding: 4, minHeight: 28, minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            &times;
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => {
          // Tool suggestion from API (separated server-side, never in m.text)
          const toolMatch = m.toolSuggestion ? [null, m.toolSuggestion] : null;
          const displayText = m.text;
          const toolLabels = { simplify: 'Scaffold my assessment', rubric: 'Decode my rubric', scorer: 'Check my draft', hidden: 'Hidden curriculum', humanise: 'Make it sound like me', check: 'Rubric check', pastqs: 'Past questions', udl: '4 ways to understand', analysis: 'Writing metrics' };

          return (
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
              {displayText}
            </p>
            {toolMatch && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('simplifii:open-tool', { detail: { toolId: toolMatch[1] } }))}
                style={{
                  marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.04em', color: ACCENT_PULSE, background: ACCENT_GLASS,
                  border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS + 2,
                  cursor: 'pointer', outline: 'none',
                }}
              >
                <span style={{ fontSize: 12 }}>{'\u2192'}</span>
                {toolLabels[toolMatch[1]] || toolMatch[1]}
              </button>
            )}
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
          );
        })}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '8px 10px', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS + 4 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_FAINT, margin: 0 }}>...</p>
          </div>
        )}
      </div>

      {/* Contextual quick-reply chips */}
      {messages.length <= 1 && (
        <div style={{ padding: '4px 12px 8px', display: 'flex', gap: 6, overflowX: 'auto', borderTop: `1px solid ${SURFACE_RAISED}` }}>
          {(activeAssessmentTitle
            ? ['Where do I start with this?', 'Decode my rubric', 'What are the hidden expectations?', 'I am feeling overwhelmed']
            : ['I am not sure where to start', 'I have an assignment due soon', 'I want to understand my rubric', 'I am feeling overwhelmed']
          ).map(chip => (
            <button key={chip} type="button" onClick={() => { if (sendRef.current) sendRef.current(chip); }}
              style={{ flexShrink: 0, padding: '5px 10px', fontFamily: FONT_SYSTEM, fontSize: 11, color: TEXT_MUTED, background: 'transparent', border: `1px solid ${SURFACE_RAISED}`, borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {chip}
            </button>
          ))}
        </div>
      )}

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
            onClick={() => { if (isListening) { stopVoice(); } else { startVoice(); setVoiceMode(true); } }}
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
