# 📍 Variable Usage Map - Where Each Variable is Used

## Summary Table

| Variable Name | Files/Functions Using It | Type | Required |
|---|---|---|---|
| **VITE_SUPABASE_URL** | `src/integrations/supabase/client.ts` | Frontend URL | ✅ Yes |
| **VITE_SUPABASE_PUBLISHABLE_KEY** | `src/integrations/supabase/client.ts` | Frontend Auth Key | ✅ Yes |
| **SUPABASE_URL** | `src/lib/rag.ts`, `supabase/functions/policy-query/index.ts` | Backend URL | ✅ Yes |
| **SUPABASE_ANON_KEY** | `src/lib/rag.ts`, `scripts/seed-embeddings.ts` | Backend Auth Key | ✅ Yes |
| **SUPABASE_SERVICE_ROLE_KEY** | `supabase/functions/policy-query/index.ts`, `generateEmbeddings.js` | Admin Access | ✅ Yes |
| **GEMINI_API_KEY** | `supabase/functions/policy-chat/index.ts`, `supabase/functions/policy-query/index.ts`, `generateEmbeddings.js` | AI API | ✅ Yes |
| **Gemini API Key** | `supabase/functions/policy-query/index.ts` | AI API (alt name) | ✅ Yes |
| **OPENAI_API_KEY** | `src/lib/llm.ts`, `src/lib/embeddings.ts`, `scripts/seed-embeddings.ts` | LLM API | ⚠️ Optional |

---

## Detailed File Breakdown

### 🎨 Frontend Files

#### `src/integrations/supabase/client.ts`
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {...});
```
**Variables Needed:**
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_PUBLISHABLE_KEY` ✅

---

#### `src/lib/rag.ts` (Retrieval Augmented Generation)
```typescript
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
);
```
**Variables Needed:**
- `SUPABASE_URL` ✅
- `SUPABASE_ANON_KEY` ✅

---

#### `src/lib/llm.ts` (LLM Response Generation)
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});
```
**Variables Needed:**
- `OPENAI_API_KEY` ⚠️ (Optional, but needed for GPT features)

---

#### `src/lib/embeddings.ts`
```typescript
// Uses OpenAI for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});
```
**Variables Needed:**
- `OPENAI_API_KEY` ⚠️ (Optional)

---

### ⚡ Supabase Edge Functions

#### `supabase/functions/policy-chat/index.ts`
```typescript
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not configured in Supabase secrets");
}

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
  {...}
);
```
**Supabase Secrets Needed:**
- `GEMINI_API_KEY` ✅

**How to Set:**
```bash
supabase secrets set GEMINI_API_KEY=your_actual_key
```

---

#### `supabase/functions/policy-query/index.ts`
```typescript
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ... later in code ...
const apiKey = Deno.env.get("Gemini API Key");  // Note: spaces in name!
```
**Supabase Secrets Needed:**
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `GEMINI_API_KEY` ✅
- `Gemini API Key` ✅ (alternative with spaces)

**How to Set:**
```bash
supabase secrets set SUPABASE_URL=your_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
supabase secrets set GEMINI_API_KEY=your_key
supabase secrets set "Gemini API Key"=your_key
```

---

### 🛠️ Scripts & Tools

#### `scripts/seed-embeddings.ts`
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
```
**Environment Variables Needed:**
- `OPENAI_API_KEY` ⚠️ (Optional)
- `SUPABASE_URL` ✅
- `SUPABASE_ANON_KEY` ✅

**How to Run:**
```bash
export SUPABASE_URL=your_url
export SUPABASE_ANON_KEY=your_key
export OPENAI_API_KEY=your_key
npm run seed:embeddings
```

---

#### `generateEmbeddings.js`
```javascript
const supabase = createClient(
  "https://wymqtwtulrtevztrfcjg.supabase.co",
  "sb_secret_1Wu8iZyTmR_rUk7_sGkZeQ_F2EmmxH3"  // HARDCODED Service Role Key!
);

const apiKey = process.env.GEMINI_API_KEY;
```
**Issues:** 
- ⚠️ Service Role Key is HARDCODED (security risk!)
- Environment Variables Needed:
  - `GEMINI_API_KEY` ✅

---

## 🎯 Priority Setup Order

### Level 1 (CRITICAL - Must Have)
```env
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Level 2 (RECOMMENDED - For Full Features)
```env
OPENAI_API_KEY
```

---

## 🔒 Security Notes

1. **Never expose these in Git:**
   - SUPABASE_SERVICE_ROLE_KEY
   - OPENAI_API_KEY
   - GEMINI_API_KEY

2. **Frontend only gets:**
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY

3. **Backend/Functions get:**
   - SUPABASE_SERVICE_ROLE_KEY (via Supabase secrets, not .env)
   - GEMINI_API_KEY (via Supabase secrets)

4. **Scripts need:**
   - Both ANON_KEY and SERVICE_ROLE_KEY (depending on what they do)

---

## ✅ Validation Checklist

- [ ] `.env` file has `VITE_SUPABASE_URL`
- [ ] `.env` file has `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `.env` file has `GEMINI_API_KEY`
- [ ] Supabase secrets include `GEMINI_API_KEY`
- [ ] Supabase secrets include `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Supabase secrets include `SUPABASE_URL`
- [ ] Frontend loads without auth errors
- [ ] policy-chat function deploys successfully
- [ ] policy-query function deploys successfully
- [ ] Seed embeddings script runs (if using)

---

**Generated:** April 21, 2026
**Project:** Policy Compass v1.0
