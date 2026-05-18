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
  // HSC papers list all sections on the cover page, so the FIRST match of
  // "Section II" is usually the cover-page description, not the actual content
  // boundary. Use the LAST occurrence of each section number so we get the
  // actual content start, not the cover-page mention.
  const allSectionMatches = {};
  for (const m of text.matchAll(/\b(?:Section|SECTION|Part)\s+([IVX]+|[A-D]|\d+)\b/g)) {
    allSectionMatches[m[1]] = { index: m.index, number: m[1] };
  }
  const sectionI = sections.find(s => s.number === 'I' || s.number === '1');
  const sectionsAfterI = sections.filter(s => s !== sectionI).sort((a, b) => a.startIndex - b.startIndex);
  const sectionIStart = sectionI?.startIndex ?? 0;
  // Use the last occurrence of Section II (or equivalent) as the MC region end.
  // This avoids cover-page false positives that make sectionIEnd too small.
  const sectionIILastIndex = (() => {
    const key = sectionsAfterI[0]?.number;
    return key && allSectionMatches[key] ? allSectionMatches[key].index : -1;
  })();
  const sectionIEnd = sectionIILastIndex > 0 ? sectionIILastIndex
    : sectionsAfterI.length > 0 ? sectionsAfterI[0].startIndex
    : text.length;

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
  //
  // Use firstQ21Pos as the primary MC region boundary: even if sectionIEnd
  // is wrong (cover-page false positive), the first "Question 21" marker
  // reliably separates MC from short-answer content.
  // ──────────────────────────────────────────────────────────────────
  // "Question 21" (singular) in actual content reliably marks the end of MC region.
  // Prefer this over sectionIEnd: cover-page references say "Questions 21-35" (plural)
  // so the singular form only appears in actual question headers.
  const firstQ21Match = text.match(/\bQuestion\s+(?:2[1-9]|[3-9]\d|\d{3,})\b/i);
  const mcBoundary = firstQ21Match ? firstQ21Match.index : sectionIEnd;
  // Run MC extraction on full text up to the boundary (not just sectionIStart..sectionIEnd).
  // This captures MC questions on pages 2-11 even when sectionIEnd landed on the cover page.
  const mcSectionText = text.slice(0, mcBoundary);
  const mcSection = sectionI ? (sectionI.title || `Section ${sectionI.number}`) : 'Section I: Multiple Choice';

  // Match numbered items: "1." or "1 " at start of line, with question text
  // Exclude sub-questions (1a, 1b) and mark annotations ((3 marks))
  const mcRe = /^(\d{1,2})[\.\s]\s*(\S.{4,})/gm;
  const mcMatches = [...mcSectionText.matchAll(mcRe)].filter(m => {
    const num = parseInt(m[1], 10);
    if (num < 1 || num > 40) return false;
    // Skip if followed by a letter (sub-question like "1a")
    const afterNum = mcSectionText.slice(m.index + m[1].length, m.index + m[1].length + 2);
    if (/^[a-z]/i.test(afterNum.replace(/[\.\s]/, ''))) return false;
    // Skip if the "question text" is just marks annotation
    if (/^\(\d+\s*marks?\)/i.test(m[2].trim())) return false;
    return true;
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

  // ──────────────────────────────────────────────────────────────────
  // Step 5: Lettered sub-questions (a), (b), (c) style.
  // Common in HSC short-answer sections where each question part is
  // lettered rather than numbered. Convert (a)=1, (b)=2, etc.
  // Only runs when numbered extraction found nothing usable.
  // ──────────────────────────────────────────────────────────────────
  if (questions.length < 3) {
    const letteredRe = /^\(([a-i])\)\s+(.{8,400})/gm;
    let letterOffset = 0;
    const letterBase = questions.length; // offset so letters follow any existing numbers
    for (const m of text.matchAll(letteredRe)) {
      const letter = m[1].toLowerCase();
      const num = letterBase + (letter.charCodeAt(0) - 96); // a=1, b=2 ...
      if (questions.find(q => q.number === num)) continue;
      const marksMatch = m[2].match(/\((\d+)\s*marks?\)/i);
      const marks = marksMatch ? parseInt(marksMatch[1], 10) : 0;
      // Find which section this falls in
      let section = 'Questions';
      for (let i = sections.length - 1; i >= 0; i--) {
        if (m.index >= sections[i].startIndex) {
          section = sections[i].title || `Section ${sections[i].number}`;
          break;
        }
      }
      questions.push({ number: num, text: m[2].trim().slice(0, 500), marks, section });
      letterOffset++;
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

/**
 * Parse HSC/VCE marking guidelines PDF text into per-question criteria.
 * @param {string} rawText - full PDF text of the marking guidelines
 * @returns {{ [questionNumber: number]: { criteria: string[], sampleAnswer: string, marks: number } }}
 */
export const parseMarkingGuidelines = (rawText) => {
  if (!rawText || rawText.length < 50) return {};
  const text = rawText.replace(/\r\n/g, '\n');
  const result = {};

  // Match "Question 21" or "Question 21 (a)" style headers
  const qRe = /\bQuestion\s+(\d+)(?:\s*\(([a-i])\))?/gi;
  const qMatches = [...text.matchAll(qRe)];

  for (let idx = 0; idx < qMatches.length; idx++) {
    const m = qMatches[idx];
    const num = parseInt(m[1], 10);
    // Sub-question letter offset: a=0, b=1... to create unique keys like 21.1, 21.2
    const sub = m[2] ? m[2].charCodeAt(0) - 96 : 0;
    const key = sub > 0 ? parseFloat(`${num}.${sub}`) : num;

    const start = m.index + m[0].length;
    const end = idx + 1 < qMatches.length ? qMatches[idx + 1].index : start + 1500;
    const block = text.slice(start, end).trim();

    // Extract marks
    const marksMatch = block.match(/(\d+)\s*marks?/i);
    const marks = marksMatch ? parseInt(marksMatch[1], 10) : 0;

    // Extract criteria lines (lines with mark counts at end, or bullet points)
    const criteriaLines = block.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 10 && (
        /\d\s*$/.test(l) || /^[\u2022\-\*]/.test(l) || /^Criteria/i.test(l)
      ))
      .slice(0, 8)
      .map(l => l.replace(/^\s*[\u2022\-\*]\s*/, ''));

    // Extract sample answer block
    const sampleMatch = block.match(/(?:sample answer|candidates could|model answer)[:\s\n]+([\s\S]{20,600}?)(?:\n\n|\bQuestion\b|$)/i);
    const sampleAnswer = sampleMatch ? sampleMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : '';

    if (criteriaLines.length > 0 || sampleAnswer) {
      result[key] = { criteria: criteriaLines, sampleAnswer, marks };
    }
  }

  return result;
};
