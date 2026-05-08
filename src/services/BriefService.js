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
  
  const loRegex = /(?:LO|Outcome|CLO)\s*\d*[:\-]?\s*([A-Za-z0-9\s,]+)/gi;
  const learningOutcomes = [...text.matchAll(loRegex)].map(m => m[1].trim());

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

  return {
    learningOutcomes,
    referencingStyle,
    rubricCriteria,
    evidenceFormula,
    tierData,
    detectedLevel,
    words,
    weighting,
    theme: 'Molecules'
  };
};
