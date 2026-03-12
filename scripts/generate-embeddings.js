// @ts-nocheck
// scripts/generate-embeddings.js
// Generates OpenAI embeddings for all brother/sister profiles missing them.
// Run with: node scripts/generate-embeddings.js
// Run with: node scripts/generate-embeddings.js --all   (to regenerate all)

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';
const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}
if (!openaiApiKey) {
  console.error('Missing EXPO_PUBLIC_OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const regenerateAll = process.argv.includes('--all');

// Matches the generateProfileText logic in lib/embeddingService.ts
function buildProfileText(profile, type) {
  const parts = [];

  if (profile.personality) parts.push(`Personality: ${profile.personality}`);
  if (profile.hobbies_and_interests) parts.push(`Hobbies and interests: ${profile.hobbies_and_interests}`);

  if (profile.location_city && profile.location_country) {
    parts.push(`Location: ${profile.location_city}, ${profile.location_country}`);
  } else if (profile.location_country) {
    parts.push(`Location: ${profile.location_country}`);
  }

  if (profile.ethnicity) parts.push(`Ethnicity: ${profile.ethnicity}`);

  if (profile.date_of_birth) {
    const age = new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear();
    parts.push(`Age: ${age}`);
  }

  if (profile.build) parts.push(`Build: ${profile.build}`);
  if (profile.marital_status) parts.push(`Marital status: ${profile.marital_status}`);
  if (profile.children !== undefined && profile.children !== null) parts.push(`Has children: ${profile.children ? 'yes' : 'no'}`);
  if (profile.prayer_consistency) parts.push(`Prayer consistency: ${profile.prayer_consistency}`);
  if (profile.open_to_hijrah !== undefined && profile.open_to_hijrah !== null) parts.push(`Open to hijrah: ${profile.open_to_hijrah ? 'yes' : 'no'}`);
  if (profile.open_to_reverts !== undefined && profile.open_to_reverts !== null) parts.push(`Open to reverts: ${profile.open_to_reverts ? 'yes' : 'no'}`);
  if (profile.revert !== undefined && profile.revert !== null) parts.push(`Is a revert: ${profile.revert ? 'yes' : 'no'}`);

  if (type === 'brother' && profile.beard_commitment) parts.push(`Beard: ${profile.beard_commitment}`);
  if (type === 'sister' && profile.hijab_commitment) parts.push(`Hijab: ${profile.hijab_commitment}`);
  if (type === 'sister' && profile.open_to_polygyny !== undefined && profile.open_to_polygyny !== null) {
    parts.push(`Open to polygyny: ${profile.open_to_polygyny ? 'yes' : 'no'}`);
  }
  if (profile.living_arrangements) parts.push(`Living arrangements: ${profile.living_arrangements}`);
  if (profile.other_spouse_criteria) parts.push(`Looking for: ${profile.other_spouse_criteria}`);
  if (profile.dealbreakers) parts.push(`Dealbreakers: ${profile.dealbreakers}`);
  if (profile.preferred_ethnicity?.length) {
    parts.push(`Preferred ethnicity: ${profile.preferred_ethnicity.join(', ')}`);
  }

  return parts.join('. ');
}

async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function processProfiles(table, type) {
  const query = supabase
    .from(table)
    .select('id, username, personality, hobbies_and_interests, location_country, location_city, ethnicity, date_of_birth, build, marital_status, children, prayer_consistency, open_to_hijrah, open_to_reverts, revert, living_arrangements, other_spouse_criteria, dealbreakers, preferred_ethnicity, beard_commitment, hijab_commitment, open_to_polygyny');

  if (!regenerateAll) {
    query.is('profile_embedding', null);
  }

  const { data: profiles, error } = await query;
  if (error) throw error;

  if (!profiles || profiles.length === 0) {
    console.log(`  No ${table} profiles to process`);
    return;
  }

  console.log(`  Processing ${profiles.length} ${table} profile(s)...`);

  for (const profile of profiles) {
    const text = buildProfileText(profile, type);

    if (!text.trim()) {
      console.log(`  SKIP ${profile.username} — no embeddable content`);
      continue;
    }

    process.stdout.write(`  ${profile.username} ... `);
    const embedding = await generateEmbedding(text);

    const { error: updateError } = await supabase
      .from(table)
      .update({ profile_embedding: embedding })
      .eq('id', profile.id);

    if (updateError) throw updateError;
    console.log(`done (${embedding.length}d)`);
  }
}

async function main() {
  console.log(`\nGenerating embeddings${regenerateAll ? ' (all profiles)' : ' (missing only)'}...\n`);

  console.log('Brothers:');
  await processProfiles('brother', 'brother');

  console.log('\nSisters:');
  await processProfiles('sister', 'sister');

  console.log('\nDone.\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
