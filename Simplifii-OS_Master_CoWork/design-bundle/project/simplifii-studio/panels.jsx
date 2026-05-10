/* global React */
const { useMemo } = React;

// ============================================================
// Roadmap (top of cockpit)
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
            data-done={p.status === "done"}
            onClick={() => onPick(p.id)}
          >
            <span className="roadmap-pip" />
            <span className="roadmap-text">
              <span className="roadmap-name">{p.num}  ·  {p.name}</span>
              <span className="roadmap-meta">{p.weight}%   {p.due}   {p.status === "done" ? "CLOSED" : p.status === "active" ? "IN SPRINT" : "QUEUED"}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Sources Panel (left)
// ============================================================

function SourcesPanel({ docs, pillars, activePillar, onPickPillar, onPickDoc, activeDoc }) {
  // cluster docs by theme
  const clusters = [
    { id: "methodology", theme: "methodology", name: "Methodology", filter: (d) => d.cluster === "methodology" || d.tag === "MASTER SOURCE" },
    { id: "evidence", theme: "evidence", name: "Evidence", filter: (d) => d.cluster === "evidence" || d.tag === "ACTIVE SPRINT" },
    { id: "rubric", theme: "rubric", name: "Rubrics", filter: (d) => d.cluster === "rubric" || d.tag === "REFERENCED" }
  ];
  return (
    <div className="col" id="sources-col">
      <div className="col-head">
        <div className="col-head-title">
          <span className="dot" />
          <span>Grounding Drive</span>
        </div>
        <button className="rail-btn" title="Add source"><I.Plus /></button>
      </div>

      <div className="col-body">
        <div className="source-map">
          <div className="source-map-label">SOURCE MAP · BABS1201</div>
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
            <span><i style={{ background: "var(--emerald)" }} /> METHOD</span>
            <span><i style={{ background: "#6BA9E0" }} /> EVIDENCE</span>
            <span><i style={{ background: "#C9A24A" }} /> RUBRIC</span>
          </div>
        </div>

        {clusters.map((c) => {
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
                        <span className={`tag ${d.tagClass}`}>{d.tag}</span>
                      </div>
                      <div className="source-sub">
                        <span>{d.pages} pp</span>
                        <span>·</span>
                        <span>{d.annotations} notes</span>
                        <span>·</span>
                        <span>{d.opened}</span>
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
          {pillars.map((p) => (
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
        <div style={{ padding: "0 18px 24px", fontFamily: "var(--f-mono)", fontSize: 10.5, color: "var(--ink-mute)", lineHeight: 1.7 }}>
          <div>┌─ Course Outline (Master)</div>
          <div>│   └─ Lit Review Brief (Active)</div>
          <div>│       └─ Marking Rubric</div>
          <div>└─ Thinking History (live)</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Nav Rail (far left)
// ============================================================

function NavRail() {
  return (
    <div className="col rail">
      <div className="rail-mark">S</div>
      <button className="rail-btn" data-active="true" title="Studio"><I.Compass /></button>
      <button className="rail-btn" title="Library"><I.Bookmark /></button>
      <button className="rail-btn" title="Targets"><I.Target /></button>
      <button className="rail-btn" title="Integrity"><I.Shield /></button>
      <div className="rail-spacer" />
      <button className="rail-btn" title="Settings"><I.Settings /></button>
      <div className="rail-avatar">JM</div>
    </div>
  );
}

// ============================================================
// AURA Panel (right)
// ============================================================

function AuraPanel({ messages, onSend, draft, setDraft }) {
  const send = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft("");
  };

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
          <span style={{ color: "var(--emerald)" }}>●</span>
          <span>GROUNDED · 3 SRC</span>
        </div>
      </div>

      <div className="aura-messages">
        {messages.map((m, i) => {
          if (m.role === "suggestion") {
            return (
              <div className="aura-suggest fade-in" key={i}>
                <div className="aura-suggest-label">⚡  {m.label}</div>
                <div className="aura-suggest-text">{m.text}</div>
                {m.cites && (
                  <div className="cite-row">
                    {m.cites.map((c, j) => <span className="cite" key={j}>{c.label}</span>)}
                  </div>
                )}
                <div className="aura-suggest-actions">
                  <button className="btn-pill primary">Insert into draft</button>
                  <button className="btn-pill">Refine</button>
                  <button className="btn-pill">Dismiss</button>
                </div>
              </div>
            );
          }
          const isUser = m.role === "user";
          return (
            <div className={`msg ${isUser ? "msg-user" : "msg-aura"}`} key={i}>
              {!isUser && (
                <div className="msg-meta">
                  <span className="name">AURA</span>
                  <span>·</span>
                  <span>{m.time || "JUST NOW"}</span>
                </div>
              )}
              <div className="msg-bubble">{m.text}</div>
              {m.cites && (
                <div className="cite-row">
                  {m.cites.map((c, j) => <span className="cite" key={j}>{c.label}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="dispatch">
        <div className="dispatch-label">MULTI-AGENT DISPATCH</div>
        {[
          { cmd: "synthesise", desc: "weigh positions" },
          { cmd: "critique",   desc: "stress-test logic" },
          { cmd: "cite",       desc: "ground in sources" },
          { cmd: "elevate",    desc: "raise register" },
          { cmd: "humanise",   desc: "warm the prose" }
        ].map((c) => (
          <button
            key={c.cmd}
            className="dispatch-cmd"
            onClick={() => setDraft((draft || "") + (draft ? " " : "") + "/" + c.cmd + " ")}
            title={c.desc}
          >
            <span className="slash">/</span>{c.cmd}
          </button>
        ))}
      </div>

      <div className="aura-input">
        <div className="aura-input-shell">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Ask AURA, grounded in your sources…"
          />
          <div className="aura-input-row">
            <div className="aura-chips">
              <button className="aura-chip"><I.Mic style={{ width: 11, height: 11, marginRight: 4 }} />voice</button>
              <button className="aura-chip">attach</button>
            </div>
            <button className="aura-send" onClick={send} disabled={!draft.trim()}>
              <I.Send />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Roadmap = Roadmap;
window.SourcesPanel = SourcesPanel;
window.NavRail = NavRail;
window.AuraPanel = AuraPanel;
