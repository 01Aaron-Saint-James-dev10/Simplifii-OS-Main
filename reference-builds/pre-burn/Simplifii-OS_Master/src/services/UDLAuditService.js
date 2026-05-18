/**
 * UDLAuditService: Simplifii Audit Engine
 *
 * Scans raw curriculum text against the CAST UDL 3.0 (2024) barrier registry
 * and AHEAD Ireland compliance checklist defined in UDL_3_0_SPEC.md.
 *
 * Language rule: barriers are reported as curriculum failures, never as
 * student deficits. This is the social model of disability applied to
 * audit output. (UDL 3.0 Part 8.4)
 *
 * Exports:
 *   auditCurriculum(text)
 *     Returns AuditResult:
 *       barriers[]         array of detected BarrierHit objects
 *       barrierCount       integer
 *       criticalCount      integer
 *       highCount          integer
 *       frictionScore      float 0.0-1.0 (proportion of max possible barriers)
 *       systemicExclusions string[]  human-readable descriptions for UDL report
 *       teacherNotes       string[]  remediation notes for .sm front matter
 *       aheadCompliant     bool
 *       udl3Score          integer 0-100 (100 = zero barriers)
 *
 *   UDL_BARRIER_REGISTRY   the full barrier pattern array (exported for testing)
 */

// ============================================================
// Barrier Registry
// ============================================================

export const UDL_BARRIER_REGISTRY = Object.freeze([

  {
    id: 'fixed_time',
    principle: 'action_expression',
    checkpoint: '9.2',
    severity: 'critical',
    pattern: /\b(in \d+\s*minutes?|you have \d+\s*(min|hour)|time limit|timed (assessment|task|exam)|within \d+\s*(min|hour|second))\b/i,
    description: 'Fixed-time constraint present without an accommodation note.',
    remedy: 'Add: "Additional time is available on request. Contact your educator before the assessment."',
    teacherNote: 'CHECKPOINT 9.2 (CRITICAL): Fixed-time tasks are the most common legal accessibility risk in AU/Irish HE. Add a reasonable adjustment statement.',
  },

  {
    id: 'single_expression',
    principle: 'action_expression',
    checkpoint: '8.1',
    severity: 'critical',
    pattern: /\b(write (a|an) ([\w-]+ )*essay|essay only|written submission only|must be (submitted|written)|hand[- ]?written response)\b/i,
    description: 'Single expression format mandated with no alternatives provided.',
    remedy: 'Offer alternatives: written response, annotated diagram, concept map, recorded explanation, or structured bullet list.',
    teacherNote: 'CHECKPOINT 8.1 (CRITICAL): AHEAD Ireland requires at minimum two distinct output modalities for any assessed task.',
  },

  {
    id: 'no_success_criteria',
    principle: 'action_expression',
    checkpoint: '9.1',
    severity: 'critical',
    pattern: /^(?!.*\b(marking criteria|success looks like|you will be assessed|learning outcome|rubric|grade descriptor)\b)/i,
    description: 'No explicit success criteria, rubric reference, or "what good looks like" statement detected.',
    remedy: 'Add: "Success looks like: [describe what a strong response includes, tied to the marking rubric]."',
    teacherNote: 'CHECKPOINT 9.1 (CRITICAL): Without explicit success criteria, executive function load is entirely on the student. This disproportionately disadvantages ADHD and anxiety presentations.',
    globalCheck: true, // checked once against full text, not per-line
  },

  {
    id: 'competitive_framing',
    principle: 'engagement',
    checkpoint: '1.3',
    severity: 'critical',
    pattern: /\b(top students?|best students?|high[- ]?achieving|rank(ed|ing)|compared to (your|other) (peers?|classmates?)|outperform)\b/i,
    description: 'Competitive or comparative framing detected. Positions learning as a race rather than individual development.',
    remedy: 'Replace with mastery framing: "The goal is to demonstrate your own understanding and development."',
    teacherNote: 'CHECKPOINT 1.3 (CRITICAL): Competitive framing is documented to suppress participation in students with anxiety, imposter syndrome, and marginalised identities. Replace with mastery language.',
  },

  {
    id: 'deficit_framing',
    principle: 'engagement',
    checkpoint: '3.1',
    severity: 'critical',
    pattern: /\b(students? who struggle|weak students?|poor performance|inability to|failing to|lack(s|ing) the ability|low[- ]ability)\b/i,
    description: 'Deficit framing language detected. Describes students by their limitations rather than their variability.',
    remedy: 'Replace with: "Students who are still developing familiarity with X" or "Students building confidence in Y."',
    teacherNote: 'CHECKPOINT 3.1 (CRITICAL): Deficit framing is the most documented harm in inclusive education literature. UDL 3.0 Part 8.4 mandates social-model language throughout.',
  },

  {
    id: 'assumed_knowledge',
    principle: 'representation',
    checkpoint: '6.1',
    severity: 'high',
    pattern: /\b(as you (know|recall|remember|are aware)|you will (recall|remember|know)|obviously|clearly|of course|it (goes without saying|is (obvious|clear))|by now you)\b/i,
    description: 'Assumed prior knowledge detected. Treats background knowledge as universal.',
    remedy: 'Replace with: "Building on what you have covered in [prior unit]..." or activate knowledge explicitly: "Before we begin, what do you already know about X?"',
    teacherNote: 'CHECKPOINT 6.1 (HIGH): Assumed knowledge is a systemic barrier for first-generation students, EAL learners, and students with working memory variability.',
  },

  {
    id: 'no_objectives',
    principle: 'engagement',
    checkpoint: '2.1',
    severity: 'high',
    pattern: /^(?!.*\b(by the end|learning (objective|outcome|goal)|students? will|you will be able to|aim(s?) of)\b)/i,
    description: 'No explicit learning objectives detected.',
    remedy: 'Add 2-4 learning objectives beginning with "By the end of this lesson, you will be able to..."',
    teacherNote: 'CHECKPOINT 2.1 (HIGH): Without explicit objectives, students cannot self-regulate their learning or know when they have achieved the goal.',
    globalCheck: true,
  },

  {
    id: 'undefined_jargon',
    principle: 'representation',
    checkpoint: '5.1',
    severity: 'high',
    densityCheck: true, // flagged when jargon density exceeds threshold
    description: 'High density of undefined discipline-specific terms detected.',
    remedy: 'Define each new term at first use or link to a glossary. AHEAD standard: no more than 8 undefined terms per 500 words.',
    teacherNote: 'CHECKPOINT 5.1 (HIGH): Undefined jargon is the primary barrier for EAL students and students with language-processing differences.',
  },

  {
    id: 'wall_of_text',
    principle: 'representation',
    checkpoint: '6.3',
    severity: 'high',
    densityCheck: true,
    description: 'Document lacks structural signposting: no headings, bullet points, or visual chunking detected.',
    remedy: 'Break content into headed sections. Add bullet points for lists of items. Aim for no more than 5 sentences per visual block.',
    teacherNote: 'CHECKPOINT 6.3 (HIGH): Wall-of-text formatting disproportionately affects students with ADHD, dyslexia, and visual processing differences.',
  },

  {
    id: 'no_step_breakdown',
    principle: 'action_expression',
    checkpoint: '9.2',
    severity: 'high',
    pattern: /^(?!.*\b(step \d|first[,\s]|then[,\s]|next[,\s]|finally[,\s]|\d+\.\s+\w))/i,
    description: 'Task instructions provided without numbered step-by-step breakdown.',
    remedy: 'Break the task into numbered steps. Include the AHEAD Plan-Do-Monitor-Reflect scaffold for assessed work.',
    teacherNote: 'CHECKPOINT 9.2 (HIGH): Without step breakdown, task initiation and sequencing (core executive functions) are entirely on the student.',
    globalCheck: true,
  },

  {
    id: 'no_monitor_prompt',
    principle: 'action_expression',
    checkpoint: '9.4',
    severity: 'high',
    pattern: /^(?!.*\b(check your progress|are you on track|halfway|pause and reflect|monitor|self[- ]?check|review your work so far)\b)/i,
    description: 'No progress monitoring or mid-task self-check prompt detected.',
    remedy: 'Add: "Pause at the halfway point: are you on track? What do you need to adjust?"',
    teacherNote: 'CHECKPOINT 9.4 (HIGH): AHEAD Ireland Action and Expression scaffold requires a Monitor step for all assessed tasks at university level and above.',
    globalCheck: true,
  },

  {
    id: 'no_plan_prompt',
    principle: 'action_expression',
    checkpoint: '9.2',
    severity: 'high',
    pattern: /^(?!.*\b(before you (begin|start)|plan your|list the steps|outline your approach|what is your strategy)\b)/i,
    description: 'No planning or strategy prompt at task initiation.',
    remedy: 'Add: "Before you begin, list the steps you plan to take to complete this task."',
    teacherNote: 'CHECKPOINT 9.2 (HIGH): AHEAD Ireland PDMR scaffold requires an explicit Plan step. This is the single highest-impact change for students with ADHD.',
    globalCheck: true,
  },

  {
    id: 'sensory_specific',
    principle: 'representation',
    checkpoint: '4.3',
    severity: 'high',
    pattern: /\b(look at (the|this)|as you can see|listen to|hear (the|this)|watch (the|this) (diagram|video|graph|image|figure))\b/i,
    description: 'Sensory-specific instruction without text or auditory alternative.',
    remedy: 'Add text description for all visual content: "The diagram above shows [description]."',
    teacherNote: 'CHECKPOINT 4.3 (HIGH): Sensory-specific instructions create barriers for students with visual impairments and for all students when technology fails.',
  },

  {
    id: 'no_choice',
    principle: 'engagement',
    checkpoint: '1.1',
    severity: 'high',
    pattern: /^(?!.*\b(you (can|may) choose|options?( include| are| available)|alternative(s?)|your choice|select (one|an|the) (of|from))\b)/i,
    description: 'No dimension of learner choice offered in the task.',
    remedy: 'Offer at least one choice dimension: topic, format, timeline, audience, or response length.',
    teacherNote: 'CHECKPOINT 1.1 (HIGH): Structured choice is evidence-based for increasing intrinsic motivation and reducing task avoidance in ADHD presentations.',
    globalCheck: true,
  },

  {
    id: 'no_self_regulation',
    principle: 'engagement',
    checkpoint: '3.3',
    severity: 'medium',
    pattern: /^(?!.*\b(rate your (confidence|understanding)|how (confident|clear) are you|reflect on|what worked|what would you change|self[- ]?assess)\b)/i,
    description: 'No self-assessment or reflection prompt detected.',
    remedy: 'Add: "After completing this task, rate your confidence (1-5) and note one thing you would do differently next time."',
    teacherNote: 'CHECKPOINT 3.3 (MEDIUM): Self-regulation prompts are the primary mechanism for building metacognition across multiple sessions.',
    globalCheck: true,
  },

  {
    id: 'no_transfer_prompt',
    principle: 'representation',
    checkpoint: '6.4',
    severity: 'medium',
    pattern: /^(?!.*\b(apply (this|these)|real[- ]?world|in your (own life|community|practice|profession)|how might you use|where (else|do) you see)\b)/i,
    description: 'No transfer or real-world application prompt detected.',
    remedy: 'Add: "Where might you encounter this in your own life or professional practice?"',
    teacherNote: 'CHECKPOINT 6.4 (MEDIUM): Transfer prompts are critical for students who struggle with generalisation. They also increase motivation by establishing personal relevance.',
    globalCheck: true,
  },

  {
    id: 'no_joy_play',
    principle: 'engagement',
    checkpoint: '1.2',
    severity: 'medium',
    pattern: /^(?!.*\b(what (surprises|interests|fascinates) you|try (this|exploring)|without worrying|curiosity|what if|explore|play with)\b)/i,
    description: 'No exploratory or curiosity-based language. UDL 3.0 (2024) recognises Joy and Play as evidence-based engagement mechanisms.',
    remedy: 'Add one exploratory prompt: "What surprises you about this topic?" or "Try this without worrying about being right yet."',
    teacherNote: 'CHECKPOINT 1.2 (MEDIUM): UDL 3.0 Part 8.2 : Joy and Play reduce cognitive anxiety and improve working memory load. At least one low-stakes exploration moment per lesson.',
    globalCheck: true,
  },

  {
    id: 'no_belonging_cue',
    principle: 'engagement',
    checkpoint: '1.2',
    severity: 'medium',
    pattern: /^(?!.*\b(in your (community|culture|experience|context|country)|from your (perspective|background)|who you are|your (identity|story))\b)/i,
    description: 'No belonging or identity cue. UDL 3.0 (2024) names Belonging as a prerequisite for sustained engagement.',
    remedy: 'Add one identity-connecting prompt: "How does this topic connect to your own community or experience?"',
    teacherNote: 'CHECKPOINT 1.2 (MEDIUM): UDL 3.0 Part 8.1 : Belonging is prerequisite for learning. Curriculum that never connects to the learner\'s identity signals that they are not the intended audience.',
    globalCheck: true,
  },

  {
    id: 'text_only',
    principle: 'representation',
    checkpoint: '5.5',
    severity: 'medium',
    pattern: /^(?!.*\b(diagram|figure|image|table|video|audio|illustration|visual|chart|graph)\b)/i,
    description: 'Text-only content with no reference to visual, audio, or diagram alternatives.',
    remedy: 'Add at least one non-text representation: a diagram, table, visual summary, or link to an audio/video equivalent.',
    teacherNote: 'CHECKPOINT 5.5 (MEDIUM): Text-only curriculum systematically disadvantages visual learners and students with text-processing differences.',
    globalCheck: true,
  },

]);

// ============================================================
// Audit Engine
// ============================================================

const JARGON_DENSITY_THRESHOLD = 8; // undefined terms per 500 words
const HEADING_DENSITY_MINIMUM  = 0.02; // headings should be >=2% of lines

/**
 * auditCurriculum
 *
 * @param {string} text  Raw curriculum text (from PDF extraction or paste)
 * @returns {AuditResult}
 */
export function auditCurriculum(text) {
  if (!text || text.trim().length === 0) {
    return _emptyResult();
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');
  const wordCount = fullText.split(/\s+/).length;

  const barriers = [];

  for (const barrier of UDL_BARRIER_REGISTRY) {
    if (barrier.densityCheck) {
      const hit = _checkDensity(barrier, lines, fullText, wordCount);
      if (hit) barriers.push(hit);
      continue;
    }

    if (barrier.globalCheck) {
      if (barrier.pattern && !barrier.pattern.test(fullText)) {
        barriers.push(_makeHit(barrier, null));
      }
      continue;
    }

    if (barrier.pattern) {
      const matchingLines = lines.filter(l => barrier.pattern.test(l));
      if (matchingLines.length > 0) {
        barriers.push(_makeHit(barrier, matchingLines[0]));
      }
    }
  }

  const criticalCount = barriers.filter(b => b.severity === 'critical').length;
  const highCount     = barriers.filter(b => b.severity === 'high').length;
  const maxPossible   = UDL_BARRIER_REGISTRY.length;
  const frictionScore = Math.round((barriers.length / maxPossible) * 100) / 100;
  const udl3Score     = Math.round((1 - frictionScore) * 100);
  const aheadCompliant = criticalCount === 0 && highCount === 0;

  const systemicExclusions = barriers.map(b =>
    `${b.severity.toUpperCase()} (Checkpoint ${b.checkpoint}): ${b.description}`
  );

  const teacherNotes = barriers.map(b => b.teacherNote).filter(Boolean);

  return {
    barriers,
    barrierCount: barriers.length,
    criticalCount,
    highCount,
    frictionScore,
    udl3Score,
    aheadCompliant,
    systemicExclusions,
    teacherNotes,
  };
}

// ============================================================
// Internal helpers
// ============================================================

function _checkDensity(barrier, lines, fullText, wordCount) {
  if (barrier.id === 'undefined_jargon') {
    const jargonPattern = /\b[A-Z][a-z]{4,}\b/g;
    const capitalisedTerms = new Set(fullText.match(jargonPattern) || []);
    const density = (capitalisedTerms.size / wordCount) * 500;
    if (density > JARGON_DENSITY_THRESHOLD) {
      return _makeHit(barrier, `${Math.round(density)} capitalised terms per 500 words (threshold: ${JARGON_DENSITY_THRESHOLD})`);
    }
    return null;
  }
  if (barrier.id === 'wall_of_text') {
    const headingCount = lines.filter(l => /^#+\s/.test(l)).length;
    const bulletCount  = lines.filter(l => /^[-*•]/.test(l)).length;
    const structureDensity = (headingCount + bulletCount) / lines.length;
    if (structureDensity < HEADING_DENSITY_MINIMUM) {
      return _makeHit(barrier, `Structure density: ${(structureDensity * 100).toFixed(1)}% (minimum: ${HEADING_DENSITY_MINIMUM * 100}%)`);
    }
    return null;
  }
  return null;
}

function _makeHit(barrier, context) {
  return {
    id:          barrier.id,
    principle:   barrier.principle,
    checkpoint:  barrier.checkpoint,
    severity:    barrier.severity,
    description: barrier.description,
    remedy:      barrier.remedy,
    teacherNote: barrier.teacherNote,
    context:     context || null,
  };
}

function _emptyResult() {
  return {
    barriers: [], barrierCount: 0, criticalCount: 0, highCount: 0,
    frictionScore: 0, udl3Score: 100, aheadCompliant: true,
    systemicExclusions: [], teacherNotes: [],
  };
}
