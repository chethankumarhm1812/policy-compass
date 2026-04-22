# 🚀 PolicyLens AI - Getting Started (LIVE BUILD)

## ✅ Status: Development Server Running
```
Local:   http://localhost:8080/
Network: http://192.168.0.146:8080/
```

---

## 🎯 Next Steps (In Order)

### Step 1: Configure Environment Variables (5 minutes)

Create `.env.local` in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# For scripts
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# OpenAI
OPENAI_API_KEY=sk-proj-xxx...
```

**How to get these:**
1. Supabase: Go to your project → Settings → API
2. OpenAI: Go to https://platform.openai.com/api-keys

---

### Step 2: Verify Database Setup (2 minutes)

Check that your Supabase database has:
- ✅ `policies` table with policies data
- ✅ `profiles` table (for user profiles)
- ✅ `auth.users` table (automatic from Supabase)

**Quick check in Supabase SQL Editor:**
```sql
SELECT COUNT(*) as policy_count FROM policies;
-- Should return > 0
```

---

### Step 3: Generate Embeddings (5-10 minutes)

Once you have env variables and policies in DB:

```bash
npm run seed:embeddings
```

**What it does:**
- Fetches all policies from Supabase
- Generates OpenAI embeddings
- Stores embeddings back in DB
- Shows progress: ✅ Policy Name (1/25)

**Output should look like:**
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

---

### Step 4: Deploy Edge Function (5 minutes)

Deploy the backend RAG pipeline:

```bash
# Link your project (first time only)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy policy-query

# Verify
supabase functions list
```

**Add OpenAI API key to Supabase:**
1. Supabase Dashboard → Edge Functions → policy-query
2. Click "Secrets" tab
3. Add: `OPENAI_API_KEY=sk-xxx...`

---

### Step 5: Test in Browser (2 minutes)

1. Open http://localhost:8080/
2. Click "Get Started" or go to `/auth`
3. Create test account
4. Go to `/profile` → Fill in your details (optional)
5. Go to `/chat` → Start asking questions!

**Test queries:**
- "What policies am I eligible for?"
- "Tell me about PM Kisan"
- "Health insurance schemes"
- "I'm a farmer in Maharashtra. What can I get?"

---

## 📊 System Check Checklist

```
Before you can use the full RAG system:

□ npm install                      (✅ Done)
□ npm run dev                      (✅ Done - running on port 8080)
□ Create .env.local               (← DO THIS NOW)
  □ VITE_SUPABASE_URL
  □ VITE_SUPABASE_ANON_KEY
  □ SUPABASE_URL
  □ SUPABASE_ANON_KEY
  □ OPENAI_API_KEY
□ Verify policies in Supabase DB   (← DO THIS)
□ npm run seed:embeddings          (← DO THIS)
□ supabase functions deploy        (← DO THIS)
□ Test in http://localhost:8080    (← DO THIS)
```

---

## 🔧 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| "Cannot find module 'openai'" | Run `npm install` |
| Chat page shows error | Check .env.local variables |
| No embeddings generated | Verify OPENAI_API_KEY and policies exist |
| Edge function 404 | Run `supabase functions deploy policy-query` |
| No results in chat | Run `npm run seed:embeddings` first |

---

## 📚 Full Documentation

- **SETUP.md** - Complete step-by-step setup
- **RAG_QUICK_REFERENCE.md** - Quick reference
- **RAG_IMPLEMENTATION_GUIDE.md** - Technical details
- **DOCUMENTATION_INDEX.md** - Find anything

---

## 🎯 What Will Happen

Once configured (takes ~30 minutes):

```
1. You ask: "Am I eligible for PM Kisan?"
                    ↓
2. System generates embedding
                    ↓
3. System finds 5 similar policies (RAG)
                    ↓
4. System checks your eligibility
                    ↓
5. System generates AI answer (GPT-4)
                    ↓
6. You see 3-layer response:
   - Layer 1: Short answer (click to expand)
   - Layer 2: Explanation (click to expand more)
   - Layer 3: Full details (all policies)
```

---

## 🚨 Getting Started Quickly

### Fastest Path (if you have Supabase configured):

```bash
# 1. Set environment variables in .env.local
# (Copy the 5 required variables above)

# 2. Add policies to your Supabase database
# (Use SQL Editor to INSERT policies)

# 3. Generate embeddings
npm run seed:embeddings

# 4. Deploy edge function
supabase functions deploy policy-query

# 5. Test
# Go to http://localhost:8080 → /auth → /chat
```

**Time: 20-30 minutes total**

---

## 💡 Tips

1. **First time?** Start with SETUP.md
2. **In a hurry?** Use RAG_QUICK_REFERENCE.md
3. **Need help?** Check DOCUMENTATION_INDEX.md
4. **Want details?** Read RAG_IMPLEMENTATION_GUIDE.md

---

## 🎉 You're Ready!

The development server is **LIVE** and waiting for your next steps. Follow the checklist above and you'll have a working RAG system in 30 minutes!

---

**Development Server:** ✅ Running on http://localhost:8080  
**Time to Production:** ~30 minutes  
**Status:** 🚀 Ready to Build!
