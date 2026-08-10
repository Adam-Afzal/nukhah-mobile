// @ts-nocheck
// scripts/cutover-delete-rejected-applications.js
//
// One-time cutover script for the Application system removal
// (see docs/adr/0001-wali-gate-enforced-at-database-level.md and
// nukhbah-web-main/docs/adr/0002-application-system-removal.md).
//
// Decision: for every brother_application / sister_application row with
// status = 'rejected', a human already made a judgment call — hard-delete the
// corresponding auth.users record. The application row itself stays in the
// database untouched, as historical record of the decision.
//
// This is NOT a repeatable feature — once the Applications review UI is gone,
// no new rejections can ever happen, so this script only needs to run once
// against the existing backlog of already-rejected applications.
//
// Usage:
//   node scripts/cutover-delete-rejected-applications.js            (dry run — lists what would happen)
//   node scripts/cutover-delete-rejected-applications.js --confirm  (actually deletes)

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('Make sure you have EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env or .env.local');
  process.exit(1);
}

const confirm = process.argv.includes('--confirm');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function collectRejected() {
  const [{ data: brotherRows, error: brotherErr }, { data: sisterRows, error: sisterErr }] = await Promise.all([
    supabase.from('brother_application').select('id, email, user_id').eq('status', 'rejected'),
    supabase.from('sister_application').select('id, email, user_id').eq('status', 'rejected'),
  ]);

  if (brotherErr) throw brotherErr;
  if (sisterErr) throw sisterErr;

  return [
    ...(brotherRows || []).map((r) => ({ ...r, type: 'brother' })),
    ...(sisterRows || []).map((r) => ({ ...r, type: 'sister' })),
  ];
}

async function run() {
  const rejected = await collectRejected();

  if (rejected.length === 0) {
    console.log('No rejected applications found. Nothing to do.');
    return;
  }

  console.log(`Found ${rejected.length} rejected application(s):\n`);
  rejected.forEach((r) => {
    console.log(`  [${r.type}] ${r.email} — user_id: ${r.user_id || 'MISSING'}`);
  });
  console.log('');

  if (!confirm) {
    console.log('Dry run only — no changes made. Re-run with --confirm to hard-delete these auth accounts.');
    console.log('The brother_application/sister_application rows are never touched — they stay as historical record.');
    return;
  }

  for (const r of rejected) {
    if (!r.user_id) {
      console.log(`  Skipping ${r.email} — no user_id on record, nothing to delete.`);
      continue;
    }

    try {
      // Orphaned once the auth user is gone — clean these up, but never the
      // application row itself.
      await supabase.from('user_profile').delete().eq('id', r.user_id);
      await supabase.from('subscribers').delete().eq('user_id', r.user_id);
      await supabase.from('notifications').delete().eq('user_id', r.user_id);

      const { error: deleteErr } = await supabase.auth.admin.deleteUser(r.user_id);
      if (deleteErr) {
        // Already deleted / never existed — not fatal for this script's purpose.
        console.log(`  [${r.type}] ${r.email} — auth delete: ${deleteErr.message}`);
      } else {
        console.log(`  [${r.type}] ${r.email} — auth user deleted`);
      }
    } catch (err) {
      console.error(`  [${r.type}] ${r.email} — ERROR: ${err.message}`);
    }
  }

  console.log('\nDone.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
