/**
 * ingest-vce.js
 *
 * Ingests VCE English past paper data (2019-2025).
 * Scrapes the VCAA exam page via Firecrawl for exam report URLs.
 * Exam reports contain marker feedback (equivalent to NESA marking feedback).
 * Since reports are DOCX (not web pages), we store the PDF exam URLs and
 * use the page markdown as the source content (contains year/section structure).
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... FIRECRAWL_API_KEY=... node scripts/ingest-vce.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aqcreatryuvuuynwvnqy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const VCE_PAGE = 'https://www.vcaa.vic.edu.au/assessment/vce-assessment/past-examinations/Pages/English.aspx';

async function scrape(url) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_KEY}`,
    },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
  });
  if (!response.ok) throw new Error(`Scrape failed ${response.status}`);
  const data = await response.json();
  return data?.data?.markdown || '';
}

function extractYearData(markdown) {
  const years = [];
  // Match year headers with exam + report links
  const yearRegex = /#{3,5}\s*(\d{4})\s*\n([\s\S]*?)(?=#{3,5}\s*\d{4}|#{3}\s*(?:Archive|Examinations relating)|$)/gi;
  for (const match of markdown.matchAll(yearRegex)) {
    const year = parseInt(match[1]);
    const block = match[2];
    if (year < 2019 || year > 2026) continue;

    const pdfMatch = block.match(/\[.*?exam.*?\]\((https?:\/\/[^\s)]+\.pdf)\)/i);
    const reportMatch = block.match(/\[.*?report.*?\]\((https?:\/\/[^\s)]+(?:\.docx|\.pdf))\)/i);

    years.push({
      year,
      examUrl: pdfMatch ? pdfMatch[1] : null,
      reportUrl: reportMatch ? reportMatch[1] : null,
      content: block.trim().slice(0, 5000),
    });
  }
  return years;
}

async function main() {
  console.info('=== VCE English Past Papers Ingestion ===\n');

  const { data: syllabi } = await supabase.from('syllabi')
    .select('id').eq('board', 'VCAA').eq('subject', 'English').single();
  if (!syllabi) { console.error('VCE English syllabus not found.'); process.exit(1); }
  const syllabusId = syllabi.id;

  console.info('Scraping VCAA English page...');
  const markdown = await scrape(VCE_PAGE);
  const yearData = extractYearData(markdown);

  console.info(`Found ${yearData.length} years of papers.\n`);

  let totalPapers = 0;
  for (const yd of yearData) {
    console.info(`Processing ${yd.year}...`);
    try {
      const { data: paper, error: paperErr } = await supabase.from('past_papers').upsert({
        syllabus_id: syllabusId,
        year: yd.year,
        paper_type: 'VCE',
        source_url: yd.examUrl || VCE_PAGE,
        raw_text: yd.content,
        parsed_questions: [],
        marker_notes: yd.reportUrl ? `Report available: ${yd.reportUrl}` : null,
      }, { onConflict: 'syllabus_id,year,paper_type' }).select('id').single();

      if (paperErr) {
        console.warn(`  Paper upsert failed for ${yd.year}:`, paperErr.message);
        continue;
      }

      // Insert a placeholder question per year (exam content is in PDF, not parsed)
      await supabase.from('past_questions').delete().eq('paper_id', paper.id);
      const { error: qErr } = await supabase.from('past_questions').insert({
        paper_id: paper.id,
        question_number: 1,
        question_text: `VCE English ${yd.year} Written Examination`,
        marks: null,
        question_type: 'full_paper',
        sample_response_text: yd.content.slice(0, 2000),
      });
      if (!qErr) totalPapers++;

      console.info(`  ${yd.year}: exam=${yd.examUrl ? 'found' : 'missing'}, report=${yd.reportUrl ? 'found' : 'missing'}`);
    } catch (err) {
      console.warn(`  Error on ${yd.year}:`, err.message);
    }
  }

  console.info(`\n=== Done === ${totalPapers} years ingested.`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
