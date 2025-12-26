// @ts-nocheck
// scripts/seed-test-sister.js
// Run this with: node scripts/seed-test-sister.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // Also load .env

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure you have:');
  console.error('  - EXPO_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nAdd them to .env.local or .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_USER = {
  email: 'adamafzal117@gmail.com',
  password: 'Noodles@123',
  first_name: 'Aisha',
  last_name: 'A',
  phone_number: '+447368867022',
  date_of_birth: '1997-03-20',
  
  // Sister Application Fields
  where_is_allah: 'above the throne',
  aqeedah: 'athari',
  knowledge_source: 'in person',
  marital_status: 'never_married',
  divorce_reason: 'N/A',
  physical_fitness: 'exercise regularly',
  current_location: 'London, United Kingdom',
  preferred_region: 'worldwide',
  halal_command_response: 'I hear and I obey',
  jump_command_response: 'yes, with wisdom and guidance from wali',
  has_social_media: false,
  wali_onboard: 'yes',
  shariah_covering_description: 'full jilbab and niqab',
  personal_covering: 'covering_according_to_shariah',
  listens_to_hijabi_influencers: false,
  open_to_polygyny: true,
  ethnicity: ['Arab'],
  preferred_ethnicity: ['Pakistani', 'Arab'],
};

/**
 * Delete existing user and all related data
 * @param {string} email - User email to delete
 */
async function deleteExistingUser(email) {
  console.log(`🗑️  Checking for existing user with email: ${email}`);
  
  // Get user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  /** @type {import('@supabase/supabase-js').User | undefined} */
  const existingUser = users?.users.find((/** @type {any} */ u) => u.email === email);
  
  if (existingUser) {
    console.log(`   Found existing user: ${existingUser.id}`);
    
    // Get brother profile ID (if exists) for cleaning up related records
    const { data: brotherProfile } = await supabase
      .from('brother')
      .select('id')
      .eq('user_id', existingUser.id)
      .maybeSingle();
    
    // Get sister profile ID (if exists) for cleaning up related records
    const { data: sisterProfile } = await supabase
      .from('sister')
      .select('id')
      .eq('user_id', existingUser.id)
      .maybeSingle();
    
    const profileId = brotherProfile?.id || sisterProfile?.id;
    const profileType = brotherProfile ? 'brother' : 'sister';
    
    // Delete related records if profile exists
    if (profileId) {
      // Delete references
      await supabase
        .from('reference')
        .delete()
        .eq('user_id', profileId)
        .eq('user_type', profileType);
      console.log('   ✓ Deleted references');
      
      // Delete imam verification
      await supabase
        .from('imam_verification')
        .delete()
        .eq('user_id', profileId)
        .eq('user_type', profileType);
      console.log('   ✓ Deleted imam_verification');
    }
    
    // Delete brother application
    await supabase
      .from('brother_application')
      .delete()
      .eq('user_id', existingUser.id);
    console.log('   ✓ Deleted brother_application');
    
    // Delete sister application
    await supabase
      .from('sister_application')
      .delete()
      .eq('user_id', existingUser.id);
    console.log('   ✓ Deleted sister_application');
    
    // Delete brother profile (if exists)
    await supabase
      .from('brother')
      .delete()
      .eq('user_id', existingUser.id);
    console.log('   ✓ Deleted brother profile');
    
    // Delete sister profile (if exists)
    await supabase
      .from('sister')
      .delete()
      .eq('user_id', existingUser.id);
    console.log('   ✓ Deleted sister profile');
    
    // Delete subscriber (if exists)
    const { error: subDeleteError } = await supabase
      .from('subscribers')
      .delete()
      .eq('user_id', existingUser.id);
    if (subDeleteError) {
      console.log('   ⚠️  Error deleting subscriber:', subDeleteError.message);
    } else {
      console.log('   ✓ Deleted subscriber');
    }
    
    // Delete user-profile (if exists) - uses 'id' not 'user_id'
    const { error: profileDeleteError } = await supabase
      .from('user_profile')
      .delete()
      .eq('id', existingUser.id);
    if (profileDeleteError) {
      console.log('   ⚠️  Error deleting user_profile:', profileDeleteError.message);
    } else {
      console.log('   ✓ Deleted user_profile');
    }
    
    // Delete auth user
    await supabase.auth.admin.deleteUser(existingUser.id);
    console.log('   ✓ Deleted auth user');
    
    console.log('✅ Existing user cleaned up\n');
  } else {
    console.log('   No existing user found\n');
  }
}

async function createTestUser() {
  console.log('🚀 Creating test sister application...\n');
  
  try {
    // Step 1: Delete existing user if present
    await deleteExistingUser(TEST_USER.email);
    
    // Step 2: Create auth user
    console.log('👤 Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
    });
    
    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }
    
    const userId = authData.user.id;
    console.log(`   ✓ Auth user created: ${userId}\n`);
    
    // Step 3: Create sister application
    console.log('📝 Creating sister application...');
    const { error: appError } = await supabase
      .from('sister_application')
      .insert({
        user_id: userId,
        first_name: TEST_USER.first_name,
        last_name: TEST_USER.last_name,
        email: TEST_USER.email,
        phone_number: TEST_USER.phone_number,
        date_of_birth: TEST_USER.date_of_birth,
        where_is_allah: TEST_USER.where_is_allah,
        aqeedah: TEST_USER.aqeedah,
        knowledge_source: TEST_USER.knowledge_source,
        marital_status: TEST_USER.marital_status,
        divorce_reason: TEST_USER.divorce_reason,
        physical_fitness: TEST_USER.physical_fitness,
        current_location: TEST_USER.current_location,
        preferred_region: TEST_USER.preferred_region,
        halal_command_response: TEST_USER.halal_command_response,
        jump_command_response: TEST_USER.jump_command_response,
        has_social_media: TEST_USER.has_social_media,
        wali_onboard: TEST_USER.wali_onboard,
        shariah_covering_description: TEST_USER.shariah_covering_description,
        personal_covering: TEST_USER.personal_covering,
        listens_to_hijabi_influencers: TEST_USER.listens_to_hijabi_influencers,
        open_to_polygyny: TEST_USER.open_to_polygyny,
        ethnicity: TEST_USER.ethnicity,
        preferred_ethnicity: TEST_USER.preferred_ethnicity,
        status: 'pending',
      });
    
    if (appError) {
      throw new Error(`Failed to create application: ${appError.message}`);
    }
    
    console.log('   ✓ Sister application created (status: pending)\n');
    
    // Success!
    console.log('✅ TEST SISTER USER CREATED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════');
    console.log('Login Credentials:');
    console.log(`  Email:    ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log('═══════════════════════════════════════════');
    console.log('User Status:');
    console.log('  ⏳ Application: PENDING');
    console.log('  → Admin needs to approve in admin panel');
    console.log('═══════════════════════════════════════════\n');
    console.log('💡 Next steps:');
    console.log('   1. Approve application in admin panel');
    console.log('   2. Login with credentials above');
    console.log('   3. Complete payment (or enable testing_mode)');
    console.log('   4. Complete profile setup\n');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Run the script
createTestUser()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });