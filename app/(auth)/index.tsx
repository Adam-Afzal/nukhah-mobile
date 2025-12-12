// app/(auth)/index.tsx
import { findMatchesForBrother, findMatchesForSister } from '@/lib/embeddingService';
import { ETHNICITIES, getCountryByName, getEthnicityByName } from '@/lib/locationData';
import { supabase } from '@/lib/supabase';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

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
  prayer_consistency?: string;
  memorization_quran?: string;
  hijab_commitment?: string;
  date_of_birth?: string;
  similarity_score?: number;
}

interface Filters {
  searchText: string;
  location: string;
  ethnicity: string[];
  build: string[];
  fitnessLevel: string[];
  covering: string;
  polygyny: 'any' | 'open' | 'monogamy';
  maritalStatus: string[];
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

const FilterIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Line x1={3} y1={6} x2={21} y2={6} stroke="#070A12" strokeWidth={2} strokeLinecap="round" />
    <Line x1={3} y1={12} x2={21} y2={12} stroke="#070A12" strokeWidth={2} strokeLinecap="round" />
    <Line x1={3} y1={18} x2={21} y2={18} stroke="#070A12" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export default function SearchScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('for-you');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountType, setAccountType] = useState<'brother' | 'sister' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const { unreadCount } = useUnreadNotifications();
  
  const [filters, setFilters] = useState<Filters>({
    searchText: '',
    location: '',
    ethnicity: [],
    build: [],
    fitnessLevel: [],
    covering: '',
    polygyny: 'any',
    maritalStatus: [],
  });

  useEffect(() => {
    loadUserAccountType();
  }, []);

  useEffect(() => {
    if (accountType && currentUserId) {
      loadProfiles();
    }
  }, [activeTab, accountType, currentUserId]);

  useEffect(() => {
    applyFilters();
  }, [profiles, filters]);

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
        setCurrentUserId(brotherProfile.id);
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
      }
    } catch (error) {
      console.error('Error loading account type:', error);
    }
  };

  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'for-you') {
        await loadAIMatches();
      } else {
        await loadRegularProfiles();
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIMatches = async () => {
    if (!currentUserId || !accountType) {
      console.log('Missing data:', { currentUserId, accountType });
      return;
    }

    try {
      const matchData = accountType === 'brother'
        ? await findMatchesForBrother(currentUserId, 50)
        : await findMatchesForSister(currentUserId, 50);

      if (!matchData || matchData.length === 0) {
        console.log('No match data returned');
        setProfiles([]);
        return;
      }

      // RPC function returns: { id: uuid, similarity_score: float, username: text, location: text }
      const profileIds = matchData.map((m: any) => m.id);

      const targetTable = accountType === 'brother' ? 'sister' : 'brother';
      const polygynyField = targetTable === 'sister' ? 'polygyny_acceptance' : 'polygyny_willingness';
      const coveringField = targetTable === 'sister' ? 'hijab_commitment' : 'beard_commitment';
      
      const { data: profileDetails, error } = await supabase
        .from(targetTable)
        .select(`id, username, slug, location, ethnicity, marital_status, build, physical_fitness, ${polygynyField}, ${coveringField}, prayer_consistency, memorization_quran, date_of_birth`)
        .in('id', profileIds);

      if (error) throw error;

      const enrichedProfiles = profileDetails?.map((profile: any) => {
        const match = matchData.find((m: any) => m.id === profile.id);
        return {
          ...profile,
          similarity_score: match?.similarity_score || 0,
        };
      }) || [];

      enrichedProfiles.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));

      setProfiles(enrichedProfiles);
    } catch (error) {
      console.error('Error loading AI matches:', error);
      setProfiles([]);
    }
  };

  const loadRegularProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      const targetTable = accountType === 'brother' ? 'sister' : 'brother';
      const polygynyField = targetTable === 'sister' ? 'polygyny_acceptance' : 'polygyny_willingness';
      const coveringField = targetTable === 'sister' ? 'hijab_commitment' : 'beard_commitment';
      
      let query = supabase
        .from(targetTable)
        .select(`id, username, slug, location, ethnicity, marital_status, build, physical_fitness, ${polygynyField}, ${coveringField}, date_of_birth`)
        .limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('Query error:', error);
        throw error;
      }
      
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...profiles];

    // Search text filter
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      filtered = filtered.filter(p => 
        p.username.toLowerCase().includes(search) ||
        p.location.toLowerCase().includes(search)
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(p => 
        p.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Ethnicity filter
    if (filters.ethnicity.length > 0) {
      filtered = filtered.filter(p => {
        const profileEthnicity = Array.isArray(p.ethnicity) ? p.ethnicity : [p.ethnicity];
        return profileEthnicity.some(e => filters.ethnicity.includes(e));
      });
    }

    // Build filter
    if (filters.build.length > 0) {
      filtered = filtered.filter(p => p.build && filters.build.includes(p.build));
    }

    // Fitness level filter
    if (filters.fitnessLevel.length > 0) {
      filtered = filtered.filter(p => p.physical_fitness && filters.fitnessLevel.includes(p.physical_fitness));
    }

    // Covering filter (hijab/beard)
    if (filters.covering) {
      filtered = filtered.filter(p => {
        if (accountType === 'brother') {
          return (p as any).hijab_commitment === filters.covering;
        } else {
          return (p as any).beard_commitment === filters.covering;
        }
      });
    }

    // Polygyny filter
    if (filters.polygyny !== 'any') {
      const acceptsPolygyny = filters.polygyny === 'open';
      filtered = filtered.filter(p => {
        const polyField = accountType === 'brother' ? p.polygyny_acceptance : p.polygyny_willingness;
        return polyField === acceptsPolygyny;
      });
    }

    // Marital status filter
    if (filters.maritalStatus.length > 0) {
      filtered = filtered.filter(p => filters.maritalStatus.includes(p.marital_status));
    }

    setFilteredProfiles(filtered);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchText) count++;
    if (filters.location) count++;
    if (filters.ethnicity.length > 0) count++;
    if (filters.build.length > 0) count++;
    if (filters.fitnessLevel.length > 0) count++;
    if (filters.covering) count++;
    if (filters.polygyny !== 'any') count++;
    if (filters.maritalStatus.length > 0) count++;
    return count;
  };

  const clearAllFilters = () => {
    setFilters({
      searchText: '',
      location: '',
      ethnicity: [],
      build: [],
      fitnessLevel: [],
      covering: '',
      polygyny: 'any',
      maritalStatus: [],
    });
  };

  const toggleArrayFilter = (key: keyof Filters, value: string) => {
    const currentArray = filters[key] as string[];
    if (currentArray.includes(value)) {
      setFilters({ ...filters, [key]: currentArray.filter(v => v !== value) });
    } else {
      setFilters({ ...filters, [key]: [...currentArray, value] });
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

  const getEthnicityFlag = (ethnicity: string | string[]) => {
    if (!ethnicity) return '🌍';
    const ethnicityName = Array.isArray(ethnicity) ? ethnicity[0] : ethnicity;
    if (!ethnicityName) return '🌍';
    const eth = getEthnicityByName(ethnicityName);
    return eth?.flag || '🌍';
  };

  const renderFilterModal = () => {
    const brotherBuilds = ['lean', 'muscular', 'bulky', 'heavyset', 'average'];
    const sisterBuilds = ['athletic', 'curvaceous', 'curvy_athletic', 'hourglass', 'heavyset', 'average'];
    const builds = accountType === 'brother' ? sisterBuilds : brotherBuilds;

    const sisterCovering = [
      { value: 'niqab', label: 'Niqab' },
      { value: 'hijab_abaya', label: 'Hijab + Abaya' },
      { value: 'hijab_western_clothing', label: 'Hijab + Western' },
      { value: 'open_hair', label: 'Open Hair' },
    ];

    const brotherBeard = [
      { value: 'full_sunnah_beard', label: 'Full Sunnah Beard' },
      { value: 'trimmed_beard', label: 'Trimmed Beard' },
      { value: 'clean_shaven', label: 'Clean Shaven' },
    ];

    const coveringOptions = accountType === 'brother' ? sisterCovering : brotherBeard;

    return (
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.filterModal}>
          <ScrollView style={styles.filterScrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.filterHeader}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.filterBackButton}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.filterTitle}>Search</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
                <Circle cx={11} cy={11} r={8} stroke="#7B8799" strokeWidth={2} />
                <Path d="M21 21L16.65 16.65" stroke="#7B8799" strokeWidth={2} />
              </Svg>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username or location..."
                placeholderTextColor="#C0C7D1"
                value={filters.searchText}
                onChangeText={(text) => setFilters({ ...filters, searchText: text })}
              />
            </View>

            {/* Active Filters Badge */}
            {getActiveFilterCount() > 0 && (
              <View style={styles.activeFiltersContainer}>
                <View style={styles.activeFiltersBadge}>
                  <Text style={styles.activeFiltersCount}>{getActiveFilterCount()}</Text>
                </View>
                <TouchableOpacity onPress={clearAllFilters}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Filter Content */}
            <View style={styles.filterContent}>
              
              {/* Location */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>LOCATION</Text>
                <View style={styles.filterBox}>
                  <Text style={styles.filterBoxLabel}>Country</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Any"
                    placeholderTextColor="#C0C7D1"
                    value={filters.location}
                    onChangeText={(text) => setFilters({ ...filters, location: text })}
                  />
                </View>
              </View>

              {/* Ethnicity */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>ETHNICITY</Text>
                <View style={styles.filterBox}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.ethnicityList}>
                      {ETHNICITIES.map((eth) => (
                        <TouchableOpacity
                          key={eth.name}
                          style={[
                            styles.ethnicityOption,
                            filters.ethnicity.includes(eth.name) && styles.ethnicityOptionSelected
                          ]}
                          onPress={() => toggleArrayFilter('ethnicity', eth.name)}
                        >
                          <Text style={styles.ethnicityOptionText}>
                            {eth.flag} {eth.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              {/* Physical Attributes */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>PHYSICAL ATTRIBUTES</Text>
                <View style={styles.filterBox}>
                  <Text style={styles.filterBoxLabel}>Build</Text>
                  <View style={styles.chipRow}>
                    {builds.map((build) => (
                      <TouchableOpacity
                        key={build}
                        style={[
                          styles.chip,
                          filters.build.includes(build) && styles.chipSelected
                        ]}
                        onPress={() => toggleArrayFilter('build', build)}
                      >
                        <Text style={[
                          styles.chipText,
                          filters.build.includes(build) && styles.chipTextSelected
                        ]}>
                          {getBuildLabel(build)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.filterBoxLabel, { marginTop: 16 }]}>Fitness Level</Text>
                  <View style={styles.chipRow}>
                    {['light_exercise', 'moderately_fit', 'fit', 'very_fit', 'athlete'].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.chip,
                          filters.fitnessLevel.includes(level) && styles.chipSelected
                        ]}
                        onPress={() => toggleArrayFilter('fitnessLevel', level)}
                      >
                        <Text style={[
                          styles.chipText,
                          filters.fitnessLevel.includes(level) && styles.chipTextSelected
                        ]}>
                          {getPhysicalFitnessLabel(level)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.filterBoxLabel, { marginTop: 16 }]}>
                    {accountType === 'brother' ? 'Covering' : 'Beard'}
                  </Text>
                  <View style={styles.filterInput}>
                    <TouchableOpacity
                      onPress={() => setFilters({ ...filters, covering: '' })}
                      style={styles.coveringOption}
                    >
                      <Text style={filters.covering === '' ? styles.coveringTextSelected : styles.coveringText}>
                        Any
                      </Text>
                    </TouchableOpacity>
                    {coveringOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setFilters({ ...filters, covering: option.value })}
                        style={styles.coveringOption}
                      >
                        <Text style={filters.covering === option.value ? styles.coveringTextSelected : styles.coveringText}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Polygyny */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>POLYGYNY</Text>
                <View style={styles.filterBox}>
                  <View style={styles.chipRow}>
                    <TouchableOpacity
                      style={[
                        styles.chipLarge,
                        filters.polygyny === 'open' && styles.chipSelected
                      ]}
                      onPress={() => setFilters({ ...filters, polygyny: 'open' })}
                    >
                      <Text style={[
                        styles.chipText,
                        filters.polygyny === 'open' && styles.chipTextSelected
                      ]}>
                        Open to Polygyny
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.chipLarge,
                        filters.polygyny === 'monogamy' && styles.chipSelected
                      ]}
                      onPress={() => setFilters({ ...filters, polygyny: 'monogamy' })}
                    >
                      <Text style={[
                        styles.chipText,
                        filters.polygyny === 'monogamy' && styles.chipTextSelected
                      ]}>
                        Monogamy Only
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Marital Status */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>MARITAL STATUS</Text>
                <View style={styles.filterBox}>
                  <View style={styles.chipRow}>
                    {['never_married', 'divorced', 'widowed', 'married'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.chip,
                          filters.maritalStatus.includes(status) && styles.chipSelected
                        ]}
                        onPress={() => toggleArrayFilter('maritalStatus', status)}
                      >
                        <Text style={[
                          styles.chipText,
                          filters.maritalStatus.includes(status) && styles.chipTextSelected
                        ]}>
                          {getMaritalStatusLabel(status)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

            </View>

            {/* Apply Button */}
            <View style={styles.filterFooter}>
              <Text style={styles.matchCount}>
                {filteredProfiles.length} profiles match your filters
              </Text>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderProfileCard = ({ item }: { item: Profile }) => {
    const hasPolygyny = accountType === 'brother' 
      ? item.polygyny_acceptance 
      : item.polygyny_willingness;

    const unlockPercentage = activeTab === 'for-you' && item.similarity_score
      ? Math.round(item.similarity_score * 100)
      : 60;

    const age = calculateAge(item.date_of_birth);

    return (
      <TouchableOpacity 
        style={styles.profileCard}
        onPress={() => router.push({
          pathname: `/profile/${item.id}`,
          params: { from: 'search' }
        })}
      >
        <View style={styles.profileHeader}>
          <Text style={styles.unlockText}>
            {activeTab === 'for-you' 
              ? `Compatibility: ${unlockPercentage}%` 
              : `Profile Unlock: ${unlockPercentage}%`}
          </Text>
          {hasPolygyny && (
            <View style={styles.polygynyBadge}>
              <Text style={styles.polygynyText}>Polygyny-Open</Text>
            </View>
          )}
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${unlockPercentage}%` }]} />
        </View>

        <View style={styles.usernameRow}>
          <Text style={styles.username}>{item.username}</Text>
          {age && (
            <View style={styles.ageBadge}>
              <Text style={styles.ageText}>{age}</Text>
            </View>
          )}
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
              {getEthnicityFlag(item.ethnicity)} {Array.isArray(item.ethnicity) ? item.ethnicity[0] : item.ethnicity}
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
      <Text style={styles.emptyText}>
        {getActiveFilterCount() > 0 ? 'No profiles match your filters' : 
         activeTab === 'for-you' ? 'No AI matches found' : 'No profiles found'}
      </Text>
      <Text style={styles.emptySubtext}>
        {getActiveFilterCount() > 0 ? 'Try adjusting your filters' :
         activeTab === 'for-you' 
          ? 'Complete your profile to get better matches' 
          : 'Check back soon for new members'}
      </Text>
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
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <FilterIcon />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
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
        data={filteredProfiles}
        renderItem={renderProfileCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {renderFilterModal()}

      {/* Bottom Navigation Bar */}
      <View style={styles.navbar}>
        <View style={styles.navbarBorder} />
        
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/interests')}>
            <InterestsIcon active={false} />
            <Text style={styles.navLabelInactive}>Interests</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => {}}>
            <SearchIcon active={true} />
            <Text style={styles.navLabelActive}>Search</Text>
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
    paddingTop: 51,
    paddingBottom: 16,
    backgroundColor: '#F7F8FB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 24,
    lineHeight: 32,
    color: '#070A12',
  },
  filterButton: {
    position: 'relative',
    padding: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#E03A3A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
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
  
  // Filter Modal Styles
  filterModal: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },
  filterScrollView: {
    flex: 1,
  },
  filterHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  filterBackButton: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#F2CC66',
    marginBottom: 12,
  },
  filterTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#070A12',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 28,
    marginTop: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#070A12',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    marginTop: 16,
    gap: 12,
  },
  activeFiltersBadge: {
    backgroundColor: '#F2CC66',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFiltersCount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#070A12',
  },
  clearAllText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#F2CC66',
  },
  filterContent: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#7B8799',
    marginBottom: 12,
  },
  filterBox: {
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    padding: 16,
  },
  filterBoxLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#070A12',
    marginBottom: 12,
  },
  filterInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  coveringOption: {
    paddingVertical: 8,
  },
  coveringText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#C0C7D1',
  },
  coveringTextSelected: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#070A12',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#F2CC66',
    borderColor: '#F2CC66',
  },
  chipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
    textAlign: 'center',
  },
  chipTextSelected: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#070A12',
  },
  chipLarge: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ethnicityList: {
    flexDirection: 'row',
    gap: 8,
  },
  ethnicityOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ethnicityOptionSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F2CC66',
  },
  ethnicityOptionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#070A12',
  },
  filterFooter: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7EAF0',
    paddingHorizontal: 28,
    paddingVertical: 20,
    marginTop: 24,
  },
  matchCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#7B8799',
    textAlign: 'center',
    marginBottom: 12,
  },
  applyButton: {
    backgroundColor: '#070A12',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#F2CC66',
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