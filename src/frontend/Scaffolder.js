import React, { useState, useMemo } from 'react';
import './scaffolder.css';
import { useProject } from './ProjectContext';
import { literalise, shouldLiteralise } from '../core/LiteralMode';

/**
 * Scaffolder: Tiered Support Engine
 *
 * Sovereign overlay above the Studio. Re-renders one assessment brief
 * into three different scaffolds depending on the learner tier:
 *   Primary (K-6)        -> Gamified Micro-Quests with XP
 *   Secondary (Y7-10)    -> Body-doubled Checklist with reasons
 *   Tertiary / MRes      -> Backwards-mapped Skeleton timeline
 *
 * The brief is read from activeCourse.activeAssessmentBrief (or the
 * first assessment if no sprint is active). The school's portal stays
 * untouched. No login required. The scaffold lives on top.
 *
 * Default tier resolves from profile.level so a student lands in the
 * right scaffold without picking; manual tabs let them flip to see
 * the alternatives.
 */

const TIERS = [
  { id: 'primary',   num: '01', short: 'K-6',                glyph: 'P', name: 'Primary',   focus: 'Foundation & Focus',         sub: 'Gamified Micro-Quests' },
  { id: 'secondary', num: '02', short: 'Y7-10',              glyph: 'S', name: 'Secondary', focus: 'Executive Function',         sub: 'Body-Doubled Checklist' },
  { id: 'tertiary',  num: '03', short: 'Senior / Tertiary',  glyph: 'T', name: 'Tertiary',  focus: 'Cognitive Load & Synthesis', sub: 'Backwards-Mapped Skeleton' }
];

const tierFromLevel = (level) => {
  const l = String(level || '').toLowerCase();
  if (l === 'primary') return 'primary';
  if (l === 'secondary' || l === 'highschool' || l === 'tafe') return 'secondary';
  return 'tertiary';
};

// ============================================================
// Primary: gamified quests
// ============================================================

function PrimaryQuest({ brief, lit = (s) => s }) {
  const quests = [
    { state: 'done',   level: 'Level 1', title: lit('Find the focus'),     desc: lit('Look at the brief. Circle the words that say what you must do.'),           reward: 'star 5 XP' },
    { state: 'active', level: 'Level 2', title: lit('Match the messengers'), desc: lit('Drag each requirement to the spot in your plan that fits. Three matches.'), reward: 'star 10 XP' },
    { state: 'next',   level: 'Level 3', title: lit('Tell the story'),     desc: lit('Record one voice note explaining what the assignment wants in your words.'), reward: 'star 15 XP, Badge' }
  ];
  return (
    <div data-fade>
      <div className="quest-grid">
        {quests.map((q, i) => (
          <div className="quest" key={i} data-state={q.state}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="quest-pip">{q.state === 'done' ? '' : i + 1}</span>
              <span className="quest-level">{q.level}</span>
            </div>
            <div className="quest-title">{q.title}</div>
            <div className="quest-desc">{q.desc}</div>
            <div className="quest-reward">{q.reward}</div>
          </div>
        ))}
      </div>
      <div className="xp-bar">
        <div className="xp-text"><strong>Quest 2 of 3</strong> · Two more steps and you collect the {(brief.title || 'topic').split(' ')[0]} badge.</div>
        <div className="xp-track"><div className="xp-fill" /></div>
      </div>
      <div className="row3">
        <div className="field"><div className="field-label">READING LEVEL</div><div className="field-val"><strong>Year 4</strong> · 100% literal · no idioms</div></div>
        <div className="field"><div className="field-label">VISUAL SUPPORT</div><div className="field-val">Every step paired with a <strong>diagram</strong> the student can poke</div></div>
        <div className="field"><div className="field-label">SESSION LENGTH</div><div className="field-val">3 quests x <strong>8 minutes</strong> · timer hidden</div></div>
      </div>
    </div>
  );
}

// ============================================================
// Secondary: body-doubled checklist
// ============================================================

function SecondaryCheckList({ brief, lit = (s) => s }) {
  const [done, setDone] = useState({ 0: true, 1: true });
  const items = useMemo(() => ([
    { time: 'Tonight',    tag: 'start', kind: 'start', title: lit(`Open the ${brief.title || 'assessment'} brief and read the first page out loud.`), why: lit('Activation energy is the hardest part. Reading aloud bypasses the wall of text.') },
    { time: 'Tonight',    tag: 'start', kind: 'start', title: lit('Highlight the three words you do not know.'),                                       why: lit('We will look those up together so the rest of the brief stops feeling foreign.') },
    { time: 'Tomorrow',   tag: 'grind', kind: 'grind', title: lit('Skim two of the linked sources. Note one sentence each.'),                          why: lit('Two sources is enough to feel the shape of the argument before committing.') },
    { time: 'Wed eve',    tag: 'grind', kind: 'grind', title: lit('Draft the foundation paragraph in plain English.'),                                 why: lit('Plain first, academic later. Editing is easier than starting.') },
    { time: 'Friday 4pm', tag: 'ship',  kind: 'ship',  title: lit('Send the draft to AURA for a critique pass.'),                                      why: lit('External eyes catch what your eyes cannot. Build that habit early.') }
  ]), [brief.title, lit]);
  return (
    <div data-fade>
      <div className="checklist">
        {items.map((it, i) => (
          <div
            className="check-row"
            key={i}
            data-done={!!done[i]}
            onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
          >
            <div className="check-box" />
            <div className="check-time">{it.time}</div>
            <div>
              <div className="check-text-main">{it.title}</div>
              <div className="check-text-why">{it.why}</div>
            </div>
            <div className="check-tag" data-kind={it.kind}>{it.tag}</div>
          </div>
        ))}
      </div>
      <div className="body-double">
        <span className="pip" />
        <div className="body-double-text">
          <strong>AURA is sitting beside you.</strong>  Body-doubling session active. She will not interrupt unless you stay still for more than 4 minutes.
        </div>
        <button className="body-double-action">Pause</button>
      </div>
      <div className="row3">
        <div className="field"><div className="field-label">READING LEVEL</div><div className="field-val"><strong>Year 9</strong> · plain English with one technical term per row</div></div>
        <div className="field"><div className="field-label">EXEC SUPPORT</div><div className="field-val">Every step explains <strong>the why</strong> before the how</div></div>
        <div className="field"><div className="field-label">SESSION SHAPE</div><div className="field-val">Five steps spread across <strong>five days</strong> · no cramming</div></div>
      </div>
    </div>
  );
}

// ============================================================
// Tertiary: backwards-mapped skeleton timeline
// ============================================================

function TertiarySkeleton({ brief, allBriefs, lit = (s) => s }) {
  // Build milestones from the active brief's rubric bands when possible;
  // fall back to a five-stage default keyed off the wordCountGoal.
  const target = brief.wordCountGoal || 2000;
  const briefName = brief.title || 'Assessment';
  const milestones = [
    { state: 'done',   when: 'Wk 1 · Mon', name: 'Brief decoded into rubric bands',                                  from: `Two rubric bands extracted from ${briefName}`,            marks: 0 },
    { state: 'done',   when: 'Wk 2 · Wed', name: 'Search strategy locked',                                          from: 'Keywords + Boolean string saved into the Grounding Drive', marks: 0 },
    { state: 'active', when: 'Wk 3 · Fri', name: `Foundation paragraph (${Math.round(target * 0.25)} w)`,            from: 'Frame the disagreement, name the pillars',                 marks: 4 },
    { state: 'next',   when: 'Wk 4 · Tue', name: 'Core synthesis · weigh competing claims',                          from: 'The synthesis band wants positions weighed, not catalogued', marks: Math.max(8, Math.round((brief.weight || 25) / 2)) },
    { state: 'next',   when: 'Wk 5 · Thu', name: 'Polish · resolve open questions, refs',                            from: 'Marker reads the close before deciding the band',           marks: 6 },
    { state: 'next',   when: brief.dueDate ? `Due · ${brief.dueDate}` : 'Wk 6 · Fri', name: 'Submission + integrity report export', from: 'Verified human authorship · thinking history attached', marks: 3 }
  ];
  return (
    <div data-fade>
      <div className="skeleton-track">
        <div className="skeleton-line" />
        {milestones.map((m, i) => (
          <div className="skel-row" key={i} data-state={m.state}>
            <div className="skel-pip" />
            <div className="skel-card">
              <div>
                <div className="skel-when">{m.when}</div>
                <div className="skel-name">{m.name}</div>
                <div className="skel-from">{m.from}</div>
              </div>
              {m.marks > 0 && (
                <div className="skel-marks">{m.marks}<small>marks</small></div>
              )}
            </div>
          </div>
        ))}
      </div>
      {allBriefs.length > 1 && (
        <div className="row3" style={{ marginTop: 18 }}>
          <div className="field"><div className="field-label">SEMESTER LOAD</div><div className="field-val"><strong>{allBriefs.length}</strong> graded artefacts</div></div>
          <div className="field"><div className="field-label">TOTAL WEIGHT</div><div className="field-val"><strong>{allBriefs.reduce((s, b) => s + (parseInt(String(b.weight || '0').match(/\d+/)?.[0] || 0, 10)), 0)}%</strong> mapped</div></div>
          <div className="field"><div className="field-label">NEXT DEADLINE</div><div className="field-val">{allBriefs.find(b => b.dueDate)?.dueDate || 'Pending extraction'}</div></div>
        </div>
      )}
      <div className="row3" style={{ marginTop: 18 }}>
        <div className="field"><div className="field-label">JARGON STATUS</div><div className="field-val"><strong>Stripped</strong> · marker language preserved, scaffold language plain</div></div>
        <div className="field"><div className="field-label">DIRECTION</div><div className="field-val">Backwards-mapped from <strong>submission</strong> to today</div></div>
        <div className="field"><div className="field-label">COGNITIVE LOAD</div><div className="field-val">One milestone visible at a time when <strong>Zen Mode</strong> is on</div></div>
      </div>
    </div>
  );
}

// ============================================================
// AURA HUD (right rail)
// ============================================================

function AuraHud({ tier, brief }) {
  const wt = parseInt(String(brief.weight || '0').match(/\d+/)?.[0] || 0, 10);
  const messages = {
    primary:   { tag: 'AURA · NEAR YOU',  text: `Nice work on Level 1. When you finish Level 2 I will tell you a tiny joke. No pressure though, take your time.` },
    secondary: { tag: 'AURA · BESIDE YOU', text: `You have ticked off the first two. The next one is a skim, not a grind. Twenty minutes max, then we stop.` },
    tertiary:  { tag: 'AURA · GROUNDED',   text: `Foundation paragraph is your highest-leverage move this week. It locks the rubric bands before you commit to Core.` }
  };
  const stats = {
    primary:   [['XP TODAY', '15', true],          ['LEVEL',     'Apprentice',  false], ['SESSION', '12 min', false], ['STREAK', '3 days', true]],
    secondary: [['TASKS DONE', '2 of 5', true],    ['FOCUS WINDOW', 'Evenings', false], ['NEXT NUDGE', '20:00', false], ['LANG', 'en-AU', false]],
    tertiary:  [['WEIGHT', `${wt}%`, true],        ['SECTION HEALTH', 'Building', false], ['DEADLINE', brief.dueDate || 'TBD', false], ['INTEGRITY', 'VERIFIED', true]]
  };
  const m = messages[tier];
  return (
    <aside className="hud">
      <div className="hud-head">
        <div className="hud-orb" />
        <div className="hud-id">
          <div className="hud-name">AURA</div>
          <div className="hud-role">{tier.toUpperCase()} · COMPANION</div>
        </div>
      </div>
      <div className="hud-state">
        {stats[tier].map(([l, v, em], i) => (
          <div className="hud-stat" key={i}>
            <span className="hud-stat-label">{l}</span>
            <span className={'hud-stat-val' + (em ? ' is-emerald' : '')}>{v}</span>
          </div>
        ))}
      </div>
      <div className="hud-msg">
        <span className="tag">{m.tag}</span>
        {m.text}
      </div>
      <div className="hud-toggles">
        <Toggle initial title="Zen Mode"          sub="Hide everything except the current task" />
        <Toggle initial title="Low-Stim Theme"    sub="Dark, soft contrast, no whites" />
        <Toggle              title="Voice Companion" sub="en-AU · warm tone, never urgent" />
        <Toggle              title="Dynamic Spacing" sub="Auto line-height for reading-heavy docs" />
      </div>
    </aside>
  );
}

function Toggle({ title, sub, initial = false }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="toggle-row">
      <div className="text">{title}<small>{sub}</small></div>
      <button className="tg" data-on={on} onClick={() => setOn((v) => !v)} />
    </div>
  );
}

// ============================================================
// Top-level Scaffolder (overlay)
// ============================================================

export default function Scaffolder({ onClose }) {
  const { activeCourse, profile, stream } = useProject();
  // Layer 4 LiteralMode wiring. When the active stream defaults to
  // literal mode (primary, secondary, homeschool) every text surface
  // in the Scaffolder runs through the transformer. The transformer
  // is render-time only; it never sees rubric data and never invents
  // content (Blueprint hard rule).
  const lit = (text) => shouldLiteralise(stream?.profile, profile?.literalModeEnabled) ? literalise(text) : text;
  const briefs = activeCourse?.extractionData?.assessmentBriefs || [];
  // Use the focused sprint's brief if any, else the first available, else
  // a placeholder so the overlay still renders.
  const defaultBrief = activeCourse?.activeAssessmentBrief
    || briefs[0]
    || { title: 'No assessment loaded', weight: '', wordCountGoal: 0, dueDate: '' };

  const [tier, setTier] = useState(() => tierFromLevel(profile?.level));
  const Render = tier === 'primary' ? PrimaryQuest : tier === 'secondary' ? SecondaryCheckList : TertiarySkeleton;
  const meta = TIERS.find((t) => t.id === tier);

  const briefBlock = `${(defaultBrief.title || '').toUpperCase()}${activeCourse?.name ? ' · ' + activeCourse.name : ''}
${defaultBrief.wordCountGoal ? `Target ${defaultBrief.wordCountGoal.toLocaleString()} words.` : 'Submission requirements per the syllabus.'}
${defaultBrief.weight ? `Weighting ${defaultBrief.weight}.` : ''}${defaultBrief.dueDate ? ` Due ${defaultBrief.dueDate}.` : ''}
Marked across rubric bands extracted from your uploaded brief.`;

  return (
    <div className="scaffolder-root">
      <div className="bar">
        <div className="bar-mark">S</div>
        <div>
          <div className="bar-eyebrow">SIMPLIFII-OS · SOVEREIGN OVERLAY</div>
          <div className="bar-title">Sovereign Scaffolder · Tiered Support Engine</div>
        </div>
        <div className="bar-spacer" />
        <div className="bar-meta">
          <span><strong>UDL 3.0</strong> · ALIGNED</span>
          <span>EN-AU</span>
          <span>NEURO-CALM</span>
          <button onClick={onClose} className="tier-tab" style={{ minWidth: 0, padding: '8px 14px', cursor: 'pointer' }}>Exit</button>
        </div>
      </div>

      <div className="stage">
        <div className="head">
          <div>
            <div className="head-eyebrow"><span className="pulse" />ONE BRIEF · THREE BRAINS · THREE SCAFFOLDS</div>
            <h1>Same homework, translated for the brain in front of it.</h1>
            <p>Drop any assessment in. The Sovereign Scaffolder strips the cognitive friction, then re-renders the work as a quest, a checklist, or a skeleton timeline depending on the learner's tier. The original portal stays untouched. The scaffold lives here.</p>
          </div>
          <div className="intake">
            <div className="intake-label">
              <span>SOURCE INTAKE</span>
              <span className="src">Captured · {activeCourse?.name ? activeCourse.name.slice(0, 32) : 'Local'}</span>
            </div>
            <div className="intake-text">{briefBlock}</div>
          </div>
        </div>

        <div className="tiers">
          {TIERS.map((t) => (
            <button
              key={t.id}
              className="tier-tab"
              data-active={t.id === tier}
              onClick={() => setTier(t.id)}
            >
              <span className="tier-glyph">{t.glyph}</span>
              <div className="tier-text">
                <div className="tier-name">{t.name} <small>{t.short}</small></div>
                <div className="tier-focus">{t.focus} · {t.sub}</div>
              </div>
              <span className="tier-num">TIER {t.num}</span>
            </button>
          ))}
        </div>

        <div className="workbench">
          <section className="scaffold" key={tier}>
            <div className="scaffold-head">
              <div>
                <div className="label">RENDERED FOR · {meta.name.toUpperCase()} · {meta.short.toUpperCase()}</div>
                <div className="title">{meta.sub}</div>
              </div>
              <div className="right">SUPPORT-ENGINE.JS · v0.4</div>
            </div>
            <div className="scaffold-body">
              <Render brief={defaultBrief} allBriefs={briefs} lit={lit} />
            </div>
          </section>

          <AuraHud tier={tier} brief={defaultBrief} />
        </div>

        <div className="foot-note">
          <strong>Sovereign Overlay model.</strong>  The school's portal stays where it is. Simplifii captures the brief via PDF or paste, runs it through the Support Engine, and re-renders the work in the tier the student needs. No login required for the underlying LMS. The student keeps their original submission flow; the scaffolding lives on top.
        </div>
      </div>
    </div>
  );
}
