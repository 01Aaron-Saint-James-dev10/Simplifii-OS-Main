import { TierParameters } from './TierParameters';

export const mapToWorkspace = (text, level = 'Tertiary') => {
  const lowerText = (text || '').toLowerCase();
  const isMiniLitReview = lowerText.includes('mini literature review') || lowerText.includes('literature review');
  
  if (level === 'Tertiary') {
    return [
      { id: 1, type: 'Informative Title', content: '', targetWords: 50, placeholder: 'What specific reaction or organism are you analyzing?' },
      { id: 2, type: 'Introduction & Context', content: '', targetWords: 300, placeholder: 'What is the broad scientific context? What specific gap in knowledge does your thesis address?' },
      { id: 3, type: 'Primary Article 1 Summary', content: '', targetWords: 350, placeholder: 'What method did the authors use? What were the specific statistical findings?' },
      { id: 4, type: 'Primary Article 2 Summary', content: '', targetWords: 350, placeholder: 'How does this article\'s methodology compare to the first? Does it confirm or challenge the findings?' },
      { id: 5, type: 'Review Article Synthesis', content: '', targetWords: 400, placeholder: 'What is the consensus between these sources? How do they collectively support your thesis?' },
      { id: 6, type: 'Conclusion & Future Directions', content: '', targetWords: 200, placeholder: 'What is the ultimate takeaway? What future research is needed to resolve remaining gaps?' },
      { id: 7, type: 'Research Process Documentation', content: '', targetWords: 400, placeholder: 'Which databases did you search? Why were these specific articles chosen over others?' }
    ];
  }

  if (level === 'Undergrad') {
    return [
      { id: 1, type: 'Introduction', content: '', targetWords: 300, placeholder: 'Start your introduction...', keyQuestions: [], commonMistakes: [] },
      { id: 2, type: 'Main Body', content: '', targetWords: 1400, placeholder: 'Build your main arguments...', keyQuestions: [], commonMistakes: [] },
      { id: 3, type: 'Conclusion', content: '', targetWords: 300, placeholder: 'Summarise your findings...', keyQuestions: [], commonMistakes: [] }
    ];
  }
  
  if (level === 'Honours') {
    return [
      { id: 1, type: 'Literature Review', content: '', targetWords: 1500, placeholder: 'Review the literature...', keyQuestions: [], commonMistakes: [] },
      { id: 2, type: 'Methodology', content: '', targetWords: 1000, placeholder: 'Detail your methodology...', keyQuestions: [], commonMistakes: [] },
      { id: 3, type: 'Results & Discussion', content: '', targetWords: 2000, placeholder: 'Present results and discuss...', keyQuestions: [], commonMistakes: [] }
    ];
  }
  
  if (level === 'PhD') {
    return [
      { id: 1, type: 'Grant Proposal', content: '', targetWords: 2000, placeholder: 'Write your grant proposal...', keyQuestions: [], commonMistakes: [] },
      { id: 2, type: 'Chapter 1: Context', content: '', targetWords: 5000, placeholder: 'Establish the deep context...', keyQuestions: [], commonMistakes: [] }
    ];
  }
  return [];
};

export const extractDynamicThemes = (text) => {
  const stopWords = ['This', 'That', 'With', 'From', 'Have', 'They', 'Your', 'What', 'When', 'Where', 'University', 'Student', 'Assignment', 'Assessment', 'Course'];
  const matches = text.match(/\b([A-Z][a-z]{4,})\b/g) || [];
  const counts = {};
  matches.forEach(w => {
    if (!stopWords.includes(w)) {
      counts[w] = (counts[w] || 0) + 1;
    }
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
  return sorted.length > 0 ? sorted.join(', ') : 'General Studies';
};

export const extractEvidenceFormula = (text, level = 'tertiary') => {
  const formula = [];
  
  if (level.toLowerCase() !== 'tertiary') {
    return [{ type: 'generic', count: 1, label: 'Academic Source' }];
  }

  const lowerText = text.toLowerCase();
  
  // Simulated ConstraintLogic engine: Quantity + Entity
  const primaryMatch = lowerText.match(/(?:need|require|find|use)?\s*(\d+|one|two|three|four|five)\s+(?:primary|peer-reviewed|empirical)\s+(?:articles?|sources?|papers?)/i);
  const reviewMatch = lowerText.match(/(?:need|require|find|use)?\s*(\d+|one|two|three|four|five)\s+(?:review|secondary)\s+(?:articles?|sources?|papers?)/i);
  const policyMatch = lowerText.match(/(?:need|require|find|use)?\s*(\d+|one|two|three|four|five)\s+(?:policy|systemic|audit)\s+(?:documents?|reports?)/i);

  const wordToNum = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10 };
  
  if (primaryMatch) {
    const num = isNaN(parseInt(primaryMatch[1])) ? wordToNum[primaryMatch[1].toLowerCase()] : parseInt(primaryMatch[1]);
    if (num) formula.push({ type: 'primary', count: num, label: 'Primary Research Article' });
  }

  if (reviewMatch) {
    const num = isNaN(parseInt(reviewMatch[1])) ? wordToNum[reviewMatch[1].toLowerCase()] : parseInt(reviewMatch[1]);
    if (num) formula.push({ type: 'review', count: num, label: 'Review Article' });
  }

  if (policyMatch) {
    const num = isNaN(parseInt(policyMatch[1])) ? wordToNum[policyMatch[1].toLowerCase()] : parseInt(policyMatch[1]);
    if (num) formula.push({ type: 'policy', count: num, label: 'Policy Document' });
  }
  
  const genericMatch = lowerText.match(/(?:need|require|find|use|minimum of|at least)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:sources?|references?|articles?|texts?|documents?)/i);
  if (formula.length === 0 && genericMatch) {
    const num = isNaN(parseInt(genericMatch[1])) ? wordToNum[genericMatch[1].toLowerCase()] : parseInt(genericMatch[1]);
    if (num) formula.push({ type: 'generic', count: num, label: 'Academic Source' });
  }

  // If entirely empty (no matches), default to 1 generic source
  if (formula.length === 0) {
    formula.push({ type: 'generic', count: 1, label: 'Academic Source' });
  }

  return formula;
};

export const detectAcademicTier = (text) => {
  const lower = (text || '').toLowerCase();
  
  // Lab Tier: Methodology, experimental, procedural, laboratory
  if (/\blab\b|\blaboratory\b|\bexperiment\b|\bmethodology\b|\bprocedure\b|\bresults\b|\bscientific\b/.test(lower)) {
    return 'Lab';
  }
  
  // Research Tier: Literature review, thesis, academic, scholarly, citation
  if (/\bliterature review\b|\bresearch\b|\bthesis\b|\bdissertation\b|\bscholarly\b|\bjournal\b|\bcitation\b/.test(lower)) {
    return 'Research';
  }
  
  // Practical Tier: Portfolio, clinical, placement, studio, creative, workshop
  if (/\bportfolio\b|\bpractical\b|\bclinical\b|\bplacement\b|\bstudio\b|\bcreative\b|\bworkshop\b|\bperformance\b/.test(lower)) {
    return 'Practical';
  }
  
  return 'General';
};

export const extractDeepCourseData = (text) => {
  const lowerText = text.toLowerCase();
  
  let detectedLevel = 'tertiary'; // Default
  if (lowerText.match(/master|postgraduate|tertiary/)) {
    detectedLevel = 'tertiary';
  } else if (lowerText.match(/year 10|high school|hsc|secondary/)) {
    detectedLevel = 'secondary';
  } else if (lowerText.match(/tafe|certificate|diploma/)) {
    detectedLevel = 'tafe';
  } else if (lowerText.match(/primary school|year 5|year 6/)) {
    detectedLevel = 'primary';
  } else if (lowerText.match(/unsw|university|babs1201|tertiary/)) {
    detectedLevel = 'tertiary';
  }
  
  const tier = TierParameters[detectedLevel] || TierParameters['tertiary'] || TierParameters['Undergrad'];
  
  // Bounded LO regex. Previous version captured [A-Za-z0-9\s,]+ which is
  // greedy and unbounded, so a CLO heading would absorb every following
  // word until a non-alphanumeric char like a full stop or paren. The
  // result was learning outcome fragments stretching across paragraphs.
  // Now: capture must start with a capital letter, runs 10 to 240 chars,
  // and stops at the first sentence boundary.
  const loRegex = /(?:LO|Outcome|CLO)\s*\d+\s*[:\-]?\s*([A-Z][A-Za-z0-9 ,'&/\-]{10,240}?)(?=[.;\n]|\s*$)/g;
  const learningOutcomes = [...text.matchAll(loRegex)]
    .map(m => m[1].trim().replace(/\s+/g, ' '))
    .filter(lo => lo.length >= 10);

  // Normalise pdfjs multi-space output for all downstream matching.
  const normText = text.replace(/\s+/g, ' ');

  // Referencing style detection. Word-boundary matches to avoid false
  // positives (e.g. "capable" matching "apa"). Returns null when no
  // style is detected, not a fake default.
  const REF_STYLES = [
    { re: /\bAPA\s*(?:7th|7|6th|6)?\b/i, name: 'APA' },
    { re: /\bHarvard\b/i, name: 'Harvard' },
    { re: /\bAGLC\b/i, name: 'AGLC' },
    { re: /\bChicago\b/i, name: 'Chicago' },
    { re: /\bVancouver\b/i, name: 'Vancouver' },
    { re: /\bMLA\s*(?:9th|9|8th|8)?\b/i, name: 'MLA' },
    { re: /\bIEEE\b/i, name: 'IEEE' },
    { re: /\bOxford\b/i, name: 'Oxford' },
  ];
  let referencingStyle = null;
  for (const { re, name } of REF_STYLES) {
    if (re.test(normText)) { referencingStyle = name; break; }
  }

  // Rubric detection: AU uni grade bands + descriptive bands + numeric bands.
  // Case-insensitive. Detects presence even if individual criteria cannot be parsed.
  const RUBRIC_BAND_RE = /\b(?:high\s+distinction|distinction|credit|pass|fail|satisfactory|unsatisfactory|excellent|very\s+good|not\s+completed|band\s+[1-7]|level\s+[1-7])\b/gi;
  const RUBRIC_HEADER_RE = /\b(?:marking\s+criteria|rubric|assessment\s+criteria|grading\s+criteria|performance\s+standard)\b/i;
  const rubricBands = [...new Set((normText.match(RUBRIC_BAND_RE) || []).map(b => b.trim().replace(/\s+/g, ' ')))];
  const rubricDetected = rubricBands.length >= 2 || RUBRIC_HEADER_RE.test(normText);
  // Extract criteria text following rubric header patterns
  const rubricCriteriaRe = /(?:High Distinction|Distinction|Excellent|Marking Criteria|Assessment Criteria|Rubric|Criteria)[:\-]?\s*([A-Za-z0-9 ,'&/\-]{5,200}?)(?=[.;\n]|$)/gi;
  const rubricCriteria = [...new Set([...normText.matchAll(rubricCriteriaRe)].map(m => m[1].trim()))].filter(c => c.length >= 5);

  const tierData = {};
  if (tier && tier.heuristics) {
    for (const [key, regex] of Object.entries(tier.heuristics)) {
      const globalRegex = new RegExp(regex, 'g');
      const matches = [...text.matchAll(globalRegex)].map(m => m[1]?.trim()).filter(Boolean);
      if (matches.length > 0) tierData[key] = matches;
    }
  }

  const evidenceFormula = extractEvidenceFormula(text, detectedLevel);

  // Extract dynamic word count
  const wordCountMatch = lowerText.match(/(\d+(?:,\d{3})?)\s*(?:words|word count|-word)/i);
  const words = wordCountMatch ? parseInt(wordCountMatch[1].replace(/,/g, '')) : 2000;

  // Extract weighting
  const weightingMatch = lowerText.match(/(\d{1,3})\s*%(?:\s*weighting)?/i) || lowerText.match(/weighting[:\s]*(\d{1,3})\s*%/i);
  const weighting = weightingMatch ? parseInt(weightingMatch[1]) : 0;

  // Assessment dates. Returns richer objects: { raw, parsed (Date|null), type }
  const DATE_PATTERNS = [
    // "Due 17th October 2025", "deadline 1st March 2026", "submission by 3rd Feb 2025"
    // Month name required (Jan-Dec) to avoid matching "25 WEEK" style noise.
    { re: /(?:due|deadline|submission|submit)\s*(?:on|by|date)?[:\-]?\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+\d{2,4})?)/gi, type: 'absolute' },
    // "Due Date: 17/10/2025", "deadline 12-05-2026", "due 1.3.2025"
    { re: /(?:due|deadline|submission|submit)\s*(?:on|by|date)?[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi, type: 'absolute' },
    // "Friday Week 5", "due Week 7", "submission Week 10"
    { re: /(?:due|deadline|submission|submit)\s*(?:on|by|date)?[:\-]?\s*((?:[A-Z][a-z]+day\s+)?Week\s+\d{1,2})/gi, type: 'week' },
    // Standalone "Week 7: 27 October" near assessment context
    { re: /Week\s+\d{1,2}\s*[:\-]\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+\d{2,4})?)/gi, type: 'absolute' },
  ];
  const MONTH_MAP = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const parseExtractedDate = (raw) => {
    const s = raw.replace(/\s+/g, ' ').trim();
    // Try dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
    const slashMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (slashMatch) {
      const y = slashMatch[3].length === 2 ? 2000 + parseInt(slashMatch[3], 10) : parseInt(slashMatch[3], 10);
      return new Date(y, parseInt(slashMatch[2], 10) - 1, parseInt(slashMatch[1], 10));
    }
    // Try "17th October 2025", "1 March", "3rd Feb 2026"
    const nameMatch = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{2,4}))?$/);
    if (nameMatch) {
      const mon = MONTH_MAP[nameMatch[2].toLowerCase().slice(0, 3)];
      if (mon !== undefined) {
        const y = nameMatch[3] ? (nameMatch[3].length === 2 ? 2000 + parseInt(nameMatch[3], 10) : parseInt(nameMatch[3], 10)) : new Date().getFullYear();
        return new Date(y, mon, parseInt(nameMatch[1], 10));
      }
    }
    return null;
  };
  const dateSet = new Set();
  const assessmentDates = [];
  for (const { re, type } of DATE_PATTERNS) {
    re.lastIndex = 0;
    for (const m of normText.matchAll(re)) {
      const raw = m[1].trim();
      if (dateSet.has(raw.toLowerCase())) continue;
      dateSet.add(raw.toLowerCase());
      assessmentDates.push({ raw, parsed: parseExtractedDate(raw), type });
    }
  }
  // Sort absolute dates chronologically; week refs stay in extraction order
  assessmentDates.sort((a, b) => {
    if (a.parsed && b.parsed) return a.parsed - b.parsed;
    if (a.parsed) return -1;
    if (b.parsed) return 1;
    return 0;
  });

  // UDL requirements: capture phrases tied to UDL principles or guidelines
  const udlRegex = /UDL\s*(?:\d+(?:\.\d+)?)?\s*[:\-]?\s*([A-Za-z][^.;\n]{5,160})/gi;
  const udlRequirements = [...new Set([...text.matchAll(udlRegex)].map(m => m[1].trim()))].slice(0, 10);

  // UDL 3.0 principle detection. Looks for the three networks in the text and
  // suggests overrides the cockpit can pre-enable for the student.
  const udlPrincipleSignals = {
    engagement: /\bengagement\b|\bself[-\s]?regulation\b|\baffective\b|\bsustain(?:ing)?\s+effort\b/i,
    representation: /\brepresentation\b|\brecognition\b|\bperception\b|\bcomprehension\b|\blanguage\s*&\s*symbols\b/i,
    action_expression: /\baction\s*(?:&|and)\s*expression\b|\bstrategic\b|\bphysical\s*action\b|\bexecutive\s*function\b/i
  };
  const udlPrinciples = Object.entries(udlPrincipleSignals)
    .filter(([, regex]) => regex.test(text))
    .map(([principle]) => principle);

  // Suggest cockpit overrides per detected principle. The student can accept
  // or override; this is just a hint surface, not a hard switch.
  const udlSuggestions = [];
  if (udlPrinciples.includes('representation')) udlSuggestions.push('bionicReading', 'overlayTint:cream');
  if (udlPrinciples.includes('action_expression')) udlSuggestions.push('viewAsSpeech', 'literalMode');
  if (udlPrinciples.includes('engagement')) udlSuggestions.push('zenMode', 'readingRuler');

  const academicTier = detectAcademicTier(text);

  // Extract Assessment Titles. The student cares about what is actually
  // graded, not the abstract Learning Outcomes. We look for several
  // syllabus patterns common across Australian universities:
  //   "Assessment 1: Lab Report"      "Assessment Task 2 - Essay"
  //   "Task 1: Reflective Journal"    "AT1 Critical Review"
  //   Lines beginning with "Final Exam" or "Mid-semester Test"
  // We capture the title (40 chars max) plus any percentage weighting that
  // sits within the same logical line, so the DoD reads as
  //   "Assessment 1: Lab Report (25%)"
  // Two-pass extraction. Real syllabi format assessments in many ways:
  //
  //   "Assessment 1: Lab Report (25%)"      single-line, colon separator
  //   "Task 2 - Reflective Journal, 15%"    single-line, dash separator
  //   "Assessment 1                          multi-line, no separator
  //    Literature Review
  //    Length: 1500 words
  //    Weighting: 5%"
  //   "Final Exam (50%)"                     no numbering, named exam only
  //
  // Pass 1 (numbered): find every 'Assessment N' / 'Task N' / 'AT N'
  // anchor, then peek the next 200 chars for the title and the
  // weighting independently. The block-and-extract approach handles
  // both single-line and multi-line layouts without needing the title
  // to share a line with the digit.
  //
  // Pass 2 (named): match named exams (Final Exam, Lab Report, etc.)
  // ONLY when a percentage sits within 80 chars, so a lecture-schedule
  // mention of 'Literature Review' as a topic word stays out.
  //
  // Both passes apply NAV_NOISE (LMS navigation copy) and GENERIC_NOISE
  // (single-token rubric / table headers) filters before adding.

  const NAV_NOISE = /\b(moodle|canvas|blackboard|hub|portal|click(?: here)?|see (?:the|your|moodle|canvas)|more details|further information|via the link|the link below|see\s*\w*\s*for|url)\b/i;
  const GENERIC_NOISE = /^(item|structure|details|overview|description|length|information|topics|tasks|lecture|content|brief|outline|rubric|page|section|figure|notes|comments|criteria|requirement|requirements|delivery mode|due date|weight|weighting|format|submission)$/i;
  const isAssessmentNoise = (title) => NAV_NOISE.test(title) || GENERIC_NOISE.test(title.trim());

  const seen = new Set();
  const assessmentTitles = [];

  // Pass 1: numbered anchors with 200-char block lookahead.
  const anchorRegex = /(?:Assessment(?:\s+Task)?|Task|AT)\s*(\d+)/gi;
  for (const anchor of text.matchAll(anchorRegex)) {
    const start = anchor.index + anchor[0].length;
    const block = text.slice(start, start + 220);
    // First capitalised phrase after the anchor, stopping at any
    // structural punctuation, hyphen, em-dash, or weighting marker.
    const titleMatch = block.match(/[\s:\-\u2014\n]+([A-Z][A-Za-z0-9 '&/\-]{3,50}?)(?=[,;.\-\u2014\n]|\s+(?:due|weighting|worth|deadline|length|word\s+count|\(?\d{1,3}\s*%)|\s*$)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim().replace(/\s+/g, ' ');
    if (title.length < 4) continue;
    if (isAssessmentNoise(title)) continue;
    const weightMatch = block.match(/(\d{1,3})\s*%/);
    const display = weightMatch ? `${title} (${weightMatch[1]}%)` : title;
    const key = display.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    assessmentTitles.push(display);
  }

  // Pass 2: named exams that have a percentage within 80 chars.
  const examLineRegex = /\b(Final Exam|Mid-?semester Exam|Mid-?term Exam|Final Assessment|Take-home Exam|Oral Presentation|Practical Exam|Lab Report\s*\d*|Reflective Journal|Literature Review|Annotated Bibliography|Portfolio|Research Proposal|Research Report|Critical Review|Essay)\b[^\n]{0,80}?(\d{1,3})\s*%/gi;
  for (const m of text.matchAll(examLineRegex)) {
    const title = m[1].replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/-Semester/i, '-semester');
    const weight = m[2] ? `${m[2]}%` : '';
    const display = weight ? `${title} (${weight})` : title;
    const key = display.toLowerCase();
    if (seen.has(key)) continue;
    if (isAssessmentNoise(title)) continue;
    seen.add(key);
    assessmentTitles.push(display);
  }

  // Build the Definition of Done checklist. Assessments only. Learning
  // Outcomes are not graded artefacts; mixing them into the DoD when no
  // assessments are extracted produced a column full of LO fragments
  // instead of work. If no assessments are found, the DoD stays empty
  // and the empty-state banner in the canvas tells the student to drop
  // a more complete syllabus.
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '').slice(0, 40) || 'item';
  const doneWhenChecklist = assessmentTitles.slice(0, 12).map((entry, i) => ({
    id: `assess_${i}_${slugify(entry)}`,
    text: entry,
    checked: false,
    triggerWord: entry.split(/\s+/).slice(0, 3).join(' ').toLowerCase()
  }));

  // UDL 3.0 score. Computed after assessmentTitles and assessmentDates are
  // built so the formula can factor in extraction completeness.
  // udlPrinciples contributes up to 75 pts (25 per detected principle).
  // Assessment count contributes up to 15 pts.
  // Due-date coverage contributes 10 pts when every assessment has a date.
  // Range: 0-100. Green >= 70, amber >= 40, red < 40.
  const _udlDateCoverage = assessmentDates.length > 0 && assessmentTitles.length > 0
    && assessmentDates.length >= assessmentTitles.length;
  const udlScore = Math.min(100,
    udlPrinciples.length * 25
    + (assessmentTitles.length >= 3 ? 15 : assessmentTitles.length > 0 ? 10 : 0)
    + (_udlDateCoverage ? 10 : 0)
  );

  // Visibility for the student. When the cockpit can extract assessments
  // and outcomes the panels light up; when it cannot, this trace shows
  // exactly what the syllabus surfaced so we can iterate on the regex
  // rather than guessing in the dark.
  if (typeof console !== 'undefined') {
    console.info('[BriefService] extraction summary', {
      detectedLevel,
      learningOutcomes: learningOutcomes.length,
      assessmentTitles: assessmentTitles.length,
      assessmentTitlesPreview: assessmentTitles.slice(0, 5),
      learningOutcomesPreview: learningOutcomes.slice(0, 3),
      rawTextChars: text.length
    });
  }

  return {
    learningOutcomes,
    assessmentTitles,
    referencingStyle,
    rubricCriteria,
    rubricDetected,
    rubricBands,
    evidenceFormula,
    tierData,
    detectedLevel,
    academicTier,
    words,
    weighting,
    assessmentDates,
    udlRequirements,
    udlPrinciples,
    udlSuggestions,
    udlScore,
    doneWhenChecklist,
    term: detectTerm(text),
    theme: 'Molecules'
  };
};

// Merge two extraction snapshots so a student can drop multiple PDFs into the
// same course (e.g. Unit Outline + Assessment Brief + Marking Rubric) and the
// cockpit treats them as one consolidated brief. Arrays are unioned by value
// or by id where applicable; scalars take the higher-fidelity value.
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
    // Dates are objects { raw, parsed, type }; handle legacy string entries too
    const key = typeof item === 'string' ? item.trim().toLowerCase() : (item.raw || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Detect academic term/semester from document text.
 * @param {string} text - raw PDF text
 * @returns {{ year: number, code: string, label: string, detected: true } | null}
 */
export const detectTerm = (text) => {
  const norm = text.replace(/\s+/g, ' ');
  const TERM_PATTERNS = [
    // "Term 1, 2026" / "Term 1 2026" / "T1 2026" / "T1/2026"
    { re: /\bTerm\s+([1-3])\s*[,\/]?\s*(\d{4})\b/i, map: (m) => ({ code: `T${m[1]}`, year: parseInt(m[2], 10) }) },
    { re: /\bT([1-3])\s*[,\/]?\s*(\d{4})\b/, map: (m) => ({ code: `T${m[1]}`, year: parseInt(m[2], 10) }) },
    // "Trimester 2, 2025" / "Trimester 2 2025"
    { re: /\bTrimester\s+([1-3])\s*[,\/]?\s*(\d{4})\b/i, map: (m) => ({ code: `T${m[1]}`, year: parseInt(m[2], 10) }) },
    // "Semester 1, 2026" / "Semester 1 2026" / "S1 2026" / "S1/2026"
    { re: /\bSemester\s+([1-2])\s*[,\/]?\s*(\d{4})\b/i, map: (m) => ({ code: `S${m[1]}`, year: parseInt(m[2], 10) }) },
    { re: /\bS([1-2])\s*[,\/]?\s*(\d{4})\b/, map: (m) => ({ code: `S${m[1]}`, year: parseInt(m[2], 10) }) },
    // "Session 1, 2026" (Macquarie style)
    { re: /\bSession\s+([1-3])\s*[,\/]?\s*(\d{4})\b/i, map: (m) => ({ code: `S${m[1]}`, year: parseInt(m[2], 10) }) },
    // "Summer Term 2025" / "Winter Term 2025"
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
  // Fallback: term and year appear as separate fields (e.g. "Term : Term 3" + "Year : 2025")
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
  // Fallback: standalone year only
  if (separateYearMatch) {
    return { year: parseInt(separateYearMatch[1], 10), code: null, label: String(separateYearMatch[1]), detected: false };
  }
  return null;
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
    term: (next.term && next.term.detected ? next.term : null) || (prev.term && prev.term.detected ? prev.term : null) || next.term || prev.term,
    detectedLevel: next.detectedLevel || prev.detectedLevel,
    rawText: [prev.rawText, next.rawText].filter(Boolean).join('\n\n')
  };
};

// Pareto-ranked micro-tasks for known assessment types. Each step is
// ordered by mark density so the student tackles the highest-yield
// action first.
const PARETO_STEPS = {
  'literature review': [
    { label: 'Lock Topic & Align to 2 Course Themes', weight: '2/25 marks', rank: 1 },
    { label: 'Find Narrative Review & Seminal Primaries', weight: '5/25 marks', rank: 2 },
    { label: 'Document Search Process (Replicable)', weight: '4/25 marks', rank: 3 },
    { label: 'Define Differences (Primary vs Secondary)', weight: '4/25 marks', rank: 4 },
    { label: 'Find the Socratic Disagreement/Hook', weight: 'Critical Analysis', rank: 5 }
  ]
};

// Resolve Pareto steps for the current task. Matches the first
// assessment title against known templates; returns null when no
// match exists so the UI can fall back to the standard roadmap.
const resolveParetoSteps = (assessmentTitle) => {
  if (!assessmentTitle) return null;
  const lower = assessmentTitle.toLowerCase();
  for (const [key, steps] of Object.entries(PARETO_STEPS)) {
    if (lower.includes(key)) return steps;
  }
  return null;
};

// Map an array of extracted assessment titles into the Semester
// Roadmap. When Pareto steps exist for the current task, they replace
// the generic 3-slot layout with a mark-density-ranked checklist.
// Returns null when titles is empty so the caller can keep the
// per-course defaults intact.
// When extraction yields more than 10 raw tasks, synthesise down to
// the top 5 milestones by keeping only titles that carry a weight
// percentage (highest first) or, failing that, the first 5 unique titles.
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
  // Drop empties, short tokens, and exact duplicates so the slots only
  // ever fill with distinct legitimate titles. With one valid title the
  // Roadmap shows just Current Task; the Next and Final slots stay
  // null and the panel rows hide entirely (LinearCanvas guards each
  // row on its own value).
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

  // Sovereign filter: cap noisy extraction to 5 milestones
  if (titles.length > 10) {
    const top5 = synthesiseMilestones(titles);
    titles.length = 0;
    titles.push(...top5);
  }

  const currentTask = titles[0] || null;
  const nextAssessment = titles.length >= 2 ? titles[1] : null;
  // Prefer 'Final' first; if no Final, take the last 'Exam' title (so a
  // Final Exam beats a Mid-semester Exam); else fall back to the last
  // title in the list when there are at least three distinct titles.
  let finalMilestone = null;
  if (titles.length >= 3) {
    finalMilestone =
      titles.find(t => /\bfinal\b/i.test(t)) ||
      [...titles].reverse().find(t => /\bexam\b/i.test(t)) ||
      titles[titles.length - 1];
  } else if (titles.length === 2) {
    // Only promote a Final-flavoured second title to the final slot.
    finalMilestone = /\bfinal\b|\bexam\b/i.test(titles[1]) ? titles[1] : null;
  }

  // Attach Pareto micro-steps when the current task matches a known type
  const paretoSteps = resolveParetoSteps(currentTask);

  // Extract total weight from the current task title if it contains a percentage.
  // Literature Review Pareto steps are anchored to a hard 25% weighting per the
  // BABS1201 course outline; override any extracted value so the badge is stable.
  let totalWeight = null;
  if (paretoSteps && currentTask && /literature review/i.test(currentTask)) {
    totalWeight = '25%';
  } else {
    const weightMatch = currentTask ? currentTask.match(/(\d+%)/) : null;
    totalWeight = weightMatch ? weightMatch[1] : null;
  }

  return { currentTask, nextAssessment, finalMilestone, paretoSteps, totalWeight };
};
