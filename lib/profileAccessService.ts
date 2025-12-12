// lib/profileAccessService.ts
import { supabase } from './supabase';

export interface ProfileAccess {
  canViewProfile: boolean;
  canViewBasicInfo: boolean;
  canViewWaliContact: boolean;
  accessLevel: 'none' | 'basic' | 'full' | 'full_with_wali';
  unlockedSections: string[];
  reason?: string;
}

interface Interest {
  id: string;
  requester_id: string;
  recipient_id: string;
  requester_type: 'brother' | 'sister';
  recipient_type: 'brother' | 'sister';
  unlock_percentage: number;
  status: string;
}

/**
 * Map of question numbers to profile sections they unlock
 */
const QUESTION_TO_SECTIONS: Record<number, string[]> = {
  1: ['deen', 'religious_practice', 'prayer_consistency'], // Deen question
  2: ['lifestyle', 'daily_routine', 'work_life_balance'], // Lifestyle question
  3: ['personality', 'fitness', 'hobbies', 'interests'], // Personality/Fitness question
  4: ['marital_expectations', 'conflict_resolution', 'communication_style'], // Marital Life
  5: ['children_plans', 'legacy_goals', 'family_planning'], // Children/Legacy
};

/**
 * Get list of unlocked sections based on questions answered
 */
function getUnlockedSections(questionsAnswered: number): string[] {
  const unlocked: string[] = [];
  
  for (let i = 1; i <= Math.min(questionsAnswered, 5); i++) {
    unlocked.push(...(QUESTION_TO_SECTIONS[i] || []));
  }
  
  return unlocked;
}

/**
 * Check what level of profile access a viewer has for a target profile
 */
export async function checkProfileAccess(
  viewerId: string,
  viewerType: 'brother' | 'sister',
  profileId: string,
  profileType: 'brother' | 'sister'
): Promise<ProfileAccess> {
  try {
    // Find interest where viewer is requester
    const { data: myInterest } = await supabase
      .from('interests')
      .select('*')
      .eq('requester_id', viewerId)
      .eq('recipient_id', profileId)
      .maybeSingle();

    // Find reciprocal interest
    const { data: theirInterest } = await supabase
      .from('interests')
      .select('*')
      .eq('requester_id', profileId)
      .eq('recipient_id', viewerId)
      .maybeSingle();

    // NO INTEREST - Only basic info visible
    if (!myInterest) {
      return {
        canViewProfile: false,
        canViewBasicInfo: true,
        canViewWaliContact: false,
        accessLevel: 'basic',
        unlockedSections: [],
        reason: 'Express interest and complete questions to unlock profile',
      };
    }

    // Calculate questions answered (unlock_percentage / 20)
    const questionsAnswered = Math.floor(myInterest.unlock_percentage / 20);

    // EXPRESSING INTEREST (0-99%)
    if (myInterest.unlock_percentage < 100) {
      const unlockedSections = getUnlockedSections(questionsAnswered);
      
      return {
        canViewProfile: true, // Can view unlocked sections
        canViewBasicInfo: true,
        canViewWaliContact: false,
        accessLevel: 'basic',
        unlockedSections,
        reason: `${questionsAnswered}/5 questions answered - ${unlockedSections.length} sections unlocked`,
      };
    }

    // COMPLETED QUESTIONS (100%) - Full profile access earned
    if (myInterest.unlock_percentage === 100) {
      // All sections unlocked
      const allSections = Object.values(QUESTION_TO_SECTIONS).flat();
      
      // Check for mutual interest + acceptance for wali contact
      const hasMutualInterest = 
        myInterest.status === 'accepted' &&
        theirInterest?.unlock_percentage === 100 &&
        theirInterest?.status === 'accepted';

      const canViewWali = 
        hasMutualInterest &&
        viewerType === 'brother' &&
        profileType === 'sister';

      return {
        canViewProfile: true, // ✅ Full profile access
        canViewBasicInfo: true,
        canViewWaliContact: canViewWali,
        accessLevel: canViewWali ? 'full_with_wali' : 'full',
        unlockedSections: allSections,
        reason: canViewWali 
          ? 'Mutual interest confirmed - full access including Wali contact'
          : 'Profile unlocked by completing questions',
      };
    }

    // Default - basic only
    return {
      canViewProfile: false,
      canViewBasicInfo: true,
      canViewWaliContact: false,
      accessLevel: 'basic',
      unlockedSections: [],
      reason: 'Complete questions to unlock full profile',
    };
  } catch (error) {
    console.error('Error checking profile access:', error);
    return {
      canViewProfile: false,
      canViewBasicInfo: true,
      canViewWaliContact: false,
      accessLevel: 'none',
      unlockedSections: [],
      reason: 'Error checking access',
    };
  }
}

/**
 * Check if a specific profile section is unlocked for viewer
 */
export async function isSectionUnlocked(
  viewerId: string,
  profileId: string,
  sectionName: string
): Promise<boolean> {
  try {
    // Get current user type
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Determine user type
    const { data: brotherProfile } = await supabase
      .from('brother')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const viewerType = brotherProfile ? 'brother' : 'sister';

    // Determine profile type
    const { data: targetBrotherProfile } = await supabase
      .from('brother')
      .select('id')
      .eq('id', profileId)
      .maybeSingle();

    const profileType = targetBrotherProfile ? 'brother' : 'sister';

    // Check access
    const access = await checkProfileAccess(viewerId, viewerType, profileId, profileType);
    
    return access.unlockedSections.includes(sectionName);
  } catch (error) {
    console.error('Error checking section unlock:', error);
    return false;
  }
}

/**
 * Get wali contact information (only if access granted)
 */
export async function getWaliContact(
  brotherId: string,
  sisterId: string
): Promise<{
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  preferred_contact?: string;
} | null> {
  try {
    // Check if brother has access to wali contact
    const access = await checkProfileAccess(brotherId, 'brother', sisterId, 'sister');
    
    if (!access.canViewWaliContact) {
      console.log('Brother does not have access to wali contact');
      return null;
    }

    // Fetch wali information
    const { data: sisterProfile, error } = await supabase
      .from('sister')
      .select('wali_name, wali_relationship, wali_phone, wali_email, wali_preferred_contact')
      .eq('id', sisterId)
      .single();

    if (error) throw error;

    return {
      name: sisterProfile.wali_name,
      relationship: sisterProfile.wali_relationship,
      phone: sisterProfile.wali_phone,
      email: sisterProfile.wali_email,
      preferred_contact: sisterProfile.wali_preferred_contact,
    };
  } catch (error) {
    console.error('Error getting wali contact:', error);
    return null;
  }
}