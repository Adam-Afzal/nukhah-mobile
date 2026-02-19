import SearchablePicker from '@/components/searchablePicker';
import { useSisterApplication } from '@/hooks/useSisterApplicaton';
import { COUNTRIES } from '@/lib/locationData';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
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
    <LinearGradient
      colors={['#070A12', '#1E2A3B', 'rgba(242, 204, 102, 0.3)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      locations={[-0.0077, 0.4895, 0.9867]}
      style={styles.container}
    >
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
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Sister Application</Text>
        <Text style={styles.subtitle}>
          Create your account to get started
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={[styles.input, errors.first_name && styles.inputError]}
              placeholder="Enter your first name"
              placeholderTextColor="#7B8799"
              value={formData.first_name}
              onChangeText={(text) => updateField('first_name', text)}
              autoCapitalize="words"
            />
            {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={[styles.input, errors.last_name && styles.inputError]}
              placeholder="Enter your last name"
              placeholderTextColor="#7B8799"
              value={formData.last_name}
              onChangeText={(text) => updateField('last_name', text)}
              autoCapitalize="words"
            />
            {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nationality *</Text>
            <TouchableOpacity
              style={[styles.pickerTrigger, errors.nationality && styles.inputError]}
              onPress={() => setNationalityPickerVisible(true)}
            >
              <Text style={formData.nationality ? styles.pickerTriggerText : styles.pickerPlaceholder}>
                {formData.nationality ?
                  `${COUNTRIES.find(c => c.name === formData.nationality)?.flag || ''} ${formData.nationality}` :
                  'Select your nationality'}
              </Text>
              <Text style={styles.pickerArrow}>›</Text>
            </TouchableOpacity>
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
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="your.email@example.com"
              placeholderTextColor="#7B8799"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
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
            <Text style={styles.label}>Date of Birth *</Text>
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
            <Text style={styles.label}>Password *</Text>
            <Text style={styles.hint}>Must be at least 8 characters</Text>
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
              <Text style={styles.label}>I have a wali</Text>
              <Switch
                value={formData.has_wali}
                onValueChange={(value) => updateField('has_wali', value)}
                trackColor={{ false: '#7B8799', true: '#F2CC66' }}
                thumbColor={formData.has_wali ? '#F7E099' : '#E7EAF0'}
              />
            </View>
            <Text style={styles.hint}>
              {formData.has_wali
                ? 'Please provide your wali\'s contact information below'
                : 'Wali details are optional if you do not have one'}
            </Text>
          </View>

          {formData.has_wali && (
            <View style={styles.waliSection}>
              <Text style={styles.sectionTitle}>Wali Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Wali First Name *</Text>
                <TextInput
                  style={[styles.input, errors.wali_first_name && styles.inputError]}
                  placeholder="Enter wali's first name"
                  placeholderTextColor="#7B8799"
                  value={formData.wali_first_name}
                  onChangeText={(text) => updateField('wali_first_name', text)}
                  autoCapitalize="words"
                />
                {errors.wali_first_name && <Text style={styles.errorText}>{errors.wali_first_name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Wali Last Name *</Text>
                <TextInput
                  style={[styles.input, errors.wali_last_name && styles.inputError]}
                  placeholder="Enter wali's last name"
                  placeholderTextColor="#7B8799"
                  value={formData.wali_last_name}
                  onChangeText={(text) => updateField('wali_last_name', text)}
                  autoCapitalize="words"
                />
                {errors.wali_last_name && <Text style={styles.errorText}>{errors.wali_last_name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Wali Email *</Text>
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
                <Text style={styles.label}>Wali Phone Number *</Text>
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
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={isPending}
        >
          <LinearGradient
            colors={['#F2CC66', '#F2CC66']}
            style={styles.submitButtonGradient}
          >
            <Text style={styles.submitButtonText}>
              {isPending ? 'Submitting...' : 'Submit Application'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Privacy Note */}
        <Text style={styles.privacyNote}>
          Your information is encrypted and kept confidential
        </Text>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
    color: '#F2CC66',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 32,
    color: '#F2CC66',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#F7E099',
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
    color: '#F7E099',
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#E7EAF0',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(242, 204, 102, 0.3)',
    marginVertical: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#F2CC66',
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
  submitButton: {
    marginTop: 32,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#070A12',
  },
  privacyNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
    textAlign: 'center',
    marginTop: 16,
  },
});
