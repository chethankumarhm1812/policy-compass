# PolicyLens AI Project Overview

## What this project does

`PolicyLens AI` is a web application that helps Indian citizens discover and understand government policies and schemes. It provides:

- Personalized policy recommendations based on a user profile
- Eligibility analysis for government schemes
- A policy chat assistant powered by AI
- Policy search and browse experience
- Supabase-backed authentication, profile storage, and policy data

The main goal is to make government schemes easier to find and understand for users through a mix of structured eligibility logic and generative AI.

## Main capabilities

- User authentication and session management using Supabase auth
- Profile creation and storage to personalize policy recommendations
- Dashboard showing recommended, eligible, and not-eligible policies
- Policy list and detail pages with filter/search support
- Chat assistant for natural language questions about policies
- AI-powered responses using Gemini / OpenAI-style prompts
- Policy eligibility computation using user profile and policy rules

## Key modules and what they do

### Frontend

#### `src/main.tsx`
- Entry point for the React application
- Renders the `App` component inside the HTML root element

#### `src/App.tsx`
- Sets up React Router routes and protected routes
- Wraps the app with providers: React Query, tooltips, toasts, and auth
- Defines the main page navigation paths

#### `src/hooks/useAuth.tsx`
- Provides authentication state via React context
- Connects to Supabase auth for sign in, sign up, sign out
- Tracks user session and loading state

#### `src/integrations/supabase/client.ts`
- Creates the Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Configures auth persistence in local storage

#### `src/components/`
- Contains reusable UI building blocks and shared components
- Includes navigation, cards, modals, buttons, and form controls
- Uses shadcn/ui patterns and Tailwind CSS styles

#### `src/pages/`
- `Index.tsx`: Public landing page / hero experience
- `Auth.tsx`: Authentication and login/signup user interface
- `Dashboard.tsx`: Main signed-in landing page with policy stats, search, and recommendations
- `Profile.tsx`: Profile form and profile completion page
- `Policies.tsx`: Policy browsing and listing by category or filters
- `PolicyDetail.tsx`: Policy details page for a single policy record
- `Chat.tsx`: Conversational AI assistant page with chat, voice support, and language switching
- `Notifications.tsx`: Notification UI placeholder
- `NotFound.tsx`: 404 fallback route

### Core business logic (`src/lib/`)

#### `src/lib/types.ts`
- Defines the central TypeScript types for the app
- Includes user profile, policy record, eligibility result, RAG result, LLM response, chat message, and request/response payloads

#### `src/lib/policyData.ts`
- Contains policy categories, Indian states, occupations, and social categories
- Provides structured data values used across filters and UI

#### `src/lib/eligibilityEngine.ts`
- Implements policy eligibility checks against a user profile
- Evaluates age, income, gender, occupation, state, category, rural status, land ownership, and business ownership
- Returns eligibility status, score, reasons, matched rules, and missing fields
- Includes ranking logic to order policies by eligibility and benefit score

#### `src/lib/rag.ts`
- Implements a simple retrieval-augmented generation (RAG) policy retrieval layer
- Fetches policies from Supabase and compares query embeddings to policy embeddings
- Returns the top similar policies for a user query
- Supports optional filters like category, state, and occupation

#### `src/lib/policyQuery.ts`
- Client-side wrapper to call the `policy-query` Supabase function
- Sends user query, profile access permission, language, and chat history
- Handles API responses and errors consistently

#### `src/lib/policyAssistantApi.ts`
- Client-side wrapper for Supabase functions used by the dashboard and AI assistant
- Contains `fetchDashboardData` and `fetchAiChat` methods

#### `src/lib/profileService.ts`
- (Referenced in the code) likely handles loading user profile data from Supabase directly
- Used by dashboard and chat when profile data is required

#### `src/lib/embeddings.ts`, `src/lib/llm.ts`, `src/lib/pprag.ts`, `src/lib/policyFallbacks.ts`
- Additional helper modules for embeddings, LLM integrations, fallback logic, and policy processing
- These modules support the AI workflow, although the primary user-facing logic is mostly in `eligibilityEngine`, `rag`, and `policyQuery`

## Backend and serverless functions (`supabase/functions/`)

This project uses Supabase Edge Functions to implement server-side data and AI workflows.

### `supabase/functions/policy-query/index.ts`
- Receives a policy query from the frontend
- Optionally loads the user profile from Supabase if allowed
- Builds a prompt for Gemini using query, profile, and chat history
- Calls the Gemini generative language API
- Returns structured AI response data

### `supabase/functions/dashboard-data/index.ts`
- Receives a user ID from the frontend
- Loads the latest profile for that user
- Loads all policies from Supabase
- Evaluates policy eligibility using the shared policy engine
- Returns profile, eligible list, not-eligible list, and all policy data for dashboard rendering

### `supabase/functions/policy-chat/index.ts`
- Similar to `policy-query` but focused on conversational policy assistance
- Takes user query, profile data, and retrieved policies
- Calls Gemini to create a helpful policy-specific answer
- Returns AI answer and rich response metadata

### `supabase/functions/_shared/policy-engine.ts`
- Shared backend eligibility logic used by edge functions
- Implements normalized profile loading, eligibility checks, and intent detection
- Ensures the same policy screening logic can be reused in multiple functions

## Data sources and storage

- `policies` table in Supabase stores policy metadata, eligibility rules, benefit details, and optional embeddings
- `profiles` or `public_profiles` tables store user profile records
- Supabase Auth manages user accounts and sessions
- Environment variables used:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`

## How the app works in practice

1. User visits the landing page and signs in or signs up.
2. After login, the user completes a profile on the `Profile` page.
3. The dashboard loads policy data and eligibility status via the `dashboard-data` function.
4. The user can browse policies, search, and view policy detail pages.
5. If they need help, they can ask the AI assistant on `Chat`.
6. The chat sends the query and optional profile data to `policy-query`, which forwards the prompt to Gemini and returns a conversational answer.

## Overall architecture

- Frontend: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Authentication + database: Supabase
- Serverless logic: Supabase Edge Functions in Deno
- AI assistant: Gemini generative language model
- Policy matching: mixture of rule-based eligibility engine and semantic retrieval (RAG)

## Important files and locations

- `README.md`: project overview and startup instructions
- `src/App.tsx`: app routes and provider setup
- `src/pages/Dashboard.tsx`: main personalized dashboard
- `src/pages/Chat.tsx`: chat assistant UI
- `src/lib/eligibilityEngine.ts`: eligibility evaluation and ranking
- `src/lib/rag.ts`: semantic policy retrieval
- `src/lib/policyQuery.ts`: frontend API wrapper for AI query
- `src/integrations/supabase/client.ts`: Supabase client initialization
- `supabase/functions/policy-query/index.ts`: AI query edge function
- `supabase/functions/dashboard-data/index.ts`: dashboard data edge function
- `supabase/functions/_shared/policy-engine.ts`: shared eligibility logic

## Summary

This project is a smart policy discovery and assistance platform built for Indian government schemes. It combines profile-based eligibility screening, policy search, and AI-powered assistance to help users understand which schemes apply to them and how to proceed.
