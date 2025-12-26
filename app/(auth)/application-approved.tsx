// app/(auth)/application-approved.tsx
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ApplicationApproved() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState(false);

  useEffect(() => {
    checkTestingMode();
  }, []);

  const checkTestingMode = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'testing_mode')
        .single();

      if (error) {
        console.error('Error fetching testing mode:', error);
        return;
      }

      setIsTestingMode(data?.value === 'true');
    } catch (error) {
      console.error('Error checking testing mode:', error);
    }
  };

  const handleGetStarted = async () => {
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User session not found. Please log in again.');
        setIsProcessing(false);
        return;
      }

      // Check if testing mode is enabled
      if (isTestingMode) {
        console.log('Testing mode enabled - skipping payment');
        
        // Create subscriber record to mark as paid
        const { error: subscriberError } = await supabase
          .from('subscribers')
          .upsert({
            user_id: user.id,
            email: user.email,
            subscribed: true,
          }, {
            onConflict: 'user_id'
          });

        if (subscriberError) {
          console.error('Error creating subscriber record:', subscriberError);
          Alert.alert('Error', 'Failed to process. Please try again.');
          setIsProcessing(false);
          return;
        }

        console.log('Subscriber record created - going to profile setup');
        
        // Go directly to profile setup
        router.replace('/(onboarding)/profile-setup');
      } else {
        // Testing mode is OFF - go to payment screen
        console.log('Testing mode disabled - going to payment');
        router.replace('/(auth)/payment');
      }
    } catch (error) {
      console.error('Error in handleGetStarted:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Logout Button - Fixed at top right */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Top gradient section */}
      <LinearGradient
        colors={['#070A12', '#1E2A3B', 'rgba(242, 204, 102, 0.3)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topGradient}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <View style={styles.checkmark} />
          </View>
        </View>

        {/* Welcome Text */}
        <Text style={styles.welcomeText}>Welcome!</Text>
        <Text style={styles.approvedText}>Your application has been approved</Text>
      </LinearGradient>

      {/* Bottom white section */}
      <View style={styles.bottomSection}>
        {/* Title */}
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Let's set up your profile to start connecting</Text>

        {/* Testing Mode Badge */}
        {isTestingMode && (
          <View style={styles.testingBadge}>
            <Text style={styles.testingBadgeText}>🧪 Testing Mode: Payment Skipped</Text>
          </View>
        )}

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {/* Step 1 */}
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, styles.stepNumberActive]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                {isTestingMode ? 'Choose your username' : 'Claim your membership'}
              </Text>
              <Text style={styles.stepDescription}>
                {isTestingMode 
                  ? 'Pick a unique username and set up your profile'
                  : 'Officially become a member of the community'
                }
              </Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          {/* Step 2 */}
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Tell us about yourself</Text>
              <Text style={styles.stepDescription}>Share your personality and values</Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          {/* Step 3 */}
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Describe your ideal spouse</Text>
              <Text style={styles.stepDescription}>What are you looking for?</Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          {/* Step 4 */}
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Review & Submit</Text>
              <Text style={styles.stepDescription}>Finalize your profile</Text>
            </View>
          </View>

          {/* Time estimate */}
          <View style={styles.timeEstimate}>
            <Text style={styles.timeText}>⏱️ Estimated time: 5-10 minutes</Text>
          </View>

          {/* Get Started Button */}
          <TouchableOpacity 
            style={[styles.getStartedButton, isProcessing && styles.getStartedButtonDisabled]} 
            onPress={handleGetStarted}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#F2CC66" />
            ) : (
              <Text style={styles.getStartedText}>
                {isTestingMode ? 'Create Profile →' : 'Get Started →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },
  contentContainer: {
    flexGrow: 1,
  },
  logoutButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  topGradient: {
    height: 412,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#17803A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  checkmark: {
    width: 24,
    height: 12,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    marginTop: -8,
  },
  welcomeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    lineHeight: 44,
    color: '#F2CC66',
    textAlign: 'center',
    marginBottom: 8,
  },
  approvedText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 19,
    color: '#F7E099',
    textAlign: 'center',
    marginBottom: 16,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderBottomWidth: 0,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    lineHeight: 29,
    color: '#070A12',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#7B8799',
    textAlign: 'center',
    marginBottom: 16,
  },
  testingBadge: {
    backgroundColor: '#FFF4E0',
    borderWidth: 1,
    borderColor: '#F2CC66',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  testingBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#070A12',
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  stepNumber: {
    width: 38,
    height: 38,
    borderRadius: 4,
    backgroundColor: '#F8F1DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberActive: {
    backgroundColor: '#F2CC66',
  },
  stepNumberText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 17,
    color: '#070A12',
    textAlign: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 18,
    color: '#070A12',
    marginBottom: 4,
  },
  stepDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    color: '#7B8799',
  },
  stepDivider: {
    height: 1,
    backgroundColor: '#E7EAF0',
    marginLeft: 54,
  },
  timeEstimate: {
    backgroundColor: '#F8F1DA',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  timeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 16,
    color: '#7B8799',
  },
  getStartedButton: {
    backgroundColor: '#070A12',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  getStartedButtonDisabled: {
    opacity: 0.6,
  },
  getStartedText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 19,
    color: '#F2CC66',
  },
});