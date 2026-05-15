/**
 * ExamPaperParser.js
 *
 * Extracts questions, sections, and marks from raw exam paper text.
 * Pattern-based (no AI needed). Works with HSC, VCE, QCE, WACE formats.
 *
 * HSC format:
 *   Section I:  Multiple choice Q1-20, numbered "1." at line start, no "Question" prefix
 *   Section II: Short answer, prefixed "Question 21 (N marks)"
 *   Section III: Extended response, prefixed "Question 31 (N marks)"
 */

/**
 * Parse raw exam text into structured questions.
 * @param {string} rawText - the full PDF text
 * @returns {{ sections: [], questions: [], totalMarks: number }}
 */
export const parseExamPaper = (rawText) => {
  if (!rawText || rawText.length < 50) return { sections: [], questions: [], totalMarks: 0 };

  const text = rawText.replace(/\r\n/g, '\n');
  const questions = [];
  const sections = [];

  // ──────────────────────────────────────────────────────────────────
  // Step 1: Detect sections
  // ──────────────────────────────────────────────────────────────────
  const sectionRe = /\b(?:Section|SECTION|Part)\s+([IVX]+|[A-D]|\d+)\b[:\-\s]*([^\n]{0,80})?/g;
  for (const m of text.matchAll(sectionRe)) {
    const num = m[1];
    const title = (m[2] || '').trim().replace(/\s+/g, ' ');
    if (!sections.find(s => s.number === num)) {
      sections.push({
        number: num,
        title: title || `Section ${num}`,
        startIndex: m.index,
      });
    }
  }

  // Detect Section I boundary for MC extraction.
  // If "Section I" exists explicitly, use it. Otherwise infer: everything
  // before the first "Section II" (or equivalent) is Section I territory.
  const sectionI = sections.find(s => s.number === 'I' || s.number === '1');
  const sectionsAfterI = sections.filter(s => s !== sectionI).sort((a, b) => a.startIndex - b.startIndex);
  const sectionIStart = sectionI?.startIndex ?? 0;
  const sectionIEnd = sectionsAfterI.length > 0 ? sectionsAfterI[0].startIndex : text.length;

  // ──────────────────────────────────────────────────────────────────
  // Step 2: Extract "Question N" style questions (Section II+)
  // ──────────────────────────────────────────────────────────────────
  const questionRe = /\b(?:Question|Q)\s*(\d+)\b(?:\s*\((\d+)\s*marks?\))?/gi;
  const questionMatches = [...text.matchAll(questionRe)];
  for (let idx = 0; idx < questionMatches.length; idx++) {
    const m = questionMatches[idx];
    const num = parseInt(m[1], 10);
    const marks = m[2] ? parseInt(m[2], 10) : 0;
    if (questions.find(q => q.number === num)) continue;

    // Extract question text: from end of match to next "Question N" or section heading
    const start = m.index + m[0].length;
    const remaining = text.slice(start);
    // Use next match position for more accurate boundary
    const nextMatchStart = idx + 1 < questionMatches.length
      ? questionMatches[idx + 1].index - start
      : -1;
    const nextBoundary = remaining.search(/\b(?:Question|Q)\s*\d+\b|\bSection\s+[IVX]+\b/i);
    const boundary = nextMatchStart > 0 ? nextMatchStart : (nextBoundary > 0 ? nextBoundary : 1000);
    const extractLen = Math.min(boundary, 1000);
    const raw = remaining.slice(0, extractLen).trim();
    // Collapse newlines but preserve paragraph breaks as separators
    const qText = raw.replace(/\n{2,}/g, ' | ').replace(/\n/g, ' ').replace(/\s+/g, ' ').slice(0, 800);

    let section = 'Questions';
    for (let i = sections.length - 1; i >= 0; i--) {
      if (m.index >= sections[i].startIndex) {
        section = sections[i].title || `Section ${sections[i].number}`;
        break;
      }
    }

    questions.push({ number: num, text: qText, marks, section });
  }

  // ──────────────────────────────────────────────────────────────────
  // Step 3: Extract MC questions from Section I region.
  // HSC MC questions can be numbered as:
  //   "1. Which of..." (period after number)
  //   "1  Which of..." (no period, just whitespace)
  //   "1\nWhich of..." (number on its own line)
  // They are never prefixed "Question N" so Step 2 misses them.
  // ──────────────────────────────────────────────────────────────────
  const mcSectionText = text.slice(sectionIStart, sectionIEnd);
  const mcSection = sectionI ? (sectionI.title || `Section ${sectionI.number}`) : 'Section I: Multiple Choice';

  // Match numbered items: "1." or "1 " at start of line, with question text
  const mcRe = /^(\d{1,2})[\.\s]\s*(\S.{4,})/gm;
  const mcMatches = [...mcSectionText.matchAll(mcRe)].filter(m => {
    const num = parseInt(m[1], 10);
    return num >= 1 && num <= 40;
  });

  for (let idx = 0; idx < mcMatches.length; idx++) {
    const m = mcMatches[idx];
    const num = parseInt(m[1], 10);
    if (questions.find(q => q.number === num)) continue;

    // Grab text from start of question content to next numbered item
    const startInSection = m.index + m[0].length - m[2].length;
    const nextItemStart = idx + 1 < mcMatches.length ? mcMatches[idx + 1].index : mcSectionText.length;
    const extractLen = Math.min(nextItemStart - startInSection, 600);
    const raw = mcSectionText.slice(startInSection, startInSection + extractLen).trim();
    // Include answer options (A)-(D) as part of question text
    const qText = raw.replace(/\n/g, ' ').replace(/\s+/g, ' ').slice(0, 500);

    questions.push({ number: num, text: qText, marks: 1, section: mcSection });
  }

  // ──────────────────────────────────────────────────────────────────
  // Step 4: Fallback for non-HSC formats with no "Question N" prefix
  // ──────────────────────────────────────────────────────────────────
  if (questions.length === 0) {
    const numberedRe = /^(\d+)\.\s+(.{10,300})/gm;
    for (const m of text.matchAll(numberedRe)) {
      const num = parseInt(m[1], 10);
      if (num > 60) continue;
      if (questions.find(q => q.number === num)) continue;
      const marksMatch = m[2].match(/\((\d+)\s*marks?\)/i);
      const marks = marksMatch ? parseInt(marksMatch[1], 10) : 0;
      questions.push({ number: num, text: m[2].trim().slice(0, 400), marks, section: 'Questions' });
    }
  }

  questions.sort((a, b) => a.number - b.number);

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0) ||
    (() => {
      const totalMatch = text.match(/(?:Total|out of)\s*[:\-]?\s*(\d+)\s*marks/i);
      return totalMatch ? parseInt(totalMatch[1], 10) : 0;
    })();

  for (const s of sections) {
    s.questionCount = questions.filter(q => q.section === (s.title || `Section ${s.number}`)).length;
    s.marks = questions.filter(q => q.section === (s.title || `Section ${s.number}`)).reduce((sum, q) => sum + q.marks, 0);
  }

  return { sections, questions, totalMarks };
};
