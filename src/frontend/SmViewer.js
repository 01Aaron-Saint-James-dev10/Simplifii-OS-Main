/**
 * SmViewer.js
 *
 * Renders a .sm (Simplifii-Markdown) document in the Three-Tier Canvas layout.
 *
 * Props:
 *   smContent  string   Raw .sm document text
 *   onEdit     func     Called with updated Tier 3 text (optional)
 *   readOnly   bool     If true, Tier 3 is not editable (default: false)
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProject } from './ProjectContext';
import { selectPersona } from '../core/Personas';

// ============================================================
// .sm document parser
// ============================================================

function parseFrontMatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const lines = match[1].split('\n');
  const meta = {};
  let inUdlAudit = false;
  const udlAudit = {};
  for (const line of lines) {
    if (/^udl_audit:/.test(line)) { inUdlAudit = true; continue; }
    if (inUdlAudit && /^  /.test(line)) {
      const kv = line.trim().split(/:\s+/);
      if (kv.length >= 2) {
        const v = kv.slice(1).join(': ').trim();
        udlAudit[kv[0]] = v === 'true' ? true : v === 'false' ? false : isNaN(v) ? v : Number(v);
      }
      continue;
    }
    inUdlAudit = false;
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^"|"$/g, '');
  }
  if (Object.keys(udlAudit).length) meta.udl_audit = udlAudit;
  return { meta, body: match[2] };
}

function parseSmDocument(smContent) {
  const { meta, body } = parseFrontMatter(smContent || '');
  // Split on Tier headers: "# Tier 1: ...", "# Tier 2: ...", "# Tier 3: ..."
  const parts = body.split(/\n(?=# Tier \d+:)/);
  const tier1Raw = (parts.find(p => /^# Tier 1:/.test(p)) || '').replace(/^# Tier 1:[^\n]*\n?/, '').trim();
  const tier2Block = (parts.find(p => /^# Tier 2:/.test(p)) || '').replace(/^# Tier 2:[^\n]*\n?/, '');
  const tier3Raw = (parts.find(p => /^# Tier 3:/.test(p)) || '').replace(/^# Tier 3:[^\n]*\n?/, '').trim();

  // Extract numbered prompts from Tier 2 Reflection Prompts section
  const refSection = tier2Block.match(/## Reflection Prompts\n+([\s\S]*?)(?=\n## |$)/);
  const promptBlock = refSection ? refSection[1] : tier2Block;
  const tier2Prompts = promptBlock
    .split(/\n(?=\d+\. )/)
    .map(s => s.replace(/^\d+\.\s+/, '').trim())
    .filter(Boolean);

  // Extract check-list objectives from Tier 2
  const checkSection = tier2Block.match(/## Check Your Understanding\n+([\s\S]*?)(?=\n## |$)/);
  const checkItems = checkSection
    ? checkSection[1].split('\n').map(l => l.replace(/^- \[.\]\s*/, '').trim()).filter(Boolean)
    : [];

  return { meta, tier1Raw, tier2Prompts, checkItems, tier3Raw };
}

// Classify a prompt to a PDMR stage for colour coding
function classifyPrompt(prompt) {
  if (/^PLAN:/i.test(prompt)) return 'plan';
  if (/^MONITOR:/i.test(prompt)) return 'monitor';
  if (/^REFLECT:/i.test(prompt)) return 'reflect';
  if (/without worrying|surprises|interests you most/i.test(prompt)) return 'joy';
  if (/connect.*experience|community.*context|professional context/i.test(prompt)) return 'belonging';
  return 'do';
}

const STAGE_STYLE = {
  plan:      { bg: '#EEF2FF', accent: '#6366F1', label: 'PLAN' },
  do:        { bg: '#F0FDF4', accent: '#22C55E', label: 'DO' },
  belonging: { bg: '#FFF7ED', accent: '#F97316', label: 'BELONG' },
  joy:       { bg: '#FDF4FF', accent: '#A855F7', label: 'EXPLORE' },
  monitor:   { bg: '#F0F9FF', accent: '#0EA5E9', label: 'MONITOR' },
  reflect:   { bg: '#FFF1F2', accent: '#F43F5E', label: 'REFLECT' },
};

// Stagger variant for the three-column canvas entry animation.
// Each column receives a custom `i` prop (0, 1, 2) as the delay multiplier.
const COLUMN_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: 'easeOut' },
  }),
};

// ============================================================
// AURA pulse CSS (distinct keyframe names to avoid HUD conflict)
// ============================================================

let smvPulseInjected = false;
function injectSmvPulseCSS() {
  if (smvPulseInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = `
@keyframes smv-fast   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.35)} }
@keyframes smv-medium { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.2)} }
@keyframes smv-slow   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.12)} }
  `.trim();
  document.head.appendChild(el);
  smvPulseInjected = true;
}

const PULSE_ANIM = {
  fast:   'smv-fast   0.8s ease-in-out infinite',
  medium: 'smv-medium 1.6s ease-in-out infinite',
  slow:   'smv-slow   2.8s ease-in-out infinite',
  still:  'none',
};

// ============================================================
// Sub-components
// ============================================================

function UdlBadge({ udlAudit }) {
  if (!udlAudit) return null;
  const score = udlAudit.udl3_score ?? udlAudit.udl3Score ?? null;
  if (score === null) return null;
  const compliant = udlAudit.ahead_compliant ?? udlAudit.aheadCompliant ?? false;
  const colour = score >= 80 ? '#22C55E' : score >= 50 ? '#F97316' : '#EF4444';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: colour + '18', border: `1px solid ${colour}40`,
      borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: colour,
    }}>
      UDL {score}/100{compliant ? ' AHEAD' : ''}
    </span>
  );
}

function PdmrRail({ prompts, stages, activeIndex, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {prompts.map((p, i) => {
        const col = STAGE_STYLE[stages[i]];
        const isActive = i === activeIndex;
        return (
          <button key={i} onClick={() => onSelect(i)} style={{
            background: isActive ? col.bg : 'transparent',
            border: `1px solid ${isActive ? col.accent + '80' : 'rgba(0,0,0,0.07)'}`,
            borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7, textAlign: 'left',
            transition: 'background 0.15s, border 0.15s',
          }}>
            <span style={{
              fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
              color: col.accent, fontWeight: 700, letterSpacing: 0.5, minWidth: 46,
            }}>{col.label}</span>
            <span style={{
              fontSize: 11, color: '#6B7280',
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', maxWidth: 130,
            }}>{p.replace(/^[A-Z]+:\s*/, '').slice(0, 38)}</span>
          </button>
        );
      })}
    </div>
  );
}

function PromptCard({ prompt, stage, answer, onChange, isFirst, isLast, onNext, onPrev, disabled }) {
  const col = STAGE_STYLE[stage];
  const clean = prompt.replace(/^[A-Z]+:\s*/, '');
  return (
    <div style={{
      background: col.bg, border: `1.5px solid ${col.accent}30`,
      borderRadius: 12, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <span style={{
        fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
        color: col.accent, fontWeight: 700, letterSpacing: 1,
        background: col.accent + '15', padding: '2px 8px',
        borderRadius: 4, alignSelf: 'flex-start',
      }}>{col.label}</span>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: '#1F2937', fontStyle: 'italic' }}>
        {clean}
      </p>
      <textarea
        value={answer}
        onChange={e => onChange(e.target.value)}
        placeholder="Your response..."
        rows={4}
        disabled={disabled}
        style={{
          border: '1px solid rgba(0,0,0,0.09)', borderRadius: 8,
          padding: '9px 11px', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6,
          background: disabled ? '#F9FAFB' : 'rgba(255,255,255,0.85)',
          resize: 'vertical', boxSizing: 'border-box', width: '100%', outline: 'none',
          color: '#374151',
        }}
      />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {!isFirst && (
          <button onClick={onPrev} disabled={disabled} style={{
            padding: '5px 13px', borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.12)', background: '#fff',
            fontSize: 12, cursor: 'pointer', color: '#374151',
          }}>Back</button>
        )}
        <button onClick={onNext} disabled={disabled} style={{
          padding: '5px 13px', borderRadius: 6, border: 'none',
          background: col.accent, color: '#fff', fontSize: 12,
          cursor: 'pointer', fontWeight: 600, opacity: disabled ? 0.5 : 1,
        }}>{isLast ? 'Complete' : 'Next'}</button>
      </div>
    </div>
  );
}

// ============================================================
// SmViewer
// ============================================================

export default function SmViewer({ smContent, onEdit, readOnly = false }) {
  const { profile } = useProject();
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [tier3Content, setTier3Content] = useState('');
  const [pdmrComplete, setPdmrComplete] = useState(false);

  injectSmvPulseCSS();

  const parsed = useMemo(() => parseSmDocument(smContent), [smContent]);
  const { meta, tier1Raw, tier2Prompts, checkItems, tier3Raw } = parsed;

  const stages = useMemo(() => tier2Prompts.map(classifyPrompt), [tier2Prompts]);

  useEffect(() => { setTier3Content(tier3Raw); }, [tier3Raw]);

  const persona = useMemo(() => {
    if (!profile) return null;
    try {
      return selectPersona({
        emotionalBaseline: profile.emotionalBaseline || 'starting',
        cognitiveFrictionScore: profile.cognitiveFrictionScore || 0,
        toolIntentTags: profile.toolIntentTags || [],
        preferredMode: profile.preferredMode || 'standard',
        level: profile.level || 'secondary',
        lastEditMs: null,
      });
    } catch { return null; }
  }, [profile]);

  const dotColour = persona?.visualProfile?.dotColour || '#6366F1';
  const pulseSpeed = persona?.visualProfile?.pulseSpeed || 'medium';

  const handleAnswerChange = useCallback((idx, val) => {
    setAnswers(prev => ({ ...prev, [idx]: val }));
  }, []);

  const handleTier3Change = useCallback((val) => {
    setTier3Content(val);
    if (typeof onEdit === 'function') onEdit(val);
  }, [onEdit]);

  const handleNext = useCallback(() => {
    if (activePromptIndex < tier2Prompts.length - 1) {
      setActivePromptIndex(i => i + 1);
    } else {
      setPdmrComplete(true);
    }
  }, [activePromptIndex, tier2Prompts.length]);

  const handleDownload = useCallback(() => {
    if (!smContent) return;
    const blob = new Blob([smContent], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(meta.title || 'lesson').replace(/[^a-zA-Z0-9-_]/g, '_')}.sm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [smContent, meta.title]);

  const wordCount = tier3Content.trim().split(/\s+/).filter(Boolean).length;
  const udlAudit = meta.udl_audit || null;
  const title = meta.title || 'Untitled';
  const currentStage = stages[activePromptIndex] || 'do';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: '#FAFAF9',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        flexShrink: 0, zIndex: 10,
      }}>
        {persona && (
          <div
            title={`AURA: ${persona.name} (${persona.id})`}
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: dotColour, flexShrink: 0,
              animation: PULSE_ANIM[pulseSpeed],
            }}
          />
        )}
        <span style={{
          fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
          color: '#9CA3AF', letterSpacing: 0.5, flexShrink: 0,
        }}>simplifii.sm</span>
        <span style={{
          flex: 1, fontSize: 14, fontWeight: 600, color: '#111827',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</span>
        <UdlBadge udlAudit={udlAudit} />
        {pdmrComplete && (
          <span style={{
            fontSize: 10, color: '#22C55E', fontWeight: 700,
            background: '#F0FDF4', border: '1px solid #86EFAC',
            borderRadius: 6, padding: '2px 8px', flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
          }}>PDMR COMPLETE</span>
        )}
        <button onClick={handleDownload} style={{
          padding: '4px 11px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)',
          background: '#fff', fontSize: 11, cursor: 'pointer', color: '#374151',
          flexShrink: 0,
        }}>Download .sm</button>
      </div>

      {/* Three-column canvas */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '27% 25% 1fr',
        overflow: 'hidden',
      }}>


        {/* Tier 1: AI Scaffold */}
        <motion.div
          variants={COLUMN_VARIANTS} initial="hidden" animate="visible" custom={0}
          style={{
            borderRight: '1px solid rgba(0,0,0,0.06)',
            overflowY: 'auto', padding: '20px 18px',
            background: '#FFFFFF',
          }}>
          <div style={{
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            color: '#D1D5DB', letterSpacing: 1.2, fontWeight: 700,
            marginBottom: 14, textTransform: 'uppercase',
          }}>Tier 1 / AI Scaffold</div>
          <div style={{
            fontSize: 13, lineHeight: 1.8, color: '#374151',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {tier1Raw || 'No scaffold content detected in this .sm file.'}
          </div>
        </motion.div>

        {/* Tier 2: PDMR Sidebar */}
        <motion.div
          variants={COLUMN_VARIANTS} initial="hidden" animate="visible" custom={1}
          style={{
            borderRight: '1px solid rgba(0,0,0,0.06)',
            overflowY: 'auto', padding: '20px 14px',
            background: '#FCFCFB',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
          <div style={{
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            color: '#D1D5DB', letterSpacing: 1.2, fontWeight: 700,
            textTransform: 'uppercase',
          }}>Tier 2 / Socratic PDMR</div>

          {tier2Prompts.length > 0 ? (
            <>
              <PdmrRail
                prompts={tier2Prompts}
                stages={stages}
                activeIndex={activePromptIndex}
                onSelect={setActivePromptIndex}
              />
              <PromptCard
                prompt={tier2Prompts[activePromptIndex]}
                stage={currentStage}
                answer={answers[activePromptIndex] || ''}
                onChange={val => handleAnswerChange(activePromptIndex, val)}
                isFirst={activePromptIndex === 0}
                isLast={activePromptIndex === tier2Prompts.length - 1}
                onNext={handleNext}
                onPrev={() => setActivePromptIndex(i => i - 1)}
                disabled={readOnly}
              />
              {checkItems.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{
                    fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                    color: '#D1D5DB', letterSpacing: 1, fontWeight: 700, marginBottom: 8,
                  }}>OBJECTIVES</div>
                  {checkItems.map((item, i) => (
                    <label key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 7,
                      marginBottom: 6, cursor: 'pointer',
                    }}>
                      <input type="checkbox" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{item}</span>
                    </label>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
              No reflection prompts found. Import a document to generate the PDMR scaffold.
            </p>
          )}
        </motion.div>

        {/* Tier 3: Learner Work */}
        <motion.div
          variants={COLUMN_VARIANTS} initial="hidden" animate="visible" custom={2}
          style={{
            overflowY: 'auto', padding: '20px 24px',
            background: '#FAFAF9',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
          <div style={{
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            color: '#D1D5DB', letterSpacing: 1.2, fontWeight: 700, textTransform: 'uppercase',
          }}>Tier 3 / Your Writing</div>

          {readOnly ? (
            <div style={{
              fontSize: 14, lineHeight: 1.85, color: '#1F2937',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>{tier3Content || '(No content yet.)'}</div>
          ) : (
            <textarea
              value={tier3Content}
              onChange={e => handleTier3Change(e.target.value)}
              placeholder={`Begin your response to "${title}" here.\n\nWork through the Tier 2 prompts first, then draft your assessed response here in your own voice.`}
              style={{
                flex: 1, minHeight: 'calc(100vh - 160px)',
                border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
                padding: '18px 20px',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 14, lineHeight: 1.85, color: '#1F2937',
                background: '#FFFFFF', resize: 'none', outline: 'none',
                boxSizing: 'border-box', width: '100%',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            />
          )}

          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
          }}>
            <span style={{
              fontSize: 11, color: '#9CA3AF',
              fontFamily: "'JetBrains Mono', monospace",
            }}>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
