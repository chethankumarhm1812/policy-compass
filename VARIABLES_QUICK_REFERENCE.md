# 🔑 QUICK REFERENCE: All Variable Names

## Frontend Environment Variables (.env)
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY
OPENAI_API_KEY (optional)
```

## Supabase Edge Functions Secrets
### policy-chat function:
```
GEMINI_API_KEY
```

### policy-query function:
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
Gemini API Key (alternative naming with spaces)
```

## Scripts Environment Variables
```
SUPABASE_URL
SUPABASE_ANON_KEY
OPENAI_API_KEY
GEMINI_API_KEY
```

---

## 📍 How to Get Each Variable

| Variable | How to Get | Where |
|----------|-----------|-------|
| `VITE_SUPABASE_URL` | Copy from Supabase | Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Copy "Anon public key" | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Copy "Service role secret" | Dashboard → Settings → API |
| `GEMINI_API_KEY` | Get from Google AI Studio | [ai.google.dev](https://ai.google.dev) |
| `OPENAI_API_KEY` | Get from OpenAI | [platform.openai.com](https://platform.openai.com) |

---

## ✅ Setup Steps

1. **Frontend (.env file):**
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_PUBLISHABLE_KEY` (Anon Key)
   - Add `GEMINI_API_KEY`

2. **Supabase Dashboard Secrets:**
   - Go to Project Settings → Secrets
   - Add `GEMINI_API_KEY`
   - Add `SUPABASE_SERVICE_ROLE_KEY`
   - Add `SUPABASE_URL`

3. **Deploy Functions:**
   ```bash
   supabase functions deploy policy-chat
   supabase functions deploy policy-query
   ```

---

## ⚠️ Important Notes

- **ANON KEY** in frontend = `VITE_SUPABASE_PUBLISHABLE_KEY`
- **SERVICE ROLE KEY** in secrets = `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
- **GEMINI_API_KEY** needed in multiple places (frontend, both edge functions)
- **OPENAI_API_KEY** only needed if using OpenAI features

