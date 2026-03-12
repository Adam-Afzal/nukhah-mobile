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

  // Create sister profile (fully onboarded)
  const slug = `Aisha-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const { data: sisterProfileData, error: profileError } = await supabase
    .from('sister')
    .insert({
      user_id: userId,
      username: 'aisha_test',
      slug,
      first_name: 'Aisha',
      last_name: 'A',
      phone: '+447368867022',
      date_of_birth: '1997-03-20',
      location_country: 'United Kingdom',
      location_city: 'London',
      build: 'hourglass',
      ethnicity: 'Arab',
      occupation: 'Student',
      marital_status: 'never_married',
      children: false,
      revert: false,
      disabilities: '',
      hobbies_and_interests: 'Reading, cooking, hiking',
      personality: 'Kind, caring, and motivated',
      prayer_consistency: '5x_daily',
      open_to_hijrah: true,
      open_to_reverts: true,
      open_to_polygyny: false,
      hijab_commitment: 'hijab',
      living_arrangements: 'Own home',
      preferred_ethnicity: ['Any'],
      other_spouse_criteria: '',
      dealbreakers: '',
      is_masjid_affiliated: null,
      wali_name: 'Ahmed A',
      wali_relationship: 'Father',
      wali_phone: '+447368867099',
      wali_email: 'wali@test.com',
      wali_preferred_contact: 'Phone',
    })
    .select('id')
    .single();

  if (profileError) {
    throw new Error(`Failed to create sister profile: ${profileError.message}`);
  }
  const sisterProfileId = sisterProfileData.id;
  console.log(`  Sister profile created: ${sisterProfileId}`);

  // Create subscriber (paid)
  const { error: subError } = await supabase
    .from('subscribers')
    .insert({ user_id: userId, email, subscribed: true });

  if (subError) {
    throw new Error(`Failed to create subscriber: ${subError.message}`);
  }
  console.log('  Subscriber created (subscribed: true)');

  // Look up Sunnah Nelson masjid
  const { data: masjidData } = await supabase
    .from('masjid')
    .select('id')
    .ilike('name', '%sunnah%nelson%')
    .maybeSingle();

  const { data: masjidDataAlt } = !masjidData ? await supabase
    .from('masjid')
    .select('id')
    .or('name.ilike.%sunnah%,city.ilike.%nelson%')
    .maybeSingle() : { data: null };

  const masjidId = masjidData?.id || masjidDataAlt?.id;

  if (masjidId) {
    // Get the imam for this masjid
    const { data: imamData } = await supabase
      .from('imam')
      .select('id')
      .eq('masjid_id', masjidId)
      .maybeSingle();

    // Create verified imam_verification row
    const { error: verifyError } = await supabase
      .from('imam_verification')
      .insert({
        user_id: sisterProfileId,
        user_type: 'sister',
        masjid_id: masjidId,
        imam_id: imamData?.id || null,
        status: 'verified',
        verified_at: new Date().toISOString(),
      });

    if (verifyError) {
      throw new Error(`Failed to create imam_verification: ${verifyError.message}`);
    }
    console.log(`  Imam verification created (verified, masjid: ${masjidId})`);

    // Update sister profile with masjid affiliation
    const { error: masjidUpdateError } = await supabase
      .from('sister')
      .update({ masjid_id: masjidId, is_masjid_affiliated: true })
      .eq('id', sisterProfileId);

    if (masjidUpdateError) {
      throw new Error(`Failed to update sister masjid: ${masjidUpdateError.message}`);
    }
    console.log('  Sister masjid affiliation updated');
  } else {
    console.log('  WARNING: Sunnah Nelson masjid not found, skipping imam verification');
  }

  // Create reference (so onboarding is complete)
  const { error: refError } = await supabase
    .from('reference')
    .insert({
      user_id: sisterProfileId,
      user_type: 'sister',
      reference_name: 'Test Reference',
      reference_phone: '+447368867000',
      reference_relationship: 'friend',
    });

  if (refError) {
    throw new Error(`Failed to create reference: ${refError.message}`);
  }
  console.log('  Reference created');

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
