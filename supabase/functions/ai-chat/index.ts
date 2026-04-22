import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  check_policy_eligibility,
  generate_ai_response,
  get_all_policies,
  get_latest_profile,
} from "../_shared/policy-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function scorePolicyForQuery(
  query: string,
  policy: { title: string; description: string; benefits?: string[] | null; category?: string | null },
): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const terms = q.split(/\s+/).filter((t) => t.length > 2);
  const haystack = `${policy.title} ${policy.description} ${policy.category ?? ""} ${(policy.benefits || []).join(" ")}`.toLowerCase();
  if (terms.length === 0) {
    return haystack.includes(q) ? 1 : 0;
  }
  const matches = terms.filter((t) => haystack.includes(t)).length;
  return matches / terms.length;
}

function retrieveRelevantPolicies<T extends { title: string; description: string; benefits?: string[] | null; category?: string | null }>(
  query: string,
  policies: T[],
  topK = 6,
): T[] {
  const scored = policies
    .map((policy) => ({ policy, score: scorePolicyForQuery(query, policy) }))
    .sort((a, b) => b.score - a.score);
  const withPositiveScore = scored.filter((item) => item.score > 0);
  if (withPositiveScore.length === 0) {
    return policies.slice(0, topK);
  }
  return withPositiveScore.slice(0, topK).map((item) => item.policy);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const user_id = typeof body?.user_id === "string" ? body.user_id : "";
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const chat_history = Array.isArray(body?.chat_history)
      ? body.chat_history
          .filter((item: unknown) => {
            if (!item || typeof item !== "object") return false;
            const row = item as Record<string, unknown>;
            return (
              (row.role === "user" || row.role === "assistant") &&
              typeof row.content === "string" &&
              row.content.trim().length > 0
            );
          })
          .slice(-5)
          .map((row: Record<string, unknown>) => ({
            role: row.role as "user" | "assistant",
            content: (row.content as string).trim(),
          }))
      : [];

    if (!user_id || !query) {
      return new Response(
        JSON.stringify({ error: "user_id and query are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const profile = await get_latest_profile(user_id);
    if (!profile) {
      return new Response(
        JSON.stringify({
          success: true,
          response:
            "No profile found. Please complete your profile to get personalized policy guidance.",
          eligible: [],
          not_eligible: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const policies = await get_all_policies();
    if (policies.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          response: "No policies found in the system right now.",
          eligible: [],
          not_eligible: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const retrievedPolicies = retrieveRelevantPolicies(query, policies);
    const result = check_policy_eligibility(profile, retrievedPolicies);
    const ai_response = await generate_ai_response(
      profile,
      result.eligible,
      result.not_eligible,
      query,
      chat_history,
    );

    return new Response(
      JSON.stringify({
        success: true,
        response: ai_response,
        profile,
        retrieved_count: retrievedPolicies.length,
        eligible: result.eligible,
        not_eligible: result.not_eligible,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
