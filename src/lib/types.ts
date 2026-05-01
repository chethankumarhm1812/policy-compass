/**
 * CORE TYPE DEFINITIONS
 * All types used across RAG, PPRAG, and eligibility modules
 */

// ✅ User Profile Types
export interface UserProfile {
  user_id?: string;
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  income?: number | null;
  occupation?: string | null;
  state?: string | null;
  district?: string | null;
  category?: string | null; // SC/ST/OBC/General
  is_rural?: boolean | null;
  owns_land?: boolean | null;
  has_business?: boolean | null;
}

// ✅ Policy Database Type
export interface PolicyRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  eligibility_rules: Record<string, unknown>;
  required_documents: string[];
  benefits: string[];
  application_steps: string[];
  apply_link?: string | null;
  min_age?: number | null;
  max_age?: number | null;
  max_income?: number | null;
  target_gender?: string | null;
  target_occupations: string[];
  target_states: string[];
  target_categories: string[];
  is_rural_only: boolean;
  benefit_score: number;
  embedding?: number[] | null; // Vector embedding
  created_at?: string;
}

// ✅ Eligibility Result Type
export interface EligibilityResult {
  status: 'eligible' | 'partially_eligible' | 'ineligible';
  score: number; // 0-100 percentage
  reasons: string[];
  matchedRules: Record<string, string>;
  missingFields: string[];
}

// ✅ PPRAG Processed Policy (Structured Output)
export interface ProcessedPolicy {
  policy_id: string;
  policy_name: string;
  eligibility_summary: string; // 1-2 line summary
  benefits_summary: string; // 1-2 line summary
  key_conditions: string[]; // Top 3-4 conditions
  eligibility_check: EligibilityResult;
  relevance_score: number; // 0-100
}

// ✅ RAG Retrieval Result
export interface RAGResult {
  retrieved_policies: PolicyRecord[];
  total_count: number;
  query_vector: number[];
}

// ✅ LLM Response Structure (3-Layer Output)
export interface LLMResponse {
  // Layer 1: Main answer
  answer: string; // 2-3 lines max

  // Layer 2: Explanation
  explanation: {
    why_eligible: string;
    missing_requirements?: string;
    next_steps?: string;
  };

  // Layer 3: Full details
  full_details: {
    processed_policies: ProcessedPolicy[];
    user_matching_profile: Partial<UserProfile>;
  };

  // Metadata
  metadata: {
    policies_analyzed: number;
    processing_time_ms: number;
    model_used: string;
  };
}

// ✅ Chat Message Type
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  llm_response?: LLMResponse;
}

// ✅ Edge Function Request/Response
export interface PolicyQueryRequest {
  query: string;
  user_id?: string;
  user_profile?: Partial<UserProfile>;
  top_k?: number; // Default 5
  chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface PolicyQueryResponse {
  success: boolean;
  data?: LLMResponse;
  error?: string;
}

// ✅ Embedding Type
export interface EmbeddingData {
  policy_id: string;
  policy_title: string;
  embedding: number[];
  created_at: string;
}
