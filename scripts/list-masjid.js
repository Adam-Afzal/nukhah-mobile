// @ts-nocheck
// scripts/list-masajid.js
// Run this with: node scripts/list-masajid.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';


if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function listMasajid() {
  console.log('🕌 Listing all masajid in database...\n');
  
  try {
    const { data: masajid, error } = await supabase
      .from('masjid')
      .select('id, name, city, country')
      .order('name');

    if (error) throw error;

    if (!masajid || masajid.length === 0) {
      console.log('❌ No masajid found in database');
      return;
    }

    console.log(`Found ${masajid.length} masajid:\n`);
    console.log('═══════════════════════════════════════════');
    
    masajid.forEach((masjid, index) => {
      console.log(`${index + 1}. ${masjid.name}`);
      console.log(`   Location: ${masjid.city}, ${masjid.country}`);
      console.log(`   ID: ${masjid.id}`);
      console.log('───────────────────────────────────────────');
    });
    
    console.log('═══════════════════════════════════════════\n');
    
    // Search for Nelson specifically
    const nelsonMasajid = masajid.filter(m => 
      m.name.toLowerCase().includes('nelson') || 
      m.city?.toLowerCase().includes('nelson')
    );
    
    if (nelsonMasajid.length > 0) {
      console.log('🔍 Masajid matching "Nelson":');
      nelsonMasajid.forEach(m => {
        console.log(`   - "${m.name}" (${m.city})`);
      });
    } else {
      console.log('⚠️  No masajid found with "Nelson" in name or city');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Run the script
listMasajid()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });