// @ts-nocheck
// scripts/seed-brother-app.js
// Usage: node scripts/seed-brother-app.js <email>
// Creates an approved brother application so you can test the onboarding flow.

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/seed-brother-app.js <email>');
  process.exit(1);
}

const PASSWORD = 'Noodles@123';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findExistingUserId(email) {
  const { data: brotherApp } = await supabase
    .from('brother_application').select('user_id').eq('email', email).maybeSingle();
  if (brotherApp?.user_id) return brotherApp.user_id;

  const { data: sisterApp } = await supabase
    .from('sister_application').select('user_id').eq('email', email).maybeSingle();
  if (sisterApp?.user_id) return sisterApp.user_id;

  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return users?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())?.id || null;
}

async function deleteExistingUser(userId) {
  const { data: brotherProfile } = await supabase.from('brother').select('id').eq('user_id', userId).maybeSingle();
  const { data: sisterProfile } = await supabase.from('sister').select('id').eq('user_id', userId).maybeSingle();
  const profileId = brotherProfile?.id || sisterProfile?.id;
  const profileType = brotherProfile ? 'brother' : 'sister';

  if (profileId) {
    const { data: interests } = await supabase.from('interests').select('id')
      .or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`);
    if (interests?.length) {
      await supabase.from('question_responses').delete().in('interest_id', interests.map(i => i.id));
      await supabase.from('interests').delete().or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`);
    }
    await supabase.from('reference').delete().eq('user_id', profileId).eq('user_type', profileType);
    await supabase.from('imam_verification').delete().eq('user_id', profileId).eq('user_type', profileType);
  }

  await supabase.from('notifications').delete().eq('user_id', userId);
  await supabase.from('brother_application').delete().eq('user_id', userId);
  await supabase.from('sister_application').delete().eq('user_id', userId);
  await supabase.from('brother').delete().eq('user_id', userId);
  await supabase.from('sister').delete().eq('user_id', userId);
  await supabase.from('subscribers').delete().eq('user_id', userId);
  await supabase.auth.admin.deleteUser(userId);
  console.log(`  Deleted existing user ${userId}`);
}

async function run() {
  console.log(`\nCreating approved brother application for: ${email}\n`);

  const existingId = await findExistingUserId(email);
  if (existingId) {
    console.log('Found existing user — deleting...');
    await deleteExistingUser(existingId);
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (authError) throw new Error(`Auth user creation failed: ${authError.message}`);
  const userId = authData.user.id;
  console.log(`  Auth user created: ${userId}`);

  // Create approved brother application
  const { error: appError } = await supabase.from('brother_application').insert({
    user_id: userId,
    first_name: 'Adam',
    last_name: 'Test',
    email,
    phone_number: '+447368867021',
    nationality: 'United Kingdom',
    date_of_birth: '1995-01-15',
    status: 'approved',
  });
  if (appError) throw new Error(`Application insert failed: ${appError.message}`);
  console.log('  Brother application created (status: approved)');

  // Create subscriber
  await supabase.from('subscribers').insert({ user_id: userId, email, subscribed: true });
  console.log('  Subscriber created (paid: true)');

  console.log(`\nDone!`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Status:   Approved — ready for onboarding flow\n`);
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('ERROR:', err.message); process.exit(1); });
