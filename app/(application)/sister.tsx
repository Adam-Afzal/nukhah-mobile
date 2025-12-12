import SearchablePicker from '@/components/searchablePicker';
import { useSisterApplication } from '@/hooks/useSisterApplicaton';
import { COUNTRIES, ETHNICITIES } from '@/lib/locationData';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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
  birth_day: string;
  birth_month: string;
  birth_year: string;
  
  // Religious
  where_is_allah: string;
  knowledge_source: string;
  aqeedah: string;
  
  // Marital
  marital_status: string;
  divorce_reason: string;
  
  // Physical
  physical_fitness: string;
  
  // Location
  current_location: string;
  preferred_region: string;
  
  // Obedience Questions
  halal_command_response: string;
  jump_command_response: string;
  
  // Social & Wali
  has_social_media: boolean;
  wali_onboard: string;
  
  // Covering
  shariah_covering_description: string;
  personal_covering: string;
  
  // Influencers & Polygyny
  listens_to_hijabi_influencers: boolean;
  open_to_polygyny: boolean;
  ethnicity: string[];
  preferred_ethnicity: string[];
  password: string;
};

export default function SisterApplication() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const { mutate: submitApplication, isPending } = useSisterApplication();
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [preferredEthnicityPickerVisible, setPreferredEthnicityPickerVisible] = useState(false);
  const [ethnicityPickerVisible, setEthnicityPickerVisible] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    birth_day: '',
    birth_month: '',
    birth_year: '',
    where_is_allah: '',
    knowledge_source: '',
    aqeedah: '',
    marital_status: '',
    divorce_reason: '',
    physical_fitness: '',
    current_location: '',
    preferred_region: '',
    halal_command_response: '',
    jump_command_response: '',
    has_social_media: false,
    wali_onboard: '',
    shariah_covering_description: '',
    personal_covering: '',
    listens_to_hijabi_influencers: false,
    open_to_polygyny: false,
    ethnicity: [],
    preferred_ethnicity: [],
    password: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (!formData.current_location.trim()) newErrors.current_location = 'Required';
    if (!formData.preferred_region.trim()) newErrors.preferred_region = 'Required';
    if (!formData.halal_command_response.trim()) newErrors.halal_command_response = 'Required';
    if (!formData.jump_command_response.trim()) newErrors.jump_command_response = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.wali_onboard.trim()) newErrors.wali_onboard = 'Required';
    if (!formData.shariah_covering_description.trim()) {
      newErrors.shariah_covering_description = 'Required';
    }
    if (!formData.personal_covering) newErrors.personal_covering = 'Required';
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
    
    // Date of birth validation
    if (!formData.birth_day.trim()) {
      newErrors.birth_day = 'Required';
    } else if (parseInt(formData.birth_day) < 1 || parseInt(formData.birth_day) > 31) {
      newErrors.birth_day = 'Invalid day';
    }
    
    if (!formData.birth_month.trim()) {
      newErrors.birth_month = 'Required';
    } else if (parseInt(formData.birth_month) < 1 || parseInt(formData.birth_month) > 12) {
      newErrors.birth_month = 'Invalid month';
    }
    
    if (!formData.birth_year.trim()) {
      newErrors.birth_year = 'Required';
    } else if (parseInt(formData.birth_year) < 1924 || parseInt(formData.birth_year) > new Date().getFullYear()) {
      newErrors.birth_year = 'Invalid year';
    }
    
    // Validate age if all fields are filled
    if (formData.birth_day && formData.birth_month && formData.birth_year && 
        !newErrors.birth_day && !newErrors.birth_month && !newErrors.birth_year) {
      const age = calculateAge(formData.birth_day, formData.birth_month, formData.birth_year);
      if (age !== null && age < 18) {
        newErrors.birth_year = 'You must be at least 18 years old';
      } else if (age !== null && age > 100) {
        newErrors.birth_year = 'Please enter a valid date of birth';
      }
    }
    
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
        console.log("submitting...")
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

  const handleSubmit = async () => {
    // Format date as YYYY-MM-DD
    const date_of_birth = `${formData.birth_year}-${formData.birth_month.padStart(2, '0')}-${formData.birth_day.padStart(2, '0')}`;
    
    submitApplication({
      ...formData,
      date_of_birth,
      password: formData.password
    } as any);
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
        {['never_married', 'divorced', 'widowed', 'annulled'].map((status) => (
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

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ethnicity</Text>
        <TouchableOpacity
          style={styles.pickerTrigger}
          onPress={() => setEthnicityPickerVisible(true)}
        >
          <Text style={formData.ethnicity.length > 0 ? styles.pickerTriggerText : styles.pickerPlaceholder}>
            {formData.ethnicity.length > 0 ? formData.ethnicity[0] : 'Select your ethnicity'}
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

      {/* Ethnicity Picker Modal */}
      <SearchablePicker
        visible={ethnicityPickerVisible}
        onClose={() => setEthnicityPickerVisible(false)}
        onSelect={(value) => updateField('ethnicity', [value])}
        items={ethnicityItems}
        title="Select Ethnicity"
        placeholder="Search ethnicity..."
        selectedValue={Array.isArray(formData.ethnicity) ? formData.ethnicity[0] : formData.ethnicity}
      />

      {/* Preferred Ethnicity Picker Modal - Multi-select */}
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

      {/* Halal Command Response */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          If your husband tells you to do something halal and you don't want to do it but you have the ability to do it - what is your response? *
        </Text>
        <TextInput
          style={[styles.textArea, errors.halal_command_response && styles.inputError]}
          placeholder="Your answer..."
          placeholderTextColor="#7B8799"
          value={formData.halal_command_response}
          onChangeText={(text) => {
            setFormData({ ...formData, halal_command_response: text });
            if (errors.halal_command_response) {
              setErrors({ ...errors, halal_command_response: '' });
            }
          }}
          multiline
          numberOfLines={4}
        />
        {errors.halal_command_response && (
          <Text style={styles.errorText}>{errors.halal_command_response}</Text>
        )}
      </View>

      {/* Jump Command Response */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Your husband tells you to jump in the air - what is your response? *
        </Text>
        <TextInput
          style={[styles.textArea, errors.jump_command_response && styles.inputError]}
          placeholder="Your answer..."
          placeholderTextColor="#7B8799"
          value={formData.jump_command_response}
          onChangeText={(text) => {
            setFormData({ ...formData, jump_command_response: text });
            if (errors.jump_command_response) {
              setErrors({ ...errors, jump_command_response: '' });
            }
          }}
          multiline
          numberOfLines={4}
        />
        {errors.jump_command_response && (
          <Text style={styles.errorText}>{errors.jump_command_response}</Text>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Final Questions</Text>
      
      {/* Social Media */}
      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Do you have social media? *</Text>
          <Switch
            value={formData.has_social_media}
            onValueChange={(value) => setFormData({ ...formData, has_social_media: value })}
            trackColor={{ false: '#7B8799', true: '#F2CC66' }}
            thumbColor={formData.has_social_media ? '#F7E099' : '#E7EAF0'}
          />
        </View>
      </View>

      {/* Wali Onboard */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Would you say your wali is onboard with you getting married - would they allow the process to go smoothly? *
        </Text>
        <TextInput
          style={[styles.textArea, errors.wali_onboard && styles.inputError]}
          placeholder="Your answer..."
          placeholderTextColor="#7B8799"
          value={formData.wali_onboard}
          onChangeText={(text) => {
            setFormData({ ...formData, wali_onboard: text });
            if (errors.wali_onboard) setErrors({ ...errors, wali_onboard: '' });
          }}
          multiline
          numberOfLines={3}
        />
        {errors.wali_onboard && <Text style={styles.errorText}>{errors.wali_onboard}</Text>}
      </View>

      {/* Shariah Covering Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Describe the covering of a woman according to the shariah *
        </Text>
        <TextInput
          style={[styles.textArea, errors.shariah_covering_description && styles.inputError]}
          placeholder="Your answer..."
          placeholderTextColor="#7B8799"
          value={formData.shariah_covering_description}
          onChangeText={(text) => {
            setFormData({ ...formData, shariah_covering_description: text });
            if (errors.shariah_covering_description) {
              setErrors({ ...errors, shariah_covering_description: '' });
            }
          }}
          multiline
          numberOfLines={4}
        />
        {errors.shariah_covering_description && (
          <Text style={styles.errorText}>{errors.shariah_covering_description}</Text>
        )}
      </View>

      {/* Personal Covering */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Describe your covering *</Text>
        {[
          { value: 'covering_according_to_shariah', label: 'Covering according to shariah' },
          { value: 'somewhat_covered', label: 'Somewhat covered' },
          { value: 'no_hijab', label: 'No hijab (open hair)' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.radioOption,
              formData.personal_covering === option.value && styles.radioOptionSelected,
            ]}
            onPress={() => {
              setFormData({ ...formData, personal_covering: option.value });
              if (errors.personal_covering) setErrors({ ...errors, personal_covering: '' });
            }}
          >
            <View style={styles.radio}>
              {formData.personal_covering === option.value && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
        {errors.personal_covering && <Text style={styles.errorText}>{errors.personal_covering}</Text>}
      </View>

      {/* Hijabi Influencers */}
      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Do you listen to any "hijabi" influencers? *</Text>
          <Switch
            value={formData.listens_to_hijabi_influencers}
            onValueChange={(value) =>
              setFormData({ ...formData, listens_to_hijabi_influencers: value })
            }
            trackColor={{ false: '#7B8799', true: '#F2CC66' }}
            thumbColor={formData.listens_to_hijabi_influencers ? '#F7E099' : '#E7EAF0'}
          />
        </View>
      </View>

      {/* Polygyny */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Nukhbah is a platform for high value muslims which includes high performing brothers. Are you open to polygyny? *
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.radioText}>Open to polygyny</Text>
          <Switch
            value={formData.open_to_polygyny}
            onValueChange={(value) => setFormData({ ...formData, open_to_polygyny: value })}
            trackColor={{ false: '#7B8799', true: '#F2CC66' }}
            thumbColor={formData.open_to_polygyny ? '#F7E099' : '#E7EAF0'}
          />
        </View>
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
      <Text style={styles.stepTitle}>Basic Information</Text>
      
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
              value={formData.birth_day}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                setFormData({ ...formData, birth_day: cleaned });
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
              value={formData.birth_month}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                setFormData({ ...formData, birth_month: cleaned });
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
              value={formData.birth_year}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
                setFormData({ ...formData, birth_year: cleaned });
                if (errors.birth_year) setErrors({ ...errors, birth_year: '' });
              }}
              keyboardType="number-pad"
              maxLength={4}
            />
            {errors.birth_year && <Text style={styles.errorTextSmall}>{errors.birth_year}</Text>}
          </View>
        </View>
        {formData.birth_day && formData.birth_month && formData.birth_year && 
         !errors.birth_day && !errors.birth_month && !errors.birth_year && (
          <Text style={styles.ageDisplay}>
            {formatDate(formData.birth_day, formData.birth_month, formData.birth_year)} 
            ({calculateAge(formData.birth_day, formData.birth_month, formData.birth_year)} years old)
          </Text>
        )}
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
          <Text style={styles.stepIndicator}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Sister Application</Text>
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
          disabled={isPending}
        >
          <LinearGradient
            colors={['#F2CC66', '#F2CC66']}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {isPending 
                ? 'Submitting...' 
                : currentStep === totalSteps 
                  ? 'Submit Application' 
                  : 'Continue'}
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
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
    color: '#F7E099',
    marginTop: 8,
    fontStyle: 'italic',
  },
});