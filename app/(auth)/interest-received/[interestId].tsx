// app/(auth)/interest-received/[interestId].tsx
import { FlagAnalysis, getFlagAnalysis } from '@/lib/flagAnalysisService';
import { acceptInterest, getInterestById, getQuestionResponses, rejectInterest } from '@/lib/interestService';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function InterestReceivedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Handle both array and string params
  const rawInterestId = params.interestId;
  const interestId = Array.isArray(rawInterestId) ? rawInterestId[0] : rawInterestId;

  console.log('=== Interest Received Screen Loaded ===');
  console.log('Raw params:', params);
  console.log('Raw interestId:', rawInterestId);
  console.log('Parsed Interest ID:', interestId);
  console.log('Type:', typeof interestId);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [requesterUsername, setRequesterUsername] = useState('');
  const [requesterId, setRequesterId] = useState('');
  const [requesterType, setRequesterType] = useState<'brother' | 'sister'>('brother');
  const [basicInfo, setBasicInfo] = useState<{
    age?: number;
    location?: string;
    education?: string;
    occupation?: string;
  }>({});
  const [flagAnalysis, setFlagAnalysis] = useState<FlagAnalysis>({ 
    greenFlags: [], 
    redFlags: [],
    neutralFlags: []
  });

  useEffect(() => {
    if (interestId) {
      loadInterestData();
    }
  }, [interestId]);

  const loadInterestData = async () => {
    if (!interestId) return;

    console.log('=== Loading Interest Data ===');
    console.log('Interest ID:', interestId);
    
    setIsLoading(true);
    try {
      // Get interest details
      console.log('1. Fetching interest...');
      const interest = await getInterestById(interestId);
      console.log('Interest:', interest);
      
      if (!interest) {
        alert('Interest not found');
        router.back();
        return;
      }

      setRequesterId(interest.requester_id);
      setRequesterType(interest.requester_type);

      // Get requester's username and BASIC INFO ONLY (no full profile access)
      console.log('2. Fetching requester basic info...');
      const { data: requesterProfile } = await supabase
        .from(interest.requester_type)
        .select('username, age, location, education, occupation')
        .eq('id', interest.requester_id)
        .single();

      if (requesterProfile) {
        setRequesterUsername(requesterProfile.username);
        setBasicInfo({
          age: requesterProfile.age,
          location: requesterProfile.location,
          education: requesterProfile.education,
          occupation: requesterProfile.occupation,
        });
        console.log('Requester username:', requesterProfile.username);
        console.log('Basic info loaded');
      }

      // Get receiver's profile (current user)
      console.log('3. Fetching receiver profile...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      const { data: receiverProfile } = await supabase
        .from(interest.recipient_type)
        .select('*')
        .eq('id', interest.recipient_id)
        .single();

      console.log('Receiver profile loaded');

      // Get question responses
      console.log('4. Fetching question responses...');
      const responses = await getQuestionResponses(interestId);
      console.log('Responses count:', responses.length);

      if (responses.length === 0) {
        console.warn('No responses found - showing empty flags');
        setFlagAnalysis({ greenFlags: [], redFlags: [], neutralFlags: [] });
        setIsLoading(false);
        return;
      }

      // Map responses to question/answer pairs with categories
      const questionCategories = [
        'deen',
        'lifestyle', 
        'fitness',
        'marital_life',
        'children_legacy'
      ] as const;

      const questionAnswers = responses.map((r, index) => ({
        questionNumber: r.question_number,
        questionText: r.question_text,
        answer: r.answer,
        category: questionCategories[index] || 'deen',
      }));

      console.log('5. Generating AI flag analysis...');
      
      // Generate flag analysis with error handling and timeout
      try {
        // Add 10 second timeout for AI analysis
        const analysisPromise = getFlagAnalysis(
          interestId,
          questionAnswers,
          receiverProfile
        );
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI analysis timeout')), 10000)
        );
        
        const analysis = await Promise.race([analysisPromise, timeoutPromise]) as any;
        console.log('Analysis complete:', analysis);
        setFlagAnalysis(analysis);
      } catch (aiError: any) {
        console.error('AI Analysis failed:', aiError);
        console.error('Error details:', aiError.message);
        // Show a default analysis on AI failure
        setFlagAnalysis({
          greenFlags: [],
          redFlags: [],
          neutralFlags: ['Compatibility analysis in progress - check back soon']
        });
        // Don't alert, just log - user can still see answers
        console.warn('Using fallback analysis due to AI error');
      }

    } catch (error) {
      console.error('Error loading interest data:', error);
      alert('An error occurred loading the interest');
    } finally {
      console.log('6. Loading complete, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleViewAnswers = () => {
    if (interestId) {
      // Use push here since we want to go back to summary
      router.push(`/(auth)/interest-answers/${interestId}`);
    }
  };

  const handleExpressInterestBack = () => {
    if (requesterId) {
      // Navigate to the requester's profile to express interest
      // The profile screen will have the "Express Interest" button
      router.push(`/(auth)/profile/${requesterId}`);
    }
  };

  const handleAccept = async () => {
    if (!interestId) return;

    setIsProcessing(true);
    try {
      const result = await acceptInterest(interestId);
      if (result.success) {
        alert('Interest accepted!');
        // Use replace to clear the navigation stack
        router.replace('/(auth)/interests');
      } else {
        alert('Failed to accept interest. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting interest:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!interestId) return;

    setIsProcessing(true);
    try {
      const result = await rejectInterest(interestId);
      if (result.success) {
        alert('Interest declined.');
        // Use replace to clear the navigation stack
        router.replace('/(auth)/interests');
      } else {
        alert('Failed to decline interest. Please try again.');
      }
    } catch (error) {
      console.error('Error declining interest:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
      </View>
    );
  }

  const genderText = requesterType === 'brother' ? 'brother' : 'sister';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>
          This {genderText} is interested in you
        </Text>

        {/* Basic Info Card - Shows public info only */}
        <View style={styles.basicInfoCard}>
          <Text style={styles.username}>{requesterUsername}</Text>
          {basicInfo.age && (
            <Text style={styles.basicDetail}>Age: {basicInfo.age}</Text>
          )}
          {basicInfo.location && (
            <Text style={styles.basicDetail}>Location: {basicInfo.location}</Text>
          )}
          {basicInfo.education && (
            <Text style={styles.basicDetail}>Education: {basicInfo.education}</Text>
          )}
          {basicInfo.occupation && (
            <Text style={styles.basicDetail}>Occupation: {basicInfo.occupation}</Text>
          )}
        </View>

        {/* Summary Section */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <TouchableOpacity 
            style={styles.viewAnswersButton}
            onPress={handleViewAnswers}
          >
            <Text style={styles.viewAnswersText}>View Answers</Text>
          </TouchableOpacity>
        </View>

        {/* Green Flags */}
        {flagAnalysis.greenFlags.length > 0 && (
          <View style={styles.flagSection}>
            <View style={styles.flagHeader}>
              <Text style={styles.flagTitle}>Green Flags</Text>
              <View style={styles.greenFlagIcon}>
                <Text style={styles.flagIconText}>✓</Text>
              </View>
            </View>
            {flagAnalysis.greenFlags.map((flag, index) => (
              <View key={`green-${index}`} style={styles.flagItem}>
                <View style={styles.bullet} />
                <Text style={styles.flagText}>{flag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Red Flags */}
        {flagAnalysis.redFlags.length > 0 && (
          <View style={styles.flagSection}>
            <View style={styles.flagHeader}>
              <Text style={styles.flagTitle}>Red Flags</Text>
              <View style={styles.redFlagIcon}>
                <Text style={styles.flagIconText}>⚑</Text>
              </View>
            </View>
            {flagAnalysis.redFlags.map((flag, index) => (
              <View key={`red-${index}`} style={styles.flagItem}>
                <View style={styles.bullet} />
                <Text style={styles.flagText}>{flag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Neutral Flags */}
        {flagAnalysis.neutralFlags.length > 0 && (
          <View style={styles.flagSection}>
            <View style={styles.flagHeader}>
              <Text style={styles.flagTitle}>Neutral Points</Text>
              <View style={styles.neutralFlagIcon}>
                <Text style={styles.flagIconText}>◐</Text>
              </View>
            </View>
            {flagAnalysis.neutralFlags.map((flag, index) => (
              <View key={`neutral-${index}`} style={styles.flagItem}>
                <View style={styles.bullet} />
                <Text style={styles.flagText}>{flag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Info Box - How to See Full Profile */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoTitle}>Want to see their full profile?</Text>
          <Text style={styles.infoText}>
            To unlock their complete profile and create mutual interest:
          </Text>
          <View style={styles.steps}>
            <Text style={styles.step}>1. Express interest back</Text>
            <Text style={styles.step}>2. Answer their 5 questions</Text>
            <Text style={styles.step}>3. Wait for them to accept</Text>
          </View>
          <TouchableOpacity 
            style={styles.expressBackButton}
            onPress={handleExpressInterestBack}
          >
            <Text style={styles.expressBackText}>Express Interest Back</Text>
          </TouchableOpacity>
        </View>

        {/* Note */}
        <Text style={styles.note}>
          💡 You can accept their interest now and decide later whether to express interest back. 
          Accepting doesn't commit you to proceeding.
        </Text>

      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
            onPress={handleAccept}
            disabled={isProcessing}
          >
            <Text style={styles.acceptButtonText}>
              {isProcessing ? 'Processing...' : 'Accept'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.declineButton, isProcessing && styles.buttonDisabled]}
            onPress={handleDecline}
            disabled={isProcessing}
          >
            <Text style={styles.declineButtonText}>
              {isProcessing ? 'Processing...' : 'Decline'}
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 61,
    paddingBottom: 120,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 24,
    lineHeight: 32,
    color: '#000000',
    marginBottom: 20,
  },
  basicInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  username: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 32,
    lineHeight: 43,
    color: '#070A12',
    marginBottom: 12,
  },
  basicDetail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#7B8799',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  summaryTitle: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontSize: 20,
    lineHeight: 27,
    color: '#000000',
  },
  viewAnswersButton: {
    backgroundColor: '#070A12',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  viewAnswersText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 18,
    color: '#F2CC66',
  },
  flagSection: {
    marginBottom: 32,
  },
  flagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  flagTitle: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 20,
    lineHeight: 27,
    color: '#070A12',
    marginRight: 12,
  },
  greenFlagIcon: {
    width: 15,
    height: 21,
    backgroundColor: '#17803A',
    borderWidth: 1,
    borderColor: '#070A12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  redFlagIcon: {
    width: 15,
    height: 21,
    backgroundColor: '#E03A3A',
    borderWidth: 1,
    borderColor: '#070A12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  neutralFlagIcon: {
    width: 15,
    height: 21,
    backgroundColor: '#7B8799',
    borderWidth: 1,
    borderColor: '#070A12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagIconText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#070A12',
    marginRight: 12,
    marginTop: 4,
  },
  flagText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 18,
    color: '#000000',
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F2CC66',
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  infoTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#070A12',
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#070A12',
    marginBottom: 12,
  },
  steps: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  step: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 22,
    color: '#070A12',
  },
  expressBackButton: {
    backgroundColor: '#070A12',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  expressBackText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 18,
    color: '#F2CC66',
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#7B8799',
    textAlign: 'center',
    marginBottom: 20,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 45,
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#17803A',
    borderRadius: 8,
    paddingVertical: 8,
    width: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  declineButton: {
    backgroundColor: '#B7312C',
    borderRadius: 8,
    paddingVertical: 8,
    width: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  acceptButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  declineButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});