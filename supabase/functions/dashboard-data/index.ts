import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  check_policy_eligibility,
  get_all_policies,
  get_latest_profile,
} from "../_shared/policy-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = await get_latest_profile(user_id);
    if (!profile) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No profile found. Please complete your profile first.",
          profile: null,
          all_policies: [],
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
          message: "No policies found. Please try again later.",
          profile,
          all_policies: [],
          eligible: [],
          not_eligible: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = check_policy_eligibility(profile, policies);

    return new Response(
      JSON.stringify({
        success: true,
        profile,
        all_policies: policies,
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
