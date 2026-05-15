import { TierParameters } from './TierParameters';
import { createLogger } from '../utils/logger';

const log = createLogger('BriefService');

export const mapToWorkspace = (text, level = 'Tertiary') => {
  const lowerText = (text || '').toLowerCase();
  const isMiniLitReview = lowerText.includes('mini literature review') || lowerText.includes('literature review');
  
  if (level === 'Tertiary') {
    return [
      { id: 1, type: 'Introduction', content: '', targetWords: 300, placeholder: 'Start here. What is the context and what will you cover?' },
      { id: 2, type: 'Body Section 1', content: '', targetWords: 400, placeholder: '' },
      { id: 3, type: 'Body Section 2', content: '', targetWords: 400, placeholder: '' },
      { id: 4, type: 'Body Section 3', content: '', targetWords: 400, placeholder: '' },
      { id: 5, type: 'Conclusion', content: '', targetWords: 200, placeholder: 'Summarise your key points.' },
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
    // Standalone "15 July 2026" or "15th July 2026" (no due/deadline prefix needed)
    { re: /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4})\b/gi, type: 'absolute' },
    // Month-first: "July 15th 2026", "July 15, 2026"
    { re: /\b((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})\b/gi, type: 'absolute' },
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
    // Try month-first: "July 15th 2026", "July 15, 2026"
    const monthFirstMatch = s.match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})$/);
    if (monthFirstMatch) {
      const mon = MONTH_MAP[monthFirstMatch[1].toLowerCase().slice(0, 3)];
      if (mon !== undefined) {
        const y = monthFirstMatch[3].length === 2 ? 2000 + parseInt(monthFirstMatch[3], 10) : parseInt(monthFirstMatch[3], 10);
        return new Date(y, mon, parseInt(monthFirstMatch[2], 10));
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
      const parsed = parseExtractedDate(raw);
      log.info(' date detected:', raw, '| type:', type, '| parsed:', parsed);
      assessmentDates.push({ raw, parsed, type });
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

  const NAV_NOISE = /\b(moodle|canvas|blackboard|hub|portal|click(?: here)?|see (?:the|your|moodle|canvas)|more details|further information|via the link|the link below|see\s*\w*\s*for|url|Library holds|UNSW Library|Available at|Located at|accessed via|log in to)\b/i;
  const GENERIC_NOISE = /^(item|structure|details|overview|description|length|information|topics|tasks|lecture|content|brief|outline|rubric|page|section|figure|notes|comments|criteria|requirement|requirements|delivery mode|due date|weight|weighting|format|submission)$/i;
  const TERM_NOISE = /^(Term\s*[1-3]|Semester\s*[1-2]|Trimester\s*[1-3]|Session\s*[1-3]|T[1-3]|S[1-2]|Summer|Winter)$/i;
  // Allowlist: title must contain one of these keywords OR be explicitly
  // numbered (Assessment 1, Task 2, Part A). Rejects body-text fragments
  // like "Nitrophenol at 410 nm" or "Perform 10".
  const ASSESSMENT_KEYWORDS = /\b(assessment|report|lab|essay|exam|quiz|practical|presentation|submission|task|assignment|project|test|review|analysis|portfolio|case study|journal|bibliography|proposal|chapter)\b/i;
  const NUMBERED_ANCHOR = /^(?:Assessment|Task|AT|Part)\s*[A-Z0-9]/i;
  const TOO_MANY_NUMBERS = /(\d[^a-zA-Z]*){3,}/;

  const isAssessmentNoise = (title) => {
    const t = title.trim();
    if (NAV_NOISE.test(t)) return true;
    if (GENERIC_NOISE.test(t)) return true;
    if (TERM_NOISE.test(t)) return true;
    if (t.length < 6) return true;
    if (t.length > 80) return true;
    if (/^[a-z]/.test(t)) return true;
    if (TOO_MANY_NUMBERS.test(t)) return true;
    if (!ASSESSMENT_KEYWORDS.test(t) && !NUMBERED_ANCHOR.test(t)) return true;
    return false;
  };

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
    const weightMatch = block.match(/(\d{1,3})\s*%/) || block.match(/(?:worth|weighting)[:\s]*(\d{1,3})\s*%/i) || block.match(/(\d{1,3})\s*marks?\b/i);
    const weightLabel = weightMatch
      ? (block.match(/(\d{1,3})\s*marks?\b/i) && !block.match(/(\d{1,3})\s*%/) ? `${weightMatch[1]} marks` : `${weightMatch[1]}%`)
      : '';
    const display = weightLabel ? `${title} (${weightLabel})` : title;
    const key = display.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    log.info(' assessment detected:', title, '| weight:', weightLabel || 'none');
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

  // Cap at 8 assessments. More than 8 is almost certainly false positives.
  if (assessmentTitles.length > 8) {
    log.warn(' capped assessments from', assessmentTitles.length, 'to 8');
    assessmentTitles.length = 8;
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
    log.info('extraction summary', {
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
    format: detectAssessmentFormat(text),
    term: detectTerm(text),
    theme: 'Molecules'
  };
};

// ---------------------------------------------------------------------------
// Re-exported from BriefUtils.js (split for 500-line limit compliance)
// ---------------------------------------------------------------------------

export { detectAssessmentFormat, detectTerm, mergeExtractionData, deriveRoadmapFromAssessments } from './BriefUtils';
