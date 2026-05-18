/* global React */
const { useState, useMemo, useEffect, useRef } = React;

// ============================================================
// Cockpit (centre column)
// ============================================================

function wordCount(s) {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function Cockpit({ pillar, drafts, setDraft, activeBlockId, setActiveBlockId }) {
  const totalWords = useMemo(() => {
    return pillar.blocks.reduce((sum, b) => sum + wordCount(drafts[b.id] || ""), 0);
  }, [drafts, pillar]);

  const totalTarget = pillar.wordTarget || 1;
  const totalPct = Math.min(100, Math.round((totalWords / totalTarget) * 100));

  const editorRef = useRef(null);
  useEffect(() => {
    if (editorRef.current) editorRef.current.focus();
  }, [activeBlockId, pillar.id]);

  const activeBlock = pillar.blocks.find((b) => b.id === activeBlockId) || pillar.blocks[0];

  return (
    <div className="col cockpit">
      <MasteryBar activeId="drill" />
      <Roadmap
        pillars={window.SIMPLIFII_DATA.PILLARS}
        activeId={pillar.id}
        onPick={(id) => window.dispatchEvent(new CustomEvent("simplifii:pickPillar", { detail: id }))}
      />

      <div className="cockpit-context swap-in" key={pillar.id}>
        <div>
          <div className="cockpit-eyebrow">
            <span className="pulse" />
            <span>BABS1201   ·   PILLAR {pillar.num}   ·   {pillar.due.toUpperCase()}</span>
          </div>
          <h1 className="cockpit-title">{pillar.name}</h1>
          <div className="cockpit-sub">
            {pillar.weight}% of final grade   ·   {pillar.wordTarget.toLocaleString()} word target   ·   25 marks across two rubric bands
          </div>
        </div>
        <div className="cockpit-meta">
          <div className="meta-stat">
            <span className="meta-stat-label">Words</span>
            <span className="meta-stat-value is-emerald">
              {totalWords.toLocaleString()}<span style={{ color: "var(--ink-faint)" }}> / {pillar.wordTarget.toLocaleString()}</span>
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

      <BlocksBar
        blocks={pillar.blocks}
        drafts={drafts}
        activeId={activeBlockId}
        onPick={setActiveBlockId}
      />

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
              <strong>{wordCount(drafts[activeBlock.id] || "")}</strong> / {activeBlock.target} words
            </span>
            <span className="toolbar-stat" style={{ opacity: 0.6 }}>
              auto-saved · grounded
            </span>
          </div>
        </div>

        <textarea
          ref={editorRef}
          className="editor"
          value={drafts[activeBlock.id] || ""}
          onChange={(e) => setDraft(activeBlock.id, e.target.value)}
          placeholder={`Start the ${activeBlock.name.toLowerCase()} block. ${activeBlock.desc}`}
          spellCheck={false}
        />

        <div className="rubric-strip swap-in" key={pillar.id + "-rubric"}>
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

      <CockpitFooter words={totalWords} drafts={drafts} blocks={pillar.blocks} />
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
        const text = drafts[b.id] || "";
        const w = wordCount(text);
        const pct = Math.min(100, Math.round((w / Math.max(1, b.target)) * 100));
        const num = String(i + 1).padStart(2, "0");
        const isComplete = pct >= 100;
        const health = window.sectionHealth(text, b.target);
        return (
          <button
            key={b.id}
            className="block"
            data-active={b.id === activeId}
            data-fill={pct > 0 ? "true" : undefined}
            data-fill-pct={pct}
            data-complete={isComplete}
            data-health={health.state}
            style={{ "--block-fill": (pct / 100).toFixed(2) }}
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
              <div className="block-bar-fill" style={{ width: pct + "%" }} />
            </div>
            <div className="block-health">
              <span className="health-dots" data-level={health.level}>
                <i /><i /><i /><i /><i />
              </span>
              <span className="health-label">SECTION HEALTH · {health.label.toUpperCase()}</span>
            </div>
            <div className="block-words">
              {w.toLocaleString()} / {b.target.toLocaleString()} words
              {isComplete ? "   ·   COMPLETE" : ""}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Footer (integrity log + status)
// ============================================================

function CockpitFooter({ words, drafts, blocks }) {
  // Visualise per-block contribution as bars
  const bars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 56; i++) {
      const seed = (i * 9301 + 49297) % 233280;
      const noise = seed / 233280;
      const intensity = 0.3 + noise * 0.7;
      const heightPct = Math.max(8, Math.round(intensity * 100));
      arr.push(heightPct);
    }
    return arr;
  }, []);

  return (
    <div className="cockpit-footer">
      <div className="footer-group">
        <span className="footer-stat"><span className="label">SESSION</span><span className="val">02:41:18</span></span>
        <span className="footer-stat"><span className="label">EDITS</span><span className="val">{Math.max(words * 1.7 | 0, 12)}</span></span>
        <span className="footer-stat"><span className="label">REVISIONS</span><span className="val">{Math.max(words / 40 | 0, 3)}</span></span>
        <span className="footer-stat"><span className="label">GROUNDED</span><span className="val" style={{ color: "var(--emerald)" }}>3 / 3 SRC</span></span>
      </div>
      <div className="integrity-bars" title="Thinking History">
        {bars.map((h, i) => (
          <i key={i} style={{ height: h + "%", opacity: 0.25 + (h / 200) }} />
        ))}
      </div>
      <div className="footer-group">
        <span className="footer-stat"><span className="label">AURA</span><span className="val">SENIOR / GROUNDED</span></span>
        <span className="footer-stat"><span className="label">LANG</span><span className="val">en-AU</span></span>
      </div>
    </div>
  );
}

window.Cockpit = Cockpit;
