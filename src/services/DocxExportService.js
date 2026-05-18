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
