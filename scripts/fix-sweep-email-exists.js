// @ts-nocheck
// scripts/fix-sweep-email-exists.js
//
// One-off remediation for sweep-pending-applications.js runs that hit
// AuthApiError "email_exists" (code 422). Root cause: send-welcome-email's
// admin.createUser() call throws on this SDK version instead of returning
// { error }, so its own "user already exists — look them up" fallback never
// runs, the function 500s, and the sweep script never marks the row
// approved or grants beta access.
//
// This script finds every still-pending legacy application whose email
// already has an auth user (confirmed via diagnose-sweep-failures.js) and
// finishes what send-welcome-email would have done for them: mirrors
// account_type into user_profile, grants the same beta_access subscriber
// row every other Sign Up gets, and marks the application approved so the
// sweep script stops retrying (and failing on) them.
//
// Does NOT touch auth.users metadata — application_type is already set
// correctly on all affected accounts (confirmed via diagnostic).
//
// Usage:
//   node scripts/fix-sweep-email-exists.js            (dry run)
//   node scripts/fix-sweep-email-exists.js --confirm   (apply)

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';

const confirm = process.argv.includes('--confirm');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listAllUsers() {
  let all = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    all = all.concat(data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  return all;
}

async function run() {
  const [{ data: brotherRows, error: bErr }, { data: sisterRows, error: sErr }] = await Promise.all([
    supabase.from('brother_application').select('id, email, first_name, last_name').eq('status', 'pending'),
    supabase.from('sister_application').select('id, email, first_name, last_name').eq('status', 'pending'),
  ]);
  if (bErr) throw bErr;
  if (sErr) throw sErr;

  const pending = [
    ...(brotherRows || []).map((r) => ({ ...r, type: 'brother', table: 'brother_application' })),
    ...(sisterRows || []).map((r) => ({ ...r, type: 'sister', table: 'sister_application' })),
  ];

  const users = await listAllUsers();
  const byEmail = new Map(users.map((u) => [u.email?.toLowerCase(), u]));

  const affected = pending
    .map((r) => ({ ...r, authUser: byEmail.get(r.email?.toLowerCase()) }))
    .filter((r) => r.authUser);

  if (affected.length === 0) {
    console.log('No stuck rows found (no pending application has a pre-existing auth user). Nothing to do.');
    return;
  }

  console.log(`Found ${affected.length} stuck row(s):\n`);
  for (const r of affected) {
    console.log(`  [${r.type}] ${r.email} — auth user ${r.authUser.id}`);
  }
  console.log('');

  if (!confirm) {
    console.log('Dry run only — no changes made. Re-run with --confirm to grant access and mark these approved.');
    return;
  }

  for (const r of affected) {
    const userId = r.authUser.id;
    try {
      const { error: profileErr } = await supabase
        .from('user_profile')
        .upsert({ id: userId, account_type: r.type }, { onConflict: 'id' });
      if (profileErr) console.error(`    user_profile upsert failed for ${r.email}: ${profileErr.message}`);

      const { error: subErr } = await supabase
        .from('subscribers')
        .upsert({
          user_id: userId,
          email: r.email,
          subscribed: true,
          provider: 'manual',
          plan: 'beta_access',
          expires_at: '2030-01-01T00:00:00Z',
        }, { onConflict: 'user_id' });
      if (subErr) throw subErr;

      const { error: appErr } = await supabase
        .from(r.table)
        .update({ status: 'approved', reviewed_by: 'system-sweep-fix' })
        .eq('id', r.id);
      if (appErr) throw appErr;

      console.log(`  [${r.type}] ${r.email} — granted beta access, marked approved`);
    } catch (err) {
      console.error(`  [${r.type}] ${r.email} — ERROR: ${err.message}`);
    }
  }

  console.log('\nDone.');
}

run().then(() => process.exit(0)).catch((err) => { console.error('ERROR:', err.message); process.exit(1); });
