import Constants from 'expo-constants';
import { supabase } from './supabase';

interface ProfileData {
  deen?: string;
  personality?: string;
  lifestyle?: string;
  spouse_criteria?: string;
  dealbreakers?: string;
  islamic_education?: string;
  memorization_quran?: string;
  prayer_consistency?: string;
  location?: string;
  ethnicity?: string[];
  preferred_ethnicity?: string[];
  marital_status?: string;
  children?: boolean;
  // Brother specific
  beard_commitment?: string;
  polygyny_willingness?: boolean;
  financial_responsibility?: string;
  // Sister specific
  hijab_commitment?: string;
  polygyny_acceptance?: boolean;
}

/**
 * Generates a comprehensive text representation of a profile for embedding
 */
export function generateProfileText(profile: ProfileData): string {
  const parts: string[] = [];

  // Deen and character
  if (profile.deen) parts.push(`Relationship with deen: ${profile.deen}`);
  if (profile.personality) parts.push(`Personality: ${profile.personality}`);
  if (profile.lifestyle) parts.push(`Lifestyle: ${profile.lifestyle}`);
  
  // Islamic practice
  if (profile.prayer_consistency) parts.push(`Prayer: ${profile.prayer_consistency}`);
  if (profile.memorization_quran) parts.push(`Quran memorization: ${profile.memorization_quran}`);
  if (profile.islamic_education) parts.push(`Islamic education: ${profile.islamic_education}`);
  
  // Physical and appearance
  if (profile.beard_commitment) parts.push(`Beard: ${profile.beard_commitment}`);
  if (profile.hijab_commitment) parts.push(`Hijab: ${profile.hijab_commitment}`);
  
  // Location and background
  if (profile.location) parts.push(`Location: ${profile.location}`);
  if (profile.ethnicity) parts.push(`Ethnicity: ${profile.ethnicity}`);
  
  // Marital preferences
  if (profile.marital_status) parts.push(`Marital status: ${profile.marital_status}`);
  if (profile.children !== undefined) parts.push(`Has children: ${profile.children ? 'yes' : 'no'}`);
  if (profile.polygyny_willingness !== undefined) parts.push(`Open to polygyny: ${profile.polygyny_willingness ? 'yes' : 'no'}`);
  if (profile.polygyny_acceptance !== undefined) parts.push(`Accepts polygyny: ${profile.polygyny_acceptance ? 'yes' : 'no'}`);
  
  // What they're looking for
  if (profile.spouse_criteria) parts.push(`Looking for: ${profile.spouse_criteria}`);
  if (profile.dealbreakers) parts.push(`Dealbreakers: ${profile.dealbreakers}`);
  if (profile.preferred_ethnicity?.length) {
    parts.push(`Preferred ethnicity: ${profile.preferred_ethnicity.join(', ')}`);
  }
  
  // Financial
  if (profile.financial_responsibility) parts.push(`Financial approach: ${profile.financial_responsibility}`);

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

    const response = await fetch(
      `${supabaseUrl}/functions/v1/generate-embedding`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to generate embedding: ${response.statusText}`);
    }

    const data = await response.json();
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