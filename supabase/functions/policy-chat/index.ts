/// <reference lib="deno.window" />
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PolicyAssistantRequest {
  user_query: string;
  user_profile?: Record<string, unknown>;
  retrieved_context?: unknown[];
  messages?: Array<{ role: string; content: string }>;
  profile?: Record<string, unknown>;
  policies?: unknown[];
}

async function processWithGemini(
  userQuery: string,
  profile: Record<string, unknown>,
  policies: unknown[],
  GEMINI_API_KEY: string
): Promise<string> {
  const prompt = `You are an AI assistant helping users understand and apply for Indian government schemes.

User Profile:
${JSON.stringify(profile, null, 2)}

Matched Policies:
${JSON.stringify(policies, null, 2)}

User Question:
${userQuery}

Instructions:
* Answer EXACTLY what the user asked
* If user asks "how to apply", give step-by-step process
* If user asks benefits, explain benefits clearly
* If user asks eligibility, explain eligibility based on their profile
* DO NOT repeat generic recommendations
* Be conversational and helpful

Answer:`;

  console.log("USER QUERY:", userQuery);
  console.log("Calling Gemini...");
  console.log("API KEY EXISTS:", !!GEMINI_API_KEY);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log("Gemini RAW DATA:", JSON.stringify(data, null, 2));

  const candidate = data?.candidates?.[0];
  if (!candidate) {
    throw new Error("No candidates returned from Gemini");
  }

  const answer = candidate?.content?.parts?.[0]?.text;
  if (!answer) {
    throw new Error("Empty Gemini response");
  }

  console.log("GEMINI RESPONSE:", answer);
  return answer;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: PolicyAssistantRequest = await req.json();

    const userQuery = body.user_query || (body.messages?.[body.messages.length - 1]?.content || "");
    const userProfile = (body.user_profile || body.profile || {}) as Record<string, unknown>;
    const retrievedContext = body.retrieved_context || body.policies || [];

    if (!userQuery || userQuery.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Please ask a clear policy question." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (retrievedContext.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No policies were available for this query." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in Supabase secrets");
    }

    const aiRaw = await processWithGemini(userQuery, userProfile, retrievedContext, GEMINI_API_KEY);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          answer: aiRaw,
          full_details: retrievedContext,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("FULL ERROR:", error);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
