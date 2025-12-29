// lib/flagAnalysisService.ts
import OpenAI from 'openai';
import { supabase } from './supabase';


const apiKey = 'lalalala'

if (!apiKey) {
  console.error('api key is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: apiKey || '',
});

export interface FlagAnalysis {
  greenFlags: string[];
  redFlags: string[];
  neutralFlags: string[];
}

interface QuestionAnswerPair {
  questionNumber: number;
  questionText: string;
  answer: string;
  category: 'deen' | 'lifestyle' | 'fitness' | 'marital_life' | 'children_legacy';
}

interface ReceiverProfile {
  deen?: string;
  personality?: string;
  lifestyle?: string;
  spouse_criteria?: string;
  dealbreakers?: string;
  islamic_education?: string;
  financial_responsibility?: string;
  charity_habits?: string;
  conflict_resolution?: string;
  // Other profile fields for context
  prayer_consistency?: string;
  islamic_knowledge_level?: string;
  memorization_quran?: string;
  polygyny_acceptance?: boolean;
  polygyny_willingness?: boolean;
}

/**
 * Map question categories to relevant profile sections
 */
const getCategoryProfileSections = (
  category: string,
  profile: ReceiverProfile
): string => {
  const sections: Record<string, (string | undefined)[]> = {
    deen: [
      profile.deen,
      profile.islamic_education,
      profile.prayer_consistency,
      profile.islamic_knowledge_level,
      profile.memorization_quran,
    ],
    lifestyle: [
      profile.lifestyle,
      profile.personality,
    ],
    fitness: [
      profile.lifestyle,
      profile.personality,
    ],
    marital_life: [
      profile.spouse_criteria,
      profile.personality,
      profile.conflict_resolution,
      profile.financial_responsibility,
    ],
    children_legacy: [
      profile.spouse_criteria,
      profile.dealbreakers,
      profile.charity_habits,
    ],
  };

  const relevantSections = sections[category] || [];
  return relevantSections.filter((section): section is string => Boolean(section)).join('\n\n');
};

/**
 * Analyze a single answer against receiver's profile
 */
async function analyzeAnswer(
  questionAnswer: QuestionAnswerPair,
  receiverProfile: ReceiverProfile
): Promise<{ verdict: 'ALIGNED' | 'CONTRADICTORY' | 'NEUTRAL'; summary: string }> {
  const profileContext = getCategoryProfileSections(
    questionAnswer.category,
    receiverProfile
  );

  const prompt = `You are an AI assistant designed to analyse compatibility on an Islamic salafi matrimony app between two people. Your task is to evaluate responses to questions against a profile that are posed to someone who is interested in that person's profile. For each answer to a question, you are to take a look at the question, determine the relevant section from that person's profile that it's referring to and compare the answer to that section.

Provide an assessment using the format below:

Return "ALIGNED" if the answer shows compatibility with the receiver's profile
Return "CONTRADICTORY" if the answer shows incompatibility or potential concerns
If the profile sections are empty or the answer is neutral - return "NEUTRAL"

Provide a response using the format below:

VERDICT: [ALIGNED, CONTRADICTORY, or NEUTRAL]
SUMMARY: [One concise sentence explaining the reason, speaking as if you are talking to the receiver]

## Instructions

1. Read the question
2. Read the answer
3. Determine which section of the profile the question relates to
4. Assess whether the answer is in line with that section of the profile
5. Provide the verdict and summary, as if you are talking to the receiver (the person whose questions are being answered)

## Example Output

Example Answer Analysis - A brother interested in a sister, and is answering questions that the sister has set

Question: "Do you think that a man should go to the masjid even if it is 10 miles away from his house?"
The receiver's profile has a section (deen or spouse criteria) that says "A man should pray in the masjid as men should" - or dealbreakers section says "A man that doesn't pray in the masjid"

Answer: "Yes I think he should go when possible even if its not obligatory for him as 10 miles is far"

VERDICT: ALIGNED
SUMMARY: The brother is eager to pray in the masjid even if it is far away - thus indicating the importance of a man praying in the masjid.

---

Question: "Do you think water parks are fun?"
Receiver's profile doesn't mention water parks anywhere on the profile - such as in lifestyle section etc

Answer: "Yes I love them"

VERDICT: NEUTRAL
SUMMARY: The brother finds them to be fun, although this is the case I can't tell if that's a good or bad thing for you.

## Important

This is a salafi matchmaking app, do not make assumptions and only go off of the answers the person provided.

Receiver's profile sections: ${profileContext || "No specific preferences provided"}
Question: ${questionAnswer.questionText}
Answer: ${questionAnswer.answer}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a compatibility analyst for Muslim salafi matrimonial matching. Be concise and fair.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const result = response.choices[0].message.content || '';
    
    const verdictMatch = result.match(/VERDICT:\s*(ALIGNED|CONTRADICTORY|NEUTRAL)/i);
    const summaryMatch = result.match(/SUMMARY:\s*(.+?)(?:\n|$)/i);

    const verdict = (verdictMatch?.[1]?.toUpperCase() as 'ALIGNED' | 'CONTRADICTORY' | 'NEUTRAL') || 'NEUTRAL';
    const summary = summaryMatch?.[1]?.trim() || 'Response noted';

    // Fix terminology: ensure "polygyny" is used instead of "polygamy"
    const correctedSummary = summary.replace(/polygam(y|ous)/gi, (match) => {
      return match.toLowerCase().includes('polygamous') ? 'polygynous' : 'polygyny';
    });

    return { verdict, summary: correctedSummary };
  } catch (error) {
    console.error('Error analyzing answer:', error);
    // Default to neutral on error to avoid false positives or negatives
    return { verdict: 'NEUTRAL', summary: 'Response under review' };
  }
}

/**
 * Analyze all 5 answers and generate red/green/neutral flags
 */
export async function generateFlagAnalysis(
  questionAnswers: QuestionAnswerPair[],
  receiverProfile: ReceiverProfile
): Promise<FlagAnalysis> {
  console.log('Generating flag analysis for', questionAnswers.length, 'answers');

  const greenFlags: string[] = [];
  const redFlags: string[] = [];
  const neutralFlags: string[] = [];

  // Analyze each answer
  const analyses = await Promise.all(
    questionAnswers.map((qa) => analyzeAnswer(qa, receiverProfile))
  );

  analyses.forEach((analysis) => {
    if (analysis.verdict === 'ALIGNED') {
      greenFlags.push(analysis.summary);
    } else if (analysis.verdict === 'CONTRADICTORY') {
      redFlags.push(analysis.summary);
    } else {
      neutralFlags.push(analysis.summary);
    }
  });

  console.log('Analysis complete:', { 
    greenFlags: greenFlags.length, 
    redFlags: redFlags.length,
    neutralFlags: neutralFlags.length
  });

  return { greenFlags, redFlags, neutralFlags };
}

/**
 * Get cached flag analysis or generate new one
 * Checks database first, only calls AI if no cache exists
 */
export async function getFlagAnalysis(
  interestId: string,
  questionAnswers: QuestionAnswerPair[],
  receiverProfile: ReceiverProfile
): Promise<FlagAnalysis> {
  console.log('🔍 Checking for cached flag analysis...');
  
  try {
    // Check if we have cached analysis
    const { data: cached, error: cacheError } = await supabase
      .from('flag_analysis')
      .select('green_flags, red_flags, neutral_flags, created_at')
      .eq('interest_id', interestId)
      .single();

    if (cached && !cacheError) {
      console.log('✅ Found cached analysis from:', cached.created_at);
      console.log('Cache stats - Green:', cached.green_flags.length, 'Red:', cached.red_flags.length, 'Neutral:', cached.neutral_flags?.length || 0);
      return {
        greenFlags: cached.green_flags || [],
        redFlags: cached.red_flags || [],
        neutralFlags: cached.neutral_flags || []
      };
    }

    console.log('❌ No cache found, generating new AI analysis...');
    
    // Generate fresh analysis
    const analysis = await generateFlagAnalysis(questionAnswers, receiverProfile);

    // Save to cache
    console.log('💾 Saving analysis to cache...');
    const { error: insertError } = await supabase
      .from('flag_analysis')
      .insert({
        interest_id: interestId,
        green_flags: analysis.greenFlags,
        red_flags: analysis.redFlags,
        neutral_flags: analysis.neutralFlags
      });

    if (insertError) {
      console.error('Failed to cache analysis:', insertError);
      // Don't fail if caching fails, just return the analysis
    } else {
      console.log('✅ Analysis cached successfully');
    }

    return analysis;
    
  } catch (error) {
    console.error('Error in getFlagAnalysis:', error);
    // Fallback: generate without caching
    return generateFlagAnalysis(questionAnswers, receiverProfile);
  }
}

/**
 * Invalidate cached flag analysis (use when answers change)
 * This forces regeneration on next view
 */
export async function invalidateFlagAnalysisCache(interestId: string): Promise<void> {
  try {
    await supabase
      .from('flag_analysis')
      .delete()
      .eq('interest_id', interestId);
    
    console.log('🗑️ Cache invalidated for interest:', interestId);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}