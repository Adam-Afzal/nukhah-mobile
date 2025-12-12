// app/(auth)/interest-answers/[interestId].tsx
import { getInterestById, getQuestionResponses } from '@/lib/interestService';
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
  const [requesterUsername, setRequesterUsername] = useState('');
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);

  useEffect(() => {
    if (interestId) {
      loadAnswers();
    }
  }, [interestId]);

  const loadAnswers = async () => {
    if (!interestId) return;

    setIsLoading(true);
    try {
      // Get interest details
      const interest = await getInterestById(interestId);
      if (!interest) {
        alert('Interest not found');
        router.back();
        return;
      }

      // Get requester's username
      const { data: requesterProfile } = await supabase
        .from(interest.requester_type)
        .select('username')
        .eq('id', interest.requester_id)
        .single();

      if (requesterProfile) {
        setRequesterUsername(requesterProfile.username);
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

  const handleViewSummary = () => {
    if (interestId) {
      router.back(); // Go back to summary screen
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
        <Text style={styles.headerTitle}>Review their answers</Text>

        {/* Username Row */}
        <View style={styles.usernameRow}>
          <Text style={styles.username}>{requesterUsername}</Text>
          <TouchableOpacity 
            style={styles.viewSummaryButton}
            onPress={handleViewSummary}
          >
            <Text style={styles.viewSummaryText}>View Summary</Text>
          </TouchableOpacity>
        </View>

        {/* Question/Answer Pairs */}
        {questionAnswers.map((qa, index) => (
          <View key={index} style={styles.qaContainer}>
            <Text style={styles.questionText}>{qa.questionText}</Text>
            <View style={styles.answerBox}>
              <Text style={styles.answerText}>{qa.answer}</Text>
            </View>
          </View>
        ))}

      </ScrollView>
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
    paddingBottom: 40,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 24,
    lineHeight: 32,
    color: '#000000',
    marginBottom: 20,
  },
  usernameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 52,
  },
  username: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 40,
    lineHeight: 53,
    color: '#000000',
  },
  viewSummaryButton: {
    backgroundColor: '#070A12',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  viewSummaryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 18,
    color: '#F2CC66',
  },
  qaContainer: {
    marginBottom: 52,
  },
  questionText: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 20,
    lineHeight: 27,
    color: '#000000',
    marginBottom: 20,
  },
  answerBox: {
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    padding: 17,
    minHeight: 141,
  },
  answerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#7B8799',
  },
});