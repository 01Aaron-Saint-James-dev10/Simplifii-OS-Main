import { TierParameters } from './TierParameters';

export const mapToWorkspace = (text, level = 'MRes') => {
  const lowerText = (text || '').toLowerCase();
  const isMiniLitReview = lowerText.includes('mini literature review') || lowerText.includes('literature review');
  
  if (level === 'MRes') {
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

export const extractEvidenceFormula = (text) => {
  const lowerText = text.toLowerCase();
  const formula = [];
  
  // Simulated ConstraintLogic engine: Quantity + Entity
  const primaryMatch = lowerText.match(/(?:need|require|find|use)?\s*(\d+|one|two|three|four|five)\s+(?:primary|peer-reviewed|empirical)\s+(?:articles?|sources?|papers?)/i);
  const reviewMatch = lowerText.match(/(?:need|require|find|use)?\s*(\d+|one|two|three|four|five)\s+(?:review|secondary)\s+(?:articles?|sources?|papers?)/i);
  const policyMatch = lowerText.match(/(?:need|require|find|use)?\s*(\d+|one|two|three|four|five)\s+(?:policy|systemic|audit)\s+(?:documents?|reports?)/i);

  const wordToNum = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5 };
  
  if (primaryMatch) {
    const num = isNaN(parseInt(primaryMatch[1])) ? wordToNum[primaryMatch[1].toLowerCase()] : parseInt(primaryMatch[1]);
    if (num) formula.push({ type: 'primary', count: num, label: 'Primary Research Article' });
  } else if (lowerText.includes('babs1201')) {
    // Fallback BABS hardwire if exact wording is missed
    formula.push({ type: 'primary', count: 2, label: 'Primary Research Article' });
  }

  if (reviewMatch) {
    const num = isNaN(parseInt(reviewMatch[1])) ? wordToNum[reviewMatch[1].toLowerCase()] : parseInt(reviewMatch[1]);
    if (num) formula.push({ type: 'review', count: num, label: 'Review Article' });
  } else if (lowerText.includes('babs1201')) {
    formula.push({ type: 'review', count: 1, label: 'Review Article' });
  }

  if (policyMatch) {
    const num = isNaN(parseInt(policyMatch[1])) ? wordToNum[policyMatch[1].toLowerCase()] : parseInt(policyMatch[1]);
    if (num) formula.push({ type: 'policy', count: num, label: 'Policy Document' });
  }

  // If entirely empty (no matches and not BABS), default to 1 generic source
  if (formula.length === 0) {
    formula.push({ type: 'generic', count: 1, label: 'Academic Source' });
  }

  return formula;
};

export const extractDeepCourseData = (text, level = 'MRes') => {
  const lowerText = text.toLowerCase();
  const tier = TierParameters[level] || TierParameters['Undergrad'];
  
  const loRegex = /(?:LO|Outcome|CLO)\s*\d*[:\-]?\s*([A-Za-z0-9\s,]+)/gi;
  const learningOutcomes = [...text.matchAll(loRegex)].map(m => m[1].trim());

  let referencingStyle = 'Harvard';
  if (lowerText.includes('apa')) referencingStyle = 'APA';
  else if (lowerText.includes('ieee')) referencingStyle = 'IEEE';

  const rubricRegex = /(?:High Distinction|Marking Criteria)[:\-]?\s*([A-Za-z0-9\s,.]+)/gi;
  const rubricCriteria = [...text.matchAll(rubricRegex)].map(m => m[1].trim());

  const tierData = {};
  for (const [key, regex] of Object.entries(tier.heuristics)) {
    const matches = [...text.matchAll(regex)].map(m => m[1].trim());
    if (matches.length > 0) tierData[key] = matches;
  }

  const evidenceFormula = extractEvidenceFormula(text);

  return {
    learningOutcomes,
    referencingStyle,
    rubricCriteria,
    evidenceFormula,
    tierData
  };
};
