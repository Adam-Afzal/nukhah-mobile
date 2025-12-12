// app/(auth)/questions/[interestId].tsx
import {
  getInterestById,
  getQuestionResponses,
  getRecipientQuestions,
  saveQuestionResponse
} from '@/lib/interestService';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Question {
  number: number;
  text: string;
  key: 'question_deen' | 'question_lifestyle' | 'question_fitness' | 'question_marital_life' | 'question_children_legacy';
}

export default function QuestionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const interestId = params.id; // Get from 'id' param, not 'interestId'
  
  console.log('Questions screen loaded');
  console.log('interestId from params:', interestId);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);

  useEffect(() => {
    console.log('useEffect triggered with interestId:', interestId);
    if (interestId) {
      loadQuestions();
    }
  }, [interestId]);

  const loadQuestions = async () => {
    console.log("loadQuestions called");
    console.log(`interest id in loadQuestions: ${interestId}`);
    
    if (!interestId) {
      console.error('No interestId provided!');
      alert('Invalid interest ID');
      router.back();
      return;
    }

    setIsLoading(true);
    console.log("loading questions...");
    
    try {
      // Get interest details
      console.log('Fetching interest by ID:', interestId);
      const interest = await getInterestById(interestId);
      console.log('Interest data:', interest);
      
      if (!interest) {
        alert('Interest not found');
        router.back();
        return;
      }

      setRecipientId(interest.recipient_id);
      setTotalQuestionsAnswered(interest.questions_answered);

      // Get recipient's questions
      console.log('Fetching recipient questions for:', interest.recipient_id, interest.recipient_type);
      const recipientQuestions = await getRecipientQuestions(
        interest.recipient_id,
        interest.recipient_type
      );

      console.log('Recipient questions:', recipientQuestions);

      if (!recipientQuestions) {
        alert('Could not load questions');
        router.back();
        return;
      }

      // Build questions array
      const questionsList: Question[] = [
        { number: 1, text: recipientQuestions.question_deen, key: 'question_deen' },
        { number: 2, text: recipientQuestions.question_lifestyle, key: 'question_lifestyle' },
        { number: 3, text: recipientQuestions.question_fitness, key: 'question_fitness' },
        { number: 4, text: recipientQuestions.question_marital_life, key: 'question_marital_life' },
        { number: 5, text: recipientQuestions.question_children_legacy, key: 'question_children_legacy' },
      ];

      setQuestions(questionsList);

      // Load existing responses
      const responses = await getQuestionResponses(interestId);
      const existingAnswers: Record<number, string> = {};
      responses.forEach(r => {
        existingAnswers[r.question_number] = r.answer;
      });
      setAnswers(existingAnswers);

      // Determine which question to show
      const nextUnanswered = questionsList.findIndex(q => !existingAnswers[q.number]);
      if (nextUnanswered !== -1) {
        setCurrentQuestionIndex(nextUnanswered);
        setCurrentAnswer(existingAnswers[questionsList[nextUnanswered].number] || '');
      } else if (responses.length === 5) {
        // All questions answered
        router.push(`/(auth)/profile/${interest.recipient_id}`);
        return;
      }

      // Get recipient profile for username
      const { data: recipientProfile } = await supabase
        .from(interest.recipient_type)
        .select('username')
        .eq('id', interest.recipient_id)
        .single();

      if (recipientProfile) {
        setRecipientUsername(recipientProfile.username);
      }

    } catch (error) {
      console.error('Error loading questions:', error);
      alert('An error occurred loading questions');
    } finally {
      setIsLoading(false);
      console.log("finished loading");
    }
  };

  const handleNext = async () => {
    if (!currentAnswer.trim()) {
      alert('Please provide an answer before continuing');
      return;
    }

    if (!interestId) return;

    setIsSaving(true);
    try {
      const currentQuestion = questions[currentQuestionIndex];
      
      // Save the answer
      const result = await saveQuestionResponse(
        interestId,
        currentQuestion.number,
        currentQuestion.text,
        currentAnswer.trim()
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to save answer');
      }

      // Update local state
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.number]: currentAnswer.trim()
      }));

      setTotalQuestionsAnswered(prev => prev + 1);

      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setCurrentAnswer(answers[questions[nextIndex].number] || '');
      } else {
        // All questions answered, go to profile
        router.push(`/(auth)/profile/${recipientId}`);
      }
    } catch (error: any) {
      console.error('Error saving answer:', error);
      alert(error.message || 'Failed to save your answer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewProfile = () => {
    if (recipientId) {
      router.replace(`/(auth)/profile/${recipientId}`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2CC66" />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No questions available</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = Math.round((totalQuestionsAnswered / 5) * 100);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>Let's see if you're compatible</Text>

        {/* Username */}
        <View style={styles.usernameRow}>
          <Text style={styles.username}>{recipientUsername}</Text>
          <TouchableOpacity 
            style={styles.viewProfileButton}
            onPress={handleViewProfile}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <Text style={styles.progressText}>
          Questions Progress: {progressPercentage}%
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
        </View>

        {/* Question */}
        <Text style={styles.questionText}>{currentQuestion.text}</Text>

        {/* Answer Box */}
        <View style={styles.answerContainer}>
          <Text style={styles.answerHint}>
            Answer honestly - this will affect the outcome.
          </Text>
          <TextInput
            style={styles.answerInput}
            placeholder="Type your answer here..."
            placeholderTextColor="#C0C7D1"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            value={currentAnswer}
            onChangeText={setCurrentAnswer}
            maxLength={1000}
          />
          <Text style={styles.characterCount}>
            {currentAnswer.length}/1000
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isSaving}
        >
          <Text style={styles.nextButtonText}>
            {isSaving ? 'Saving...' : currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#7B8799',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FB',
    paddingHorizontal: 28,
  },
  errorText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#070A12',
    marginBottom: 16,
  },
  backLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#F2CC66',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 120,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 24,
    lineHeight: 32,
    color: '#070A12',
    marginBottom: 20,
  },
  usernameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  username: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 40,
    lineHeight: 53,
    color: '#070A12',
  },
  viewProfileButton: {
    backgroundColor: '#070A12',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  viewProfileText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#F2CC66',
  },
  progressText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#070A12',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F8F1DA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F2CC66',
  },
  questionText: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 20,
    lineHeight: 27,
    color: '#070A12',
    marginBottom: 24,
  },
  answerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 8,
    padding: 16,
  },
  answerHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 18,
    color: '#7B8799',
    marginBottom: 16,
  },
  answerInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 20,
    color: '#070A12',
    minHeight: 200,
    paddingVertical: 12,
  },
  characterCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
    textAlign: 'right',
    marginTop: 8,
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
  nextButton: {
    backgroundColor: '#070A12',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 20,
    lineHeight: 24,
    color: '#F2CC66',
  },
});