import { UserProfile } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variables.');
}

export interface DashboardDataResponse {
  success: boolean;
  message?: string;
  profile: UserProfile | null;
  all_policies?: Array<Record<string, unknown>>;
  eligible: Array<Record<string, unknown>>;
  not_eligible: Array<{ policy: Record<string, unknown>; reasons: string[] }>;
  error?: string;
}

export interface AiChatResponse {
  success: boolean;
  response?: string;
  profile?: UserProfile;
  eligible?: Array<Record<string, unknown>>;
  not_eligible?: Array<{ policy: Record<string, unknown>; reasons: string[] }>;
  error?: string;
}

async function callFunction<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  let payload: Record<string, unknown> = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Invalid response from ${functionName}`);
  }
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with ${response.status}`);
  }
  return payload as T;
}

export function fetchDashboardData(userId: string): Promise<DashboardDataResponse> {
  return callFunction<DashboardDataResponse>('dashboard-data', { user_id: userId });
}

export function fetchAiChat(userId: string, query: string): Promise<AiChatResponse> {
  return callFunction<AiChatResponse>('ai-chat', { user_id: userId, query });
}
