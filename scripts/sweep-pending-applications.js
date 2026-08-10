// @ts-nocheck
// scripts/sweep-pending-applications.js
//
// Transition bridge for the Application system removal (see
// docs/adr/0001-wali-gate-enforced-at-database-level.md and
// nukhbah-web-main/docs/adr/0002-application-system-removal.md).
//
// The Admin Dashboard's Applications tab (and its "Approve" button) has been
// removed. Anyone still running the OLD mobile app version can still submit
// to the legacy rapid-endpoint/clever-task functions, which only insert a
// 'pending' brother_application/sister_application row — the auth account
// itself used to only get created when an admin clicked Approve. This script
// stands in for that button: for every still-pending legacy application, it
// creates the auth account (via send-welcome-email, same as Approve used to)
// and marks the row approved.
//
// This is a temporary bridge, not a permanent feature — run it manually as
// often as you like during the rollout window (old app usage will trickle
// to zero over time), then stop running it / delete it once nobody is left
// on the old app version.
//
// Usage:
//   node scripts/sweep-pending-applications.js            (dry run — lists what would happen)
//   node scripts/sweep-pending-applications.js --confirm   (actually creates accounts)

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
    supabase.from('brother_application').select('id, email, first_name, last_name, phone_number, date_of_birth, nationality').eq('status', 'pending'),
    supabase.from('sister_application').select('id, email, first_name, last_name, phone_number, date_of_birth, nationality').eq('status', 'pending'),
  ]);

  if (brotherErr) throw brotherErr;
  if (sisterErr) throw sisterErr;

  return [
    ...(brotherRows || []).map((r) => ({ ...r, type: 'brother' })),
    ...(sisterRows || []).map((r) => ({ ...r, type: 'sister' })),
  ];
}

async function run() {
  const pending = await collectPending();

  if (pending.length === 0) {
    console.log('No pending legacy applications found. Nothing to do.');
    return;
  }

  console.log(`Found ${pending.length} pending legacy application(s):\n`);
  pending.forEach((r) => {
    console.log(`  [${r.type}] ${r.email} (${r.first_name} ${r.last_name})`);
  });
  console.log('');

  if (!confirm) {
    console.log('Dry run only — no changes made. Re-run with --confirm to create these accounts and approve them.');
    return;
  }

  for (const r of pending) {
    const tableName = r.type === 'brother' ? 'brother_application' : 'sister_application';

    try {
      // Same call the old "Approve" button made — no userId, so send-welcome-email
      // falls back to creating the auth account itself.
      const { error: emailErr } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: r.email,
          firstName: r.first_name,
          lastName: r.last_name,
          accountType: r.type,
          phoneNumber: r.phone_number,
          dateOfBirth: r.date_of_birth,
          nationality: r.nationality,
        },
      });
      if (emailErr) throw emailErr;

      await supabase
        .from(tableName)
        .update({ status: 'approved', reviewed_by: 'system-sweep' })
        .eq('id', r.id);

      console.log(`  [${r.type}] ${r.email} — account created, marked approved`);

      // Best-effort approval SMS, same text the old Approve button sent — not
      // fatal if this function is unavailable.
      if (r.phone_number) {
        try {
          await supabase.functions.invoke('admin-send-sms', {
            body: {
              to: r.phone_number,
              message: `Assalamu Alaikum ${r.first_name}, your Mithaq application has been approved! Log in at joinmithaq.com to complete your profile. JazakAllahu Khairan.`,
              recipientName: `${r.first_name} ${r.last_name}`,
            },
          });
        } catch (smsErr) {
          console.log(`    (SMS not sent: ${smsErr.message})`);
        }
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
