/**
 * EMBEDDINGS MODULE
 * Handle OpenAI embeddings generation and storage
 */

import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Generate embedding for a text using OpenAI
 * Uses text-embedding-3-small (efficient & fast)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data returned from OpenAI');
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddingsBatch(
  texts: string[],
): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    });

    if (!response.data) {
      throw new Error('No embedding data returned from OpenAI');
    }

    // Sort by index to maintain order
    return response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
}

/**
 * Create policy text for embedding
 * Combines title + description + eligibility + benefits
 */
export function createPolicyEmbeddingText(policy: {
  title: string;
  description: string;
  category: string;
  benefits: string[];
  target_states?: string[];
  target_occupations?: string[];
}): string {
  return `
    Policy: ${policy.title}
    Category: ${policy.category}
    Description: ${policy.description}
    Benefits: ${policy.benefits.join(', ')}
    Target States: ${policy.target_states?.join(', ') || 'All'}
    Target Occupations: ${policy.target_occupations?.join(', ') || 'All'}
  `.trim();
}

/**
 * Calculate cosine similarity between two embeddings
 * Used for relevance scoring
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}
