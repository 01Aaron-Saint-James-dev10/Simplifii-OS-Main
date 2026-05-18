import React, { useState, useCallback, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import SentenceStarters from './SentenceStarters';
import IdeaToSentence from './IdeaToSentence';
import { appendEvent } from '../../core/HistoryOfThought';
import stripMarkdown from '../../utils/stripMarkdown';
import { literalise } from '../../core/LiteralMode';
import {
  SURFACE_RAISED, SURFACE_CARD,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

/**
 * PreWritePanel: Tier 1 of the Three-Tier Canvas
 *
 * AI-generated starting material the learner can accept, edit, or discard.
 * Every insert is logged to HistoryOfThought so the Authenticity Report
 * shows exactly what AI contributed vs what the learner wrote.
 *
 * Props:
 *   assessmentTitle  - string
 *   briefText        - string (assessment brief for context)
 *   sectionType      - string ('introduction' | 'body_1' | etc.)
 *   tier             - string (student tier)
 *   onInsert         - callback(text) inserts into Tier 3 editor
 */

const TIER_LABEL_STYLE = {
  fontFamily: FONT_SYSTEM,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: ACCENT_PULSE,
  padding: '6px 12px 4px',
  borderBottom: `1px solid ${SURFACE_RAISED}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export default function PreWritePanel({ assessmentTitle, briefText, rubricCriteria, sectionType, tier, onInsert, courseId, onContentReady }) {
  const { isLiteralMode, accessibilityProfile, sensoryLevel, autismFirstEnabled } = useSettings();
  const { user } = useAuth();
  const [scaffold, setScaffold] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState('scaffold'); // 'scaffold' | 'starters' | 'idea'

  // Load cached scaffold on mount
  useEffect(() => {
    if (!user || !courseId) return;
    const key = `pre_write_${sectionType || 'default'}`;
    supabase.from('assessment_representations')
      .select('content')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .eq('type', key)
      .maybeSingle()
      .then(({ data }) => { if (data?.content) setScaffold(data.content); });
  }, [user, courseId, sectionType]);

  const generateScaffold = useCallback(async () => {
    setLoading(true);
    setError('');
    setAccepted(false);
    try {
      const profileNote = accessibilityProfile && accessibilityProfile !== 'standard'
        ? `\nAdapt for ${accessibilityProfile} profile.` : '';
      const literalNote = isLiteralMode ? '\nUse plain, literal language. No metaphors or idioms.' : '';
      const criteriaList = (rubricCriteria || []).map(c => typeof c === 'string' ? c : c.criterion || c.name || '').filter(Boolean);
      const hasRubric = criteriaList.length > 0;
      const userPrompt = hasRubric
        ? `Generate a structured writing scaffold for the ${sectionType?.replace('_', ' ') || 'full'} section of: ${assessmentTitle}. Map it to the rubric criteria provided.`
        : `Generate a pre-write scaffold for the ${sectionType?.replace('_', ' ') || 'full'} section of: ${assessmentTitle}. Give 3-4 bullet points as starting ideas (not full sentences). Keep it brief.`;
      const systemPrompt = hasRubric
        ? `You are a pre-write assistant. Generate a structured writing scaffold for this specific assessment. For each rubric criterion listed below, provide: one concrete starter sentence specific to this task, and two focused questions that push thinking deeper. Format exactly as markdown:\n\n**[Criterion name]**\nStarter: [specific sentence].\nThink about: [specific question]?\nAlso consider: [specific question]?\n\nKeep each starter grounded in the actual task description: never generic. Australian English. No em-dashes.\n\nTask: ${(briefText || '').slice(0, 1500)}\n\nRubric criteria:\n${criteriaList.join('\n')}${profileNote}${literalNote}`
        : `You are a pre-write assistant. Generate 3-4 concise starting-point bullet points for the learner's ${sectionType || 'section'}. These are ideas to spark their thinking, NOT a completed answer. Australian English. No full paragraphs. No em-dashes.${profileNote}${literalNote}`;

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: userPrompt }],
          assessmentTitle,
          briefText: briefText?.slice(0, 1500) || '',
          tier: tier || 'tertiary',
          literalMode: isLiteralMode || false,
          accessibilityProfile: accessibilityProfile || 'standard',
          systemOverride: systemPrompt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const scaffoldText = isLiteralMode ? literalise(data.reply) : data.reply;
        setScaffold(scaffoldText);
        onContentReady?.();
        appendEvent({ event_type: 'pre_write_generated', payload: { assessmentTitle, sectionType } }).catch(() => {});
        // Persist to Supabase
        if (user && courseId && data.reply) {
          const key = `pre_write_${sectionType || 'default'}`;
          supabase.from('assessment_representations').upsert({
            assessment_id: assessmentTitle || 'default',
            course_id: courseId,
            user_id: user.id,
            type: key,
            content: data.reply,
          }, { onConflict: 'assessment_id,course_id,user_id,type' }).catch(() => {});
        }
      } else {
        setError('Could not generate. Try again.');
      }
    } catch {
      setError('Could not connect. Try again.');
    } finally {
      setLoading(false);
    }
  }, [assessmentTitle, briefText, rubricCriteria, sectionType, tier, isLiteralMode, accessibilityProfile]);

  const handleInsertScaffold = () => {
    if (!scaffold) return;
    onInsert?.(stripMarkdown(scaffold));
    setAccepted(true);
    appendEvent({ event_type: 'pre_write_accepted', payload: { assessmentTitle, sectionType, scaffoldLength: scaffold.length } }).catch(() => {});
    // Track scaffold acceptance for composite progress
    if (assessmentTitle) localStorage.setItem(`simplifii:scaffold-accepted-${assessmentTitle}`, 'true');
  };

  const handleInsertFromChild = (text) => {
    onInsert?.(stripMarkdown(text));
    appendEvent({ event_type: 'pre_write_accepted', payload: { assessmentTitle, sectionType, source: activeTab } }).catch(() => {});
  };

  return (
    <aside
      aria-label="Starter Ideas"
      style={{
        width: 220,
        minWidth: 220,
        maxWidth: 220,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${SURFACE_RAISED}`,
        background: SURFACE_CARD,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Tier label */}
      <div style={TIER_LABEL_STYLE}>
        <span>Starter Ideas</span>
        <span style={{ fontWeight: 400, opacity: 0.6 }}>AI helps you begin</span>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
        {[
          { id: 'scaffold', label: 'Scaffold' },
          { id: 'starters', label: 'Starters' },
          { id: 'idea', label: 'Voice' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              background: activeTab === tab.id ? ACCENT_GLASS : 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${ACCENT_PULSE}` : '2px solid transparent',
              color: activeTab === tab.id ? TEXT_PRIMARY : TEXT_FAINT,
              cursor: 'pointer',
              fontFamily: FONT_SYSTEM,
              fontSize: 9,
              padding: '6px 4px',
              transition: 'background 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 10px' }}>

        {/* Scaffold tab */}
        {activeTab === 'scaffold' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0, fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_MUTED, lineHeight: 1.5 }}>
              Get some starting ideas from AI. Pick what works for you, edit or ignore the rest.
            </p>

            {!scaffold && !loading && (
              <button
                type="button"
                onClick={generateScaffold}
                style={{
                  background: ACCENT_GLASS,
                  border: `1px solid ${ACCENT_BORDER}`,
                  borderRadius: BORDER_RADIUS,
                  color: TEXT_PRIMARY,
                  cursor: 'pointer',
                  fontFamily: FONT_SYSTEM,
                  fontSize: 10,
                  padding: '8px 12px',
                }}
                onFocus={e => { e.currentTarget.style.outline = FOCUS_RING; }}
                onBlur={e => { e.currentTarget.style.outline = 'none'; }}
              >
                Generate starting ideas
              </button>
            )}

            {loading && (
              <p style={{ margin: 0, fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT }}>Generating...</p>
            )}

            {error && (
              <p style={{ margin: 0, fontFamily: FONT_SYSTEM, fontSize: 10, color: COLOUR_WARN }}>{error}</p>
            )}

            {scaffold && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                  background: SURFACE_RAISED,
                  borderRadius: BORDER_RADIUS,
                  padding: '8px 10px',
                  fontFamily: FONT_BODY,
                  fontSize: 11,
                  color: TEXT_PRIMARY,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {stripMarkdown(scaffold)}
                </div>

                {accepted ? (
                  <p style={{ margin: 0, fontFamily: FONT_SYSTEM, fontSize: 10, color: ACCENT_PULSE }}>
                    Inserted into your draft.
                  </p>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={handleInsertScaffold}
                      style={{
                        flex: 1,
                        background: ACCENT_GLASS,
                        border: `1px solid ${ACCENT_BORDER}`,
                        borderRadius: 6,
                        color: TEXT_PRIMARY,
                        cursor: 'pointer',
                        fontFamily: FONT_SYSTEM,
                        fontSize: 10,
                        padding: '6px',
                      }}
                    >
                      Use this
                    </button>
                    <button
                      type="button"
                      onClick={() => { setScaffold(''); setAccepted(false); }}
                      style={{
                        background: 'none',
                        border: `1px solid ${SURFACE_RAISED}`,
                        borderRadius: 6,
                        color: TEXT_FAINT,
                        cursor: 'pointer',
                        fontFamily: FONT_SYSTEM,
                        fontSize: 10,
                        padding: '6px',
                      }}
                    >
                      Discard
                    </button>
                  </div>
                )}

                {!accepted && (
                  <button
                    type="button"
                    onClick={generateScaffold}
                    style={{ background: 'none', border: 'none', color: TEXT_FAINT, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 9, padding: '2px 0' }}
                  >
                    Generate new ideas
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sentence starters tab */}
        {activeTab === 'starters' && (
          <SentenceStarters
            sectionType={sectionType}
            onInsert={handleInsertFromChild}
            visible
          />
        )}

        {/* Voice / idea tab */}
        {activeTab === 'idea' && (
          <IdeaToSentence
            assessmentTitle={assessmentTitle}
            tier={tier}
            onInsert={handleInsertFromChild}
          />
        )}
      </div>

      {/* Footer: provenance note */}
      <div style={{ padding: '6px 10px', borderTop: `1px solid ${SURFACE_RAISED}`, fontFamily: FONT_SYSTEM, fontSize: 8, color: TEXT_FAINT, lineHeight: 1.5 }}>
        AI contributions are logged for the Authenticity Report. What you use is your choice.
      </div>
    </aside>
  );
}
