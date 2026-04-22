/**
 * ELIGIBILITY ENGINE
 * Check user eligibility against policies
 * Updated to work with types.ts and PPRAG module
 */

import {
  UserProfile,
  PolicyRecord as Policy,
  EligibilityResult,
} from './types';

// Re-export types for backwards compatibility
export type { UserProfile, PolicyRecord as Policy, EligibilityResult } from './types';

export function checkEligibility(profile: UserProfile, policy: Policy): EligibilityResult {
  const reasons: string[] = [];
  const matchedRules: Record<string, string> = {};
  const missingFields: string[] = [];
  let totalChecks = 0;
  let passedChecks = 0;

  // Age check
  if (policy.min_age != null || policy.max_age != null) {
    totalChecks++;
    if (profile.age == null) {
      missingFields.push('age');
    } else {
      if (policy.min_age != null && profile.age < policy.min_age) {
        reasons.push(`Minimum age requirement is ${policy.min_age}, you are ${profile.age}`);
      } else if (policy.max_age != null && profile.age > policy.max_age) {
        reasons.push(`Maximum age is ${policy.max_age}, you are ${profile.age}`);
      } else {
        passedChecks++;
        matchedRules['age'] = `Age ${profile.age} is within ${policy.min_age || 0}-${policy.max_age || '∞'}`;
      }
    }
  }

  // Income check
  if (policy.max_income != null) {
    totalChecks++;
    if (profile.income == null) {
      missingFields.push('income');
    } else if (profile.income > policy.max_income) {
      reasons.push(`Maximum income limit is ₹${policy.max_income.toLocaleString()}, your income is ₹${profile.income.toLocaleString()}`);
    } else {
      passedChecks++;
      matchedRules['income'] = `Income ₹${profile.income.toLocaleString()} is below ₹${policy.max_income.toLocaleString()}`;
    }
  }

  // Gender check
  if (policy.target_gender) {
    totalChecks++;
    if (!profile.gender) {
      missingFields.push('gender');
    } else if (profile.gender.toLowerCase() !== policy.target_gender.toLowerCase()) {
      reasons.push(`This scheme is for ${policy.target_gender} applicants only`);
    } else {
      passedChecks++;
      matchedRules['gender'] = `Gender matches: ${profile.gender}`;
    }
  }

  // Occupation check
  if (policy.target_occupations?.length > 0) {
    totalChecks++;
    if (!profile.occupation) {
      missingFields.push('occupation');
    } else if (!policy.target_occupations.includes(profile.occupation.toLowerCase())) {
      reasons.push(`This scheme targets: ${policy.target_occupations.join(', ')}`);
    } else {
      passedChecks++;
      matchedRules['occupation'] = `Occupation "${profile.occupation}" is eligible`;
    }
  }

  // State check
  if (policy.target_states?.length > 0) {
    totalChecks++;
    if (!profile.state) {
      missingFields.push('state');
    } else if (!policy.target_states.includes(profile.state)) {
      reasons.push(`This scheme is available in: ${policy.target_states.join(', ')}`);
    } else {
      passedChecks++;
      matchedRules['state'] = `State "${profile.state}" is covered`;
    }
  }

  // Category check
  if (policy.target_categories?.length > 0) {
    totalChecks++;
    if (!profile.category) {
      missingFields.push('category');
    } else if (!policy.target_categories.includes(profile.category)) {
      reasons.push(`This scheme is for categories: ${policy.target_categories.join(', ')}`);
    } else {
      passedChecks++;
      matchedRules['category'] = `Category "${profile.category}" is eligible`;
    }
  }

  // Rural check
  if (policy.is_rural_only) {
    totalChecks++;
    if (profile.is_rural == null) {
      missingFields.push('is_rural');
    } else if (!profile.is_rural) {
      reasons.push('This scheme is for rural areas only');
    } else {
      passedChecks++;
      matchedRules['location'] = 'Rural area requirement met';
    }
  }

  // Land ownership (from eligibility_rules)
  const rules = policy.eligibility_rules as Record<string, unknown>;
  if (rules?.owns_land === true) {
    totalChecks++;
    if (profile.owns_land == null) {
      missingFields.push('owns_land');
    } else if (!profile.owns_land) {
      reasons.push('Land ownership is required for this scheme');
    } else {
      passedChecks++;
      matchedRules['land'] = 'Land ownership verified';
    }
  }

  // Determine status
  if (totalChecks === 0) totalChecks = 1; // avoid division by zero
  const score = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

  let status: 'eligible' | 'partially_eligible' | 'ineligible';
  if (reasons.length === 0 && missingFields.length === 0) {
    status = 'eligible';
  } else if (reasons.length === 0 && missingFields.length > 0) {
    status = 'partially_eligible';
  } else if (passedChecks > 0 && missingFields.length > 0) {
    status = 'partially_eligible';
  } else {
    status = 'ineligible';
  }

  return { status, reasons, matchedRules, missingFields, score };
}

/**
 * Rank policies for a user based on eligibility and benefit score
 * Returns policies sorted by eligibility status then benefit score
 */
export function rankPolicies(
  profile: UserProfile,
  policies: Policy[],
): (Policy & { eligibility: EligibilityResult })[] {
  return policies
    .map((policy) => ({
      ...policy,
      eligibility: checkEligibility(profile, policy),
    }))
    .sort((a, b) => {
      const statusOrder = { eligible: 0, partially_eligible: 1, ineligible: 2 };
      const statusDiff =
        statusOrder[a.eligibility.status] - statusOrder[b.eligibility.status];
      if (statusDiff !== 0) return statusDiff;
      return b.benefit_score - a.benefit_score;
    });
}
