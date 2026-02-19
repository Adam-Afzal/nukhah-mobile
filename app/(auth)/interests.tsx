// app/(auth)/interests.tsx
import { getMyInterests, getReceivedInterests } from '@/lib/interestService';
import { getCountryByName, getEthnicityByName } from '@/lib/locationData';
import { supabase } from '@/lib/supabase';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type Tab = 'expressed' | 'your' | 'mutual';

interface InterestRequest {
  id: string;
  requester_id: string;
  requester_type: 'brother' | 'sister';
  recipient_id: string;
  recipient_type: 'brother' | 'sister';
  unlock_percentage: number;
  status: string;
  created_at: string;
  profile_username?: string;
  profile_location_country?: string;
  profile_location_city?: string;
  profile_ethnicity?: string;
  profile_marital_status?: string;
  profile_build?: string;
  profile_date_of_birth?: string;
  profile_prayer_consistency?: string;
}

// Navigation Icons (same as index.tsx)
const InterestsIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7563 5.72718 21.351 5.12075 20.84 4.61Z"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle
      cx={11}
      cy={11}
      r={8}
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 21L16.65 16.65"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const NotificationsIcon = ({ active, count }: { active: boolean; count?: number }) => (
  <View style={{ position: 'relative' }}>
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke={active ? '#F2CC66' : '#7B8799'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
        stroke={active ? '#F2CC66' : '#7B8799'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
    {(count !== undefined && count > 0) && (
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationCount}>
          {count > 99 ? '99+' : String(count)}
        </Text>
      </View>
    )}
  </View>
);

const SettingsIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle
      cx={12}
      cy={12}
      r={3}
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 1V3"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 21V23"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4.22 4.22L5.64 5.64"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.36 18.36L19.78 19.78"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1 12H3"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 12H23"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4.22 19.78L5.64 18.36"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.36 5.64L19.78 4.22"
      stroke={active ? '#F2CC66' : '#7B8799'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function InterestsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('expressed');
  const [expressedInterests, setExpressedInterests] = useState<InterestRequest[]>([]);
  const [yourInterests, setYourInterests] = useState<InterestRequest[]>([]);
  const [mutualInterests, setMutualInterests] = useState<InterestRequest[]>([]);
  const [waliContacts, setWaliContacts] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [accountType, setAccountType] = useState<'brother' | 'sister' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { unreadCount } = useUnreadNotifications();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await loadCurrentUser();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: brotherProfile } = await supabase
        .from('brother')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (brotherProfile) {
        setAccountType('brother');
        setCurrentUserId(brotherProfile.id);
        await loadAllInterests(brotherProfile.id, 'brother');
        return;
      }

      const { data: sisterProfile } = await supabase
        .from('sister')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (sisterProfile) {
        setAccountType('sister');
        setCurrentUserId(sisterProfile.id);
        await loadAllInterests(sisterProfile.id, 'sister');
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const fetchWaliContact = async (sisterId: string): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('sister')
        .select('wali_name, wali_relationship, wali_phone, wali_email, wali_preferred_contact')
        .eq('id', sisterId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching wali contact:', error);
      return null;
    }
  };

  const loadAllInterests = async (userId: string, userType: 'brother' | 'sister') => {
    try {
      // Load all received and sent interests
      const received = await getReceivedInterests(userId, userType);
      const sent = await getMyInterests(userId, userType);

      const waliData: Record<string, any> = {};

      // Matched = any accepted interest in either direction
      const acceptedSent = sent.filter(s => s.status === 'accepted');
      const acceptedReceived = received.filter(r => r.status === 'accepted');
      const acceptedSentIds = new Set(acceptedSent.map(s => s.id));
      const acceptedReceivedIds = new Set(acceptedReceived.map(r => r.id));

      // Fetch wali contacts for matched interests (brother viewing sisters)
      for (const interest of acceptedSent) {
        if (userType === 'brother' && interest.recipient_type === 'sister') {
          const wali = await fetchWaliContact(interest.recipient_id);
          if (wali) waliData[interest.recipient_id] = wali;
        }
      }
      for (const interest of acceptedReceived) {
        if (userType === 'brother' && interest.requester_type === 'sister') {
          const wali = await fetchWaliContact(interest.requester_id);
          if (wali) waliData[interest.requester_id] = wali;
        }
      }

      // "Expressed Interest" tab: received interests that are pending
      const pendingReceived = received.filter(r =>
        r.status === 'pending' && !acceptedReceivedIds.has(r.id)
      );
      const enrichedReceived = await enrichInterests(pendingReceived, 'requester');
      setExpressedInterests(enrichedReceived);

      // "Your Interests" tab: sent interests that are pending
      const pendingSent = sent.filter(s =>
        s.status === 'pending' && !acceptedSentIds.has(s.id)
      );
      const enrichedSent = await enrichInterests(pendingSent, 'recipient');
      setYourInterests(enrichedSent);

      // "Mutual Interest" tab: all accepted interests (either direction)
      const enrichedAcceptedSent = await enrichInterests(acceptedSent, 'recipient');
      const enrichedAcceptedReceived = await enrichInterests(acceptedReceived, 'requester');
      setMutualInterests([...enrichedAcceptedSent, ...enrichedAcceptedReceived]);
      setWaliContacts(waliData);

    } catch (error) {
      console.error('Error loading all interests:', error);
    }
  };

  const enrichInterests = async (
    interests: any[], 
    profileSource: 'requester' | 'recipient'
  ): Promise<InterestRequest[]> => {
    return Promise.all(
      interests.map(async (interest) => {
        const profileId = profileSource === 'requester' ? interest.requester_id : interest.recipient_id;
        const profileType = profileSource === 'requester' ? interest.requester_type : interest.recipient_type;
        
        const selectFields = 'username, location_country, location_city, ethnicity, marital_status, build, date_of_birth, prayer_consistency';

        const { data: profile } = await supabase
          .from(profileType)
          .select(selectFields)
          .eq('id', profileId)
          .single();

        return {
          ...interest,
          profile_username: profile?.username,
          profile_location_country: profile?.location_country,
          profile_location_city: profile?.location_city,
          profile_ethnicity: profile?.ethnicity,
          profile_marital_status: profile?.marital_status,
          profile_build: profile?.build,
          profile_date_of_birth: profile?.date_of_birth,
          profile_prayer_consistency: profile?.prayer_consistency,
        };
      })
    );
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
      curvaceous: 'Curvaceous',
      curvy_athletic: 'Curvy Athletic',
      hourglass: 'Hourglass',
      lean: 'Lean',
      muscular: 'Muscular',
      bulky: 'Bulky',
      heavyset: 'Heavyset',
      average: 'Average',
    };
    return labels[build] || build;
  };

  const getLocationFlag = (countryName: string) => {
    if (!countryName) return '🌍';
    const country = getCountryByName(countryName);
    return country?.flag || '🌍';
  };

  const getEthnicityFlag = (ethnicity: string) => {
    if (!ethnicity) return '🌍';
    const eth = getEthnicityByName(ethnicity);
    return eth?.flag || '🌍';
  };

  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const renderInterestCard = ({ item }: { item: InterestRequest }) => {
    const profileId = activeTab === 'expressed' ? item.requester_id : item.recipient_id;
    const profileType = activeTab === 'expressed' ? item.requester_type : item.recipient_type;
    
    // Check if wali contact should be shown
    const showWali = (
      activeTab === 'mutual' && 
      accountType === 'brother' && 
      profileType === 'sister' &&
      waliContacts[profileId]
    );
    const wali = showWali ? waliContacts[profileId] : null;

    const handleCardPress = () => {
      // Always navigate to the profile
      router.push(`/profile/${profileId}`);
    };

    const handleCallWali = () => {
      if (wali?.wali_phone) {
        const phoneUrl = `tel:${wali.wali_phone}`;
        Linking.openURL(phoneUrl);
      }
    };

    const handleEmailWali = () => {
      if (wali?.wali_email) {
        const emailUrl = `mailto:${wali.wali_email}`;
        Linking.openURL(emailUrl);
      }
    };

    const age = calculateAge(item.profile_date_of_birth);

    return (
      <TouchableOpacity
        style={styles.interestCard}
        onPress={handleCardPress}
      >
        <View style={styles.cardHeader}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>{item.profile_username}</Text>
            {age !== null && (
              <View style={styles.ageBadge}>
                <Text style={styles.ageText}>{age}</Text>
              </View>
            )}
            <Text style={styles.flag}>{getLocationFlag(item.profile_location_country || '')}</Text>
          </View>
          {/* Elite Badge (optional - add logic if needed) */}
          <View style={styles.eliteBadge}>
            <Text style={styles.eliteText}>⭐ Elite</Text>
          </View>
        </View>


        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            {getLocationFlag(item.profile_location_country || '')} {item.profile_location_city ? `${item.profile_location_city}, ${item.profile_location_country}` : item.profile_location_country || 'Location not set'}
          </Text>
        </View>

        {/* MUTUAL INTEREST - Show confirmation badge */}
        {activeTab === 'mutual' && (
          <View style={styles.mutualBadge}>
            <Text style={styles.mutualBadgeIcon}>✨</Text>
            <Text style={styles.mutualBadgeText}>Mutual Interest Confirmed</Text>
          </View>
        )}

        <View style={styles.tagsRow}>
          {item.profile_marital_status && (
            <View style={[styles.tag, item.profile_marital_status === 'never_married' ? styles.greenTag : styles.defaultTag]}>
              <Text style={[styles.tagText, item.profile_marital_status === 'never_married' && styles.greenTagText]}>
                {getMaritalStatusLabel(item.profile_marital_status)}
              </Text>
            </View>
          )}
          
          {item.profile_build && (
            <View style={[styles.tag, styles.defaultTag]}>
              <Text style={styles.tagText}>
                {getBuildLabel(item.profile_build)}
              </Text>
            </View>
          )}
        </View>

        {/* WALI CONTACT - Only show for brother viewing sister in mutual tab */}
        {showWali && wali && (
          <View style={styles.waliContactCard}>
            <View style={styles.waliHeader}>
              <Text style={styles.waliHeaderIcon}>👤</Text>
              <Text style={styles.waliHeaderText}>Wali Contact Information</Text>
            </View>

            <View style={styles.waliInfo}>
              <View style={styles.waliRow}>
                <Text style={styles.waliLabel}>Name:</Text>
                <Text style={styles.waliValue}>{wali.wali_name}</Text>
              </View>

              <View style={styles.waliRow}>
                <Text style={styles.waliLabel}>Relationship:</Text>
                <Text style={styles.waliValue}>{wali.wali_relationship}</Text>
              </View>

              <View style={styles.waliRow}>
                <Text style={styles.waliLabel}>Phone:</Text>
                <Text style={styles.waliValue}>{wali.wali_phone}</Text>
              </View>

              <View style={styles.waliRow}>
                <Text style={styles.waliLabel}>Email:</Text>
                <Text style={styles.waliValue}>{wali.wali_email}</Text>
              </View>

              <View style={styles.waliRow}>
                <Text style={styles.waliLabel}>Prefers:</Text>
                <Text style={styles.waliValue}>{wali.wali_preferred_contact}</Text>
              </View>
            </View>

            <View style={styles.waliButtons}>
              <TouchableOpacity 
                style={styles.waliButton}
                onPress={handleCallWali}
              >
                <Text style={styles.waliButtonText}>📱 Call Wali</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.waliButton}
                onPress={handleEmailWali}
              >
                <Text style={styles.waliButtonText}>✉️ Email Wali</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.waliReminder}>
              ☪️ Remember: All communication should be conducted with Islamic etiquette
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.viewButton} onPress={handleCardPress}>
          <Text style={styles.viewButtonText}>View Profile</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const messages = {
      expressed: {
        title: 'No interests yet',
        subtitle: 'When someone expresses interest in you, they\'ll appear here'
      },
      your: {
        title: 'No interests sent',
        subtitle: 'Express interest in profiles to see them here'
      },
      mutual: {
        title: 'No mutual interests',
        subtitle: 'When interests are mutual, they\'ll appear here'
      }
    };

    const message = messages[activeTab];

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{message.title}</Text>
        <Text style={styles.emptySubtext}>{message.subtitle}</Text>
      </View>
    );
  };

  const getCurrentInterests = () => {
    switch (activeTab) {
      case 'expressed':
        return expressedInterests;
      case 'your':
        return yourInterests;
      case 'mutual':
        return mutualInterests;
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
      </View>
    );
  }

  const currentInterests = getCurrentInterests();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Requests</Text>
        <Text style={styles.headerSubtitle}>Manage your interests and connections</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'expressed' && styles.activeTab]}
          onPress={() => setActiveTab('expressed')}
        >
          <Text style={[styles.tabText, activeTab === 'expressed' && styles.activeTabText]}>
            Expressed Interest
          </Text>
          {expressedInterests.length > 0 && activeTab !== 'expressed' && (
  <View style={styles.tabBadge}>
    <Text style={styles.tabBadgeText}>{expressedInterests.length}</Text>
  </View>
)}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'your' && styles.activeTab]}
          onPress={() => setActiveTab('your')}
        >
          <Text style={[styles.tabText, activeTab === 'your' && styles.activeTabText]}>
            Your Interests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'mutual' && styles.activeTab]}
          onPress={() => setActiveTab('mutual')}
        >
          <Text style={[styles.tabText, activeTab === 'mutual' && styles.activeTabText]}>
            Mutual Interest
          </Text>
          {mutualInterests.length > 0 && activeTab !== 'mutual' && (
  <View style={styles.tabBadge}>
    <Text style={styles.tabBadgeText}>{mutualInterests.length}</Text>
  </View>
)}
        </TouchableOpacity>
      </View>

      {/* Tab Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>
          {activeTab === 'expressed' && `${accountType === 'brother' ? 'Sisters' : 'Brothers'} who have expressed interest in you`}
          {activeTab === 'your' && `${accountType === 'brother' ? 'Sisters' : 'Brothers'} you're interested in`}
          {activeTab === 'mutual' && 'Both parties have accepted each other\'s interest'}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={currentInterests}
        renderItem={renderInterestCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation Bar */}
      <View style={styles.navbar}>
        <View style={styles.navbarBorder} />
        
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/interests')}>
            <InterestsIcon active={true} />
            <Text style={styles.navLabelActive}>Interests</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(auth)')}>
            <SearchIcon active={false} />
            <Text style={styles.navLabelInactive}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => router.push('/(auth)/notifications')}
          >
            <NotificationsIcon active={false} count={unreadCount} />
            <Text style={styles.navLabelInactive}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => router.push('/(auth)/settings')}
          >
            <SettingsIcon active={false} />
            <Text style={styles.navLabelInactive}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navbarIndicator} />
      </View>
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
  header: {
    paddingHorizontal: 28,
    paddingTop: 43,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 32,
    lineHeight: 43,
    color: '#070A12',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#7B8799',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  tab: {
    flex: 1,
    paddingVertical: 4,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,  // ← Changed from 6 to 4 for tighter spacing
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F2CC66',
  },
  tabText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    lineHeight: 16,
    color: '#7B8799',
    fontStyle: 'italic',
  },
  activeTabText: {
    color: '#070A12',
  },
  tabBadge: {
    backgroundColor: '#F2CC66',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 13,
    color: '#070A12',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  descriptionContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  descriptionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#7B8799',
  },
  listContainer: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 100,
  },
  interestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  username: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 20,
    lineHeight: 27,
    color: '#070A12',
  },
  ageBadge: {
    backgroundColor: '#F8F1DA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ageText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 15,
    color: '#070A12',
  },
  flag: {
    fontSize: 18,
    lineHeight: 22,
  },
  eliteBadge: {
    backgroundColor: '#E5E8EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  eliteText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 13,
    color: '#070A12',
    fontStyle: 'italic',
  },
  verificationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  verificationBadge: {
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#17803A',
  },
  verificationText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 12,
    color: '#17803A',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#7B8799',
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 17,
    color: '#070A12',
    fontStyle: 'italic',
  },
  progressPercentage: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 17,
    color: '#F2CC66',
    fontStyle: 'italic',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F8F1DA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F2CC66',
  },
  mutualBadge: {
    backgroundColor: 'rgba(242, 204, 102, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F2CC66',
  },
  mutualBadgeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  mutualBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#F2CC66',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  defaultTag: {
    backgroundColor: '#F8F1DA',
  },
  greenTag: {
    backgroundColor: '#EAF5EE',
  },
  tagText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    color: '#070A12',
    textAlign: 'center',
  },
  greenTagText: {
    color: '#17803A',
  },
  waliContactCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F2CC66',
  },
  waliHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2CC66',
  },
  waliHeaderIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  waliHeaderText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#070A12',
  },
  waliInfo: {
    gap: 8,
    marginBottom: 12,
  },
  waliRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waliLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#7B8799',
  },
  waliValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#070A12',
    flex: 1,
    textAlign: 'right',
  },
  waliButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  waliButton: {
    flex: 1,
    backgroundColor: '#F2CC66',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  waliButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#070A12',
  },
  waliReminder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#7B8799',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  viewButton: {
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 17,
    color: '#070A12',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#070A12',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7B8799',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  
  // Navigation
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  navbarBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E7EAF0',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navLabelActive: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 15,
    color: '#F2CC66',
    fontStyle: 'italic',
    marginTop: 4,
  },
  navLabelInactive: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    color: '#7B8799',
    marginTop: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E03A3A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationCount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 13,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  navbarIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    width: 100,
    height: 4,
    backgroundColor: '#070A12',
    opacity: 0.3,
    borderRadius: 2,
    transform: [{ translateX: -50 }],
  },
});