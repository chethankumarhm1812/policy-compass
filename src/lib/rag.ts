/**
 * RAG RETRIEVAL MODULE
 * Retrieve top 3-5 policies based on vector similarity
 */

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding, cosineSimilarity } from './embeddings';
import { PolicyRecord, RAGResult } from './types';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
);

/**
 * Retrieve top policies using vector similarity
 * @param query User's question/query
 * @param topK Number of policies to retrieve (default: 5)
 * @returns Retrieved policies with similarity scores
 */
export async function retrievePolicies(
  query: string,
  topK: number = 5,
): Promise<RAGResult> {
  try {
    // Step 1: Generate embedding for user query
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Fetch all policies from database
    const { data: policies, error } = await supabase
      .from('policies')
      .select('*');

    if (error || !policies) {
      throw new Error(`Failed to fetch policies: ${error?.message}`);
    }

    // Step 3: Calculate similarity scores (since pgvector might not be available in all setups)
    const policiesWithScores = (policies as PolicyRecord[])
      .map((policy) => {
        let similarity = 0;
        if (policy.embedding && Array.isArray(policy.embedding)) {
          similarity = cosineSimilarity(
            queryEmbedding,
            policy.embedding as number[],
          );
        }
        return {
          ...policy,
          similarity_score: similarity,
        };
      })
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, topK);

    return {
      retrieved_policies: policiesWithScores as PolicyRecord[],
      total_count: policiesWithScores.length,
      query_vector: queryEmbedding,
    };
  } catch (error) {
    console.error('Error in RAG retrieval:', error);
    throw error;
  }
}

/**
 * Advanced RAG with filtering
 * Can filter by category, state, occupation, etc.
 */
export async function retrievePoliciesWithFilters(
  query: string,
  filters?: {
    category?: string;
    state?: string;
    occupation?: string;
    topK?: number;
  },
): Promise<RAGResult> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    const topK = filters?.topK || 5;

    // Build query with filters
    let dbQuery = supabase.from('policies').select('*');

    if (filters?.category) {
      dbQuery = dbQuery.eq('category', filters.category);
    }

    if (filters?.state) {
      dbQuery = dbQuery.contains('target_states', [filters.state]);
    }

    if (filters?.occupation) {
      dbQuery = dbQuery.contains('target_occupations', [filters.occupation]);
    }

    const { data: policies, error } = await dbQuery;

    if (error || !policies) {
      throw new Error(`Failed to fetch policies: ${error?.message}`);
    }

    // Calculate similarity scores and sort
    const policiesWithScores = (policies as PolicyRecord[])
      .map((policy) => {
        let similarity = 0;
        if (policy.embedding && Array.isArray(policy.embedding)) {
          similarity = cosineSimilarity(
            queryEmbedding,
            policy.embedding as number[],
          );
        }
        return {
          ...policy,
          similarity_score: similarity,
        };
      })
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, topK);

    return {
      retrieved_policies: policiesWithScores as PolicyRecord[],
      total_count: policiesWithScores.length,
      query_vector: queryEmbedding,
    };
  } catch (error) {
    console.error('Error in filtered RAG retrieval:', error);
    throw error;
  }
}

/**
 * Get policy by ID (for detail pages)
 */
export async function getPolicyById(policyId: string): Promise<PolicyRecord | null> {
  try {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('id', policyId)
      .single();

    if (error) {
      console.error('Error fetching policy:', error);
      return null;
    }

    return data as PolicyRecord;
  } catch (error) {
    console.error('Error in getPolicyById:', error);
    return null;
  }
}

/**
 * Get all policies (for dashboard/list pages)
 */
export async function getAllPolicies(limit: number = 50): Promise<PolicyRecord[]> {
  try {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Error fetching all policies:', error);
      return [];
    }

    return (data as PolicyRecord[]) || [];
  } catch (error) {
    console.error('Error in getAllPolicies:', error);
    return [];
  }
}
