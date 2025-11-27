import SearchablePicker from '@/components/searchablePicker';
import { useBrotherApplication } from '@/hooks/useBrotherApplication';
import { COUNTRIES, ETHNICITIES } from '@/lib/locationData';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

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




const { width, height } = Dimensions.get('window');

type FormData = {
  // Contact
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  
  // Religious
  where_is_allah: string;
  knowledge_source: string;
  aqeedah: string;
  
  // Marital
  marital_status: string;
  divorce_reason: string;
  
  // Physical & Goals
  physical_fitness: string;
  wives_goal: string;
  
  // Location
  current_location: string;
  preferred_region: string;
  
  // Financial
  annual_income: string;
  
  // Polygyny Knowledge
  polygyny_justice_knowledge: string;
  ethnicity: string;
  preferred_ethnicity: string[]; // Add this as an array

  password: string;
};

export default function BrotherApplication() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const { mutate: submitApplication, isPending } = useBrotherApplication();
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [ethnicityPickerVisible, setEthnicityPickerVisible] = useState(false);
  const [preferredEthnicityPickerVisible, setPreferredEthnicityPickerVisible] = useState(false);
  const totalSteps = 5;

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    where_is_allah: '',
    knowledge_source: '',
    aqeedah: '',
    marital_status: '',
    divorce_reason: '',
    physical_fitness: '',
    wives_goal: '',
    current_location: '',
    preferred_region: '',
    annual_income: '',
    polygyny_justice_knowledge: '',
    password: '',
    ethnicity: '',
    preferred_ethnicity: [] // Initialize as empty array
  });

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.where_is_allah.trim()) newErrors.where_is_allah = 'Required';
    if (!formData.knowledge_source.trim()) newErrors.knowledge_source = 'Required';
    if (!formData.aqeedah.trim()) newErrors.aqeedah = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.marital_status) newErrors.marital_status = 'Required';
    if (!formData.physical_fitness.trim()) newErrors.physical_fitness = 'Required';
    if (!formData.wives_goal) newErrors.wives_goal = 'Required';
    if (!formData.current_location.trim()) newErrors.current_location = 'Required';
    if (!formData.preferred_region.trim()) newErrors.preferred_region = 'Required';
    if (!formData.annual_income.trim()) newErrors.annual_income = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.polygyny_justice_knowledge.trim()) {
      newErrors.polygyny_justice_knowledge = 'Required';
    }
    if (!formData.divorce_reason.trim()) {
      newErrors.divorce_reason = 'Required (Type N/A if not applicable)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'Required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Required';
    if (!formData.email.trim()) {
      newErrors.email = 'Required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.password.trim()) {
      newErrors.password = 'Required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
        case 5:
            isValid = validateStep5();
    }
    
    if (isValid) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        console.log("submitting application...")
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    } else {
      router.back();
    }
  };

//   const handleSubmit = async () => {
//     try {
//       // TODO: Submit to Supabase
//     //   console.log('Submitting:', formData);
      
//     //   Alert.alert(
//     //     'Application Submitted!',
//     //     'Your application has been submitted for review. We will contact you via email.',
//     //     [
//     //       {
//     //         text: 'OK',
//     //         onPress: () => router.replace('/application-pending'),
//     //       },
//     //     ]
//     //   );
//     } catch (error) {
//       Alert.alert('Error', 'Failed to submit application. Please try again.');
//     }
//   };


const handleSubmit = async () => {
    submitApplication({
        ...formData,
        password: formData.password// Don't forget password!
      });
  };

 
  const renderStep1 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Religious Questions</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Where is Allah? *</Text>
        <TextInput
          style={[styles.textArea, errors.where_is_allah && styles.inputError]}
          placeholder="Your answer..."
          placeholderTextColor="#7B8799"
          value={formData.where_is_allah}
          onChangeText={(text) => {
            setFormData({ ...formData, where_is_allah: text });
            if (errors.where_is_allah) setErrors({ ...errors, where_is_allah: '' });
          }}
          multiline
          numberOfLines={4}
        />
        {errors.where_is_allah && <Text style={styles.errorText}>{errors.where_is_allah}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Where do you seek knowledge from? *</Text>
        <TextInput
          style={[styles.textArea, errors.knowledge_source && styles.inputError]}
          placeholder="Your answer..."
          placeholderTextColor="#7B8799"
          value={formData.knowledge_source}
          onChangeText={(text) => {
            setFormData({ ...formData, knowledge_source: text });
            if (errors.knowledge_source) setErrors({ ...errors, knowledge_source: '' });
          }}
          multiline
          numberOfLines={4}
        />
        {errors.knowledge_source && <Text style={styles.errorText}>{errors.knowledge_source}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>What is your aqeedah? *</Text>
        <TextInput
          style={[styles.textArea, errors.aqeedah && styles.inputError]}
          placeholder="Your answer..."
          placeholderTextColor="#7B8799"
          value={formData.aqeedah}
          onChangeText={(text) => {
            setFormData({ ...formData, aqeedah: text });
            if (errors.aqeedah) setErrors({ ...errors, aqeedah: '' });
          }}
          multiline
          numberOfLines={4}
        />
        {errors.aqeedah && <Text style={styles.errorText}>{errors.aqeedah}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Personal Details</Text>
      
      {/* Marital Status */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>What is your current marital status? *</Text>
        {['married', 'never_married', 'divorced', 'widowed', 'annulled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.radioOption,
              formData.marital_status === status && styles.radioOptionSelected,
            ]}
            onPress={() => {
              setFormData({ ...formData, marital_status: status });
              if (errors.marital_status) setErrors({ ...errors, marital_status: '' });
            }}
          >
            <View style={styles.radio}>
              {formData.marital_status === status && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>
              {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
        {errors.marital_status && <Text style={styles.errorText}>{errors.marital_status}</Text>}
      </View>

      {/* Physical Fitness */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Describe your physical fitness *</Text>
        <TextInput
          style={[styles.textArea, errors.physical_fitness && styles.inputError]}
          placeholder="Your answer..."
          placeholderTextColor="#7B8799"
          value={formData.physical_fitness}
          onChangeText={(text) => {
            setFormData({ ...formData, physical_fitness: text });
            if (errors.physical_fitness) setErrors({ ...errors, physical_fitness: '' });
          }}
          multiline
          numberOfLines={3}
        />
        {errors.physical_fitness && <Text style={styles.errorText}>{errors.physical_fitness}</Text>}
      </View>

      {/* Wives Goal */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Is your goal 1, 2, 3, or 4 wives? *</Text>
        <View style={styles.radioRow}>
          {['1', '2', '3', '4'].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.radioOptionInline,
                formData.wives_goal === num && styles.radioOptionSelected,
              ]}
              onPress={() => {
                setFormData({ ...formData, wives_goal: num });
                if (errors.wives_goal) setErrors({ ...errors, wives_goal: '' });
              }}
            >
              <View style={styles.radio}>
                {formData.wives_goal === num && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.wives_goal && <Text style={styles.errorText}>{errors.wives_goal}</Text>}
      </View>

      {/* Location */}
      <View style={styles.inputGroup}>
  <Text style={styles.label}>Where do you live? *</Text>
  <TouchableOpacity
    style={styles.pickerTrigger}
    onPress={() => setLocationPickerVisible(true)}
  >
    <Text style={formData.current_location ? styles.pickerTriggerText : styles.pickerPlaceholder}>
      {formData.current_location || 'Select your location'}
    </Text>
    <Text style={styles.pickerArrow}>›</Text>
  </TouchableOpacity>
</View>
{/* Location Picker Modal */}
<SearchablePicker
     visible={locationPickerVisible}
     onClose={() => setLocationPickerVisible(false)}
     onSelect={(value) => updateField('current_location', value)}
     items={locationItems}
     title="Select Location"
     placeholder="Search city or country..."
     selectedValue={formData.current_location}
   />

<View style={styles.inputGroup}>
  <Text style={styles.label}>Ethnicity</Text>
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

 {/* Preferred Ethnicity - Multi-select */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Preferred Ethnicity</Text>
  <Text style={styles.hint}>Select "Any" or choose specific ethnicities</Text>
  
  {/* "Any" option as a separate button */}
  <TouchableOpacity
    style={[
      styles.radioOption,
      formData.preferred_ethnicity.includes('Any') && styles.radioOptionSelected,
    ]}
    onPress={() => {
      // If "Any" is selected, clear all others and set only "Any"
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

  {/* Only show the picker if "Any" is NOT selected */}
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
    <Text style={styles.hint}>✓ Open to all ethnicities</Text>
  )}
</View>

 
   {/* Ethnicity Picker Modal */}
   <SearchablePicker
     visible={ethnicityPickerVisible}
     onClose={() => setEthnicityPickerVisible(false)}
     onSelect={(value) => updateField('ethnicity', value)}
     items={ethnicityItems}
     title="Select Ethnicity"
     placeholder="Search ethnicity..."
     selectedValue={formData.ethnicity}
   />

      {/* Preferred Region */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>What region are you thinking of looking in? *</Text>
        <Text style={styles.hint}>e.g. Worldwide, GCC Countries</Text>
        <TextInput
          style={[styles.input, errors.preferred_region && styles.inputError]}
          placeholder="Region"
          placeholderTextColor="#7B8799"
          value={formData.preferred_region}
          onChangeText={(text) => {
            setFormData({ ...formData, preferred_region: text });
            if (errors.preferred_region) setErrors({ ...errors, preferred_region: '' });
          }}
        />
        {errors.preferred_region && <Text style={styles.errorText}>{errors.preferred_region}</Text>}
      </View>

      {/* Income */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>What is your income per year roughly? *</Text>
        <Text style={styles.hint}>In your respective currency</Text>
        <TextInput
          style={[styles.input, errors.annual_income && styles.inputError]}
          placeholder="e.g. $100,000 or £75,000"
          placeholderTextColor="#7B8799"
          value={formData.annual_income}
          onChangeText={(text) => {
            setFormData({ ...formData, annual_income: text });
            if (errors.annual_income) setErrors({ ...errors, annual_income: '' });
          }}
        />
        {errors.annual_income && <Text style={styles.errorText}>{errors.annual_income}</Text>}
      </View>

      {/* Preferred Ethnicity Picker Modal - Multi-select */}
<SearchablePicker
  visible={preferredEthnicityPickerVisible}
  onClose={() => setPreferredEthnicityPickerVisible(false)}
  onSelect={(value) => {
    // Toggle selection for multi-select
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
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Entering the ocean</Text>
      
      {/* Polygyny Justice Knowledge */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Do you know what the state of a man will be on the day of judgement if he has more than one wife and he is unjust? *
        </Text>
        <TextInput
          style={[styles.textArea, errors.polygyny_justice_knowledge && styles.inputError]}
          placeholder="Your answer..."
          placeholderTextColor="#7B8799"
          value={formData.polygyny_justice_knowledge}
          onChangeText={(text) => {
            setFormData({ ...formData, polygyny_justice_knowledge: text });
            if (errors.polygyny_justice_knowledge) {
              setErrors({ ...errors, polygyny_justice_knowledge: '' });
            }
          }}
          multiline
          numberOfLines={5}
        />
        {errors.polygyny_justice_knowledge && (
          <Text style={styles.errorText}>{errors.polygyny_justice_knowledge}</Text>
        )}
      </View>

      {/* Divorce Reason */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          If you are divorced, what was the reason the divorce took place? *
        </Text>
        <Text style={styles.hint}>Simple type N/A if not applicable</Text>
        <TextInput
          style={[styles.textArea, errors.divorce_reason && styles.inputError]}
          placeholder="Type N/A if not applicable"
          placeholderTextColor="#7B8799"
          value={formData.divorce_reason}
          onChangeText={(text) => {
            setFormData({ ...formData, divorce_reason: text });
            if (errors.divorce_reason) setErrors({ ...errors, divorce_reason: '' });
          }}
          multiline
          numberOfLines={4}
        />
        {errors.divorce_reason && <Text style={styles.errorText}>{errors.divorce_reason}</Text>}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Final Questions</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={[styles.input, errors.first_name && styles.inputError]}
          placeholder="Enter your first name"
          placeholderTextColor="#7B8799"
          value={formData.first_name}
          onChangeText={(text) => {
            setFormData({ ...formData, first_name: text });
            if (errors.first_name) setErrors({ ...errors, first_name: '' });
          }}
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
          onChangeText={(text) => {
            setFormData({ ...formData, last_name: text });
            if (errors.last_name) setErrors({ ...errors, last_name: '' });
          }}
          autoCapitalize="words"
        />
        {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="your.email@example.com"
          placeholderTextColor="#7B8799"
          value={formData.email}
          onChangeText={(text) => {
            setFormData({ ...formData, email: text });
            if (errors.email) setErrors({ ...errors, email: '' });
          }}
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
          onChangeText={(text) => {
            setFormData({ ...formData, phone_number: text });
            if (errors.phone_number) setErrors({ ...errors, phone_number: '' });
          }}
          keyboardType="phone-pad"
        />
        {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number}</Text>}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Create Your Password</Text>
      <Text style={styles.stepDescription}>
        You'll use this to log in and check your application status
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password *</Text>
        <Text style={styles.hint}>Must be at least 8 characters</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Enter your password"
          placeholderTextColor="#7B8799"
          value={formData.password}
          onChangeText={(text) => {
            setFormData({ ...formData, password: text });
            if (errors.password) setErrors({ ...errors, password: '' });
          }}
          secureTextEntry
          autoCapitalize="none"
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>
  
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>📱 Important</Text>
        <Text style={styles.infoBoxText}>
          After submitting, you can log in with your email and this password to check your application status.
        </Text>
      </View>
    </View>
  );


  return (
    <LinearGradient
    colors={['#070A12', '#1E2A3B', 'rgba(242, 204, 102, 0.3)']}
    start={{ x: 0, y: 0 }}
    end={{ x: 0.5, y: 1 }}
    locations={[0.0058, 0.4534, 0.9011]}
    style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.stepIndicator}>
              Step {currentStep} of {totalSteps}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Brother Application</Text>
          <Text style={styles.subtitle}>
  {currentStep === 1 && 'Tell us about your religious foundation'}
  {currentStep === 2 && 'Share your personal details'}
  {currentStep === 3 && 'Do you know these important things?'}
  {currentStep === 4 && 'Almost done! We just need your contact information'}
  {currentStep === 5 && 'Create your password to complete registration'}
</Text>


          {/* Steps */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {/* Navigation Buttons */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F2CC66', '#F2CC66']}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === totalSteps ? 'Submit Application' : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Privacy Note */}
          <Text style={styles.privacyNote}>
            Your information is encrypted and kept confidential
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

  

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  stepIndicator: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#F7E099',
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
  stepTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#F2CC66',
    marginBottom: 8,
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
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#E03A3A',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
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
  nextButton: {
    marginTop: 32,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
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

  stepDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7B8799',
    marginTop: 4,
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: 'rgba(242, 204, 102, 0.1)',
    borderWidth: 1,
    borderColor: '#F2CC66',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  infoBoxTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#F2CC66',
    marginBottom: 8,
  },
  infoBoxText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#F7E099',
    lineHeight: 20,
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