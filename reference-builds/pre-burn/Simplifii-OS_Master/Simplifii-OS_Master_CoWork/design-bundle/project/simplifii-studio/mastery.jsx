/* global React */
const { useState, useMemo, useEffect, useRef } = React;

// ============================================================
// Helpers
// ============================================================

function wordCount(s) {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// crude "semantic density" proxy — counts markers of academic rigour
// (citations, hedging, transition logic) divided by length
function sectionHealth(text, target) {
  const w = wordCount(text);
  if (w === 0) return { level: 0, label: "Empty", state: "empty" };

  const cites = (text.match(/\([A-Z][a-z]+(?:\s*(?:&|et al\.?|,)\s*[A-Z]?[a-z]*)*,?\s*\d{4}/g) || []).length
    + (text.match(/p\.\s?\d+/g) || []).length;
  const hedges = (text.match(/\b(however|whereas|although|nevertheless|conversely|in contrast|by contrast|disagree|contested|contend|argues?|claims?)\b/gi) || []).length;
  const academic = (text.match(/\b(synthesis|methodology|empirical|hypothesis|literature|peer-reviewed|primary studies|review|evidence|tolerance|cascade|signalling|adaptive)\b/gi) || []).length;

  const completion = Math.min(1, w / Math.max(1, target));
  const density = (cites * 3 + hedges * 1.5 + academic) / Math.max(40, w);
  const blended = Math.min(1, completion * 0.55 + Math.min(1, density * 6) * 0.45);

  const level = Math.max(1, Math.round(blended * 5));
  let label = "Sparse", state = "empty";
  if (blended >= 0.78) { label = "Rigorous"; state = "strong"; }
  else if (blended >= 0.55) { label = "Building"; state = "moderate"; }
  else if (blended >= 0.25) { label = "Developing"; state = "developing"; }
  return { level, label, state, completion: Math.round(completion * 100) };
}

// ============================================================
// Mastery Flow bar
// ============================================================

const MASTERY_STAGES = [
  { id: "introduce", name: "Introduce", desc: "Frame the topic" },
  { id: "drill",     name: "Drill",     desc: "Repeat the moves" },
  { id: "recognise", name: "Recognise", desc: "Spot patterns in the wild" },
  { id: "simulate",  name: "Simulate",  desc: "Perform under load" }
];

function MasteryBar({ activeId }) {
  const idx = MASTERY_STAGES.findIndex((s) => s.id === activeId);
  return (
    <div className="mastery">
      <span className="mastery-label">MASTERY FLOW</span>
      <div className="mastery-flow">
        {MASTERY_STAGES.map((s, i) => {
          const state = i < idx ? "done" : i === idx ? "active" : "next";
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
// Neural Visualiser
// ============================================================

const VISUALISER_NODES = {
  "lit-review": {
    title: "Cell Surface Receptor Cascade",
    sub: "BABS1201 · Lecture 4 reference structure",
    nodes: [
      { id: 1, x: 22, y: 38, name: "Toll-like receptor (TLR4)",  desc: "Pattern recognition. Triggers the MyD88 dependent path on LPS binding." },
      { id: 2, x: 48, y: 28, name: "Adaptor protein (MyD88)",     desc: "Routes the signal toward NF-κB and the cytokine response." },
      { id: 3, x: 70, y: 52, name: "NF-κB nuclear shuttle",       desc: "Drives transcription of the inflammatory cytokine programme." },
      { id: 4, x: 38, y: 72, name: "Crosstalk node (microbiome)", desc: "Where the literature contests whether commensals trigger or modulate." }
    ]
  }
};

function NeuralVisualiser({ pillarId }) {
  const dataset = VISUALISER_NODES[pillarId] || VISUALISER_NODES["lit-review"];
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
            {collapsed ? "Expand ↓" : "Collapse ↑"}
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
                <line key={i}
                  x1={n.x} y1={n.y} x2={m.x} y2={m.y}
                  stroke="url(#ln)" strokeWidth="0.4"
                  strokeDasharray="0.8 0.8" />
              );
            })}
            {dataset.nodes.map((n) => (
              <circle key={n.id}
                cx={n.x} cy={n.y} r={active === n.id ? 1.6 : 0.9}
                fill="#50C878" opacity={active === n.id ? 1 : 0.4} />
            ))}
          </svg>
          <div className="visualiser-hotspots">
            {dataset.nodes.map((n) => (
              <button key={n.id}
                className="hotspot"
                data-active={active === n.id}
                style={{ left: `calc(${n.x}% - 7px)`, top: `calc(${n.y}% - 7px)` }}
                onClick={() => setActive(n.id)} />
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

window.MasteryBar = MasteryBar;
window.NeuralVisualiser = NeuralVisualiser;
window.sectionHealth = sectionHealth;
window.MASTERY_STAGES = MASTERY_STAGES;
