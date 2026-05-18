/* global React, ReactDOM */
const { useState, useEffect, useRef } = React;

/* ============================================================
   HANDSHAKE PORTAL
   ============================================================ */
function HandshakePortal() {
  const [phase, setPhase] = useState(0); // 0 idle, 1 scanning, 2 mapping, 3 done
  const phaseLabels = [
    { l1: "Awaiting credential", l2: "Drop ID or syllabus to begin", bps: "" },
    { l1: "Neural scan in progress", l2: "Reading semantic structure", bps: "1.2 GB/s · 47% complete" },
    { l1: "Mapping ontology",       l2: "Building your sovereign space", bps: "Linking 342 concepts" },
    { l1: "Handshake complete",     l2: "Welcome, Lola Costa",            bps: "Stream calibrated · Tertiary (MRes)" },
  ];

  // Auto-advance demo
  useEffect(() => {
    const seq = [1500, 3500, 4200, 99999];
    const t = setTimeout(() => setPhase(p => (p + 1) % 4), seq[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  const steps = [
    { tag: "01 · Identity",  title: "University credential", val: "Lola Costa · UNSW · z5384921",         done: phase >= 1 },
    { tag: "02 · Document",  title: "Source ingest",         val: "BABS1201 — Lit Review Brief.pdf",     done: phase >= 2, active: phase === 1 },
    { tag: "03 · Mapping",   title: "Ontology synthesis",    val: phase >= 2 ? "12 sections · 8 themes · 47 citations primed" : "—", done: phase >= 3, active: phase === 2 },
    { tag: "04 · Stream",    title: "Stream calibration",    val: phase >= 3 ? "Tertiary · Research Cockpit · JetBrains Mono" : "—", done: false, active: phase === 3 },
  ];

  const pl = phaseLabels[phase];

  return (
    <div className="hs">
      <div className="hs-portal">
        <div className="hs-grid"></div>
        <div className="hs-rings">
          <div className="hs-ring r1"></div>
          <div className="hs-ring r2"></div>
          <div className="hs-ring r3"></div>
          <div className="hs-ring r4"></div>
        </div>
        {phase >= 1 && phase <= 2 && <div className="hs-scan"></div>}
        <div className="hs-doc">
          <div className="hs-doc-line"></div>
          <div className="hs-doc-line"></div>
          <div className="hs-doc-line"></div>
          <div className="hs-doc-line"></div>
          <div className="hs-doc-line"></div>
          <div className="hs-doc-line"></div>
        </div>
        {phase >= 1 && (
          <>
            <div className="hs-particle p1" style={{"--dx":"-40px","--dy":"-80px"}}></div>
            <div className="hs-particle p2" style={{"--dx":"50px","--dy":"-70px"}}></div>
            <div className="hs-particle p3" style={{"--dx":"-30px","--dy":"60px"}}></div>
            <div className="hs-particle p4" style={{"--dx":"60px","--dy":"40px"}}></div>
            <div className="hs-particle p5" style={{"--dx":"0px","--dy":"-100px"}}></div>
          </>
        )}
        <div className="hs-status">
          <div>{pl.l1}</div>
          <div className="dim" style={{fontSize:"10px",letterSpacing:"0.08em",textTransform:"none"}}>{pl.l2}</div>
          {pl.bps && <div className="bps">{pl.bps}</div>}
        </div>
      </div>

      <div className="hs-side">
        <div style={{marginBottom: 6}}>
          <div style={{fontFamily:"var(--f-mono)",fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--emerald)",marginBottom:8}}>The Handshake</div>
          <h2 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.015em",lineHeight:1.2,margin:0}}>A sovereign onboarding ritual.</h2>
          <p style={{fontSize:13,color:"var(--ink-soft)",lineHeight:1.55,marginTop:8}}>Drop one document. The scanner reads structure, not content — and calibrates Simplifii to <em>your</em> stream, your level, your work.</p>
        </div>

        {steps.map((s, i) => (
          <div key={i} className="hs-step" data-state={s.done ? "done" : s.active ? "active" : "idle"}>
            <div className="hs-step-pip">{!s.done && (i + 1)}</div>
            <div>
              <div className="hs-step-head">{s.tag}</div>
              <div className="hs-step-title">{s.title}</div>
              <div className="hs-step-val">
                {s.val === "—" ? <span className="placeholder">awaiting prior step</span> : s.val}
              </div>
            </div>
          </div>
        ))}

        <div className="hs-cta" onClick={() => setPhase(0)} style={{cursor:"pointer"}}>
          {phase === 3 ? "Enter Simplifii →" : "Re-run handshake demo"}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STREAM SKINS
   ============================================================ */
function PrimaryQuestEngine() {
  return (
    <div className="skin">
      <div className="skin-head">
        <span className="skin-tag" data-stream="primary">Primary · K-6</span>
        <div className="skin-title-group">
          <div className="skin-title">The Quest Engine</div>
          <div className="skin-sub">Claymation · simplified type · tactile power-ups</div>
        </div>
        <div className="skin-meta">geist · 18px base</div>
      </div>
      <div className="skin-body qe">
        <div className="qe-tile">
          <div className="qe-greet">G'day, Sam!</div>
          <div className="qe-sub">3 quests left to unlock <strong style={{color:"var(--clay)"}}>Reading Champion</strong></div>
          <div className="qe-quest-row">
            <div className="qe-quest" data-pri="1">
              <div className="qe-quest-icon">📖</div>
              <div className="qe-quest-title">Read 2 pages of <em>Possum Magic</em></div>
              <div className="qe-quest-meta"><span className="star">★</span><span className="star">★</span><span className="star" style={{color:"var(--ink-faint)"}}>★</span></div>
            </div>
            <div className="qe-quest" data-pri="2">
              <div className="qe-quest-icon">✏️</div>
              <div className="qe-quest-title">Write 3 sentences about your weekend</div>
              <div className="qe-quest-meta"><span className="star">★</span><span className="star" style={{color:"var(--ink-faint)"}}>★</span><span className="star" style={{color:"var(--ink-faint)"}}>★</span></div>
            </div>
            <div className="qe-quest" data-pri="3">
              <div className="qe-quest-icon">🧮</div>
              <div className="qe-quest-title">Times tables · 6×</div>
              <div className="qe-quest-meta"><span className="star">★</span><span className="star">★</span><span className="star">★</span></div>
            </div>
          </div>
          <div className="qe-power">⚡ Start today's first quest</div>
        </div>
        <div className="qe-buddy">
          <div className="qe-buddy-orb"><div className="qe-buddy-mouth"></div></div>
          <div className="qe-buddy-name">Mango</div>
          <div className="qe-buddy-msg">"You read 4 days in a row! Want to do a short one with me?"</div>
          <div className="qe-buddy-xp">+ 240 XP today · Streak 4 🔥</div>
        </div>
      </div>
    </div>
  );
}

function SecondaryFocusHub() {
  const cells = [
    { d: "M", on: true }, { d: "T", on: true }, { d: "W", on: true },
    { d: "T", on: "partial" }, { d: "F", on: true }, { d: "S", on: false }, { d: "S", on: false },
  ];
  return (
    <div className="skin">
      <div className="skin-head">
        <span className="skin-tag" data-stream="secondary">Secondary · Y7-12</span>
        <div className="skin-title-group">
          <div className="skin-title">The Focus Hub</div>
          <div className="skin-sub">Streaks · social body-doubling · high-energy accents</div>
        </div>
        <div className="skin-meta">geist · 15px base</div>
      </div>
      <div className="skin-body">
        <div className="fh">
          <div>
            <div className="fh-streak">
              <div className="fh-streak-head">
                <div className="fh-streak-num">14<small>day streak</small></div>
                <div className="fh-streak-flame">🔥</div>
              </div>
              <div className="fh-cells">
                {cells.map((c, i) => <div key={i} className="fh-cell" data-on={c.on}></div>)}
              </div>
              <div className="fh-streak-foot">7-day average · 42 min focused / day</div>
            </div>
            <div className="fh-task">
              <div className="fh-task-label">Up next · Year 11 English</div>
              <div className="fh-task-title">Draft thesis for <em>Crucible</em> essay</div>
              <div className="fh-task-pill">⏱ 25-min sprint · Pomodoro</div>
            </div>
          </div>
          <div className="fh-bd">
            <div className="fh-bd-head">
              <div className="fh-bd-tag">Body Double</div>
              <div className="fh-bd-live">LIVE · 4 in room</div>
            </div>
            <div className="fh-bd-grid">
              <div className="fh-bd-tile" data-self="true"></div>
              <div className="fh-bd-tile"></div>
              <div className="fh-bd-tile"></div>
              <div className="fh-bd-tile"></div>
            </div>
            <div className="fh-bd-foot">Working alongside <strong>Asha, Marco, and Ren</strong>. Cameras silent — presence only.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TertiaryResearchCockpit() {
  return (
    <div className="skin">
      <div className="skin-head">
        <span className="skin-tag" data-stream="tertiary">Tertiary · MRes</span>
        <div className="skin-title-group">
          <div className="skin-title">The Research Cockpit</div>
          <div className="skin-sub">Studio v3 · JetBrains Mono · high-density data</div>
        </div>
        <div className="skin-meta">jetbrains mono · 13px base</div>
      </div>
      <div className="skin-body rc">
        <div className="rc-row">
          <div className="rc-card">
            <div className="label">Active sprint</div>
            <div className="val">2,418<small>/ 2,500 words</small></div>
            <div className="sub">BABS1201 · Lit Review · 96.7% target</div>
          </div>
          <div className="rc-card">
            <div className="label">Citation density</div>
            <div className="val">1.4<small>per 100 words</small></div>
            <div className="sub">Within rubric envelope (1.0–2.0)</div>
          </div>
        </div>
        <div className="rc-blocks">
          <div className="rc-block">
            <div className="h">Foundation</div>
            <div className="b"><i style={{width:"100%"}}></i></div>
            <div className="w">847 / 600 w · settled</div>
          </div>
          <div className="rc-block">
            <div className="h">Core</div>
            <div className="b"><i style={{width:"86%"}}></i></div>
            <div className="w">1,205 / 1,400 w · drafting</div>
          </div>
          <div className="rc-block">
            <div className="h">Polish</div>
            <div className="b"><i style={{width:"73%"}}></i></div>
            <div className="w">366 / 500 w · refining</div>
          </div>
        </div>
        <div className="rc-prose">
          <span style={{color:"var(--ink-faint)"}}>›&nbsp;</span>"…the prevailing hypothesis frames ribosomal stalling as a regulatory feature, not a fault [Buskirk &amp; Green, 2017]. Yet the kinetic model proposed by Mohammad et al. complicates this view…"
          <span style={{color:"var(--emerald)"}}> ▍</span>
        </div>
      </div>
    </div>
  );
}

function TafeSkillLab() {
  const comps = [
    { code: "BSBPMG540", name: "Manage project integration", done: true },
    { code: "BSBOPS503", name: "Develop administrative systems", done: true },
    { code: "BSBLDR521", name: "Lead the development of diverse workforce", done: false },
    { code: "BSBPMG541", name: "Manage project scope", done: false },
  ];
  const cells = [
    "done","done","done","done","active","idle","idle","idle","idle"
  ];
  return (
    <div className="skin">
      <div className="skin-head">
        <span className="skin-tag" data-stream="tafe">TAFE · Cert IV</span>
        <div className="skin-title-group">
          <div className="skin-title">The Skill Lab</div>
          <div className="skin-sub">Industrial · grid-based · competency-driven</div>
        </div>
        <div className="skin-meta">jetbrains mono · 14px base</div>
      </div>
      <div className="skin-body sl">
        <div className="sl-grid">
          <div className="sl-grid-head">
            <div className="sl-grid-title">Units of Competency</div>
            <div className="sl-grid-pct">2<small>/4</small></div>
          </div>
          <div className="sl-comp">
            {comps.map((c, i) => (
              <div key={i} className="sl-row" data-done={c.done}>
                <div className="sl-box"></div>
                <div>
                  <div className="sl-name">{c.name}</div>
                  <div className="sl-code">{c.code}</div>
                </div>
                <div className="sl-code">{c.done ? "C" : "—"}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="sl-bench">
          <div className="sl-bench-head">Practical Benchmark · Sim 04</div>
          <div className="sl-bench-grid">
            {cells.map((s, i) => (
              <div key={i} className="sl-cell" data-state={s}>
                {s === "done" ? "✓" : s === "active" ? "●" : (i + 1)}
              </div>
            ))}
          </div>
          <div style={{marginTop:14,fontFamily:"var(--f-mono)",fontSize:10,color:"var(--ink-mute)",letterSpacing:"0.06em"}}>SIGN-OFF · Workplace assessor required for cells 6–9</div>
        </div>
      </div>
    </div>
  );
}

function HomeschoolingSelfPaced() {
  const months = [
    { m: "Jan", topic: "Foundations · phonics & number sense", state: "done" },
    { m: "Feb", topic: "Story structure · long division", state: "done" },
    { m: "Mar", topic: "Australian ecosystems (project)", state: "done" },
    { m: "Apr", topic: "Ancient civilisations · ratios", state: "active" },
    { m: "May", topic: "Persuasive writing · fractions", state: "next" },
    { m: "Jun", topic: "Solar system · algebra primer", state: "next" },
  ];
  return (
    <div className="skin">
      <div className="skin-head">
        <span className="skin-tag" data-stream="home">Homeschooling</span>
        <div className="skin-title-group">
          <div className="skin-title">Sovereign Self-Paced</div>
          <div className="skin-sub">Quest + Research hybrid · curriculum roadmap overlay</div>
        </div>
        <div className="skin-meta">geist · adaptive scale</div>
      </div>
      <div className="skin-body hp">
        <div className="hp-roadmap">
          <div className="hp-roadmap-head">Year 5 Roadmap · Sovereign Path</div>
          {months.map((m, i) => (
            <div key={i} className="hp-month" data-state={m.state}>
              <div className="m">{m.m}</div>
              <div className="topic">{m.topic}</div>
            </div>
          ))}
        </div>
        <div className="hp-today">
          <div className="hp-today-head">Today · Tuesday</div>
          <div className="hp-today-title">Build a timeline of Ancient Egypt — your way.</div>
          <div className="hp-cards">
            <div className="hp-card" data-mode="quest">
              <div className="icon">🏺</div>
              <div className="name">Quest mode</div>
              <div className="meta">3 short missions · earn artefacts</div>
            </div>
            <div className="hp-card" data-mode="research">
              <div className="icon">📜</div>
              <div className="name">Research mode</div>
              <div className="meta">Deep-dive · sources + writing</div>
            </div>
          </div>
          <div className="hp-parent">
            <strong>Parent / Guide</strong>
            Mira can pick a mode. Both feed the same Year 5 history outcome — only the surface changes. You'll see today's evidence in the Integrity Report at 4pm.
          </div>
        </div>
      </div>
    </div>
  );
}

function StreamsBoard() {
  return (
    <>
      <div className="streams">
        <PrimaryQuestEngine />
        <SecondaryFocusHub />
        <TertiaryResearchCockpit />
        <TafeSkillLab />
        <HomeschoolingSelfPaced />
      </div>
    </>
  );
}

/* ============================================================
   FOCUS TUNNEL
   ============================================================ */
function FocusTunnel() {
  const [zen, setZen] = useState(true);
  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18,gap:24}}>
        <p style={{fontSize:13.5,color:"var(--ink-soft)",lineHeight:1.55,margin:0,maxWidth:"60ch"}}>
          Focus Tunnel dims the entire workspace to <strong style={{color:"var(--ink)"}}>0.4 opacity</strong> when a sprint is active. Only the One Literal Task and the AURA avatar remain at full presence. Toggle the zen state below — the surrounding chrome remains visible but recedes.
        </p>
      </div>

      <div className="ft-stage" data-zen={zen}>
        <div className="ft-bg">
          <div className="ft-mock-bar">
            <div className="pip"></div>
            BABS1201 · Lit Review · Sprint 04
            <div className="spacer"></div>
            <div>2,418 / 2,500 w · 96.7%</div>
          </div>
          <div className="ft-grid">
            <div className="ft-col">
              <div className="ft-col-head">Sources</div>
              <div className="row">Brief — BABS1201 Lit Review</div>
              <div className="row">Buskirk &amp; Green (2017)</div>
              <div className="row">Mohammad et al. (2019)</div>
              <div className="row">Marker rubric · v2.1</div>
              <div className="row">Lecture 6 transcript</div>
            </div>
            <div className="ft-col">
              <div className="ft-col-head">Cockpit</div>
              <div style={{fontFamily:"var(--f-mono)",fontSize:11.5,color:"var(--ink-soft)",lineHeight:1.7,letterSpacing:"0.005em"}}>
                The prevailing hypothesis frames ribosomal stalling as a regulatory feature, not a fault. Yet the kinetic model proposed by Mohammad et al. complicates this view by introducing a second-order rate constant that…
              </div>
            </div>
            <div className="ft-col">
              <div className="ft-col-head">AURA</div>
              <div className="row">› Suggest evidence for paragraph 3</div>
              <div className="row">› Tighten sentence on stalling</div>
              <div className="row">› Cross-check Mohammad citation</div>
            </div>
          </div>
        </div>

        <div className="ft-vignette"></div>

        <div className="ft-task-shell">
          <div className="ft-task-eye">One Literal Task · {zen ? "Focus Tunnel active" : "Focus Tunnel idle"}</div>
          <div className="ft-task-title">Write the opening sentence that names the contested mechanism in your own words.</div>
          <div className="ft-task-sub">No citations yet. No transitions. Just the claim — clearly, in 22 words or fewer.</div>
        </div>

        <div className="ft-aura-tip">
          <strong>AURA</strong>
          Take your time. I'm here if you stall — I won't draft for you, but I'll ask the right next question.
        </div>
        <div className="ft-aura"></div>

        <div className="ft-controls">
          <span className="label">Sprint active</span>
          <button className="tg" data-on={zen} onClick={() => setZen(!zen)} aria-label="Toggle focus tunnel"></button>
          <span className="label" style={{color: zen ? "var(--emerald)" : "var(--ink-mute)"}}>{zen ? "Zen on" : "Zen off"}</span>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
function App() {
  const [tab, setTab] = useState("handshake");

  const heads = {
    handshake: { eye: "01 · Sovereign Onboarding", h: "The Handshake.", p: "An immersive intake portal. Drop a credential or syllabus, watch the neural scanner ingest its structure, and Simplifii calibrates itself to your stream — your level, your work, your sovereignty." },
    streams:   { eye: "02 · Five Streams · One OS",    h: "Same brain, five surfaces.",     p: "The intelligence underneath is constant — verification, executive scaffolding, integrity. The skin you see depends on who you are. Each stream below is a working preview of its skin language." },
    tunnel:    { eye: "03 · The Focus Tunnel",      h: "Zen state, on demand.",          p: "When a sprint begins, everything except the One Literal Task and AURA dims to 0.4 opacity. The chrome stays present but recedes. Discipline as a rendering effect." },
  };

  const head = heads[tab];

  return (
    <>
      <div className="bar">
        <div className="bar-mark">S</div>
        <div>
          <div className="bar-eyebrow">Simplifii-OS</div>
          <div className="bar-title">C-Design · Sovereign Onboarding & Stream Experience</div>
        </div>
        <div className="bar-spacer"></div>
        <div className="bar-tabs">
          <button className="bar-tab" data-active={tab==="handshake"} onClick={()=>setTab("handshake")}>Handshake</button>
          <button className="bar-tab" data-active={tab==="streams"}   onClick={()=>setTab("streams")}>5 Streams</button>
          <button className="bar-tab" data-active={tab==="tunnel"}    onClick={()=>setTab("tunnel")}>Focus Tunnel</button>
        </div>
      </div>

      <div className="stage">
        <div className="stage-head">
          <div className="stage-eyebrow"><span className="pulse"></span>{head.eye}</div>
          <h1>{head.h}</h1>
          <p>{head.p}</p>
        </div>

        {tab === "handshake" && <HandshakePortal />}
        {tab === "streams"   && <StreamsBoard />}
        {tab === "tunnel"    && <FocusTunnel />}
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
