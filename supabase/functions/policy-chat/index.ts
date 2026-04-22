/// <reference lib="deno.window" />
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Interface for incoming request
interface PolicyAssistantRequest {
  user_query: string;
  user_profile?: Record<string, unknown>;
  retrieved_context?: unknown[];
  messages?: Array<{ role: string; content: string }>;
  profile?: Record<string, unknown>;
  policies?: unknown[];
}

// Interface for response
interface PolicyAssistantResponse {
  summary: string;
  detailed_answer: string;
  personalized_recommendation: string;
  notes: string;
  updated_profile: Record<string, unknown>;
}

interface ParsedAssistantJSON extends PolicyAssistantResponse {}

/**
 * Extract profile updates from user query
 * E.g., "I earn 5 LPA" -> { income: 500000 }
 */
function extractProfileUpdates(query: string, currentProfile: Record<string, unknown>): Record<string, unknown> {
  const updates = { ...currentProfile };

  // Income patterns
  const incomeMatch = query.match(/(?:earn|earning|income|salary)\s+(?:of\s+)?(?:₹|rs\.?\s*)?(\d+(?:[.,]\d+)*)\s*(?:lpa|lakhs?|crores?|per annum)?/i);
  if (incomeMatch) {
    let income = parseInt(incomeMatch[1].replace(/[.,]/g, ""), 10);
    if (query.toLowerCase().includes("lpa") || query.toLowerCase().includes("lakhs")) {
      income *= 100000;
    } else if (query.toLowerCase().includes("crore")) {
      income *= 10000000;
    }
    updates.income = income;
  }

  // Age patterns
  const ageMatch = query.match(/(?:i'm|i am|age|aged)\s+(\d+)\s*(?:years?)?(?:\s+old)?/i);
  if (ageMatch) {
    updates.age = parseInt(ageMatch[1], 10);
  }

  // Gender patterns
  if (/\b(?:male|boy|man|he\/him)\b/i.test(query)) {
    updates.gender = "Male";
  } else if (/\b(?:female|girl|woman|she\/her)\b/i.test(query)) {
    updates.gender = "Female";
  }

  // Occupation patterns
  const occupationMatch = query.match(/(?:i'm|i am|work as|occupation|profession)\s+(?:a\s+)?([a-zA-Z\s]+?)(?:\s+and|\s+in|$)/i);
  if (occupationMatch) {
    updates.occupation = occupationMatch[1].trim();
  }

  // State/Location patterns
  const stateMatch = query.match(/(?:from|in|located in|state|live in)\s+([a-zA-Z\s]+?)(?:\s+(?:state|district)|,|\s+and|$)/i);
  if (stateMatch) {
    updates.state = stateMatch[1].trim();
  }

  return updates;
}

/**
 * Get personalized recommendation based on profile
 */
function getPersonalizedRecommendation(
  query: string,
  profile: Record<string, unknown>,
  retrievedContext: unknown[],
  baseRecommendation: string
): string {
  let personalized = baseRecommendation;

  // Income-based personalization
  const income = profile.income as number | undefined;
  if (income) {
    if (income < 300000) {
      personalized += "\n\n💰 **For your income level:** You may qualify for schemes specifically designed for low-income individuals. We've prioritized affordable options.";
    } else if (income > 1000000) {
      personalized += "\n\n💰 **For your income level:** You may qualify for premium/investor-focused schemes. We've highlighted advanced opportunities.";
    }
  }

  // Age-based personalization
  const age = profile.age as number | undefined;
  if (age) {
    if (age < 30) {
      personalized += "\n\n👤 **For your age:** Youth-specific schemes and skill development programs are available. These focus on career growth and education.";
    } else if (age > 60) {
      personalized += "\n\n👤 **For your age:** Senior citizen schemes with healthcare and pension benefits may be more relevant.";
    }
  }

  // Occupation-based personalization
  const occupation = profile.occupation as string | undefined;
  if (occupation) {
    personalized += `\n\n💼 **For your occupation (${occupation}):** We've filtered schemes applicable to your professional category.`;
  }

  // Missing information
  const missingFields = [];
  if (!profile.age) missingFields.push("age");
  if (!profile.income) missingFields.push("income");
  if (!profile.occupation) missingFields.push("occupation");

  if (missingFields.length > 0) {
    personalized += `\n\n⚠️ **To improve recommendations:** Please provide your ${missingFields.join(", ")} for more accurate results.`;
  }

  return personalized;
}

/**
 * Process user query with HuggingFace text generation API
 */
async function processWithHuggingFace(
  userQuery: string,
  profile: Record<string, unknown>,
  policies: unknown[],
  HF_API_KEY: string
): Promise<ParsedAssistantJSON> {
  const systemPrompt = `You are a multilingual AI Policy Assistant.

USER PROFILE:
${JSON.stringify(profile)}

AVAILABLE POLICIES:
${JSON.stringify(policies)}

USER QUESTION:
${userQuery}

INSTRUCTIONS:
- Answer ONLY using given policies (no external knowledge)
- Personalize:
  - Farmer -> agriculture schemes
  - Low income -> subsidy schemes
  - Rural -> rural benefits
- Respond in the SAME language as the user question
- If no policy matches, write exactly: "No relevant policy found"
- Explain clearly:
  - Why policy fits
  - What benefits user gets
  - What to do next
- Keep answers simple and non-technical

OUTPUT FORMAT (STRICT JSON ONLY, NO EXTRA TEXT):
{
  "summary": "Short answer",
  "detailed_answer": "Explanation in simple language",
  "personalized_recommendation": "Best policies for user",
  "notes": "Documents / steps / tips",
  "updated_profile": ${JSON.stringify(profile)}
}`;

  const response = await fetch(
    "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: systemPrompt,
        parameters: {
          max_new_tokens: 400,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 401) {
      throw new Error("HuggingFace API key is invalid.");
    }
    const errorText = await response.text();
    throw new Error(`AI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const aiText = data?.[0]?.generated_text || "";

  if (!aiText) {
    throw new Error("Unable to generate response");
  }

  // Extract JSON from the generated text and strip markdown if present
  const jsonText = aiText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Model did not return valid JSON");
  }

  const obj = parsed as Partial<ParsedAssistantJSON>;
  if (
    typeof obj.summary !== "string" ||
    typeof obj.detailed_answer !== "string" ||
    typeof obj.personalized_recommendation !== "string" ||
    typeof obj.notes !== "string" ||
    !obj.updated_profile ||
    typeof obj.updated_profile !== "object"
  ) {
    throw new Error("Model response missing required JSON fields");
  }

  return {
    summary: obj.summary,
    detailed_answer: obj.detailed_answer,
    personalized_recommendation: obj.personalized_recommendation,
    notes: obj.notes,
    updated_profile: obj.updated_profile as Record<string, unknown>,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: PolicyAssistantRequest = await req.json();

    // Extract data from request (support both old and new formats)
    const userQuery = body.user_query || (body.messages?.[body.messages.length - 1]?.content || "");
    const userProfile = (body.user_profile || body.profile || {}) as Record<string, unknown>;
    const retrievedContext = body.retrieved_context || body.policies || [];

    // Validation
    if (!userQuery || userQuery.trim().length === 0) {
      return new Response(
        JSON.stringify({
          summary: "No relevant policy found",
          detailed_answer: "No relevant policy found",
          personalized_recommendation: "No relevant policy found",
          notes: "Please ask a clear policy question.",
          updated_profile: userProfile,
        } as PolicyAssistantResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (retrievedContext.length === 0) {
      return new Response(
        JSON.stringify({
          summary: "No relevant policy found",
          detailed_answer: "No relevant policy found",
          personalized_recommendation: "No relevant policy found",
          notes: "No policies were available for this query.",
          updated_profile: userProfile,
        } as PolicyAssistantResponse),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const HF_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
    if (!HF_API_KEY) {
      throw new Error("HUGGINGFACE_API_KEY is not configured in Supabase secrets");
    }

    // Extract profile updates from query
    const updatedProfile = extractProfileUpdates(userQuery, userProfile);

    // Get strict JSON AI response and enforce returned profile object.
    const aiResponse = await processWithHuggingFace(userQuery, updatedProfile, retrievedContext, HF_API_KEY);

    const response: PolicyAssistantResponse = {
      summary: aiResponse.summary,
      detailed_answer: aiResponse.detailed_answer,
      personalized_recommendation: aiResponse.personalized_recommendation,
      notes: aiResponse.notes,
      updated_profile: aiResponse.updated_profile || updatedProfile,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({
        summary: "I'm having trouble generating a response right now. Could you try again?",
        detailed_answer: "I'm having trouble generating a response right now. Could you try again?",
        personalized_recommendation: "I'm having trouble generating a response right now. Could you try again?",
        notes: `Request could not be processed: ${errorMessage}`,
        updated_profile: {},
      } as PolicyAssistantResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
