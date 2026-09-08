// @ts-nocheck
// scripts/backfill-missing-dob.js
//
// One-off backfill: brother/sister profiles with a NULL date_of_birth whose
// original brother_application/sister_application row (from before the
// Application system was removed) has a real date_of_birth on file — it
// was collected at application time but never carried over when the
// profile row was created via the legacy bridge/sweep flow. Age just never
// displays for these profiles; the data was never actually lost.
//
// Matches by email, case-insensitively (see
// 20260831000000_fix_application_approval_email_case.sql for the same
// case-sensitivity issue elsewhere in this bridge).
//
// Usage:
//   node scripts/backfill-missing-dob.js            (dry run)
//   node scripts/backfill-missing-dob.js --confirm   (apply)

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';
const confirm = process.argv.includes('--confirm');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  const [{ data: brothers }, { data: sisters }] = await Promise.all([
    supabase.from('brother').select('id, user_id, username').is('date_of_birth', null),
    supabase.from('sister').select('id, user_id, username').is('date_of_birth', null),
  ]);

  const missing = [
    ...(brothers || []).map((r) => ({ ...r, type: 'brother', table: 'brother', appTable: 'brother_application' })),
    ...(sisters || []).map((r) => ({ ...r, type: 'sister', table: 'sister', appTable: 'sister_application' })),
  ];

  if (missing.length === 0) {
    console.log('No profiles with missing date_of_birth found.');
    return;
  }

  const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map(users.users.map((u) => [u.id, u.email?.toLowerCase()]));

  const [{ data: bApps }, { data: sApps }] = await Promise.all([
    supabase.from('brother_application').select('email, date_of_birth'),
    supabase.from('sister_application').select('email, date_of_birth'),
  ]);
  const bByEmail = new Map((bApps || []).filter((a) => a.date_of_birth).map((a) => [a.email.toLowerCase(), a.date_of_birth]));
  const sByEmail = new Map((sApps || []).filter((a) => a.date_of_birth).map((a) => [a.email.toLowerCase(), a.date_of_birth]));

  const matched = [];
  const unmatched = [];

  for (const p of missing) {
    const email = emailById.get(p.user_id);
    const dob = email ? (p.type === 'brother' ? bByEmail : sByEmail).get(email) : undefined;
    if (dob) {
      matched.push({ ...p, dob });
    } else {
      unmatched.push(p);
    }
  }

  console.log(`${missing.length} profile(s) with missing date_of_birth. ${matched.length} recoverable from application data, ${unmatched.length} not found anywhere.\n`);

  matched.forEach((p) => console.log(`  [${p.type}] ${p.username} -> ${p.dob}`));
  if (unmatched.length) {
    console.log('\nNo recoverable date_of_birth found for:');
    unmatched.forEach((p) => console.log(`  [${p.type}] ${p.username}`));
  }

  if (!confirm) {
    console.log('\nDry run only — no changes made. Re-run with --confirm to apply.');
    return;
  }

  for (const p of matched) {
    const { error } = await supabase.from(p.table).update({ date_of_birth: p.dob }).eq('id', p.id);
    if (error) console.error(`  [${p.type}] ${p.username} — ERROR: ${error.message}`);
    else console.log(`  [${p.type}] ${p.username} — updated`);
  }
  console.log('\nDone.');
}

run().then(() => process.exit(0)).catch((err) => { console.error('ERROR:', err.message); process.exit(1); });
