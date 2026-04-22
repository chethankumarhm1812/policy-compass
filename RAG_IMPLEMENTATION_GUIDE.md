# RAG Implementation Guide - PolicyLens AI

## 📋 Overview

This guide shows how to set up and use the complete RAG (Retrieval-Augmented Generation) system for PolicyLens AI. The system helps users find and understand government policies through an intelligent, multi-layered approach.

---

## 🏗️ System Architecture

### Pipeline Flow

```
User Query
    ↓
Generate Embedding (OpenAI)
    ↓
RAG: Retrieve Top 5 Policies (Vector Similarity)
    ↓
PPRAG: Process & Structure Policies
    ↓
Eligibility Engine: Check User Eligibility
    ↓
LLM: Generate Short Answer (GPT-4)
    ↓
3-Layer Response (Answer → Explanation → Details)
```

### Components

| Component | File | Purpose |
|-----------|------|---------|
| **Types** | `src/lib/types.ts` | All TypeScript interfaces |
| **Embeddings** | `src/lib/embeddings.ts` | OpenAI embeddings generation |
| **RAG** | `src/lib/rag.ts` | Vector similarity retrieval |
| **PPRAG** | `src/lib/pprag.ts` | Policy processing & structuring |
| **Eligibility** | `src/lib/eligibilityEngine.ts` | User eligibility checking |
| **LLM** | `src/lib/llm.ts` | OpenAI response generation |
| **Edge Function** | `supabase/functions/policy-query/index.ts` | Complete backend pipeline |
| **Chat UI** | `src/pages/Chat.tsx` | 3-layer chat interface |
| **Seed Script** | `scripts/seed-embeddings.ts` | Generate embeddings for all policies |

---

## 🚀 Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# OpenAI
OPENAI_API_KEY=sk-your-api-key-here

# For Edge Functions (in supabase/.env.local)
OPENAI_API_KEY=sk-your-api-key-here
```

### 2. Install Dependencies

```bash
# Frontend dependencies (already installed)
npm install openai

# Add if not present:
npm install framer-motion lucide-react

# Development dependencies
npm install -D dotenv ts-node

# For Deno (Edge Functions)
# Already built into Supabase
```

### 3. Database Setup

Expected tables (created via migrations):

**policies**
```sql
CREATE TABLE policies (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR NOT NULL,
  eligibility_rules JSONB,
  required_documents TEXT[],
  benefits TEXT[],
  application_steps TEXT[],
  min_age INTEGER,
  max_age INTEGER,
  max_income BIGINT,
  target_gender VARCHAR,
  target_occupations TEXT[],
  target_states TEXT[],
  target_categories TEXT[],
  is_rural_only BOOLEAN DEFAULT false,
  benefit_score INTEGER DEFAULT 50,
  embedding vector(1536), -- OpenAI embedding dimension
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create index for vector search (if pgvector extension available)
CREATE INDEX ON policies USING ivfflat (embedding vector_cosine_ops);
```

**profiles** (already exists in template)
- Stores user profile data for eligibility checking

### 4. Generate Embeddings

This is CRITICAL - the RAG system needs embeddings for all policies.

```bash
# Run the seed script
npx ts-node scripts/seed-embeddings.ts
```

**What it does:**
-Fetches all policies from Supabase
- Generates embeddings using OpenAI text-embedding-3-small
- Stores embeddings back in the database
- Displays progress in console

**Expected output:**
```
🚀 Starting embedding generation...
📥 Fetching policies from Supabase...
✅ Found 25 policies

⏳ Processing batch 1/3...
  ✅ Prime Minister Kisan Scheme (1/25)
  ✅ Ayushman Bharat Health Insurance (2/25)
  ...
✨ Embedding generation complete!
📊 Successfully processed: 25/25 policies
```

---

## 🧠 How Each Module Works

### 1. Embeddings (`src/lib/embeddings.ts`)

Converts text to vector representations using OpenAI.

**Key Functions:**
- `generateEmbedding(text)` - Generate single embedding
- `generateEmbeddingsBatch(texts)` - Generate multiple embeddings
- `createPolicyEmbeddingText(policy)` - Combine policy info for embedding
- `cosineSimilarity(a, b)` - Calculate vector similarity

**Example:**
```typescript
const embedding = await generateEmbedding(
  "PM Kisan Scheme for farmers providing income support"
);
// Returns: [0.123, -0.456, 0.789, ...] (1536 dimensions)
```

### 2. RAG Retrieval (`src/lib/rag.ts`)

Finds most relevant policies based on user query.

**Key Functions:**
```typescript
const results = await retrievePolicies("What health schemes are available?", 5);
// Returns: {
//   retrieved_policies: [...], // Top 5 policies
//   query_vector: [...],       // Query embedding
// }
```

**How it works:**
1. Convert query to embedding
2. Fetch all policies from database
3. Calculate cosine similarity between query and each policy
4. Sort by similarity
5. Return top K results

### 3. PPRAG Processing (`src/lib/pprag.ts`)

Structures and extracts key information from policies.

**Key Functions:**
```typescript
const processed = processSinglePolicy(policy, userProfile);
// Returns: {
//   policy_id: "123",
//   policy_name: "PM Kisan",
//   eligibility_summary: "✅ You are eligible",
//   benefits_summary: "₹6000/year income support",
//   key_conditions: ["Age: 18-65", "Farmer status", ...],
//   eligibility_check: {...},
//   relevance_score: 92
// }
```

### 4. Eligibility Engine (`src/lib/eligibilityEngine.ts`)

Checks if user matches policy criteria.

**Checks performed:**
- ✓ Age (min/max)
- ✓ Income (max limit)
- ✓ Gender
- ✓ Category (SC/ST/OBC/General)
- ✓ Occupation
- ✓ State/Location
- ✓ Rural/Urban
- ✓ Land Ownership

**Returns:**
```typescript
{
  status: 'eligible' | 'partially_eligible' | 'ineligible',
  score: 85, // 0-100%
  reasons: ["Age is within range"],
  matchedRules: {...},
  missingFields: [] // What info is needed
}
```

### 5. LLM Response (`src/lib/llm.ts`)

Generates user-friendly answers using GPT-4.

**Key Functions:**
```typescript
const response = await generateLLMResponse(
  "Am I eligible for PM Kisan?",
  processedPolicies,
  llmContext,
  userProfile
);

// Returns:
{
  answer: "Yes, you're eligible for PM Kisan...", // 2-3 lines
  explanation: {
    why_eligible: "You match 2 schemes",
    missing_requirements: "Need to provide bank details",
    next_steps: "Visit official portal and apply"
  },
  full_details: {
    processed_policies: [...], // Full data
  },
  metadata: {
    processing_time_ms: 1234,
    policies_analyzed: 5
  }
}
```

### 6. Edge Function Pipeline

Complete backend orchestration.

**Endpoint:** `POST /functions/v1/policy-query`

**Request:**
```json
{
  "query": "What agriculture schemes are available?",
  "user_profile": {
    "age": 35,
    "income": 200000,
    "occupation": "Farmer",
    "state": "Maharashtra"
  },
  "top_k": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "You can apply for PM Kisan...",
    "explanation": {...},
    "full_details": {...},
    "metadata": {...}
  }
}
```

---

## 💬 Chat Interface (3-Layer UI)

### Layer 1: Main Answer
**Shows:** Short, concise answer (2-3 sentences)
**Interaction:** Clickable to expand

### Layer 2: Explanation
**Shows:** Why user is eligible, missing requirements, next steps
**Interaction:** Expands from Layer 1, includes "Show Details" button

### Layer 3: Full Policy Details
**Shows:** Complete policy information for each matching scheme
**Interaction:** Expands from Layer 2

---

## 📚 Example User Journey

### User: "I'm a farmer in Maharashtra with ₹4 lakh annual income. What schemes can I get?"

1. **System processes:**
   - Query → Embedding
   - RAG finds: "PM Kisan", "PMFBY", "Kisan Vikas Patra", etc.
   - PPRAG processes each policy
   - Eligibility engine checks: ✅ All checks pass for PM Kisan

2. **LLM generates answer:**
   ```
   Layer 1 (Main):
   "You're eligible for PM Kisan which provides ₹6,000/year, 
   PMFBY for crop insurance, and several state-level schemes. 
   PM Kisan is the easiest to apply for immediately."
   
   Layer 2 (Explanation):
   "Status: You match 3 schemes
   Missing Requirements: Valid bank account, land ownership proof
   Next Steps: Visit pmkisan.gov.in and register with Aadhaar"
   
   Layer 3 (Details):
   - PM Kisan: 92% relevance, ✅ Eligible
   - PMFBY: 88% relevance, ✅ Eligible
   - ...
   ```

---

## 🔧 Common Tasks

### Add a New Policy

1. Insert into database:
```sql
INSERT INTO policies (title, description, category, ...) 
VALUES (...);
```

2. Generate embedding:
```bash
npx ts-node scripts/seed-embeddings.ts
```

### Update User Profile

```typescript
// In your profile update handler
await supabase
  .from('profiles')
  .upsert({
    user_id: user.id,
    age: 35,
    income: 500000,
    occupation: "Farmer",
    state: "Punjab",
    // ... other fields
  });
```

### Query Policies Directly

```typescript
import { retrievePolicies } from '@/lib/rag';

const results = await retrievePolicies(
  "health insurance schemes",
  5
);
```

---

## 🚨 Troubleshooting

### Embeddings not generating
- **Check:** `OPENAI_API_KEY` is set correctly
- **Check:** You have OpenAI credits
- **Check:** Policy data exists in database

### No results returned
- **Check:** Embeddings are stored in database
- **Check:** Policies have valid descriptions
- **Try:** Run seed script again

### Edge Function errors
- **Check:** Supabase URL and keys in .env
- **Check:** OpenAI API key in Supabase secrets
- **Check:** Edge function is deployed: `supabase functions deploy policy-query`

### Chat page not loading
- **Check:** User is authenticated
- **Check:** User profile exists (can be empty)
- **Check:** Edge function URL is correct in code

---

## 📊 Performance Optimization

### Vector Search (if pgvector available)
Use native Postgres vector search instead of manual similarity:

```typescript
const { data } = await supabase.rpc('match_policies', {
  query_embedding: embedding,
  similarity_threshold: 0.3,
  match_count: 5,
});
```

### Caching
Cache generated embeddings locally:

```typescript
const cache = new Map();
async function getCachedEmbedding(text) {
  if (cache.has(text)) return cache.get(text);
  const embedding = await generateEmbedding(text);
  cache.set(text, embedding);
  return embedding;
}
```

### Batch Processing
Process multiple queries efficiently:

```typescript
const embeddings = await generateEmbeddingsBatch(queries);
```

---

## 🔐 Security Notes

1. **API Keys:** Never commit `.env` files
2. **Edge Functions:** Use Supabase secrets for sensitive keys
3. **User Data:** Profile data is private per user
4. **Rate Limiting:** Implement rate limits on edge function

---

## 📈 Monitoring

### Key Metrics to Track
- Embedding generation time (should be < 500ms)
- RAG retrieval time (should be < 100ms)
- LLM response time (should be < 3s)
- User satisfaction with answer accuracy

### Logs
- Check Supabase function logs: *Dashboard → Functions → Logs*
- Check browser console for frontend errors
- Monitor OpenAI API usage in dashboard

---

## 🎯 Next Steps & Enhancements

- [ ] Add caching layer for embeddings
- [ ] Implement pgvector native search
- [ ] Add feedback collection (thumbs up/down)
- [ ] Create admin dashboard for policy management
- [ ] Add multilingual support
- [ ] Implement chat history storage
- [ ] Add webhook for policy updates

---

## 📞 Support

For issues or questions:
1. Check CloudFunction logs in Supabase
2. Review browser DevTools network tab
3. Verify all API keys are set
4. Check OpenAI account status

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**System:** PolicyLens AI - RAG Implementation
