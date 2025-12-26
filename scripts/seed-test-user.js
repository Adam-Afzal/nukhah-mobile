// @ts-nocheck
// scripts/seed-test-user.js
// Run this with: node scripts/seed-test-user.js

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
  email: 'adam@righteousnrich.com',
  password: 'Noodles@123',
  first_name: 'Adam',
  last_name: 'A',
  phone_number: '+447368867021',
  date_of_birth: '1995-01-15',
  
  // Brother Application Fields
  where_is_allah: 'above the throne',
  aqeedah: 'athari',
  knowledge_source: 'in person',
  marital_status: 'married',
  divorce_reason: 'N/A',
  physical_fitness: 'gym 3x per week',
  wives_goal: 4,
  current_location: 'Manchester, United Kingdom',
  preferred_region: 'worldwide',
  annual_income: '£20,000',
  polygyny_justice_knowledge: 'yes',
  ethnicity: ['Pakistani'],
  preferred_ethnicity: ['Moroccan'],
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
    
    // Delete sister application (just in case)
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
  console.log('🚀 Creating test brother application...\n');
  
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
    
    // Step 3: Create brother application
    console.log('📝 Creating brother application...');
    const { error: appError } = await supabase
      .from('brother_application')
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
        wives_goal: TEST_USER.wives_goal,
        current_location: TEST_USER.current_location,
        preferred_region: TEST_USER.preferred_region,
        annual_income: TEST_USER.annual_income,
        polygyny_justice_knowledge: TEST_USER.polygyny_justice_knowledge,
        ethnicity: TEST_USER.ethnicity,
        preferred_ethnicity: TEST_USER.preferred_ethnicity,
        status: 'pending',
      });
    
    if (appError) {
      throw new Error(`Failed to create application: ${appError.message}`);
    }
    
    console.log('   ✓ Brother application created (status: approved)\n');
    
    // Success!
    console.log('✅ TEST USER CREATED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════');
    console.log('Login Credentials:');
    console.log(`  Email:    ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log('═══════════════════════════════════════════');
    console.log('User Status:');
    console.log('  ✓ Application: APPROVED');
    console.log('  ⏳ Payment: PENDING (will be created in app)');
    console.log('  → Click "Get Started" in the app');
    console.log('═══════════════════════════════════════════\n');
    console.log('💡 The app will:');
    console.log('   1. Check testing_mode in app_settings');
    console.log('   2. If testing_mode = true → create subscriber & go to profile-setup');
    console.log('   3. If testing_mode = false → redirect to payment\n');
    
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