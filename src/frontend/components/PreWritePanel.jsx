import React, { useState, useCallback } from 'react';
import SentenceStarters from './SentenceStarters';
import IdeaToSentence from './IdeaToSentence';
import { appendEvent } from '../../core/HistoryOfThought';
import {
  SURFACE_RAISED, SURFACE_CARD,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
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

export default function PreWritePanel({ assessmentTitle, briefText, sectionType, tier, onInsert }) {
  const [scaffold, setScaffold] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState('scaffold'); // 'scaffold' | 'starters' | 'idea'

  const generateScaffold = useCallback(async () => {
    setLoading(true);
    setError('');
    setAccepted(false);
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            text: `Generate a pre-write scaffold for the ${sectionType?.replace('_', ' ')} section of: ${assessmentTitle}. Give 3-4 bullet points as starting ideas (not full sentences). Keep it brief.`,
          }],
          assessmentTitle,
          briefText: briefText?.slice(0, 1000) || '',
          tier: tier || 'tertiary',
          systemOverride: `You are a pre-write assistant. Generate 3-4 concise starting-point bullet points for the learner's ${sectionType || 'section'}. These are ideas to spark their thinking, NOT a completed answer. Australian English. No full paragraphs. No em-dashes.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScaffold(data.reply);
        appendEvent({ event_type: 'pre_write_generated', payload: { assessmentTitle, sectionType } }).catch(() => {});
      } else {
        setError('Could not generate. Try again.');
      }
    } catch {
      setError('Could not connect. Try again.');
    } finally {
      setLoading(false);
    }
  }, [assessmentTitle, briefText, sectionType, tier]);

  const handleInsertScaffold = () => {
    if (!scaffold) return;
    onInsert?.(scaffold);
    setAccepted(true);
    appendEvent({ event_type: 'pre_write_accepted', payload: { assessmentTitle, sectionType, scaffoldLength: scaffold.length } }).catch(() => {});
  };

  const handleInsertFromChild = (text) => {
    onInsert?.(text);
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
              Generate a starting scaffold for this section. AI produces ideas: you decide what to use.
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
              <p style={{ margin: 0, fontFamily: FONT_SYSTEM, fontSize: 10, color: '#f87171' }}>{error}</p>
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
                  {scaffold}
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
                    Try again
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
