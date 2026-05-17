import React, { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import useLearnerContext from '../hooks/useLearnerContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import AsciiLoader from './AsciiLoader';
import { announceAction } from '../services/PredictabilityService';
import ResponseFeedback from './ResponseFeedback';
import StructuredScaffold from './StructuredScaffold';
import StructuredRubric from './StructuredRubric';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * ToolPanel
 *
 * Generic panel component for embedded AI tools.
 * Each tool has a different API endpoint and prompt,
 * but the UI pattern is the same: button > loading > result.
 *
 * Props:
 *   toolId          - string (e.g. 'brief-simplifier')
 *   title           - string
 *   description     - string
 *   endpoint        - string (e.g. '/api/simplify-brief')
 *   buildPayload    - function(briefText, rubricText, draftText, settings) => request body
 *   resultKey       - string (key in response JSON containing the output)
 *   buttonLabel     - string
 *   briefText       - string
 *   rubricText      - string
 *   draftText       - string
 *   assessmentTitle - string
 *   courseId         - string
 */
export default function ToolPanel({
  toolId, title, description, endpoint, buildPayload, resultKey,
  buttonLabel, briefText, rubricText, draftText, assessmentTitle, courseId,
}) {
  const { activeTier, isLiteralMode, accessibilityProfile } = useSettings();
  const { learnerContext } = useLearnerContext();
  const { user } = useAuth();
  const [result, setResult] = useState('');
  const [structuredData, setStructuredData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load cached result on mount
  useEffect(() => {
    if (!user || !courseId || !toolId) return;
    supabase.from('assessment_representations')
      .select('content')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .eq('type', toolId)
      .maybeSingle()
      .then(({ data }) => { if (data?.content) setResult(data.content); });
  }, [user, courseId, toolId]);

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const proceed = await announceAction({
        type: 'ai_response',
        description: `Generate ${title}`,
        estimatedMs: 10000,
      });
      if (proceed === 'cancel') { setLoading(false); return; }

      const payload = buildPayload(briefText, rubricText, draftText, {
        tier: activeTier, assessmentTitle,
        literalMode: isLiteralMode || false,
        accessibilityProfile: accessibilityProfile || 'standard',
        learnerContext: learnerContext || undefined,
      });
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        const content = data[resultKey] || '';
        setResult(content);
        // Store structured JSON if present (scaffold for brief, rubricData for rubric)
        if (data.scaffold) setStructuredData({ type: 'scaffold', data: data.scaffold });
        else if (data.rubricData) setStructuredData({ type: 'rubric', data: data.rubricData });
        else setStructuredData(null);
        // Persist to Supabase
        if (user && courseId && content) {
          supabase.from('assessment_representations').upsert({
            assessment_id: assessmentTitle || 'default',
            course_id: courseId,
            user_id: user.id,
            type: toolId,
            content,
          }, { onConflict: 'assessment_id,course_id,user_id,type' }).catch(() => {});
        }
      } else {
        setError(data.error || 'Tool failed. Try again.');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Strip markdown artifacts from AI responses so raw syntax does not
  // leak into the UI. Handles bold, italic, links, and heading markers.
  const cleanMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')      // **bold**
      .replace(/__(.+?)__/g, '$1')            // __bold__
      .replace(/\*(.+?)\*/g, '$1')            // *italic*
      .replace(/_(.+?)_/g, '$1')              // _italic_
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text
      .replace(/^#{1,4}\s+/gm, '');           // # headings
  };

  const hasInput = (briefText && briefText.length > 20) || (draftText && draftText.length > 50);

  return (
    <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 4px' }}>
          {title}
        </h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: 0 }}>{description}</p>
      </div>

      {!hasInput && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_FAINT, margin: 0 }}>
          Upload your assessment to unlock this tool.
        </p>
      )}

      {hasInput && !result && !loading && (
        <button type="button" onClick={run}
          style={{
            fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: ACCENT_PULSE, background: ACCENT_GLASS,
            border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS,
            padding: '10px 14px', cursor: 'pointer', minHeight: 44, outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          {buttonLabel}
        </button>
      )}

      {loading && <AsciiLoader status={`Running ${title}...`} />}
      {error && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_WARN, margin: 0 }}>{error}</p>}

      {result && (
        <div style={{ maxHeight: 500, overflowY: 'auto', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, color: ACCENT_PULSE, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
            <button type="button" onClick={() => { setResult(''); setStructuredData(null); run(); }}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 8, color: TEXT_FAINT, background: 'none', border: `1px solid ${SURFACE_RAISED}`, borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}>
              Regenerate
            </button>
          </div>
          {structuredData?.type === 'scaffold' ? (
            <StructuredScaffold scaffold={structuredData.data} />
          ) : structuredData?.type === 'rubric' ? (
            <StructuredRubric rubricData={structuredData.data} />
          ) : (
            <pre style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {cleanMarkdown(result)}
            </pre>
          )}
          <ResponseFeedback toolName={toolId} context={{ assessmentTitle, courseId }} />
        </div>
      )}
    </div>
  );
}
