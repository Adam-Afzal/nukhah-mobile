// app/(auth)/profile-setup.tsx
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  slug: string;
  
  // Personal
  children: boolean;
  revert: boolean;
  marital_status: string;
  ethnicity: string;
  location: string;
  disabilities: string;
  
  // Deen & Character
  deen: string;
  personality: string;
  lifestyle: string;
  memorization_quran: string;
  islamic_education: string;
  prayer_consistency: string;
  islamic_knowledge_level: string;
  beard_commitment: string;
  charity_habits: string;
  
  // Family & Relationships
  financial_responsibility: string;
  family_involvement: string;
  conflict_resolution: string;
  polygyny_willingness: boolean;
  
  // Preferences
  spouse_criteria: string;
  dealbreakers: string;
}

type Section = 'basic' | 'personal' | 'deen' | 'family' | 'preferences';

export default function ProfileSetup() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<Section>('basic');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    phone: '',
    slug: '',
    children: false,
    revert: false,
    marital_status: '',
    ethnicity: '',
    location: '',
    disabilities: '',
    deen: '',
    personality: '',
    lifestyle: '',
    memorization_quran: '',
    islamic_education: '',
    prayer_consistency: '',
    islamic_knowledge_level: '',
    beard_commitment: '',
    charity_habits: '',
    financial_responsibility: '',
    family_involvement: '',
    conflict_resolution: '',
    polygyny_willingness: false,
    spouse_criteria: '',
    dealbreakers: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'No user found');
        return;
      }

      // Check if profile exists
      const { data: existingProfile, error } = await supabase
        .from('brother')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingProfile && !error) {
        // Profile exists - edit mode
        setIsEditMode(true);
        setProfileData({
          first_name: existingProfile.first_name || '',
          last_name: existingProfile.last_name || '',
          phone: existingProfile.phone || '',
          slug: existingProfile.slug || '',
          children: existingProfile.children || false,
          revert: existingProfile.revert || false,
          marital_status: existingProfile.marital_status || '',
          ethnicity: existingProfile.ethnicity || '',
          location: existingProfile.location || '',
          disabilities: existingProfile.disabilities || '',
          deen: existingProfile.deen || '',
          personality: existingProfile.personality || '',
          lifestyle: existingProfile.lifestyle || '',
          memorization_quran: existingProfile.memorization_quran || '',
          islamic_education: existingProfile.islamic_education || '',
          prayer_consistency: existingProfile.prayer_consistency || '',
          islamic_knowledge_level: existingProfile.islamic_knowledge_level || '',
          beard_commitment: existingProfile.beard_commitment || '',
          charity_habits: existingProfile.charity_habits || '',
          financial_responsibility: existingProfile.financial_responsibility || '',
          family_involvement: existingProfile.family_involvement || '',
          conflict_resolution: existingProfile.conflict_resolution || '',
          polygyny_willingness: existingProfile.polygyny_willingness || false,
          spouse_criteria: existingProfile.spouse_criteria || '',
          dealbreakers: existingProfile.dealbreakers || '',
        });
      } else {
        // New profile - pre-fill from application
        const { data: application } = await supabase
          .from('brother_application')
          .select('first_name, last_name, phone_number, current_location')
          .eq('user_id', user.id)
          .single();

        if (application) {
          setProfileData(prev => ({
            ...prev,
            first_name: application.first_name || '',
            last_name: application.last_name || '',
            phone: application.phone_number || '',
            location: application.current_location || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (firstName: string, lastName: string) => {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${firstName}-${random}`;
  };

  const handleSaveSection = async () => {
    // Validate current section
    if (!validateSection()) {
      return;
    }

    // If this is the last section, save to database
    if (currentSection === 'preferences') {
      await handleFinalSave();
    } else {
      // Move to next section
      const sections: Section[] = ['basic', 'personal', 'deen', 'family', 'preferences'];
      const currentIndex = sections.indexOf(currentSection);
      if (currentIndex < sections.length - 1) {
        setCurrentSection(sections[currentIndex + 1]);
      }
    }
  };

  const validateSection = (): boolean => {
    switch (currentSection) {
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
      // Add more validation as needed
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

      const profilePayload = {
        user_id: user.id,
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
        deen: profileData.deen,
        personality: profileData.personality,
        lifestyle: profileData.lifestyle,
        memorization_quran: profileData.memorization_quran,
        islamic_education: profileData.islamic_education,
        prayer_consistency: profileData.prayer_consistency,
        islamic_knowledge_level: profileData.islamic_knowledge_level,
        beard_commitment: profileData.beard_commitment,
        charity_habits: profileData.charity_habits,
        financial_responsibility: profileData.financial_responsibility,
        family_involvement: profileData.family_involvement,
        conflict_resolution: profileData.conflict_resolution,
        polygyny_willingness: profileData.polygyny_willingness,
        spouse_criteria: profileData.spouse_criteria,
        dealbreakers: profileData.dealbreakers,
      };

      const { error } = await supabase
        .from('brother')
        .upsert(profilePayload, { onConflict: 'user_id' });

      if (error) throw error;

      Alert.alert(
        'Success!',
        isEditMode ? 'Profile updated successfully' : 'Profile created successfully',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)'),
          },
        ]
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
    const sections: Section[] = ['basic', 'personal', 'deen', 'family', 'preferences'];
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

  const renderBasicSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      <Text style={styles.sectionSubtitle}>Let's start with the essentials</Text>

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
        <TextInput
          style={styles.input}
          value={profileData.location}
          onChangeText={(text) => updateField('location', text)}
          placeholder="City, Country"
          placeholderTextColor="#7B8799"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ethnicity</Text>
        <TextInput
          style={styles.input}
          value={profileData.ethnicity}
          onChangeText={(text) => updateField('ethnicity', text)}
          placeholder="e.g., Arab, South Asian, African"
          placeholderTextColor="#7B8799"
        />
      </View>
    </View>
  );

  const renderPersonalSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Personal Details</Text>
      <Text style={styles.sectionSubtitle}>Tell us more about yourself</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Marital Status *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profileData.marital_status}
            onValueChange={(value) => updateField('marital_status', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select status" value="" />
            <Picker.Item label="Never Married" value="never_married" />
            <Picker.Item label="Divorced" value="divorced" />
            <Picker.Item label="Widowed" value="widowed" />
            <Picker.Item label="Married (seeking polygyny)" value="married" />
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
            style={styles.picker}
          >
            <Picker.Item label="Select consistency" value="" />
            <Picker.Item label="Always on time" value="always_on_time" />
            <Picker.Item label="Usually on time" value="usually_on_time" />
            <Picker.Item label="Sometimes miss" value="sometimes_miss" />
            <Picker.Item label="Struggling" value="struggling" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Quran Memorization</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profileData.memorization_quran}
            onValueChange={(value) => updateField('memorization_quran', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select level" value="" />
            <Picker.Item label="None" value="none" />
            <Picker.Item label="Few Surahs" value="few_surahs" />
            <Picker.Item label="One Juz" value="juz" />
            <Picker.Item label="Multiple Juz" value="multiple_juz" />
            <Picker.Item label="Hafez" value="hafez" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Islamic Knowledge Level</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profileData.islamic_knowledge_level}
            onValueChange={(value) => updateField('islamic_knowledge_level', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select level" value="" />
            <Picker.Item label="Beginner" value="beginner" />
            <Picker.Item label="Intermediate" value="intermediate" />
            <Picker.Item label="Advanced" value="advanced" />
            <Picker.Item label="Scholar" value="scholar" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Beard Commitment</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profileData.beard_commitment}
            onValueChange={(value) => updateField('beard_commitment', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select style" value="" />
            <Picker.Item label="Full Beard" value="full_beard" />
            <Picker.Item label="Trimmed Beard" value="trimmed_beard" />
            <Picker.Item label="Mustache Only" value="mustache_only" />
            <Picker.Item label="Clean Shaven" value="clean_shaven" />
          </Picker>
        </View>
      </View>

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
        <Text style={styles.label}>Charity Habits</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.charity_habits}
          onChangeText={(text) => updateField('charity_habits', text)}
          placeholder="How do you practice charity?"
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
            style={styles.picker}
          >
            <Picker.Item label="Select level" value="" />
            <Picker.Item label="High" value="high" />
            <Picker.Item label="Moderate" value="moderate" />
            <Picker.Item label="Low" value="low" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
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
      </View>

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
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit Profile' : 'Create Your Profile'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEditMode ? 'Update your information' : 'Complete your profile to start browsing'}
          </Text>
        </View>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Current Section */}
        {currentSection === 'basic' && renderBasicSection()}
        {currentSection === 'personal' && renderPersonalSection()}
        {currentSection === 'deen' && renderDeenSection()}
        {currentSection === 'family' && renderFamilySection()}
        {currentSection === 'preferences' && renderPreferencesSection()}

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentSection !== 'basic' && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                const sections: Section[] = ['basic', 'personal', 'deen', 'family', 'preferences'];
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
      </ScrollView>
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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
});