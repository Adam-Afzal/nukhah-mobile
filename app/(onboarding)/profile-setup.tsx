// app/(onboarding)/profile-setup.tsx
import SearchablePicker from '@/components/searchablePicker';
import { updateBrotherEmbedding, updateSisterEmbedding } from '@/lib/embeddingService';
import { COUNTRIES, ETHNICITIES } from '@/lib/locationData';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Svg, { Path } from 'react-native-svg';

type AccountType = 'brother' | 'sister';
type Section = 'username' | 'basic' | 'personal' | 'preferences';

interface ProfileData {
  // Identity
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  slug: string;
  date_of_birth: string;
  location_country: string;
  location_city: string;

  // Basic info
  build: string;
  ethnicity: string;
  occupation: string;
  marital_status: string;

  // Personal
  children: boolean;
  revert: boolean;
  disabilities: string;
  hobbies_and_interests: string;
  personality: string;

  // Deen
  prayer_consistency: string;

  // Preferences
  open_to_hijrah: boolean;
  open_to_reverts: boolean;
  living_arrangements: string;
  preferred_ethnicity: string[];
  other_spouse_criteria: string;
  dealbreakers: string;

  // Sister-specific
  open_to_polygyny?: boolean;
  hijab_commitment?: string;
  beard_commitment?: string;
}

const BROTHER_BUILD_OPTIONS = [
  { label: 'Select build', value: '' },
  { label: 'Skinny', value: 'skinny' },
  { label: 'Slim', value: 'slim' },
  { label: 'Muscular', value: 'muscular' },
  { label: 'Bulky', value: 'bulky' },
  { label: 'Heavyset', value: 'heavyset' },
];

const SISTER_BUILD_OPTIONS = [
  { label: 'Select build', value: '' },
  { label: 'Skinny', value: 'skinny' },
  { label: 'Slim', value: 'slim' },
  { label: 'Hourglass', value: 'hourglass' },
  { label: 'Curvy', value: 'curvy' },
  { label: 'Heavyset', value: 'heavyset' },
];

const BROTHER_MARITAL_OPTIONS = [
  { label: 'Select status', value: '' },
  { label: 'Never Married', value: 'never_married' },
  { label: 'Married', value: 'married' },
  { label: 'Divorced', value: 'divorced' },
  { label: 'Widowed', value: 'widowed' },
  { label: 'Annulled', value: 'annulled' },
];

const SISTER_MARITAL_OPTIONS = [
  { label: 'Select status', value: '' },
  { label: 'Never Married', value: 'never_married' },
  { label: 'Divorced', value: 'divorced' },
  { label: 'Widowed', value: 'widowed' },
  { label: 'Annulled', value: 'annulled' },
];

const HIJAB_COMMITMENT_OPTIONS = [
  { label: 'Select hijab commitment', value: '' },
  { label: 'Niqab', value: 'niqab' },
  { label: 'Hijab', value: 'hijab' },
  { label: 'Open Hair', value: 'open_hair' },
];

export default function ProfileSetup() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [currentSection, setCurrentSection] = useState<Section>('username');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [ethnicityPickerVisible, setEthnicityPickerVisible] = useState(false);
  const [preferredEthnicityPickerVisible, setPreferredEthnicityPickerVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const ethnicityItems = ETHNICITIES.map(eth => ({
    label: eth.name,
    value: eth.name,
    flag: eth.flag,
    subtitle: eth.description,
  }));

  const locationItems = COUNTRIES.flatMap(country =>
    country.majorCities.map(city => ({
      label: `${city}, ${country.name}`,
      value: `${city}|${country.name}`,
      flag: country.flag,
      subtitle: country.name,
    }))
  );

  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    slug: '',
    date_of_birth: '',
    location_country: '',
    location_city: '',
    build: '',
    ethnicity: '',
    occupation: '',
    marital_status: '',
    children: false,
    revert: false,
    disabilities: '',
    hobbies_and_interests: '',
    personality: '',
    prayer_consistency: '',
    open_to_hijrah: false,
    open_to_reverts: true,
    living_arrangements: '',
    preferred_ethnicity: [],
    other_spouse_criteria: '',
    dealbreakers: '',
    open_to_polygyny: false,
    hijab_commitment: '',
    beard_commitment: '',
  });

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await supabase.auth.signOut();
              router.replace('/welcome');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    loadAccountType();
  }, []);

  const loadAccountType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'No user found');
        router.replace('/welcome');
        return;
      }

      // Check brother application
      const { data: brotherApp, error: brotherError } = await supabase
        .from('brother_application')
        .select('first_name, last_name, phone_number, nationality, date_of_birth')
        .eq('user_id', user.id)
        .maybeSingle();

      if (brotherError) {
        console.error('Error fetching brother application:', brotherError);
      }

      if (brotherApp) {
        setAccountType('brother');
        setProfileData(prev => ({
          ...prev,
          first_name: brotherApp.first_name || '',
          last_name: brotherApp.last_name || '',
          phone: brotherApp.phone_number || '',
          date_of_birth: brotherApp.date_of_birth || '',
        }));
        setIsLoading(false);
        return;
      }

      // Check sister application
      const { data: sisterApp, error: sisterError } = await supabase
        .from('sister_application')
        .select('first_name, last_name, phone_number, nationality, date_of_birth')
        .eq('user_id', user.id)
        .maybeSingle();

      if (sisterError) {
        console.error('Error fetching sister application:', sisterError);
      }

      if (sisterApp) {
        setAccountType('sister');
        setProfileData(prev => ({
          ...prev,
          first_name: sisterApp.first_name || '',
          last_name: sisterApp.last_name || '',
          phone: sisterApp.phone_number || '',
          date_of_birth: sisterApp.date_of_birth || '',
        }));
        setIsLoading(false);
        return;
      }

      Alert.alert('Error', 'No application found');
      router.replace('/welcome');
    } catch (error) {
      console.error('Error loading account type:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameAvailable(false);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, hyphens, and underscores');
      setUsernameAvailable(false);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError('');

    try {
      const [brotherCheck, sisterCheck] = await Promise.all([
        supabase.from('brother').select('username').eq('username', username).single(),
        supabase.from('sister').select('username').eq('username', username).single(),
      ]);

      const exists = brotherCheck.data || sisterCheck.data;

      if (exists) {
        setUsernameAvailable(false);
        setUsernameError('Username already taken');
      } else {
        setUsernameAvailable(true);
        setUsernameError('');
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  useEffect(() => {
    if (profileData.username) {
      const timer = setTimeout(() => {
        checkUsernameAvailability(profileData.username);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
      setUsernameError('');
    }
  }, [profileData.username]);

  const generateSlug = (firstName: string, lastName: string) => {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${firstName}-${random}`;
  };

  const handleSaveSection = async () => {
    if (!validateSection()) {
      return;
    }

    if (currentSection === 'preferences') {
      await handleFinalSave();
    } else {
      const sections: Section[] = ['username', 'basic', 'personal', 'preferences'];
      const currentIndex = sections.indexOf(currentSection);
      if (currentIndex < sections.length - 1) {
        setCurrentSection(sections[currentIndex + 1]);
      }
    }
  };

  const validateSection = (): boolean => {
    switch (currentSection) {
      case 'username':
        if (!profileData.first_name.trim()) {
          Alert.alert('Missing Information', 'Please enter your first name');
          return false;
        }
        if (!profileData.last_name.trim()) {
          Alert.alert('Missing Information', 'Please enter your last name');
          return false;
        }
        if (!profileData.location_country) {
          Alert.alert('Missing Information', 'Please select your location');
          return false;
        }
        if (!profileData.username) {
          Alert.alert('Missing Information', 'Please choose a username');
          return false;
        }
        if (!usernameAvailable) {
          Alert.alert('Invalid Username', usernameError || 'Username is not available');
          return false;
        }
        break;
      case 'basic':
        if (!profileData.build) {
          Alert.alert('Missing Information', 'Please select your build');
          return false;
        }
        if (!profileData.ethnicity) {
          Alert.alert('Missing Information', 'Please select your ethnicity');
          return false;
        }
        if (!profileData.marital_status) {
          Alert.alert('Missing Information', 'Please select your marital status');
          return false;
        }
        if (!profileData.prayer_consistency) {
          Alert.alert('Missing Information', 'Please select your prayer consistency');
          return false;
        }
        if (accountType === 'brother' && !profileData.beard_commitment) {
          Alert.alert('Missing Information', 'Please select your beard commitment');
          return false;
        }
        if (accountType === 'sister' && !profileData.hijab_commitment) {
          Alert.alert('Missing Information', 'Please select your hijab commitment');
          return false;
        }
        break;
      case 'personal':
        if (!profileData.personality.trim()) {
          Alert.alert('Missing Information', 'Please describe your personality');
          return false;
        }
        break;
      case 'preferences':
        // No required fields in preferences
        break;
    }
    return true;
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'No user found');
        return;
      }

      const slug = profileData.slug || generateSlug(profileData.first_name, profileData.last_name);

      const baseProfile = {
        user_id: user.id,
        username: profileData.username,
        slug,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        date_of_birth: profileData.date_of_birth || null,
        location_country: profileData.location_country,
        location_city: profileData.location_city,
        build: profileData.build,
        ethnicity: profileData.ethnicity,
        occupation: profileData.occupation,
        marital_status: profileData.marital_status,
        children: profileData.children,
        revert: profileData.revert,
        disabilities: profileData.disabilities,
        hobbies_and_interests: profileData.hobbies_and_interests,
        personality: profileData.personality,
        prayer_consistency: profileData.prayer_consistency,
        open_to_hijrah: profileData.open_to_hijrah,
        open_to_reverts: profileData.open_to_reverts,
        living_arrangements: profileData.living_arrangements,
        preferred_ethnicity: profileData.preferred_ethnicity,
        other_spouse_criteria: profileData.other_spouse_criteria,
        dealbreakers: profileData.dealbreakers,
      };

      const embeddingData = {
        personality: profileData.personality,
        hobbies_and_interests: profileData.hobbies_and_interests,
        location_country: profileData.location_country,
        location_city: profileData.location_city,
        ethnicity: profileData.ethnicity,
        preferred_ethnicity: profileData.preferred_ethnicity,
        marital_status: profileData.marital_status,
        children: profileData.children,
        revert: profileData.revert,
        open_to_hijrah: profileData.open_to_hijrah,
        open_to_reverts: profileData.open_to_reverts,
        living_arrangements: profileData.living_arrangements,
        other_spouse_criteria: profileData.other_spouse_criteria,
        dealbreakers: profileData.dealbreakers,
        date_of_birth: profileData.date_of_birth,
        build: profileData.build,
        prayer_consistency: profileData.prayer_consistency,
      };

      if (accountType === 'brother') {
        const brotherProfile = {
          ...baseProfile,
          beard_commitment: profileData.beard_commitment,
        };
        const { data, error } = await supabase.from('brother').insert(brotherProfile).select('id').single();
        if (error) throw error;
        await updateBrotherEmbedding(data.id, {
          ...embeddingData,
          beard_commitment: profileData.beard_commitment,
        });
      } else if (accountType === 'sister') {
        const sisterProfile = {
          ...baseProfile,
          open_to_polygyny: profileData.open_to_polygyny,
          hijab_commitment: profileData.hijab_commitment,
        };
        console.log('Sister profile insert payload:', JSON.stringify(sisterProfile, null, 2));
        const { data, error } = await supabase.from('sister').insert(sisterProfile).select('id').single();
        if (error) throw error;
        await updateSisterEmbedding(data.id, {
          ...embeddingData,
          open_to_polygyny: profileData.open_to_polygyny,
          hijab_commitment: profileData.hijab_commitment,
        });
      }

      Alert.alert(
        'Success!',
        'Profile created successfully',
        [{ text: 'OK', onPress: () => router.push('/(onboarding)/masjid-affiliation') }]
      );
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const renderProgressBar = () => {
    const sections: Section[] = ['username', 'basic', 'personal', 'preferences'];
    const currentIndex = sections.indexOf(currentSection);
    const progress = ((currentIndex + 1) / sections.length) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentIndex + 1} of {sections.length}
        </Text>
      </View>
    );
  };

  const handleLocationSelect = (value: string) => {
    const [city, country] = value.split('|');
    setProfileData(prev => ({
      ...prev,
      location_city: city,
      location_country: country,
    }));
  };

  const getLocationDisplayValue = () => {
    if (profileData.location_city && profileData.location_country) {
      return `${profileData.location_city}|${profileData.location_country}`;
    }
    return '';
  };

  const getLocationDisplayText = () => {
    if (profileData.location_city && profileData.location_country) {
      const country = COUNTRIES.find(c => c.name === profileData.location_country);
      return `${country?.flag || ''} ${profileData.location_city}, ${profileData.location_country}`;
    }
    return '';
  };

  const renderUsernameSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Identity</Text>
      <Text style={styles.sectionSubtitle}>Let's start with your basic information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={profileData.first_name}
          onChangeText={(text) => updateField('first_name', text)}
          placeholder="Enter your first name"
          placeholderTextColor="#7B8799"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={profileData.last_name}
          onChangeText={(text) => updateField('last_name', text)}
          placeholder="Enter your last name"
          placeholderTextColor="#7B8799"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          style={[styles.input, { backgroundColor: '#F0F0F0', color: '#7B8799' }]}
          value={profileData.date_of_birth}
          editable={false}
          placeholder="Set during application"
          placeholderTextColor="#7B8799"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location *</Text>
        <TouchableOpacity
          style={styles.pickerTrigger}
          onPress={() => setLocationPickerVisible(true)}
        >
          <Text style={profileData.location_country ? styles.pickerTriggerText : styles.pickerPlaceholder}>
            {getLocationDisplayText() || 'Select your location'}
          </Text>
          <Text style={styles.pickerArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <SearchablePicker
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onSelect={handleLocationSelect}
        items={locationItems}
        title="Select Location"
        placeholder="Search city or country..."
        selectedValue={getLocationDisplayValue()}
      />

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Username *</Text>
        <View style={styles.usernameInputContainer}>
          <TextInput
            style={[
              styles.input,
              usernameAvailable === true && styles.inputSuccess,
              usernameAvailable === false && styles.inputError,
            ]}
            value={profileData.username}
            onChangeText={(text) => updateField('username', text.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder="Choose a unique username"
            placeholderTextColor="#7B8799"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isCheckingUsername && (
            <ActivityIndicator size="small" color="#F2CC66" style={styles.usernameSpinner} />
          )}
          {!isCheckingUsername && usernameAvailable === true && (
            <Text style={styles.usernameCheckmark}>✓</Text>
          )}
          {!isCheckingUsername && usernameAvailable === false && (
            <Text style={styles.usernameX}>✗</Text>
          )}
        </View>
        {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
        {usernameAvailable === true && <Text style={styles.successText}>Username is available!</Text>}
        <Text style={styles.helperText}>
          3+ characters, letters, numbers, hyphens, and underscores only
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        <View style={styles.logoutButtonContent}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              stroke="#E03A3A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.logoutButtonText}>
            {isLoggingOut ? 'Logging out...' : 'Log Out'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderBasicSection = () => {
    const buildOptions = accountType === 'brother' ? BROTHER_BUILD_OPTIONS : SISTER_BUILD_OPTIONS;
    const maritalOptions = accountType === 'brother' ? BROTHER_MARITAL_OPTIONS : SISTER_MARITAL_OPTIONS;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <Text style={styles.sectionSubtitle}>Tell us about yourself</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Build *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={profileData.build}
              onValueChange={(value) => updateField('build', value)}
              itemStyle={styles.pickerItem}
            >
              {buildOptions.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ethnicity *</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => setEthnicityPickerVisible(true)}
          >
            <Text style={profileData.ethnicity ? styles.pickerTriggerText : styles.pickerPlaceholder}>
              {profileData.ethnicity || 'Select your ethnicity'}
            </Text>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <SearchablePicker
          visible={ethnicityPickerVisible}
          onClose={() => setEthnicityPickerVisible(false)}
          onSelect={(value) => updateField('ethnicity', value)}
          items={ethnicityItems}
          title="Select Ethnicity"
          placeholder="Search ethnicity..."
          selectedValue={profileData.ethnicity}
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Occupation</Text>
          <TextInput
            style={styles.input}
            value={profileData.occupation}
            onChangeText={(text) => updateField('occupation', text)}
            placeholder="e.g., Software Engineer, Student, Unemployed"
            placeholderTextColor="#7B8799"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Marital Status *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={profileData.marital_status}
              onValueChange={(value) => updateField('marital_status', value)}
              itemStyle={styles.pickerItem}
            >
              {maritalOptions.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>

        {accountType === 'brother' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Beard Commitment *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={profileData.beard_commitment}
                onValueChange={(value) => updateField('beard_commitment', value)}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Select beard commitment" value="" />
                <Picker.Item label="Full Sunnah Beard" value="full_sunnah_beard" />
                <Picker.Item label="Trimmed Beard" value="trimmed_beard" />
                <Picker.Item label="Clean Shaven" value="clean_shaven" />
              </Picker>
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prayer Consistency *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={profileData.prayer_consistency}
              onValueChange={(value) => updateField('prayer_consistency', value)}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Select prayer consistency" value="" />
              <Picker.Item label="5x a Day" value="5x_daily" />
              <Picker.Item label="As Much as Possible" value="as_much_as_possible" />
              <Picker.Item label="Never" value="never" />
            </Picker>
          </View>
        </View>

        {accountType === 'sister' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hijab Commitment *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={profileData.hijab_commitment}
                onValueChange={(value) => updateField('hijab_commitment', value)}
                itemStyle={styles.pickerItem}
              >
                {HIJAB_COMMITMENT_OPTIONS.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderPersonalSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Personal Details</Text>
      <Text style={styles.sectionSubtitle}>Share more about yourself</Text>

      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Do you have children?</Text>
          <Switch
            value={profileData.children}
            onValueChange={(value) => updateField('children', value)}
            trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
            thumbColor={profileData.children ? '#070A12' : '#7B8799'}
          />
        </View>
      </View>

      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Are you a revert?</Text>
          <Switch
            value={profileData.revert}
            onValueChange={(value) => updateField('revert', value)}
            trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
            thumbColor={profileData.revert ? '#070A12' : '#7B8799'}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Disabilities (if any)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.disabilities}
          onChangeText={(text) => updateField('disabilities', text)}
          placeholder="Any physical or health conditions to mention"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Hobbies & Interests</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.hobbies_and_interests}
          onChangeText={(text) => updateField('hobbies_and_interests', text)}
          placeholder="What do you enjoy doing in your free time?"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Personality *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.personality}
          onChangeText={(text) => updateField('personality', text)}
          placeholder="Describe your personality"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  const renderPreferencesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Preferences</Text>
      <Text style={styles.sectionSubtitle}>What are you looking for?</Text>

      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Open to hijrah?</Text>
          <Switch
            value={profileData.open_to_hijrah}
            onValueChange={(value) => updateField('open_to_hijrah', value)}
            trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
            thumbColor={profileData.open_to_hijrah ? '#070A12' : '#7B8799'}
          />
        </View>
      </View>

      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Open to reverts?</Text>
          <Switch
            value={profileData.open_to_reverts}
            onValueChange={(value) => updateField('open_to_reverts', value)}
            trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
            thumbColor={profileData.open_to_reverts ? '#070A12' : '#7B8799'}
          />
        </View>
      </View>

      {accountType === 'sister' && (
        <View style={styles.switchGroup}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Open to polygyny?</Text>
            <Switch
              value={profileData.open_to_polygyny}
              onValueChange={(value) => updateField('open_to_polygyny', value)}
              trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
              thumbColor={profileData.open_to_polygyny ? '#070A12' : '#7B8799'}
            />
          </View>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Living Arrangements</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.living_arrangements}
          onChangeText={(text) => updateField('living_arrangements', text)}
          placeholder="Describe your ideal living arrangements after marriage"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Preferred Ethnicity</Text>
        <Text style={styles.hint}>Select "Any" or choose specific ethnicities</Text>

        <TouchableOpacity
          style={[
            styles.radioOption,
            profileData.preferred_ethnicity.includes('Any') && styles.radioOptionSelected,
          ]}
          onPress={() => {
            setProfileData(prev => ({
              ...prev,
              preferred_ethnicity: prev.preferred_ethnicity.includes('Any') ? [] : ['Any']
            }));
          }}
        >
          <View style={styles.radio}>
            {profileData.preferred_ethnicity.includes('Any') && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioText}>Any Ethnicity</Text>
        </TouchableOpacity>

        {!profileData.preferred_ethnicity.includes('Any') && (
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => setPreferredEthnicityPickerVisible(true)}
          >
            <Text style={profileData.preferred_ethnicity.length > 0 ? styles.pickerTriggerText : styles.pickerPlaceholder}>
              {profileData.preferred_ethnicity.length > 0
                ? `${profileData.preferred_ethnicity.length} selected: ${profileData.preferred_ethnicity.slice(0, 2).join(', ')}${profileData.preferred_ethnicity.length > 2 ? '...' : ''}`
                : 'Select specific ethnicities'}
            </Text>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>
        )}

        {profileData.preferred_ethnicity.includes('Any') && (
          <Text style={styles.hint}>✓ Open to all ethnicities</Text>
        )}
      </View>

      <SearchablePicker
        visible={preferredEthnicityPickerVisible}
        onClose={() => setPreferredEthnicityPickerVisible(false)}
        onSelect={(value) => {
          setProfileData(prev => {
            const isSelected = prev.preferred_ethnicity.includes(value);
            return {
              ...prev,
              preferred_ethnicity: isSelected
                ? prev.preferred_ethnicity.filter(e => e !== value)
                : [...prev.preferred_ethnicity, value]
            };
          });
        }}
        items={ethnicityItems}
        title="Select Preferred Ethnicities"
        placeholder="Search ethnicity..."
        selectedValue={profileData.preferred_ethnicity}
        multiSelect={true}
      />

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Other Spouse Criteria</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.other_spouse_criteria}
          onChangeText={(text) => updateField('other_spouse_criteria', text)}
          placeholder="What else are you looking for in a spouse?"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Dealbreakers</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.dealbreakers}
          onChangeText={(text) => updateField('dealbreakers', text)}
          placeholder="What are your non-negotiables?"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Your Profile</Text>
          <Text style={styles.headerSubtitle}>
            {accountType === 'brother' ? 'Brother Profile' : 'Sister Profile'}
          </Text>
        </View>

        {renderProgressBar()}

        {currentSection === 'username' && renderUsernameSection()}
        {currentSection === 'basic' && renderBasicSection()}
        {currentSection === 'personal' && renderPersonalSection()}
        {currentSection === 'preferences' && renderPreferencesSection()}

        <View style={styles.buttonContainer}>
          {currentSection !== 'username' && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                const sections: Section[] = ['username', 'basic', 'personal', 'preferences'];
                const currentIndex = sections.indexOf(currentSection);
                if (currentIndex > 0) {
                  setCurrentSection(sections[currentIndex - 1]);
                }
              }}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
            onPress={handleSaveSection}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#F2CC66" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentSection === 'preferences' ? 'Complete Profile' : 'Continue →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7B8799',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: '#070A12',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7B8799',
  },
  progressContainer: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E7EAF0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F2CC66',
  },
  progressText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#7B8799',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: '#070A12',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7B8799',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#070A12',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#070A12',
  },
  inputSuccess: {
    borderColor: '#17803A',
  },
  inputError: {
    borderColor: '#E03A3A',
    borderWidth: 2,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  usernameInputContainer: {
    position: 'relative',
  },
  usernameSpinner: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  usernameCheckmark: {
    position: 'absolute',
    right: 16,
    top: 12,
    fontSize: 20,
    color: '#17803A',
  },
  usernameX: {
    position: 'absolute',
    right: 16,
    top: 12,
    fontSize: 20,
    color: '#E03A3A',
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#E03A3A',
    marginTop: 4,
  },
  successText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#17803A',
    marginTop: 4,
  },
  helperText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#7B8799',
    marginTop: 4,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    overflow: 'hidden',
    height: 150,
  },
  pickerItem: {
    height: 150,
    fontSize: 16,
    color: '#070A12',
  },
  pickerTrigger: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTriggerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#070A12',
    flex: 1,
  },
  pickerPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#7B8799',
    flex: 1,
  },
  pickerArrow: {
    fontSize: 24,
    color: '#7B8799',
  },
  switchGroup: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    marginBottom: 8,
  },
  radioOptionSelected: {
    backgroundColor: 'rgba(242, 204, 102, 0.1)',
    borderColor: '#F2CC66',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F2CC66',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F2CC66',
  },
  radioText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#070A12',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#070A12',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#070A12',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#F2CC66',
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#E03A3A',
  },
});
