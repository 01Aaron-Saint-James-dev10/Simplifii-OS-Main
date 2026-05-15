import React, { useState, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import AsciiLoader from './AsciiLoader';
import { announceAction } from '../services/PredictabilityService';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS, FOCUS_RING,
} from '../../theme/tokens';

const TYPES = [
  { id: 'plain_english', icon: 'Aa', label: 'Plain English', desc: 'Short sentences, no jargon' },
  { id: 'visual_outline', icon: '\u25A1', label: 'Step by step', desc: 'Flowchart of what to do' },
  { id: 'audio_script', icon: '\u266B', label: 'Audio script', desc: '60-second spoken overview' },
  { id: 'chunked_tasks', icon: '\u2610', label: 'Chunked tasks', desc: 'Small tasks, under 15 min each' },
];

/**
 * RepresentationsPanel
 *
 * UDL 3.0 multiple representations of an assessment brief.
 * Generates 4 versions via /api/represent, caches in Supabase.
 * User picks which representation suits their learning style.
 *
 * Props:
 *   briefText       - the assessment brief content
 *   assessmentTitle  - string
 *   courseId         - string
 */
export default function RepresentationsPanel({ briefText, assessmentTitle, courseId }) {
  const { activeTier } = useSettings();
  const { user } = useAuth();
  const [activeType, setActiveType] = useState(null);
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  // Load cached representations on mount
  useEffect(() => {
    if (!user || !courseId) return;
    supabase.from('assessment_representations')
      .select('type, content')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const cached = {};
          for (const r of data) cached[r.type] = r.content;
          setContent(cached);
        }
      });
  }, [user, courseId]);

  const generate = async (type) => {
    if (!briefText || briefText.length < 20) {
      setError('Upload your assessment first. The AI needs content to work with.');
      return;
    }
    setActiveType(type);
    setLoading(type);
    setError('');
    try {
      const typeLabel = TYPES.find(t => t.id === type)?.label || type;
      const proceed = await announceAction({
        type: 'ai_response',
        description: `Translate into ${typeLabel}`,
        estimatedMs: 8000,
      });
      if (proceed === 'cancel') { setLoading(null); return; }

      const response = await fetch('/api/represent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefText,
          type,
          assessmentTitle,
          tier: activeTier || 'tertiary',
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setContent(prev => ({ ...prev, [type]: data.content }));

      // Cache to Supabase
      if (user) {
        try {
          await supabase.from('assessment_representations').upsert({
            assessment_id: assessmentTitle || 'default',
            course_id: courseId,
            user_id: user.id,
            type,
            content: data.content,
          }, { onConflict: 'assessment_id,course_id,user_id,type' });
        } catch { /* cache failure is non-blocking */ }
      }
    } catch (err) {
      setError(err.message || 'Could not generate. Try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h3 style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 4px' }}>
          UDL 3.0 Representations
        </h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_MUTED, margin: 0 }}>
          Same brief, four ways to understand it. Pick what works for you.
        </p>
      </div>

      {/* Type selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {TYPES.map(t => {
          const hasContent = !!content[t.id];
          const isActive = activeType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => hasContent ? setActiveType(t.id) : generate(t.id)}
              disabled={loading === t.id}
              style={{
                padding: '8px 10px', textAlign: 'left',
                background: isActive ? ACCENT_GLASS : 'transparent',
                border: `1px solid ${isActive ? ACCENT_BORDER : hasContent ? SURFACE_RAISED : SURFACE_RAISED}`,
                borderRadius: BORDER_RADIUS, cursor: loading === t.id ? 'wait' : 'pointer',
                outline: 'none', minHeight: 44,
                opacity: loading && loading !== t.id ? 0.5 : 1,
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 14, color: hasContent ? ACCENT_PULSE : TEXT_FAINT }}>{t.icon}</span>
                <div>
                  <div style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, color: isActive ? ACCENT_PULSE : hasContent ? TEXT_PRIMARY : TEXT_MUTED }}>
                    {t.label} {hasContent && '\u2713'}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 9, color: TEXT_FAINT }}>{t.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && <AsciiLoader status={`Generating ${TYPES.find(t => t.id === loading)?.label || ''}...`} />}

      {/* Error */}
      {error && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLOUR_WARN, margin: 0 }}>{error}</p>}

      {/* Content display */}
      {activeType && content[activeType] && !loading && (
        <div style={{ padding: '12px 14px', background: 'transparent', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, maxHeight: 300, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, color: ACCENT_PULSE, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {TYPES.find(t => t.id === activeType)?.label}
            </span>
            <button type="button" onClick={() => generate(activeType)}
              style={{ fontFamily: FONT_SYSTEM, fontSize: 8, color: TEXT_FAINT, background: 'none', border: `1px solid ${SURFACE_RAISED}`, borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}>
              Regenerate
            </button>
          </div>
          <pre style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_PRIMARY, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {content[activeType]}
          </pre>
        </div>
      )}

      {/* No brief hint */}
      {!briefText && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_FAINT, margin: 0 }}>
          Upload your assessment to generate representations.
        </p>
      )}
    </div>
  );
}
