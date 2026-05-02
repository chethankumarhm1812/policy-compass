import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface UserProfile {
  id?: string;
  user_id?: string;
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  income?: number | null;
  occupation?: string | null;
  state?: string | null;
  district?: string | null;
  category?: string | null;
  is_rural?: boolean | null;
  owns_land?: boolean | null;
  rural?: boolean | null;
  own_land?: boolean | null;
  has_business?: boolean | null;
  created_at?: string;
}

export interface PolicyRecord {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  benefits?: string[] | null;
  min_age?: number | null;
  max_age?: number | null;
  max_income?: number | null;
  is_rural?: boolean | null;
  is_rural_only?: boolean | null;
  requires_land?: boolean | null;
  requires_business?: boolean | null;
  eligibility_rules?: Record<string, unknown> | null;
}

export interface NotEligiblePolicy {
  policy: PolicyRecord;
  reasons: string[];
}

export interface EligibilitySummary {
  eligible: PolicyRecord[];
  not_eligible: NotEligiblePolicy[];
}

function normalizeProfile(row: UserProfile | null): UserProfile | null {
  if (!row) return null;
  return {
    ...row,
    is_rural: row.is_rural ?? row.rural ?? null,
    owns_land: row.owns_land ?? row.own_land ?? null,
  };
}

function safeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

function toRuleObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function getSupabaseAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    throw new Error("Supabase service credentials are not configured");
  }
  return createClient(supabaseUrl, serviceRole);
}

export async function get_latest_profile(
  user_id: string,
): Promise<UserProfile | null> {
  const supabase = getSupabaseAdminClient();
  const profileTables = ["profiles", "public_profiles"] as const;

  for (const table of profileTables) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error) {
      return normalizeProfile((data as UserProfile | null) ?? null);
    }

    const message = (error.message || "").toLowerCase();
    const isMissingTable = error.code === "PGRST205" ||
      message.includes("does not exist") ||
      message.includes("could not find");
    if (!isMissingTable) {
      throw new Error(`Profile lookup failed: ${error.message}`);
    }
  }

  return null;
}

export async function get_all_policies(): Promise<PolicyRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("policies").select("*");
  if (error) {
    throw new Error(`Policy fetch failed: ${error.message}`);
  }
  return (data ?? []) as PolicyRecord[];
}

export function check_policy_eligibility(
  profile: UserProfile,
  policies: PolicyRecord[],
): EligibilitySummary {
  const eligible: PolicyRecord[] = [];
  const not_eligible: NotEligiblePolicy[] = [];

  for (const policy of policies) {
    const reasons: string[] = [];

    if (policy.min_age != null) {
      if (profile.age == null) {
        reasons.push("Age is missing.");
      } else if (profile.age < policy.min_age) {
        reasons.push(`Age must be >= ${policy.min_age}.`);
      }
    }

    if (policy.max_age != null) {
      if (profile.age == null) {
        reasons.push("Age is missing.");
      } else if (profile.age > policy.max_age) {
        reasons.push(`Age must be <= ${policy.max_age}.`);
      }
    }

    if (policy.max_income != null) {
      if (profile.income == null) {
        reasons.push("Income is missing.");
      } else if (profile.income > policy.max_income) {
        reasons.push(`Income must be <= ${policy.max_income}.`);
      }
    }

    if (policy.is_rural === true || policy.is_rural_only) {
      const isRural = safeBoolean(profile.is_rural);
      if (isRural !== true) {
        reasons.push("Policy requires a rural profile.");
      }
    }

    const rules = toRuleObject(policy.eligibility_rules);
    const requiresLand = policy.requires_land === true || rules.requires_land === true || rules.owns_land === true;
    if (requiresLand) {
      const ownsLand = safeBoolean(profile.owns_land);
      if (ownsLand !== true) {
        reasons.push("Policy requires land ownership.");
      }
    }

    const requiresBusiness = policy.requires_business === true || rules.requires_business === true;
    if (requiresBusiness) {
      const hasBusiness = safeBoolean(profile.has_business);
      if (hasBusiness !== true) {
        reasons.push("Policy requires business ownership.");
      }
    }

    if (reasons.length === 0) {
      eligible.push(policy);
    } else {
      not_eligible.push({ policy, reasons });
    }
  }

  return { eligible, not_eligible };
}

/**
 * Detect user's intent from their question
 */
type UserIntent = "general_eligibility" | "specific_policy" | "why_not_eligible" | "how_to_apply" | "general_info";

function detectUserIntent(query: string): UserIntent {
  const lowerQuery = query.toLowerCase();

  // Check for specific policy name or "how to apply"
  if (
    lowerQuery.includes("how to apply") ||
    lowerQuery.includes("apply for") ||
    lowerQuery.includes("application process") ||
    lowerQuery.includes("apply to") ||
    lowerQuery.includes("application steps")
  ) {
    return "how_to_apply";
  }

  // Check for "why not" or "why am i not" eligible
  if (
    lowerQuery.includes("why") &&
    (lowerQuery.includes("not eligible") ||
      lowerQuery.includes("am i not") ||
      lowerQuery.includes("cannot apply") ||
      lowerQuery.includes("don't qualify"))
  ) {
    return "why_not_eligible";
  }

  // Check for general eligibility questions
  if (
    lowerQuery.includes("eligible") ||
    lowerQuery.includes("qualify") ||
    lowerQuery.includes("what policies") ||
    lowerQuery.includes("which schemes") ||
    lowerQuery.includes("what schemes")
  ) {
    return "general_eligibility";
  }

  // Check if asking about a specific policy (mentions a specific scheme name)
  if (
    lowerQuery.includes("pm kisan") ||
    lowerQuery.includes("mudra") ||
    lowerQuery.includes("atalji") ||
    lowerQuery.includes("scholarship") ||
    lowerQuery.includes("pension") ||
    lowerQuery.includes("loan") ||
    lowerQuery.includes("subsidy") ||
    lowerQuery.includes("scheme about") ||
    lowerQuery.includes("tell me about")
  ) {
    return "specific_policy";
  }

  return "general_info";
}

/**
 * Find a specific policy by name if user mentioned one
 */
function findPolicyByQuery(
  query: string,
  eligible: PolicyRecord[],
  notEligible: NotEligiblePolicy[],
): { policy: PolicyRecord | null; isEligible: boolean } {
  const lowerQuery = query.toLowerCase();
  const allPolicies = [
    ...eligible.map((p) => ({ policy: p, isEligible: true })),
    ...notEligible.map((ne) => ({ policy: ne.policy, isEligible: false })),
  ];

  // Try exact or partial title match
  for (const { policy, isEligible } of allPolicies) {
    const lowerTitle = policy.title.toLowerCase();
    if (
      lowerQuery.includes(lowerTitle) ||
      lowerTitle.includes(lowerQuery.split(/\s+/)[0]) ||
      (lowerQuery.includes("pm") && lowerTitle.includes("kisan")) ||
      (lowerQuery.includes("mudra") && lowerTitle.toLowerCase().includes("mudra"))
    ) {
      return { policy, isEligible };
    }
  }

  return { policy: null, isEligible: false };
}

function generateSmartFallback(
  profile: UserProfile,
  eligible: PolicyRecord[],
  notEligible: NotEligiblePolicy[],
): string {
  let response = "Based on your profile, here are the most relevant schemes for you:\n\n";

  const topPolicies = eligible.slice(0, 3);

  if (topPolicies.length > 0) {
    topPolicies.forEach((p, i) => {
      const benefits = Array.isArray(p.benefits) ? p.benefits[0] : p.benefits || "See details for benefits";
      response += `👉 ${p.title} – ${benefits}\n`;
    });
  } else {
    response += "No fully eligible policies found yet, but let me help you find near-match options.\n";
  }

  if (notEligible.length > 0) {
    response += "\nSome schemes may not match due to certain requirements.\n";
  }

  response += "\nWould you like help applying for one of these?";

  return response;
}

export async function generate_ai_response(
  profile: UserProfile,
  eligible: PolicyRecord[],
  not_eligible: NotEligiblePolicy[],
  user_query: string,
  chat_history: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<string> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");

  const safeProfile = profile && typeof profile === "object" ? profile : {};
  const safeEligible = Array.isArray(eligible) ? eligible : [];
  const safeNotEligible = Array.isArray(not_eligible) ? not_eligible : [];
  const safeQuery = typeof user_query === "string" && user_query.trim().length > 0
    ? user_query.trim()
    : "Please suggest policies based on my profile.";

  const safeHistory = Array.isArray(chat_history)
    ? chat_history
        .filter((h) =>
          h &&
          (h.role === "user" || h.role === "assistant") &&
          typeof h.content === "string" &&
          h.content.trim().length > 0
        )
        .slice(-5)
    : [];

  if (!geminiKey) {
    return generateSmartFallback(safeProfile, safeEligible, safeNotEligible);
  }

  // ✨ NEW: Detect user intent
  const intent = detectUserIntent(safeQuery);
  const { policy: mentionedPolicy, isEligible: mentionedPolicyEligible } = findPolicyByQuery(
    safeQuery,
    safeEligible,
    safeNotEligible,
  );

  // ✨ Build intent-aware prompt
  let intentInstructions = "";

  if (intent === "how_to_apply" && mentionedPolicy) {
    // User wants to know how to apply for a specific policy
    intentInstructions = `
User Intent: Asking HOW TO APPLY for a specific policy (${mentionedPolicy.title})

RESPOND LIKE THIS:
1. Confirm the policy
2. Give simple step-by-step application process
3. List required documents (if available)
4. Where to apply (online/offline)
5. Timeline

DO NOT list all policies. Focus on this ONE policy only.
`;
  } else if (intent === "why_not_eligible") {
    // User wants to know why they're not eligible
    const notEligibleReasons = safeNotEligible.map((ne) => `- ${ne.policy.title}: ${ne.reasons.join(", ")}`).join("\n");
    intentInstructions = `
User Intent: Asking WHY NOT ELIGIBLE

RESPOND LIKE THIS:
1. Acknowledge the policies they asked about
2. Clearly list the eligibility requirements they don't meet
3. Suggest what they can do to become eligible (if applicable)
4. Suggest alternative policies they might qualify for

DO NOT make recommendations for other policies unless directly related.

Not Eligible Reasons:
${notEligibleReasons}
`;
  } else if (intent === "specific_policy" && mentionedPolicy) {
    // User is asking about a specific policy
    intentInstructions = `
User Intent: Asking about a specific policy (${mentionedPolicy.title})

RESPOND LIKE THIS:
1. Focus ONLY on the policy they mentioned
2. Explain what it offers
3. Explain eligibility status (eligible/not eligible)
4. If eligible: explain why they match
5. If not eligible: explain what's missing

DO NOT recommend other policies. Keep focus on THEIR question.
`;
  } else {
    // General eligibility question
    intentInstructions = `
User Intent: General eligibility question

RESPOND LIKE THIS:
1. Recommend top 2–3 most relevant policies
2. Explain why each matches their situation
3. Mention if some schemes don't fit due to requirements
4. Ask a follow-up question

DO NOT overwhelm with all policies.
`;
  }

  const prompt = `
You are Policy Lens AI — a smart, friendly assistant that understands what users really want.

IMPORTANT: Read the user's question carefully and respond to EXACTLY what they're asking.

---

User Profile:
${JSON.stringify(safeProfile, null, 2)}

Eligible Policies:
${JSON.stringify(safeEligible, null, 2)}

Not Eligible Policies:
${JSON.stringify(safeNotEligible, null, 2)}

User Question:
${safeQuery}

---

${intentInstructions}

---

General Rules:

- Be conversational and natural
- Be clear and direct
- Avoid repeating previous answers if in conversation history
- Do NOT always list all policies
- Do NOT be robotic
- End with a relevant follow-up question only if needed

Tone: Like talking to a real, helpful assistant.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return generateSmartFallback(safeProfile, safeEligible, safeNotEligible);
    }

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!aiText || aiText.length < 20) {
      return generateSmartFallback(safeProfile, safeEligible, safeNotEligible);
    }

    return aiText;
  } catch (error) {
    console.error("generate_ai_response error:", error);
    return generateSmartFallback(safeProfile, safeEligible, safeNotEligible);
  }
}
