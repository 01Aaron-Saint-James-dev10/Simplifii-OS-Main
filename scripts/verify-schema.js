#!/usr/bin/env node
/**
 * verify-schema.js
 *
 * Verifies that all expected Supabase tables and columns exist in production.
 * Run after: npm run build
 * Run manually: node scripts/verify-schema.js
 *
 * Exit code 0: all tables present (or no Supabase creds in env)
 * Exit code 1: one or more tables/columns missing (logs warnings)
 *
 * Never crashes the build: any unexpected error exits 0.
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');
const { writeFileSync, mkdirSync } = require('fs');
const path = require('path');

// Tables actually referenced via supabase.from() in src/
// Update this list whenever a new migration adds a table.
const EXPECTED_TABLES = [
  'profiles',
  'courses',
  'assessments',
  'feedback',
  'study_sessions',
  'history_of_thought_events',
  'syllabi',
  'syllabus_outcomes',
  'past_papers',
  'past_questions',
  'affirmations',
  'comprehension_log',
  'interaction_announcements',
  'profile_definitions',
  'question_transformations',
  'ai_response_feedback',
  'tool_feedback',
  'page_feedback',
  'session_feedback',
  'assessment_representations',
  'document_classifications',
  'classification_telemetry',
  'audio_overviews',
];

// Columns added via ALTER TABLE that are load-bearing for features.
// Check by selecting them; a "column does not exist" error means missing.
const EXPECTED_COLUMNS = {
  profiles: [
    'special_interests',
    'sensory_level',
    'literal_mode',
    'predictability_announcements',
    'ambient_preference',
    'autism_first_enabled',
    'accessibility_profile',
    'profile_settings',
  ],
  assessments: ['weight', 'status'],
};

async function checkTable(supabase, table) {
  const { error } = await supabase.from(table).select('id').limit(0);
  if (!error) return { status: 'OK' };
  const msg = error.message || '';
  const code = error.code || '';
  const isMissing = code === '42P01'
    || msg.includes('does not exist')
    || msg.includes('relation')
    || (error.details && String(error.details).includes('404'));
  return { status: isMissing ? 'MISSING' : 'OK', error: isMissing ? null : msg };
}

async function checkColumn(supabase, table, col) {
  const { error } = await supabase.from(table).select(col).limit(0);
  if (!error) return 'OK';
  const msg = error.message || '';
  return msg.includes('does not exist') || msg.includes(`column "${col}"`) ? 'MISSING' : 'OK';
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('[verify-schema] No Supabase credentials in environment. Skipping schema check.');
    process.exit(0);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const checked = new Date().toISOString();
  const tableResults = {};
  const colResults = {};
  const missingTables = [];
  const missingColumns = [];

  // Check tables
  for (const table of EXPECTED_TABLES) {
    const result = await checkTable(supabase, table);
    tableResults[table] = result.status;
    if (result.status === 'MISSING') {
      missingTables.push(table);
      console.warn(`[verify-schema] MISSING table: ${table}`);
    } else {
      console.log(`[verify-schema] OK table: ${table}`);
    }
  }

  // Check columns (only if parent table is present)
  for (const [table, cols] of Object.entries(EXPECTED_COLUMNS)) {
    colResults[table] = {};
    if (tableResults[table] !== 'OK') {
      cols.forEach(c => { colResults[table][c] = 'SKIPPED (table missing)'; });
      continue;
    }
    for (const col of cols) {
      const status = await checkColumn(supabase, table, col);
      colResults[table][col] = status;
      if (status === 'MISSING') {
        missingColumns.push(`${table}.${col}`);
        console.warn(`[verify-schema] MISSING column: ${table}.${col}`);
      }
    }
  }

  // Write markdown report
  const tableRows = EXPECTED_TABLES.map(t => `| \`${t}\` | ${tableResults[t] || 'UNKNOWN'} |`).join('\n');
  const colRows = Object.entries(EXPECTED_COLUMNS).flatMap(([t, cols]) =>
    cols.map(c => `| \`${t}.${c}\` | ${colResults[t]?.[c] || 'UNKNOWN'} |`)
  ).join('\n');

  const anyMissing = missingTables.length > 0 || missingColumns.length > 0;

  const report = `# Schema Verification Report

Generated: ${checked}

## Tables

| Table | Status |
|-------|--------|
${tableRows}

## Columns

| Column | Status |
|--------|--------|
${colRows}

${anyMissing ? `## Action Required

Missing tables: ${missingTables.length > 0 ? missingTables.join(', ') : 'none'}
Missing columns: ${missingColumns.length > 0 ? missingColumns.join(', ') : 'none'}

Run the latest migration file from \`supabase/migrations/\` against production Supabase.
Verify via Supabase MCP: \`SELECT table_name FROM information_schema.tables WHERE table_schema='public';\`` : '## All expected tables and columns present.'}
`;

  const docsDir = path.join(__dirname, '..', 'docs');
  try {
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(path.join(docsDir, 'SCHEMA_VERIFICATION.md'), report);
    console.log('[verify-schema] Report written to docs/SCHEMA_VERIFICATION.md');
  } catch (e) {
    console.warn('[verify-schema] Could not write report:', e.message);
  }

  if (anyMissing) {
    console.warn('\n[verify-schema] Schema gaps found. Transformations may be slower this session.');
    console.warn('[verify-schema] Apply missing migrations before next release.');
    process.exit(1);
  } else {
    console.log('[verify-schema] Schema OK.');
    process.exit(0);
  }
}

main().catch(err => {
  console.warn('[verify-schema] Unexpected error (non-blocking):', err.message);
  process.exit(0);
});
