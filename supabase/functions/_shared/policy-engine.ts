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

export async function generate_ai_response(
  profile: UserProfile,
  eligible: PolicyRecord[],
  not_eligible: NotEligiblePolicy[],
  user_query: string,
  chat_history: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<string> {
  const hfKey = Deno.env.get("HF_API_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const safeProfile = profile && typeof profile === "object" ? profile : {};
  const safeEligible = Array.isArray(eligible) ? eligible : [];
  const safeNotEligible = Array.isArray(not_eligible) ? not_eligible : [];
  const safeQuery = typeof user_query === "string" && user_query.trim().length > 0
    ? user_query.trim()
    : "Please suggest policies based on my profile.";

  const queryLower = safeQuery.toLowerCase();
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
  const income = typeof safeProfile.income === "number" ? safeProfile.income : null;
  const isRural = safeProfile.is_rural === true;

  const scorePolicy = (policy: PolicyRecord): number => {
    let score = 0;
    // Exact eligibility match gets highest priority.
    score += 100;
    // Income match preference.
    if (income != null && policy.max_income != null && income <= policy.max_income) {
      score += 20;
    }
    // Rural preference.
    if (isRural && (policy.is_rural === true || policy.is_rural_only === true)) {
      score += 15;
    }
    // Lightweight intent relevance.
    const text = `${policy.title} ${policy.description} ${policy.category ?? ""}`.toLowerCase();
    const tokens = queryLower.split(/\s+/).filter((t) => t.length > 2);
    if (tokens.length > 0) {
      const hits = tokens.filter((t) => text.includes(t)).length;
      score += hits * 5;
    }
    return score;
  };

  const topEligible = [...safeEligible]
    .sort((a, b) => scorePolicy(b) - scorePolicy(a))
    .slice(0, 3);

  // For specific "why not X" style questions, prioritize that policy if present.
  const specificExclusions = [...safeNotEligible]
    .filter((item) => {
      const title = item.policy.title.toLowerCase();
      return queryLower.includes(title) || title.split(/\s+/).some((part) => part.length > 3 && queryLower.includes(part));
    })
    .slice(0, 1);
  const topNotEligible = (specificExclusions.length > 0 ? specificExclusions : safeNotEligible).slice(0, 3);

  const prompt = `You are Policy Lens AI — a smart, friendly assistant that helps users understand government schemes.

You are speaking to a real user. Be natural, conversational, and helpful.

---

User Profile:
${JSON.stringify(safeProfile, null, 2)}

Eligible Policies:
${JSON.stringify(topEligible, null, 2)}

Not Eligible Policies:
${JSON.stringify(topNotEligible, null, 2)}

User Question:
${safeQuery}

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
* Use conversation history to avoid repeating prior explanations

Conversation History:
${JSON.stringify(safeHistory, null, 2)}

---

End with a question like:
"Do you want help applying for one of these or finding more student-focused schemes?"`;

  const fallback = "Something went wrong while generating suggestions. Please try again.";

  if (!hfKey && !openAiKey && !geminiKey) return fallback;

  try {
    if (hfKey) {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${hfKey}`,
          },
          body: JSON.stringify({
            inputs: `<s>[INST] ${prompt} [/INST]`,
            parameters: {
              max_new_tokens: 320,
              temperature: 0.2,
              return_full_text: false,
            },
            options: {
              wait_for_model: true,
            },
          }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        const content = Array.isArray(data) ? data?.[0]?.generated_text?.trim() : "";
        if (content) {
          let finalContent = content;
          if (safeEligible.length === 0) {
            finalContent = `${finalContent}\n\nI could not find a fully eligible policy yet, but I can still shortlist near-match options and help you complete the missing requirements.`;
          }
          if (!/\?\s*$/.test(finalContent.trim())) {
            finalContent = `${finalContent}\n\nWould you like help applying for one of these?`;
          }
          return finalContent;
        }
      }
    }

    if (openAiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content?.trim();
        if (content) {
          let finalContent = content;
          if (safeEligible.length === 0) {
            finalContent = `${finalContent}\n\nI could not find a fully eligible policy yet, but I can still shortlist near-match options and help you complete the missing requirements.`;
          }
          if (!/\?\s*$/.test(finalContent.trim())) {
            finalContent = `${finalContent}\n\nWould you like help applying for one of these?`;
          }
          return finalContent;
        }
      }
    }

    if (geminiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (content) {
          let finalContent = content;
          if (safeEligible.length === 0) {
            finalContent = `${finalContent}\n\nI could not find a fully eligible policy yet, but I can still shortlist near-match options and help you complete the missing requirements.`;
          }
          if (!/\?\s*$/.test(finalContent.trim())) {
            finalContent = `${finalContent}\n\nWould you like help applying for one of these?`;
          }
          return finalContent;
        }
      }
    }
  } catch (_error) {
    return fallback;
  }

  return fallback;
}
