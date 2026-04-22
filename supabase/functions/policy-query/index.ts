import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =====================
// TYPES
// =====================
interface UserProfile {
  age?: number | null;
  gender?: string | null;
  income?: number | null;
  occupation?: string | null;
  state?: string | null;
  category?: string | null;
  is_rural?: boolean | null;
}

interface PolicyRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  benefits: string[];
  target_occupations: string[];
  target_states: string[];
  target_categories: string[];
  is_rural_only: boolean;
  min_age?: number | null;
  max_age?: number | null;
  max_income?: number | null;
  target_gender?: string | null;
  embedding?: number[] | null;
  apply_link?: string | null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

interface ProcessedPolicy {
  policy_id: string;
  policy_name: string;
  eligibility_summary: string;
  benefits_summary: string;
  key_conditions: string[];
  eligibility_check: {
    status: 'eligible' | 'partially_eligible' | 'ineligible';
    score: number;
    reasons: string[];
  };
  relevance_score: number;
}

interface LLMResponse {
  answer: string;
  explanation: {
    why_eligible: string;
    missing_requirements?: string;
    next_steps?: string;
  };
  full_details: {
    processed_policies: ProcessedPolicy[];
    user_matching_profile: Partial<UserProfile>;
  };
  metadata: {
    policies_analyzed: number;
    processing_time_ms: number;
    model_used: string;
  };
}

interface PolicyQueryResponse {
  success: boolean;
  data?: LLMResponse;
  error?: string;
}

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

// =====================
// INIT
// =====================
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // Use service role for admin access
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// =====================
// EMBEDDINGS UTILS
// =====================

const HF_EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2";
const HF_CHAT_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

/**
 * Detect query language in a lightweight way for multilingual prompting.
 */
function detectLanguageCode(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu";
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml";
  return "en";
}

/**
 * Generate embedding using Hugging Face feature extraction API.
 * Falls back to keyword matching if HF is unavailable.
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const apiKey = Deno.env.get("HF_API_KEY");
    if (!apiKey) return null;

    const response = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_EMBEDDING_MODEL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: text,
          options: {
            wait_for_model: true,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn("HF embedding failed, falling back to keyword search");
      return null;
    }

    const raw = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      console.warn("HF embedding returned non-JSON response");
      return null;
    }
    // HF can return [number[]] or number[] depending on model pipeline.
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      return data[0] as number[];
    }
    if (Array.isArray(data) && typeof data[0] === "number") {
      return data as number[];
    }
    return null;
  } catch (err) {
    console.warn("Error generating embedding:", err);
    return null;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Keyword matching fallback (simple but effective)
 */
function keywordSimilarity(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
  return queryWords.reduce((score, word) => {
    return score + (textLower.includes(word) ? 1 : 0);
  }, 0) / queryWords.length;
}

// =====================
// RAG RETRIEVAL
// =====================

/**
 * Retrieve top K policies using vector similarity (if embeddings available)
 * Falls back to keyword matching
 */
async function retrievePolicies(
  query: string,
  topK: number = 5,
  userProfile?: UserProfile
): Promise<PolicyRecord[]> {
  try {
    // Fetch all policies
    const { data: policies, error } = await supabase
      .from("policies")
      .select("*");

    if (error || !policies) {
      throw new Error(`Failed to fetch policies: ${error?.message}`);
    }

    const allPolicies = policies as PolicyRecord[];

    // Apply basic filters based on user profile
    let filtered = allPolicies;
    if (userProfile) {
      filtered = allPolicies.filter((p) => {
        // Check income filter
        if (userProfile.income && p.max_income && userProfile.income > p.max_income) {
          return false;
        }
        // Check state filter
        const targetStates = asStringArray(p.target_states);
        if (userProfile.state && targetStates.length > 0 && !targetStates.includes(userProfile.state)) {
          return false;
        }
        return true;
      });
    }

    const isFarmer = (userProfile?.occupation || "").toLowerCase().includes("farmer");
    const isLowIncome = !!userProfile?.income && userProfile.income <= 300000;
    const isRural = !!userProfile?.is_rural;

    // Try vector similarity first
    let scoredPolicies = filtered;
    const queryEmbedding = await generateEmbedding(query);

    if (queryEmbedding && queryEmbedding.length > 0) {
      // Vector similarity scoring
      scoredPolicies = filtered
        .map((p) => {
          let similarity = 0;
          if (p.embedding && Array.isArray(p.embedding) && p.embedding.length > 0) {
            similarity = cosineSimilarity(queryEmbedding, p.embedding);
          }
          let personalizedBoost = 0;
          const category = (p.category || "").toLowerCase();
          const desc = `${p.title} ${p.description}`.toLowerCase();

          const targetOccupations = asStringArray(p.target_occupations);
          if (
            isFarmer &&
            (
              category.includes("agri") ||
              desc.includes("farmer") ||
              targetOccupations.some((o) => o.toLowerCase().includes("farmer"))
            )
          ) {
            personalizedBoost += 0.1;
          }
          if (isLowIncome && (desc.includes("subsid") || p.max_income !== null && p.max_income !== undefined)) {
            personalizedBoost += 0.08;
          }
          if (isRural && (p.is_rural_only || desc.includes("rural"))) {
            personalizedBoost += 0.08;
          }

          return {
            ...p,
            score: similarity + personalizedBoost,
          };
        })
        .sort((a, b) => b.score - a.score);
    } else {
      // Fallback: keyword matching
      const queryText = query;
      scoredPolicies = filtered
        .map((p) => {
          const text = `${p.title} ${p.description} ${Array.isArray(p.benefits) ? p.benefits.join(" ") : p.benefits || ""}`;
          const similarity = keywordSimilarity(queryText, text);
          let personalizedBoost = 0;
          const category = (p.category || "").toLowerCase();
          const desc = `${p.title} ${p.description}`.toLowerCase();

          const targetOccupations = asStringArray(p.target_occupations);
          if (
            isFarmer &&
            (
              category.includes("agri") ||
              desc.includes("farmer") ||
              targetOccupations.some((o) => o.toLowerCase().includes("farmer"))
            )
          ) {
            personalizedBoost += 0.1;
          }
          if (isLowIncome && (desc.includes("subsid") || p.max_income !== null && p.max_income !== undefined)) {
            personalizedBoost += 0.08;
          }
          if (isRural && (p.is_rural_only || desc.includes("rural"))) {
            personalizedBoost += 0.08;
          }

          return {
            ...p,
            score: similarity + personalizedBoost,
          };
        })
        .sort((a, b) => b.score - a.score);
    }

    return scoredPolicies.slice(0, topK) as PolicyRecord[];
  } catch (error) {
    console.error("Error in RAG retrieval:", error);
    throw error;
  }
}

// =====================
// ELIGIBILITY CHECK
// =====================

interface EligibilityCheck {
  status: 'eligible' | 'partially_eligible' | 'ineligible';
  score: number;
  reasons: string[];
}

function checkEligibility(profile: UserProfile, policy: PolicyRecord): EligibilityCheck {
  const reasons: string[] = [];
  let passedChecks = 0;
  let totalChecks = 0;

  // Age check
  if (policy.min_age || policy.max_age) {
    totalChecks++;
    if (profile.age) {
      if (policy.min_age && profile.age < policy.min_age) {
        reasons.push(`Minimum age: ${policy.min_age} years`);
      } else if (policy.max_age && profile.age > policy.max_age) {
        reasons.push(`Maximum age: ${policy.max_age} years`);
      } else {
        passedChecks++;
      }
    }
  }

  // Income check
  if (policy.max_income) {
    totalChecks++;
    if (profile.income) {
      if (profile.income > policy.max_income) {
        reasons.push(`Max income: ₹${(policy.max_income / 100000).toFixed(1)}L`);
      } else {
        passedChecks++;
      }
    }
  }

  // Gender check
  if (policy.target_gender && policy.target_gender !== "Any") {
    totalChecks++;
    if (profile.gender) {
      if (profile.gender.toLowerCase() === policy.target_gender.toLowerCase()) {
        passedChecks++;
      } else {
        reasons.push(`For ${policy.target_gender} only`);
      }
    }
  }

  // State check
  const policyTargetStates = asStringArray(policy.target_states);
  if (policyTargetStates.length > 0) {
    totalChecks++;
    if (profile.state && policyTargetStates.includes(profile.state)) {
      passedChecks++;
    } else if (profile.state) {
      reasons.push(`Available in: ${policyTargetStates.slice(0, 3).join(", ")}`);
    }
  }

  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 50;
  const status = score === 100 ? "eligible" : score >= 50 ? "partially_eligible" : "ineligible";

  return { status, score, reasons };
}

// =====================
// HUGGING FACE LLM
// =====================

async function generateLLMResponse(
  query: string,
  processedPolicies: ProcessedPolicy[],
  userProfile?: UserProfile,
  chatHistory: HistoryMessage[] = [],
): Promise<LLMResponse> {
  const startTime = Date.now();
  const apiKey = Deno.env.get("HF_API_KEY");

  if (!apiKey) {
    throw new Error("HF_API_KEY is not configured. Please contact support.");
  }

  // Build context from processed policies
  const eligiblePolicies = processedPolicies.filter(
    (p) => p.eligibility_check.status !== "ineligible"
  );

  const languageCode = detectLanguageCode(query);
  const topEligiblePolicies = eligiblePolicies.slice(0, 3).map((p) => ({
    policy_name: p.policy_name,
    eligibility_summary: p.eligibility_summary,
    benefits_summary: p.benefits_summary,
  }));
  const topNotEligiblePolicies = processedPolicies
    .filter((p) => p.eligibility_check.status === "ineligible")
    .slice(0, 3)
    .map((p) => ({
      policy_name: p.policy_name,
      reasons: p.eligibility_check.reasons,
    }));

  const prompt = `You are Policy Lens AI — a smart, friendly assistant that helps users understand government schemes.

You are speaking to a real user. Be natural, conversational, and helpful.

---

User Profile:
${JSON.stringify(userProfile || {}, null, 2)}

Eligible Policies:
${JSON.stringify(topEligiblePolicies, null, 2)}

Not Eligible Policies:
${JSON.stringify(topNotEligiblePolicies, null, 2)}

User Question:
${query}

---

Instructions:

* Speak like a human, not a system
* Do NOT list everything blindly
* Pick the most relevant 2–3 policies
* Explain WHY they match the user
* If user says "I am a student", prioritize youth/education schemes
* If something is not eligible, explain simply
* Give helpful suggestions
* Guide next steps

---

Tone:

Friendly, supportive, clear

Example style:

"Since you're a student, there are a couple of schemes that could really help you 👇"

---

Structure:

1. Friendly intro
2. Best matching schemes (2–3 only)
3. Why they fit
4. Short note on exclusions (if relevant)
5. Actionable next step
6. Ask a follow-up question

---

Rules:

* NO hallucination
* ONLY use given policies
* NO generic answers
* NO dumping all policies
* Respond in the same language as the user query. Language code: ${languageCode}
* Use conversation history to avoid repeating prior explanations

Conversation History:
${JSON.stringify(chatHistory.slice(-5), null, 2)}

---

End with a question like:
"Do you want help applying for one of these or finding more student-focused schemes?"`;

  function deterministicHumanAnswer(): string {
    const top = eligiblePolicies.slice(0, 3);
    const intro = "Based on your profile, a few schemes stand out as especially useful for you.";
    const recs = top.length > 0
      ? top
          .map((p) => `- ${p.policy_name}: ${p.benefits_summary || p.eligibility_summary}`)
          .join("\n")
      : "- I could not find a fully eligible scheme yet, but I can help you target near-match options.";
    const exclusions = processedPolicies
      .filter((p) => p.eligibility_check.status === "ineligible")
      .slice(0, 2)
      .map((p) => `${p.policy_name} (${p.eligibility_check.reasons.slice(0, 1).join(", ") || "criteria mismatch"})`)
      .join("; ");
    const exclusionLine = exclusions
      ? `Some schemes are not a fit yet: ${exclusions}.`
      : "Most shortlisted schemes look reasonably aligned with your profile.";
    return `${intro}\n\n${recs}\n\n${exclusionLine}\n\nWould you like help applying for one of these?`;
  }

  function buildFallbackResponse(answer: string, modelUsed = "hf-fallback"): LLMResponse {
    const cleaned = (answer || "").trim();
    const looksLikeHtml = /<html|<!doctype|<head|<body|cannot post/i.test(cleaned);
    const safeAnswer = (!cleaned || looksLikeHtml)
      ? deterministicHumanAnswer()
      : cleaned;
    return {
      answer: safeAnswer,
      explanation: {
        why_eligible: eligiblePolicies.length > 0
          ? `You are eligible for ${eligiblePolicies.length} policy(ies): ${eligiblePolicies
              .map((p) => p.policy_name)
              .join(", ")}`
          : "Complete your profile for personalized recommendations.",
        missing_requirements:
          processedPolicies.some((p) => p.eligibility_check.status === "partially_eligible")
            ? "Some requirements are missing. Check policy details."
            : undefined,
        next_steps: "Visit the apply links in the full details below to apply.",
      },
      full_details: {
        processed_policies: processedPolicies,
        user_matching_profile: userProfile || {},
      },
      metadata: {
        policies_analyzed: processedPolicies.length,
        processing_time_ms: Date.now() - startTime,
        model_used: modelUsed,
      },
    };
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_CHAT_MODEL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${prompt} [/INST]`,
          parameters: {
            max_new_tokens: 280,
            temperature: 0.2,
            return_full_text: false,
          },
          options: {
            wait_for_model: true,
          }
        }),
      }
    );

    const raw = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {
      // Try a secondary HF endpoint before falling back.
      const alt = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: HF_CHAT_MODEL,
          messages: [
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 280,
        }),
      });
      const altRaw = await alt.text();
      try {
        const altData = JSON.parse(altRaw);
        const altContent = altData?.choices?.[0]?.message?.content;
        if (typeof altContent === "string" && altContent.trim().length > 0) {
          return buildFallbackResponse(altContent.trim(), "hf-router-chat-completions");
        }
      } catch {
        return buildFallbackResponse(raw, "hf-plain-text-fallback");
      }
      return buildFallbackResponse(altRaw, "hf-router-fallback");
    }

    // Proper error handling
    if (response.status === 429) {
      throw new Error("Hugging Face API rate limit exceeded. Please try again in a moment.");
    }

    if (response.status === 401 || response.status === 403) {
      console.error("HF API auth failed. Check HF_API_KEY in Supabase secrets.");
      throw new Error("AI service authentication failed. Please contact support.");
    }

    if (data?.error) {
      console.error("HF error:", data.error);
      throw new Error(`AI service error: ${data.error.message || "Unknown error"}`);
    }

    // Extract answer safely
    let answer = "Unable to generate response at this time.";
    if (Array.isArray(data) && data.length > 0 && typeof data[0]?.generated_text === "string") {
      answer = data[0].generated_text;
    } else if (typeof data?.generated_text === "string") {
      answer = data.generated_text;
    } else if (typeof data?.answer === "string") {
      answer = data.answer;
    }

    if (!answer || answer.trim().length === 0) {
      throw new Error("Empty response from Hugging Face API");
    }

    if (eligiblePolicies.length === 0) {
      answer = "No relevant policy found";
    }

    return buildFallbackResponse(answer.trim(), HF_CHAT_MODEL);
  } catch (error) {
    console.error("Error generating LLM response:", error);
    return buildFallbackResponse(
      "I could not contact the AI model right now. Please try again in a few seconds.",
      "hf-error-fallback",
    );
  }
}

// =====================
// MAIN HANDLER
// =====================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const body = await req.json();
    const { query, user_profile, top_k, chat_history } = body;
    const safeHistory: HistoryMessage[] = Array.isArray(chat_history)
      ? chat_history
          .filter((m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0
          )
          .slice(-5)
      : [];

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Query is required and must be a string",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Retrieve relevant policies using RAG
    const retrievedPolicies = await retrievePolicies(
      query,
      top_k || 5,
      user_profile
    );

    if (retrievedPolicies.length === 0) {
      throw new Error("No policies found. Please try a different query.");
    }

    // 2. Process policies - check eligibility
    const processedPolicies: ProcessedPolicy[] = retrievedPolicies.map((p) => {
      const eligibility = user_profile ? checkEligibility(user_profile, p) : {
        status: "partially_eligible",
        score: 50,
        reasons: [],
      };

      return {
        policy_id: p.id,
        policy_name: p.title,
        eligibility_summary: p.description.substring(0, 100),
        benefits_summary: Array.isArray(p.benefits) ? p.benefits.slice(0, 2).join(", ") : p.benefits || "",
        key_conditions: [
          p.min_age && p.max_age ? `Age: ${p.min_age}-${p.max_age}` : "",
          p.max_income ? `Max Income: ₹${(p.max_income / 100000).toFixed(1)}L` : "",
        ].filter(Boolean),
        eligibility_check: eligibility,
        relevance_score: eligibility.score,
      };
    });

    const relevantPolicies = processedPolicies.filter((p) => p.relevance_score >= 50);

    if (relevantPolicies.length === 0) {
      const noMatchResponse: LLMResponse = {
        answer: "No relevant policy found",
        explanation: {
          why_eligible: "No relevant policy found",
          next_steps: "Update your profile details and ask a more specific policy question.",
        },
        full_details: {
          processed_policies: processedPolicies,
          user_matching_profile: user_profile || {},
        },
        metadata: {
          policies_analyzed: processedPolicies.length,
          processing_time_ms: 0,
          model_used: "rules-fallback",
        },
      };

      return new Response(JSON.stringify({ success: true, data: noMatchResponse } as PolicyQueryResponse), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 3. Generate LLM response
    const llmResponse = await generateLLMResponse(
      query,
      relevantPolicies,
      user_profile,
      safeHistory,
    );

    // 4. Return response
    const result: PolicyQueryResponse = {
      success: true,
      data: llmResponse,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});