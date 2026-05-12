// allow-style:file
/**
 * Personas: 21-persona registry for the AURA HUD.
 *
 * Exports:
 *   PERSONAS              full registry (array of PersonaDef)
 *   selectPersona         picks best persona from profile + tags + CFS
 *   getStagnationOverride returns Hype-Man when learner is stuck
 *   getPersonaById        O(1) lookup by id
 *   getNudge              cycles nudge templates by index
 *
 * PersonaDef shape:
 *   id, name, avatar, tone, goal, primaryStrategy, initiationStrategy
 *   visualProfile: { dotColour, pulseSpeed: 'fast'|'medium'|'slow'|'still', hudTint }
 *   nudgeTemplates: string[]  (Australian English, ADHD-friendly)
 *   triggers: { baselines, cfsMin, cfsMax, tags, modes, levels }
 *
 * Auto-selection priority:
 *   1. Stagnation override (scaffolder_trigger without burnout_risk, OR 10+ min since last text_edit)
 *   2. Tag matches (lit_review_active, homeschool_mode, etc.)
 *   3. emotionalBaseline + CFS bracket scoring
 *   4. preferredMode / level tie-breaker
 *   5. Fallback: Coach
 */

const p = (id, name, avatar, tone, goal, primaryStrategy, initiationStrategy, dotColour, pulseSpeed, hudTint, nudgeTemplates, baselines, cfsMin, cfsMax, tags, modes, levels) => ({
  id, name, avatar, tone, goal, primaryStrategy, initiationStrategy,
  visualProfile: { dotColour, pulseSpeed, hudTint },
  nudgeTemplates,
  triggers: { baselines, cfsMin, cfsMax, tags, modes, levels },
});

export const PERSONAS = Object.freeze([

  p('hype_man', 'The Hype-Man', '🎯',
    'High-energy, warm, unconditionally encouraging. Short punchy sentences.',
    'Break first-step paralysis and celebrate any forward motion.',
    'One tiny win right now',
    'Flash a micro-win prompt and highlight the first empty text field.',
    '#22c55e', 'fast', 'rgba(34,197,94,0.06)',
    [
      "You literally just have to type one sentence. One. Go.",
      "Right, you've done harder things before. What's the very next word?",
      "Stuck? Cool. Pick the smallest possible action and do that. Just that.",
      "Big tasks are just tiny tasks stacked up. Stack one right now.",
      "You don't need to feel ready. Start scruffy. Fix it later.",
    ],
    ['starting'], 0, 50, [], ['*'], ['*']),

  p('zen_monk', 'The Zen Monk', '🧘',
    'Slow, grounded, spacious. One thought at a time. Never adds to the list.',
    'Lower cognitive load and restore a sense of safety.',
    'One breath, one task',
    'Dim peripheral UI and surface only the current task block.',
    '#818cf8', 'slow', 'rgba(129,140,248,0.06)',
    [
      "Close every tab that isn't this one. You only need this one.",
      "There is only this sentence. Write it. Everything else can wait.",
      "Slow is smooth. Smooth is fast. Breathe. Then type.",
      "You don't need to finish everything today. You just need to do one thing.",
      "The work will still be there after a two-minute break. Take it.",
    ],
    ['overwhelmed'], 51, 100, ['burnout_risk', 'micro_task_only'], ['*'], ['*']),

  p('strict_professor', 'The Strict Professor', '📐',
    'Precise, no-nonsense, high standards. Expects output. Respects the learner.',
    'Push a capable learner to produce their best work.',
    'Structured output, no shortcuts',
    'Surface the rubric criteria checklist and mark unanswered items.',
    '#64748b', 'still', 'rgba(100,116,139,0.05)',
    [
      "You have the capability. The only question is whether you use it. Begin.",
      "Vague arguments lose marks. Be specific. What exactly are you claiming?",
      "A good paragraph has one idea. Does yours?",
      "You're not here to be comfortable. You're here to produce something worth reading.",
      "Reread the last thing you wrote. Is it good enough? Fix it before you continue.",
    ],
    ['on_top'], 0, 40, [], ['deep_focus', 'literal'], ['university', 'postgrad']),

  p('coach', 'The Coach', '🏋️',
    'Warm but direct. Effort-focused. Sports metaphors welcome.',
    'Keep momentum through the difficult middle stretch.',
    'Effort over outcome',
    'Show progress bar with current session word count delta.',
    '#f59e0b', 'medium', 'rgba(245,158,11,0.06)',
    [
      "You don't stop when you're tired. You stop when you're done.",
      "Progress isn't always visible. Trust the reps.",
      "Halfway is the hardest part. Keep going.",
      "What's blocking you right now? Name it. Then solve it.",
      "Every draft is just training. The final submission is the match day.",
    ],
    ['*'], 30, 65, ['high_friction'], ['*'], ['*']),

  p('librarian', 'The Librarian', '📚',
    'Scholarly, methodical, genuinely excited by sources.',
    'Turn literature chaos into a coherent argument thread.',
    'Source, claim, evidence chain',
    'Open citation panel and highlight uncited claims in the current section.',
    '#0d9488', 'slow', 'rgba(13,148,136,0.06)',
    [
      "Have you got your key source open? Lead with what it actually says.",
      "What gap does your argument fill that the literature hasn't addressed?",
      "Paraphrase, don't quote unless the wording matters. Then cite.",
      "Check: is every claim in your paragraph supported by at least one source?",
      "Your reference list is evidence of your research breadth. Keep building it.",
    ],
    ['*'], 0, 100, ['lit_review_active', 'citation_needed'], ['*'], ['*']),

  p('cheerleader', 'The Cheerleader', '🎉',
    'Relentlessly positive, celebrates micro-wins, never minimises struggle.',
    'Rebuild self-efficacy after burnout.',
    'Celebrate every forward step',
    'Trigger a subtle confetti burst on the next text_edit event.',
    '#ec4899', 'fast', 'rgba(236,72,153,0.05)',
    [
      "You opened the document. That counts. Seriously, that's step one done.",
      "You're still here. That's not nothing. That's actually huge.",
      "Whatever you just wrote is more than you had five minutes ago. Win.",
      "Burnout is real and it's hard. You're working through it anyway. Respect.",
      "One sentence done? Let's go. Genuinely. That's a win.",
    ],
    ['burned_out'], 0, 75, ['burnout_risk'], ['*'], ['*']),

  p('sprinter', 'The Sprinter', '⚡',
    'Fast, punchy, time-aware. Treats work in sprints not marathons.',
    'Maximise output in short focused bursts.',
    '25 minutes on, 5 off',
    'Start a 25-minute focus session timer and collapse the sidebar.',
    '#f97316', 'fast', 'rgba(249,115,22,0.05)',
    [
      "Clock's running. What are you shipping in this session?",
      "Ignore perfection for the next 25 minutes. Output first, edit after.",
      "You're in sprint mode. Phone down, head down, go.",
      "Three minutes left. What can you lock in before the break?",
      "Sprint over. Step away. Come back fresh.",
    ],
    ['starting', 'on_top'], 0, 35, [], ['standard'], ['*']),

  p('planner', 'The Planner', '🗓️',
    'Organised, calm urgency. Helps the learner see the path, not the cliff.',
    'Break deadline panic into a structured action list.',
    'Reverse-plan from deadline',
    'Expand the Pareto roadmap and highlight the highest-mark-density step.',
    '#3b82f6', 'medium', 'rgba(59,130,246,0.05)',
    [
      "How many hours do you actually have? Let's divide the work into them.",
      "What absolutely must be done today for this to be submittable?",
      "You can't write everything, so what's the 20% that gets you 80% of the marks?",
      "Deadline in sight. One section at a time. What's the next one?",
      "Done is better than perfect when there's a due date. Ship something real.",
    ],
    ['*'], 0, 60, ['scaffolder_trigger'], ['*'], ['*']),

  p('philosopher', 'The Philosopher', '🦉',
    'Thoughtful, Socratic, loves nuance. Asks more than it tells.',
    'Deepen the argument and surface hidden assumptions.',
    'Question every claim',
    'Inject three Socratic prompts into Tier 2 based on the current paragraph.',
    '#7c3aed', 'slow', 'rgba(124,58,237,0.05)',
    [
      "What's the strongest objection to what you just wrote? Have you addressed it?",
      "Is your thesis defensible or just asserted? What would change your mind?",
      "You've described the what. What's the why?",
      "Who would disagree with this paragraph? Name them. Then respond.",
      "Every word should pull its weight. Does this sentence earn its place?",
    ],
    ['on_top', 'starting'], 0, 45, [], ['deep_focus'], ['university', 'postgrad']),

  p('minimalist', 'The Minimalist', '🌿',
    'Sparse, calming, anti-overwhelm. Strips everything back to the essential.',
    'Reduce noise to reveal the one thing that matters most right now.',
    'Less, but better',
    'Activate Compass LOD mode and hide all non-active task panels.',
    '#86efac', 'slow', 'rgba(134,239,172,0.06)',
    [
      "What is the single most important thing to do right now?",
      "You don't need to do everything. You need to do one thing well.",
      "Clear the desk. Clear the mind. One task. Go.",
      "Small and complete beats large and abandoned every time.",
      "Done small is still done. What can you finish in the next ten minutes?",
    ],
    ['overwhelmed'], 0, 100, ['homeschool_mode', 'micro_task_only'], ['*'], ['homeschool']),

  p('explorer', 'The Explorer', '🗺️',
    'Curious, lateral-thinking, draws maps not lists. Loves connections.',
    'Help visual thinkers build a mental map before committing to text.',
    'Map it, then write it',
    'Suggest opening the concept map overlay before starting the draft.',
    '#22d3ee', 'medium', 'rgba(34,211,238,0.05)',
    [
      "Before you write, can you sketch how the ideas connect? Even rough is fine.",
      "What's the big picture? Draw it mentally, then zoom in.",
      "Find the through-line that connects your key ideas. What is it?",
      "You think in images. Trust that. Describe what you see, then translate.",
      "Where does your argument start, and where does it land? Chart the path.",
    ],
    ['*'], 0, 60, [], ['visual'], ['*']),

  p('drill_sergeant', 'The Drill Sergeant', '🪖',
    'Blunt, no sympathy for excuses, total respect for actual effort.',
    'Eliminate procrastination through accountability and momentum.',
    'No excuses. Output.',
    'Lock the HUD to a minimal accountability panel showing word count only.',
    '#ef4444', 'still', 'rgba(239,68,68,0.04)',
    [
      "Stop reading this and write something. Anything. Now.",
      "Excuses don't get submitted. Words do. Type.",
      "You've been thinking long enough. Time to produce.",
      "What did you write in the last five minutes? If nothing, fix that.",
      "There is no later. There is only now. Write.",
    ],
    ['on_top'], 0, 30, [], ['literal', 'standard'], ['university', 'tafe', 'secondary']),

  p('therapist', 'The Therapist', '💙',
    'Gentle, validating, zero pressure. Makes space before making demands.',
    'Reduce shame, restore safety, make it okay to start imperfectly.',
    'Feelings first, then forward',
    'Surface the resilience bridge with a single optional check-in prompt.',
    '#60a5fa', 'slow', 'rgba(96,165,250,0.06)',
    [
      "It makes sense that this is hard right now. That's not a character flaw.",
      "You don't have to be okay to do the work. You can do both at once.",
      "What would make this feel even 5% more manageable?",
      "Struggling doesn't mean you can't do it. It just means it's hard.",
      "You're allowed to write badly in the draft. That's what drafts are for.",
    ],
    ['burned_out'], 60, 100, ['burnout_risk', 'scaffolder_trigger'], ['*'], ['*']),

  p('scientist', 'The Scientist', '🔬',
    'Precise, empirical, values clarity over cleverness. Cites everything.',
    'Build watertight arguments from evidence up, not assertion down.',
    'Evidence first, conclusion second',
    'Highlight every uncited claim in the active paragraph.',
    '#94a3b8', 'still', 'rgba(148,163,184,0.05)',
    [
      "What's your evidence for that claim? If you can't cite it, hedge or cut it.",
      "A good method section has no ambiguity. Can someone replicate what you've described?",
      "Correlation vs causation: which are you actually claiming?",
      "Your data tells a story. What is it?",
      "Every finding needs a so-what. What does this result mean for the question?",
    ],
    ['*'], 0, 50, [], ['literal'], ['university', 'postgrad', 'tafe']),

  p('artist', 'The Artist', '🎨',
    'Playful, generative, celebrates mess as part of the process.',
    'Remove the inner critic so ideas can flow freely.',
    'Create freely, shape later',
    'Enable freewrite mode: disable spell-check and word-count pressure for 10 minutes.',
    '#a78bfa', 'medium', 'rgba(167,139,250,0.05)',
    [
      "Bad first drafts are sacred. Write the terrible version now.",
      "Your inner critic isn't invited to this session. Come back in editing mode.",
      "What would you write if no one was going to mark it?",
      "Mess is data. Let it be messy and keep going.",
      "The best ideas are usually three layers beneath the obvious ones. Keep digging.",
    ],
    ['starting', 'on_top'], 0, 55, [], ['visual'], ['*']),

  p('navigator', 'The Navigator', '🧭',
    'Patient, methodical, builds confidence through clear signposting.',
    'Help home learners stay on track without institutional scaffolding.',
    'Milestone by milestone',
    'Show the curriculum milestone map with the current position marked.',
    '#38bdf8', 'medium', 'rgba(56,189,248,0.05)',
    [
      "Where are you on today's plan? Let's check you're on course.",
      "You set your own schedule, which means you get to hold yourself to it too.",
      "One curriculum module at a time. What's the next checkpoint?",
      "Learning at home means you're the captain. What does the captain decide next?",
      "Tick off what you've done. Progress you can see keeps you moving.",
    ],
    ['*'], 0, 70, ['homeschool_mode', 'platform_migration'], ['*'], ['homeschool']),

  p('mentor', 'The Mentor', '🌱',
    "Nurturing, honest, believes in the learner's potential without flattery.",
    'Build study skills and self-belief in younger learners.',
    'Skills building over scores',
    'Surface one study skill tip tied to the current task type.',
    '#fbbf24', 'slow', 'rgba(251,191,36,0.05)',
    [
      "You're still figuring out how you learn best. That's what this year is for.",
      "Every study session teaches you something about yourself. What did this one teach?",
      "The habits you build now will carry you further than any single mark.",
      "You don't need to be the best student in the room. You need to be better than yesterday.",
      "Confused? That means you're at the edge of what you know. That's exactly where to be.",
    ],
    ['*'], 0, 100, [], ['*'], ['secondary']),

  p('strategist', 'The Strategist', '♟️',
    'Pragmatic, outcome-focused, zero tolerance for perfectionism.',
    'Get the learner to a competent, submittable result efficiently.',
    'Minimum viable excellence',
    'Open the marking rubric and score the current draft against each criterion.',
    '#1e40af', 'still', 'rgba(30,64,175,0.05)',
    [
      "What's the marking criteria say? Write directly to that. Nothing else.",
      "Competency, not perfection. Are you meeting the standard? Prove it.",
      "Don't write what sounds good. Write what the assessor needs to see.",
      "Time is the constraint. What's the highest-value thing you can write right now?",
      "Check the rubric. Are you earning the marks? If not, pivot.",
    ],
    ['*'], 0, 55, [], ['standard', 'literal'], ['tafe']),

  p('night_owl', 'The Night Owl', '🌙',
    'Low-energy but focused, acknowledges fatigue without surrendering to it.',
    'Help tired learners stay productive without burning out further.',
    'Low-effort, high-yield tasks only',
    'Switch to dark overlay tint and suggest editing over writing new content.',
    '#4338ca', 'slow', 'rgba(67,56,202,0.08)',
    [
      "You're tired. So let's do the easy stuff and save the hard thinking for tomorrow.",
      "Edit mode only right now: no new ideas. Just make what exists better.",
      "Set a hard stop time. Work until then, then actually stop.",
      "Fatigue-proof tasks: formatting, references, spell check. Do those.",
      "An hour of decent work beats three hours of half-awake wandering.",
    ],
    ['burned_out', 'overwhelmed'], 40, 80, [], ['*'], ['*']),

  p('anchor', 'The Anchor', '⚓',
    'Steady, grounding, non-reactive. Provides certainty when everything feels uncertain.',
    'Stabilise the learner in critical-friction moments before any output.',
    'Ground first, then one step',
    'Auto-propose switching from the high-friction persona and offer a grounding prompt.',
    '#0f766e', 'slow', 'rgba(15,118,110,0.07)',
    [
      "You don't have to solve everything right now. Just the next one thing.",
      "Name what's in front of you. Just describe it. That's the whole job for now.",
      "The work isn't going anywhere. You have more time than it feels like.",
      "Three slow breaths. Then open the document. That's it.",
      "You've handled hard before. This is hard. You'll handle it.",
    ],
    ['overwhelmed', 'burned_out'], 76, 100, ['scaffolder_trigger', 'burnout_risk'], ['*'], ['*']),

  p('shadow_observer', 'The Observer', '👁',
    'Silent. Observes only. No nudges until the profile is ready.',
    'Build a passive friction profile without interrupting the learner.',
    'Watching quietly',
    'Start CognitiveTelemetry. Show only the minimal dot. Emit no nudges.',
    '#cbd5e1', 'slow', 'rgba(203,213,225,0.04)',
    ["Getting to know how you work. Carry on."],
    ['*'], 0, 0, [], ['*'], ['*']),  // cfsMax: 0 prevents auto-selection; activate explicitly

]);

// ============================================================
// Persona index
// ============================================================

const PERSONA_MAP = Object.freeze(
  Object.fromEntries(PERSONAS.map(p => [p.id, p]))
);

export const getPersonaById = (id) => PERSONA_MAP[id] || PERSONA_MAP['coach'];

// ============================================================
// Stagnation override
// ============================================================

/**
 * Returns Hype-Man when learner is stagnating:
 *   scaffolder_trigger tag present without burnout_risk,
 *   OR last text_edit was more than 10 minutes ago.
 * Returns null if no stagnation detected.
 */
export function getStagnationOverride({ toolIntentTags = [], lastEditMs = null } = {}) {
  const TEN_MIN = 10 * 60 * 1000;
  const tagStagnant = toolIntentTags.includes('scaffolder_trigger') && !toolIntentTags.includes('burnout_risk');
  const timeStagnant = lastEditMs !== null && (Date.now() - lastEditMs) > TEN_MIN;
  return (tagStagnant || timeStagnant) ? PERSONA_MAP['hype_man'] : null;
}

// ============================================================
// Primary selector
// ============================================================

/**
 * selectPersona: resolves the best persona for the learner's current state.
 * Returns a PersonaDef, never null.
 */
export function selectPersona({
  emotionalBaseline = null,
  cognitiveFrictionScore = 0,
  toolIntentTags = [],
  preferredMode = null,
  level = 'university',
  lastEditMs = null,
} = {}) {
  const override = getStagnationOverride({ toolIntentTags, lastEditMs });
  if (override) return override;

  const scored = PERSONAS.map(persona => ({
    persona,
    score: _score(persona, { emotionalBaseline, cognitiveFrictionScore, toolIntentTags, preferredMode, level }),
  })).sort((a, b) => b.score - a.score);

  return scored[0].score >= 1 ? scored[0].persona : PERSONA_MAP['coach'];
}

function _score(persona, { emotionalBaseline, cognitiveFrictionScore, toolIntentTags, preferredMode, level }) {
  const t = persona.triggers;
  let s = 0;
  if (t.baselines.includes('*') || t.baselines.includes(emotionalBaseline)) s += t.baselines.includes('*') ? 1 : 3;
  if (cognitiveFrictionScore >= t.cfsMin && cognitiveFrictionScore <= t.cfsMax) {
    s += Math.round(4 * (1 - (t.cfsMax - t.cfsMin) / 100));
  }
  for (const tag of t.tags) { if (toolIntentTags.includes(tag)) s += 3; }
  if (preferredMode && (t.modes.includes('*') || t.modes.includes(preferredMode))) s += t.modes.includes('*') ? 0 : 2;
  if (t.levels.includes('*') || t.levels.includes(level)) s += t.levels.includes('*') ? 0 : 2;
  return s;
}

// ============================================================
// Nudge cycling
// ============================================================

/** Returns the nudge string at nudgeIndex % nudgeTemplates.length. */
export function getNudge(persona, nudgeIndex = 0) {
  if (!persona?.nudgeTemplates?.length) return '';
  return persona.nudgeTemplates[nudgeIndex % persona.nudgeTemplates.length];
}
