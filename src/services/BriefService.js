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

  let referencingStyle = 'Harvard';
  if (lowerText.includes('apa')) referencingStyle = 'APA';
  else if (lowerText.includes('ieee')) referencingStyle = 'IEEE';

  const rubricRegex = /(?:High Distinction|Marking Criteria)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi;
  const rubricCriteria = [...text.matchAll(rubricRegex)].map(m => m[1].trim());

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

  // Assessment dates: "due Friday Week 5", "Submission: 12 May 2026", "deadline 12/05/2026"
  const dateRegex = /(?:due|deadline|submission|assessment)\s*(?:on|by|date)?[:\-]?\s*((?:[A-Z][a-z]+day\s*(?:Week\s*\d+)?)|(?:\d{1,2}\s+[A-Z][a-z]+\s+\d{2,4})|(?:\d{1,2}\/\d{1,2}\/\d{2,4}))/gi;
  const assessmentDates = [...new Set([...text.matchAll(dateRegex)].map(m => m[1].trim()))];

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

  // Build the Definition of Done checklist. Prefer assessment titles so the
  // student sees what they will be graded on; fall back to Learning Outcomes
  // when the syllabus does not surface explicit assessments.
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '').slice(0, 40) || 'item';
  const doneSource = assessmentTitles.length > 0 ? assessmentTitles : learningOutcomes;
  const doneSourceTag = assessmentTitles.length > 0 ? 'assess' : 'lo';
  const doneWhenChecklist = doneSource.slice(0, 12).map((entry, i) => ({
    id: `${doneSourceTag}_${i}_${slugify(entry)}`,
    text: entry,
    checked: false,
    triggerWord: entry.split(/\s+/).slice(0, 3).join(' ').toLowerCase()
  }));

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
    evidenceFormula,
    tierData,
    detectedLevel,
    words,
    weighting,
    assessmentDates,
    udlRequirements,
    udlPrinciples,
    udlSuggestions,
    doneWhenChecklist,
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

export const mergeExtractionData = (prev, next) => {
  if (!prev) return next;
  if (!next) return prev;
  return {
    ...prev,
    ...next,
    learningOutcomes: dedupeStrings([...(prev.learningOutcomes || []), ...(next.learningOutcomes || [])]),
    assessmentTitles: dedupeStrings([...(prev.assessmentTitles || []), ...(next.assessmentTitles || [])]),
    rubricCriteria: dedupeStrings([...(prev.rubricCriteria || []), ...(next.rubricCriteria || [])]),
    assessmentDates: dedupeStrings([...(prev.assessmentDates || []), ...(next.assessmentDates || [])]),
    udlRequirements: dedupeStrings([...(prev.udlRequirements || []), ...(next.udlRequirements || [])]),
    udlPrinciples: Array.from(new Set([...(prev.udlPrinciples || []), ...(next.udlPrinciples || [])])),
    udlSuggestions: Array.from(new Set([...(prev.udlSuggestions || []), ...(next.udlSuggestions || [])])),
    evidenceFormula: [...(prev.evidenceFormula || []), ...(next.evidenceFormula || [])],
    doneWhenChecklist: dedupeById([...(prev.doneWhenChecklist || []), ...(next.doneWhenChecklist || [])]),
    words: Math.max(prev.words || 0, next.words || 0) || (prev.words || next.words),
    weighting: Math.max(prev.weighting || 0, next.weighting || 0) || (prev.weighting || next.weighting),
    referencingStyle: prev.referencingStyle || next.referencingStyle,
    detectedLevel: next.detectedLevel || prev.detectedLevel,
    rawText: [prev.rawText, next.rawText].filter(Boolean).join('\n\n')
  };
};

// Map an array of extracted assessment titles into the three Semester
// Roadmap slots. The student sees the actual graded artefacts in the left
// sidebar instead of the generic 'Literature Review / Oral Presentation /
// Final Exam' defaults. Returns null when titles is empty so the caller
// can keep the per-course defaults intact.
//
// Rules:
//   currentTask    -> first title (the next thing they will be graded on)
//   nextAssessment -> second title, falling back to first if only one
//   finalMilestone -> any title containing 'final' or 'exam' (case
//                     insensitive); otherwise the last title
export const deriveRoadmapFromAssessments = (assessmentTitles = []) => {
  if (!Array.isArray(assessmentTitles) || assessmentTitles.length === 0) return null;
  // Defensive: drop empties and any title under 4 chars (e.g. 'Item').
  // The upstream extractor already filters generic noise, this is the
  // last line in case a stray short token slipped through.
  const titles = assessmentTitles.filter(t => typeof t === 'string' && t.trim().length >= 4);
  if (titles.length === 0) return null;

  const currentTask = titles[0];
  const nextAssessment = titles[1] || titles[0];
  // Prefer 'Final' first; if no Final, take the last 'Exam' title (so a
  // Final Exam beats a Mid-semester Exam); else fall back to the last
  // title in the list.
  const finalMatch =
    titles.find(t => /\bfinal\b/i.test(t)) ||
    [...titles].reverse().find(t => /\bexam\b/i.test(t));
  const finalMilestone = finalMatch || titles[titles.length - 1];

  return { currentTask, nextAssessment, finalMilestone };
};
