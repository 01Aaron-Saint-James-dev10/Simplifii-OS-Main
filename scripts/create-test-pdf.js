/**
 * Generate a test PDF for Playwright regression tests.
 * Contains realistic assessment brief content for extraction testing.
 */
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createTestPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]); // A4

  let y = 780;
  const write = (text, size = 11, bold = false) => {
    page.drawText(text, { x: 50, y, size, font: bold ? boldFont : font, color: rgb(0, 0, 0) });
    y -= size + 6;
  };

  write('BABS1201 Molecules, Cells and Organisms', 16, true);
  y -= 10;
  write('Assessment Task 1: Literature Review', 13, true);
  y -= 8;
  write('Due Date: Friday Week 5, Term 2 2025');
  write('Weighting: 25%');
  write('Word Count: 2000 words');
  write('Submission: Via Turnitin on Moodle');
  y -= 10;
  write('Learning Outcomes:', 12, true);
  write('LO1: Analyse the structure and function of biological molecules');
  write('LO2: Evaluate experimental evidence in molecular biology');
  write('LO3: Synthesise information from primary research literature');
  y -= 10;
  write('Task Description:', 12, true);
  write('Write a literature review on a topic of your choice from the approved');
  write('list below. Your review should critically analyse at least 8 primary');
  write('research articles and demonstrate understanding of the topic.');
  y -= 10;
  write('Marking Criteria:', 12, true);
  write('High Distinction (85-100): Exceptional critical analysis with original insight');
  write('Distinction (75-84): Strong analysis with clear evidence of understanding');
  write('Credit (65-74): Adequate analysis with some critical evaluation');
  write('Pass (50-64): Basic understanding demonstrated with limited analysis');
  write('Fail (0-49): Insufficient understanding or analysis');
  y -= 10;
  write('Referencing Style: APA 7th Edition');

  const bytes = await doc.save();
  const outPath = path.join(__dirname, '..', 'test-assets', 'test-document.pdf');
  fs.writeFileSync(outPath, bytes);
  console.log('Test PDF created:', outPath, `(${bytes.length} bytes)`);
}

createTestPdf().catch(console.error);
