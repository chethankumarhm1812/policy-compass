/**
 * SEED SCRIPT: Generate embeddings for all policies
 * 
 * Usage:
 * npx ts-node scripts/seed-embeddings.ts
 * 
 * This script:
 * 1. Fetches all policies from Supabase
 * 2. Generates embeddings for each policy
 * 3. Stores embeddings back in the database
 * 
 * NOTE: Requires OPENAI_API_KEY and Supabase credentials in .env
 */

import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Types
interface PolicyRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  benefits: string[];
  target_states?: string[];
  target_occupations?: string[];
}

interface BEmbedding {
  object: string;
  embedding: number[];
  index: number;
}

// =====================
// HELPER FUNCTIONS
// =====================

/**
 * Create policy text for embedding
 * Combines title + description + key info
 */
function createPolicyText(policy: PolicyRecord): string {
  return `
    Policy: ${policy.title}
    Category: ${policy.category}
    Description: ${policy.description}
    Benefits: ${policy.benefits?.join(', ') || 'Various benefits'}
    Target States: ${policy.target_states?.join(', ') || 'All India'}
    Target Occupations: ${policy.target_occupations?.join(', ') || 'All'}
  `.trim();
}

/**
 * Generate embeddings for batch of texts
 */
async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float' as const,
    });

    if (!response.data) {
      throw new Error('No embedding data returned');
    }

    // Sort by index to maintain order
    return (response.data as BEmbedding[])
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Update policy with embedding in database
 */
async function updatePolicyEmbedding(
  policyId: string,
  embedding: number[],
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('policies')
      .update({
        embedding: embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', policyId);

    if (error) {
      console.error('Error updating embedding:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// =====================
// MAIN SCRIPT
// =====================

async function seedEmbeddings() {
  console.log('🚀 Starting embedding generation...\n');

  try {
    // Step 1: Fetch all policies
    console.log('📥 Fetching policies from Supabase...');
    const { data: policies, error } = await supabase
      .from('policies')
      .select('id, title, description, category, benefits, target_states, target_occupations');

    if (error || !policies) {
      throw new Error(`Failed to fetch policies: ${error?.message}`);
    }

    console.log(`✅ Found ${policies.length} policies\n`);

    // Step 2: Generate embeddings in batches
    const batchSize = 10; // OpenAI allows max 100,000 tokens per request
    let processedCount = 0;

    for (let i = 0; i < policies.length; i += batchSize) {
      const batch = (policies as PolicyRecord[]).slice(i, i + batchSize);
      const policyTexts = batch.map(createPolicyText);

      console.log(
        `⏳ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(policies.length / batchSize)}...`,
      );

      try {
        // Generate embeddings
        const embeddings = await generateEmbeddingsBatch(policyTexts);

        // Update each policy with its embedding
        for (let j = 0; j < batch.length; j++) {
          const success = await updatePolicyEmbedding(batch[j].id, embeddings[j]);
          if (success) {
            processedCount++;
            console.log(
              `  ✅ ${batch[j].title} (${processedCount}/${policies.length})`,
            );
          } else {
            console.log(`  ❌ Failed to update ${batch[j].title}`);
          }
        }

        // Add small delay between batches to respect API rate limits
        if (i + batchSize < policies.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error processing batch: ${error}`);
        continue;
      }
    }

    console.log(`\n✨ Embedding generation complete!`);
    console.log(`📊 Successfully processed: ${processedCount}/${policies.length} policies`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
seedEmbeddings().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
