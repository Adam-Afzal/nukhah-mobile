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
  revert?: boolean;
  open_to_hijrah?: boolean;
  open_to_reverts?: boolean;
  living_arrangements?: string;
  other_spouse_criteria?: string;
  dealbreakers?: string;
  date_of_birth?: string;
  build?: string;
  prayer_consistency?: string;
  // Brother specific
  beard_commitment?: string;
  // Sister specific
  hijab_commitment?: string;
  open_to_polygyny?: boolean;
}

/**
 * Generates a comprehensive text representation of a profile for embedding
 */
export function generateProfileText(profile: ProfileData): string {
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
  if (profile.open_to_reverts !== undefined) parts.push(`Open to reverts: ${profile.open_to_reverts ? 'yes' : 'no'}`);
  if (profile.revert !== undefined) parts.push(`Is a revert: ${profile.revert ? 'yes' : 'no'}`);

  // Brother-specific
  if (profile.beard_commitment) parts.push(`Beard: ${profile.beard_commitment}`);

  // Sister-specific
  if (profile.hijab_commitment) parts.push(`Hijab: ${profile.hijab_commitment}`);
  if (profile.open_to_polygyny !== undefined) {
    parts.push(`Open to polygyny: ${profile.open_to_polygyny ? 'yes' : 'no'}`);
  }
  if (profile.marital_status === 'married') {
    parts.push('Currently married and seeking additional spouse through polygyny');
  }

  if (profile.living_arrangements) parts.push(`Living arrangements: ${profile.living_arrangements}`);
  if (profile.other_spouse_criteria) parts.push(`Looking for: ${profile.other_spouse_criteria}`);
  if (profile.dealbreakers) parts.push(`Dealbreakers: ${profile.dealbreakers}`);
  if (profile.preferred_ethnicity?.length) {
    parts.push(`Preferred ethnicity: ${profile.preferred_ethnicity.join(', ')}`);
  }

  return parts.join('. ');
}

/**
 * Generates an embedding vector by calling the edge function
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('No auth session found');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/generate-embedding`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      }
    );

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

/**
 * Updates a brother's profile embedding
 */
export async function updateBrotherEmbedding(brotherId: string, profileData: ProfileData) {
  try {
    const profileText = generateProfileText(profileData);
    const embedding = await generateEmbedding(profileText);

    const { error } = await supabase
      .from('brother')
      .update({ profile_embedding: embedding })
      .eq('id', brotherId);

    if (error) throw error;

    console.log('Brother embedding updated successfully');
  } catch (error) {
    console.error('Error updating brother embedding:', error);
    throw error;
  }
}

/**
 * Updates a sister's profile embedding
 */
export async function updateSisterEmbedding(sisterId: string, profileData: ProfileData) {
  try {
    const profileText = generateProfileText(profileData);
    const embedding = await generateEmbedding(profileText);

    const { error } = await supabase
      .from('sister')
      .update({ profile_embedding: embedding })
      .eq('id', sisterId);

    if (error) throw error;

    console.log('Sister embedding updated successfully');
  } catch (error) {
    console.error('Error updating sister embedding:', error);
    throw error;
  }
}

/**
 * Find matches for a brother
 */
export async function findMatchesForBrother(brotherId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .rpc('find_sister_matches', {
        brother_id_param: brotherId,
        match_threshold: 0.60, 
        match_limit: limit,
      });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error finding matches for brother:', error);
    throw error;
  }
}

/**
 * Find matches for a sister
 */
export async function findMatchesForSister(sisterId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .rpc('find_brother_matches', {
        sister_id_param: sisterId,
        match_threshold: 0.60, 
        match_limit: limit,
      });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error finding matches for sister:', error);
    throw error;
  }
}