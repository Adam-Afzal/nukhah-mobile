// @ts-nocheck
// scripts/delete-user.js
// Run this with: node scripts/delete-user.js <email>
// Deletes all data for the user without recreating them

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
if (!email) {
  console.error('Usage: node scripts/delete-user.js <email>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deleteUser() {
  console.log(`\nDeleting user: ${email}\n`);

  const { data: users } = await supabase.auth.admin.listUsers();
  const existingUser = users?.users.find((u) => u.email === email);

  if (!existingUser) {
    console.log('No user found with that email.');
    process.exit(0);
  }

  const userId = existingUser.id;
  console.log(`Found user: ${userId}`);

  // Get brother profile ID
  const { data: brotherProfile } = await supabase
    .from('brother')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  // Get sister profile ID
  const { data: sisterProfile } = await supabase
    .from('sister')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const profileId = brotherProfile?.id || sisterProfile?.id;
  const profileType = brotherProfile ? 'brother' : 'sister';

  // Delete records tied to profile ID
  if (profileId) {
    // Delete question_responses via interests
    const { data: interests } = await supabase
      .from('interests')
      .select('id')
      .or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`);

    if (interests && interests.length > 0) {
      const interestIds = interests.map((i) => i.id);
      await supabase
        .from('question_responses')
        .delete()
        .in('interest_id', interestIds);
      console.log('  Deleted question_responses');
    }

    await supabase
      .from('interests')
      .delete()
      .or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`);
    console.log('  Deleted interests');

    await supabase
      .from('reference')
      .delete()
      .eq('user_id', profileId)
      .eq('user_type', profileType);
    console.log('  Deleted references');

    await supabase
      .from('imam_verification')
      .delete()
      .eq('user_id', profileId)
      .eq('user_type', profileType);
    console.log('  Deleted imam_verification');
  }

  await supabase.from('notifications').delete().eq('user_id', userId);
  console.log('  Deleted notifications');

  await supabase.from('brother_application').delete().eq('user_id', userId);
  console.log('  Deleted brother_application');

  await supabase.from('sister_application').delete().eq('user_id', userId);
  console.log('  Deleted sister_application');

  await supabase.from('brother').delete().eq('user_id', userId);
  console.log('  Deleted brother profile');

  await supabase.from('sister').delete().eq('user_id', userId);
  console.log('  Deleted sister profile');

  await supabase.from('subscribers').delete().eq('user_id', userId);
  console.log('  Deleted subscriber');

  await supabase.from('user_profile').delete().eq('id', userId);
  console.log('  Deleted user_profile');

  await supabase.auth.admin.deleteUser(userId);
  console.log('  Deleted auth user');

  console.log(`\nUser deleted: ${email}\n`);
}

deleteUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
