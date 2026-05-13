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
