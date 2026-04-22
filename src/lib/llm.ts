/**
 * LLM RESPONSE GENERATION MODULE
 * Generate concise answers using OpenAI GPT
 */

import { OpenAI } from 'openai';
import { LLMResponse, ProcessedPolicy, UserProfile } from './types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Generate 3-layer LLM response
 * Layer 1: Short answer (2-3 lines)
 * Layer 2: Explanation (why/why not eligible)
 * Layer 3: Full details (policy data)
 */
export async function generateLLMResponse(
  userQuery: string,
  processedPolicies: ProcessedPolicy[],
  llmContext: string,
  userProfile?: Partial<UserProfile>,
): Promise<LLMResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Get eligible policies
    const eligiblePolicies = processedPolicies.filter(
      (p) => p.eligibility_check.status === 'eligible',
    );

    // Step 2: Prepare prompt for LLM
    const systemPrompt = `You are a helpful government policy assistant for Indian citizens. 
Your role is to:
1. Explain government policies in SIMPLE, CLEAR language
2. Provide ONLY relevant information to the user's question
3. Give SHORT answers (2-3 sentences max)
4. Do NOT use complex jargon or long paragraphs
5. Focus on ELIGIBLE schemes first

IMPORTANT RULES:
- If user is not eligible for any scheme, suggest what they need to do
- Only mention schemes they can actually apply for
- Be encouraging and helpful in tone`;

    const userPrompt = `${llmContext}

User Question: "${userQuery}"

Please provide a SHORT answer (2-3 sentences) based on the policy context above. 
Focus ONLY on policies the user is eligible for.`;

    // Step 3: Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and affordable
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300, // Keep responses short
    });

    const mainAnswer =
      completion.choices[0]?.message?.content ||
      'Unable to generate response. Please try again.';

    // Step 4: Generate layer 2 (explanation)
    const explanation = generateExplanation(
      eligiblePolicies,
      processedPolicies,
      userProfile,
    );

    // Step 5: Build full response
    const response: LLMResponse = {
      answer: mainAnswer.trim(),
      explanation,
      full_details: {
        processed_policies: processedPolicies,
        user_matching_profile: userProfile || {},
      },
      metadata: {
        policies_analyzed: processedPolicies.length,
        processing_time_ms: Date.now() - startTime,
        model_used: 'gpt-4o-mini',
      },
    };

    return response;
  } catch (error) {
    console.error('Error generating LLM response:', error);
    throw new Error('Failed to generate policy response');
  }
}

/**
 * Generate layer 2: Explanation
 * Why user is eligible/not eligible for certain schemes
 */
function generateExplanation(
  eligiblePolicies: ProcessedPolicy[],
  allPolicies: ProcessedPolicy[],
  userProfile?: Partial<UserProfile>,
): LLMResponse['explanation'] {
  let whyEligible = '';
  let missingRequirements = '';
  let nextSteps = '';

  // Generate "why eligible" message
  if (eligiblePolicies.length > 0) {
    const topPolicies = eligiblePolicies.slice(0, 2).map((p) => p.policy_name);
    whyEligible = `You are eligible for: ${topPolicies.join(', ')}`;
  } else {
    whyEligible = 'You are not currently eligible for the analyzed schemes.';
  }

  // Generate "missing requirements" message
  const partiallyEligible = allPolicies.filter(
    (p) => p.eligibility_check.status === 'partially_eligible',
  );

  if (partiallyEligible.length > 0 && userProfile) {
    const missing = partiallyEligible[0].eligibility_check.missingFields;
    if (missing.length > 0) {
      missingRequirements =
        `To become eligible for ${partiallyEligible[0].policy_name}, provide: ${missing.join(', ')}`;
    }
  }

  // Generate "next steps" message
  if (eligiblePolicies.length > 0) {
    nextSteps =
      `Visit the official scheme portal and submit your application with required documents.`;
  } else if (partiallyEligible.length > 0) {
    nextSteps =
      `Complete your profile with missing information to unlock more schemes.`;
  } else {
    nextSteps =
      `Check back later for new schemes, or contact your local government office for options.`;
  }

  return {
    why_eligible: whyEligible,
    missing_requirements: missingRequirements || undefined,
    next_steps: nextSteps,
  };
}

/**
 * Generate short summary for card display
 * Used in chat UI for showing answers in cards
 */
export function generateCardSummary(llmResponse: LLMResponse): string {
  return llmResponse.answer.split('\n')[0].substring(0, 150) + '...';
}

/**
 * Validate LLM response
 * Ensure response contains required fields and is properly formatted
 */
export function validateLLMResponse(response: LLMResponse): boolean {
  return (
    !!response.answer &&
    !!response.explanation &&
    response.metadata.policies_analyzed >= 0
  );
}
