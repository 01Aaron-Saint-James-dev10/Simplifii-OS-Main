/**
 * seed-test-users.js
 *
 * Creates 3 test users for the pre-testing sprint.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Usage: node scripts/seed-test-users.js
 *
 * Idempotent: if a user exists, deletes and recreates them.
 */

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const SUPABASE_URL = 'https://aqcreatryuvuuynwvnqy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set.');
  console.error('Add it to .env.local from Supabase Dashboard > Project Settings > API > service_role.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  {
    email: 'test1.fresh@simplifii.test',
    password: 'TestUser123!',
    profile: {
      tier: null,
      onboarding_completed: false,
      acknowledged_disclaimers: false,
      display_name: 'Test Fresh',
      preferences: {},
    },
    courses: [],
    expectedRoute: '/onboarding',
  },
  {
    email: 'test2.onboarded@simplifii.test',
    password: 'TestUser123!',
    profile: {
      tier: 'tertiary',
      onboarding_completed: true,
      acknowledged_disclaimers: true,
      display_name: 'Test Onboarded',
      preferences: { font: 'atkinson', bionicText: 'light', reducedMotion: false, highContrast: false },
    },
    courses: [],
    expectedRoute: '/app (EmptyWorkspace with tertiary copy)',
  },
  {
    email: 'test3.postgrad@simplifii.test',
    password: 'TestUser123!',
    profile: {
      tier: 'postgrad',
      onboarding_completed: true,
      acknowledged_disclaimers: true,
      display_name: 'Test Postgrad',
      preferences: { font: 'opendyslexic', bionicText: 'medium', reducedMotion: true, highContrast: false },
    },
    courses: [
      {
        name: 'MRes Thesis: UDL 3.0 Adoption',
        code: 'MRES2026',
        tier: 'postgrad',
        term: 'Year-long',
        assessments: [
          { title: 'Chapter 5: Findings (Interviews)', due_date: '2026-07-15', status: 'draft' },
        ],
      },
    ],
    expectedRoute: '/app (sees course card)',
  },
];

async function deleteUserByEmail(email) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = data?.users?.find(u => u.email === email);
  if (existing) {
    await supabase.auth.admin.deleteUser(existing.id);
    console.log(`  Deleted existing user: ${email}`);
  }
}

async function seedUser(spec) {
  console.log(`\nSeeding: ${spec.email}`);

  await deleteUserByEmail(spec.email);

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: spec.email,
    password: spec.password,
    email_confirm: true,
    user_metadata: {
      display_name: spec.profile.display_name,
      tier: spec.profile.tier || 'university',
    },
  });
  if (authErr) throw new Error(`Auth create failed for ${spec.email}: ${authErr.message}`);

  const userId = authData.user.id;
  console.log(`  Created auth user: ${userId}`);

  // The handle_new_user trigger auto-creates a profile row.
  // Update it with our test-specific values.
  const { error: profileErr } = await supabase.from('profiles').update({
    tier: spec.profile.tier,
    onboarding_completed: spec.profile.onboarding_completed,
    acknowledged_disclaimers: spec.profile.acknowledged_disclaimers,
    display_name: spec.profile.display_name,
    preferences: spec.profile.preferences,
  }).eq('id', userId);
  if (profileErr) console.warn(`  Profile update warning: ${profileErr.message}`);

  for (const course of spec.courses) {
    const courseId = randomUUID();
    const { error: courseErr } = await supabase.from('courses').insert({
      id: courseId,
      user_id: userId,
      name: course.name,
      code: course.code || null,
      tier: course.tier || null,
      term: course.term || null,
    });
    if (courseErr) throw new Error(`Course insert failed: ${courseErr.message}`);
    console.log(`  Created course: ${course.name} (${courseId})`);

    for (const assess of course.assessments || []) {
      const assessId = randomUUID();
      const { error: assessErr } = await supabase.from('assessments').insert({
        id: assessId,
        course_id: courseId,
        title: assess.title,
        due_date: assess.due_date || null,
        status: assess.status || 'draft',
      });
      if (assessErr) console.warn(`  Assessment insert warning: ${assessErr.message}`);
      else console.log(`  Created assessment: ${assess.title} (${assessId})`);
    }
  }

  console.log(`  Expected route: ${spec.expectedRoute}`);
}

async function main() {
  console.log('=== Simplifii-OS Test User Seeder ===\n');
  for (const spec of USERS) {
    await seedUser(spec);
  }
  console.log('\n=== Done ===');
  console.log('\nLogin credentials:');
  for (const u of USERS) {
    console.log(`  ${u.email} / ${u.password} -> ${u.expectedRoute}`);
  }
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
