// app/(auth)/profile-setup.tsx
import SearchablePicker from '@/components/searchablePicker';
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

type AccountType = 'brother' | 'sister';
type Section = 'username' | 'basic' | 'personal' | 'physical' | 'deen' | 'family' | 'preferences';

interface ProfileData {
  // Common fields
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  slug: string;
  children: boolean;
  revert: boolean;
  marital_status: string;
  ethnicity: string;
  location: string;
  disabilities: string;
  build: string;
  physical_fitness: string;
  deen: string;
  personality: string;
  lifestyle: string;
  memorization_quran: string;
  islamic_education: string;
  prayer_consistency: string;
  islamic_knowledge_level: string;
  charity_habits: string;
  financial_responsibility: string;
  family_involvement: string;
  conflict_resolution: string;
  spouse_criteria: string;
  dealbreakers: string;
  
  // Brother-specific
  beard_commitment?: string;
  polygyny_willingness?: boolean;
  
  // Sister-specific
  hijab_commitment?: string;
  polygyny_acceptance?: boolean;
  wali_approval?: boolean;
  wali_name?: string;
  wali_email?: string;
  wali_phone?: string;
}

export default function ProfileSetup() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [currentSection, setCurrentSection] = useState<Section>('username');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
const [ethnicityPickerVisible, setEthnicityPickerVisible] = useState(false);


const locationItems = COUNTRIES.flatMap(country => 
    country.majorCities.map(city => ({
      label: `${city}, ${country.name}`,
      value: `${city}, ${country.name}`,
      flag: country.flag,
      subtitle: country.name,
    }))
  );

  const ethnicityItems = ETHNICITIES.map(eth => ({
    label: eth.name,
    value: eth.name,
    flag: eth.flag,
    subtitle: eth.description,
  }));
  
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    slug: '',
    children: false,
    revert: false,
    marital_status:'',
    ethnicity: '',
    location: '',
    disabilities: '',
    build: '',
    physical_fitness: '',
    deen: '',
    personality: '',
    lifestyle: '',
    memorization_quran: '',
    islamic_education: '',
    prayer_consistency: '',
    islamic_knowledge_level: '',
    charity_habits: '',
    financial_responsibility: '',
    family_involvement: '',
    conflict_resolution: '',
    spouse_criteria: '',
    dealbreakers: '',
  });

  useEffect(() => {
    console.log("loading account type!")
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
      const { data: brotherApp } = await supabase
        .from('brother_application')
        .select('first_name, last_name, phone_number, current_location, marital_status')
        .eq('user_id', user.id)
        .single();

        if (brotherApp) {
            console.log("account type is brother!")
            console.log("Marital status from DB:", brotherApp.marital_status)
            
            setAccountType('brother');
            
            const validMaritalStatuses = ['never_married', 'divorced', 'widowed', 'married'];
            const maritalStatus = validMaritalStatuses.includes(brotherApp.marital_status) 
              ? brotherApp.marital_status 
              : '';
            
            setProfileData(prev => ({
              ...prev,
              first_name: brotherApp.first_name || '',
              last_name: brotherApp.last_name || '',
              phone: brotherApp.phone_number || '',
              location: brotherApp.current_location || '',
              polygyny_willingness: false,
              marital_status: maritalStatus
            }));
            
            setIsLoading(false);
            return;
          }

      // Check sister application
      const { data: sisterApp } = await supabase
        .from('sister_application')
        .select('first_name, last_name, phone_number, current_location, marital_status')
        .eq('user_id', user.id)
        .single();

      if (sisterApp) {
        console.log("sister app found on profile setup")
        setAccountType('sister');
        setProfileData(prev => ({
          ...prev,
          first_name: sisterApp.first_name || '',
          last_name: sisterApp.last_name || '',
          phone: sisterApp.phone_number || '',
          location: sisterApp.current_location || '',
          polygyny_acceptance: false,
          wali_approval: true,
          marital_status: sisterApp.marital_status || ``
        }));
        setIsLoading(false);
        return;
      }

      console.log("no application found!")

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
      const sections: Section[] = ['username', 'basic', 'personal', 'physical', 'deen', 'family', 'preferences'];
      const currentIndex = sections.indexOf(currentSection);
      if (currentIndex < sections.length - 1) {
        setCurrentSection(sections[currentIndex + 1]);
      }
    }
  };

  const validateSection = (): boolean => {
    switch (currentSection) {
      case 'username':
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
        if (!profileData.first_name || !profileData.last_name || !profileData.phone) {
          Alert.alert('Missing Information', 'Please fill in all required fields');
          return false;
        }
        break;
      case 'personal':
        if (!profileData.marital_status || !profileData.location) {
          Alert.alert('Missing Information', 'Please fill in all required fields');
          return false;
        }
        break;
      case 'physical':
        if (!profileData.build || !profileData.physical_fitness) {
          Alert.alert('Missing Information', 'Please select your build and physical fitness level');
          return false;
        }
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
        children: profileData.children,
        revert: profileData.revert,
        marital_status: profileData.marital_status,
        ethnicity: profileData.ethnicity,
        location: profileData.location,
        disabilities: profileData.disabilities,
        build: profileData.build,
        physical_fitness: profileData.physical_fitness,
        deen: profileData.deen,
        personality: profileData.personality,
        lifestyle: profileData.lifestyle,
        memorization_quran: profileData.memorization_quran,
        islamic_education: profileData.islamic_education,
        prayer_consistency: profileData.prayer_consistency,
        islamic_knowledge_level: profileData.islamic_knowledge_level,
        charity_habits: profileData.charity_habits,
        financial_responsibility: profileData.financial_responsibility,
        family_involvement: profileData.family_involvement,
        conflict_resolution: profileData.conflict_resolution,
        spouse_criteria: profileData.spouse_criteria,
        dealbreakers: profileData.dealbreakers,
      };

      if (accountType === 'brother') {
        const { error } = await supabase.from('brother').insert({
          ...baseProfile,
          beard_commitment: profileData.beard_commitment,
          polygyny_willingness: profileData.polygyny_willingness,
        });

        if (error) throw error;
      } else if (accountType === 'sister') {
        const { error } = await supabase.from('sister').insert({
          ...baseProfile,
          hijab_commitment: profileData.hijab_commitment,
          polygyny_acceptance: profileData.polygyny_acceptance,
          wali_approval: profileData.wali_approval,
          wali_name: profileData.wali_name,
          wali_email: profileData.wali_email,
          wali_phone: profileData.wali_phone,
        });

        if (error) throw error;
      }

      Alert.alert(
        'Success!',
        'Profile created successfully',
        [{ text: 'OK', onPress: () => router.replace('/(auth)') }]
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
    const sections: Section[] = ['username', 'basic', 'personal', 'physical', 'deen', 'family', 'preferences'];
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

  const renderUsernameSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Choose Your Username</Text>
      <Text style={styles.sectionSubtitle}>This will be your unique identifier</Text>

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
        {usernameError && (
          <Text style={styles.errorText}>{usernameError}</Text>
        )}
        {usernameAvailable === true && (
          <Text style={styles.successText}>Username is available!</Text>
        )}
        <Text style={styles.helperText}>
          3+ characters, letters, numbers, hyphens, and underscores only
        </Text>
      </View>
    </View>
  );

  const renderBasicSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      <Text style={styles.sectionSubtitle}>Confirm your details</Text>

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
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={profileData.phone}
          onChangeText={(text) => updateField('phone', text)}
          placeholder="+1234567890"
          placeholderTextColor="#7B8799"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
  <Text style={styles.label}>Location *</Text>
  <TouchableOpacity
    style={styles.pickerTrigger}
    onPress={() => setLocationPickerVisible(true)}
  >
    <Text style={profileData.location ? styles.pickerTriggerText : styles.pickerPlaceholder}>
      {profileData.location || 'Select your location'}
    </Text>
    <Text style={styles.pickerArrow}>›</Text>
  </TouchableOpacity>
</View>

<View style={styles.inputGroup}>
  <Text style={styles.label}>Ethnicity</Text>
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

 {/* Location Picker Modal */}
 <SearchablePicker
     visible={locationPickerVisible}
     onClose={() => setLocationPickerVisible(false)}
     onSelect={(value) => updateField('location', value)}
     items={locationItems}
     title="Select Location"
     placeholder="Search city or country..."
     selectedValue={profileData.location}
   />
 
   {/* Ethnicity Picker Modal */}
   <SearchablePicker
     visible={ethnicityPickerVisible}
     onClose={() => setEthnicityPickerVisible(false)}
     onSelect={(value) => updateField('ethnicity', value)}
     items={ethnicityItems}
     title="Select Ethnicity"
     placeholder="Search ethnicity..."
     selectedValue={profileData.ethnicity}
   />

    </View>

    
  );

  const renderPersonalSection = () => {
    if (!accountType) {
      return (
        <View style={styles.section}>
          <ActivityIndicator size="large" color="#F2CC66" />
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <Text style={styles.sectionSubtitle}>Tell us more about yourself</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Marital Status *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={profileData.marital_status}
              onValueChange={(value) => updateField('marital_status', value)}
              itemStyle={{
                height: 150,
                fontSize: 16,
                color: '#070A12',
              }}
            >
              <Picker.Item label="Select status" value="" />
              <Picker.Item label="Never Married" value="never_married" />
              <Picker.Item label="Divorced" value="divorced" />
              <Picker.Item label="Widowed" value="widowed" />
              {accountType === 'brother' && (
                <Picker.Item label="Married (seeking polygyny)" value="married" />
              )}
            </Picker>
          </View>
        </View>

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
      </View>
    );
  };

  const renderPhysicalSection = () => {
    console.log(`inside physical section: ${accountType}`)
    if (!accountType) {
      return (
        <View style={styles.section}>
          <ActivityIndicator size="large" color="#F2CC66" />
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Physical Attributes</Text>
        <Text style={styles.sectionSubtitle}>Describe your physical characteristics</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Build *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={profileData.build}
              onValueChange={(value) => updateField('build', value)}
              itemStyle={{
                height: 150,
                fontSize: 16,
                color: '#070A12',
              }}
            >
              <Picker.Item label="Select build" value="" />
              {accountType === 'sister' && <Picker.Item label="Athletic" value="athletic" />}
{accountType === 'sister' && <Picker.Item label="Curvaceous" value="curvaceous" />}
{accountType === 'sister' && <Picker.Item label="Curvy Athletic" value="curvy_athletic" />}
{accountType === 'sister' && <Picker.Item label="Hourglass" value="hourglass" />}
{accountType === 'sister' && <Picker.Item label="Heavyset" value="heavyset" />}
{accountType === 'sister' && <Picker.Item label="Average" value="average" />}
{accountType === 'brother' && <Picker.Item label="Lean" value="lean" />}
{accountType === 'brother' && <Picker.Item label="Muscular" value="muscular" />}
{accountType === 'brother' && <Picker.Item label="Bulky" value="bulky" />}
{accountType === 'brother' && <Picker.Item label="Heavyset" value="heavyset" />}
{accountType === 'brother' && <Picker.Item label="Average" value="average" />}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Physical Fitness *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={profileData.physical_fitness}
              onValueChange={(value) => updateField('physical_fitness', value)}
              itemStyle={{
                height: 150,
                fontSize: 16,
                color: '#070A12',
              }}
            >
              <Picker.Item label="Select fitness level" value="" />
              <Picker.Item label="Athlete - Trains regularly, high physical performance" value="athlete" />
              <Picker.Item label="Very Fit - Consistent workouts, strong conditioning" value="very_fit" />
              <Picker.Item label="Fit - Exercises several times a week" value="fit" />
              <Picker.Item label="Moderately Fit - Some exercise, balanced" value="moderately_fit" />
              <Picker.Item label="Light Exercise - Occasional activity" value="light_exercise" />
            </Picker>
          </View>
        </View>
      </View>
    );
  };

  const renderDeenSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Deen & Character</Text>
      <Text style={styles.sectionSubtitle}>Share your Islamic journey</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Prayer Consistency</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profileData.prayer_consistency}
            onValueChange={(value) => updateField('prayer_consistency', value)}
            itemStyle={{
              height: 150,
              fontSize: 16,
              color: '#070A12',
            }}
          >
            <Picker.Item label="Select consistency" value="" />
            <Picker.Item label="5x a day" value="5_times_a_day" />
            <Picker.Item label="As much as possible" value="as_much_as_possible" />
            <Picker.Item label="Occasionally" value="occasionally" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Quran Memorization</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profileData.memorization_quran}
            onValueChange={(value) => updateField('memorization_quran', value)}
            itemStyle={{
              height: 150,
              fontSize: 16,
              color: '#070A12',
            }}
          >
            <Picker.Item label="Select level" value="" />
            <Picker.Item label="None" value="none" />
            <Picker.Item label="Few Surahs" value="few_surahs" />
            <Picker.Item label="Multiple Juz" value="multiple_juz" />
            <Picker.Item label={accountType === 'sister' ? 'Hafidha' : 'Hafidh'} value={accountType === 'sister' ? 'hafidha' : 'hafidh'} />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ilm Seeking Level</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profileData.islamic_knowledge_level}
            onValueChange={(value) => updateField('islamic_knowledge_level', value)}
            itemStyle={{
              height: 150,
              fontSize: 16,
              color: '#070A12',
            }}
          >
            <Picker.Item label="Select level" value="" />
            <Picker.Item label="1-3 Years " value="1-3-years" />
            <Picker.Item label="3-5 Years" value="3-5-years" />
            <Picker.Item label="5+ Years" value="5-plus-years" />
          </Picker>
        </View>
      </View>

      {accountType === 'brother' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Beard</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={profileData.beard_commitment}
              onValueChange={(value) => updateField('beard_commitment', value)}
              itemStyle={{
                height: 50,
                fontSize: 16,
                color: '#070A12',
              }}
            >
              <Picker.Item label="Select style" value="" />
              <Picker.Item label="Full Sunnah Beard" value="full_sunnah_beard" />
              <Picker.Item label="Trimmed Beard" value="trimmed_beard" />
              <Picker.Item label="Clean Shaven" value="clean_shaven" />
            </Picker>
          </View>
        </View>
      )}

      {accountType === 'sister' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hijab Commitment</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={profileData.hijab_commitment}
              onValueChange={(value) => updateField('hijab_commitment', value)}
              itemStyle={{
                height: 150,
                fontSize: 16,
                color: '#070A12',
              }}
            >
              <Picker.Item label="Select style" value="" />
              <Picker.Item label="Niqab" value="niqab" />
              <Picker.Item label="Khimar (Hijab) + Abaya" value="hijab_abaya" />
              <Picker.Item label="Khimar (Hijab) + Western Clothing" value="hijab_western_clothing" />
              <Picker.Item label="Open Hair" value="open_hair" />
            </Picker>
          </View>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Islamic Education</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.islamic_education}
          onChangeText={(text) => updateField('islamic_education', text)}
          placeholder="Describe your Islamic education background"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Deen Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.deen}
          onChangeText={(text) => updateField('deen', text)}
          placeholder="Describe your relationship with your deen"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Personality</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.personality}
          onChangeText={(text) => updateField('personality', text)}
          placeholder="Describe your personality"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Lifestyle</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.lifestyle}
          onChangeText={(text) => updateField('lifestyle', text)}
          placeholder="Describe your lifestyle"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderFamilySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Family & Relationships</Text>
      <Text style={styles.sectionSubtitle}>How you approach family life</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Family Involvement</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profileData.family_involvement}
            onValueChange={(value) => updateField('family_involvement', value)}
            itemStyle={{
              height: 150,
              fontSize: 16,
              color: '#070A12',
            }}
          >
            <Picker.Item label="Select level" value="" />
            <Picker.Item label="High" value="high" />
            <Picker.Item label="Moderate" value="moderate" />
            <Picker.Item label="Low" value="low" />
          </Picker>
        </View>
      </View>

      {accountType === "brother" &&   <View style={styles.inputGroup}>
        <Text style={styles.label}>Financial Responsibility</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.financial_responsibility}
          onChangeText={(text) => updateField('financial_responsibility', text)}
          placeholder="How do you handle finances?"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Conflict Resolution</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.conflict_resolution}
          onChangeText={(text) => updateField('conflict_resolution', text)}
          placeholder="How do you handle conflicts?"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      {accountType === 'brother' && profileData.marital_status !== "married" && (
        <View style={styles.switchGroup}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Open to Polygyny?</Text>
            <Switch
              value={profileData.polygyny_willingness}
              onValueChange={(value) => updateField('polygyny_willingness', value)}
              trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
              thumbColor={profileData.polygyny_willingness ? '#070A12' : '#7B8799'}
            />
          </View>
        </View>
      )}

      {accountType === 'sister' && (
        <>
          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Accept Polygyny?</Text>
              <Switch
                value={profileData.polygyny_acceptance}
                onValueChange={(value) => updateField('polygyny_acceptance', value)}
                trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
                thumbColor={profileData.polygyny_acceptance ? '#070A12' : '#7B8799'}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wali Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.wali_name}
              onChangeText={(text) => updateField('wali_name', text)}
              placeholder="Wali's name"
              placeholderTextColor="#7B8799"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wali Email</Text>
            <TextInput
              style={styles.input}
              value={profileData.wali_email}
              onChangeText={(text) => updateField('wali_email', text)}
              placeholder="Wali's email"
              placeholderTextColor="#7B8799"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wali Phone</Text>
            <TextInput
              style={styles.input}
              value={profileData.wali_phone}
              onChangeText={(text) => updateField('wali_phone', text)}
              placeholder="Wali's phone number (including extension code)"
              placeholderTextColor="#7B8799"
              keyboardType="phone-pad"
            />
          </View>
        </>
      )}
    </View>
  );

  const renderPreferencesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Spouse Preferences</Text>
      <Text style={styles.sectionSubtitle}>What are you looking for?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Spouse Criteria</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.spouse_criteria}
          onChangeText={(text) => updateField('spouse_criteria', text)}
          placeholder="Describe your ideal spouse in detail"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={5}
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
          numberOfLines={5}
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
        {currentSection === 'physical' && renderPhysicalSection()}
        {currentSection === 'deen' && renderDeenSection()}
        {currentSection === 'family' && renderFamilySection()}
        {currentSection === 'preferences' && renderPreferencesSection()}

        <View style={styles.buttonContainer}>
          {currentSection !== 'username' && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                const sections: Section[] = ['username', 'basic', 'personal', 'physical', 'deen', 'family', 'preferences'];
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
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
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
    color: '#7B8799',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    overflow: 'hidden',
    height: 150,
  },
  picker: {
    height: 50
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
});