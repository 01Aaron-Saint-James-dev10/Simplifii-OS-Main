/**
 * ExamPaperParser.js
 *
 * Extracts questions, sections, and marks from raw exam paper text.
 * Pattern-based (no AI needed). Works with HSC, VCE, QCE, WACE formats.
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

  // Detect sections: "Section I", "Section II", "SECTION 1", "Part A", etc
  const sectionRe = /\b(?:Section|SECTION|Part)\s+([IVX]+|[A-D]|\d+)\b[:\-\s]*([^\n]{0,80})?/g;
  for (const m of text.matchAll(sectionRe)) {
    const num = m[1];
    const title = (m[2] || '').trim().replace(/\s+/g, ' ');
    // Avoid duplicate sections
    if (!sections.find(s => s.number === num)) {
      sections.push({
        number: num,
        title: title || `Section ${num}`,
        startIndex: m.index,
      });
    }
  }

  // Detect questions: "Question 1", "Q1", "1.", "Question 27 (6 marks)"
  const questionRe = /\b(?:Question|Q)\s*(\d+)\b(?:\s*\((\d+)\s*marks?\))?/gi;
  for (const m of text.matchAll(questionRe)) {
    const num = parseInt(m[1], 10);
    const marks = m[2] ? parseInt(m[2], 10) : 0;
    if (questions.find(q => q.number === num)) continue;

    // Extract question text: everything from match to next question or 300 chars
    const start = m.index + m[0].length;
    const nextQ = text.slice(start).search(/\b(?:Question|Q)\s*\d+\b/i);
    const end = nextQ > 0 ? start + Math.min(nextQ, 500) : start + 500;
    const qText = text.slice(start, end).trim().split('\n').slice(0, 5).join(' ').trim();

    // Determine which section this question belongs to
    let section = 'Questions';
    for (let i = sections.length - 1; i >= 0; i--) {
      if (m.index >= sections[i].startIndex) {
        section = sections[i].title || `Section ${sections[i].number}`;
        break;
      }
    }

    questions.push({ number: num, text: qText.slice(0, 400), marks, section });
  }

  // Fallback: numbered list "1. " at line start
  if (questions.length === 0) {
    const numberedRe = /^(\d+)\.\s+(.{10,200})/gm;
    for (const m of text.matchAll(numberedRe)) {
      const num = parseInt(m[1], 10);
      if (num > 50) continue; // avoid matching page numbers
      if (questions.find(q => q.number === num)) continue;
      // Check for marks nearby
      const marksMatch = m[2].match(/\((\d+)\s*marks?\)/i);
      const marks = marksMatch ? parseInt(marksMatch[1], 10) : 0;
      questions.push({ number: num, text: m[2].trim().slice(0, 300), marks, section: 'Questions' });
    }
  }

  questions.sort((a, b) => a.number - b.number);

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0) ||
    // Fallback: search for "Total marks: X" or "out of X marks"
    (() => {
      const totalMatch = text.match(/(?:Total|out of)\s*[:\-]?\s*(\d+)\s*marks/i);
      return totalMatch ? parseInt(totalMatch[1], 10) : 0;
    })();

  // Enrich sections with question counts
  for (const s of sections) {
    s.questionCount = questions.filter(q => q.section === (s.title || `Section ${s.number}`)).length;
    s.marks = questions.filter(q => q.section === (s.title || `Section ${s.number}`)).reduce((sum, q) => sum + q.marks, 0);
  }

  return { sections, questions, totalMarks };
};
