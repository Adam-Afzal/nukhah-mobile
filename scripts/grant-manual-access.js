// @ts-nocheck
// scripts/grant-manual-access.js
// Run this with: node scripts/grant-manual-access.js <email> <plan>
//
// Gives a specific user permanent free access via the same 'manual' provider
// mechanism send-welcome-email uses for the beta_access auto-grant (see
// supabase/functions/send-welcome-email/index.ts and the beta_workarounds
// memory notes). check-subscription skips the real Stripe check entirely for
// provider='manual', so this account stays free regardless of Global Testing
// Mode or the payment gate.
//
// Use a plan name OTHER than 'beta_access' (e.g. 'staff', 'apple_tester') so
// this row is never touched by the beta-access expiry cleanup:
//   UPDATE subscribers SET subscribed = false WHERE provider = 'manual' AND plan = 'beta_access';
//
// Usage:
//   node scripts/grant-manual-access.js tester@apple.com apple_tester

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

const email = process.argv[2];
const plan = process.argv[3];

if (!email || !plan) {
  console.error('Usage: node scripts/grant-manual-access.js <email> <plan>');
  console.error('Example: node scripts/grant-manual-access.js tester@apple.com apple_tester');
  process.exit(1);
}

if (plan === 'beta_access') {
  console.error('Refusing to use plan "beta_access" — that value is reserved for the auto-grant');
  console.error('and will get swept up by the beta-access expiry cleanup. Pick a different name.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = users?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error(`No auth user found with email ${email}`);
    process.exit(1);
  }

  const { error } = await supabase.from('subscribers').upsert({
    user_id: user.id,
    email,
    subscribed: true,
    provider: 'manual',
    plan,
    expires_at: '2099-01-01T00:00:00Z',
  }, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to grant access:', error.message);
    process.exit(1);
  }

  console.log(`Granted permanent '${plan}' access to ${email} (user_id: ${user.id})`);
}

run().then(() => process.exit(0));
