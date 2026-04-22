/**
 * PPRAG (POLICY PROCESSING RAG) MODULE
 * Process and structure retrieved policies
 * Extract key information and prepare for LLM
 */

import {
  PolicyRecord,
  ProcessedPolicy,
  EligibilityResult,
  UserProfile,
} from './types';
import { checkEligibility } from './eligibilityEngine';

/**
 * Process a single policy - extract and structure key information
 */
export function processSinglePolicy(
  policy: PolicyRecord,
  userProfile?: Partial<UserProfile>,
): ProcessedPolicy {
  // Generate eligibility check if user profile provided
  let eligibilityResult: EligibilityResult = {
    status: 'ineligible',
    score: 0,
    reasons: [],
    matchedRules: {},
    missingFields: [],
  };
  let relevanceScore = 50;

  if (userProfile) {
    eligibilityResult = checkEligibility(userProfile, policy);
    // Relevance score based on eligibility
    relevanceScore = eligibilityResult.score;
  }

  // Extract key eligibility conditions (top 3-4)
  const keyConditions = extractKeyConditions(policy);

  // Generate concise summaries
  const eligibilitySummary = generateEligibilitySummary(
    policy,
    eligibilityResult,
  );
  const benefitsSummary = generateBenefitsSummary(policy);

  return {
    policy_id: policy.id,
    policy_name: policy.title,
    eligibility_summary: eligibilitySummary,
    benefits_summary: benefitsSummary,
    key_conditions: keyConditions,
    eligibility_check: eligibilityResult,
    relevance_score: relevanceScore,
  };
}

/**
 * Process multiple policies (batch)
 */
export function processMultiplePolicies(
  policies: PolicyRecord[],
  userProfile?: Partial<UserProfile>,
): ProcessedPolicy[] {
  return policies.map((policy) =>
    processSinglePolicy(policy, userProfile),
  );
}

/**
 * Extract top 3-4 key eligibility conditions from policy
 */
function extractKeyConditions(policy: PolicyRecord): string[] {
  const conditions: string[] = [];

  // Add age condition
  if (policy.min_age && policy.max_age) {
    conditions.push(`Age: ${policy.min_age}-${policy.max_age} years`);
  } else if (policy.min_age) {
    conditions.push(`Minimum age: ${policy.min_age} years`);
  }

  // Add income condition
  if (policy.max_income) {
    conditions.push(
      `Max annual income: ₹${(policy.max_income / 100000).toFixed(1)} lakhs`,
    );
  }

  // Add gender condition
  if (policy.target_gender && policy.target_gender !== 'Any') {
    conditions.push(`Gender: ${policy.target_gender}`);
  }

  // Add category condition
  if (policy.target_categories && policy.target_categories.length > 0) {
    const cats = policy.target_categories.join(', ');
    if (cats !== 'All') {
      conditions.push(`Category: ${cats}`);
    }
  }

  // Add rural/urban condition
  if (policy.is_rural_only) {
    conditions.push('Rural area only');
  }

  // Add occupations if specific
  if (
    policy.target_occupations &&
    policy.target_occupations.length > 0 &&
    policy.target_occupations[0] !== 'All'
  ) {
    conditions.push(`Occupations: ${policy.target_occupations.slice(0, 2).join(', ')}`);
  }

  return conditions.slice(0, 4); // Return top 4 conditions
}

/**
 * Generate concise eligibility summary (1-2 lines)
 */
function generateEligibilitySummary(
  policy: PolicyRecord,
  eligibilityResult: EligibilityResult,
): string {
  if (eligibilityResult.status === 'eligible') {
    const mainCondition = extractKeyConditions(policy)[0] || 'specified criteria';
    return `✅ You are eligible for this scheme (${mainCondition})`;
  } else if (eligibilityResult.status === 'partially_eligible') {
    const missing = eligibilityResult.missingFields[0] || 'some criteria';
    return `⚠️ Partially eligible. Missing: ${missing}`;
  } else {
    const reason = eligibilityResult.reasons[0] || 'eligibility criteria';
    return `❌ Not eligible: ${reason}`;
  }
}

/**
 * Generate concise benefits summary (1-2 lines)
 */
function generateBenefitsSummary(policy: PolicyRecord): string {
  if (!policy.benefits || policy.benefits.length === 0) {
    return 'Direct monetary or non-monetary benefits';
  }

  const topBenefit = policy.benefits[0];
  const benefitCount = policy.benefits.length;

  if (benefitCount === 1) {
    return topBenefit;
  }

  return `${topBenefit} + ${benefitCount - 1} more benefits`;
}

/**
 * Create structured context for LLM
 * This is what gets passed to the LLM as context
 */
export function createLLMContext(
  processedPolicies: ProcessedPolicy[],
  userProfile?: Partial<UserProfile>,
): string {
  let context = '## POLICY CONTEXT FOR AI ASSISTANT\n\n';

  // Add user profile if available
  if (userProfile) {
    context += '### User Profile\n';
    context += `- Age: ${userProfile.age || 'Not specified'}\n`;
    context += `- Income: ₹${userProfile.income?.toLocaleString() || 'Not specified'}\n`;
    context += `- Location: ${userProfile.state || 'Not specified'}, ${userProfile.district || ''}\n`;
    context += `- Occupation: ${userProfile.occupation || 'Not specified'}\n`;
    context += `- Category: ${userProfile.category || 'General'}\n`;
    context += `- Rural: ${userProfile.is_rural ? 'Yes' : 'No'}\n\n`;
  }

  // Add processed policies
  context += '### Relevant Policies\n\n';

  processedPolicies.forEach((policy, index) => {
    context += `**${index + 1}. ${policy.policy_name}** (Relevance: ${policy.relevance_score.toFixed(0)}%)\n`;
    context += `- Eligibility: ${policy.eligibility_summary}\n`;
    context += `- Benefits: ${policy.benefits_summary}\n`;
    context += `- Key Conditions: ${policy.key_conditions.join(', ')}\n\n`;
  });

  context += '### Instructions for AI Assistant\n';
  context +=
    '- Provide a SHORT answer (2-3 sentences)\n';
  context += '- Only mention policies the user is eligible for\n';
  context += '- Be concise and user-friendly\n';
  context += '- Avoid technical jargon\n';

  return context;
}

/**
 * Filter processed policies by eligibility status
 */
export function filterProcessedPoliciesByEligibility(
  processedPolicies: ProcessedPolicy[],
  status: 'eligible' | 'partially_eligible' | 'ineligible',
): ProcessedPolicy[] {
  return processedPolicies.filter(
    (policy) => policy.eligibility_check.status === status,
  );
}

/**
 * Sort processed policies by relevance score
 */
export function sortByRelevance(
  processedPolicies: ProcessedPolicy[],
): ProcessedPolicy[] {
  return [...processedPolicies].sort(
    (a, b) => b.relevance_score - a.relevance_score,
  );
}

/**
 * Get eligible policies for user
 */
export function getEligiblePolicies(
  processedPolicies: ProcessedPolicy[],
): ProcessedPolicy[] {
  return filterProcessedPoliciesByEligibility(
    processedPolicies,
    'eligible',
  ).slice(0, 5); // Top 5 eligible policies
}
