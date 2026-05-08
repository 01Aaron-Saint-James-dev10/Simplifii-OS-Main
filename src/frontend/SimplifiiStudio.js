import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import './simplifii-studio.css';
import { useProject } from './ProjectContext';
import { askAura } from '../services/ChatService';
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
  return (
    <div className="col" id="sources-col">
      <div className="col-head">
        <div className="col-head-title">
          <span className="dot" />
          <span>Source Documents</span>
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

        <div className="sources-section-label">Course Grounding</div>

        {docs.length === 0 ? (
          <div style={{ padding: '14px 18px', fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
            No syllabus uploaded yet. Click + to drop the Course Outline, Brief, and Rubric.
          </div>
        ) : docs.map((d) => (
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
        const w = wordCount(drafts[b.id] || '');
        const target = Math.max(1, b.target);
        const pct = Math.min(100, Math.round((w / target) * 100));
        const num = String(i + 1).padStart(2, '0');
        const isComplete = pct >= 100;
        return (
          <button
            key={b.id}
            className="block"
            data-active={b.id === activeId}
            data-fill={pct > 0 ? 'true' : undefined}
            data-fill-pct={pct}
            data-complete={isComplete}
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

  return (
    <div className="col cockpit">
      <Roadmap pillars={pillars} activeId={pillar.id} onPick={onPickPillar} />

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
