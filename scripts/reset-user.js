// @ts-nocheck
// scripts/reset-user.js
// Run this with: node scripts/reset-user.js <email>
// Deletes all data for the user and recreates them with password Noodles@123

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('Make sure you have EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or .env.local');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/reset-user.js <email>');
  process.exit(1);
}

const PASSWORD = 'Noodles@123';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetUser() {
  console.log(`\nResetting user: ${email}\n`);

  // Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const existingUser = users?.users.find((u) => u.email === email);

  if (existingUser) {
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

      // Delete interests (as requester or recipient)
      await supabase
        .from('interests')
        .delete()
        .or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`);
      console.log('  Deleted interests');

      // Delete references
      await supabase
        .from('reference')
        .delete()
        .eq('user_id', profileId)
        .eq('user_type', profileType);
      console.log('  Deleted references');

      // Delete imam_verification
      await supabase
        .from('imam_verification')
        .delete()
        .eq('user_id', profileId)
        .eq('user_type', profileType);
      console.log('  Deleted imam_verification');
    }

    // Delete notifications (uses auth user_id)
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    console.log('  Deleted notifications');

    // Delete brother_application
    await supabase
      .from('brother_application')
      .delete()
      .eq('user_id', userId);
    console.log('  Deleted brother_application');

    // Delete sister_application
    await supabase
      .from('sister_application')
      .delete()
      .eq('user_id', userId);
    console.log('  Deleted sister_application');

    // Delete brother profile
    await supabase
      .from('brother')
      .delete()
      .eq('user_id', userId);
    console.log('  Deleted brother profile');

    // Delete sister profile
    await supabase
      .from('sister')
      .delete()
      .eq('user_id', userId);
    console.log('  Deleted sister profile');

    // Delete subscriber
    await supabase
      .from('subscribers')
      .delete()
      .eq('user_id', userId);
    console.log('  Deleted subscriber');

    // Delete user_profile (uses 'id' not 'user_id')
    await supabase
      .from('user_profile')
      .delete()
      .eq('id', userId);
    console.log('  Deleted user_profile');

    // Delete auth user
    await supabase.auth.admin.deleteUser(userId);
    console.log('  Deleted auth user');

    console.log('\nAll data deleted.');
  } else {
    console.log('No existing user found, creating fresh.');
  }

  // Recreate auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    throw new Error(`Failed to create user: ${authError.message}`);
  }

  const userId = authData.user.id;
  console.log(`Auth user created: ${userId}`);

  // Create sister application
  const { error: appError } = await supabase
    .from('sister_application')
    .insert({
      user_id: userId,
      first_name: 'Aisha',
      last_name: 'A',
      nationality: 'United Kingdom',
      email: email,
      phone_number: '+447368867022',
      date_of_birth: '1997-03-20',
      has_wali: true,
      wali_first_name: 'Ahmed',
      wali_last_name: 'A',
      wali_email: 'wali@test.com',
      wali_phone: '+447368867099',
      status: 'approved',
    });

  if (appError) {
    throw new Error(`Failed to create sister application: ${appError.message}`);
  }
  console.log('  Sister application created (status: approved)');

  console.log(`\nUser reset complete!`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${PASSWORD}\n`);
}

resetUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
