// @ts-nocheck
// scripts/cleanup-duplicate-pending-applications.js
//
// Some brother_application/sister_application rows share the same email
// while still sitting at status='pending' — repeat or incomplete submission
// attempts from the old apply flow. This finds every email with more than
// one pending row (checked across both tables combined, since someone could
// have submitted under either type), and for each: hard-deletes any existing
// auth.users account tied to that email or to any of the duplicate rows'
// user_id, then deletes every pending row for that email. No partial state
// is kept — they sign up again from scratch via the new Sign Up flow.
//
// Only 'pending' rows are touched. Already-approved or already-rejected
// applications are left alone (the rejected ones have their own cutover
// script — see cutover-delete-rejected-applications.js).
//
// Usage:
//   node scripts/cleanup-duplicate-pending-applications.js            (dry run — lists what would happen)
//   node scripts/cleanup-duplicate-pending-applications.js --confirm  (actually deletes)

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

async function collectPending() {
  const [{ data: brotherRows, error: brotherErr }, { data: sisterRows, error: sisterErr }] = await Promise.all([
    supabase.from('brother_application').select('id, email, user_id').eq('status', 'pending'),
    supabase.from('sister_application').select('id, email, user_id').eq('status', 'pending'),
  ]);

  if (brotherErr) throw brotherErr;
  if (sisterErr) throw sisterErr;

  return [
    ...(brotherRows || []).map((r) => ({ ...r, table: 'brother_application' })),
    ...(sisterRows || []).map((r) => ({ ...r, table: 'sister_application' })),
  ];
}

function groupByEmail(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!row.email) continue;
    const key = row.email.toLowerCase().trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

async function findAuthUserIds(email, rows) {
  const ids = new Set(rows.map((r) => r.user_id).filter(Boolean));

  // Also check by email directly, in case a row's user_id was never linked.
  const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = listData?.users?.find((u) => u.email?.toLowerCase() === email);
  if (found) ids.add(found.id);

  return Array.from(ids);
}

async function run() {
  const pending = await collectPending();
  const groups = groupByEmail(pending);
  const duplicates = Array.from(groups.entries()).filter(([, rows]) => rows.length > 1);

  if (duplicates.length === 0) {
    console.log('No duplicate pending applications found. Nothing to do.');
    return;
  }

  console.log(`Found ${duplicates.length} email(s) with duplicate pending applications:\n`);
  for (const [email, rows] of duplicates) {
    console.log(`  ${email} — ${rows.length} rows: ${rows.map((r) => `${r.table}#${r.id}`).join(', ')}`);
  }
  console.log('');

  if (!confirm) {
    console.log('Dry run only — no changes made. Re-run with --confirm to delete these rows and their auth accounts.');
    return;
  }

  for (const [email, rows] of duplicates) {
    try {
      const userIds = await findAuthUserIds(email, rows);

      for (const userId of userIds) {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) {
          console.log(`  ${email} — auth delete (${userId}): ${error.message}`);
        } else {
          console.log(`  ${email} — deleted auth user ${userId}`);
        }
      }

      for (const row of rows) {
        await supabase.from(row.table).delete().eq('id', row.id);
      }
      console.log(`  ${email} — deleted ${rows.length} pending row(s)`);
    } catch (err) {
      console.error(`  ${email} — ERROR: ${err.message}`);
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
