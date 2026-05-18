import jsPDF from 'jspdf';

const TEAL_HEX = [0, 160, 176];
const NAVY = [10, 14, 26];
const BODY_BLACK = [17, 17, 17];
const GREY_FOOTER = [68, 68, 68];
const SECTION_BORDER = [0, 120, 130];
const SECTION_HEAD = [10, 74, 74];
const SUBTLE_BG = [245, 245, 245];

/**
 * Universal PDF export for all Simplifii tools.
 * Professional branding: dark navy header, teal accents, WCAG-accessible text.
 */
export const exportToPdf = ({ studentName, toolName, date, sections, extraTips, rawOutput, headerExtra }) => {
  if (!rawOutput && (!sections || sections.length === 0)) {
    console.warn('exportToPdf: No data to export');
    return;
  }

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ML = 18;
  const MR = 18;
  const TW = W - ML - MR;
  let y = 20;
  let pageNum = 1;
  let isFirstPage = true;
  const dateStr = date || new Date().toLocaleDateString('en-AU');

  const addPageHeader = () => {
    if (!isFirstPage) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SECTION_HEAD);
      doc.text(toolName || 'Tool Output', ML, 12);
      doc.text(dateStr, W - MR, 12, { align: 'right' });
      doc.setDrawColor(...SECTION_BORDER);
      doc.setLineWidth(0.5);
      doc.line(ML, 14, W - MR, 14);
      y = 20;
    }
  };

  const addFooter = () => {
    doc.setDrawColor(...SECTION_BORDER);
    doc.setLineWidth(0.5);
    doc.line(ML, H - 16, W - MR, H - 16);
    doc.setFontSize(8);
    doc.setTextColor(...GREY_FOOTER);
    doc.setFont('helvetica', 'normal');
    doc.text('Simplifii \u2014 Built for complex briefs. Not complex brains.', ML, H - 10);
    doc.text(`Page ${pageNum}`, W - MR, H - 10, { align: 'right' });
    doc.setTextColor(...SECTION_HEAD);
    doc.setFontSize(7);
    doc.text('simplifii-beta.com', ML, H - 6);
    doc.link(ML, H - 9, 30, 5, { url: 'https://simplifii-beta.com' });
  };

  const newPage = () => {
    addFooter();
    doc.addPage();
    pageNum++;
    isFirstPage = false;
    y = 20;
    addPageHeader();
  };

  const checkPage = (needed = 20) => {
    if (y + needed > H - 22) {
      newPage();
    }
  };

  const wrap = (text, maxW, size = 11) => {
    doc.setFontSize(size);
    return doc.splitTextToSize(String(text || ''), maxW);
  };

  const writeSectionHeading = (text) => {
    checkPage(20);
    y += 6;
    // Teal left border (3pt)
    doc.setDrawColor(...SECTION_BORDER);
    doc.setLineWidth(3);
    doc.line(ML, y - 5, ML, y + 4);
    // Heading text: 16pt dark teal bold
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...SECTION_HEAD);
    const lines = wrap(text, TW - 6, 16);
    doc.text(lines, ML + 5, y);
    y += lines.length * 7 + 8;
  };

  const writeSubHeading = (text) => {
    checkPage(14);
    // Subtle grey background band
    doc.setFillColor(...SUBTLE_BG);
    doc.rect(ML, y - 4, TW, 8, 'F');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BODY_BLACK);
    const lines = wrap(text, TW - 4, 13);
    doc.text(lines, ML + 2, y);
    y += lines.length * 5.5 + 6;
  };

  const writeBody = (text, indent = 0) => {
    if (!text) return;
    checkPage(10);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BODY_BLACK);
    const lines = wrap(text, TW - indent, 11);
    lines.forEach((line) => {
      checkPage(6);
      doc.text(line, ML + indent, y);
      y += 6;
    });
    y += 3;
  };

  const writeBullet = (text, indent = 8) => {
    checkPage(8);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BODY_BLACK);
    const bulletText = `\u2022 ${text}`;
    const lines = wrap(bulletText, TW - indent, 11);
    lines.forEach((line) => {
      checkPage(6);
      doc.text(line, ML + indent, y);
      y += 6;
    });
    y += 1.5;
  };

  const writeCheckbox = (text, indent = 8) => {
    checkPage(8);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BODY_BLACK);
    const cbText = `\u2610 ${text}`;
    const lines = wrap(cbText, TW - indent, 11);
    lines.forEach((line) => {
      checkPage(6);
      doc.text(line, ML + indent, y);
      y += 6;
    });
    y += 1.5;
  };

  const writeLabel = (label, value, indent = 0) => {
    if (!value && value !== 0 && value !== false) return;
    checkPage(8);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BODY_BLACK);
    const labelStr = `${label}: `;
    doc.text(labelStr, ML + indent, y);
    const labelW = doc.getTextWidth(labelStr);
    doc.setFont('helvetica', 'normal');
    const lines = wrap(String(value), TW - indent - labelW - 2, 11);
    if (lines.length === 1) {
      doc.text(lines[0], ML + indent + labelW, y);
      y += 6 + 2;
    } else {
      doc.text(lines[0], ML + indent + labelW, y);
      y += 6;
      for (let i = 1; i < lines.length; i++) {
        checkPage(6);
        doc.text(lines[i], ML + indent, y);
        y += 6;
      }
      y += 2;
    }
  };

  // === HEADER (page 1 only) ===
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 38, 'F');

  // Logo: Simplifii-β in teal on dark header (white bg behind = passes)
  doc.setFontSize(20);
  doc.setFont('courier', 'bold');
  doc.setTextColor(...TEAL_HEX);
  doc.text('Simplifii', ML, 18);

  // Tool name in white
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(toolName || 'Tool Output', ML, 28);

  // Right side: student name + date
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 190);
  if (studentName) {
    doc.text(studentName, W - MR, 18, { align: 'right' });
  }
  doc.text(dateStr, W - MR, 26, { align: 'right' });

  y = 44;

  // Header extra (e.g., AI risk scores for Humaniser)
  if (headerExtra) {
    doc.setFontSize(10);
    doc.setTextColor(...SECTION_HEAD);
    doc.text(headerExtra, ML, y);
    y += 6;
  }

  // Website link + separator
  doc.setFontSize(10);
  doc.setTextColor(...SECTION_HEAD);
  doc.text('simplifii-beta.com', ML, y);
  doc.link(ML, y - 3, 30, 5, { url: 'https://simplifii-beta.com' });
  y += 5;
  doc.setDrawColor(...SECTION_BORDER);
  doc.setLineWidth(1);
  doc.line(ML, y, W - MR, y);
  y += 10;
  isFirstPage = false;

  // === RENDER CONTENT ===
  if (rawOutput && typeof rawOutput === 'object') {
    renderToolOutput(rawOutput, {
      writeSectionHeading, writeSubHeading, writeBody,
      writeBullet, writeCheckbox, writeLabel, checkPage
    });
  }

  if (sections && sections.length > 0) {
    sections.forEach((sec, idx) => {
      writeSectionHeading(`${idx + 1}. ${sec.title || sec.name || 'Section'}`);
      if (sec.summary || sec.plainSummary) writeBody(sec.summary || sec.plainSummary);
      (sec.items || sec.steps || []).forEach((item) => {
        const title = item.title || item.task || item.text || '';
        if (title.startsWith('\u2610') || title.startsWith('☐')) {
          writeCheckbox(title.replace(/^[☐\u2610]\s*/, ''));
        } else {
          writeBullet(title);
        }
      });
    });
  }

  if (extraTips?.length) {
    writeSectionHeading('Tips');
    extraTips.forEach((tip) => writeBullet(tip));
  }

  addFooter();
  doc.save(`Simplifii_${(toolName || 'Output').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};


/**
 * Recursively renders any tool JSON output as branded, human-readable PDF content.
 */
function renderToolOutput(data, ctx) {
  const skipKeys = new Set(['concept']);

  const friendlyName = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
  };

  const renderValue = (key, val, depth = 0) => {
    if (skipKeys.has(key) && depth === 0) return;
    if (val === null || val === undefined) return;
    const name = friendlyName(key);

    if (typeof val === 'string') {
      if (depth === 0) {
        ctx.writeSectionHeading(name);
        ctx.writeBody(val);
      } else {
        ctx.writeLabel(name, val, depth * 4);
      }
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      ctx.writeLabel(name, String(val), depth * 4);
    } else if (Array.isArray(val)) {
      if (depth === 0) ctx.writeSectionHeading(name);
      else ctx.writeSubHeading(name);

      val.forEach((item) => {
        if (typeof item === 'string') {
          if (item.startsWith('☐') || item.startsWith('\u2610')) {
            ctx.writeCheckbox(item.replace(/^[☐\u2610]\s*/, ''), 8 + depth * 4);
          } else {
            ctx.writeBullet(item, 8 + depth * 4);
          }
        } else if (typeof item === 'object' && item !== null) {
          Object.entries(item).forEach(([k, v]) => {
            if (typeof v === 'string' || typeof v === 'number') {
              ctx.writeLabel(friendlyName(k), String(v), (depth + 1) * 4);
            } else if (Array.isArray(v)) {
              ctx.writeSubHeading(friendlyName(k));
              v.forEach(subItem => {
                if (typeof subItem === 'string') ctx.writeBullet(subItem, (depth + 2) * 4);
                else if (typeof subItem === 'object') {
                  Object.entries(subItem).forEach(([sk, sv]) => {
                    ctx.writeLabel(friendlyName(sk), String(sv), (depth + 2) * 4);
                  });
                }
              });
            } else if (typeof v === 'object' && v !== null) {
              ctx.writeSubHeading(friendlyName(k));
              Object.entries(v).forEach(([sk, sv]) => {
                if (typeof sv === 'string' || typeof sv === 'number') {
                  ctx.writeLabel(friendlyName(sk), String(sv), (depth + 2) * 4);
                }
              });
            }
          });
          ctx.checkPage(4);
        }
      });
    } else if (typeof val === 'object') {
      if (depth === 0) ctx.writeSectionHeading(name);
      else ctx.writeSubHeading(name);
      Object.entries(val).forEach(([k, v]) => {
        renderValue(k, v, depth + 1);
      });
    }
  };

  Object.entries(data).forEach(([key, val]) => {
    renderValue(key, val, 0);
  });
}
