// lib/interestService.ts
import {
  notifyInterestAccepted,
  notifyInterestExpressed,
  notifyInterestRejected,
  notifyQuestionProgress,
  notifyQuestionsCompleted,
} from './notificationService';
import { supabase } from './supabase';

export interface Interest {
  id: string;
  requester_id: string;
  requester_type: 'brother' | 'sister';
  recipient_id: string;
  recipient_type: 'brother' | 'sister';
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  questions_answered: number;
  total_questions: number;
  unlock_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionResponse {
  id: string;
  interest_id: string;
  question_number: number;
  question_text: string;
  answer: string;
  created_at: string;
}

export interface RecipientQuestions {
  question_deen: string;
  question_lifestyle: string;
  question_fitness: string;
  question_marital_life: string;
  question_children_legacy: string;
}

/**
 * Express interest in a profile
 * Creates a new interest record and returns the interest ID
 */
export async function expressInterest(
  requesterId: string,
  requesterType: 'brother' | 'sister',
  recipientId: string,
  recipientType: 'brother' | 'sister'
): Promise<{ success: boolean; interestId?: string; error?: string }> {
  try {
    // Check if interest already exists
    const { data: existing } = await supabase
      .from('interests')
      .select('id, status')
      .eq('requester_id', requesterId)
      .eq('recipient_id', recipientId)
      .single();

    if (existing) {
      // If withdrawn, allow re-expressing interest
      if (existing.status === 'withdrawn') {
        const { error } = await supabase
          .from('interests')
          .update({ status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
        return { success: true, interestId: existing.id };
      }
      
      // Interest already exists and is active
      return { success: true, interestId: existing.id };
    }

    // Create new interest
    const { data, error } = await supabase
      .from('interests')
      .insert({
        requester_id: requesterId,
        requester_type: requesterType,
        recipient_id: recipientId,
        recipient_type: recipientType,
        status: 'pending',
        questions_answered: 0,
        total_questions: 5,
        unlock_percentage: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to recipient
    await notifyInterestExpressed(
      data.id,
      recipientId,
      recipientType,
      requesterId,
      requesterType
    );

    return { success: true, interestId: data.id };
  } catch (error: any) {
    console.error('Error expressing interest:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get interest between two users
 */
export async function getInterest(
  requesterId: string,
  recipientId: string
): Promise<Interest | null> {
  try {
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .eq('requester_id', requesterId)
      .eq('recipient_id', recipientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting interest:', error);
    return null;
  }
}

/**
 * Get interest by ID
 */
export async function getInterestById(interestId: string): Promise<Interest | null> {
  try {
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .eq('id', interestId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting interest by ID:', error);
    return null;
  }
}

/**
 * Get recipient's custom questions
 */
export async function getRecipientQuestions(
  recipientId: string,
  recipientType: 'brother' | 'sister'
): Promise<RecipientQuestions | null> {
  try {
    const table = recipientType === 'brother' ? 'brother' : 'sister';
    
    const { data, error } = await supabase
      .from(table)
      .select('question_deen, question_lifestyle, question_fitness, question_marital_life, question_children_legacy')
      .eq('id', recipientId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting recipient questions:', error);
    return null;
  }
}

/**
 * Get all question responses for an interest
 */
export async function getQuestionResponses(
  interestId: string
): Promise<QuestionResponse[]> {
  try {
    console.log('📋 Fetching question responses for interest:', interestId);
    console.log('Interest ID type:', typeof interestId);
    console.log('Interest ID length:', interestId?.length);
    
    // Try exact match first
    const { data, error, count } = await supabase
      .from('question_responses')
      .select('*', { count: 'exact' })
      .eq('interest_id', interestId)
      .order('question_number', { ascending: true });

    console.log('Query result - count:', count);
    console.log('Query result - error:', error);
    console.log('Query result - data length:', data?.length);

    if (error) {
      console.error('❌ Error fetching responses:', error);
      throw error;
    }
    
    // If no results, try to debug what's in the table
    if (!data || data.length === 0) {
      console.warn('⚠️ No responses found, checking table...');
      
      // Get ALL responses to see what's there
      const { data: allResponses } = await supabase
        .from('question_responses')
        .select('interest_id')
        .limit(10);
      
      console.log('Sample interest_ids in table:', allResponses?.map(r => r.interest_id));
    }
    
    console.log('✅ Found responses:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('Response details:', data.map(r => ({
        q: r.question_number,
        text: r.question_text?.substring(0, 30),
        hasAnswer: !!r.answer
      })));
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting question responses:', error);
    return [];
  }
}

/**
 * Save a question response and update progress
 */
export async function saveQuestionResponse(
  interestId: string,
  questionNumber: number,
  questionText: string,
  answer: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Save the response
    const { error: responseError } = await supabase
      .from('question_responses')
      .upsert({
        interest_id: interestId,
        question_number: questionNumber,
        question_text: questionText,
        answer: answer,
      }, {
        onConflict: 'interest_id,question_number'
      });

    if (responseError) throw responseError;

    // Update questions_answered count
    const { data: responses } = await supabase
      .from('question_responses')
      .select('id')
      .eq('interest_id', interestId);

    const questionsAnswered = responses?.length || 0;

    const { error: updateError } = await supabase
      .from('interests')
      .update({
        questions_answered: questionsAnswered,
        unlock_percentage: questionsAnswered * 20,
        updated_at: new Date().toISOString(),
      })
      .eq('id', interestId);

    if (updateError) throw updateError;

    // Send notifications based on progress
    const interest = await getInterestById(interestId);
    if (interest && questionsAnswered > 0) {
      // Notify at 40%, 60%, 80%
      if (questionsAnswered === 2 || questionsAnswered === 3 || questionsAnswered === 4) {
        await notifyQuestionProgress(
          interestId,
          interest.recipient_id,
          interest.recipient_type,
          interest.requester_id,
          interest.requester_type,
          questionsAnswered * 20
        );
      }

      // Notify when completed (100%)
      if (questionsAnswered === 5) {
        await notifyQuestionsCompleted(
          interestId,
          interest.recipient_id,
          interest.recipient_type,
          interest.requester_id,
          interest.requester_type
        );
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error saving question response:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Withdraw interest (set status to withdrawn)
 * Can ONLY withdraw before completing all questions (unlock_percentage < 100)
 */
export async function withdrawInterest(
  interestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the interest to check if withdrawal is allowed
    const interest = await getInterestById(interestId);
    
    if (!interest) {
      return { success: false, error: 'Interest not found' };
    }

    // Prevent withdrawal if questions are completed
    if (interest.unlock_percentage >= 100) {
      return { 
        success: false, 
        error: 'Cannot withdraw after completing questions. Please accept or decline instead.' 
      };
    }

    const { error } = await supabase
      .from('interests')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString(),
      })
      .eq('id', interestId);

    if (error) throw error;
    
    console.log('✅ Interest withdrawn at', interest.unlock_percentage + '%');
    return { success: true };
  } catch (error: any) {
    console.error('Error withdrawing interest:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Accept interest (receiver accepts requester)
 */
export async function acceptInterest(
  interestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const interest = await getInterestById(interestId);
    if (!interest) {
      return { success: false, error: 'Interest not found' };
    }

    console.log("accepting interest:", interestId);
    console.log("current status:", interest.status);
    
    const { data, error } = await supabase
      .from('interests')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', interestId)
      .select(); // ✅ ADD THIS - Returns what was updated
    
    console.log("update data:", data);
    console.log("update error:", error);
    console.log("rows affected:", data?.length);
    
    if (error) throw error;
    
    // Check if any rows were actually updated
    if (!data || data.length === 0) {
      console.error("❌ No rows updated! Possible RLS policy issue");
      return { success: false, error: 'Update failed - no rows affected' };
    }
    
    console.log("✅ Updated to:", data[0].status);

    await notifyInterestAccepted(
      interestId,
      interest.requester_id,
      interest.requester_type,
      interest.recipient_id,
      interest.recipient_type
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error accepting interest:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject interest (receiver rejects requester)
 */
export async function rejectInterest(
  interestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get interest details first
    const interest = await getInterestById(interestId);
    if (!interest) {
      return { success: false, error: 'Interest not found' };
    }

    const { error } = await supabase
      .from('interests')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', interestId);

    if (error) throw error;

    // Send notification to requester
    await notifyInterestRejected(
      interestId,
      interest.requester_id,
      interest.requester_type
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting interest:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all interests where current user is the requester
 */
export async function getMyInterests(
  userId: string,
  userType: 'brother' | 'sister'
): Promise<Interest[]> {
  try {
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .eq('requester_id', userId)
      .eq('requester_type', userType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting my interests:', error);
    return [];
  }
}

/**
 * Get all interests where current user is the recipient
 * ✅ FIXED: Now includes both pending AND accepted interests
 */
export async function getReceivedInterests(
  userId: string,
  userType: 'brother' | 'sister'
): Promise<Interest[]> {
  try {
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .eq('recipient_id', userId)
      .eq('recipient_type', userType)
      .in('status', ['pending', 'accepted']) // ✅ FIXED: Include both pending and accepted
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting received interests:', error);
    return [];
  }
}