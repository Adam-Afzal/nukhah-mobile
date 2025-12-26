// app/(onboarding)/references.tsx
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { useQueryClient } from '@tanstack/react-query';
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

interface Reference {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

export default function ReferencesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountType, setAccountType] = useState<'brother' | 'sister' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMasjidAffiliated, setIsMasjidAffiliated] = useState(false);
  const [masjidName, setMasjidName] = useState('');
  const [imamName, setImamName] = useState('');
  
  const [reference, setReference] = useState<Reference>({
    name: '',
    relationship: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        router.back();
        return;
      }

      // Check if brother or sister
      const { data: brotherData } = await supabase
        .from('brother')
        .select('id, is_masjid_affiliated, masjid_id')
        .eq('user_id', user.id)
        .single();

      if (brotherData) {
        setAccountType('brother');
        setUserId(brotherData.id);
        setIsMasjidAffiliated(brotherData.is_masjid_affiliated || false);
        
        // Load masjid details if affiliated
        if (brotherData.masjid_id) {
          await loadMasjidDetails(brotherData.masjid_id);
        }
        
        setIsLoading(false);
        return;
      }

      const { data: sisterData } = await supabase
        .from('sister')
        .select('id, is_masjid_affiliated, masjid_id')
        .eq('user_id', user.id)
        .single();

      if (sisterData) {
        setAccountType('sister');
        setUserId(sisterData.id);
        setIsMasjidAffiliated(sisterData.is_masjid_affiliated || false);
        
        // Load masjid details if affiliated
        if (sisterData.masjid_id) {
          await loadMasjidDetails(sisterData.masjid_id);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user information');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMasjidDetails = async (masjidId: string) => {
    try {
      const { data, error } = await supabase
        .from('masjid')
        .select(`
          name,
          imam:imam_id (
            name
          )
        `)
        .eq('id', masjidId)
        .single();
  
      if (error) throw error;
  
      if (data) {
        setMasjidName(data.name);
        
        // Handle Supabase returning imam as an array
        const imamData = Array.isArray(data.imam) ? data.imam[0] : data.imam;
        setImamName(imamData?.name || 'No imam assigned');
      }
    } catch (error) {
      console.error('Error loading masjid details:', error);
    }
  };
  
  const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendSMSVerification = async (phone: string, name: string, code: string) => {
    try {
      // Get user's full name for the SMS
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from(accountType!)
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();

      const userName = profile 
        ? `${profile.first_name} ${profile.last_name}` 
        : 'A Nukhbah user';

      // Call Supabase Edge Function to send SMS
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: phone,
          message: `Nukhbah: ${userName} has listed you as a character reference. Reply with code ${code} to verify. Valid for 48 hours.`,
        },
      });

      if (error) {
        console.error('SMS send error:', error);
        return false;
      }

      console.log('✅ SMS sent successfully:', data);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  };

  const validateReference = (): boolean => {
    if (!reference.name.trim()) {
      Alert.alert('Validation Error', 'Reference name is required');
      return false;
    }

    if (!reference.relationship) {
      Alert.alert('Validation Error', 'Please select a relationship');
      return false;
    }

    if (!reference.phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return false;
    }

    // Basic phone validation (you may want more sophisticated validation)
    const phoneRegex = /^\+?[\d\s-()]+$/;
    if (!phoneRegex.test(reference.phone)) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateReference()) return;

    if (!accountType || !userId) {
      Alert.alert('Error', 'Account information not found');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate verification code
      const verificationCode = generateVerificationCode();
      const codeExpiresAt = new Date();
      codeExpiresAt.setHours(codeExpiresAt.getHours() + 48); // 48 hour expiry

      // Save reference to database
      const { error: referenceError } = await supabase
        .from('reference')
        .insert({
          user_id: userId,
          user_type: accountType,
          reference_name: reference.name.trim(),
          reference_relationship: reference.relationship,
          reference_phone: reference.phone.trim(),
          reference_email: reference.email.trim() || null,
          verification_status: 'pending',
          verification_code: verificationCode,
          code_expires_at: codeExpiresAt.toISOString(),
        });

      if (referenceError) throw referenceError;

      // 🔥 Invalidate userStatus cache so it refreshes
      queryClient.invalidateQueries({ queryKey: ['userStatus'] });

      // Send SMS verification
      const smsSent = await sendSMSVerification(
        reference.phone,
        reference.name,
        verificationCode
      );

      if (smsSent) {
        Alert.alert(
          'Verification Code Sent',
          `A verification code has been sent to ${reference.phone}. Your reference should receive it shortly.`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)')
            }
          ]
        );
      } else {
        // Even if SMS fails, continue (admin can manually verify)
        Alert.alert(
          'Reference Saved',
          'Your reference has been saved. Verification will be completed shortly.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)')
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error submitting reference:', error);
      Alert.alert('Error', error.message || 'Failed to submit reference');
    } finally {
      setIsSubmitting(false);
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
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Character Reference</Text>
          {isMasjidAffiliated ? (
            <Text style={styles.subtitle}>
              Your imam will verify your masjid membership. Please provide 1 additional reference:
            </Text>
          ) : (
            <Text style={styles.subtitle}>
              Please provide at least 1 character reference who can vouch for you:
            </Text>
          )}
        </View>

        {/* Imam Reference (if masjid-affiliated) */}
        {isMasjidAffiliated && (
          <View style={styles.imamReferenceCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>🕌 Imam Reference</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Auto-included</Text>
              </View>
            </View>
            <View style={styles.imamDetails}>
              <Text style={styles.imamName}>{imamName}</Text>
              <Text style={styles.masjidNameText}>{masjidName}</Text>
              <Text style={styles.pendingText}>
                ⏳ Pending imam verification
              </Text>
            </View>
          </View>
        )}

        {/* User's Reference */}
        <View style={styles.referenceCard}>
          <Text style={styles.cardTitle}>Your Reference</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Uncle Yusuf Ahmed"
              placeholderTextColor="#9CA3AF"
              value={reference.name}
              onChangeText={(text) => setReference({ ...reference, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relationship *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={reference.relationship}
                onValueChange={(value) => setReference({ ...reference, relationship: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select relationship..." value="" />
                <Picker.Item label="Family Member" value="family" />
                <Picker.Item label="Friend" value="friend" />
                <Picker.Item label="Colleague" value="colleague" />
                <Picker.Item label="Community Member" value="community_member" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+44 20 1234 5678"
              placeholderTextColor="#9CA3AF"
              value={reference.phone}
              onChangeText={(text) => setReference({ ...reference, phone: text })}
              keyboardType="phone-pad"
            />
            <Text style={styles.hint}>
              They will receive an SMS with a verification code
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="reference@email.com"
              placeholderTextColor="#9CA3AF"
              value={reference.email}
              onChangeText={(text) => setReference({ ...reference, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How Verification Works</Text>
            <Text style={styles.infoText}>
              1. Your reference receives an SMS with a 6-digit code{'\n'}
              2. They reply with the code to verify{'\n'}
              3. You get a "Reference Verified" badge on your profile
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Sending...' : 'Send Verification Code'}
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
    paddingTop: 60,
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
  imamReferenceCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F2CC66',
  },
  referenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    lineHeight: 27,
    color: '#070A12',
    marginBottom: 16,
  },
  statusBadge: {
    backgroundColor: '#F2CC66',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 13,
    color: '#070A12',
    fontStyle: 'italic',
  },
  imamDetails: {
    gap: 4,
  },
  imamName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 19,
    color: '#070A12',
  },
  masjidNameText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#7B8799',
  },
  pendingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 16,
    color: '#F2994A',
    marginTop: 8,
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
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    color: '#7B8799',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 150,
  },
  infoBox: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#D0DFFF',
  },
  infoIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 17,
    color: '#070A12',
    marginBottom: 4,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#4A5568',
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
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 19,
    color: '#070A12',
    fontStyle: 'italic',
  },
});