// app/(auth)/profile/[id].tsx
import { expressInterest, getInterest, withdrawInterest } from '@/lib/interestService';
import { getCountryByName } from '@/lib/locationData';
import { notifyProfileView } from '@/lib/notificationService';
import { checkProfileAccess, getWaliContact } from '@/lib/profileAccessService';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Using ONLY fields that exist in your actual schema
interface ProfileData {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  location: string;
  ethnicity: string[];
  marital_status: string;
  build?: string;
  physical_fitness?: string;
  revert?: boolean;
  children?: boolean;
  disabilities?: string;
  memorization_quran?: string;
  islamic_education?: string;
  prayer_consistency?: string;
  islamic_knowledge_level?: string;
  family_involvement?: string;
  beard_commitment?: string;
  hijab_commitment?: string;
  charity_habits?: string;
  conflict_resolution?: string;
  polygyny_willingness?: boolean;
  polygyny_acceptance?: boolean;
  wali_approval?: boolean;
  wali_name?: string;
  wali_relationship?: string;
  wali_email?: string;
  wali_phone?: string;
  wali_preferred_contact?: string;
  
  // Locked fields
  deen?: string;
  personality?: string;
  lifestyle?: string;
  spouse_criteria?: string;
  dealbreakers?: string;
  financial_responsibility?: string;
}

interface WaliContact {
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  preferred_contact?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileType, setProfileType] = useState<'brother' | 'sister' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountType, setAccountType] = useState<'brother' | 'sister' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [unlockPercentage, setUnlockPercentage] = useState(0);
  const [interestId, setInterestId] = useState<string | null>(null);
  const [isExpressing, setIsExpressing] = useState(false);
  const [waliContact, setWaliContact] = useState<WaliContact | null>(null);
  const [canViewWali, setCanViewWali] = useState(false);
  const [hasNotifiedProfileView, setHasNotifiedProfileView] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userId = await loadCurrentUser();
      await loadProfile(userId);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentUser = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: brotherProfile } = await supabase
        .from('brother')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (brotherProfile) {
        setAccountType('brother');
        setCurrentUserId(brotherProfile.id);
        return brotherProfile.id;
      }

      const { data: sisterProfile } = await supabase
        .from('sister')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (sisterProfile) {
        setAccountType('sister');
        setCurrentUserId(sisterProfile.id);
        return sisterProfile.id;
      }

      return null;
    } catch (error) {
      console.error('Error loading current user:', error);
      return null;
    }
  };

  const loadProfile = async (userId: string | null) => {
    if (!id) return;

    try {
      // Try brother first
      const { data: brotherData } = await supabase
        .from('brother')
        .select('*')
        .eq('id', id)
        .maybeSingle();
        await sendProfileViewNotification();

      if (brotherData) {
        setProfile(brotherData);
        setProfileType('brother');
        if (userId) await checkInterestStatusAndAccess(userId, id, 'brother');
        return;
      }

      // Try sister
      const { data: sisterData } = await supabase
        .from('sister')
        .select('*')
        .eq('id', id)
        .maybeSingle();

        await sendProfileViewNotification();

      if (sisterData) {
        setProfile(sisterData);
        setProfileType('sister');
        if (userId) await checkInterestStatusAndAccess(userId, id, 'sister');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const sendProfileViewNotification = async () => {
    if (
      from !== 'search' || 
      hasNotifiedProfileView || 
      !currentUserId || 
      !accountType || 
      !profile ||
      !profileType ||
      currentUserId === profile.id
    ) {
      return;
    }
  
    console.log('📧 Sending profile view notification');
    
    await notifyProfileView(
      profile.id,
      profileType,
      currentUserId,
      accountType
    );
  
    setHasNotifiedProfileView(true);
  };

  const checkInterestStatusAndAccess = async (
    userId: string, 
    recipientId: string, 
    recipientType: 'brother' | 'sister'
  ) => {
    console.log('=== Checking Interest Status & Access ===');
    console.log('User ID:', userId);
    console.log('Recipient ID:', recipientId);
    
    const interest = await getInterest(userId, recipientId);
    
    console.log('Found interest:', interest);
    
    if (interest && interest.status !== 'withdrawn') {
      console.log('Setting unlock percentage:', interest.unlock_percentage);
      setUnlockPercentage(interest.unlock_percentage);
      setInterestId(interest.id);
    } else {
      console.log('No active interest found - showing Express Interest button');
    }

    // Check profile access level
    if (accountType && userId) {
      const access = await checkProfileAccess(
        userId,
        accountType,
        recipientId,
        recipientType
      );

      console.log('Profile access:', access);

      // Check if can view wali contact
      if (access.canViewWaliContact && accountType === 'brother' && recipientType === 'sister') {
        setCanViewWali(true);
        // Fetch wali contact
        const wali = await getWaliContact(userId, recipientId);
        if (wali) {
          setWaliContact(wali);
          console.log('Wali contact loaded');
        }
      }
    }
  };

  const handleExpressInterest = async () => {
    if (!currentUserId || !accountType || !id || !profile) return;
    console.log("expressing interest");

    setIsExpressing(true);
    try {
      const recipientType = profileType || (accountType === 'brother' ? 'sister' : 'brother');
      const result = await expressInterest(currentUserId, accountType, id, recipientType);

      console.log("called service");

      if (result.success && result.interestId) {
        console.log(`interest id: ${result.interestId}`);
        setInterestId(result.interestId);
        console.log("now moving to questions screen");
        router.replace({
          pathname: '/questions/[interestId]',
          params: { interestId: result.interestId }
        });
      } else {
        alert('Failed to express interest. Please try again.');
      }
    } catch (error) {
      console.error('Error expressing interest:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsExpressing(false);
    }
  };

  const handleContinueQuestions = () => {
    if (interestId) {
      router.replace({
        pathname: '/questions/[interestId]',
        params: { interestId: interestId }
      });
    }
  };

  const handleNoLongerInterested = async () => {
    if (!interestId) return;

    try {
      const result = await withdrawInterest(interestId);
      if (result.success) {
        router.back();
      } else {
        alert(result.error || 'Failed to withdraw interest. Please try again.');
      }
    } catch (error) {
      console.error('Error withdrawing interest:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleCallWali = () => {
    if (waliContact?.phone) {
      Linking.openURL(`tel:${waliContact.phone}`);
    }
  };

  const handleEmailWali = () => {
    if (waliContact?.email && profile) {
      const subject = encodeURIComponent(`Marriage Proposal for ${profile.username}`);
      const body = encodeURIComponent(
        `Assalamu Alaikum ${waliContact.name},\n\n` +
        `I am contacting you regarding a marriage proposal for ${profile.username} through the Nukhbah matrimonial platform.\n\n` +
        `I would like to discuss this matter further at your convenience.\n\n` +
        `JazakAllahu Khairan`
      );
      Linking.openURL(`mailto:${waliContact.email}?subject=${subject}&body=${body}`);
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getMaritalStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      never_married: 'Never Married',
      divorced: 'Divorced',
      widowed: 'Widowed',
      married: 'Married',
    };
    return labels[status] || status;
  };

  const getBuildLabel = (build: string) => {
    const labels: Record<string, string> = {
      athletic: 'Athletic',
      lean: 'Lean',
      muscular: 'Muscular',
      bulky: 'Bulky',
      heavyset: 'Heavyset',
      average: 'Average',
      curvaceous: 'Curvaceous',
      hourglass: 'Hourglass',
    };
    return labels[build] || build;
  };

  const getPhysicalFitnessLabel = (fitness: string) => {
    const labels: Record<string, string> = {
      athlete: 'Athlete',
      very_fit: 'Very Fit',
      fit: 'Fit',
      moderately_fit: 'Moderately Fit',
      light_exercise: 'Light Exercise',
    };
    return labels[fitness] || fitness;
  };

  const getCoveringLabel = (covering: string, type: 'hijab' | 'beard') => {
    if (type === 'hijab') {
      const labels: Record<string, string> = {
        niqab: 'Niqab',
        hijab_abaya: 'Hijab + Abaya',
        hijab_western_clothing: 'Hijab + Western',
        open_hair: 'Open Hair',
      };
      return labels[covering] || covering;
    } else {
      const labels: Record<string, string> = {
        full_sunnah_beard: 'Full Sunnah Beard',
        trimmed_beard: 'Trimmed Beard',
        clean_shaven: 'Clean Shaven',
      };
      return labels[covering] || covering;
    }
  };

  const getLocationFlag = (location: string) => {
    if (!location) return '🌍';
    const parts = location.split(',');
    if (parts.length < 2) return '🌍';
    const countryName = parts[parts.length - 1].trim();
    const country = getCountryByName(countryName);
    return country?.flag || '🌍';
  };

  const renderLockedField = (content: string | undefined, unlockMessage: string) => {
    const displayText = content || 'This information will be revealed once unlocked. The user has provided details here that you can discover by answering their questions.';
    
    return (
      <View style={styles.lockedSection}>
        <View style={styles.blurFallback}>
          <Text style={styles.lockedText}>{displayText}</Text>
        </View>
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockMessage}>{unlockMessage}</Text>
        </View>
      </View>
    );
  };

  if (isLoading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
      </View>
    );
  }

  const coveringType = profileType === 'sister' ? 'hijab' : 'beard';
  const coveringValue = profileType === 'sister' 
    ? profile.hijab_commitment 
    : profile.beard_commitment;
  
  const age = calculateAge(profile.date_of_birth);

  // Calculate unlocked sections based on questions answered
  const questionsAnswered = Math.floor(unlockPercentage / 20);
  const isDeenUnlocked = questionsAnswered >= 1; // Q1 - 20%
  const isLifestyleUnlocked = questionsAnswered >= 2; // Q2 - 40%
  const isPersonalityUnlocked = questionsAnswered >= 3; // Q3 - 60%
  const isMaritalUnlocked = questionsAnswered >= 4; // Q4 - 80%
  const isFullyUnlocked = questionsAnswered >= 5; // Q5 - 100%

  const isOwnProfile = currentUserId === id;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={styles.username}>{profile.username}</Text>
          <Text style={styles.age}>{age}</Text>
        </View>

        <View style={styles.eliteBadge}>
          <Text style={styles.eliteStar}>⭐</Text>
          <Text style={styles.eliteText}>Elite Profile</Text>
        </View>

        {/* Show progress bar only if there's an active interest */}
        {interestId && !isOwnProfile && (
          <>
            <Text style={styles.progressText}>
              Profile Unlock Progress: {unlockPercentage}% ({questionsAnswered}/5 questions)
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${unlockPercentage}%` }]} />
            </View>
          </>
        )}

        <View style={styles.locationRow}>
          <Text style={styles.flag}>{getLocationFlag(profile.location)}</Text>
          <Text style={styles.locationText}>{profile.location}</Text>
        </View>

        {/* BASIC INFO - ALWAYS VISIBLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Marital Status</Text>
              <Text style={styles.infoValue}>{getMaritalStatusLabel(profile.marital_status)}</Text>
            </View>

            {profile.build && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Build</Text>
                <Text style={styles.infoValue}>{getBuildLabel(profile.build)}</Text>
              </View>
            )}

            {profile.physical_fitness && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fitness Level</Text>
                <Text style={styles.infoValue}>{getPhysicalFitnessLabel(profile.physical_fitness)}</Text>
              </View>
            )}

            {coveringValue && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Covering</Text>
                <Text style={styles.infoValue}>{getCoveringLabel(coveringValue, coveringType)}</Text>
              </View>
            )}

            {profile.revert !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Revert Muslim</Text>
                <Text style={styles.infoValue}>{profile.revert ? 'Yes' : 'No'}</Text>
              </View>
            )}

            {profile.children !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Has Children</Text>
                <Text style={styles.infoValue}>{profile.children ? 'Yes' : 'No'}</Text>
              </View>
            )}

            {profile.memorization_quran && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quran Memorization</Text>
                <Text style={styles.infoValue}>{profile.memorization_quran}</Text>
              </View>
            )}

            {profile.prayer_consistency && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Prayer Consistency</Text>
                <Text style={styles.infoValue}>{profile.prayer_consistency}</Text>
              </View>
            )}

            {profile.islamic_knowledge_level && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Islamic Knowledge</Text>
                <Text style={styles.infoValue}>{profile.islamic_knowledge_level}</Text>
              </View>
            )}

            {profile.family_involvement && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Family Involvement</Text>
                <Text style={styles.infoValue}>{profile.family_involvement}</Text>
              </View>
            )}

            {profileType === 'brother' && profile.polygyny_willingness !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Polygyny Willing</Text>
                <Text style={styles.infoValue}>{profile.polygyny_willingness ? 'Yes' : 'No'}</Text>
              </View>
            )}

            {profileType === 'sister' && profile.polygyny_acceptance !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Polygyny Accepting</Text>
                <Text style={styles.infoValue}>{profile.polygyny_acceptance ? 'Yes' : 'No'}</Text>
              </View>
            )}

            {profile.disabilities && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Disabilities</Text>
                <Text style={styles.infoValue}>{profile.disabilities}</Text>
              </View>
            )}
          </View>
        </View>

        {/* DEEN - Unlocks at Q1 (20%) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Deen {!isDeenUnlocked && '🔒'}
          </Text>
          
          {isDeenUnlocked || isOwnProfile ? (
            <Text style={styles.longText}>
              {profile.deen || 'No description provided'}
            </Text>
          ) : (
            renderLockedField(profile.deen, 'Answer Question 1 (Deen) to unlock')
          )}
        </View>

        {/* ISLAMIC EDUCATION - Unlocks at Q1 (20%) */}
        {profile.islamic_education && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Islamic Education {!isDeenUnlocked && '🔒'}
            </Text>
            
            {isDeenUnlocked || isOwnProfile ? (
              <Text style={styles.longText}>
                {profile.islamic_education || 'No details provided'}
              </Text>
            ) : (
              renderLockedField(profile.islamic_education, 'Answer Question 1 (Deen) to unlock')
            )}
          </View>
        )}

        {/* LIFESTYLE - Unlocks at Q2 (40%) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Lifestyle {!isLifestyleUnlocked && '🔒'}
          </Text>
          
          {isLifestyleUnlocked || isOwnProfile ? (
            <Text style={styles.longText}>
              {profile.lifestyle || 'No description provided'}
            </Text>
          ) : (
            renderLockedField(profile.lifestyle, 'Answer Question 2 (Lifestyle) to unlock')
          )}
        </View>

        {/* PERSONALITY - Unlocks at Q3 (60%) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Personality {!isPersonalityUnlocked && '🔒'}
          </Text>
          
          {isPersonalityUnlocked || isOwnProfile ? (
            <Text style={styles.longText}>
              {profile.personality || 'No description provided'}
            </Text>
          ) : (
            renderLockedField(profile.personality, 'Answer Question 3 (Fitness/Personality) to unlock')
          )}
        </View>

        {/* CONFLICT RESOLUTION - Unlocks at Q4 (80%) */}
        {profile.conflict_resolution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Conflict Resolution {!isMaritalUnlocked && '🔒'}
            </Text>
            
            {isMaritalUnlocked || isOwnProfile ? (
              <Text style={styles.longText}>
                {profile.conflict_resolution || 'No description provided'}
              </Text>
            ) : (
              renderLockedField(profile.conflict_resolution, 'Answer Question 4 (Marital Life) to unlock')
            )}
          </View>
        )}

        {/* SPOUSE CRITERIA - Unlocks at Q5 (100%) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Spouse Criteria {!isFullyUnlocked && '🔒'}
          </Text>
          
          {isFullyUnlocked || isOwnProfile ? (
            <Text style={styles.longText}>
              {profile.spouse_criteria || 'No criteria provided'}
            </Text>
          ) : (
            renderLockedField(profile.spouse_criteria, 'Answer all 5 questions to unlock')
          )}
        </View>

        {/* DEALBREAKERS - Unlocks at Q5 (100%) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Dealbreakers {!isFullyUnlocked && '🔒'}
          </Text>
          
          {isFullyUnlocked || isOwnProfile ? (
            <Text style={styles.longText}>
              {profile.dealbreakers || 'No dealbreakers specified'}
            </Text>
          ) : (
            renderLockedField(profile.dealbreakers, 'Answer all 5 questions to unlock')
          )}
        </View>

        {/* FINANCIAL RESPONSIBILITY - Brother only, unlocks at Q5 (100%) */}
        {profileType === 'brother' && profile.financial_responsibility && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Financial Responsibility {!isFullyUnlocked && '🔒'}
            </Text>
            
            {isFullyUnlocked || isOwnProfile ? (
              <Text style={styles.longText}>
                {profile.financial_responsibility || 'No description provided'}
              </Text>
            ) : (
              renderLockedField(profile.financial_responsibility, 'Answer all 5 questions to unlock')
            )}
          </View>
        )}

        {/* CHARITY HABITS - Unlocks at Q5 (100%) */}
        {profile.charity_habits && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Charity Habits {!isFullyUnlocked && '🔒'}
            </Text>
            
            {isFullyUnlocked || isOwnProfile ? (
              <Text style={styles.longText}>
                {profile.charity_habits || 'No description provided'}
              </Text>
            ) : (
              renderLockedField(profile.charity_habits, 'Answer all 5 questions to unlock')
            )}
          </View>
        )}

        {/* WALI CONTACT - Only shows for brothers viewing sisters at mutual interest */}
        {canViewWali && waliContact && profileType === 'sister' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Wali Contact</Text>
            
            <View style={styles.waliCard}>
              <View style={styles.waliHeader}>
                <Text style={styles.waliHeaderText}>
                  ✨ Mutual Interest Confirmed
                </Text>
                <Text style={styles.waliSubtext}>
                  Contact the Wali to proceed with the marriage process
                </Text>
              </View>

              <View style={styles.waliInfo}>
                <View style={styles.waliRow}>
                  <Text style={styles.waliLabel}>Name:</Text>
                  <Text style={styles.waliValue}>{waliContact.name}</Text>
                </View>

                <View style={styles.waliRow}>
                  <Text style={styles.waliLabel}>Relationship:</Text>
                  <Text style={styles.waliValue}>{waliContact.relationship}</Text>
                </View>

                {waliContact.phone && (
                  <View style={styles.waliRow}>
                    <Text style={styles.waliLabel}>Phone:</Text>
                    <Text style={styles.waliValue}>{waliContact.phone}</Text>
                  </View>
                )}

                {waliContact.email && (
                  <View style={styles.waliRow}>
                    <Text style={styles.waliLabel}>Email:</Text>
                    <Text style={styles.waliValue}>{waliContact.email}</Text>
                  </View>
                )}

                {waliContact.preferred_contact && (
                  <View style={styles.waliRow}>
                    <Text style={styles.waliLabel}>Preferred:</Text>
                    <Text style={[styles.waliValue, styles.preferred]}>
                      {waliContact.preferred_contact}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.waliButtons}>
                {waliContact.phone && (
                  <TouchableOpacity 
                    style={styles.waliButton}
                    onPress={handleCallWali}
                  >
                    <Text style={styles.waliButtonText}>📱 Call Wali</Text>
                  </TouchableOpacity>
                )}

                {waliContact.email && (
                  <TouchableOpacity 
                    style={styles.waliButton}
                    onPress={handleEmailWali}
                  >
                    <Text style={styles.waliButtonText}>✉️  Email Wali</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.waliReminder}>
                ☪️  Remember: All communication should be conducted with Islamic etiquette and respect for the Wali's role.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Bottom Buttons */}
      {!isOwnProfile && (
        <View style={styles.bottomContainer}>
          {!interestId ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleExpressInterest}
              disabled={isExpressing}
            >
              <Text style={styles.primaryButtonText}>
                {isExpressing ? 'Processing...' : 'Express Interest'}
              </Text>
            </TouchableOpacity>
          ) : unlockPercentage < 100 ? (
            <View style={styles.twoButtonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleContinueQuestions}
              >
                <Text style={styles.primaryButtonText}>
                  Continue Questions ({questionsAnswered}/5)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleNoLongerInterested}
              >
                <Text style={styles.secondaryButtonText}>Withdraw Interest</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 140,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#F2CC66',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  username: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 36,
    lineHeight: 48,
    color: '#070A12',
  },
  age: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 29,
    color: '#7B8799',
  },
  eliteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  eliteStar: {
    fontSize: 16,
  },
  eliteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#7B8799',
  },
  progressText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#070A12',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E7EAF0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F2CC66',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  flag: {
    fontSize: 24,
  },
  locationText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 19,
    color: '#7B8799',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 32,
    color: '#070A12',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#7B8799',
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 17,
    color: '#070A12',
  },
  longText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#070A12',
  },
  lockedSection: {
    position: 'relative',
    minHeight: 120,
  },
  blurFallback: {
    backgroundColor: '#E7EAF0',
    padding: 20,
    borderRadius: 8,
    minHeight: 120,
  },
  lockedText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#070A12',
    opacity: 0,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  lockMessage: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 17,
    color: '#7B8799',
    textAlign: 'center',
  },
  waliCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F2CC66',
  },
  waliHeader: {
    marginBottom: 16,
  },
  waliHeaderText: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#070A12',
    marginBottom: 4,
  },
  waliSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#7B8799',
  },
  waliInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  waliRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  waliLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#7B8799',
  },
  waliValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#070A12',
    flex: 1,
    textAlign: 'right',
  },
  preferred: {
    color: '#17803A',
    fontFamily: 'Inter_600SemiBold',
  },
  waliButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  waliButton: {
    flex: 1,
    backgroundColor: '#070A12',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  waliButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#F2CC66',
  },
  waliReminder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#7B8799',
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E7EAF0',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#070A12',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#F2CC66',
  },
  twoButtonContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#070A12',
  },
});