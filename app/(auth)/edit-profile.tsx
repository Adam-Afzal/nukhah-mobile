// app/(auth)/edit-profile.tsx
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

type AccountType = 'brother' | 'sister';

interface ProfileData {
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  ethnicity: string[];
  date_of_birth: string;
  deen: string;
  personality: string;
  lifestyle: string;
  spouse_criteria: string;
  dealbreakers: string;
  build?: string;
  physical_fitness?: string;
  // Brother specific
  beard_commitment?: string;
  // Sister specific
  hijab_commitment?: string;
  wali_name?: string;
  wali_relationship?: string;
  wali_phone?: string;
  wali_email?: string;
  wali_preferred_contact?: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [originalUsername, setOriginalUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [formData, setFormData] = useState<ProfileData>({
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    ethnicity: [],
    date_of_birth: '',
    deen: '',
    personality: '',
    lifestyle: '',
    spouse_criteria: '',
    dealbreakers: '',
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
          first_name: brotherData.first_name || '',
          last_name: brotherData.last_name || '',
          phone: brotherData.phone || '',
          location: brotherData.location || '',
          ethnicity: brotherData.ethnicity || [],
          date_of_birth: brotherData.date_of_birth || '',
          deen: brotherData.deen || '',
          personality: brotherData.personality || '',
          lifestyle: brotherData.lifestyle || '',
          spouse_criteria: brotherData.spouse_criteria || '',
          dealbreakers: brotherData.dealbreakers || '',
          build: brotherData.build || '',
          physical_fitness: brotherData.physical_fitness || '',
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
          first_name: sisterData.first_name || '',
          last_name: sisterData.last_name || '',
          phone: sisterData.phone || '',
          location: sisterData.location || '',
          ethnicity: sisterData.ethnicity || [],
          date_of_birth: sisterData.date_of_birth || '',
          deen: sisterData.deen || '',
          personality: sisterData.personality || '',
          lifestyle: sisterData.lifestyle || '',
          spouse_criteria: sisterData.spouse_criteria || '',
          dealbreakers: sisterData.dealbreakers || '',
          build: sisterData.build || '',
          physical_fitness: sisterData.physical_fitness || '',
          hijab_commitment: sisterData.hijab_commitment || '',
          wali_name: sisterData.wali_name || '',
          wali_relationship: sisterData.wali_relationship || '',
          wali_phone: sisterData.wali_phone || '',
          wali_email: sisterData.wali_email || '',
          wali_preferred_contact: sisterData.wali_preferred_contact || '',
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
    // If username hasn't changed, it's available
    if (username === originalUsername) {
      return true;
    }

    // Check both brother and sister tables
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
    setFormData({ ...formData, username });
    setUsernameError('');

    // Validate format
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    // Check availability
    if (username !== originalUsername) {
      setIsCheckingUsername(true);
      const isAvailable = await checkUsernameAvailability(username);
      setIsCheckingUsername(false);

      if (!isAvailable) {
        setUsernameError('Username is already taken');
      }
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return;
    }

    if (usernameError) {
      Alert.alert('Validation Error', usernameError);
      return;
    }

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      Alert.alert('Validation Error', 'First name and last name are required');
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return;
    }

    setIsSaving(true);
    try {
      if (!profileId || !accountType) {
        throw new Error('Profile not loaded');
      }

      const table = accountType === 'brother' ? 'brother' : 'sister';

      // Update profile
      const { error } = await supabase
        .from(table)
        .update({
          username: formData.username.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim(),
          location: formData.location.trim(),
          date_of_birth: formData.date_of_birth,
          deen: formData.deen.trim(),
          personality: formData.personality.trim(),
          lifestyle: formData.lifestyle.trim(),
          spouse_criteria: formData.spouse_criteria.trim(),
          dealbreakers: formData.dealbreakers.trim(),
          ...(accountType === 'brother' && {
            beard_commitment: formData.beard_commitment,
          }),
          ...(accountType === 'sister' && {
            hijab_commitment: formData.hijab_commitment,
            wali_name: formData.wali_name?.trim(),
            wali_relationship: formData.wali_relationship,
            wali_phone: formData.wali_phone?.trim(),
            wali_email: formData.wali_email?.trim(),
            wali_preferred_contact: formData.wali_preferred_contact,
          }),
        })
        .eq('id', profileId);

      if (error) throw error;

      // Regenerate embedding
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

      // Calculate age
      const age = formData.date_of_birth 
        ? new Date().getFullYear() - new Date(formData.date_of_birth).getFullYear()
        : 0;

      // Build profile text for embedding
      const profileText = `Location: ${formData.location || 'Not specified'}. ` +
        `Ethnicity: ${formData.ethnicity.length > 0 ? formData.ethnicity.join(', ') : 'Not specified'}. ` +
        `Age: ${age}. ` +
        `Deen: ${formData.deen || 'Not specified'}. ` +
        `Personality: ${formData.personality || 'Not specified'}. ` +
        `Lifestyle: ${formData.lifestyle || 'Not specified'}. ` +
        `Spouse Criteria: ${formData.spouse_criteria || 'Not specified'}. ` +
        (formData.build ? `Build: ${formData.build}. ` : '') +
        (formData.physical_fitness ? `Physical Fitness: ${formData.physical_fitness}.` : '');

      console.log('Regenerating embedding with profile text:', profileText);

      // Call OpenAI to generate embedding
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: profileText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error('Failed to generate embedding');
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;

      console.log('✅ Embedding generated, updating database...');

      // Update profile with new embedding
      const table = accountType === 'brother' ? 'brother' : 'sister';
      const { error: embeddingError } = await supabase
        .from(table)
        .update({ profile_embedding: embedding })
        .eq('id', profileId);

      if (embeddingError) {
        console.error('Error updating embedding:', embeddingError);
        // Don't throw - profile was still updated successfully
      } else {
        console.log('✅ Embedding regenerated successfully');
      }
    } catch (error) {
      console.error('Error regenerating embedding:', error);
      // Don't throw - profile update was successful, embedding is just bonus
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={[
                styles.input,
                usernameError ? styles.inputError : null,
              ]}
              value={formData.username}
              onChangeText={handleUsernameChange}
              placeholder="Enter username"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
            {isCheckingUsername && (
              <Text style={styles.hint}>Checking availability...</Text>
            )}
            {usernameError && (
              <Text style={styles.errorText}>{usernameError}</Text>
            )}
            {!usernameError && !isCheckingUsername && formData.username !== originalUsername && formData.username.length >= 3 && (
              <Text style={styles.successText}>✓ Username is available</Text>
            )}
            <Text style={styles.hint}>Letters, numbers, hyphens, and underscores only</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.first_name}
              onChangeText={(text) => setFormData({ ...formData, first_name: text })}
              placeholder="Enter first name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.last_name}
              onChangeText={(text) => setFormData({ ...formData, last_name: text })}
              placeholder="Enter last name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+44 20 1234 5678"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="City, Country"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              value={formData.date_of_birth}
              onChangeText={(text) => setFormData({ ...formData, date_of_birth: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 1995-03-15)</Text>
          </View>
        </View>

        {/* About Me Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deen</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.deen}
              onChangeText={(text) => setFormData({ ...formData, deen: text })}
              placeholder="Describe your religious practice..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Personality</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.personality}
              onChangeText={(text) => setFormData({ ...formData, personality: text })}
              placeholder="Describe your personality..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lifestyle</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.lifestyle}
              onChangeText={(text) => setFormData({ ...formData, lifestyle: text })}
              placeholder="Describe your lifestyle..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marriage Preferences</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Spouse Criteria</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.spouse_criteria}
              onChangeText={(text) => setFormData({ ...formData, spouse_criteria: text })}
              placeholder="What are you looking for in a spouse?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dealbreakers</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.dealbreakers}
              onChangeText={(text) => setFormData({ ...formData, dealbreakers: text })}
              placeholder="What are your dealbreakers?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Brother specific */}
          {accountType === 'brother' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Beard Commitment</Text>
              <TextInput
                style={styles.input}
                value={formData.beard_commitment}
                onChangeText={(text) => setFormData({ ...formData, beard_commitment: text })}
                placeholder="full_sunnah_beard, trimmed_beard, clean_shaven"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}

          {/* Sister specific */}
          {accountType === 'sister' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hijab Commitment</Text>
              <TextInput
                style={styles.input}
                value={formData.hijab_commitment}
                onChangeText={(text) => setFormData({ ...formData, hijab_commitment: text })}
                placeholder="niqab, hijab_abaya, hijab_western_clothing, open_hair"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        </View>

        {/* Wali Information - Sisters Only */}
        {accountType === 'sister' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wali Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Wali Name</Text>
              <TextInput
                style={styles.input}
                value={formData.wali_name}
                onChangeText={(text) => setFormData({ ...formData, wali_name: text })}
                placeholder="Enter wali's name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship</Text>
              <TextInput
                style={styles.input}
                value={formData.wali_relationship}
                onChangeText={(text) => setFormData({ ...formData, wali_relationship: text })}
                placeholder="Father, Brother, Uncle, Grandfather, Other"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Wali Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.wali_phone}
                onChangeText={(text) => setFormData({ ...formData, wali_phone: text })}
                placeholder="+44 20 1234 5678"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Wali Email</Text>
              <TextInput
                style={styles.input}
                value={formData.wali_email}
                onChangeText={(text) => setFormData({ ...formData, wali_email: text })}
                placeholder="wali@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Preferred Contact Method</Text>
              <TextInput
                style={styles.input}
                value={formData.wali_preferred_contact}
                onChangeText={(text) => setFormData({ ...formData, wali_preferred_contact: text })}
                placeholder="Phone, Email, or Both"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        )}

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
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: 20,
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
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    color: '#7B8799',
    marginTop: 4,
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