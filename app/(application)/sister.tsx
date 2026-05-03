import SearchablePicker from '@/components/searchablePicker';
import { useSisterApplication } from '@/hooks/useSisterApplicaton';
import { COUNTRIES } from '@/lib/locationData';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const nationalityItems = COUNTRIES.map(country => ({
  label: country.name,
  value: country.name,
  flag: country.flag,
  subtitle: country.code,
}));

type FormData = {
  applied_by_wali: boolean;
  wali_relationship_to_sister: string;
  first_name: string;
  last_name: string;
  nationality: string;
  email: string;
  phone_number: string;
  password: string;
  date_of_birth: string;
  has_wali: boolean;
  wali_first_name: string;
  wali_last_name: string;
  wali_email: string;
  wali_phone: string;
};

export default function SisterApplication() {
  const router = useRouter();
  const { mutate: submitApplication, isPending } = useSisterApplication();
  const [nationalityPickerVisible, setNationalityPickerVisible] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    applied_by_wali: false,
    wali_relationship_to_sister: '',
    first_name: '',
    last_name: '',
    nationality: '',
    email: '',
    phone_number: '',
    password: '',
    date_of_birth: '',
    has_wali: true,
    wali_first_name: '',
    wali_last_name: '',
    wali_email: '',
    wali_phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.applied_by_wali && !formData.wali_relationship_to_sister.trim()) {
      newErrors.wali_relationship_to_sister = 'Required';
    }
    if (!formData.first_name.trim()) newErrors.first_name = 'Required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Required';
    if (!formData.nationality) newErrors.nationality = 'Required';
    if (!formData.email.trim()) {
      newErrors.email = 'Required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Required';
    if (!formData.date_of_birth.trim()) newErrors.date_of_birth = 'Required';
    if (!formData.password.trim()) {
      newErrors.password = 'Required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Wali validation (only if has_wali is true)
    if (formData.has_wali) {
      if (!formData.wali_first_name.trim()) newErrors.wali_first_name = 'Required';
      if (!formData.wali_last_name.trim()) newErrors.wali_last_name = 'Required';
      if (!formData.wali_email.trim()) {
        newErrors.wali_email = 'Required';
      } else if (!validateEmail(formData.wali_email)) {
        newErrors.wali_email = 'Invalid email';
      }
      if (!formData.wali_phone.trim()) newErrors.wali_phone = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const submissionData = {
        applied_by_wali: formData.applied_by_wali,
        ...(formData.applied_by_wali && { wali_relationship_to_sister: formData.wali_relationship_to_sister }),
        first_name: formData.first_name,
        last_name: formData.last_name,
        nationality: formData.nationality,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        date_of_birth: formData.date_of_birth,
        has_wali: formData.has_wali,
        ...(formData.has_wali && {
          wali_first_name: formData.wali_first_name,
          wali_last_name: formData.wali_last_name,
          wali_email: formData.wali_email,
          wali_phone: formData.wali_phone,
        }),
      };
      submitApplication(submissionData);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <AnimatedPressable onPress={handleBack}>
            <Text style={styles.backButton}>← Back</Text>
          </AnimatedPressable>
        </View>

        {/* Title */}
        <Text style={styles.title}>Sister Application</Text>
        <Text style={styles.subtitle}>
          {formData.applied_by_wali
            ? 'Register a sister as her wali'
            : 'Create your account to get started'}
        </Text>

        {/* Form */}
        <View style={styles.form}>

          {/* Wali applying on behalf toggle */}
          <View style={styles.waliApplyingSection}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.label}>Applying on behalf of a sister</Text>
                <Text style={styles.hint}>
                  {formData.applied_by_wali
                    ? 'You are registering as a wali on behalf of a sister'
                    : 'I am registering for myself'}
                </Text>
              </View>
              <Switch
                value={formData.applied_by_wali}
                onValueChange={(value) => updateField('applied_by_wali', value)}
                trackColor={{ false: '#7B8799', true: '#F2CC66' }}
                thumbColor={formData.applied_by_wali ? '#F7E099' : '#E7EAF0'}
              />
            </View>
          </View>

          <View style={styles.sectionDivider} />

          {formData.applied_by_wali && (
            <>
              <View style={styles.waliApplyingBanner}>
                <Text style={styles.waliApplyingBannerText}>
                  Please fill in the sister's details below. Her account will be created and she can log in using the email and password you set.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Relationship to the Sister *</Text>
                <Text style={styles.hint}>e.g. Father, Brother, Uncle, Grandfather</Text>
                <TextInput
                  style={[styles.input, errors.wali_relationship_to_sister && styles.inputError]}
                  placeholder="Enter your relationship"
                  placeholderTextColor="#7B8799"
                  value={formData.wali_relationship_to_sister}
                  onChangeText={(text) => updateField('wali_relationship_to_sister', text)}
                  autoCapitalize="words"
                />
                {errors.wali_relationship_to_sister && (
                  <Text style={styles.errorText}>{errors.wali_relationship_to_sister}</Text>
                )}
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{formData.applied_by_wali ? "Sister's First Name *" : 'First Name *'}</Text>
            <TextInput
              style={[styles.input, errors.first_name && styles.inputError]}
              placeholder={formData.applied_by_wali ? "Enter her first name" : "Enter your first name"}
              placeholderTextColor="#7B8799"
              value={formData.first_name}
              onChangeText={(text) => updateField('first_name', text)}
              autoCapitalize="words"
            />
            {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{formData.applied_by_wali ? "Sister's Last Name *" : 'Last Name *'}</Text>
            <TextInput
              style={[styles.input, errors.last_name && styles.inputError]}
              placeholder={formData.applied_by_wali ? "Enter her last name" : "Enter your last name"}
              placeholderTextColor="#7B8799"
              value={formData.last_name}
              onChangeText={(text) => updateField('last_name', text)}
              autoCapitalize="words"
            />
            {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{formData.applied_by_wali ? "Sister's Nationality *" : 'Nationality *'}</Text>
            <AnimatedPressable
              style={[styles.pickerTrigger, errors.nationality && styles.inputError]}
              onPress={() => setNationalityPickerVisible(true)}
            >
              <Text style={formData.nationality ? styles.pickerTriggerText : styles.pickerPlaceholder}>
                {formData.nationality ?
                  `${COUNTRIES.find(c => c.name === formData.nationality)?.flag || ''} ${formData.nationality}` :
                  'Select your nationality'}
              </Text>
              <Text style={styles.pickerArrow}>›</Text>
            </AnimatedPressable>
            {errors.nationality && <Text style={styles.errorText}>{errors.nationality}</Text>}
          </View>

          <SearchablePicker
            visible={nationalityPickerVisible}
            onClose={() => setNationalityPickerVisible(false)}
            onSelect={(value) => updateField('nationality', value)}
            items={nationalityItems}
            title="Select Nationality"
            placeholder="Search country..."
            selectedValue={formData.nationality}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{formData.applied_by_wali ? "Sister's Email *" : 'Email *'}</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder={formData.applied_by_wali ? "her.email@example.com" : "your.email@example.com"}
              placeholderTextColor="#7B8799"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{formData.applied_by_wali ? "Sister's Phone Number *" : 'Phone Number *'}</Text>
            <TextInput
              style={[styles.input, errors.phone_number && styles.inputError]}
              placeholder="+1 234 567 8900"
              placeholderTextColor="#7B8799"
              value={formData.phone_number}
              onChangeText={(text) => updateField('phone_number', text)}
              keyboardType="phone-pad"
            />
            {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{formData.applied_by_wali ? "Sister's Date of Birth *" : 'Date of Birth *'}</Text>
            <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
            <TextInput
              style={[styles.input, errors.date_of_birth && styles.inputError]}
              placeholder="1990-01-15"
              placeholderTextColor="#7B8799"
              value={formData.date_of_birth}
              onChangeText={(text) => updateField('date_of_birth', text)}
              keyboardType="default"
            />
            {errors.date_of_birth && <Text style={styles.errorText}>{errors.date_of_birth}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{formData.applied_by_wali ? "Account Password *" : 'Password *'}</Text>
            <Text style={styles.hint}>{formData.applied_by_wali ? "Must be at least 8 characters — share this with the sister" : "Must be at least 8 characters"}</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter your password"
              placeholderTextColor="#7B8799"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              secureTextEntry
              autoCapitalize="none"
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Wali Section */}
          <View style={styles.sectionDivider} />

          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>
                {formData.applied_by_wali ? 'Sister has a wali' : 'I have a wali'}
              </Text>
              <Switch
                value={formData.has_wali}
                onValueChange={(value) => updateField('has_wali', value)}
                trackColor={{ false: '#7B8799', true: '#F2CC66' }}
                thumbColor={formData.has_wali ? '#F7E099' : '#E7EAF0'}
              />
            </View>
            <Text style={styles.hint}>
              {formData.has_wali
                ? formData.applied_by_wali
                  ? "Please provide the sister's wali's contact information below"
                  : "Please provide your wali's contact information below"
                : formData.applied_by_wali
                  ? 'Wali details are optional if the sister does not have one'
                  : 'Wali details are optional if you do not have one'}
            </Text>

            {!formData.has_wali && (
              <View style={styles.noWaliBanner}>
                <Text style={styles.noWaliBannerText}>
                  ⚠️ Speak to your local imam about acquiring a wali if you do not have one. Sisters cannot use Mithaq without a wali. Anyone found using their own details may be subject to a ban.
                </Text>
              </View>
            )}
          </View>

          {formData.has_wali && (
            <View style={styles.waliSection}>
              <Text style={styles.sectionTitle}>
                {formData.applied_by_wali ? "Sister's Wali Information" : 'Wali Information'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {formData.applied_by_wali ? "Sister's Wali First Name *" : 'Wali First Name *'}
                </Text>
                <TextInput
                  style={[styles.input, errors.wali_first_name && styles.inputError]}
                  placeholder={formData.applied_by_wali ? "Enter her wali's first name" : "Enter wali's first name"}
                  placeholderTextColor="#7B8799"
                  value={formData.wali_first_name}
                  onChangeText={(text) => updateField('wali_first_name', text)}
                  autoCapitalize="words"
                />
                {errors.wali_first_name && <Text style={styles.errorText}>{errors.wali_first_name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {formData.applied_by_wali ? "Sister's Wali Last Name *" : 'Wali Last Name *'}
                </Text>
                <TextInput
                  style={[styles.input, errors.wali_last_name && styles.inputError]}
                  placeholder={formData.applied_by_wali ? "Enter her wali's last name" : "Enter wali's last name"}
                  placeholderTextColor="#7B8799"
                  value={formData.wali_last_name}
                  onChangeText={(text) => updateField('wali_last_name', text)}
                  autoCapitalize="words"
                />
                {errors.wali_last_name && <Text style={styles.errorText}>{errors.wali_last_name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {formData.applied_by_wali ? "Sister's Wali Email *" : 'Wali Email *'}
                </Text>
                <TextInput
                  style={[styles.input, errors.wali_email && styles.inputError]}
                  placeholder="wali.email@example.com"
                  placeholderTextColor="#7B8799"
                  value={formData.wali_email}
                  onChangeText={(text) => updateField('wali_email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.wali_email && <Text style={styles.errorText}>{errors.wali_email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {formData.applied_by_wali ? "Sister's Wali Phone Number *" : 'Wali Phone Number *'}
                </Text>
                <TextInput
                  style={[styles.input, errors.wali_phone && styles.inputError]}
                  placeholder="+1 234 567 8900"
                  placeholderTextColor="#7B8799"
                  value={formData.wali_phone}
                  onChangeText={(text) => updateField('wali_phone', text)}
                  keyboardType="phone-pad"
                />
                {errors.wali_phone && <Text style={styles.errorText}>{errors.wali_phone}</Text>}
              </View>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <AnimatedPressable
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isPending}
        >
          <Text style={styles.submitButtonText}>
            {isPending ? 'Submitting...' : 'Submit Application'}
          </Text>
        </AnimatedPressable>

        {/* Privacy Note */}
        <Text style={styles.privacyNote}>
          Your information is encrypted and kept confidential
        </Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#0A0E1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#C9A961',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 32,
    color: '#C9A961',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#E8D7B5',
    marginBottom: 32,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#E8D7B5',
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#1A1F2E',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: '#E03A3A',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#E03A3A',
  },
  pickerTrigger: {
    backgroundColor: '#1A1F2E',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTriggerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  pickerPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#7B8799',
    flex: 1,
  },
  pickerArrow: {
    fontSize: 24,
    color: '#7B8799',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noWaliBanner: {
    marginTop: 12,
    backgroundColor: 'rgba(224, 58, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(224, 58, 58, 0.4)',
    borderRadius: 8,
    padding: 12,
  },
  noWaliBannerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#FF6B6B',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(242, 204, 102, 0.3)',
    marginVertical: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#C9A961',
    marginBottom: 16,
  },
  waliSection: {
    gap: 16,
    backgroundColor: 'rgba(242, 204, 102, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 204, 102, 0.2)',
  },
  waliApplyingSection: {
    backgroundColor: 'rgba(242, 204, 102, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 204, 102, 0.2)',
  },
  waliApplyingBanner: {
    backgroundColor: 'rgba(242, 204, 102, 0.12)',
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#F2CC66',
  },
  waliApplyingBannerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#F7E099',
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 32,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#C9A961',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#0A0E1A',
  },
  privacyNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
    textAlign: 'center',
    marginTop: 16,
  },
});
