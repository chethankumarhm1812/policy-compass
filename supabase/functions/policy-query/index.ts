import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { query, user_id, user_profile, chat_history, allow_profile_access, language } = body;
    const userLanguage = language === 'kn' ? 'kn' : 'en';

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const useProfile = allow_profile_access !== false;
    let profile = {} as Record<string, unknown>;

    if (useProfile) {
      profile = user_profile || {};
      if (user_id) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("age, gender, income, occupation, state, category, is_rural")
          .eq("user_id", user_id)
          .maybeSingle();
        if (profileRow) profile = profileRow;
      }
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Build chat history context
    const historyText = Array.isArray(chat_history) && chat_history.length > 0
      ? chat_history
          .slice(-5)
          .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
          .join("\n")
      : "";

    // Build profile summary
    const profileText = Object.keys(profile).length > 0
      ? Object.entries(profile)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : userLanguage === 'kn' ? 'ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ' : 'No profile information available';

    const profileLabel = userLanguage === 'kn' ? 'ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ:' : 'User Profile:';
    const conversationLabel = userLanguage === 'kn' ? 'ಹಿಂದಿನ ಸಂಭಾಷಣೆ:' : 'Previous conversation:';
    const languageInstruction = userLanguage === 'kn'
      ? 'ಈ ಪ್ರಶ್ನೆಗೆ ವಿಶೇಷವಾಗಿ ಮೂಲ ಕನ್ನಡ ಭಾಷೆಯಲ್ಲಿ, ಗ್ರಾಮೀಣ ಮತ್ತು ದೈನಂದಿನ ಬಳಕೆಯ ಪದಗಳಲ್ಲಿ ಉತ್ತರಿಸಿ. ಉತ್ತರವು ಎಲ್ಲರೂ ಸುಲಭವಾಗಿ ಮನನಾಗುವಂತೆ, ಉದಾಹರಣೆಗಳೊಂದಿಗೆ ಮತ್ತು ನೈಜ ಸಂಭಾಷಣೆಯ ಶೈಲಿಯಲ್ಲಿ ಇರಲಿ.'
      : 'Answer in clear and simple English.';

    const prompt = `You are a helpful AI assistant for Indian government schemes and policies.

${profileLabel} ${profileText}
${historyText ? `\n${conversationLabel}\n${historyText}\n` : ""}
User Question: ${query}

${languageInstruction}

Answer:`;

    console.log("USER QUERY:", query);
    console.log("PROFILE:", profileText);
    console.log("Calling Gemini...");

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error (${geminiRes.status}): ${errText}`);
    }

    const geminiData = await geminiRes.json();
    console.log("Gemini RAW DATA:", JSON.stringify(geminiData, null, 2));

    const candidate = geminiData?.candidates?.[0];
    if (!candidate) throw new Error("No candidates returned from Gemini");

    const answer = candidate?.content?.parts?.[0]?.text?.trim();
    if (!answer) throw new Error("Empty response from Gemini");

    console.log("GEMINI ANSWER:", answer);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          answer,
          explanation: {
            why_eligible: "",
            missing_requirements: "",
            next_steps: "",
          },
          full_details: {
            processed_policies: [],
            user_matching_profile: profile,
          },
          metadata: {
            policies_analyzed: 0,
            processing_time_ms: 0,
            model_used: "gemini-2.5-flash",
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("FULL ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
