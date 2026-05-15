/**
 * BriefUtils.js
 *
 * Utility functions extracted from BriefService.js:
 *   - detectAssessmentFormat: layered format detection (keyword > structure > rubric > code hint)
 *   - detectTerm: academic term/semester detection from PDF text
 *   - mergeExtractionData: merge two extraction snapshots for multi-PDF ingestion
 *   - deriveRoadmapFromAssessments: semester roadmap from assessment titles
 *
 * Keeps BriefService.js under the 500-line limit.
 */

// ---------------------------------------------------------------------------
// Deduplication helpers
// ---------------------------------------------------------------------------

const dedupeStrings = (arr) => Array.from(new Set((arr || []).filter(Boolean).map(s => s.trim()))).filter(Boolean);

const dedupeById = (arr) => {
  const seen = new Set();
  return (arr || []).filter(item => {
    if (!item || !item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const dedupeDates = (arr) => {
  const seen = new Set();
  return (arr || []).filter(item => {
    if (!item) return false;
    const key = typeof item === 'string' ? item.trim().toLowerCase() : (item.raw || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ---------------------------------------------------------------------------
// detectAssessmentFormat
// ---------------------------------------------------------------------------

/**
 * Detect assessment format from brief text. Layered approach:
 * keyword (high) > structure (medium) > rubric (medium) > code hint (low) > fallback.
 */
export const detectAssessmentFormat = (text, courseCode) => {
  const norm = (text || '').replace(/\s+/g, ' ').toLowerCase();
  const code = (courseCode || '').toUpperCase();

  // Layer 1: keyword matching (high confidence)
  const KEYWORDS = [
    [/\blab\s*report\b|\bexperimental?\s*report\b/, 'lab_report'],
    [/\bliterature\s*review\b|\blit\s*review\b/, 'literature_review'],
    [/\bannotated\s*bibliography\b/, 'annotated_bibliography'],
    [/\bresearch\s*proposal\b|\bthesis\s*proposal\b/, 'research_proposal'],
    [/\bcase\s*study\b|\bcase\s*analysis\b/, 'case_study'],
    [/\bmoot\s*court\b|\bmooting\b/, 'moot_court'],
    [/\bsoap\s*notes?\b/, 'soap_notes'],
    [/\bcare\s*plan\b|\bnursing\s*care\b/, 'care_plan'],
    [/\bclinical\s*case\s*report\b/, 'clinical_case_report'],
    [/\bclinical\s*reasoning\b/, 'clinical_reasoning'],
    [/\bevidence[\s-]*based\s*practice\b|\bebp\b/, 'ebp_review'],
    [/\bosce\b/, 'osce_prep'],
    [/\bhealth\s*promotion\b/, 'health_promotion'],
    [/\bsystematic\s*review\b/, 'systematic_review'],
    [/\bscientific\s*poster\b|\bresearch\s*poster\b/, 'scientific_poster'],
    [/\bfield\s*study\b|\bfieldwork\b/, 'field_study'],
    [/\bethics\s*application\b|\bethics\s*approval\b/, 'ethics_application'],
    [/\bbusiness\s*plan\b/, 'business_plan'],
    [/\bpitch\s*deck\b|\bbusiness\s*pitch\b/, 'business_pitch'],
    [/\belevator\s*pitch\b|\b60\s*second\s*pitch\b|\b90\s*second\s*pitch\b/, 'pitch_elevator'],
    [/\bswot\b|\bpestle\b|\bporter['s]*\s*five\b|\bstrategic\s*analysis\b/, 'strategic_analysis'],
    [/\bmarketing\s*plan\b|\bmarketing\s*strategy\b/, 'marketing_plan'],
    [/\bfinancial\s*analysis\b|\bfinancial\s*modelling\b/, 'financial_analysis'],
    [/\bconsulting\s*report\b/, 'consulting_report'],
    [/\bexecutive\s*summary\b/, 'executive_summary'],
    [/\bboard\s*paper\b/, 'board_paper'],
    [/\bcase\s*competition\b/, 'case_competition'],
    [/\blegal\s*memo\b|\birac\b/, 'legal_memo'],
    [/\bcase\s*note\b/, 'case_note'],
    [/\bstatutory\s*interpretation\b/, 'statutory_interpretation'],
    [/\bcontract\s*drafting\b/, 'contract_drafting'],
    [/\blegal\s*advice\b|\blegal\s*opinion\b/, 'legal_advice'],
    [/\bcompliance\s*review\b/, 'compliance_review'],
    [/\bprecedent\s*comparison\b/, 'precedent_comparison'],
    [/\blesson\s*plan\b/, 'lesson_plan'],
    [/\bunit\s*of\s*work\b/, 'unit_of_work'],
    [/\bteaching\s*philosophy\b/, 'teaching_philosophy'],
    [/\baction\s*research\b/, 'action_research'],
    [/\bcurriculum\s*design\b/, 'curriculum_design'],
    [/\btechnical\s*report\b/, 'technical_report'],
    [/\bdesign\s*brief\b/, 'design_brief'],
    [/\bfailure\s*analysis\b/, 'failure_analysis'],
    [/\bclose\s*reading\b|\btextual\s*analysis\b/, 'close_reading'],
    [/\bcreative\s*(?:piece|writing)\b/, 'creative_piece'],
    [/\bscript\b|\bscreenplay\b/, 'script_screenplay'],
    [/\bexhibition\s*catalogue\b/, 'exhibition_catalogue'],
    [/\breflective\s*practice\b|\breflective\s*journal\b/, 'reflective_practice'],
    [/\bcase\s*formulation\b/, 'case_formulation'],
    [/\bintervention\s*plan\b/, 'intervention_plan'],
    [/\bethical\s*decision\b|\bethical\s*dilemma\b/, 'ethical_decision_making'],
    [/\bcounselling\s*transcript\b/, 'counselling_transcript'],
    [/\boral\s*presentation\b/, 'oral_presentation'],
    [/\bviva\s*voce\b|\bviva\b|\bthesis\s*defence\b/, 'viva_voce'],
    [/\bdebate\b/, 'debate'],
    [/\bmock\s*trial\b/, 'mock_trial'],
    [/\bmock\s*consultation\b/, 'mock_consultation'],
    [/\bteaching\s*demo\b|\bteaching\s*demonstration\b/, 'teaching_demo'],
    [/\bcomparative\s*essay\b|\bcompare\s*(?:and|&)\s*contrast\b/, 'essay_comparative'],
    [/\breflective?\s*essay\b|\breflection\b/, 'essay_reflective'],
    [/\bexpository\s*essay\b/, 'essay_expository'],
    [/\bpatient\s*case\s*study\b/, 'patient_case_study'],
    [/\bpharmacology\s*calc\b|\bdrug\s*calculation\b|\bdosage\b/, 'pharmacology_calc'],
    [/\bmethodology\s*paper\b|\bresearch\s*methodology\b/, 'methodology_paper'],
    [/\bcad\s*documentation\b|\bcad\s*drawing\b/, 'cad_documentation'],
  ];
  for (const [re, fmt] of KEYWORDS) {
    if (re.test(norm)) return { format: fmt, confidence: 'high', detectionSource: 'keyword', fallbackUsed: false };
  }

  // Layer 2: structure indicators (medium)
  if (/\bhypothesis\b.*\bmethods?\b.*\bresults?\b/s.test(norm)) return { format: 'lab_report', confidence: 'medium', detectionSource: 'structure', fallbackUsed: false };
  if (/\bsubjective\b.*\bobjective\b.*\bassessment\b.*\bplan\b/s.test(norm)) return { format: 'soap_notes', confidence: 'medium', detectionSource: 'structure', fallbackUsed: false };
  if (/\bissue\b.*\brule\b.*\bapplication\b.*\bconclusion\b/s.test(norm)) return { format: 'legal_memo', confidence: 'medium', detectionSource: 'structure', fallbackUsed: false };

  // Layer 3: rubric indicators (medium)
  if (/\bclinical\s*reasoning\b|\bpatient\s*safety\b/.test(norm)) return { format: 'clinical_reasoning', confidence: 'medium', detectionSource: 'rubric', fallbackUsed: false };
  if (/\buse\s*of\s*legal\s*authority\b|\blegal\s*reasoning\b/.test(norm)) return { format: 'legal_memo', confidence: 'medium', detectionSource: 'rubric', fallbackUsed: false };
  if (/\bpitch\s*delivery\b|\baudience\s*engagement\b/.test(norm)) return { format: 'oral_presentation', confidence: 'medium', detectionSource: 'rubric', fallbackUsed: false };

  // Layer 4: course code hints (low)
  if (/^(LAW|JUR|LLB|JURD)/.test(code)) return { format: 'legal_memo', confidence: 'low', detectionSource: 'code_hint', fallbackUsed: false };
  if (/^(MED|NUR|MID|PHAR|HEAL)/.test(code)) return { format: 'clinical_case_report', confidence: 'low', detectionSource: 'code_hint', fallbackUsed: false };
  if (/^(COMM|MGMT|MARK|FINS|ACCT|ECON)/.test(code)) return { format: 'report_general', confidence: 'low', detectionSource: 'code_hint', fallbackUsed: false };
  if (/^(ANAT|BIOC|BABS|CHEM|PHYS|BIOL)/.test(code)) return { format: 'lab_report', confidence: 'low', detectionSource: 'code_hint', fallbackUsed: false };
  if (/^(EDST|CURR|TEACH)/.test(code)) return { format: 'lesson_plan', confidence: 'low', detectionSource: 'code_hint', fallbackUsed: false };
  if (/^(MECH|CIVL|ELEC|ENGG)/.test(code)) return { format: 'technical_report', confidence: 'low', detectionSource: 'code_hint', fallbackUsed: false };
  if (/^(ARTS|ENGL|HIST|PHIL|MDIA)/.test(code)) return { format: 'close_reading', confidence: 'low', detectionSource: 'code_hint', fallbackUsed: false };
  if (/^(SOCW|PSYC|COUN)/.test(code)) return { format: 'reflective_practice', confidence: 'low', detectionSource: 'code_hint', fallbackUsed: false };

  // Layer 5: fallback
  return { format: 'essay_critical', confidence: 'low', detectionSource: 'fallback', fallbackUsed: true };
};

// ---------------------------------------------------------------------------
// detectTerm
// ---------------------------------------------------------------------------

/**
 * Detect academic term/semester from document text.
 * @param {string} text - raw PDF text
 * @returns {{ year: number, code: string, label: string, detected: true } | null}
 */
export const detectTerm = (text) => {
  const norm = text.replace(/\s+/g, ' ');
  const TERM_PATTERNS = [
    { re: /\bTerm\s+([1-3])\s*[,\/]?\s*(\d{4})\b/i, map: (m) => ({ code: `T${m[1]}`, year: parseInt(m[2], 10) }) },
    { re: /\bT([1-3])\s*[,\/]?\s*(\d{4})\b/, map: (m) => ({ code: `T${m[1]}`, year: parseInt(m[2], 10) }) },
    { re: /\bTrimester\s+([1-3])\s*[,\/]?\s*(\d{4})\b/i, map: (m) => ({ code: `T${m[1]}`, year: parseInt(m[2], 10) }) },
    { re: /\bSemester\s+([1-2])\s*[,\/]?\s*(\d{4})\b/i, map: (m) => ({ code: `S${m[1]}`, year: parseInt(m[2], 10) }) },
    { re: /\bS([1-2])\s*[,\/]?\s*(\d{4})\b/, map: (m) => ({ code: `S${m[1]}`, year: parseInt(m[2], 10) }) },
    { re: /\bSession\s+([1-3])\s*[,\/]?\s*(\d{4})\b/i, map: (m) => ({ code: `S${m[1]}`, year: parseInt(m[2], 10) }) },
    { re: /\b(Summer|Winter)\s+(?:Term|Session)?\s*(\d{4})\b/i, map: (m) => ({ code: m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase(), year: parseInt(m[2], 10) }) },
  ];
  for (const { re, map } of TERM_PATTERNS) {
    const m = norm.match(re);
    if (m) {
      const { code, year } = map(m);
      const LABELS = { T1: 'Term 1', T2: 'Term 2', T3: 'Term 3', S1: 'Semester 1', S2: 'Semester 2', Summer: 'Summer', Winter: 'Winter' };
      const label = `${LABELS[code] || code} ${year}`;
      return { year, code, label, detected: true };
    }
  }
  const separateTermMatch = norm.match(/\bTerm\s*[:\-]?\s*(?:Term\s+)?([1-3])\b/i) || norm.match(/\bTrimester\s*[:\-]?\s*(\d)\b/i);
  const separateSemMatch = norm.match(/\bSemester\s*[:\-]?\s*([1-2])\b/i);
  const separateYearMatch = norm.match(/\bYear\s*[:\-]?\s*(20[2-3]\d)\b/i) || norm.match(/\b(20[2-3]\d)\b/);
  if ((separateTermMatch || separateSemMatch) && separateYearMatch) {
    const year = parseInt(separateYearMatch[1], 10);
    if (separateTermMatch) {
      const code = `T${separateTermMatch[1]}`;
      const LABELS = { T1: 'Term 1', T2: 'Term 2', T3: 'Term 3' };
      return { year, code, label: `${LABELS[code]} ${year}`, detected: true };
    }
    if (separateSemMatch) {
      const code = `S${separateSemMatch[1]}`;
      return { year, code, label: `Semester ${separateSemMatch[1]} ${year}`, detected: true };
    }
  }
  if (separateYearMatch) {
    return { year: parseInt(separateYearMatch[1], 10), code: null, label: String(separateYearMatch[1]), detected: false };
  }
  return null;
};

// ---------------------------------------------------------------------------
// mergeExtractionData
// ---------------------------------------------------------------------------

const CONFIDENCE_ORDER = { high: 3, medium: 2, low: 1 };
const pickHigherConfidence = (a, b) => {
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  return (CONFIDENCE_ORDER[a.confidence] || 0) >= (CONFIDENCE_ORDER[b.confidence] || 0) ? a : b;
};

export const mergeExtractionData = (prev, next) => {
  if (!prev) return next;
  if (!next) return prev;
  return {
    ...prev,
    ...next,
    learningOutcomes: dedupeStrings([...(prev.learningOutcomes || []), ...(next.learningOutcomes || [])]),
    assessmentTitles: dedupeStrings([...(prev.assessmentTitles || []), ...(next.assessmentTitles || [])]),
    rubricCriteria: dedupeStrings([...(prev.rubricCriteria || []), ...(next.rubricCriteria || [])]),
    assessmentDates: dedupeDates([...(prev.assessmentDates || []), ...(next.assessmentDates || [])]),
    udlRequirements: dedupeStrings([...(prev.udlRequirements || []), ...(next.udlRequirements || [])]),
    udlPrinciples: Array.from(new Set([...(prev.udlPrinciples || []), ...(next.udlPrinciples || [])])),
    udlSuggestions: Array.from(new Set([...(prev.udlSuggestions || []), ...(next.udlSuggestions || [])])),
    evidenceFormula: [...(prev.evidenceFormula || []), ...(next.evidenceFormula || [])],
    doneWhenChecklist: dedupeById([...(prev.doneWhenChecklist || []), ...(next.doneWhenChecklist || [])]),
    words: Math.max(prev.words || 0, next.words || 0) || (prev.words || next.words),
    weighting: Math.max(prev.weighting || 0, next.weighting || 0) || (prev.weighting || next.weighting),
    rubricDetected: prev.rubricDetected || next.rubricDetected || false,
    rubricBands: Array.from(new Set([...(prev.rubricBands || []), ...(next.rubricBands || [])])),
    referencingStyle: prev.referencingStyle || next.referencingStyle,
    format: pickHigherConfidence(prev.format, next.format),
    term: (next.term && next.term.detected ? next.term : null) || (prev.term && prev.term.detected ? prev.term : null) || next.term || prev.term,
    detectedLevel: next.detectedLevel || prev.detectedLevel,
    rawText: [prev.rawText, next.rawText].filter(Boolean).join('\n\n')
  };
};

// ---------------------------------------------------------------------------
// deriveRoadmapFromAssessments
// ---------------------------------------------------------------------------

const PARETO_STEPS = {
  'literature review': [
    { label: 'Lock Topic & Align to 2 Course Themes', weight: '2/25 marks', rank: 1 },
    { label: 'Find Narrative Review & Seminal Primaries', weight: '5/25 marks', rank: 2 },
    { label: 'Document Search Process (Replicable)', weight: '4/25 marks', rank: 3 },
    { label: 'Define Differences (Primary vs Secondary)', weight: '4/25 marks', rank: 4 },
    { label: 'Find the Socratic Disagreement/Hook', weight: 'Critical Analysis', rank: 5 }
  ]
};

const resolveParetoSteps = (assessmentTitle) => {
  if (!assessmentTitle) return null;
  const lower = assessmentTitle.toLowerCase();
  for (const [key, steps] of Object.entries(PARETO_STEPS)) {
    if (lower.includes(key)) return steps;
  }
  return null;
};

const synthesiseMilestones = (titles) => {
  const weighted = titles
    .map(t => ({ title: t, pct: parseInt((t.match(/(\d+)%/) || [])[1] || '0', 10) }))
    .filter(x => x.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .map(x => x.title);
  return (weighted.length >= 5 ? weighted : titles).slice(0, 5);
};

export const deriveRoadmapFromAssessments = (assessmentTitles = []) => {
  if (!Array.isArray(assessmentTitles) || assessmentTitles.length === 0) return null;
  const seen = new Set();
  const titles = [];
  for (const t of assessmentTitles) {
    if (typeof t !== 'string') continue;
    const trimmed = t.trim();
    if (trimmed.length < 4) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    titles.push(trimmed);
  }
  if (titles.length === 0) return null;

  if (titles.length > 10) {
    const top5 = synthesiseMilestones(titles);
    titles.length = 0;
    titles.push(...top5);
  }

  const currentTask = titles[0] || null;
  const nextAssessment = titles.length >= 2 ? titles[1] : null;
  let finalMilestone = null;
  if (titles.length >= 3) {
    finalMilestone =
      titles.find(t => /\bfinal\b/i.test(t)) ||
      [...titles].reverse().find(t => /\bexam\b/i.test(t)) ||
      titles[titles.length - 1];
  } else if (titles.length === 2) {
    finalMilestone = /\bfinal\b|\bexam\b/i.test(titles[1]) ? titles[1] : null;
  }

  const paretoSteps = resolveParetoSteps(currentTask);

  let totalWeight = null;
  if (paretoSteps && currentTask && /literature review/i.test(currentTask)) {
    totalWeight = '25%';
  } else {
    const weightMatch = currentTask ? currentTask.match(/(\d+%)/) : null;
    totalWeight = weightMatch ? weightMatch[1] : null;
  }

  return { currentTask, nextAssessment, finalMilestone, paretoSteps, totalWeight };
};
