// app/(auth)/profile/[id].tsx
import { acceptInterest, expressInterest, getInterest, rejectInterest, withdrawInterest } from '@/lib/interestService';
import { getCountryByName } from '@/lib/locationData';
import { getWaliContact } from '@/lib/profileAccessService';
import { supabase } from '@/lib/supabase';
import { useUserStatus } from '@/hooks/useUserStatus';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface ProfileData {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  location_country: string;
  location_city: string;
  ethnicity: string;
  marital_status: string;
  build?: string;
  occupation?: string;
  revert?: boolean;
  children?: boolean;
  disabilities?: string;
  prayer_consistency?: string;
  beard_commitment?: string;
  hijab_commitment?: string;
  open_to_polygyny?: boolean;
  open_to_hijrah?: boolean;
  living_arrangements?: string;
  preferred_ethnicity?: string[];
  other_spouse_criteria?: string;
  dealbreakers?: string;
  hobbies_and_interests?: string;
  personality?: string;
  applied_by_wali?: boolean;
  wali_name?: string;
  wali_relationship?: string;
  wali_email?: string;
  wali_phone?: string;
  wali_preferred_contact?: string;
  phone?: string;
  masjid_id?: string;
  is_masjid_affiliated?: boolean;
}

interface WaliContact {
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  preferred_contact?: string;
}

interface MasjidInfo {
  id: string;
  name: string;
  marriage_service_url?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { data: userStatus } = useUserStatus();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileType, setProfileType] = useState<'brother' | 'sister' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountType, setAccountType] = useState<'brother' | 'sister' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [interestId, setInterestId] = useState<string | null>(null);
  const [interestStatus, setInterestStatus] = useState<string | null>(null);
  const [receivedInterestId, setReceivedInterestId] = useState<string | null>(null);
  const [receivedInterestStatus, setReceivedInterestStatus] = useState<string | null>(null);
  const [isExpressing, setIsExpressing] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [waliContact, setWaliContact] = useState<WaliContact | null>(null);
  const [canViewWali, setCanViewWali] = useState(false);
  const [canViewBrotherPhone, setCanViewBrotherPhone] = useState(false);
  const [profileMasjid, setProfileMasjid] = useState<MasjidInfo | null>(null);
  const [currentUserMasjid, setCurrentUserMasjid] = useState<MasjidInfo | null>(null);
  const [hasVerifiedReference, setHasVerifiedReference] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { userId, acctType } = await loadCurrentUser();
      await Promise.all([
        loadProfile(userId, acctType),
        userId && acctType ? loadCurrentUserMasjid(userId, acctType) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentUser = async (): Promise<{ userId: string | null; acctType: 'brother' | 'sister' | null }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { userId: null, acctType: null };

      const { data: brotherProfile } = await supabase
        .from('brother')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (brotherProfile) {
        setAccountType('brother');
        setCurrentUserId(brotherProfile.id);
        return { userId: brotherProfile.id, acctType: 'brother' };
      }

      const { data: sisterProfile } = await supabase
        .from('sister')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (sisterProfile) {
        setAccountType('sister');
        setCurrentUserId(sisterProfile.id);
        return { userId: sisterProfile.id, acctType: 'sister' };
      }

      return { userId: null, acctType: null };
    } catch (error) {
      console.error('Error loading current user:', error);
      return { userId: null, acctType: null };
    }
  };

  const loadProfile = async (userId: string | null, acctType: 'brother' | 'sister' | null) => {
    if (!id) return;

    try {
      // Try brother first
      const { data: brotherData } = await supabase
        .from('brother')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (brotherData) {
        setProfile(brotherData);
        setProfileType('brother');
        await Promise.all([
          loadProfileMasjid(id, 'brother'),
          loadReferenceVerification(id, 'brother'),
        ]);
        if (userId && acctType) await checkInterestStatusAndAccess(userId, acctType, id, 'brother');
        return;
      }

      // Try sister
      const { data: sisterData } = await supabase
        .from('sister')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (sisterData) {
        setProfile(sisterData);
        setProfileType('sister');
        await Promise.all([
          loadProfileMasjid(id, 'sister'),
          loadReferenceVerification(id, 'sister'),
        ]);
        if (userId && acctType) await checkInterestStatusAndAccess(userId, acctType, id, 'sister');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const checkInterestStatusAndAccess = async (
    userId: string,
    acctType: 'brother' | 'sister',
    recipientId: string,
    recipientType: 'brother' | 'sister'
  ) => {
    // Check my interest in them
    const myInterest = await getInterest(userId, recipientId);

    if (myInterest && myInterest.status !== 'withdrawn') {
      setInterestId(myInterest.id);
      setInterestStatus(myInterest.status);
    }

    // Check their interest in me (received interest)
    const theirInterest = await getInterest(recipientId, userId);

    if (theirInterest && theirInterest.status !== 'withdrawn') {
      setReceivedInterestId(theirInterest.id);
      setReceivedInterestStatus(theirInterest.status);
    }

    // Check match access (accepted interest in either direction)
    const hasAcceptedInterest =
      (myInterest && myInterest.status === 'accepted') ||
      (theirInterest && theirInterest.status === 'accepted');

    if (hasAcceptedInterest) {
      // Brother viewing sister: show wali contact
      if (acctType === 'brother' && recipientType === 'sister') {
        setCanViewWali(true);
        const wali = await getWaliContact(userId, recipientId);
        if (wali) {
          setWaliContact(wali);
        }
      }

      // Sister viewing brother: show brother phone
      if (acctType === 'sister' && recipientType === 'brother') {
        setCanViewBrotherPhone(true);
      }

    }
  };

  const loadReferenceVerification = async (profileId: string, profileType: 'brother' | 'sister') => {
    try {
      const { count } = await supabase
        .from('reference')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profileId)
        .eq('user_type', profileType)
        .eq('verification_status', 'verified');

      setHasVerifiedReference((count ?? 0) > 0);
    } catch (error) {
      console.error('Error loading reference verification:', error);
    }
  };

  const loadProfileMasjid = async (profileId: string, profileType: 'brother' | 'sister') => {
    try {
      // Check if profile has a verified masjid affiliation
      const { data: verification } = await supabase
        .from('imam_verification')
        .select('masjid_id')
        .eq('user_id', profileId)
        .eq('user_type', profileType)
        .eq('status', 'verified')
        .maybeSingle();

      if (!verification?.masjid_id) return;

      const { data: masjid } = await supabase
        .from('masjid')
        .select('id, name, marriage_service_url')
        .eq('id', verification.masjid_id)
        .single();

      if (masjid) {
        setProfileMasjid(masjid);
      }
    } catch (error) {
      console.error('Error loading profile masjid:', error);
    }
  };

  const loadCurrentUserMasjid = async (userId: string, acctType: 'brother' | 'sister') => {
    try {
      const { data: verification } = await supabase
        .from('imam_verification')
        .select('masjid_id')
        .eq('user_id', userId)
        .eq('user_type', acctType)
        .eq('status', 'verified')
        .maybeSingle();

      if (!verification?.masjid_id) return;

      const { data: masjid } = await supabase
        .from('masjid')
        .select('id, name, marriage_service_url')
        .eq('id', verification.masjid_id)
        .single();

      if (masjid) {
        setCurrentUserMasjid(masjid);
      }
    } catch (error) {
      console.error('Error loading current user masjid:', error);
    }
  };

  const handleExpressInterest = async () => {
    if (!currentUserId || !accountType || !id || !profile) return;

    const canAct = userStatus?.testingMode || userStatus?.paid;
    if (!canAct) {
      Alert.alert(
        'Membership Required',
        'You need an active membership to express interest. Join now for £19.99/month.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Get Membership', onPress: () => router.push('/(auth)/payment') },
        ]
      );
      return;
    }

    setIsExpressing(true);
    try {
      const recipientType = profileType || (accountType === 'brother' ? 'sister' : 'brother');
      const result = await expressInterest(currentUserId, accountType, id, recipientType);

      if (result.success && result.interestId) {
        setInterestId(result.interestId);
        setInterestStatus('pending');
      } else {
        Alert.alert('Error', 'Failed to express interest. Please try again.');
      }
    } catch (error) {
      console.error('Error expressing interest:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsExpressing(false);
    }
  };

  const handleWithdrawInterest = async () => {
    if (!interestId) return;

    try {
      const result = await withdrawInterest(interestId);
      if (result.success) {
        setInterestId(null);
        setInterestStatus(null);
      } else {
        Alert.alert('Error', result.error || 'Failed to withdraw interest.');
      }
    } catch (error) {
      console.error('Error withdrawing interest:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const handleAcceptInterest = async () => {
    if (!receivedInterestId) return;

    const canAct = userStatus?.testingMode || userStatus?.paid;
    if (!canAct) {
      Alert.alert(
        'Membership Required',
        'You need an active membership to accept interest. Join now for £19.99/month.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Get Membership', onPress: () => router.push('/(auth)/payment') },
        ]
      );
      return;
    }

    setIsAccepting(true);
    try {
      const result = await acceptInterest(receivedInterestId);
      if (result.success) {
        setReceivedInterestStatus('accepted');
        // Brother viewing sister: show wali
        if (accountType === 'brother' && profileType === 'sister' && currentUserId) {
          setCanViewWali(true);
          const wali = await getWaliContact(currentUserId, id!);
          if (wali) {
            setWaliContact(wali);
          }
        }
        // Sister viewing brother: show phone
        if (accountType === 'sister' && profileType === 'brother') {
          setCanViewBrotherPhone(true);
        }
        // Load masjid info for nikkah service
        if (profileType) {
          await loadProfileMasjid(id!, profileType);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to accept interest.');
      }
    } catch (error) {
      console.error('Error accepting interest:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectInterest = async () => {
    if (!receivedInterestId) return;

    const canAct = userStatus?.testingMode || userStatus?.paid;
    if (!canAct) {
      Alert.alert(
        'Membership Required',
        'You need an active membership to manage interests. Join now for £19.99/month.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Get Membership', onPress: () => router.push('/(auth)/payment') },
        ]
      );
      return;
    }

    setIsRejecting(true);
    try {
      const result = await rejectInterest(receivedInterestId);
      if (result.success) {
        setReceivedInterestStatus('rejected');
      } else {
        Alert.alert('Error', result.error || 'Failed to reject interest.');
      }
    } catch (error) {
      console.error('Error rejecting interest:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsRejecting(false);
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
        `I am contacting you regarding a marriage proposal for ${profile.username} through the Mithaq matrimonial platform.\n\n` +
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

  const getLocationFlag = (countryName: string) => {
    if (!countryName) return '🌍';
    const country = getCountryByName(countryName);
    return country?.flag || '🌍';
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
  const isOwnProfile = currentUserId === id;

  // Determine what bottom buttons to show
  const isMatched =
    interestStatus === 'accepted' || receivedInterestStatus === 'accepted';
  const isRejectedByThem = interestStatus === 'rejected';
  const isRejectedByYou = receivedInterestStatus === 'rejected';
  const showReceivedInterestButtons = !isOwnProfile && receivedInterestId && receivedInterestStatus === 'pending';
  const showExpressInterestButton = !isOwnProfile && !interestId && !showReceivedInterestButtons && !isMatched && !isRejectedByThem && !isRejectedByYou;
  const showWithdrawButton = !isOwnProfile && interestId && interestStatus === 'pending' && !showReceivedInterestButtons;

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

        {/* Wali-registered badge */}
        {profileType === 'sister' && profile.applied_by_wali && (
          <View style={styles.verificationRow}>
            <View style={styles.waliBadge}>
              <Text style={styles.waliBadgeText}>Profile registered by Wali</Text>
            </View>
          </View>
        )}

        {/* Verification badges */}
        {(profileMasjid || hasVerifiedReference) && (
          <View style={styles.verificationRow}>
            {profileMasjid && (
              <View style={styles.verificationBadge}>
                <Text style={styles.verificationText}>🕌 {profileMasjid.name} (Verified)</Text>
              </View>
            )}
            {hasVerifiedReference && (
              <View style={styles.verificationBadge}>
                <Text style={styles.verificationText}>✓ Reference Verified</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.locationRow}>
          <Text style={styles.flag}>{getLocationFlag(profile.location_country)}</Text>
          <Text style={styles.locationText}>{profile.location_city ? `${profile.location_city}, ${profile.location_country}` : profile.location_country}</Text>
        </View>

        {/* BASIC INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.infoGrid}>
            {profile.ethnicity && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ethnicity</Text>
                <Text style={styles.infoValue}>{profile.ethnicity}</Text>
              </View>
            )}

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

            {profile.occupation && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Occupation</Text>
                <Text style={styles.infoValue}>{profile.occupation}</Text>
              </View>
            )}

            {profile.prayer_consistency && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Prayer</Text>
                <Text style={styles.infoValue}>
                  {profile.prayer_consistency === '5x_daily' ? '5x Daily' : profile.prayer_consistency === 'as_much_as_possible' ? 'As Much as Possible' : profile.prayer_consistency}
                </Text>
              </View>
            )}

            {coveringValue && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{profileType === 'sister' ? 'Hijab' : 'Beard'}</Text>
                <Text style={styles.infoValue}>{getCoveringLabel(coveringValue, coveringType)}</Text>
              </View>
            )}

            {profile.children !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Has Children</Text>
                <Text style={styles.infoValue}>{profile.children ? 'Yes' : 'No'}</Text>
              </View>
            )}

            {profile.open_to_hijrah !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Open to Hijrah</Text>
                <Text style={styles.infoValue}>{profile.open_to_hijrah ? 'Yes' : 'No'}</Text>
              </View>
            )}

            {profileType === 'sister' && profile.open_to_polygyny !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Open to Polygyny</Text>
                <Text style={styles.infoValue}>{profile.open_to_polygyny ? 'Yes' : 'No'}</Text>
              </View>
            )}

            {profile.disabilities ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Disabilities</Text>
                <Text style={styles.infoValue}>{profile.disabilities}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* PERSONALITY */}
        {profile.personality ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personality</Text>
            <Text style={styles.longText}>{profile.personality}</Text>
          </View>
        ) : null}

        {/* HOBBIES & INTERESTS */}
        {profile.hobbies_and_interests ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hobbies & Interests</Text>
            <Text style={styles.longText}>{profile.hobbies_and_interests}</Text>
          </View>
        ) : null}

        {/* LIVING ARRANGEMENTS */}
        {profile.living_arrangements ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Living Arrangements</Text>
            <Text style={styles.longText}>{profile.living_arrangements}</Text>
          </View>
        ) : null}

        {/* SPOUSE CRITERIA */}
        {profile.other_spouse_criteria ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spouse Criteria</Text>
            <Text style={styles.longText}>{profile.other_spouse_criteria}</Text>
          </View>
        ) : null}

        {/* DEALBREAKERS */}
        {profile.dealbreakers ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dealbreakers</Text>
            <Text style={styles.longText}>{profile.dealbreakers}</Text>
          </View>
        ) : null}

        {/* WALI CONTACT - Only shows for brothers viewing sisters with accepted interest */}
        {canViewWali && waliContact && profileType === 'sister' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Wali Contact</Text>

            <View style={styles.waliCard}>
              <View style={styles.waliHeader}>
                <Text style={styles.waliHeaderText}>
                  ✨ Interest Accepted
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

        {/* BROTHER CONTACT - Only shows for sisters viewing brothers with accepted interest */}
        {canViewBrotherPhone && profile?.phone && profileType === 'brother' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 Contact Details</Text>

            <View style={styles.waliCard}>
              <View style={styles.waliHeader}>
                <Text style={styles.waliHeaderText}>
                  ✨ Interest Accepted
                </Text>
                <Text style={styles.waliSubtext}>
                  Share this contact with your Wali to proceed
                </Text>
              </View>

              <View style={styles.waliInfo}>
                <View style={styles.waliRow}>
                  <Text style={styles.waliLabel}>Name:</Text>
                  <Text style={styles.waliValue}>{profile.first_name} {profile.last_name}</Text>
                </View>
                <View style={styles.waliRow}>
                  <Text style={styles.waliLabel}>Phone:</Text>
                  <Text style={styles.waliValue}>{profile.phone}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.waliButton}
                onPress={() => Linking.openURL(`tel:${profile.phone}`)}
              >
                <Text style={styles.waliButtonText}>📱 Call</Text>
              </TouchableOpacity>

              <Text style={[styles.waliReminder, { marginTop: 12 }]}>
                ☪️  Remember: All communication should be conducted with Islamic etiquette. Share this with your Wali.
              </Text>
            </View>
          </View>
        )}

        {/* NIKKAH SERVICES - Only shows when matched, for masjids that offer the service */}
        {isMatched && (profileMasjid?.marriage_service_url || currentUserMasjid?.marriage_service_url) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕌 Nikkah Services</Text>

            {profileMasjid?.marriage_service_url && (
              <View style={[styles.nikkahCard, currentUserMasjid?.marriage_service_url ? { marginBottom: 12 } : undefined]}>
                <Text style={styles.nikkahText}>
                  {profileMasjid.name} offers a nikkah service
                </Text>
                <TouchableOpacity onPress={() => Linking.openURL(profileMasjid.marriage_service_url!)}>
                  <Text style={styles.nikkahLink}>Explore it here →</Text>
                </TouchableOpacity>
              </View>
            )}

            {currentUserMasjid?.marriage_service_url && currentUserMasjid.id !== profileMasjid?.id && (
              <View style={styles.nikkahCard}>
                <Text style={styles.nikkahText}>
                  {currentUserMasjid.name} offers a nikkah service
                </Text>
                <TouchableOpacity onPress={() => Linking.openURL(currentUserMasjid.marriage_service_url!)}>
                  <Text style={styles.nikkahLink}>Explore it here →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Bottom Buttons */}
      {!isOwnProfile && (
        <View style={styles.bottomContainer}>
          {showReceivedInterestButtons && (
            <View style={styles.twoButtonContainer}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptInterest}
                disabled={isAccepting}
              >
                <Text style={styles.acceptButtonText}>
                  {isAccepting ? 'Accepting...' : 'Accept Interest'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={handleRejectInterest}
                disabled={isRejecting}
              >
                <Text style={styles.rejectButtonText}>
                  {isRejecting ? 'Rejecting...' : 'Reject Interest'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {showExpressInterestButton && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleExpressInterest}
              disabled={isExpressing}
            >
              <Text style={styles.primaryButtonText}>
                {isExpressing ? 'Processing...' : 'Express Interest'}
              </Text>
            </TouchableOpacity>
          )}

          {showWithdrawButton && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleWithdrawInterest}
            >
              <Text style={styles.secondaryButtonText}>Withdraw Interest</Text>
            </TouchableOpacity>
          )}

          {!isOwnProfile && isMatched && (
            <View style={styles.matchedButton}>
              <Text style={styles.matchedButtonText}>Matched</Text>
            </View>
          )}

          {!isOwnProfile && isRejectedByThem && !isMatched && (
            <View style={styles.rejectedButton}>
              <Text style={styles.rejectedButtonText}>Rejected (by them)</Text>
            </View>
          )}

          {!isOwnProfile && isRejectedByYou && !isMatched && (
            <View style={styles.rejectedButton}>
              <Text style={styles.rejectedButtonText}>Rejected (by you)</Text>
            </View>
          )}
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
  verificationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  verificationBadge: {
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#17803A',
  },
  verificationText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 15,
    color: '#17803A',
  },
  waliBadge: {
    backgroundColor: 'rgba(242, 204, 102, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(242, 204, 102, 0.4)',
  },
  waliBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 15,
    color: '#F2CC66',
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
  acceptButton: {
    backgroundColor: '#17803A',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  rejectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E03A3A',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#E03A3A',
  },
  secondaryButton: {
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
  matchedButton: {
    backgroundColor: '#EAF5EE',
    borderWidth: 1,
    borderColor: '#17803A',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  matchedButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#17803A',
  },
  rejectedButton: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#E03A3A',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  rejectedButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#E03A3A',
  },
  nikkahCard: {
    backgroundColor: '#EAF5EE',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#17803A',
  },
  nikkahText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    color: '#070A12',
    marginBottom: 8,
  },
  nikkahLink: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#17803A',
  },
});
