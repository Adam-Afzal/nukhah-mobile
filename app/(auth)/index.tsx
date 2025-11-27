// app/(auth)/index.tsx
import { getCountryByName, getEthnicityByName } from '@/lib/locationData';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type Tab = 'discover' | 'for-you' | 'featured';

interface Profile {
  id: string;
  username: string;
  slug: string;
  location: string;
  ethnicity: string;
  marital_status: string;
  build?: string;
  physical_fitness?: string;
  polygyny_willingness?: boolean;
  polygyny_acceptance?: boolean;
}

// Navigation Icons
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
    {count && count > 0 && (
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationCount}>{count > 99 ? '99+' : count}</Text>
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

export default function SearchScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('featured');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountType, setAccountType] = useState<'brother' | 'sister' | null>(null);

  useEffect(() => {
    loadUserAccountType();
  }, []);

  useEffect(() => {
    if (accountType) {
      loadProfiles();
    }
  }, [activeTab, accountType]);

  const loadUserAccountType = async () => {
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
        return;
      }

      const { data: sisterProfile } = await supabase
        .from('sister')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (sisterProfile) {
        setAccountType('sister');
      }
    } catch (error) {
      console.error('Error loading account type:', error);
    }
  };

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      const targetTable = accountType === 'brother' ? 'sister' : 'brother';
      const polygynyField = targetTable === 'sister' ? 'polygyny_acceptance' : 'polygyny_willingness';
      
      let query = supabase
        .from(targetTable)
        .select(`id, username, slug, location, ethnicity, marital_status, build, physical_fitness, ${polygynyField}`)
        .limit(20);

      const { data, error } = await query;

      if (error) {
        console.error('Query error:', error);
        throw error;
      }
      
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setIsLoading(false);
    }
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

  const getPhysicalFitnessColor = (fitness?: string) => {
    switch (fitness) {
      case 'athlete':
        return styles.athleteTag;
      case 'very_fit':
        return styles.veryFitTag;
      case 'fit':
        return styles.fitTag;
      default:
        return styles.defaultTag;
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

  const getEthnicityFlag = (ethnicity: string) => {
    if (!ethnicity) return '🌍';
    const eth = getEthnicityByName(ethnicity);
    return eth?.flag || '🌍';
  };

  const renderProfileCard = ({ item }: { item: Profile }) => {
    const hasPolygyny = accountType === 'brother' 
      ? item.polygyny_acceptance 
      : item.polygyny_willingness;

    return (
      <TouchableOpacity 
        style={styles.profileCard}
        onPress={() => {
          console.log('View profile:', item.username);
        }}
      >
        <View style={styles.profileHeader}>
          <Text style={styles.unlockText}>Profile Unlock: 60%</Text>
          {hasPolygyny && (
            <View style={styles.polygynyBadge}>
              <Text style={styles.polygynyText}>Polygyny-Open</Text>
            </View>
          )}
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '60%' }]} />
        </View>

        <View style={styles.usernameRow}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.flag}>{getLocationFlag(item.location)}</Text>
        </View>

        {activeTab === 'featured' && (
          <View style={styles.crownBadge}>
            <Text style={styles.crownText}>👑 Crown</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            {getLocationFlag(item.location)} {item.location || 'Location not set'}
          </Text>
          {item.ethnicity && (
            <Text style={styles.infoText}>
              {getEthnicityFlag(item.ethnicity)} {item.ethnicity}
            </Text>
          )}
        </View>

        <View style={styles.tagsRow}>
          <View style={[styles.tag, item.marital_status === 'never_married' ? styles.greenTag : styles.defaultTag]}>
            <Text style={[styles.tagText, item.marital_status === 'never_married' && styles.greenTagText]}>
              {getMaritalStatusLabel(item.marital_status)}
            </Text>
          </View>
          
          {item.build && (
            <View style={[styles.tag, styles.defaultTag]}>
              <Text style={styles.tagText}>
                {getBuildLabel(item.build)}
              </Text>
            </View>
          )}
          
          {item.physical_fitness && (
            <View style={[styles.tag, getPhysicalFitnessColor(item.physical_fitness)]}>
              <Text style={[styles.tagText, (item.physical_fitness === 'athlete' || item.physical_fitness === 'very_fit') && styles.greenTagText]}>
                {getPhysicalFitnessLabel(item.physical_fitness)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No profiles found</Text>
      <Text style={styles.emptySubtext}>Check back soon for new members</Text>
    </View>
  );

  if (isLoading && profiles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Who are you looking for?</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'for-you' && styles.activeTab]}
          onPress={() => setActiveTab('for-you')}
        >
          <Text style={[styles.tabText, activeTab === 'for-you' && styles.activeTabText]}>
            For You
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'featured' && styles.activeTab]}
          onPress={() => setActiveTab('featured')}
        >
          <Text style={[styles.tabText, activeTab === 'featured' && styles.activeTabText]}>
            Featured
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={profiles}
        renderItem={renderProfileCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation Bar */}
      <View style={styles.navbar}>
        <View style={styles.navbarBorder} />
        
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navItem} onPress={() => {}}>
            <InterestsIcon active={false} />
            <Text style={styles.navLabelInactive}>Interests</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => {}}>
            <SearchIcon active={true} />
            <Text style={styles.navLabelActive}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => {}}>
            <NotificationsIcon active={false} count={12} />
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
    paddingTop: 51,
    paddingBottom: 16,
    backgroundColor: '#F7F8FB',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 24,
    lineHeight: 32,
    color: '#070A12',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F7F8FB',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#F8F1DA',
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
  listContainer: {
    paddingHorizontal: 28,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unlockText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 13,
    color: '#7B8799',
  },
  polygynyBadge: {
    backgroundColor: '#F2CC66',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  polygynyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 13,
    color: '#070A12',
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F8F1DA',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F2CC66',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  username: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 20,
    lineHeight: 27,
    color: '#070A12',
  },
  flag: {
    fontSize: 16,
    lineHeight: 19,
  },
  crownBadge: {
    position: 'absolute',
    top: 72,
    right: 16,
    backgroundColor: '#F2CC66',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  crownText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 13,
    color: '#070A12',
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    color: '#7B8799',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  defaultTag: {
    backgroundColor: '#F8F1DA',
  },
  veryFitTag: {
    backgroundColor: '#EAF5EE',
  },
  fitTag: {
    backgroundColor: '#E7EAF0',
  },
  athleteTag: {
    backgroundColor: '#EAF5EE',
  },
  greenTag: {
    backgroundColor: '#EAF5EE',
  },
  tagText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 13,
    color: '#070A12',
    textAlign: 'center',
  },
  greenTagText: {
    color: '#17803A',
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
  },
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