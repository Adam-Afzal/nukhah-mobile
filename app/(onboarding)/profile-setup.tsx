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
type Section = 'username' | 'basic' | 'personal' | 'physical' | 'deen' | 'family' | 'preferences' | 'questions';

interface ProfileData {
  // Common fields
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  slug: string;
  birth_day: string;
  birth_month: string;
  birth_year: string;
  children: boolean;
  revert: boolean;
  marital_status: string;
  ethnicity: string[]
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
  preferred_ethnicity: string[]
  
  // Questions for interested parties
  question_deen: string;
  question_lifestyle: string;
  question_fitness: string;
  question_marital_life: string;
  question_children_legacy: string;
  
  // Brother-specific
  beard_commitment?: string;
  polygyny_willingness?: boolean;
  
  // Sister-specific
  hijab_commitment?: string;
  polygyny_acceptance?: boolean;
  wali_approval?: boolean;
  wali_name?: string;
  wali_relationship?: string;
  wali_email?: string;
  wali_phone?: string;
  wali_preferred_contact?: string;
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
const [isLoggingOut, setIsLoggingOut] = useState(false);
const [preferredEthnicityPickerVisible, setPreferredEthnicityPickerVisible] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

const handleLogout = async () => {
  Alert.alert(
    'Log Out',
    'Are you sure you want to log out?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
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
    birth_day: '',
    birth_month: '',
    birth_year: '',
    children: false,
    revert: false,
    marital_status:'',
    ethnicity: [],
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
    preferred_ethnicity: [],
    question_deen: '',
    question_lifestyle: '',
    question_fitness: '',
    question_marital_life: '',
    question_children_legacy: ''

  });

  // Calculate age from date of birth
  const calculateAge = (day: string, month: string, year: string) => {
    if (!day || !month || !year) return null;
    
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format date for display
  const formatDate = (day: string, month: string, year: string) => {
    if (!day || !month || !year) return '';
    
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

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
        .select('first_name, last_name, phone_number, current_location, marital_status, ethnicity, preferred_ethnicity, date_of_birth')
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
            
            // Parse date_of_birth if available
            let birthDay = '';
            let birthMonth = '';
            let birthYear = '';
            
            if (brotherApp.date_of_birth) {
              const date = new Date(brotherApp.date_of_birth);
              birthDay = date.getDate().toString().padStart(2, '0');
              birthMonth = (date.getMonth() + 1).toString().padStart(2, '0');
              birthYear = date.getFullYear().toString();
            }
            
            setProfileData(prev => ({
              ...prev,
              first_name: brotherApp.first_name || '',
              last_name: brotherApp.last_name || '',
              phone: brotherApp.phone_number || '',
              location: brotherApp.current_location || '',
              birth_day: birthDay,
              birth_month: birthMonth,
              birth_year: birthYear,
              polygyny_willingness: false,
              marital_status: maritalStatus,
              ethnicity: brotherApp.ethnicity,
              preferred_ethnicity: brotherApp.preferred_ethnicity
            }));
            
            setIsLoading(false);
            return;
          }

      // Check sister application
      const { data: sisterApp } = await supabase
        .from('sister_application')
        .select('first_name, last_name, phone_number, current_location, marital_status, ethnicity, preferred_ethnicity, date_of_birth')
        .eq('user_id', user.id)
        .single();

      if (sisterApp) {
        console.log("sister app found on profile setup")
        setAccountType('sister');
        console.log(`ethnicity: ${sisterApp.ethnicity}`)
        
        // Parse date_of_birth if available
        let birthDay = '';
        let birthMonth = '';
        let birthYear = '';
        
        if (sisterApp.date_of_birth) {
          const date = new Date(sisterApp.date_of_birth);
          birthDay = date.getDate().toString().padStart(2, '0');
          birthMonth = (date.getMonth() + 1).toString().padStart(2, '0');
          birthYear = date.getFullYear().toString();
        }
        
        setProfileData(prev => ({
          ...prev,
          first_name: sisterApp.first_name || '',
          last_name: sisterApp.last_name || '',
          phone: sisterApp.phone_number || '',
          location: sisterApp.current_location || '',
          birth_day: birthDay,
          birth_month: birthMonth,
          birth_year: birthYear,
          polygyny_acceptance: false,
          wali_approval: true,
          marital_status: sisterApp.marital_status || ``,
          ethnicity: sisterApp.ethnicity,
          preferred_ethnicity: sisterApp.preferred_ethnicity
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

    if (currentSection === 'questions') {
      await handleFinalSave();
    } else {
      const sections: Section[] = ['username', 'basic', 'personal', 'physical', 'deen', 'family', 'preferences', 'questions'];
      const currentIndex = sections.indexOf(currentSection);
      if (currentIndex < sections.length - 1) {
        setCurrentSection(sections[currentIndex + 1]);
      }
    }
  };

  const validateSection = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
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
        
        // Date of birth validation
        if (!profileData.birth_day.trim()) {
          newErrors.birth_day = 'Required';
        } else if (parseInt(profileData.birth_day) < 1 || parseInt(profileData.birth_day) > 31) {
          newErrors.birth_day = 'Invalid day';
        }
        
        if (!profileData.birth_month.trim()) {
          newErrors.birth_month = 'Required';
        } else if (parseInt(profileData.birth_month) < 1 || parseInt(profileData.birth_month) > 12) {
          newErrors.birth_month = 'Invalid month';
        }
        
        if (!profileData.birth_year.trim()) {
          newErrors.birth_year = 'Required';
        } else if (parseInt(profileData.birth_year) < 1924 || parseInt(profileData.birth_year) > new Date().getFullYear()) {
          newErrors.birth_year = 'Invalid year';
        }
        
        // Validate age if all fields are filled
        if (profileData.birth_day && profileData.birth_month && profileData.birth_year && 
            !newErrors.birth_day && !newErrors.birth_month && !newErrors.birth_year) {
          const age = calculateAge(profileData.birth_day, profileData.birth_month, profileData.birth_year);
          if (age !== null && age < 18) {
            newErrors.birth_year = 'You must be at least 18 years old';
          } else if (age !== null && age > 100) {
            newErrors.birth_year = 'Please enter a valid date of birth';
          }
        }
        
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          Alert.alert('Invalid Date', 'Please enter a valid date of birth');
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
      case 'family':
        if (accountType === 'sister') {
          if (!profileData.wali_name || profileData.wali_name.trim() === '') {
            newErrors.wali_name = 'Wali name is required';
            isValid = false;
          }
          
          if (!profileData.wali_relationship) {
            newErrors.wali_relationship = 'Wali relationship is required';
            isValid = false;
          }
          
          if (!profileData.wali_phone || profileData.wali_phone.trim() === '') {
            newErrors.wali_phone = 'Wali phone number is required';
            isValid = false;
          } else if (!/^\+?[\d\s()-]+$/.test(profileData.wali_phone)) {
            newErrors.wali_phone = 'Please enter a valid phone number';
            isValid = false;
          }
          
          if (!profileData.wali_email || profileData.wali_email.trim() === '') {
            newErrors.wali_email = 'Wali email is required';
            isValid = false;
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.wali_email)) {
            newErrors.wali_email = 'Please enter a valid email address';
            isValid = false;
          }
          
          if (!profileData.wali_preferred_contact) {
            newErrors.wali_preferred_contact = 'Preferred contact method is required';
            isValid = false;
          }

          if (!isValid) {
            setErrors(newErrors);
            Alert.alert('Missing Wali Information', 'Please fill in all wali contact details');
            return false;
          }
        }
        break;
      case 'questions':
        if (!profileData.question_deen.trim()) {
          Alert.alert('Missing Information', 'Please provide a question about Deen');
          return false;
        }
        if (!profileData.question_lifestyle.trim()) {
          Alert.alert('Missing Information', 'Please provide a question about Lifestyle');
          return false;
        }
        if (!profileData.question_fitness.trim()) {
          Alert.alert('Missing Information', 'Please provide a question about Fitness');
          return false;
        }
        if (!profileData.question_marital_life.trim()) {
          Alert.alert('Missing Information', 'Please provide a question about Marital Life');
          return false;
        }
        if (!profileData.question_children_legacy.trim()) {
          Alert.alert('Missing Information', 'Please provide a question about Children & Legacy');
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

      // Format date as YYYY-MM-DD for database
      const date_of_birth = `${profileData.birth_year}-${profileData.birth_month.padStart(2, '0')}-${profileData.birth_day.padStart(2, '0')}`;

      const baseProfile = {
        user_id: user.id,
        username: profileData.username,
        slug,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        date_of_birth,
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
        question_deen: profileData.question_deen,
        question_lifestyle: profileData.question_lifestyle,
        question_fitness: profileData.question_fitness,
        question_marital_life: profileData.question_marital_life,
        question_children_legacy: profileData.question_children_legacy,
      };

      if (accountType === 'brother') {
        const { data, error } = await supabase.from('brother').insert({
          ...baseProfile,
          beard_commitment: profileData.beard_commitment,
          polygyny_willingness: profileData.polygyny_willingness,
        }).select('id').single();

        if (error) throw error;

        await updateBrotherEmbedding(data.id, profileData);
      } else if (accountType === 'sister') {
        const { data, error } = await supabase.from('sister').insert({
          ...baseProfile,
          hijab_commitment: profileData.hijab_commitment,
          polygyny_acceptance: profileData.polygyny_acceptance,
          wali_approval: profileData.wali_approval,
          wali_name: profileData.wali_name,
          wali_relationship: profileData.wali_relationship,
          wali_email: profileData.wali_email,
          wali_phone: profileData.wali_phone,
          wali_preferred_contact: profileData.wali_preferred_contact,
        }).select('id').single();

        if (error) throw error;

        await updateSisterEmbedding(data.id, profileData);
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
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderProgressBar = () => {
    const sections: Section[] = ['username', 'basic', 'personal', 'physical', 'deen', 'family', 'preferences', 'questions'];
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
  
      {/* Logout Button */}
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

      {/* Date of Birth - Three Input Fields */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Birth *</Text>
        <Text style={styles.hint}>You must be at least 18 years old</Text>
        <View style={styles.dateInputRow}>
          <View style={styles.dateInputWrapper}>
            <TextInput
              style={[styles.dateInput, errors.birth_day && styles.inputError]}
              placeholder="DD"
              placeholderTextColor="#7B8799"
              value={profileData.birth_day}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                setProfileData({ ...profileData, birth_day: cleaned });
                if (errors.birth_day) setErrors({ ...errors, birth_day: '' });
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
            {errors.birth_day && <Text style={styles.errorTextSmall}>{errors.birth_day}</Text>}
          </View>
          
          <View style={styles.dateInputWrapper}>
            <TextInput
              style={[styles.dateInput, errors.birth_month && styles.inputError]}
              placeholder="MM"
              placeholderTextColor="#7B8799"
              value={profileData.birth_month}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                setProfileData({ ...profileData, birth_month: cleaned });
                if (errors.birth_month) setErrors({ ...errors, birth_month: '' });
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
            {errors.birth_month && <Text style={styles.errorTextSmall}>{errors.birth_month}</Text>}
          </View>
          
          <View style={styles.dateInputWrapper}>
            <TextInput
              style={[styles.dateInput, errors.birth_year && styles.inputError]}
              placeholder="YYYY"
              placeholderTextColor="#7B8799"
              value={profileData.birth_year}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
                setProfileData({ ...profileData, birth_year: cleaned });
                if (errors.birth_year) setErrors({ ...errors, birth_year: '' });
              }}
              keyboardType="number-pad"
              maxLength={4}
            />
            {errors.birth_year && <Text style={styles.errorTextSmall}>{errors.birth_year}</Text>}
          </View>
        </View>
        {profileData.birth_day && profileData.birth_month && profileData.birth_year && 
         !errors.birth_day && !errors.birth_month && !errors.birth_year && (
          <Text style={styles.ageDisplay}>
            {formatDate(profileData.birth_day, profileData.birth_month, profileData.birth_year)} 
            ({calculateAge(profileData.birth_day, profileData.birth_month, profileData.birth_year)} years old)
          </Text>
        )}
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
    <Text style={profileData.ethnicity.length > 0 ? styles.pickerTriggerText : styles.pickerPlaceholder}>
      {profileData.ethnicity.length > 0 ? profileData.ethnicity[0] : 'Select your ethnicity'}
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
  onSelect={(value) => updateField('ethnicity', [value])} // Wrap in array
  items={ethnicityItems}
  title="Select Ethnicity"
  placeholder="Search ethnicity..."
  selectedValue={Array.isArray(profileData.ethnicity) ? profileData.ethnicity[0] : profileData.ethnicity} // Show first item if array
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
                height: 150,
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Wali (Guardian) Information</Text>
            <Text style={styles.sectionHeaderDescription}>
              Required. Your wali will be contacted when mutual interest is confirmed.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wali Name *</Text>
            <TextInput
              style={[styles.input, errors.wali_name && styles.inputError]}
              value={profileData.wali_name}
              onChangeText={(text) => updateField('wali_name', text)}
              placeholder="Full name of your wali"
              placeholderTextColor="#7B8799"
            />
            {errors.wali_name && (
              <Text style={styles.errorText}>{errors.wali_name}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relationship to You *</Text>
            <View style={[styles.pickerContainer, errors.wali_relationship && styles.inputError]}>
              <Picker
                selectedValue={profileData.wali_relationship}
                onValueChange={(value) => updateField('wali_relationship', value)}
                itemStyle={{
                  height: 150,
                  fontSize: 16,
                  color: '#070A12',
                }}
              >
                <Picker.Item label="Select relationship..." value="" />
                <Picker.Item label="Father" value="Father" />
                <Picker.Item label="Brother" value="Brother" />
                <Picker.Item label="Uncle (paternal)" value="Uncle" />
                <Picker.Item label="Grandfather" value="Grandfather" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
            {errors.wali_relationship && (
              <Text style={styles.errorText}>{errors.wali_relationship}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wali Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.wali_phone && styles.inputError]}
              value={profileData.wali_phone}
              onChangeText={(text) => updateField('wali_phone', text)}
              placeholder="+44 7XXX XXXXXX"
              placeholderTextColor="#7B8799"
              keyboardType="phone-pad"
            />
            <Text style={styles.helperText}>Include country code (e.g., +44 for UK)</Text>
            {errors.wali_phone && (
              <Text style={styles.errorText}>{errors.wali_phone}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wali Email Address *</Text>
            <TextInput
              style={[styles.input, errors.wali_email && styles.inputError]}
              value={profileData.wali_email}
              onChangeText={(text) => updateField('wali_email', text)}
              placeholder="wali@example.com"
              placeholderTextColor="#7B8799"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.wali_email && (
              <Text style={styles.errorText}>{errors.wali_email}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wali's Preferred Contact Method *</Text>
            <View style={[styles.pickerContainer, errors.wali_preferred_contact && styles.inputError]}>
              <Picker
                selectedValue={profileData.wali_preferred_contact}
                onValueChange={(value) => updateField('wali_preferred_contact', value)}
                itemStyle={{
                  height: 150,
                  fontSize: 16,
                  color: '#070A12',
                }}
              >
                <Picker.Item label="Select preference..." value="" />
                <Picker.Item label="Phone" value="Phone" />
                <Picker.Item label="Email" value="Email" />
                <Picker.Item label="Either (Phone or Email)" value="Both" />
              </Picker>
            </View>
            {errors.wali_preferred_contact && (
              <Text style={styles.errorText}>{errors.wali_preferred_contact}</Text>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxIcon}>ℹ️</Text>
            <Text style={styles.infoBoxText}>
              Your wali's contact information will only be shared with brothers after mutual interest 
              is confirmed (both parties complete questions and accept).
            </Text>
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

       {/* Preferred Ethnicity - Multi-select */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Preferred Ethnicity</Text>
  <Text style={styles.hint}>Select "Any" or choose specific ethnicities</Text>
  
  {/* "Any" option as a separate button */}
  <TouchableOpacity
    style={[
      styles.radioOption,
      profileData.preferred_ethnicity.includes('Any') && styles.radioOptionSelected,
    ]}
    onPress={() => {
      // If "Any" is selected, clear all others and set only "Any"
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

  {/* Only show the picker if "Any" is NOT selected */}
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

 {/* Preferred Ethnicity Picker Modal - Multi-select */}
 <SearchablePicker
  visible={preferredEthnicityPickerVisible}
  onClose={() => setPreferredEthnicityPickerVisible(false)}
  onSelect={(value) => {
    // Toggle selection for multi-select
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

      {accountType === "sister" && (
        <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Open To Polygyny?</Text>
          <Switch
            value={profileData.polygyny_acceptance}
            onValueChange={(value) => updateField('polygyny_acceptance', value)}
            trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
            thumbColor={profileData.polygyny_acceptance ? '#070A12' : '#7B8799'}
          />
        </View>
      </View>
      )}
    </View>
  );

  const renderQuestionsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Questions</Text>
      <Text style={styles.sectionSubtitle}>
        Create 5 questions to ask people who express interest in you. These help you understand their values and compatibility.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>1. Deen Question *</Text>
        <Text style={styles.hint}>Ask about their relationship with Islam, prayer, knowledge seeking, etc.</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.question_deen}
          onChangeText={(text) => updateField('question_deen', text)}
          placeholder="Example: How would you describe your relationship with the Quran?"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>2. Lifestyle Question *</Text>
        <Text style={styles.hint}>Ask about their daily routine, habits, interests, or way of living</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.question_lifestyle}
          onChangeText={(text) => updateField('question_lifestyle', text)}
          placeholder="Example: What does a typical day look like for you?"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>3. Fitness Question *</Text>
        <Text style={styles.hint}>Ask about their approach to health, exercise, and physical wellbeing</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.question_fitness}
          onChangeText={(text) => updateField('question_fitness', text)}
          placeholder="Example: How do you prioritize your physical health and fitness?"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>4. Marital Life Question *</Text>
        <Text style={styles.hint}>Ask about their expectations, roles, or vision for marriage</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.question_marital_life}
          onChangeText={(text) => updateField('question_marital_life', text)}
          placeholder="Example: What does an ideal marriage look like to you?"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>5. Children & Legacy Question *</Text>
        <Text style={styles.hint}>Ask about their views on raising children, family goals, or long-term vision</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.question_children_legacy}
          onChangeText={(text) => updateField('question_children_legacy', text)}
          placeholder="Example: How do you envision raising righteous Muslim children?"
          placeholderTextColor="#7B8799"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxIcon}>💡</Text>
        <Text style={styles.infoBoxText}>
          These questions will be asked to anyone who expresses interest in your profile. Choose thoughtful questions that reveal character and compatibility.
        </Text>
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
        {currentSection === 'questions' && renderQuestionsSection()}

        <View style={styles.buttonContainer}>
          {currentSection !== 'username' && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                const sections: Section[] = ['username', 'basic', 'personal', 'physical', 'deen', 'family', 'preferences', 'questions'];
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
                {currentSection === 'questions' ? 'Complete Profile' : 'Continue →'}
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
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
  sectionHeader: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    lineHeight: 27,
    color: '#070A12',
    marginBottom: 8,
  },
  sectionHeaderDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#7B8799',
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
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerDanger: {
    backgroundColor: '#F8E5E5',
  },
  iconContainerWarning: {
    backgroundColor: '#FEF3E5',
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
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 18,
    color: '#070A12',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  settingTitleDanger: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 18,
    color: '#B7312C',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  settingTitleWarning: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 18,
    color: '#F2994A',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    color: '#7B8799',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7EAF0',
    marginLeft: 60,
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
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    marginBottom: 8,
  },
  radioOptionSelected: {
    backgroundColor: 'rgba(242, 204, 102, 0.1)',
    borderColor: '#F2CC66',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOptionInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
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
    color: '#F7E099',
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
    fontStyle: 'italic',
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  dateInputWrapper: {
    flex: 1,
    gap: 4,
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#070A12',
    textAlign: 'center',
  },
  errorTextSmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#E03A3A',
    textAlign: 'center',
  },
  ageDisplay: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#7B8799',
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F2CC66',
  },
  infoBoxIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoBoxText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#070A12',
  },
});