# Supabase Environment Variables Guide

## 📋 Complete List of Required Variables

This guide contains ALL environment variables and credentials needed to run the Policy Compass project without connection errors.

---

## 1️⃣ **FRONTEND ENVIRONMENT VARIABLES** (.env file)

These variables go in your `.env` file for the Vite React frontend:

```env
VITE_SUPABASE_URL=https://wymqtwtulrtevztrfcjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bXF0d3R1bHJ0ZXZ6dHJmY2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODE5NDEsImV4cCI6MjA5MjA1Nzk0MX0.n3z0ksuMSdvrjHDt1Nrn5EjT5yPpjhoSN1ukKpspazg
GEMINI_API_KEY=AIzaSyAaW2DQbUIcTxNeMtCT8_q6TrHZwFwS26I
OPENAI_API_KEY=sk-... (Optional - if using OpenAI features)
```

### Variables Breakdown:
| Variable | Source | Usage |
|----------|--------|-------|
| `VITE_SUPABASE_URL` | Supabase Dashboard | Frontend to connect to Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard (Anon Key) | Public client authentication |
| `GEMINI_API_KEY` | Google AI Studio | Gemini API for AI responses |
| `OPENAI_API_KEY` | OpenAI Dashboard | OpenAI GPT models (optional) |

---

## 2️⃣ **SUPABASE EDGE FUNCTIONS SECRETS**

These go in **Supabase Dashboard → Project Settings → Secrets**

### For `policy-chat` Function:
```
GEMINI_API_KEY = AIzaSyAaW2DQbUIcTxNeMtCT8_q6TrHZwFwS26I
```

### For `policy-query` Function:
```
SUPABASE_URL = https://wymqtwtulrtevztrfcjg.supabase.co
SUPABASE_SERVICE_ROLE_KEY = sb_secret_1Wu8iZyTmR_rUk7_sGkZeQ_F2EmmxH3
GEMINI_API_KEY = AIzaSyAaW2DQbUIcTxNeMtCT8_q6TrHZwFwS26I
```

**Note:** There's also `Gemini API Key` (with spaces) used in policy-query:
```
Gemini API Key = AIzaSyAaW2DQbUIcTxNeMtCT8_q6TrHZwFwS26I
```

---

## 3️⃣ **NODE.JS SCRIPTS ENVIRONMENT VARIABLES**

For running scripts like `seed-embeddings.ts`:

```env
SUPABASE_URL=https://wymqtwtulrtevztrfcjg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bXF0d3R1bHJ0ZXZ6dHJmY2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODE5NDEsImV4cCI6MjA5MjA1Nzk0MX0.n3z0ksuMSdvrjHDt1Nrn5EjT5yPpjhoSN1ukKpspazg
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIzaSyAaW2DQbUIcTxNeMtCT8_q6TrHZwFwS26I
```

---

## 4️⃣ **DIRECT SUPABASE CLIENT INITIALIZATION**

Used in files like `generateEmbeddings.js`:

```javascript
const supabase = createClient(
  "https://wymqtwtulrtevztrfcjg.supabase.co",
  "sb_secret_1Wu8iZyTmR_rUk7_sGkZeQ_F2EmmxH3"  // Service Role Key
);
```

---

## 5️⃣ **COMPLETE REFERENCE TABLE**

| Variable Name | Type | Where Used | Source | Example |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | URL | Frontend (.env) | Supabase Dashboard | `https://wymqtwtulrtevztrfcjg.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | JWT Token | Frontend (.env) | Supabase Dashboard (Anon Key) | `eyJhbGciOi...` |
| `SUPABASE_URL` | URL | Scripts, Edge Functions | Supabase Dashboard | `https://wymqtwtulrtevztrfcjg.supabase.co` |
| `SUPABASE_ANON_KEY` | JWT Token | Scripts | Supabase Dashboard (Anon Key) | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT Token | Edge Functions (Admin) | Supabase Dashboard (Service Role) | `sb_secret_...` |
| `GEMINI_API_KEY` | API Key | Frontend, Edge Functions, Scripts | Google AI Studio | `AIzaSy...` |
| `Gemini API Key` | API Key | Edge Functions (policy-query) | Google AI Studio | `AIzaSy...` |
| `OPENAI_API_KEY` | API Key | Frontend, Scripts (Optional) | OpenAI Dashboard | `sk-...` |

---

## 📝 **Setup Checklist**

### Step 1: Frontend Setup
- [ ] Copy `.env` file with `VITE_*` variables
- [ ] Ensure `VITE_SUPABASE_URL` matches your project
- [ ] Ensure `VITE_SUPABASE_PUBLISHABLE_KEY` is the **Anon Key** from Supabase

### Step 2: Supabase Edge Functions Setup
- [ ] Go to **Supabase Dashboard → Project Settings → Secrets**
- [ ] Add `GEMINI_API_KEY` for both `policy-chat` and `policy-query`
- [ ] Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for `policy-query`
- [ ] Deploy functions: `supabase functions deploy`

### Step 3: Scripts/Background Jobs
- [ ] Create `.env` or use system environment variables
- [ ] Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`
- [ ] Run seed script: `npm run seed:embeddings`

### Step 4: Test Connections
- [ ] Test frontend Supabase connection (auth should work)
- [ ] Call policy-chat function from frontend
- [ ] Check console for errors

---

## 🔑 **Key Differences**

### Anon Key vs Service Role Key
- **Anon Key** (`VITE_SUPABASE_PUBLISHABLE_KEY`): Safe to expose in frontend, limited permissions
- **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`): Keep SECRET, full admin access, only for backend/functions

### Gemini API Key Naming
- Edge functions use either:
  - `Deno.env.get("GEMINI_API_KEY")` (normal case)
  - `Deno.env.get("Gemini API Key")` (spaces, in policy-query)
- Keep both or standardize to one name

---

## ⚠️ **Common Connection Errors & Fixes**

| Error | Cause | Fix |
|-------|-------|-----|
| `SUPABASE_URL is not configured` | Missing env var | Add to Supabase secrets |
| `Invalid JWT` | Wrong key used (Service Role in Frontend) | Use Anon Key in frontend |
| `Unauthorized` | Missing SUPABASE_SERVICE_ROLE_KEY | Add to Edge Functions secrets |
| `GEMINI_API_KEY not found` | Not in Supabase secrets | Add to specific function secrets |
| `Fetch error to supabase` | Wrong URL | Verify project URL matches |

---

## 📚 **Files Using These Variables**

```
Frontend:
  ├── src/integrations/supabase/client.ts        → VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
  ├── src/lib/rag.ts                              → SUPABASE_URL, SUPABASE_ANON_KEY
  ├── src/lib/llm.ts                              → OPENAI_API_KEY
  └── src/lib/embeddings.ts                       → OPENAI_API_KEY

Edge Functions:
  ├── supabase/functions/policy-chat/index.ts     → GEMINI_API_KEY
  └── supabase/functions/policy-query/index.ts    → SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY

Scripts:
  ├── generateEmbeddings.js                       → (hardcoded URL and Service Role Key)
  └── scripts/seed-embeddings.ts                  → SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY
```

---

## 🚀 **Quick Start Commands**

```bash
# 1. Set up frontend
cp .env.example .env
# Edit .env with your Supabase credentials

# 2. Deploy edge functions
supabase functions deploy policy-chat
supabase functions deploy policy-query

# 3. Add secrets to functions
supabase secrets set GEMINI_API_KEY=your_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key

# 4. Run seed script
npm run seed:embeddings
```

---

## ✅ **Validation**

To test if all variables are set correctly:

```bash
# Check frontend .env
grep VITE_ .env

# Check edge function secrets
supabase secrets list

# Test Supabase connection
curl -X GET "https://wymqtwtulrtevztrfcjg.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY"

# Test Gemini API
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents": [{"parts": [{"text": "Hello"}]}]}'
```

---

**Last Updated:** April 21, 2026
**Project:** Policy Compass
**Version:** v1.0
