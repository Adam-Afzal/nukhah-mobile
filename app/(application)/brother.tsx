import SearchablePicker from '@/components/searchablePicker';
import { useBrotherApplication } from '@/hooks/useBrotherApplication';
import { COUNTRIES } from '@/lib/locationData';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

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
};

export default function BrotherApplication() {
  const router = useRouter();
  const { mutate: submitApplication, isPending } = useBrotherApplication();
  const [nationalityPickerVisible, setNationalityPickerVisible] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    nationality: '',
    email: '',
    phone_number: '',
    password: '',
    date_of_birth: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof FormData, value: string) => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      submitApplication(formData);
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
          <Text style={styles.title}>Brother Application</Text>
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
