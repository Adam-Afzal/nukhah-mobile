// app/(onboarding)/masjid-affiliation.tsx
import OnboardingProgress from '@/components/OnboardingProgress';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Masjid {
    id: string;
    name: string;
    location: string;
    city: string;
    country: string;
    imam_id: string | null;
    imam: {
      name: string;
    } | null;
    madhab?: string;
  }
  

export default function MasjidAffiliationScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [accountType, setAccountType] = useState<'brother' | 'sister' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string>('');
  const [isAffiliated, setIsAffiliated] = useState<boolean | null>(null);
  const [selectedMasjid, setSelectedMasjid] = useState<string | null>(null);
  const [hasInformedImam, setHasInformedImam] = useState(false);
  const [suggestedMasjidName, setSuggestedMasjidName] = useState('');
  const [suggestedMasjidCity, setSuggestedMasjidCity] = useState('');
  const [masajid, setMasajid] = useState<Masjid[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log(user?.id)
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        router.back();
        return;
      }

      // Check if brother or sister
      const { data: brotherData } = await supabase
        .from('brother')
        .select('id, location_country, location_city')
        .eq('user_id', user.id)
        .single();

      if (brotherData) {
        setAccountType('brother');
        setUserId(brotherData.id);
        setUserLocation(brotherData.location_country || '');
        await loadMasajid(brotherData.location_city);
        setIsLoading(false);
        return;
      }

      const { data: sisterData } = await supabase
        .from('sister')
        .select('id, location_country, location_city')
        .eq('user_id', user.id)
        .single();

        console.log(`sister data in masjid page: ${sisterData}`)

      if (sisterData) {
        setAccountType('sister');
        setUserId(sisterData.id);
        setUserLocation(sisterData.location_city || '');
        await loadMasajid(sisterData.location_country);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user information');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW loadMasajid FUNCTION:
// NEW loadMasajid FUNCTION:

const loadMasajid = async (location?: string) => {
    try {
      // Load all active masajid with imam info via JOIN
      const { data, error } = await supabase
        .from('masjid')
        .select(`
          id,
          name,
          location,
          city,
          country,
          madhab,
          imam_id,
          imam:imam_id(
            name
          )
        `)
        .eq('is_active', true)
        .order('name');
  
      if (error) throw error;
  
      console.log('=== RAW DATA FROM SUPABASE ===');
      console.log('Count:', data?.length);
      data?.forEach((m, i) => {
        console.log(`\nMasjid ${i}:`, m.name);
        console.log('  imam_id:', m.imam_id);
        console.log('  imam type:', typeof m.imam);
        console.log('  imam is array?', Array.isArray(m.imam));
        console.log('  imam value:', JSON.stringify(m.imam));
      });
  
      // Process the data to handle null imam properly
      const processedData = data?.map(masjid => ({
        ...masjid,
        imam: Array.isArray(masjid.imam) 
          ? (masjid.imam[0] || null)  // Get first element if array
          : masjid.imam               // Keep as-is if already single object
      })) || [];
  
      console.log('\n=== PROCESSED DATA ===');
      processedData.forEach((m, i) => {
        console.log(`\nMasjid ${i}:`, m.name);
        console.log('  imam:', m.imam);
        console.log('  imam?.name:', m.imam?.name);
      });
  
      // If user has location, prioritize nearby masajid
      if (location && processedData.length > 0) {
        const userCity = location.split(',')[0].trim().toLowerCase();
        const sorted = processedData.sort((a, b) => {
          const aCity = a.city?.toLowerCase() || '';
          const bCity = b.city?.toLowerCase() || '';
          const aMatch = aCity.includes(userCity) || userCity.includes(aCity);
          const bMatch = bCity.includes(userCity) || userCity.includes(bCity);
          
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });
        
        setMasajid(sorted);
      } else {
        setMasajid(processedData);
      }
    } catch (error) {
      console.error('Error loading masajid:', error);
      Alert.alert('Error', 'Failed to load masajid list');
    }
  };
  const handleContinue = async () => {
    if (isAffiliated === null) {
      Alert.alert('Selection Required', 'Please indicate if you attend a masjid');
      return;
    }

    if (isAffiliated && !selectedMasjid) {
      Alert.alert('Masjid Required', 'Please select your masjid');
      return;
    }

    if (isAffiliated && selectedMasjid && !hasInformedImam) {
      Alert.alert('Confirmation Required', 'Please confirm that the imam has been informed to expect your affiliation request');
      return;
    }

    if (!accountType || !userId) {
      Alert.alert('Error', 'Account information not found');
      return;
    }

    setIsSaving(true);
    try {
      // Update user profile with masjid affiliation
      const table = accountType === 'brother' ? 'brother' : 'sister';

      // If affiliated but no masjid selected, use suggested name (masjid not in DB)
      const isSuggestingMasjid = isAffiliated && !selectedMasjid && suggestedMasjidName.trim().length > 0;

      const { error: updateError } = await supabase
        .from(table)
        .update({
          masjid_id: selectedMasjid ?? null,
          is_masjid_affiliated: isAffiliated,
          suggested_masjid_name: isSuggestingMasjid ? suggestedMasjidName.trim() : null,
          suggested_masjid_city: isSuggestingMasjid ? suggestedMasjidCity.trim() || null : null,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // If affiliated, create imam verification request and send SMS
      if (isAffiliated && selectedMasjid) {
        const { data: verificationData, error: verificationError } = await supabase
          .from('imam_verification')
          .insert({
            user_id: userId,
            user_type: accountType,
            masjid_id: selectedMasjid,
            status: 'pending',
          })
          .select('id')
          .single();

        if (verificationError) {
          console.error('Error creating verification request:', verificationError);
          // Don't block user, just log the error
        } else if (verificationData) {
          // Fire-and-forget — SMS failure should not block onboarding
          supabase.functions.invoke('send-imam-verification', {
            body: {
              imam_verification_id: verificationData.id,
              user_id: userId,
              user_type: accountType,
              masjid_id: selectedMasjid,
            },
          }).catch(err => console.error('Error sending imam verification SMS:', err));
        }
      }

      // Optimistically update cache so layout doesn't redirect back
      queryClient.setQueryData(['userStatus'], (old: any) =>
        old ? { ...old, hasProfile: true, hasMasjidAffiliation: true } : old
      );

      // Continue to references screen
      router.push('/(onboarding)/references');
    } catch (error: any) {
      console.error('Error saving masjid affiliation:', error);
      Alert.alert('Error', error.message || 'Failed to save masjid affiliation');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMasajid = masajid.filter(m => {
    const query = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(query) ||
      m.location?.toLowerCase().includes(query) ||
      m.city?.toLowerCase().includes(query) ||
      m.imam?.name?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={3} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Masjid Affiliation</Text>
          <Text style={styles.subtitle}>
            Are you a regular attendee at a Salafi masjid?
          </Text>
        </View>

        {/* Yes/No Selection */}
        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[
              styles.option,
              isAffiliated === true && styles.optionSelected
            ]}
            onPress={() => setIsAffiliated(true)}
          >
            <View style={[
              styles.radio,
              isAffiliated === true && styles.radioSelected
            ]}>
              {isAffiliated === true && <View style={styles.radioDot} />}
            </View>
            <Text style={[
              styles.optionText,
              isAffiliated === true && styles.optionTextSelected
            ]}>
              Yes, I regularly attend a masjid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              isAffiliated === false && styles.optionSelected
            ]}
            onPress={() => setIsAffiliated(false)}
          >
            <View style={[
              styles.radio,
              isAffiliated === false && styles.radioSelected
            ]}>
              {isAffiliated === false && <View style={styles.radioDot} />}
            </View>
            <Text style={[
              styles.optionText,
              isAffiliated === false && styles.optionTextSelected
            ]}>
              No, I don't regularly attend
            </Text>
          </TouchableOpacity>
        </View>

        {/* Masjid Selection (only if affiliated) */}
        {isAffiliated && (
          <View style={styles.masjidSelection}>
            <Text style={styles.sectionTitle}>Select Your Masjid</Text>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, city, or imam..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.masjidList}>
              {filteredMasajid.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No masajid found</Text>
                  <Text style={styles.emptySubtext}>Try a different search term</Text>
                </View>
              ) : (
                filteredMasajid.map(masjid => (
                  <TouchableOpacity
                    key={masjid.id}
                    style={[
                      styles.masjidItem,
                      selectedMasjid === masjid.id && styles.masjidItemSelected
                    ]}
                    onPress={() => {
                      setSelectedMasjid(masjid.id);
                      setSuggestedMasjidName('');
                      setHasInformedImam(false);
                    }}
                  >
                    <View style={styles.masjidInfo}>
                      <Text style={styles.masjidName}>{masjid.name}</Text>
                      <Text style={styles.masjidLocation}>
                        📍 {masjid.city}, {masjid.country}
                      </Text>
                      <Text style={styles.masjidImam}>
                        Imam: {masjid.imam?.name}
                      </Text>
                    </View>
                    {selectedMasjid === masjid.id && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Imam informed confirmation */}
            {selectedMasjid && (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setHasInformedImam(prev => !prev)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, hasInformedImam && styles.checkboxChecked]}>
                  {hasInformedImam && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I confirm that I (or my wali) have informed the imam of{' '}
                  <Text style={styles.checkboxLabelBold}>
                    {masajid.find(m => m.id === selectedMasjid)?.name || 'this masjid'}
                  </Text>
                  {' '}to expect my affiliation request
                </Text>
              </TouchableOpacity>
            )}

            {/* More masjids notice */}
            <View style={styles.moreMasjidsNotice}>
              <Text style={styles.moreMasjidsText}>
                We are onboarding more masajid — if yours isn't listed yet, suggest it below and we'll add it soon.
              </Text>
            </View>

            {/* Not listed fallback */}
            <View style={styles.notListedContainer}>
              <Text style={styles.notListedLabel}>My masjid isn&apos;t listed</Text>
              <TextInput
                style={styles.notListedInput}
                placeholder="Masjid name..."
                placeholderTextColor="#9CA3AF"
                value={suggestedMasjidName}
                onChangeText={(text) => {
                  setSuggestedMasjidName(text);
                  if (text.length > 0) setSelectedMasjid(null);
                }}
              />
              <TextInput
                style={[styles.notListedInput, { marginTop: 8 }]}
                placeholder="Town / city..."
                placeholderTextColor="#9CA3AF"
                value={suggestedMasjidCity}
                onChangeText={(text) => {
                  setSuggestedMasjidCity(text);
                  if (text.length > 0) setSelectedMasjid(null);
                }}
              />
              {suggestedMasjidName.length > 0 && (
                <Text style={styles.notListedHint}>
                  We&apos;ll note this and work on adding it. You can still complete your profile.
                </Text>
              )}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Your imam will receive a text message asking them to confirm your membership. This usually takes 1–3 days.
              </Text>
            </View>
          </View>
        )}

        {/* Unaffiliated Info */}
        {isAffiliated === false && (
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>
              No problem! You'll provide character references from your network instead.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueButton, isSaving && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={isSaving}
        >
          <Text style={styles.continueButtonText}>
            {isSaving ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 32,
    lineHeight: 43,
    color: '#070A12',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#7B8799',
  },
  optionContainer: {
    marginBottom: 32,
    gap: 16,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionSelected: {
    borderColor: '#F2CC66',
    backgroundColor: '#FFF9E6',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E7EAF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#F2CC66',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F2CC66',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: '#070A12',
  },
  optionTextSelected: {
    color: '#070A12',
  },
  masjidSelection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    lineHeight: 27,
    color: '#070A12',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 18,
    color: '#070A12',
    marginBottom: 16,
  },
  masjidList: {
    marginBottom: 16,
  },
  masjidItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  masjidItemSelected: {
    borderColor: '#F2CC66',
    backgroundColor: '#FFF9E6',
  },
  masjidInfo: {
    flex: 1,
  },
  masjidName: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#070A12',
    marginBottom: 4,
  },
  masjidLocation: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#7B8799',
    marginBottom: 2,
  },
  masjidImam: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 16,
    color: '#7B8799',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2CC66',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    fontSize: 18,
    color: '#070A12',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#070A12',
    marginBottom: 4,
  },
  emptySubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7B8799',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F2CC66',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C0C7D1',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#F2CC66',
    borderColor: '#F2CC66',
  },
  checkboxTick: {
    fontSize: 13,
    color: '#070A12',
    fontFamily: 'Inter_700Bold',
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#070A12',
  },
  checkboxLabelBold: {
    fontFamily: 'Inter_600SemiBold',
  },
  moreMasjidsNotice: {
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(242, 204, 102, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(242, 204, 102, 0.2)',
  },
  moreMasjidsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: '#7B8799',
    textAlign: 'center',
  },
  notListedContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  notListedLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 17,
    color: '#070A12',
    marginBottom: 8,
  },
  notListedInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 18,
    color: '#070A12',
  },
  notListedHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: '#7B8799',
    marginTop: 6,
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F2CC66',
  },
  infoIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#070A12',
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
  continueButton: {
    backgroundColor: '#F2CC66',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 19,
    color: '#070A12',
    fontStyle: 'italic',
  },
});