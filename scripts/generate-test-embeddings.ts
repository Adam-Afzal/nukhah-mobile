// scripts/generate-test-embeddings.ts
// Run this AFTER creating test profiles to generate their embeddings

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize clients
const supabaseUrl = 'gggg'
const supabaseServiceKey = 'gggg' // Use service role key for admin access
const openaiApiKey = 'fff'

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

interface Profile {
  id: string;
  username: string;
  location: string;
  ethnicity: string;
  deen: string;
  personality: string;
  lifestyle: string;
  spouse_criteria: string;
  marital_status: string;
  build?: string;
  physical_fitness?: string;
  date_of_birth: string;
}

// Build profile text for embedding
function buildProfileText(profile: Profile, type: 'brother' | 'sister'): string {
  const age = calculateAge(profile.date_of_birth);

  return `Location: ${profile.location}. ` +
    `Ethnicity: ${profile.ethnicity}. ` +
    (age !== null ? `Age: ${age}. ` : '') +
    `Marital Status: ${profile.marital_status}. ` +
    `Deen: ${profile.deen}. ` +
    `Personality: ${profile.personality}. ` +
    `Lifestyle: ${profile.lifestyle}. ` +
    `Spouse Criteria: ${profile.spouse_criteria}. ` +
    (profile.build ? `Build: ${profile.build}. ` : '') +
    (profile.physical_fitness ? `Physical Fitness: ${profile.physical_fitness}.` : '');
}

function calculateAge(dateOfBirth: string): number | null {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return null;
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function updateBrotherEmbedding(profileId: string, embedding: number[]) {
  const { error } = await supabase
    .from('brother')
    .update({ profile_embedding: embedding })
    .eq('id', profileId);
  
  if (error) {
    console.error('Error updating brother embedding:', error);
    throw error;
  }
}

async function updateSisterEmbedding(profileId: string, embedding: number[]) {
  const { error } = await supabase
    .from('sister')
    .update({ profile_embedding: embedding })
    .eq('id', profileId);
  
  if (error) {
    console.error('Error updating sister embedding:', error);
    throw error;
  }
}

async function processTestProfiles() {
  console.log('🚀 Starting embedding generation for test profiles...\n');
  
  try {
    // First, get test user IDs
    const { data: testUsers } = await supabase.auth.admin.listUsers();
    const brotherUserIds = testUsers?.users
      .filter(u => u.email?.startsWith('testing+brother'))
      .map(u => u.id) || [];
    const sisterUserIds = testUsers?.users
      .filter(u => u.email?.startsWith('testing+sister'))
      .map(u => u.id) || [];
    
    // Get test brothers
    const { data: brothers, error: brothersError } = await supabase
      .from('brother')
      .select('id, username, location, ethnicity, deen, personality, lifestyle, spouse_criteria, marital_status, build, physical_fitness, date_of_birth, user_id')
      .in('user_id', brotherUserIds);
    
    if (brothersError) throw brothersError;
    
    // Get test sisters
    const { data: sisters, error: sistersError } = await supabase
      .from('sister')
      .select('id, username, location, ethnicity, deen, personality, lifestyle, spouse_criteria, marital_status, build, physical_fitness, date_of_birth, user_id')
      .in('user_id', sisterUserIds);
    
    if (sistersError) throw sistersError;
    
    console.log(`Found ${brothers?.length || 0} test brothers`);
    console.log(`Found ${sisters?.length || 0} test sisters\n`);
    
    // Process brothers
    if (brothers && brothers.length > 0) {
      console.log('📝 Processing brothers...');
      for (const brother of brothers) {
        const profileText = buildProfileText(brother as Profile, 'brother');
        console.log(`  Generating embedding for ${brother.username}...`);
        console.log(`  Profile text: ${profileText.substring(0, 100)}...`);
        
        const embedding = await generateEmbedding(profileText);
        await updateBrotherEmbedding(brother.id, embedding);
        
        console.log(`  ✅ ${brother.username} embedding generated (${embedding.length} dimensions)\n`);
      }
    }
    
    // Process sisters
    if (sisters && sisters.length > 0) {
      console.log('📝 Processing sisters...');
      for (const sister of sisters) {
        const profileText = buildProfileText(sister as Profile, 'sister');
        console.log(`  Generating embedding for ${sister.username}...`);
        console.log(`  Profile text: ${profileText.substring(0, 100)}...`);
        
        const embedding = await generateEmbedding(profileText);
        await updateSisterEmbedding(sister.id, embedding);
        
        console.log(`  ✅ ${sister.username} embedding generated (${embedding.length} dimensions)\n`);
      }
    }
    
    console.log('✨ All embeddings generated successfully!');
    
  } catch (error) {
    console.error('❌ Error processing profiles:', error);
    throw error;
  }
}

// Alternative: Simpler version that fetches by email pattern
async function processTestProfilesSimple() {
  console.log('🚀 Starting embedding generation (simple method)...\n');
  
  try {
    // Get all test user IDs
    const { data: testUsers } = await supabase.auth.admin.listUsers();
    const testUserIds = testUsers?.users
      .filter(u => u.email?.startsWith('testing+'))
      .map(u => u.id) || [];
    
    console.log(`Found ${testUserIds.length} test users\n`);
    
    // Get brothers
    const { data: brothers } = await supabase
      .from('brother')
      .select('*')
      .in('user_id', testUserIds);
    
    // Get sisters  
    const { data: sisters } = await supabase
      .from('sister')
      .select('*')
      .in('user_id', testUserIds);
    
    console.log(`Processing ${brothers?.length || 0} brothers and ${sisters?.length || 0} sisters\n`);
    
    // Process brothers
    for (const brother of brothers || []) {
      const profileText = buildProfileText(brother as Profile, 'brother');
      console.log(`Generating embedding for ${brother.username}...`);
      
      const embedding = await generateEmbedding(profileText);
      await updateBrotherEmbedding(brother.id, embedding);
      
      console.log(`✅ ${brother.username} done\n`);
    }
    
    // Process sisters
    for (const sister of sisters || []) {
      const profileText = buildProfileText(sister as Profile, 'sister');
      console.log(`Generating embedding for ${sister.username}...`);
      
      const embedding = await generateEmbedding(profileText);
      await updateSisterEmbedding(sister.id, embedding);
      
      console.log(`✅ ${sister.username} done\n`);
    }
    
    console.log('✨ All done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
processTestProfilesSimple()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });