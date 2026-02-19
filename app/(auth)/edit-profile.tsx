// app/(auth)/edit-profile.tsx
import SearchablePicker from '@/components/searchablePicker';
import { ETHNICITIES } from '@/lib/locationData';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import Constants from 'expo-constants';
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

interface ProfileData {
  username: string;
  build: string;
  ethnicity: string;
  occupation: string;
  marital_status: string;
  children: boolean;
  revert: boolean;
  disabilities: string;
  hobbies_and_interests: string;
  personality: string;
  open_to_hijrah: boolean;
  open_to_reverts: boolean;
  living_arrangements: string;
  preferred_ethnicity: string[];
  other_spouse_criteria: string;
  dealbreakers: string;
  prayer_consistency: string;
  // Brother-specific
  beard_commitment?: string;
  // Sister-specific
  open_to_polygyny?: boolean;
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

export default function EditProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [originalUsername, setOriginalUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [ethnicityPickerVisible, setEthnicityPickerVisible] = useState(false);
  const [preferredEthnicityPickerVisible, setPreferredEthnicityPickerVisible] = useState(false);

  const ethnicityItems = ETHNICITIES.map(eth => ({
    label: eth.name,
    value: eth.name,
    flag: eth.flag,
    subtitle: eth.description,
  }));

  const [formData, setFormData] = useState<ProfileData>({
    username: '',
    build: '',
    ethnicity: '',
    occupation: '',
    marital_status: '',
    children: false,
    revert: false,
    disabilities: '',
    hobbies_and_interests: '',
    personality: '',
    open_to_hijrah: false,
    open_to_reverts: true,
    living_arrangements: '',
    preferred_ethnicity: [],
    other_spouse_criteria: '',
    dealbreakers: '',
    prayer_consistency: '',
    beard_commitment: '',
    open_to_polygyny: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        router.back();
        return;
      }

      // Check if brother
      const { data: brotherData } = await supabase
        .from('brother')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (brotherData) {
        setAccountType('brother');
        setProfileId(brotherData.id);
        setOriginalUsername(brotherData.username || '');
        setFormData({
          username: brotherData.username || '',
          build: brotherData.build || '',
          ethnicity: brotherData.ethnicity || '',
          occupation: brotherData.occupation || '',
          marital_status: brotherData.marital_status || '',
          children: brotherData.children || false,
          revert: brotherData.revert || false,
          disabilities: brotherData.disabilities || '',
          hobbies_and_interests: brotherData.hobbies_and_interests || '',
          personality: brotherData.personality || '',
          open_to_hijrah: brotherData.open_to_hijrah || false,
          open_to_reverts: brotherData.open_to_reverts ?? true,
          living_arrangements: brotherData.living_arrangements || '',
          preferred_ethnicity: brotherData.preferred_ethnicity || [],
          other_spouse_criteria: brotherData.other_spouse_criteria || '',
          dealbreakers: brotherData.dealbreakers || '',
          prayer_consistency: brotherData.prayer_consistency || '',
          beard_commitment: brotherData.beard_commitment || '',
        });
        setIsLoading(false);
        return;
      }

      // Check if sister
      const { data: sisterData } = await supabase
        .from('sister')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (sisterData) {
        setAccountType('sister');
        setProfileId(sisterData.id);
        setOriginalUsername(sisterData.username || '');
        setFormData({
          username: sisterData.username || '',
          build: sisterData.build || '',
          ethnicity: sisterData.ethnicity || '',
          occupation: sisterData.occupation || '',
          marital_status: sisterData.marital_status || '',
          children: sisterData.children || false,
          revert: sisterData.revert || false,
          disabilities: sisterData.disabilities || '',
          hobbies_and_interests: sisterData.hobbies_and_interests || '',
          personality: sisterData.personality || '',
          open_to_hijrah: sisterData.open_to_hijrah || false,
          open_to_reverts: sisterData.open_to_reverts ?? true,
          living_arrangements: sisterData.living_arrangements || '',
          preferred_ethnicity: sisterData.preferred_ethnicity || [],
          other_spouse_criteria: sisterData.other_spouse_criteria || '',
          dealbreakers: sisterData.dealbreakers || '',
          prayer_consistency: sisterData.prayer_consistency || '',
          open_to_polygyny: sisterData.open_to_polygyny || false,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (username === originalUsername) {
      return true;
    }

    const { data: brotherData } = await supabase
      .from('brother')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (brotherData) return false;

    const { data: sisterData } = await supabase
      .from('sister')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    return !sisterData;
  };

  const handleUsernameChange = async (username: string) => {
    const cleanedUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setFormData({ ...formData, username: cleanedUsername });
    setUsernameError('');

    if (cleanedUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (cleanedUsername !== originalUsername) {
      setIsCheckingUsername(true);
      const isAvailable = await checkUsernameAvailability(cleanedUsername);
      setIsCheckingUsername(false);

      if (!isAvailable) {
        setUsernameError('Username is already taken');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return;
    }

    if (usernameError) {
      Alert.alert('Validation Error', usernameError);
      return;
    }

    if (!formData.build) {
      Alert.alert('Validation Error', 'Build is required');
      return;
    }

    if (!formData.ethnicity) {
      Alert.alert('Validation Error', 'Ethnicity is required');
      return;
    }

    if (!formData.marital_status) {
      Alert.alert('Validation Error', 'Marital status is required');
      return;
    }

    if (!formData.personality.trim()) {
      Alert.alert('Validation Error', 'Personality is required');
      return;
    }

    setIsSaving(true);
    try {
      if (!profileId || !accountType) {
        throw new Error('Profile not loaded');
      }

      const table = accountType === 'brother' ? 'brother' : 'sister';

      const updateData: Record<string, any> = {
        username: formData.username.trim(),
        build: formData.build,
        ethnicity: formData.ethnicity,
        occupation: formData.occupation.trim(),
        marital_status: formData.marital_status,
        children: formData.children,
        revert: formData.revert,
        disabilities: formData.disabilities.trim(),
        hobbies_and_interests: formData.hobbies_and_interests.trim(),
        personality: formData.personality.trim(),
        open_to_hijrah: formData.open_to_hijrah,
        open_to_reverts: formData.open_to_reverts,
        living_arrangements: formData.living_arrangements.trim(),
        preferred_ethnicity: formData.preferred_ethnicity,
        other_spouse_criteria: formData.other_spouse_criteria.trim(),
        dealbreakers: formData.dealbreakers.trim(),
        prayer_consistency: formData.prayer_consistency,
      };

      if (accountType === 'brother') {
        updateData.beard_commitment = formData.beard_commitment;
      }

      if (accountType === 'sister') {
        updateData.open_to_polygyny = formData.open_to_polygyny;
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', profileId);

      if (error) throw error;

      await regenerateEmbedding();

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const regenerateEmbedding = async () => {
    try {
      if (!profileId || !accountType) return;

      const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        console.error('Supabase URL not configured');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No auth session for embedding regeneration');
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/regenerate-embedding`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ profileId, accountType }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Edge function error:', errorData);
        return;
      }

      console.log('Embedding regenerated successfully');
    } catch (error) {
      console.error('Error regenerating embedding:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
      </View>
    );
  }

  const buildOptions = accountType === 'brother' ? BROTHER_BUILD_OPTIONS : SISTER_BUILD_OPTIONS;
  const maritalOptions = accountType === 'brother' ? BROTHER_MARITAL_OPTIONS : SISTER_MARITAL_OPTIONS;

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>Update your information</Text>
        </View>

        {/* Username Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Username</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <View style={styles.usernameInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  usernameError ? styles.inputError : null,
                  !usernameError && formData.username !== originalUsername && formData.username.length >= 3 ? styles.inputSuccess : null,
                ]}
                value={formData.username}
                onChangeText={handleUsernameChange}
                placeholder="Enter username"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
              />
              {isCheckingUsername && (
                <ActivityIndicator size="small" color="#F2CC66" style={styles.usernameSpinner} />
              )}
              {!isCheckingUsername && !usernameError && formData.username !== originalUsername && formData.username.length >= 3 && (
                <Text style={styles.usernameCheckmark}>✓</Text>
              )}
            </View>
            {usernameError && (
              <Text style={styles.errorText}>{usernameError}</Text>
            )}
            {!usernameError && !isCheckingUsername && formData.username !== originalUsername && formData.username.length >= 3 && (
              <Text style={styles.successText}>Username is available</Text>
            )}
            <Text style={styles.hint}>Letters, numbers, hyphens, and underscores only</Text>
          </View>
        </View>

        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Build *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.build}
                onValueChange={(value) => setFormData({ ...formData, build: value })}
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
              <Text style={formData.ethnicity ? styles.pickerTriggerText : styles.pickerPlaceholder}>
                {formData.ethnicity || 'Select your ethnicity'}
              </Text>
              <Text style={styles.pickerArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <SearchablePicker
            visible={ethnicityPickerVisible}
            onClose={() => setEthnicityPickerVisible(false)}
            onSelect={(value) => setFormData({ ...formData, ethnicity: value })}
            items={ethnicityItems}
            title="Select Ethnicity"
            placeholder="Search ethnicity..."
            selectedValue={formData.ethnicity}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Occupation</Text>
            <TextInput
              style={styles.input}
              value={formData.occupation}
              onChangeText={(text) => setFormData({ ...formData, occupation: text })}
              placeholder="e.g., Software Engineer, Student"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Marital Status *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.marital_status}
                onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
                itemStyle={styles.pickerItem}
              >
                {maritalOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prayer Consistency</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.prayer_consistency}
                onValueChange={(value) => setFormData({ ...formData, prayer_consistency: value })}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Select prayer consistency" value="" />
                <Picker.Item label="5x a Day" value="5x_daily" />
                <Picker.Item label="As Much as Possible" value="as_much_as_possible" />
                <Picker.Item label="Never" value="never" />
              </Picker>
            </View>
          </View>

          {accountType === 'brother' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Beard Commitment</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.beard_commitment}
                  onValueChange={(value) => setFormData({ ...formData, beard_commitment: value })}
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
        </View>

        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Do you have children?</Text>
              <Switch
                value={formData.children}
                onValueChange={(value) => setFormData({ ...formData, children: value })}
                trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
                thumbColor={formData.children ? '#070A12' : '#7B8799'}
              />
            </View>
          </View>

          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Are you a revert?</Text>
              <Switch
                value={formData.revert}
                onValueChange={(value) => setFormData({ ...formData, revert: value })}
                trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
                thumbColor={formData.revert ? '#070A12' : '#7B8799'}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Disabilities (if any)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.disabilities}
              onChangeText={(text) => setFormData({ ...formData, disabilities: text })}
              placeholder="Any physical or health conditions to mention"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hobbies & Interests</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.hobbies_and_interests}
              onChangeText={(text) => setFormData({ ...formData, hobbies_and_interests: text })}
              placeholder="What do you enjoy doing in your free time?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Personality *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.personality}
              onChangeText={(text) => setFormData({ ...formData, personality: text })}
              placeholder="Describe your personality"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Open to hijrah?</Text>
              <Switch
                value={formData.open_to_hijrah}
                onValueChange={(value) => setFormData({ ...formData, open_to_hijrah: value })}
                trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
                thumbColor={formData.open_to_hijrah ? '#070A12' : '#7B8799'}
              />
            </View>
          </View>

          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Open to reverts?</Text>
              <Switch
                value={formData.open_to_reverts}
                onValueChange={(value) => setFormData({ ...formData, open_to_reverts: value })}
                trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
                thumbColor={formData.open_to_reverts ? '#070A12' : '#7B8799'}
              />
            </View>
          </View>

          {accountType === 'sister' && (
            <View style={styles.switchGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Open to polygyny?</Text>
                <Switch
                  value={formData.open_to_polygyny}
                  onValueChange={(value) => setFormData({ ...formData, open_to_polygyny: value })}
                  trackColor={{ false: '#E7EAF0', true: '#F2CC66' }}
                  thumbColor={formData.open_to_polygyny ? '#070A12' : '#7B8799'}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Living Arrangements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.living_arrangements}
              onChangeText={(text) => setFormData({ ...formData, living_arrangements: text })}
              placeholder="Describe your ideal living arrangements after marriage"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Ethnicity</Text>
            <Text style={styles.hint}>Select "Any" or choose specific ethnicities</Text>

            <TouchableOpacity
              style={[
                styles.radioOption,
                formData.preferred_ethnicity.includes('Any') && styles.radioOptionSelected,
              ]}
              onPress={() => {
                setFormData(prev => ({
                  ...prev,
                  preferred_ethnicity: prev.preferred_ethnicity.includes('Any') ? [] : ['Any']
                }));
              }}
            >
              <View style={styles.radio}>
                {formData.preferred_ethnicity.includes('Any') && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>Any Ethnicity</Text>
            </TouchableOpacity>

            {!formData.preferred_ethnicity.includes('Any') && (
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => setPreferredEthnicityPickerVisible(true)}
              >
                <Text style={formData.preferred_ethnicity.length > 0 ? styles.pickerTriggerText : styles.pickerPlaceholder}>
                  {formData.preferred_ethnicity.length > 0
                    ? `${formData.preferred_ethnicity.length} selected: ${formData.preferred_ethnicity.slice(0, 2).join(', ')}${formData.preferred_ethnicity.length > 2 ? '...' : ''}`
                    : 'Select specific ethnicities'}
                </Text>
                <Text style={styles.pickerArrow}>›</Text>
              </TouchableOpacity>
            )}

            {formData.preferred_ethnicity.includes('Any') && (
              <Text style={styles.hint}>Open to all ethnicities</Text>
            )}
          </View>

          <SearchablePicker
            visible={preferredEthnicityPickerVisible}
            onClose={() => setPreferredEthnicityPickerVisible(false)}
            onSelect={(value) => {
              setFormData(prev => {
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
            selectedValue={formData.preferred_ethnicity}
            multiSelect={true}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Other Spouse Criteria</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.other_spouse_criteria}
              onChangeText={(text) => setFormData({ ...formData, other_spouse_criteria: text })}
              placeholder="What else are you looking for in a spouse?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dealbreakers</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.dealbreakers}
              onChangeText={(text) => setFormData({ ...formData, dealbreakers: text })}
              placeholder="What are your non-negotiables?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </KeyboardAwareScrollView>
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
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 19,
    color: '#F2CC66',
  },
  header: {
    marginBottom: 24,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    lineHeight: 27,
    color: '#070A12',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 17,
    color: '#070A12',
    marginBottom: 8,
  },
  input: {
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
  inputError: {
    borderColor: '#E03A3A',
  },
  inputSuccess: {
    borderColor: '#17803A',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
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
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    color: '#7B8799',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 15,
    color: '#E03A3A',
    marginTop: 4,
  },
  successText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 15,
    color: '#27AE60',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
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
    borderRadius: 8,
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
    color: '#9CA3AF',
    flex: 1,
  },
  pickerArrow: {
    fontSize: 24,
    color: '#7B8799',
  },
  switchGroup: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#070A12',
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
  saveButton: {
    backgroundColor: '#F2CC66',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 19,
    color: '#070A12',
    fontStyle: 'italic',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 19,
    color: '#7B8799',
  },
});
