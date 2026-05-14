/**
 * ingest-wace.js
 *
 * Ingests WACE English past paper data (2020-2025).
 * Scrapes the SCSA English ATAR exams page via Firecrawl.
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... FIRECRAWL_API_KEY=... node scripts/ingest-wace.js
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

const WACE_PAGE = 'https://senior-secondary.scsa.wa.edu.au/further-resources/past-atar-course-exams/english-past-atar-course-exams';

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
  const yearRegex = /#{3}\s*(\d{4})\s+ATAR\s*\n([\s\S]*?)(?=#{3}\s*\d{4}|$)/gi;
  for (const match of markdown.matchAll(yearRegex)) {
    const year = parseInt(match[1]);
    const block = match[2];
    if (year < 2019 || year > 2026) continue;

    const pdfLinks = [];
    // Match both .PDF and .pdf extensions, and handle "opens in new window" labels
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)"]+\.(?:PDF|pdf))/gi;
    for (const lm of block.matchAll(linkRegex)) {
      pdfLinks.push({ label: lm[1].trim(), url: lm[2] });
    }

    const examUrl = pdfLinks.find(l => /examination/i.test(l.label))?.url || null;
    const markingKeyUrl = pdfLinks.find(l => /marking/i.test(l.label))?.url || null;
    const reportUrl = pdfLinks.find(l => /report/i.test(l.label))?.url || null;

    years.push({ year, examUrl, markingKeyUrl, reportUrl, allLinks: pdfLinks, content: block.trim().slice(0, 2000) });
  }
  return years;
}

async function main() {
  console.info('=== WACE English Past Papers Ingestion ===\n');

  const { data: syllabi } = await supabase.from('syllabi')
    .select('id').eq('board', 'SCSA').eq('subject', 'English').single();
  if (!syllabi) { console.error('WACE English syllabus not found.'); process.exit(1); }
  const syllabusId = syllabi.id;

  console.info('Scraping SCSA English page...');
  const markdown = await scrape(WACE_PAGE);
  const yearData = extractYearData(markdown);

  console.info(`Found ${yearData.length} years.\n`);

  let totalPapers = 0;
  for (const yd of yearData) {
    console.info(`Processing ${yd.year}...`);
    try {
      const { data: paper, error: paperErr } = await supabase.from('past_papers').upsert({
        syllabus_id: syllabusId,
        year: yd.year,
        paper_type: 'WACE',
        source_url: yd.examUrl || WACE_PAGE,
        raw_text: yd.content,
        parsed_questions: yd.allLinks.map(l => ({ label: l.label, url: l.url })),
        marker_notes: yd.markingKeyUrl ? `Marking key: ${yd.markingKeyUrl}` : null,
      }, { onConflict: 'syllabus_id,year,paper_type' }).select('id').single();

      if (paperErr) {
        console.warn(`  Failed ${yd.year}:`, paperErr.message);
        continue;
      }

      await supabase.from('past_questions').delete().eq('paper_id', paper.id);
      await supabase.from('past_questions').insert({
        paper_id: paper.id,
        question_number: 1,
        question_text: `WACE English ATAR ${yd.year} Written Examination`,
        marks: null,
        question_type: 'full_paper',
        sample_response_text: yd.reportUrl ? `Exam report: ${yd.reportUrl}` : null,
      });

      totalPapers++;
      console.info(`  ${yd.year}: exam=${yd.examUrl ? 'found' : 'missing'}, key=${yd.markingKeyUrl ? 'found' : 'missing'}, report=${yd.reportUrl ? 'found' : 'missing'}`);
    } catch (err) {
      console.warn(`  Error on ${yd.year}:`, err.message);
    }
  }

  console.info(`\n=== Done === ${totalPapers} years ingested.`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
