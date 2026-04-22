# 🚀 PolicyLens AI - Complete Setup Guide

## Quick Start

This guide will help you set up the complete **RAG-powered PolicyLens AI** system with embeddings, vector search, and intelligent policy recommendations.

---

## ✅ Prerequisites

- Node.js 18+ (or Bun)
- Supabase account (free tier OK)
- OpenAI API account with credits
- Git

---

## 📦 Installation Steps

### Step 1: Clone & Install Dependencies

```bash
cd policy-compass
npm install
# or
bun install
```

### Step 2: Environment Setup

Create `.env.local` file in the project root:

```bash
# Supabase (get from your Supabase dashboard)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# For scripts and backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# OpenAI (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-xxx...
```

**To find Supabase credentials:**
1. Go to Supabase dashboard
2. Click your project
3. Settings → API → Copy URL and Anon Key

---

## 🗄️ Database Setup

### Verify Policies Table

Check if the `policies` table exists with the correct schema:

```sql
-- Verify in Supabase SQL Editor
SELECT * FROM policies LIMIT 1;

-- Should show columns: id, title, description, category, 
-- eligibility_rules, benefits, embedding, etc.
```

### Add pgvector Extension (Optional but Recommended)

For faster vector search:

```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;

-- Create index on embeddings column
CREATE INDEX IF NOT EXISTS policies_embedding_idx 
  ON policies USING ivfflat (embedding vector_cosine_ops);
```

---

## 🧬 Generate Embeddings (CRITICAL!)

The RAG system needs embeddings for all policies to work properly.

```bash
npm run seed:embeddings
```

**What it does:**
1. Fetches all policies from Supabase
2. Generates embeddings using OpenAI (text-embedding-3-small)
3. Stores embeddings back in database
4. Shows progress

**Expected output:**
```
🚀 Starting embedding generation...
📥 Fetching policies from Supabase...
✅ Found 25 policies

⏳ Processing batch 1/3...
  ✅ PM Kisan Scheme (1/25)
  ✅ Ayushman Bharat (2/25)
  ...
✨ Embedding generation complete!
📊 Successfully processed: 25/25 policies
```

**Troubleshooting:**
- ❌ "No policies found": Add sample policies to database first
- ❌ "Invalid API key": Check OPENAI_API_KEY in .env.local
- ❌ "Rate limit exceeded": Wait a minute and try again

---

## 🚀 Deploy Edge Function

The backend RAG pipeline runs as a Supabase Edge Function.

### Deploy to Supabase

```bash
# First, link your Supabase project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy policy-query

# View logs
supabase functions list
```

### Add OpenAI Key to Edge Function

1. Go to Supabase Dashboard
2. Edge Functions → policy-query → Secrets
3. Add: `OPENAI_API_KEY=sk-xxx...`

---

## 🏃 Run the Application

### Development Mode

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Test the Chat Feature

1. Go to `/chat` page
2. Make sure you're logged in
3. Fill in your profile first (preferred)
4. Try asking:
   - "What policies am I eligible for?"
   - "How much can I earn from PM Kisan?"
   - "Show me health schemes"

### Expected Behavior

**Layer 1 (Main Answer):**
```
You're eligible for PM Kisan which provides ₹6,000/year income 
support. You also match Ayushman Bharat for health insurance.
```

**Layer 2 (Explanation)** - Click to expand:
```
Status: You match 3 schemes
Missing: Valid bank account details
Next: Visit pmkisan.gov.in and apply with Aadhaar
```

**Layer 3 (Details)** - Click to expand more:
```
✅ PM Kisan (92% match)
  - Eligibility: You are eligible
  - Benefits: ₹6000/year income support + ...
  - Conditions: Age: 18-75, Farmer status, ...
```

---

## 🏗️ Project Structure

```
policy-compass/
├── src/
│   ├── lib/
│   │   ├── types.ts              ← All TypeScript types
│   │   ├── embeddings.ts         ← OpenAI embeddings
│   │   ├── rag.ts                ← Vector search retrieval
│   │   ├── pprag.ts              ← Policy processing
│   │   ├── eligibilityEngine.ts  ← Eligibility checking
│   │   └── llm.ts                ← LLM response generation
│   ├── pages/
│   │   └── Chat.tsx              ← 3-layer chat UI
│   └── components/               ← Reusable UI components
├── supabase/
│   └── functions/
│       └── policy-query/         ← Edge function (backend)
├── scripts/
│   └── seed-embeddings.ts        ← Generate embeddings
├── RAG_IMPLEMENTATION_GUIDE.md   ← Detailed technical guide
└── SETUP.md                      ← This file!
```

---

## 🧪 Testing

### Test Embeddings Generation

```bash
# Verify embeddings are stored
npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const { data } = await sb.from('policies').select('id, title, embedding').limit(1);
console.log(data[0]?.embedding ? '✅ Embeddings found' : '❌ No embeddings');
"
```

### Test RAG Retrieval

```bash
# Try in browser console on /chat page
const { retrievePolicies } = await import('./src/lib/rag.js');
const results = await retrievePolicies("health insurance");
console.log(results);
```

---

## 📋 Features Implemented

- ✅ **RAG (Retrieval-Augmented Generation)**
  - Vector embeddings for all policies
  - Similarity-based retrieval
  - Top-K policy matching

- ✅ **PPRAG (Policy Processing RAG)**
  - Extract eligibility criteria
  - Structure policy information
  - Create focused context for LLM

- ✅ **Eligibility Engine**
  - Check against 8+ criteria
  - Personalized eligibility score
  - Identify missing information

- ✅ **LLM Integration**
  - GPT-4o-mini for cost efficiency
  - Structured prompts
  - Short, concise answers

- ✅ **Chat Interface (3-Layer)**
  - Layer 1: Main answer
  - Layer 2: Explanation
  - Layer 3: Full details

- ✅ **Edge Functions**
  - Complete backend pipeline
  - Serverless processing
  - Sub-second response times

---

## 🔄 Complete Workflow

```
User Types Query
       ↓
Browser → Edge Function (policy-query)
       ↓
1. Generate Embedding (OpenAI)
   text → [0.123, -0.456, ...]
       ↓
2. RAG Retrieval (Vector Search)
   Query embedding → DB → Find 5 similar policies
       ↓
3. PPRAG Processing
   Extract: eligibility, benefits, conditions
       ↓
4. Eligibility Check
   User profile → Check each policy → Score 0-100%
       ↓
5. LLM Response Generation
   Structured context → GPT-4o-mini → Concise answer
       ↓
6. Format 3-Layer Response
   Main answer + Explanation + Details
       ↓
Router ← Edge Function Returns JSON
       ↓
Display in 3-Layer Chat UI
```

---

## ⚙️ Configuration

### Change LLM Model

Edit `src/lib/llm.ts`:
```typescript
// Change from 'gpt-4o-mini' to:
model: 'gpt-4-turbo', // Or any OpenAI model
```

### Change Number of Retrieved Policies

Edit `src/lib/rag.ts`:
```typescript
const results = await retrievePolicies(query, 10); // Was 5
```

### Adjust Eligibility Weights

Edit `src/lib/eligibilityEngine.ts` to weight criteria differently.

---

## 🚨 Common Issues & Solutions

### "No policies found"
```
1. Check policies table exists: SELECT * FROM policies;
2. If empty, add sample data to database
3. Re-run: npm run seed:embeddings
```

### "Embeddings not updating"
```
1. Verify OPENAI_API_KEY is correct
2. Check OpenAI account has credits
3. Check policy table has embedding column
4. Run seed script with verbose: npm run seed:embeddings
```

### "Chat page shows error"
```
1. Check Supabase auth working (/auth page)
2. Check user profile is created (/profile page)
3. View browser console for error details
4. Check Edge Function logs in Supabase dashboard
```

### "Edge function 404"
```
1. Deploy function: supabase functions deploy policy-query
2. Verify endpoint: https://your-project.supabase.co/functions/v1/policy-query
3. Check auth token is valid
```

---

## 📊 Monitoring & Debugging

### Check Edge Function Logs

```
Supabase Dashboard → Functions → policy-query → Logs
```

### Monitor API Usage

```
Supabase Dashboard → Integrations → API Usage
OpenAI Dashboard → API Usage
```

### Profile Performance

Chrome DevTools → Network tab → Filter: "policy-query"
- Should complete in < 3 seconds
- Should include embedding generation, vector search, and LLM call

---

## 🎓 Learning Resources

- **RAG Guide:** See [RAG_IMPLEMENTATION_GUIDE.md](./RAG_IMPLEMENTATION_GUIDE.md)
- **API Docs:** [OpenAI API](https://platform.openai.com/docs)
- **Supabase Edge Functions:** [Docs](https://supabase.com/docs/guides/functions)
- **Vector Search:** [pgvector Tutorial](https://github.com/pgvector/pgvector)

---

## 🚀 Next Steps After Setup

1. **Test Thoroughly**
   - Try different queries in chat
   - Test with different user profiles
   - Check eligibility accuracy

2. **Add More Policies**
   - Insert policy data into database
   - Re-run seed script for embeddings
   - Test if new policies appear in results

3. **Customize** 
   - Adjust LLM prompts for your use case
   - Modify eligibility criteria
   - Change UI styling

4. **Deploy**
   - Build for production: `npm run build`
   - Deploy to hosting (Vercel, Netlify, etc.)
   - Monitor usage and errors

---

## 📝 Sample Policy Data

To test, insert sample policies:

```sql
INSERT INTO policies (title, description, category, min_age, max_age, max_income, 
                      benefits, required_documents, target_states, eligibility_rules)
VALUES 
  ('PM Kisan', 'Income support for farmers', 'Agriculture', 
   18, 75, 500000, 
   ARRAY['₹6000 annual income'], 
   ARRAY['Land records', 'Bank account'],
   ARRAY['All States'],
   '{"farmer": true}'::jsonb),
  ...
```

---

## 🎉 Success Checklist

- [ ] Environment variables set (.env.local)
- [ ] Dependencies installed (npm install)
- [ ] Supabase project linked
- [ ] Policies exist in database
- [ ] Embeddings generated (npm run seed:embeddings)
- [ ] Edge function deployed
- [ ] Development server running (npm run dev)
- [ ] Chat page loads without errors
- [ ] Can type queries and get responses
- [ ] 3-layer UI appears with expand/collapse

---

## 📞 Need Help?

1. Check the detailed [RAG_IMPLEMENTATION_GUIDE.md](./RAG_IMPLEMENTATION_GUIDE.md)
2. Review [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)
3. Check browser console for errors
4. Check Supabase function logs
5. Verify all API keys are correct

---

**Setup Version:** 1.0  
**Last Updated:** April 2026  
**System:** PolicyLens AI
