import Constants from 'expo-constants';
import { supabase } from './supabase';

interface ProfileData {
  personality?: string;
  hobbies_and_interests?: string;
  location_country?: string;
  location_city?: string;
  ethnicity?: string;
  preferred_ethnicity?: string[];
  marital_status?: string;
  children?: boolean;
  open_to_hijrah?: boolean;
  willing_to_relocate?: boolean;
  living_arrangements?: string;
  other_spouse_criteria?: string;
  dealbreakers?: string;
  date_of_birth?: string;
  build?: string;
  prayer_consistency?: string;
  beard_commitment?: string;
  hijab_commitment?: string;
  open_to_polygyny?: boolean;
}

export interface CompatibilityProfile {
  id: string;
  type: 'brother' | 'sister';
  ethnicity?: string;
  preferred_ethnicity?: string[];
  living_arrangements?: string;
  marital_status?: string;
  open_to_polygyny?: boolean;
  open_to_hijrah?: boolean;
  willing_to_relocate?: boolean;
}

// Self-description — who I am
export function generateWhoIAmText(profile: ProfileData): string {
  const parts: string[] = [];

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
  if (profile.children !== undefined) parts.push(`Has children: ${profile.children ? 'yes' : 'no'}`);
  if (profile.prayer_consistency) parts.push(`Prayer consistency: ${profile.prayer_consistency}`);
  if (profile.open_to_hijrah !== undefined) parts.push(`Open to hijrah: ${profile.open_to_hijrah ? 'yes' : 'no'}`);
  if (profile.willing_to_relocate !== undefined) parts.push(`Willing to relocate: ${profile.willing_to_relocate ? 'yes' : 'no'}`);
  if (profile.beard_commitment) parts.push(`Beard: ${profile.beard_commitment}`);
  if (profile.hijab_commitment) parts.push(`Hijab: ${profile.hijab_commitment}`);
  if (profile.open_to_polygyny !== undefined) {
    parts.push(`Open to polygyny: ${profile.open_to_polygyny ? 'yes' : 'no'}`);
  }
  if (profile.marital_status === 'married') {
    parts.push('Currently married and seeking additional spouse through polygyny');
  }
  if (profile.living_arrangements) parts.push(`Living arrangements: ${profile.living_arrangements}`);

  return parts.join('. ');
}

// Preferences — what I want in a spouse
export function generateWhatIWantText(profile: ProfileData): string {
  const parts: string[] = [];

  if (profile.other_spouse_criteria) parts.push(`Looking for: ${profile.other_spouse_criteria}`);
  if (profile.dealbreakers) parts.push(`Dealbreakers: ${profile.dealbreakers}`);
  if (profile.preferred_ethnicity?.length) {
    parts.push(`Preferred ethnicity: ${profile.preferred_ethnicity.join(', ')}`);
  }

  return parts.join('. ');
}

export function generateProfileText(profile: ProfileData): string {
  return generateWhoIAmText(profile);
}

function ethnicityMatches(theirEthnicity: string, myPreferences: string[]): boolean {
  return myPreferences.some(
    pref => theirEthnicity === pref || theirEthnicity.startsWith(pref + ' - ')
  );
}

/**
 * Scores hard rules (polygyny, ethnicity preference, living arrangements) client-side.
 * Returns a value 0–1 where 0.5 = neutral, 1.0 = ideal match, 0.0 = incompatible.
 */
export function calculateHardRuleScore(
  me: CompatibilityProfile,
  them: { ethnicity?: string; preferred_ethnicity?: string[]; living_arrangements?: string; open_to_polygyny?: boolean; marital_status?: string; open_to_hijrah?: boolean; willing_to_relocate?: boolean }
): number {
  const scores: number[] = [];

  // Polygyny — brother marital_status vs sister open_to_polygyny
  const brotherMaritalStatus = me.type === 'brother' ? me.marital_status : them.marital_status;
  const sisterOpenToPolygyny = me.type === 'sister' ? me.open_to_polygyny : them.open_to_polygyny;

  if (brotherMaritalStatus === 'married') {
    scores.push(sisterOpenToPolygyny === true ? 1.0 : 0.0);
  } else {
    scores.push(0.5);
  }

  // My preferred ethnicity vs their ethnicity
  if (me.preferred_ethnicity && me.preferred_ethnicity.length > 0) {
    scores.push(them.ethnicity && ethnicityMatches(them.ethnicity, me.preferred_ethnicity) ? 1.0 : 0.2);
  } else {
    scores.push(0.5);
  }

  // Their preferred ethnicity vs my ethnicity
  if (them.preferred_ethnicity && them.preferred_ethnicity.length > 0) {
    scores.push(me.ethnicity && ethnicityMatches(me.ethnicity, them.preferred_ethnicity) ? 1.0 : 0.2);
  } else {
    scores.push(0.5);
  }

  // Living arrangements
  if (me.living_arrangements && them.living_arrangements) {
    scores.push(me.living_arrangements === them.living_arrangements ? 1.0 : 0.5);
  } else {
    scores.push(0.5);
  }

  // Open to hijrah — strong alignment check (one wants to move to Muslim country, other doesn't = lifestyle mismatch)
  if (me.open_to_hijrah !== undefined && them.open_to_hijrah !== undefined) {
    if (me.open_to_hijrah === them.open_to_hijrah) {
      scores.push(me.open_to_hijrah ? 1.0 : 0.8); // both yes = great, both no = fine
    } else {
      scores.push(0.2); // mismatch
    }
  } else {
    scores.push(0.5);
  }

  // Willing to relocate — if at least one is willing, marriage across locations is possible
  if (me.willing_to_relocate !== undefined && them.willing_to_relocate !== undefined) {
    if (me.willing_to_relocate && them.willing_to_relocate) {
      scores.push(1.0); // both flexible
    } else if (me.willing_to_relocate || them.willing_to_relocate) {
      scores.push(0.7); // one can move to the other
    } else {
      scores.push(0.4); // neither willing — only works if same location
    }
  } else {
    scores.push(0.5);
  }

  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Combines vector similarity score with hard rule score.
 * vectorScore is null when embeddings are unavailable — falls back to hard rules only.
 */
export function combineCompatibilityScores(vectorScore: number | null, hardRuleScore: number): number {
  if (vectorScore === null) return hardRuleScore;
  return Math.min(1, Math.max(0, vectorScore * 0.7 + hardRuleScore * 0.3));
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) throw new Error('Supabase URL not configured');

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No auth session found');

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to generate embedding: ${response.status} - ${JSON.stringify(data)}`);
    }

    return data.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function updateBrotherEmbedding(brotherId: string, profileData: ProfileData) {
  try {
    const whoIAmText = generateWhoIAmText(profileData);
    const whatIWantText = generateWhatIWantText(profileData);

    const whoIAmEmbedding = await generateEmbedding(whoIAmText);
    const updateData: any = { profile_embedding: whoIAmEmbedding };

    if (whatIWantText) {
      updateData.profile_embedding_want = await generateEmbedding(whatIWantText);
    }

    const { error } = await supabase.from('brother').update(updateData).eq('id', brotherId);
    if (error) throw error;
  } catch (error) {
    console.error('Error updating brother embedding:', error);
    throw error;
  }
}

export async function updateSisterEmbedding(sisterId: string, profileData: ProfileData) {
  try {
    const whoIAmText = generateWhoIAmText(profileData);
    const whatIWantText = generateWhatIWantText(profileData);

    const whoIAmEmbedding = await generateEmbedding(whoIAmText);
    const updateData: any = { profile_embedding: whoIAmEmbedding };

    if (whatIWantText) {
      updateData.profile_embedding_want = await generateEmbedding(whatIWantText);
    }

    const { error } = await supabase.from('sister').update(updateData).eq('id', sisterId);
    if (error) throw error;
  } catch (error) {
    console.error('Error updating sister embedding:', error);
    throw error;
  }
}

/**
 * Fetches vector similarity scores for a specific set of profile IDs.
 * Used by the local tab to score masjid members without a threshold filter.
 * Returns a map of profileId → vector_score (null if embeddings missing).
 */
export async function scoreSpecificProfiles(
  myId: string,
  myType: 'brother' | 'sister',
  targetIds: string[]
): Promise<Map<string, number | null>> {
  if (targetIds.length === 0) return new Map();

  const rpcName = myType === 'brother' ? 'score_sister_profiles' : 'score_brother_profiles';
  const idParam = myType === 'brother' ? 'brother_id_param' : 'sister_id_param';
  const idsParam = myType === 'brother' ? 'sister_ids' : 'brother_ids';

  try {
    const { data, error } = await supabase.rpc(rpcName, {
      [idParam]: myId,
      [idsParam]: targetIds,
    });

    if (error) throw error;

    const scoreMap = new Map<string, number | null>();
    for (const row of (data || [])) {
      scoreMap.set(row.id, row.vector_score ?? null);
    }
    return scoreMap;
  } catch (error) {
    console.error('Error scoring profiles:', error);
    return new Map();
  }
}

export async function findMatchesForBrother(brotherId: string, limit: number = 50) {
  try {
    const { data, error } = await supabase.rpc('find_sister_matches', {
      brother_id_param: brotherId,
      match_threshold: 0.40,
      match_limit: limit,
    });

    if (error) throw error;
    return data as Array<{ id: string; vector_score: number }>;
  } catch (error) {
    console.error('Error finding matches for brother:', error);
    throw error;
  }
}

export async function findMatchesForSister(sisterId: string, limit: number = 50) {
  try {
    const { data, error } = await supabase.rpc('find_brother_matches', {
      sister_id_param: sisterId,
      match_threshold: 0.40,
      match_limit: limit,
    });

    if (error) throw error;
    return data as Array<{ id: string; vector_score: number }>;
  } catch (error) {
    console.error('Error finding matches for sister:', error);
    throw error;
  }
}
