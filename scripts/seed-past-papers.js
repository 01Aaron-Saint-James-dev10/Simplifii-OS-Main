#!/usr/bin/env node
/**
 * seed-past-papers.js
 *
 * Scrapes publicly available past exam papers from Australian state
 * examination authorities and seeds them into the past_questions table.
 *
 * Authorities:
 * - NESA (NSW): https://educationstandards.nsw.edu.au/wps/portal/nesa/resource-finder
 * - VCAA (VIC): https://www.vcaa.vic.edu.au/assessment/vce-assessment/past-examinations
 * - QCAA (QLD): https://www.qcaa.qld.edu.au/senior/senior-subjects
 * - SCSA (WA): https://senior-secondary.scsa.wa.edu.au/further-resources/past-atar-course-exams
 *
 * Usage: node scripts/seed-past-papers.js [--state nsw|vic|qld|wa|all] [--subject biology]
 *
 * Requires: FIRECRAWL_API_KEY in env (for URL scraping)
 *           SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env
 */

const STATE_CONFIGS = {
  nsw: {
    name: 'NESA (NSW)',
    authority: 'NESA',
    baseUrl: 'https://educationstandards.nsw.edu.au',
    examPrefix: 'HSC',
    resourceFinderUrl: 'https://educationstandards.nsw.edu.au/wps/portal/nesa/resource-finder/hsc-exam-papers',
    subjects: [
      'Biology', 'Chemistry', 'Physics', 'Mathematics Standard',
      'Mathematics Advanced', 'English Standard', 'English Advanced',
      'Modern History', 'Ancient History', 'Geography', 'Economics',
      'Legal Studies', 'Business Studies', 'PDHPE', 'Visual Arts',
      'Music', 'Drama', 'Society and Culture', 'Studies of Religion',
    ],
    yearRange: [2019, 2020, 2021, 2022, 2023, 2024, 2025],
  },
  vic: {
    name: 'VCAA (VIC)',
    authority: 'VCAA',
    baseUrl: 'https://www.vcaa.vic.edu.au',
    examPrefix: 'VCE',
    subjects: [
      'Biology', 'Chemistry', 'Physics', 'Mathematical Methods',
      'Specialist Mathematics', 'English', 'History Revolutions',
      'Geography', 'Economics', 'Legal Studies', 'Business Management',
      'Health and Human Development', 'Physical Education',
    ],
    yearRange: [2019, 2020, 2021, 2022, 2023, 2024],
  },
  qld: {
    name: 'QCAA (QLD)',
    authority: 'QCAA',
    baseUrl: 'https://www.qcaa.qld.edu.au',
    examPrefix: 'QCE',
    subjects: [
      'Biology', 'Chemistry', 'Physics', 'General Mathematics',
      'Mathematical Methods', 'English', 'Modern History',
      'Geography', 'Economics', 'Legal Studies',
    ],
    yearRange: [2020, 2021, 2022, 2023, 2024],
  },
  wa: {
    name: 'SCSA (WA)',
    authority: 'SCSA',
    baseUrl: 'https://senior-secondary.scsa.wa.edu.au',
    examPrefix: 'WACE',
    subjects: [
      'Biology', 'Chemistry', 'Physics', 'Mathematics Applications',
      'Mathematics Methods', 'English', 'Modern History',
      'Geography', 'Economics', 'Human Biology',
    ],
    yearRange: [2019, 2020, 2021, 2022, 2023, 2024],
  },
};

async function scrapeExamPaper(url, firecrawlKey) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${firecrawlKey}`,
    },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data?.data?.markdown || null;
}

function parseQuestionsFromText(text, subject, year, state) {
  if (!text) return [];
  const questions = [];
  // Generic question pattern: "Question N" or "N." followed by text and "(X marks)"
  const pattern = /(?:Question\s+(\d+)|^(\d+)\.)\s*([\s\S]*?)(?:\((\d+)\s*marks?\))/gim;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const num = match[1] || match[2];
    const questionText = (match[3] || '').trim();
    const marks = parseInt(match[4] || '0', 10);
    if (questionText.length > 20 && marks > 0) {
      questions.push({
        question_number: parseInt(num, 10),
        question_text: questionText.slice(0, 2000),
        marks,
        subject,
        exam_year: year,
        state: state.toUpperCase(),
        difficulty: marks <= 2 ? 'easy' : marks <= 5 ? 'medium' : 'hard',
      });
    }
  }
  return questions;
}

async function seedState(stateKey, options = {}) {
  const config = STATE_CONFIGS[stateKey];
  if (!config) { console.error(`Unknown state: ${stateKey}`); return; }

  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!firecrawlKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing env vars: FIRECRAWL_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Dynamic import for Supabase
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const targetSubject = options.subject;
  const subjects = targetSubject
    ? config.subjects.filter(s => s.toLowerCase().includes(targetSubject.toLowerCase()))
    : config.subjects;

  console.log(`\n[${config.name}] Seeding ${subjects.length} subjects...`);
  let totalInserted = 0;

  for (const subject of subjects) {
    for (const year of config.yearRange) {
      // Build likely URL pattern (varies by authority)
      const searchUrl = `${config.baseUrl}/search?q=${encodeURIComponent(`${subject} ${year} exam paper`)}`;
      console.log(`  Scraping: ${subject} ${year}...`);

      try {
        const text = await scrapeExamPaper(searchUrl, firecrawlKey);
        if (!text) { console.log(`    No content found.`); continue; }

        const questions = parseQuestionsFromText(text, subject, year, stateKey);
        if (questions.length === 0) { console.log(`    No questions parsed.`); continue; }

        const { error } = await supabase.from('past_questions').insert(questions);
        if (error) { console.log(`    DB error: ${error.message}`); continue; }

        totalInserted += questions.length;
        console.log(`    Inserted ${questions.length} questions.`);
      } catch (err) {
        console.log(`    Error: ${err.message}`);
      }

      // Rate limit: 1 request per 2 seconds
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n[${config.name}] Done. Total inserted: ${totalInserted}`);
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  const stateArg = args.find(a => a.startsWith('--state='))?.split('=')[1] || 'all';
  const subjectArg = args.find(a => a.startsWith('--subject='))?.split('=')[1] || null;

  const states = stateArg === 'all' ? Object.keys(STATE_CONFIGS) : [stateArg];

  for (const state of states) {
    await seedState(state, { subject: subjectArg });
  }

  console.log('\nSeeding complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
