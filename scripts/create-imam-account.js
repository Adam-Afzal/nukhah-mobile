// @ts-nocheck
// scripts/create-imam-account.js
// Run this with: node scripts/create-imam-account.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure you have:');
  console.error('  - EXPO_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const IMAM_DATA = {
  email: 'test@masjidsunnah.com',
  password: 'Tawheed@123',
  name: 'Abul Abbas Naveed',
  masjid_name: 'Masjid Sunnah Nelson',
};

async function deleteExistingImam(email) {
  console.log(`🗑️  Checking for existing imam with email: ${email}`);
  
  // Get user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const existingUser = users?.users.find((u) => u.email === email);
  
  if (existingUser) {
    console.log(`   Found existing user: ${existingUser.id}`);
    
    // Delete imam record
    await supabase
      .from('imam')
      .delete()
      .eq('user_id', existingUser.id);
    console.log('   ✓ Deleted imam record');
    
    // Delete auth user
    await supabase.auth.admin.deleteUser(existingUser.id);
    console.log('   ✓ Deleted auth user');
    
    console.log('✅ Existing imam cleaned up\n');
  } else {
    console.log('   No existing user found\n');
  }
}

async function createImamAccount() {
  console.log('🕌 Creating imam account for Masjid Sunnah Nelson...\n');
  
  try {
    // Step 1: Delete existing imam if present
    await deleteExistingImam(IMAM_DATA.email);
    
    // Step 2: Find the masjid
    console.log('🔍 Finding masjid...');
    console.log(`   Looking for: "${IMAM_DATA.masjid_name}"`);
    
    // Get all masajid first
    const { data: allMasajid, error: fetchError } = await supabase
      .from('masjid')
      .select('id, name, city, country');
    
    if (fetchError) throw fetchError;
    
    if (!allMasajid || allMasajid.length === 0) {
      throw new Error('No masajid found in database!');
    }
    
    // Normalize search string
    const searchName = IMAM_DATA.masjid_name.trim().toLowerCase();
    
    // Try exact match (case-insensitive, trimmed)
    let masjid = allMasajid.find(m => 
      m.name.trim().toLowerCase() === searchName
    );
    
    if (masjid) {
      console.log(`   ✓ Found exact match: "${masjid.name}"`);
    } else {
      // Try partial match
      console.log('   Exact match not found, trying partial match...');
      masjid = allMasajid.find(m => 
        m.name.toLowerCase().includes('nelson') && 
        m.name.toLowerCase().includes('sunnah')
      );
      
      if (masjid) {
        console.log(`   ✓ Found partial match: "${masjid.name}"`);
      }
    }
    
    if (!masjid) {
      // List all available masajid to help user
      console.log('\n❌ Masjid not found. Available masajid:');
      allMasajid.forEach((m, i) => {
        console.log(`   ${i + 1}. "${m.name}" (${m.city}, ${m.country})`);
      });
      console.log(`\nSearched for: "${IMAM_DATA.masjid_name}"`);
      console.log(`Normalized: "${searchName}"`);
      
      throw new Error(`Masjid "${IMAM_DATA.masjid_name}" not found in database.`);
    }
    
    console.log(`   Masjid ID: ${masjid.id}`);
    console.log(`   Location: ${masjid.city}, ${masjid.country}\n`);
    
    // Step 3: Create auth user
    console.log('👤 Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: IMAM_DATA.email,
      password: IMAM_DATA.password,
      email_confirm: true, // Auto-confirm email
    });
    
    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }
    
    const userId = authData.user.id;
    console.log(`   ✓ Auth user created: ${userId}\n`);
    
    // Step 4: Create imam record
    console.log('📝 Creating imam record...');
    const { data: imamRecord, error: imamError } = await supabase
      .from('imam')
      .insert({
        user_id: userId,
        masjid_id: masjid.id,
        name: IMAM_DATA.name,
        email: IMAM_DATA.email,
      })
      .select()
      .single();
    
    if (imamError) {
      throw new Error(`Failed to create imam record: ${imamError.message}`);
    }
    
    console.log('   ✓ Imam record created\n');
    
    // Step 5: Link imam to masjid
    console.log('🔗 Linking imam to masjid...');
    const { error: linkError } = await supabase
      .from('masjid')
      .update({ imam_id: imamRecord.id })
      .eq('id', masjid.id);
    
    if (linkError) {
      throw new Error(`Failed to link imam to masjid: ${linkError.message}`);
    }
    
    console.log('   ✓ Imam linked to masjid\n');
    
    // Success!
    console.log('✅ IMAM ACCOUNT CREATED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════');
    console.log('Imam Login Credentials:');
    console.log(`  Email:    ${IMAM_DATA.email}`);
    console.log(`  Password: ${IMAM_DATA.password}`);
    console.log('═══════════════════════════════════════════');
    console.log('Imam Details:');
    console.log(`  Name:     ${IMAM_DATA.name}`);
    console.log(`  Masjid:   ${masjid.name}`);
    console.log('═══════════════════════════════════════════');
    console.log('Access:');
    console.log('  Login at: /imam/login');
    console.log('  Dashboard: /imam/dashboard');
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Run the script
createImamAccount()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });