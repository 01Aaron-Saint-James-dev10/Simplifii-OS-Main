/**
 * ingest-nesa.js
 *
 * Ingests NESA HSC English Standard past paper data (2019-2024).
 * Scrapes the nsw.gov.au exam pack pages via /api/scrape (Firecrawl).
 * Extracts marking feedback + paper PDF URLs.
 * Inserts into past_papers + past_questions tables.
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/ingest-nesa.js
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

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019];
const BASE_URL = 'https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/english-standard';

async function scrape(url) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_KEY}`,
    },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
  });
  if (!response.ok) throw new Error(`Scrape failed ${response.status} for ${url}`);
  const data = await response.json();
  return data?.data?.markdown || '';
}

function parseQuestions(markdown) {
  const questions = [];
  // Match "#### Question N" blocks with content
  const qRegex = /####\s+Question\s+(\d+[a-z]?)\s*\n([\s\S]*?)(?=####\s+Question|$)/gi;
  for (const match of markdown.matchAll(qRegex)) {
    const num = match[1];
    const body = match[2].trim();
    if (body.length < 20) continue;
    questions.push({
      question_number: parseInt(num) || questions.length + 1,
      question_text: `Question ${num}`,
      marks: null,
      question_type: 'written',
      sample_response_text: body.slice(0, 2000),
    });
  }
  // Also match section headers like "Paper 1 - Section I: ..."
  const sectionRegex = /(?:Paper\s+\d+\s*[-–]\s*Section\s+\w+[:\s]+)(.*?)(?=\n)/gi;
  for (const match of markdown.matchAll(sectionRegex)) {
    const sectionName = match[1]?.trim();
    if (sectionName && !questions.find(q => q.question_text === sectionName)) {
      // Find the content after this header
      const idx = markdown.indexOf(match[0]);
      const block = markdown.slice(idx + match[0].length, idx + match[0].length + 1500);
      if (block.length > 50) {
        questions.push({
          question_number: questions.length + 1,
          question_text: sectionName,
          marks: null,
          question_type: 'section',
          sample_response_text: block.trim().slice(0, 2000),
        });
      }
    }
  }
  return questions;
}

function extractPdfUrls(markdown) {
  const urls = [];
  const pdfRegex = /\(([^)]+\.pdf)\)/gi;
  for (const match of markdown.matchAll(pdfRegex)) {
    urls.push(match[1]);
  }
  return urls;
}

async function main() {
  console.info('=== NESA HSC English Standard Ingestion ===\n');

  // Get the NESA English Standard syllabus ID
  const { data: syllabi } = await supabase.from('syllabi')
    .select('id').eq('board', 'NESA').eq('subject', 'English Standard').single();
  if (!syllabi) { console.error('NESA English Standard syllabus not found.'); process.exit(1); }
  const syllabusId = syllabi.id;

  let totalPapers = 0;
  let totalQuestions = 0;

  for (const year of YEARS) {
    const url = `${BASE_URL}/${year}`;
    console.info(`Scraping ${year}...`);
    try {
      const markdown = await scrape(url);
      if (!markdown || markdown.length < 200) {
        console.warn(`  Skipped ${year}: insufficient content (${markdown.length} chars)`);
        continue;
      }

      const pdfUrls = extractPdfUrls(markdown);
      const paperUrl = pdfUrls.find(u => /paper-1/i.test(u)) || pdfUrls[0] || null;
      const guidelinesUrl = pdfUrls.find(u => /mg|marking/i.test(u)) || null;
      const questions = parseQuestions(markdown);

      // Upsert paper
      const { data: paper, error: paperErr } = await supabase.from('past_papers').upsert({
        syllabus_id: syllabusId,
        year,
        paper_type: 'HSC',
        source_url: url,
        raw_text: markdown.slice(0, 50000),
        parsed_questions: questions,
        marker_notes: markdown.includes('better responses') ? 'Marker feedback available' : null,
      }, { onConflict: 'syllabus_id,year,paper_type' }).select('id').single();

      if (paperErr) {
        console.warn(`  Paper insert failed for ${year}:`, paperErr.message);
        continue;
      }

      totalPapers++;

      // Delete existing questions for this paper, then re-insert
      await supabase.from('past_questions').delete().eq('paper_id', paper.id);

      for (const q of questions) {
        const { error: qErr } = await supabase.from('past_questions').insert({
          paper_id: paper.id,
          ...q,
        });
        if (qErr) console.warn(`  Question insert failed:`, qErr.message);
        else totalQuestions++;
      }

      console.info(`  ${year}: ${questions.length} questions extracted, ${pdfUrls.length} PDFs found`);

      // Rate limit: wait 2s between scrapes
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.warn(`  Error on ${year}:`, err.message);
    }
  }

  console.info(`\n=== Done ===`);
  console.info(`Papers ingested: ${totalPapers}`);
  console.info(`Questions extracted: ${totalQuestions}`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
