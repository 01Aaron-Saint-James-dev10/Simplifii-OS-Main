/**
 * DocxExportService.js
 *
 * Converts TipTap JSON (or plain string) to DOCX and triggers download.
 * Also supports plain text (.txt) and markdown (.md) exports.
 *
 * Uses the 'docx' library for DOCX generation and 'file-saver' for download.
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { appendEvent } from '../core/HistoryOfThought';

/**
 * Walk a TipTap JSON doc and collect paragraphs for the docx builder.
 */
function tiptapToDocxParagraphs(doc) {
  const paragraphs = [];
  if (!doc || !doc.content) return paragraphs;

  for (const node of doc.content) {
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const headingLevel = level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      const runs = extractRuns(node);
      paragraphs.push(new Paragraph({ heading: headingLevel, children: runs }));
    } else if (node.type === 'paragraph') {
      const runs = extractRuns(node);
      paragraphs.push(new Paragraph({ children: runs.length > 0 ? runs : [new TextRun('')] }));
    } else if (node.type === 'bulletList') {
      for (const item of (node.content || [])) {
        const runs = extractRuns(item.content?.[0]);
        paragraphs.push(new Paragraph({ bullet: { level: 0 }, children: runs }));
      }
    } else if (node.type === 'orderedList') {
      for (const item of (node.content || [])) {
        const runs = extractRuns(item.content?.[0]);
        paragraphs.push(new Paragraph({ numbering: { reference: 'default-numbering', level: 0 }, children: runs }));
      }
    } else if (node.type === 'blockquote') {
      for (const child of (node.content || [])) {
        const runs = extractRuns(child);
        paragraphs.push(new Paragraph({
          children: runs,
          indent: { left: 720 },
          border: { left: { style: BorderStyle.SINGLE, size: 3, space: 8 } }, // allow-style
        }));
      }
    } else if (node.type === 'horizontalRule') {
      paragraphs.push(new Paragraph({ thematicBreak: true }));
    } else if (node.type === 'codeBlock') {
      const text = (node.content || []).map(c => c.text || '').join('\n');
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text, font: 'JetBrains Mono', size: 20 })],
      }));
    }
  }
  return paragraphs;
}

function extractRuns(node) {
  if (!node || !node.content) return [];
  return node.content.map(c => {
    if (c.type !== 'text') return null;
    const marks = c.marks || [];
    const bold = marks.some(m => m.type === 'bold');
    const italic = marks.some(m => m.type === 'italic');
    const strike = marks.some(m => m.type === 'strike');
    const code = marks.some(m => m.type === 'code');
    return new TextRun({
      text: c.text || '',
      bold,
      italics: italic,
      strike,
      font: code ? 'JetBrains Mono' : 'Inter',
      size: code ? 20 : 24,
    });
  }).filter(Boolean);
}

/**
 * Walk TipTap JSON to extract plain text.
 */
function tiptapToPlainText(doc) {
  if (!doc || !doc.content) return '';
  const lines = [];
  const walk = (node) => {
    if (node.type === 'text') return node.text || '';
    if (node.type === 'heading') {
      const text = (node.content || []).map(walk).join('');
      const prefix = '#'.repeat(node.attrs?.level || 1);
      return `${prefix} ${text}`;
    }
    if (node.type === 'paragraph') return (node.content || []).map(walk).join('');
    if (node.type === 'bulletList') return (node.content || []).map(item => {
      const text = (item.content || []).map(walk).join('');
      return `  - ${text}`;
    }).join('\n');
    if (node.type === 'orderedList') return (node.content || []).map((item, i) => {
      const text = (item.content || []).map(walk).join('');
      return `  ${i + 1}. ${text}`;
    }).join('\n');
    if (node.type === 'blockquote') return (node.content || []).map(c => `> ${walk(c)}`).join('\n');
    if (node.type === 'horizontalRule') return '---';
    if (node.content) return node.content.map(walk).join('');
    return '';
  };
  for (const node of doc.content) {
    lines.push(walk(node));
  }
  return lines.join('\n\n');
}

function buildFilename(courseCode, assessmentTitle, ext) {
  const safe = (s) => (s || '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').slice(0, 40);
  const date = new Date().toISOString().slice(0, 10);
  return `${safe(courseCode)}_${safe(assessmentTitle)}_${date}.${ext}`;
}

/**
 * Export to DOCX.
 */
export async function exportToDocx({ tiptapDoc, htmlContent, courseCode, assessmentTitle, courseId }) {
  const paragraphs = tiptapDoc
    ? tiptapToDocxParagraphs(tiptapDoc)
    : [new Paragraph({ children: [new TextRun(htmlContent?.replace(/<[^>]*>/g, '') || '')] })];

  const doc = new Document({
    numbering: {
      config: [{ reference: 'default-numbering', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }] }],
    },
    sections: [{ children: paragraphs }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, buildFilename(courseCode, assessmentTitle, 'docx'));

  const wordCount = tiptapDoc
    ? tiptapToPlainText(tiptapDoc).trim().split(/\s+/).filter(Boolean).length
    : (htmlContent || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

  try {
    await appendEvent({
      event_type: 'export_complete',
      payload: { format: 'docx', wordCount, courseId, assessmentTitle, timestamp: Date.now() },
    });
  } catch { /* vault may be locked */ }
}

/**
 * Export to plain text.
 */
export function exportToTxt({ tiptapDoc, htmlContent, courseCode, assessmentTitle }) {
  const text = tiptapDoc
    ? tiptapToPlainText(tiptapDoc)
    : (htmlContent || '').replace(/<[^>]*>/g, ' ');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, buildFilename(courseCode, assessmentTitle, 'txt'));
}

/**
 * Export to markdown.
 */
export function exportToMarkdown({ tiptapDoc, htmlContent, courseCode, assessmentTitle }) {
  const md = tiptapDoc
    ? tiptapToPlainText(tiptapDoc)
    : (htmlContent || '').replace(/<[^>]*>/g, ' ');
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, buildFilename(courseCode, assessmentTitle, 'md'));
}

// ============================================================
// Submission PDF export (jsPDF)
// ============================================================

const PDF_ML      = 25;  // mm: left margin
const PDF_MR_W    = 210 - 25; // mm: right boundary (A4 width minus margin)
const PDF_MT      = 30;  // mm: top margin (below header)
const PDF_MB      = 270; // mm: bottom boundary (above footer)
const PDF_COL_W   = 210 - 50; // mm: usable column width (page - 2 margins)
const PDF_LINE_H  = 7;   // mm: line height (12pt * 1.5 = 18pt = ~6.35mm; rounded up)

/**
 * Render a single block of text onto the PDF, wrapping at PDF_COL_W.
 * Returns updated y position after the block.
 */
function pdfBlock(doc, text, x, y, opts = {}) {
  const { fontSize = 12, fontStyle = 'normal', indent = 0, extraSpaceAfter = 2 } = opts;
  doc.setFont('times', fontStyle);
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(String(text || '').trim(), PDF_COL_W - indent);
  for (const line of lines) {
    if (y > PDF_MB) {
      doc.addPage();
      pdfPageHeader(doc, opts._courseCode || '', opts._assessmentTitle || '');
      y = PDF_MT;
    }
    doc.text(line, x + indent, y);
    y += PDF_LINE_H;
  }
  return y + extraSpaceAfter;
}

function pdfPageHeader(doc, courseCode, assessmentTitle) {
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const header = [courseCode, assessmentTitle].filter(Boolean).join(' | ');
  doc.text(header, PDF_ML, 15);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(PDF_ML, 18, PDF_MR_W, 18);
  doc.setTextColor(0, 0, 0);
}

function pdfPageFooter(doc, wordCount) {
  const totalPages = doc.internal.getNumberOfPages();
  const date = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(PDF_ML, 280, PDF_MR_W, 280);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Word count: ${wordCount}  |  ${date}`, PDF_ML, 287);
    doc.text(`${p} / ${totalPages}`, PDF_MR_W, 287, { align: 'right' });
  }
}

/**
 * Walk TipTap JSON and render each node to the PDF.
 */
function renderTiptapToPdf(doc, tiptapDoc, startY, courseCode, assessmentTitle) {
  let y = startY;
  if (!tiptapDoc || !tiptapDoc.content) return y;
  const ctx = { _courseCode: courseCode, _assessmentTitle: assessmentTitle };

  for (const node of tiptapDoc.content) {
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const text = (node.content || []).map(c => c.text || '').join('');
      const fs = level === 1 ? 18 : level === 2 ? 14 : 13;
      y = pdfBlock(doc, text, PDF_ML, y, { ...ctx, fontSize: fs, fontStyle: 'bold', extraSpaceAfter: 3 });
    } else if (node.type === 'paragraph') {
      const text = (node.content || []).map(c => c.text || '').join('');
      if (text.trim()) {
        y = pdfBlock(doc, text, PDF_ML, y, { ...ctx, extraSpaceAfter: 3 });
      } else {
        y += 4; // blank line
      }
    } else if (node.type === 'bulletList') {
      for (const item of (node.content || [])) {
        const text = (item.content || []).map(n => (n.content || []).map(c => c.text || '').join('')).join('');
        y = pdfBlock(doc, `\u2022  ${text}`, PDF_ML, y, { ...ctx, indent: 4, extraSpaceAfter: 1 });
      }
      y += 3;
    } else if (node.type === 'orderedList') {
      node.content?.forEach((item, i) => {
        const text = (item.content || []).map(n => (n.content || []).map(c => c.text || '').join('')).join('');
        y = pdfBlock(doc, `${i + 1}.  ${text}`, PDF_ML, y, { ...ctx, indent: 4, extraSpaceAfter: 1 });
      });
      y += 3;
    } else if (node.type === 'blockquote') {
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      const blockStart = y;
      for (const child of (node.content || [])) {
        const text = (child.content || []).map(c => c.text || '').join('');
        y = pdfBlock(doc, text, PDF_ML + 8, y, { ...ctx, indent: 0, fontStyle: 'italic', extraSpaceAfter: 1 });
      }
      doc.line(PDF_ML + 2, blockStart - 1, PDF_ML + 2, y - 2);
      doc.setLineWidth(0.2);
      y += 4;
    } else if (node.type === 'horizontalRule') {
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(PDF_ML, y, PDF_MR_W, y);
      y += 6;
    }
  }
  return y;
}

/**
 * Export to submission-ready PDF.
 * Uses jsPDF with Times New Roman, 12pt, 1.5 line spacing.
 */
export async function exportToSubmissionPdf({ tiptapDoc, htmlContent, courseCode, assessmentTitle, courseId }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setDocumentProperties({
    title: assessmentTitle || 'Draft',
    author: '',
    creator: 'Simplifii-OS',
    subject: assessmentTitle || '',
  });

  // Page 1 header
  pdfPageHeader(doc, courseCode, assessmentTitle);

  // Title block
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  let y = PDF_MT;
  if (assessmentTitle) {
    const titleLines = doc.splitTextToSize(assessmentTitle, PDF_COL_W);
    doc.text(titleLines, PDF_ML, y);
    y += titleLines.length * 8 + 6;
  }

  // Body
  if (tiptapDoc) {
    y = renderTiptapToPdf(doc, tiptapDoc, y, courseCode, assessmentTitle);
  } else {
    const plain = (htmlContent || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const paragraphs = plain.split(/\n{2,}/);
    for (const para of paragraphs) {
      y = pdfBlock(doc, para, PDF_ML, y, {
        _courseCode: courseCode, _assessmentTitle: assessmentTitle, extraSpaceAfter: 3,
      });
    }
  }

  const wordCount = tiptapDoc
    ? tiptapToPlainText(tiptapDoc).trim().split(/\s+/).filter(Boolean).length
    : (htmlContent || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

  pdfPageFooter(doc, wordCount);

  doc.save(buildFilename(courseCode, assessmentTitle, 'pdf'));

  try {
    await appendEvent({
      event_type: 'export_complete',
      payload: { format: 'pdf', wordCount, courseId, assessmentTitle, timestamp: Date.now() },
    });
  } catch { /* vault may be locked */ }
}

// ============================================================
// HSC Answer Booklet PDF export
// ============================================================

const BK_ML   = 20;        // mm: left margin
const BK_MR   = 190;       // mm: right boundary (210 - 20)
const BK_COL  = 170;       // mm: usable width
const BK_MT   = 28;        // mm: content top (below header)
const BK_MB   = 272;       // mm: content bottom (above footer)
const BK_RULE = 8;         // mm: line-rule spacing

// Load a saved answer from localStorage using the same key as QuestionCoach.
function bookletLoadAnswer(documentId, questionNumber) {
  try {
    const raw = localStorage.getItem(`simplifii_answer_${documentId}_q${questionNumber}`);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed.attempts?.[parsed.attempts.length - 1]?.text || '';
  } catch { return ''; }
}

function bookletPageHeader(doc, examTitle, pageNum) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(examTitle || 'Practice Exam', BK_ML, 12);
  doc.text(`Page ${pageNum}`, BK_MR, 12, { align: 'right' });
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.25);
  doc.line(BK_ML, 15, BK_MR, 15);
  doc.setTextColor(0, 0, 0);
}

// Draw horizontal ruled lines filling from y down to y+heightMm.
function bookletRuledSpace(doc, y, heightMm) {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  let lineY = y + BK_RULE;
  while (lineY <= y + heightMm - 2) {
    doc.line(BK_ML, lineY, BK_MR, lineY);
    lineY += BK_RULE;
  }
}

// Render answer text with automatic page breaks. Returns new y.
function bookletText(doc, text, y, examTitle) {
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const lines = doc.splitTextToSize(text.trim(), BK_COL);
  for (const line of lines) {
    if (y > BK_MB) {
      doc.addPage();
      bookletPageHeader(doc, examTitle, doc.internal.getCurrentPageInfo().pageNumber);
      y = BK_MT;
    }
    doc.text(line, BK_ML, y);
    y += 6.5;
  }
  return y;
}

/**
 * Export student answers as an HSC-style answer booklet PDF.
 *
 * @param {object} opts
 * @param {Array}  opts.questions    Parsed question objects [{ number, marks, section, text }]
 * @param {string} opts.documentId   Used to load saved answers from localStorage
 * @param {string} opts.examTitle    Shown in header and cover page
 * @param {string} opts.studentName  Optional: printed on cover
 * @param {string} opts.schoolName   Optional: printed on cover
 * @param {string} opts.examDate     Optional: printed on cover (defaults to today)
 */
export async function exportToAnswerBooklet({ questions, documentId, examTitle, studentName, schoolName, examDate }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setDocumentProperties({
    title: examTitle || 'Answer Booklet',
    creator: 'Simplifii-OS',
  });

  const dateStr = examDate || new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });
  const safeTitle = examTitle || 'Practice Exam';

  // ---- Cover page ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('STUDENT ANSWER BOOKLET', BK_ML, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Practice only. Not for submission.', BK_ML, 31);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(BK_ML, 38, BK_COL, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  const titleLines = doc.splitTextToSize(safeTitle, BK_COL - 8);
  doc.text(titleLines, BK_ML + 4, 47);

  // Field rows inside the box
  const fields = [
    { label: 'Student name', value: studentName || '' },
    { label: 'School',       value: schoolName || '' },
    { label: 'Date',         value: dateStr },
  ];
  let fieldY = 64;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const f of fields) {
    doc.setTextColor(80, 80, 80);
    doc.text(f.label + ':', BK_ML + 4, fieldY);
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.line(BK_ML + 34, fieldY, BK_MR - 4, fieldY);
    if (f.value) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text(f.value, BK_ML + 36, fieldY - 1);
      doc.setFont('helvetica', 'normal');
    }
    fieldY += 10;
  }

  // Question summary table
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  const tableTop = 96;
  doc.rect(BK_ML, tableTop, BK_COL, 26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Section', BK_ML + 2, tableTop + 6);
  doc.text('Questions', BK_ML + 32, tableTop + 6);
  doc.text('Marks', BK_ML + 70, tableTop + 6);
  doc.line(BK_ML, tableTop + 9, BK_MR, tableTop + 9);

  // Group by section for summary
  const sectionMap = new Map();
  for (const q of questions) {
    const s = q.section || 'Questions';
    if (!sectionMap.has(s)) sectionMap.set(s, { count: 0, marks: 0 });
    const g = sectionMap.get(s);
    g.count++;
    g.marks += q.marks || 0;
  }
  let sumY = tableTop + 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (const [sec, g] of sectionMap) {
    const label = sec.length > 22 ? sec.slice(0, 20) + '\u2026' : sec;
    doc.text(label, BK_ML + 2, sumY);
    doc.text(String(g.count), BK_ML + 32, sumY);
    doc.text(String(g.marks), BK_ML + 70, sumY);
    sumY += 8;
  }

  // "Writing begins on next page" rule
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(BK_ML, 140, BK_MR, 140);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('WRITING BEGINS ON NEXT PAGE', 105, 146, { align: 'center' });
  doc.line(BK_ML, 150, BK_MR, 150);

  // ---- Question pages ----
  let currentSection = null;

  for (const q of questions.slice().sort((a, b) => a.number - b.number)) {
    doc.addPage();
    const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
    bookletPageHeader(doc, safeTitle, pageNum);

    let y = BK_MT;

    // Section heading (once per section)
    if (q.section && q.section !== currentSection) {
      currentSection = q.section;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(q.section.toUpperCase(), BK_ML, y);
      y += 7;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(BK_ML, y, BK_MR, y);
      y += 5;
      doc.setTextColor(0, 0, 0);
    }

    // Question header bar
    doc.setFillColor(240, 240, 240);
    doc.rect(BK_ML, y, BK_COL, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Question ${q.number}`, BK_ML + 3, y + 5.5);
    if (q.marks > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`${q.marks} ${q.marks === 1 ? 'mark' : 'marks'}`, BK_MR - 3, y + 5.5, { align: 'right' });
    }
    y += 12;
    doc.setTextColor(0, 0, 0);

    const savedAnswer = bookletLoadAnswer(documentId, q.number);

    if (savedAnswer.trim()) {
      // Render the student's answer text
      y = bookletText(doc, savedAnswer, y, safeTitle);
      y += 4;
    } else {
      // Ruled blank space proportional to marks (min 5 lines, max 40 lines at BK_RULE each)
      const lines = Math.min(40, Math.max(5, (q.marks || 2) * 4));
      const spaceH = lines * BK_RULE;
      if (y + spaceH > BK_MB) {
        doc.addPage();
        bookletPageHeader(doc, safeTitle, doc.internal.getCurrentPageInfo().pageNumber);
        y = BK_MT;
      }
      bookletRuledSpace(doc, y, spaceH);
      y += spaceH + 4;
    }

    // Bottom rule separating questions
    if (y < BK_MB - 5) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(BK_ML, y, BK_MR, y);
    }
  }

  // Footer on every page
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(BK_ML, 282, BK_MR, 282);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text('Simplifii-OS practice booklet', BK_ML, 288);
    doc.text(`${p} / ${totalPages}`, BK_MR, 288, { align: 'right' });
  }

  const safe = (s) => (s || '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').slice(0, 40);
  doc.save(`${safe(safeTitle)}_answer_booklet_${new Date().toISOString().slice(0, 10)}.pdf`);

  try {
    await appendEvent({
      event_type: 'export_complete',
      payload: { format: 'answer_booklet', questionCount: questions.length, examTitle, timestamp: Date.now() },
    });
  } catch { /* vault may be locked */ }
}
