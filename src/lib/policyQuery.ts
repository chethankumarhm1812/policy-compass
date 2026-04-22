import { PolicyQueryRequest, PolicyQueryResponse } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variables.');
}

const POLICY_QUERY_URL = `${SUPABASE_URL}/functions/v1/policy-query`;

export async function queryPolicyPipeline(
  body: PolicyQueryRequest,
): Promise<PolicyQueryResponse> {
  try {
    const response = await fetch(POLICY_QUERY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });

    // Check for network/connection errors
    if (!response.ok) {
      let errorMessage = 'Policy query failed';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Response wasn't JSON, use status text
        errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const json = await response.json();
    
    // Validate response structure
    if (!json.success) {
      return {
        success: false,
        error: json.error || 'Unknown error from policy assistant',
      };
    }

    if (!json.data) {
      return {
        success: false,
        error: 'Invalid response structure from policy assistant',
      };
    }

    return json as PolicyQueryResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
    return {
      success: false,
      error: `Failed to connect to policy assistant: ${errorMessage}`,
    };
  }
}
