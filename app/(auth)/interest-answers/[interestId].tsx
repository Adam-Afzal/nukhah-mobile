// app/(auth)/interest-answers/[interestId].tsx
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

interface QuestionAnswer {
  questionText: string;
  answer: string;
}

export default function InterestAnswersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Handle both array and string params
  const rawInterestId = params.interestId;
  const interestId = Array.isArray(rawInterestId) ? rawInterestId[0] : rawInterestId;

  console.log('=== Answers Screen Loaded ===');
  console.log('Raw params:', params);
  console.log('Parsed Interest ID:', interestId);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interestStatus, setInterestStatus] = useState<string>('pending');
  const [requesterUsername, setRequesterUsername] = useState('');
  const [requesterId, setRequesterId] = useState('');
  const [requesterType, setRequesterType] = useState<'brother' | 'sister'>('brother');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserType, setCurrentUserType] = useState<'brother' | 'sister'>('brother');
  const [hasExpressedInterestBack, setHasExpressedInterestBack] = useState(false);
  const [basicInfo, setBasicInfo] = useState<{
    age?: number;
    location?: string;
  }>({});
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);

  useEffect(() => {
    if (interestId) {
      loadAnswers();
    }
  }, [interestId]);

  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const loadAnswers = async () => {
    if (!interestId) return;

    setIsLoading(true);
    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Determine current user's profile type
      const { data: brotherProfile } = await supabase
        .from('brother')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (brotherProfile) {
        setCurrentUserId(brotherProfile.id);
        setCurrentUserType('brother');
      } else {
        const { data: sisterProfile } = await supabase
          .from('sister')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (sisterProfile) {
          setCurrentUserId(sisterProfile.id);
          setCurrentUserType('sister');
        }
      }

      // Get interest details
      const interest = await getInterestById(interestId);
      if (!interest) {
        alert('Interest not found');
        router.back();
        return;
      }

      // Set interest status and requester info
      setInterestStatus(interest.status);
      setRequesterId(interest.requester_id);
      setRequesterType(interest.requester_type);

      const { data: requesterProfile, error: profileError } = await supabase
        .from(interest.requester_type)
        .select('username, date_of_birth, location')
        .eq('id', interest.requester_id)
        .single();

      console.log('=== PROFILE QUERY DEBUG ===');
      console.log('Table:', interest.requester_type);
      console.log('Requester ID:', interest.requester_id);
      console.log('Error:', profileError);
      console.log('Data:', requesterProfile);
      console.log('==========================');

      if (profileError) {
        console.error('Profile query error:', profileError);
      }

      if (requesterProfile) {
        console.log('Requester profile:', requesterProfile);
        setRequesterUsername(requesterProfile.username);
        const age = calculateAge(requesterProfile.date_of_birth);
        setBasicInfo({
          age: age || undefined,
          location: requesterProfile.location
        });

        console.log('BasicInfo state set to:', {
          age: age || undefined,
          location: requesterProfile.location,
        });
      }

    // Check if current user has already expressed interest back
let currentUserProfileId: string | undefined;
let currentUserProfileType: 'brother' | 'sister';

if (brotherProfile) {
  currentUserProfileId = brotherProfile.id;
  currentUserProfileType = 'brother';
} else {
  const { data: sisterProfile } = await supabase
    .from('sister')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  currentUserProfileId = sisterProfile?.id;
  currentUserProfileType = 'sister';
}

console.log('=== CURRENT USER DEBUG ===');
console.log('Current user profile ID:', currentUserProfileId);
console.log('Current user profile type:', currentUserProfileType);
console.log('==========================');

      if (currentUserProfileId) {
        console.log('=== CHECKING REVERSE INTEREST ===');
        console.log('Query params:');
        console.log('  requester_id:', currentUserProfileId);
        console.log('  requester_type:', currentUserProfileType);
        console.log('  recipient_id:', interest.requester_id);
        console.log('  recipient_type:', interest.requester_type);
      
        const { data: reverseInterest, error: reverseError } = await supabase
          .from('interests')
          .select('id, status')
          .eq('requester_id', currentUserProfileId)
          .eq('requester_type', currentUserProfileType)
          .eq('recipient_id', interest.requester_id)
          .eq('recipient_type', interest.requester_type)
          .maybeSingle();
      
        console.log('Query error:', reverseError);
        console.log('Query result:', reverseInterest);
        console.log('hasExpressedInterestBack will be:', !!reverseInterest);
        console.log('==================================');
      
        if (reverseInterest) {
          setHasExpressedInterestBack(true);
        }
      }

      // Get question responses
      const responses = await getQuestionResponses(interestId);

      // Map to question/answer pairs
      const qaList = responses.map(r => ({
        questionText: r.question_text,
        answer: r.answer,
      }));

      setQuestionAnswers(qaList);

    } catch (error) {
      console.error('Error loading answers:', error);
      alert('An error occurred loading the answers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = () => {
    if (requesterId) {
      router.push(`/(auth)/profile/${requesterId}`);
    }
  };

  const handleExpressInterestBack = () => {
    if (requesterId) {
      // Navigate to the requester's profile to express interest
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
        setInterestStatus('accepted');
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
        setInterestStatus('rejected');
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
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.headerTitle}>
          This {genderText} is interested in you
        </Text>

        {/* Basic Info Card */}
        <View style={styles.basicInfoCard}>
          <Text style={styles.username}>{requesterUsername}</Text>
          {basicInfo.age && (
            <Text style={styles.basicDetail}>Age: {basicInfo.age}</Text>
          )}
          {basicInfo.location && (
            <Text style={styles.basicDetail}>Location: {basicInfo.location}</Text>
          )}
         
          
          {/* View Profile Button */}
          <TouchableOpacity 
            style={styles.viewProfileButton}
            onPress={handleViewProfile}
          >
            <Text style={styles.viewProfileText}>View Full Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Questions Title */}
        <Text style={styles.questionsTitle}>Their Answers</Text>

        {/* Question/Answer Pairs */}
        {questionAnswers.map((qa, index) => (
          <View key={index} style={styles.qaContainer}>
            <Text style={styles.questionText}>{qa.questionText}</Text>
            <View style={styles.answerBox}>
              <Text style={styles.answerText}>{qa.answer}</Text>
            </View>
          </View>
        ))}

        {/* Info Box - Conditional based on whether user has expressed interest back */}
        {hasExpressedInterestBack ? (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>You've expressed interest back!</Text>
            <Text style={styles.successText}>
              You've already sent your interest to {requesterUsername}. They will see your answers and can accept or decline.
            </Text>
            <Text style={styles.successNote}>
              If they accept, you'll both be able to see each other's full profiles and begin conversations.
            </Text>
          </View>
        ) : (
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
        )}

        {/* Note - Only show if pending */}
        {interestStatus === 'pending' && (
          <Text style={styles.note}>
            💡 You can accept their interest now and decide later whether to express interest back. 
            Accepting doesn't commit you to proceeding.
          </Text>
        )}

      </ScrollView>

      {/* Bottom Buttons - Only show if pending */}
      {interestStatus === 'pending' && (
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
      )}

      {/* Status Badge - Show if already decided */}
      {interestStatus === 'accepted' && (
        <View style={[styles.bottomContainer, { backgroundColor: '#EAF5EE' }]}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusIcon}>✅</Text>
            <Text style={styles.statusText}>You accepted this interest</Text>
          </View>
        </View>
      )}

      {interestStatus === 'rejected' && (
        <View style={[styles.bottomContainer, { backgroundColor: '#FFEAEA' }]}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusIcon}>❌</Text>
            <Text style={styles.statusText}>You declined this interest</Text>
          </View>
        </View>
      )}
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
    paddingBottom: 140, // Space for bottom buttons
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#F2CC66',
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
  viewProfileButton: {
    backgroundColor: '#F2CC66',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  viewProfileText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#070A12',
  },
  questionsTitle: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontSize: 20,
    lineHeight: 27,
    color: '#000000',
    marginBottom: 24,
  },
  qaContainer: {
    marginBottom: 32,
  },
  questionText: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 18,
    lineHeight: 24,
    color: '#000000',
    marginBottom: 12,
  },
  answerBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
  },
  answerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#070A12',
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F2CC66',
  },
  successBox: {
    backgroundColor: '#EAF5EE',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#17803A',
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  successIcon: {
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
  successTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#17803A',
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#070A12',
    marginBottom: 12,
  },
  successText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#070A12',
    marginBottom: 12,
  },
  successNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#7B8799',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#070A12',
  },
});