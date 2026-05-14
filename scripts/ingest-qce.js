/**
 * ingest-qce.js
 *
 * Ingests QCE English past paper data (2019-2025).
 * Scrapes the QCAA English SEE page via Firecrawl.
 * Extracts question book + marking guide PDF URLs per year.
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... FIRECRAWL_API_KEY=... node scripts/ingest-qce.js
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

const QCE_PAGE = 'https://www.qcaa.qld.edu.au/senior/see/subject-resources/english';

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
  const yearRegex = /#{3}\s*(\d{4})\s*\n([\s\S]*?)(?=#{3}\s*\d{4}|#{2}\s|$)/gi;
  for (const match of markdown.matchAll(yearRegex)) {
    const year = parseInt(match[1]);
    const block = match[2];
    if (year < 2019 || year > 2026) continue;

    const pdfLinks = [];
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+\.pdf)\)/gi;
    for (const lm of block.matchAll(linkRegex)) {
      pdfLinks.push({ label: lm[1].trim(), url: lm[2] });
    }

    const questionBooks = pdfLinks.filter(l => /question/i.test(l.label));
    const markingGuides = pdfLinks.filter(l => /mark/i.test(l.label));

    years.push({
      year,
      questionBooks,
      markingGuides,
      allLinks: pdfLinks,
      content: block.trim().slice(0, 3000),
    });
  }
  return years;
}

async function main() {
  console.info('=== QCE English Past Papers Ingestion ===\n');

  const { data: syllabi } = await supabase.from('syllabi')
    .select('id').eq('board', 'QCAA').eq('subject', 'English').single();
  if (!syllabi) { console.error('QCE English syllabus not found.'); process.exit(1); }
  const syllabusId = syllabi.id;

  console.info('Scraping QCAA English page...');
  const markdown = await scrape(QCE_PAGE);
  const yearData = extractYearData(markdown);

  console.info(`Found ${yearData.length} years.\n`);

  let totalPapers = 0;
  for (const yd of yearData) {
    console.info(`Processing ${yd.year}...`);
    try {
      const primaryUrl = yd.questionBooks[0]?.url || yd.allLinks[0]?.url || QCE_PAGE;
      const guideUrl = yd.markingGuides[0]?.url || null;

      const { data: paper, error: paperErr } = await supabase.from('past_papers').upsert({
        syllabus_id: syllabusId,
        year: yd.year,
        paper_type: 'QCE',
        source_url: primaryUrl,
        raw_text: yd.content,
        parsed_questions: yd.allLinks.map(l => ({ label: l.label, url: l.url })),
        marker_notes: guideUrl ? `Marking guide: ${guideUrl}` : null,
      }, { onConflict: 'syllabus_id,year,paper_type' }).select('id').single();

      if (paperErr) {
        console.warn(`  Failed ${yd.year}:`, paperErr.message);
        continue;
      }

      await supabase.from('past_questions').delete().eq('paper_id', paper.id);

      // Create entries for each question book
      let qNum = 0;
      for (const qb of yd.questionBooks) {
        qNum++;
        await supabase.from('past_questions').insert({
          paper_id: paper.id,
          question_number: qNum,
          question_text: qb.label,
          marks: null,
          question_type: 'paper_section',
          sample_response_text: guideUrl ? `Marking guide available: ${guideUrl}` : null,
        });
      }

      totalPapers++;
      console.info(`  ${yd.year}: ${yd.questionBooks.length} question books, ${yd.markingGuides.length} marking guides`);
    } catch (err) {
      console.warn(`  Error on ${yd.year}:`, err.message);
    }
  }

  console.info(`\n=== Done === ${totalPapers} years ingested.`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
