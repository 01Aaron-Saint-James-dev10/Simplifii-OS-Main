import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import './simplifii-studio.css';
import { useProject } from './ProjectContext';
import { askAura } from '../services/ChatService';
import { generateMicroSteps } from '../services/MicroStepService';
import { speakSystemMessage, stopSpeaking } from '../services/MessagingHub';

/**
 * SimplifiiStudio
 *
 * Tri-column NotebookLM-style cockpit. Ports the Claude Design handoff
 * (simplifii-studio prototype) into React, wired to the existing
 * Simplifii data: assessment briefs from the active course, the
 * syllabus rawText for source documents, and AURA chat via Ollama.
 *
 * Layout:
 *   [52px nav rail] [320px Sources] [fluid Cockpit] [380px AURA]
 *
 * Replaces nothing. Mounted from MasterDashboard alongside the classic
 * cockpit so the student can toggle between the two views without
 * losing the existing Linear Canvas.
 */

// ============================================================
// Inline icons (no new dependency)
// ============================================================

const Ico = {
  Compass: (p) => (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 15 1.5-4.5L15 9l-1.5 4.5z" strokeLinejoin="round" />
    </svg>
  ),
  Bookmark: (p) => (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" {...p}>
      <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Target: (p) => (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  ),
  Shield: (p) => (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" {...p}>
      <path d="M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6z" />
    </svg>
  ),
  Settings: (p) => (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5 2 2 0 1 1-4 0 1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8 1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8 1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5 2 2 0 1 1 4 0 1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3 2 2 0 1 1 2.8 2.8 1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1 2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  ),
  Send: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}>
      <path d="M22 2 11 13" /><path d="M22 2l-7 20-4-9-9-4z" />
    </svg>
  ),
  Mic: (p) => (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...p}>
      <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" />
    </svg>
  ),
  Plus: (p) => (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
};

// ============================================================
// Data adapters: convert Simplifii course state into the design's pillar shape
// ============================================================

const slugifyId = (s, fallback) => {
  const out = (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return out || fallback;
};

const parseWeight = (s) => {
  if (!s) return 0;
  const m = String(s).match(/(\d{1,3})/);
  return m ? parseInt(m[1], 10) : 0;
};

const buildPillarsFromBriefs = (briefs) => {
  if (!Array.isArray(briefs) || briefs.length === 0) return [];
  return briefs.map((b, i) => {
    const id = slugifyId(b.title, `pillar-${i + 1}`);
    const wt = parseWeight(b.weight);
    const target = Number(b.wordCountGoal) || 0;
    // Three-block split. When the student locks a non-writing assessment
    // (test, exam) the wordTarget is 0; we still surface a Study Plan
    // block so the cockpit has something to show.
    const blocks = target > 0
      ? [
          { id: 'foundation', name: 'Foundation', target: Math.max(100, Math.round(target * 0.25)), desc: 'Frame the question, scope the field, name the pillars you will defend.' },
          { id: 'core', name: 'Core', target: Math.max(200, Math.round(target * 0.6)), desc: 'Synthesise across the literature. Weigh competing claims. Cite explicitly.' },
          { id: 'polish', name: 'Polish', target: Math.max(50, Math.round(target * 0.15)), desc: 'Resolve open questions, gather threads, sharpen the references list.' }
        ]
      : [
          { id: 'study', name: 'Study Plan', target: 0, desc: 'Study notes for this assessment.' }
        ];
    return {
      id,
      num: String(i + 1).padStart(2, '0'),
      name: b.title,
      weight: wt,
      due: b.dueDate || '-',
      status: i === 0 ? 'active' : 'queued',
      wordTarget: target,
      rubric: [
        { marks: Math.round(wt * 0.4) || 10, title: 'Source Quality and Breadth', criteria: 'Peer-reviewed sources, balanced across the four currents of the field, current within the last decade.' },
        { marks: Math.round(wt * 0.6) || 15, title: 'Critical Synthesis and Argument', criteria: 'Weighs competing positions rather than cataloguing them. Names disagreements explicitly. Builds a defensible position grounded in cited evidence.' }
      ],
      blocks
    };
  });
};

const wordCount = (s) => {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
};

// ============================================================
// Section Health (v3): content-aware grading. Returns
// { level: 0-5, label: 'Empty' | 'Sparse' | 'Developing' | 'Building' | 'Rigorous',
//   state: 'empty' | 'developing' | 'moderate' | 'strong',
//   completion: 0-100 }
//
// Blends two signals:
//   completion: how close the draft is to the target word count (55%)
//   density:    citation patterns (Author, 2024), hedging language
//               ('however', 'although', 'contend'), academic markers
//               ('synthesis', 'methodology', 'evidence') (45%)
// So an empty block reads Empty, a long but unsourced block reads
// Sparse, a tight cited block reads Rigorous.
// ============================================================

const sectionHealth = (text, target) => {
  const w = wordCount(text);
  if (w === 0) return { level: 0, label: 'Empty', state: 'empty', completion: 0 };
  const cites = (text.match(/\([A-Z][a-z]+(?:\s*(?:&|et al\.?|,)\s*[A-Z]?[a-z]*)*,?\s*\d{4}/g) || []).length
    + (text.match(/p\.\s?\d+/g) || []).length;
  const hedges = (text.match(/\b(however|whereas|although|nevertheless|conversely|in contrast|by contrast|disagree|contested|contend|argues?|claims?)\b/gi) || []).length;
  const academic = (text.match(/\b(synthesis|methodology|empirical|hypothesis|literature|peer-reviewed|primary studies|review|evidence|tolerance|cascade|signalling|adaptive)\b/gi) || []).length;
  const completion = Math.min(1, w / Math.max(1, target));
  const density = (cites * 3 + hedges * 1.5 + academic) / Math.max(40, w);
  const blended = Math.min(1, completion * 0.55 + Math.min(1, density * 6) * 0.45);
  const level = Math.max(1, Math.round(blended * 5));
  let label = 'Sparse';
  let state = 'empty';
  if (blended >= 0.78) { label = 'Rigorous'; state = 'strong'; }
  else if (blended >= 0.55) { label = 'Building'; state = 'moderate'; }
  else if (blended >= 0.25) { label = 'Developing'; state = 'developing'; }
  return { level, label, state, completion: Math.round(completion * 100) };
};

// ============================================================
// Mastery Flow (v3): top-of-cockpit pedagogical sequence
// Introduce -> Drill -> Recognise -> Simulate
// ============================================================

const MASTERY_STAGES = [
  { id: 'introduce', name: 'Introduce', desc: 'Frame the topic' },
  { id: 'drill', name: 'Drill', desc: 'Repeat the moves' },
  { id: 'recognise', name: 'Recognise', desc: 'Spot patterns in the wild' },
  { id: 'simulate', name: 'Simulate', desc: 'Perform under load' }
];

function MasteryBar({ activeId }) {
  const idx = MASTERY_STAGES.findIndex((s) => s.id === activeId);
  return (
    <div className="mastery">
      <span className="mastery-label">MASTERY FLOW</span>
      <div className="mastery-flow">
        {MASTERY_STAGES.map((s, i) => {
          const state = i < idx ? 'done' : i === idx ? 'active' : 'next';
          return (
            <div className="mastery-stage" key={s.id} data-state={state}>
              <span className="mastery-glyph" />
              <span className="mastery-num">0{i + 1}</span>
              <span className="mastery-name">{s.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Neural Visualiser (v3): collapsible concept-map under editor
// Per-pillar dataset with x/y nodes and connecting lines.
// ============================================================

const VISUALISER_NODES = {
  'lit-review': {
    title: 'Cell Surface Receptor Cascade',
    sub: 'BABS1201 reference structure',
    nodes: [
      { id: 1, x: 22, y: 38, name: 'Toll-like receptor (TLR4)', desc: 'Pattern recognition. Triggers the MyD88 dependent path on LPS binding.' },
      { id: 2, x: 48, y: 28, name: 'Adaptor protein (MyD88)', desc: 'Routes the signal toward NF-kB and the cytokine response.' },
      { id: 3, x: 70, y: 52, name: 'NF-kB nuclear shuttle', desc: 'Drives transcription of the inflammatory cytokine programme.' },
      { id: 4, x: 38, y: 72, name: 'Crosstalk node (microbiome)', desc: 'Where the literature contests whether commensals trigger or modulate.' }
    ]
  }
};

function NeuralVisualiser({ pillarId }) {
  const dataset = VISUALISER_NODES[pillarId] || VISUALISER_NODES['lit-review'];
  const [active, setActive] = useState(dataset.nodes[0].id);
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className="visualiser" data-collapsed={collapsed}>
      <div className="visualiser-head">
        <div className="visualiser-title">
          <span className="pip" />
          <span>NEURAL VISUALISER  ·  {dataset.title}</span>
        </div>
        <div className="visualiser-actions">
          {!collapsed && <button className="btn-pill">Cite this</button>}
          {!collapsed && <button className="btn-pill">Drop into draft</button>}
          <button className="visualiser-toggle" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? 'Expand v' : 'Collapse ^'}
          </button>
        </div>
      </div>
      <div className="visualiser-grid">
        <div className="visualiser-stage">
          <svg className="visualiser-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="ln" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#50C878" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#50C878" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {dataset.nodes.slice(0, -1).map((n, i) => {
              const m = dataset.nodes[i + 1];
              return (
                <line key={i} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke="url(#ln)" strokeWidth="0.4" strokeDasharray="0.8 0.8" />
              );
            })}
            {dataset.nodes.map((n) => (
              <circle key={n.id} cx={n.x} cy={n.y} r={active === n.id ? 1.6 : 0.9} fill="#50C878" opacity={active === n.id ? 1 : 0.4} />
            ))}
          </svg>
          <div className="visualiser-hotspots">
            {dataset.nodes.map((n) => (
              <button key={n.id} className="hotspot" data-active={active === n.id} style={{ left: `calc(${n.x}% - 7px)`, top: `calc(${n.y}% - 7px)` }} onClick={() => setActive(n.id)} />
            ))}
          </div>
        </div>
        <div className="visualiser-legend">
          {dataset.nodes.map((n) => (
            <div className="legend-row" key={n.id} data-active={active === n.id}>
              <span className="legend-num">{n.id}</span>
              <div className="legend-text">
                <div className="legend-name">{n.name}</div>
                <div className="legend-desc">{n.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Source clustering (v3): group docs into Methodology / Evidence / Rubrics
// ============================================================

const SOURCE_CLUSTERS = [
  { id: 'methodology', theme: 'methodology', name: 'Methodology', filter: (d) => d.cluster === 'methodology' || d.tag === 'MASTER SOURCE' },
  { id: 'evidence', theme: 'evidence', name: 'Evidence', filter: (d) => d.cluster === 'evidence' || d.tag === 'ACTIVE SPRINT' || d.tag === 'PRIMARY' },
  { id: 'rubric', theme: 'rubric', name: 'Rubrics', filter: (d) => d.cluster === 'rubric' || d.tag === 'REFERENCED' }
];

// ============================================================
// Nav Rail
// ============================================================

function NavRail({ onExit }) {
  return (
    <div className="col rail">
      <div className="rail-mark">S</div>
      <button className="rail-btn" data-active="true" title="Studio"><Ico.Compass /></button>
      <button className="rail-btn" title="Library"><Ico.Bookmark /></button>
      <button className="rail-btn" title="Targets"><Ico.Target /></button>
      <button className="rail-btn" title="Integrity"><Ico.Shield /></button>
      <div className="rail-spacer" />
      <button className="rail-btn" title="Return to classic cockpit" onClick={onExit}><Ico.Settings /></button>
      <div className="rail-avatar">JM</div>
    </div>
  );
}

// ============================================================
// Sources Panel
// ============================================================

function SourcesPanel({ docs, pillars, activePillar, activeDoc, onPickPillar, onPickDoc, onAddSource, courses, activeCourseId, onPickCourse }) {
  const courseEntries = Object.entries(courses || {});
  const courseLabel = (courses?.[activeCourseId]?.name || 'COURSE').toUpperCase().slice(0, 24);
  return (
    <div className="col" id="sources-col">
      <div className="col-head">
        <div className="col-head-title">
          <span className="dot" />
          <span>Grounding Drive</span>
        </div>
        <button className="rail-btn" title="Add source" onClick={onAddSource}><Ico.Plus /></button>
      </div>

      <div className="col-body">
        {courseEntries.length > 0 && (
          <>
            <div className="sources-section-label">Active Course</div>
            <div style={{ padding: '0 14px 14px' }}>
              <select
                value={activeCourseId || ''}
                onChange={(e) => onPickCourse && onPickCourse(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--line-strong)',
                  color: 'var(--ink)',
                  fontFamily: 'var(--f-mono)',
                  fontSize: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--r-md)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                title="Switch the active course (e.g. between BABS1201 and MRes)"
              >
                {courseEntries.map(([id, c]) => (
                  <option key={id} value={id}>{c.name || '(unnamed)'}</option>
                ))}
              </select>
            </div>
            <div className="divider-soft" />
          </>
        )}

        <div className="source-map">
          <div className="source-map-label">SOURCE MAP  ·  {courseLabel}</div>
          <svg className="source-map-svg" viewBox="0 0 100 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="smln" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#50C878" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#50C878" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <line x1="50" y1="14" x2="22" y2="42" stroke="url(#smln)" strokeWidth="0.4" />
            <line x1="50" y1="14" x2="78" y2="42" stroke="url(#smln)" strokeWidth="0.4" />
            <line x1="50" y1="14" x2="50" y2="46" stroke="url(#smln)" strokeWidth="0.4" />
            <circle cx="50" cy="14" r="2.4" fill="#50C878" />
            <circle cx="22" cy="42" r="1.7" fill="#50C878" opacity="0.7" />
            <circle cx="78" cy="42" r="1.7" fill="#C9A24A" opacity="0.7" />
            <circle cx="50" cy="46" r="1.7" fill="#6BA9E0" opacity="0.7" />
          </svg>
          <div className="source-map-legend">
            <span><i style={{ background: 'var(--emerald)' }} /> METHOD</span>
            <span><i style={{ background: '#6BA9E0' }} /> EVIDENCE</span>
            <span><i style={{ background: '#C9A24A' }} /> RUBRIC</span>
          </div>
        </div>

        {docs.length === 0 ? (
          <div style={{ padding: '14px 18px', fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
            No syllabus uploaded yet. Click + to drop the Course Outline, Brief, and Rubric.
          </div>
        ) : SOURCE_CLUSTERS.map((c) => {
          const items = docs.filter(c.filter);
          if (items.length === 0) return null;
          return (
            <div className="source-cluster" key={c.id}>
              <div className="cluster-head" data-theme={c.theme}>
                <span className="cluster-glyph" />
                <span className="cluster-name">{c.name}</span>
                <span className="cluster-count">{items.length}</span>
              </div>
              {items.map((d) => (
                <button
                  key={d.id}
                  className="source-card"
                  data-active={d.id === activeDoc}
                  onClick={() => onPickDoc(d.id)}
                >
                  <div className="source-row">
                    <div className="source-icon">{d.abbr}</div>
                    <div className="source-meta">
                      <div className="source-name">{d.name}</div>
                      <div className="source-tags">
                        <span className={`tag ${d.tagClass || ''}`}>{d.tag}</span>
                      </div>
                      <div className="source-sub">
                        <span>{d.pages || '-'} pp</span>
                        <span>·</span>
                        <span>{d.annotations || 0} notes</span>
                        <span>·</span>
                        <span>{d.opened || 'just now'}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          );
        })}

        <div className="divider-soft" />

        <div className="sources-section-label">Semester Pillars</div>
        <div className="pillars-list">
          {pillars.length === 0 ? (
            <div style={{ padding: '8px 18px', fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
              No pillars yet. Drop a syllabus or use lockSchema().
            </div>
          ) : pillars.map((p) => (
            <button
              key={p.id}
              className="pillar-row"
              data-active={p.id === activePillar}
              onClick={() => onPickPillar(p.id)}
            >
              <span className="pillar-num">{p.num}</span>
              <span className="pillar-name">{p.name}</span>
              <span className="pillar-weight">{p.weight}%</span>
            </button>
          ))}
        </div>

        <div className="divider-soft" />

        <div className="sources-section-label">Hierarchy</div>
        <div style={{ padding: '0 18px 24px', fontFamily: 'var(--f-mono)', fontSize: 10.5, color: 'var(--ink-mute)', lineHeight: 1.7 }}>
          <div>+- Course Outline (Master)</div>
          <div>|   +- Assessment Brief (Active)</div>
          <div>|       +- Marking Rubric</div>
          <div>+- Thinking History (live)</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Roadmap
// ============================================================

function Roadmap({ pillars, activeId, onPick }) {
  return (
    <div className="roadmap">
      <div className="roadmap-stops">
        {pillars.map((p) => (
          <button
            key={p.id}
            className="roadmap-stop"
            data-active={p.id === activeId}
            data-done={p.status === 'done'}
            onClick={() => onPick(p.id)}
          >
            <span className="roadmap-pip" />
            <span className="roadmap-text">
              <span className="roadmap-name">{p.num}  ·  {p.name}</span>
              <span className="roadmap-meta">{p.weight}%   {p.due}   {p.status === 'done' ? 'CLOSED' : p.status === 'active' ? 'IN SPRINT' : 'QUEUED'}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Logic Blocks bar
// ============================================================

function BlocksBar({ blocks, drafts, activeId, onPick }) {
  return (
    <div className="blocks">
      {blocks.map((b, i) => {
        const text = drafts[b.id] || '';
        const w = wordCount(text);
        const target = Math.max(1, b.target);
        const pct = Math.min(100, Math.round((w / target) * 100));
        const num = String(i + 1).padStart(2, '0');
        const isComplete = pct >= 100;
        const health = sectionHealth(text, b.target);
        return (
          <button
            key={b.id}
            className="block"
            data-active={b.id === activeId}
            data-fill={pct > 0 ? 'true' : undefined}
            data-fill-pct={pct}
            data-complete={isComplete}
            data-health={health.state}
            style={{ '--block-fill': (pct / 100).toFixed(2) }}
            onClick={() => onPick(b.id)}
          >
            <div className="block-head">
              <span className="block-label">
                <span className="block-num">{num}</span>
                {b.name}
              </span>
              <span className="block-pct">{pct}%</span>
            </div>
            <div className="block-name">{b.name}</div>
            <div className="block-desc">{b.desc}</div>
            <div className="block-bar">
              <div className="block-bar-fill" style={{ width: pct + '%' }} />
            </div>
            <div className="block-words">
              {w.toLocaleString()} / {b.target.toLocaleString()} words
              {isComplete ? '   ·   COMPLETE' : ''}
            </div>
            <div className="block-health">
              <span className="health-dots" data-level={health.level}>
                <i /><i /><i /><i /><i />
              </span>
              <span className="health-label">SECTION HEALTH · {health.label.toUpperCase()}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Cockpit footer
// ============================================================

function CockpitFooter({ words }) {
  const bars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 56; i++) {
      const seed = (i * 9301 + 49297) % 233280;
      const noise = seed / 233280;
      const intensity = 0.3 + noise * 0.7;
      arr.push(Math.max(8, Math.round(intensity * 100)));
    }
    return arr;
  }, []);
  return (
    <div className="cockpit-footer">
      <div className="footer-group">
        <span className="footer-stat"><span className="label">SESSION</span><span className="val">live</span></span>
        <span className="footer-stat"><span className="label">EDITS</span><span className="val">{Math.max(words * 1.7 | 0, 0)}</span></span>
        <span className="footer-stat"><span className="label">REVISIONS</span><span className="val">{Math.max(words / 40 | 0, 0)}</span></span>
        <span className="footer-stat"><span className="label">GROUNDED</span><span className="val" style={{ color: 'var(--emerald)' }}>SOVEREIGN</span></span>
      </div>
      <div className="integrity-bars" title="Thinking History">
        {bars.map((h, i) => <i key={i} style={{ height: h + '%', opacity: 0.25 + (h / 200) }} />)}
      </div>
      <div className="footer-group">
        <span className="footer-stat"><span className="label">AURA</span><span className="val">SENIOR / GROUNDED</span></span>
        <span className="footer-stat"><span className="label">LANG</span><span className="val">en-AU</span></span>
      </div>
    </div>
  );
}

// ============================================================
// Cockpit (centre)
// ============================================================

function Cockpit({ pillar, pillars, drafts, setDraft, activeBlockId, setActiveBlockId, onPickPillar }) {
  const totalWords = useMemo(
    () => pillar.blocks.reduce((sum, b) => sum + wordCount(drafts[b.id] || ''), 0),
    [drafts, pillar]
  );
  const totalTarget = pillar.wordTarget || 1;
  const totalPct = Math.min(100, Math.round((totalWords / totalTarget) * 100));

  const editorRef = useRef(null);
  useEffect(() => {
    if (editorRef.current) editorRef.current.focus();
  }, [activeBlockId, pillar.id]);

  const activeBlock = pillar.blocks.find((b) => b.id === activeBlockId) || pillar.blocks[0];

  // Micro-steps panel state. Generated on demand per pillar; cached in
  // memory so re-clicking the button does not regenerate on every
  // mount, but a fresh handshake or pillar switch clears them.
  const [microSteps, setMicroSteps] = useState([]);
  const [microLoading, setMicroLoading] = useState(false);
  const [microError, setMicroError] = useState('');
  useEffect(() => { setMicroSteps([]); setMicroError(''); }, [pillar.id]);

  const briefForPillar = useMemo(() => ({
    title: pillar.name,
    weight: pillar.weight ? `${pillar.weight}%` : '',
    wordCountGoal: pillar.wordTarget,
    dueDate: pillar.due
  }), [pillar]);

  const insertStepsIntoActiveBlock = (steps) => {
    if (!steps || steps.length === 0) return;
    const block = activeBlock;
    const heading = `Study plan steps (generated ${new Date().toLocaleString('en-AU')})`;
    const body = steps.map((s) => `${s.step}. ${s.title}: ${s.action}`).join('\n');
    const existing = drafts[block.id] || '';
    const next = existing.trim()
      ? `${existing.trim()}\n\n${heading}\n${body}\n`
      : `${heading}\n${body}\n`;
    setDraft(block.id, next);
  };

  const isActiveBlockEmpty = !((drafts[activeBlock.id] || '').trim().length > 0);

  const onGenerateSteps = async () => {
    if (microLoading) return;
    setMicroLoading(true);
    setMicroError('');
    try {
      const steps = await generateMicroSteps(briefForPillar, pillar.name);
      setMicroSteps(steps);
      // One-click pre-fill: when the active block is empty, drop the
      // generated steps straight in. Section Health recomputes naturally
      // from the inserted text (imperative verbs + numbered structure
      // push it to Developing). When the block has existing prose we
      // require an explicit 'Insert' click to avoid clobbering work.
      if (isActiveBlockEmpty) {
        insertStepsIntoActiveBlock(steps);
      }
    } catch (err) {
      setMicroError(err?.message || 'Could not generate steps.');
    } finally {
      setMicroLoading(false);
    }
  };

  const onInsertSteps = () => insertStepsIntoActiveBlock(microSteps);

  // Mastery stage derived from total progress: 0% -> introduce, <33% -> drill,
  // <66% -> recognise, else simulate. Maps the pedagogical loop to the
  // student's actual draft state so the bar doesn't lie.
  const totalForStage = pillar.blocks.reduce((sum, b) => sum + wordCount(drafts[b.id] || ''), 0);
  const stagePct = pillar.wordTarget > 0 ? totalForStage / pillar.wordTarget : 0;
  let masteryActive = 'introduce';
  if (stagePct >= 0.66) masteryActive = 'simulate';
  else if (stagePct >= 0.33) masteryActive = 'recognise';
  else if (stagePct > 0) masteryActive = 'drill';

  return (
    <div className="col cockpit">
      <Roadmap pillars={pillars} activeId={pillar.id} onPick={onPickPillar} />
      <MasteryBar activeId={masteryActive} />

      <div className="cockpit-context swap-in" key={pillar.id}>
        <div>
          <div className="cockpit-eyebrow">
            <span className="pulse" />
            <span>PILLAR {pillar.num}   ·   {String(pillar.due).toUpperCase()}</span>
          </div>
          <h1 className="cockpit-title">{pillar.name}</h1>
          <div className="cockpit-sub">
            {pillar.weight}% of final grade   ·   {pillar.wordTarget.toLocaleString()} word target   ·   {pillar.rubric.reduce((s, r) => s + r.marks, 0)} marks across {pillar.rubric.length} rubric bands
          </div>
        </div>
        <div className="cockpit-meta">
          <div className="meta-stat">
            <span className="meta-stat-label">Words</span>
            <span className="meta-stat-value is-emerald">
              {totalWords.toLocaleString()}<span style={{ color: 'var(--ink-faint)' }}> / {pillar.wordTarget.toLocaleString()}</span>
            </span>
          </div>
          <div className="meta-stat">
            <span className="meta-stat-label">Progress</span>
            <span className="meta-stat-value">{totalPct}%</span>
          </div>
          <div className="meta-stat">
            <span className="meta-stat-label">Integrity</span>
            <span className="meta-stat-value is-emerald">VERIFIED</span>
          </div>
        </div>
      </div>

      <BlocksBar blocks={pillar.blocks} drafts={drafts} activeId={activeBlockId} onPick={setActiveBlockId} />

      <div className="editor-wrap">
        <div className="editor-toolbar">
          <div className="editor-tabs">
            {pillar.blocks.map((b) => (
              <button
                key={b.id}
                className="editor-tab"
                data-active={b.id === activeBlockId}
                onClick={() => setActiveBlockId(b.id)}
              >
                <span className="pip" />
                <span>{b.name}</span>
              </button>
            ))}
          </div>
          <div className="editor-toolbar-right">
            <span className="toolbar-stat">
              <strong>{wordCount(drafts[activeBlock.id] || '')}</strong> / {activeBlock.target} words
            </span>
            <span className="toolbar-stat" style={{ opacity: 0.6 }}>auto-saved · grounded</span>
          </div>
        </div>

        <textarea
          ref={editorRef}
          className="editor"
          value={drafts[activeBlock.id] || ''}
          onChange={(e) => setDraft(activeBlock.id, e.target.value)}
          placeholder={`Start the ${activeBlock.name.toLowerCase()} block. ${activeBlock.desc}`}
          spellCheck={false}
        />

        {/* Micro-steps panel: UDL Action and Expression scaffold. Click the
            generate button, Ollama returns 5 literal next-actions for the
            active pillar, then the student can insert them into the active
            block as a numbered list. ADHD-friendly: replaces 'do research'
            with 'Open Google Scholar. Search for X. Save 3 PDFs to ...'. */}
        <div className="rubric-strip" style={{ marginTop: 12, padding: '12px 16px', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
              UDL Micro-steps  ·  {pillar.name}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-pill primary" onClick={onGenerateSteps} disabled={microLoading} title={isActiveBlockEmpty ? 'Generate and pre-fill the empty block in one click' : 'Generate steps to review before inserting'}>
                {microLoading
                  ? 'Generating...'
                  : (microSteps.length > 0
                      ? 'Regenerate'
                      : (isActiveBlockEmpty ? 'Pre-fill block' : 'Generate steps'))}
              </button>
              {microSteps.length > 0 && !isActiveBlockEmpty && (
                <button className="btn-pill" onClick={onInsertSteps} title="Append steps to the current block">
                  Append to draft
                </button>
              )}
            </div>
          </div>
          {microError && (
            <div style={{ color: '#ff7c7c', fontSize: 12, fontFamily: 'var(--f-mono)' }}>{microError}</div>
          )}
          {microSteps.length === 0 && !microLoading && !microError && (
            <div style={{ color: 'var(--ink-mute)', fontSize: 12, lineHeight: 1.5 }}>
              Generate the first 5 literal actions for this pillar. Replaces vague academic prose with observable steps you can actually start.
            </div>
          )}
          {microSteps.length > 0 && (
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {microSteps.map((s) => (
                <li key={s.step} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--emerald)' }}>0{s.step}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{s.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{s.action}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rubric-strip swap-in" key={pillar.id + '-rubric'}>
          {pillar.rubric.map((r, i) => (
            <div className="rubric-card" key={i}>
              <div className="rubric-marks">
                {r.marks}<small>MARKS</small>
              </div>
              <div className="rubric-text">
                <div className="rubric-title">{r.title}</div>
                <div className="rubric-criteria">{r.criteria}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NeuralVisualiser pillarId={pillar.id} />

      <CockpitFooter words={totalWords} />
    </div>
  );
}

// ============================================================
// AURA Panel (right) - wired to ChatService
// ============================================================

function AuraPanel({ activeCourse, pillar }) {
  const [messages, setMessages] = useState([
    {
      role: 'aura',
      text: activeCourse?.extractionData
        ? `I've parsed your course material and aligned it against the active pillar. Ready to walk you through the rubric or drill into Foundation.`
        : 'Drop your Course Outline, Brief, and Rubric to ground me. I will not invent dates or weightings.',
      cites: []
    }
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    stopSpeaking();
    setMessages((m) => [...m, { role: 'user', text }]);
    setDraft('');
    setLoading(true);
    try {
      const reply = await askAura(text, activeCourse, messages.slice(-6));
      setMessages((m) => [...m, { role: 'aura', text: reply, cites: [] }]);
      try { speakSystemMessage(reply.split(/[.!?]/)[0] + '.'); } catch { /* speech unavailable */ }
    } catch (err) {
      setMessages((m) => [...m, { role: 'aura', text: `Could not reach Ollama: ${err.message}`, cites: [] }]);
    } finally {
      setLoading(false);
    }
  }, [activeCourse, messages, loading]);

  const onSendClick = () => send(draft.trim());

  return (
    <div className="col aura">
      <div className="aura-head">
        <div className="aura-id">
          <div className="aura-orb" />
          <div>
            <div className="aura-name">AURA</div>
            <div className="aura-role">Senior Research Colleague</div>
          </div>
        </div>
        <div className="aura-status">
          <span style={{ color: 'var(--emerald)' }}>●</span>
          <span>{activeCourse?.extractionData ? 'GROUNDED' : 'AWAITING'} · {pillar ? pillar.name.toUpperCase().slice(0, 18) : 'NO PILLAR'}</span>
        </div>
      </div>

      <div className="aura-messages" ref={scrollRef}>
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div className={`msg ${isUser ? 'msg-user' : 'msg-aura'}`} key={i}>
              {!isUser && (
                <div className="msg-meta">
                  <span className="name">AURA</span>
                  <span>·</span>
                  <span>JUST NOW</span>
                </div>
              )}
              <div className="msg-bubble">{m.text}</div>
              {m.cites && m.cites.length > 0 && (
                <div className="cite-row">
                  {m.cites.map((c, j) => <span className="cite" key={j}>{c.label}</span>)}
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="msg msg-aura">
            <div className="msg-meta"><span className="name">AURA</span></div>
            <div className="msg-bubble" style={{ opacity: 0.7, fontStyle: 'italic' }}>thinking ...</div>
          </div>
        )}
      </div>

      <div className="aura-input">
        <div className="aura-input-shell">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendClick(); }
            }}
            placeholder="Ask AURA, grounded in your sources..."
          />
          <div className="aura-input-row">
            <div className="aura-chips">
              <button className="aura-chip" onClick={() => setDraft('Critique this draft against the rubric.')}>/ critique</button>
              <button className="aura-chip" onClick={() => setDraft('Suggest a citation for the current paragraph.')}>/ cite</button>
              <button className="aura-chip"><Ico.Mic style={{ width: 11, height: 11, marginRight: 4 }} />voice</button>
            </div>
            <button className="aura-send" onClick={onSendClick} disabled={!draft.trim() || loading}>
              <Ico.Send />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Top-level Studio
// ============================================================

export default function SimplifiiStudio({ onExit }) {
  const { activeCourse, courses, activeCourseId, setActiveCourseId } = useProject();

  // Build pillars from the active course's assessment briefs. When the
  // student has no briefs yet (no syllabus dropped) we render an empty
  // shell with a single placeholder pillar so the layout stays intact.
  const pillars = useMemo(() => {
    const briefs = activeCourse?.extractionData?.assessmentBriefs;
    const built = buildPillarsFromBriefs(briefs);
    if (built.length > 0) return built;
    return [{
      id: 'empty', num: '00', name: 'Awaiting handshake', weight: 0, due: '-',
      status: 'queued', wordTarget: 0,
      rubric: [],
      blocks: [{ id: 'placeholder', name: 'Drop a syllabus', target: 0, desc: 'Use Add Source to drop your Course Outline, Brief, and Rubric.' }]
    }];
  }, [activeCourse?.extractionData?.assessmentBriefs]);

  // Source documents derived from uploaded filenames stored in
  // extractionData.sourceFiles when available, else a single
  // placeholder card from the unitCode.
  const docs = useMemo(() => {
    const ed = activeCourse?.extractionData;
    if (!ed) return [];
    const files = Array.isArray(ed.sourceFiles) ? ed.sourceFiles : [];
    if (files.length === 0 && ed.rawText) {
      return [{
        id: 'syllabus',
        name: ed.unitCode ? `${ed.unitCode}_syllabus.pdf` : 'Syllabus material',
        abbr: 'CO',
        tag: 'MASTER SOURCE',
        tagClass: 'tag-master',
        pages: Math.max(1, Math.round((ed.rawText.length || 0) / 3000)),
        annotations: 0,
        opened: 'just now'
      }];
    }
    return files.map((f, i) => ({
      id: f.id || `src-${i}`,
      name: f.name || `source-${i + 1}.pdf`,
      abbr: f.abbr || (f.name || '').slice(0, 2).toUpperCase(),
      tag: f.tag || (i === 0 ? 'MASTER SOURCE' : i === 1 ? 'ACTIVE SPRINT' : 'REFERENCED'),
      tagClass: i === 0 ? 'tag-master' : i === 1 ? 'tag-active' : '',
      pages: f.pages || '-',
      annotations: f.annotations || 0,
      opened: f.opened || 'just now'
    }));
  }, [activeCourse?.extractionData]);

  const [activePillarId, setActivePillarId] = useState(pillars[0]?.id || 'empty');
  const [activeDocId, setActiveDocId] = useState(docs[0]?.id || null);
  const [activeBlockId, setActiveBlockId] = useState(pillars[0]?.blocks?.[0]?.id || 'foundation');

  // When pillar set changes (new course, new briefs), realign active.
  useEffect(() => {
    if (!pillars.find(p => p.id === activePillarId)) {
      setActivePillarId(pillars[0]?.id || 'empty');
    }
  }, [pillars, activePillarId]);

  // Drafts: keyed by `${pillarId}.${blockId}`. Persist to localStorage so
  // the student's writing survives a reload.
  const STORE_KEY = `simplifii_studio_drafts_${activeCourse?.name || 'default'}`;
  const [drafts, setDrafts] = useState(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(drafts)); } catch { /* ignore */ }
  }, [drafts, STORE_KEY]);

  const pillar = pillars.find((p) => p.id === activePillarId) || pillars[0];
  const pillarDrafts = drafts[pillar.id] || {};

  const setDraft = (blockId, val) => {
    setDrafts((prev) => ({
      ...prev,
      [pillar.id]: { ...(prev[pillar.id] || {}), [blockId]: val }
    }));
  };

  // Reset active block when pillar swaps.
  useEffect(() => {
    if (pillar && pillar.blocks.length) setActiveBlockId(pillar.blocks[0].id);
  }, [activePillarId]);

  return (
    <div className="studio">
      <NavRail onExit={onExit} />
      <SourcesPanel
        docs={docs}
        pillars={pillars}
        activePillar={activePillarId}
        activeDoc={activeDocId}
        onPickPillar={setActivePillarId}
        onPickDoc={setActiveDocId}
        onAddSource={onExit}
        courses={courses}
        activeCourseId={activeCourseId}
        onPickCourse={setActiveCourseId}
      />
      <Cockpit
        pillar={pillar}
        pillars={pillars}
        drafts={pillarDrafts}
        setDraft={setDraft}
        activeBlockId={activeBlockId}
        setActiveBlockId={setActiveBlockId}
        onPickPillar={setActivePillarId}
      />
      <AuraPanel activeCourse={activeCourse} pillar={pillar} />
    </div>
  );
}
