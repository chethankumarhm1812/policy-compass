# Policy Compass - Project Documentation

## 📋 Project Overview

**PolicyLens AI** (Policy Compass) is a smart web application that helps Indian citizens understand government policies and schemes personalized for them using AI analysis. The application provides intelligent policy recommendations, eligibility checking, and an AI assistant to answer questions about government schemes.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui (Radix UI based) |
| **Backend/Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **State Management** | React Context API + TanStack Query |
| **Forms** | React Hook Form |
| **Testing** | Vitest + Playwright |
| **Package Manager** | Bun or npm |

---

## 📁 Project Structure & File Descriptions

### Root Configuration Files

```
policy-compass/
├── package.json              # Project dependencies and build scripts
├── tsconfig.json             # TypeScript configuration (base)
├── tsconfig.app.json         # TypeScript configuration (app-specific)
├── tsconfig.node.json        # TypeScript configuration (build tools)
├── vite.config.ts            # Vite build and development server config
├── vitest.config.ts          # Vitest test runner configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration for CSS processing
├── eslint.config.js          # ESLint linting rules
├── components.json           # shadcn/ui components registry
├── playwright.config.ts      # E2E testing configuration
├── playwright-fixture.ts     # Custom Playwright test fixtures
├── bun.lockb                 # Lock file for dependency versions
├── index.html                # HTML entry point
├── README.md                 # Project overview and getting started
└── PROJECT_DOCUMENTATION.md  # This file
```

### 📂 `/src` - Application Source Code

#### **Entry Points**
- **`main.tsx`** - React DOM root initialization; renders the App component into the DOM
- **`App.tsx`** - Main application component; sets up routing, providers (QueryClient, Auth, Tooltip), and page routes
- **`index.css`** - Global CSS styles
- **`App.css`** - Application-specific styles
- **`vite-env.d.ts`** - TypeScript declarations for Vite environment variables

#### **`/pages`** - Page Components (UI Layer)
Each file represents a full page/route in the application:

| File | Purpose |
|------|---------|
| **`Index.tsx`** | Landing page for unauthenticated users; shows project overview |
| **`Auth.tsx`** | Authentication page (login/signup) using Supabase Auth |
| **`Dashboard.tsx`** | Main dashboard; displays personalized policies and policy recommendations |
| **`Policies.tsx`** | Browse and search all available policies; filter by category |
| **`PolicyDetail.tsx`** | Detailed view of a single policy with eligibility info |
| **`Chat.tsx`** | AI assistant chatbot for answering policy questions |
| **`Profile.tsx`** | User profile management; edit personal details for eligibility checks |
| **`Notifications.tsx`** | Display user notifications |
| **`NotFound.tsx`** | 404 error page for invalid routes |

#### **`/components`** - Reusable React Components

**Top-level Components:**
- **`Navbar.tsx`** - Navigation bar; displays links based on auth state
- **`NavLink.tsx`** - Custom navigation link component
- **`PolicyCard.tsx`** - Reusable card component for displaying policy previews
- **`DREModal.tsx`** - Modal for policy details/eligibility results

**`/ui`** - shadcn/ui Component Library
Contains pre-built, accessible UI components from Radix UI (30+ components):
- **Form Components**: `input.tsx`, `button.tsx`, `checkbox.tsx`, `radio-group.tsx`, `select.tsx`, `textarea.tsx`, `switch.tsx`
- **Layout Components**: `card.tsx`, `accordion.tsx`, `tabs.tsx`, `sidebar.tsx`, `sheet.tsx`
- **Dialog Components**: `dialog.tsx`, `alert-dialog.tsx`, `drawer.tsx`, `hover-card.tsx`, `popover.tsx`
- **Display Components**: `badge.tsx`, `avatar.tsx`, `tooltip.tsx`, `progress.tsx`, `skeleton.tsx`
- **Data Table**: `table.tsx`
- **Utility Components**: `toast.tsx`, `toaster.tsx`, `use-toast.ts`, `sonner.tsx`, `scroll-area.tsx`

#### **`/hooks`** - Custom React Hooks

| File | Purpose |
|------|---------|
| **`useAuth.tsx`** | Auth context provider and hook; manages user auth state (login, logout, user info) |
| **`use-toast.ts`** | Toast notification hook; display temporary notifications |
| **`use-mobile.tsx`** | Responsive design hook; detect if device is mobile |

#### **`/lib`** - Business Logic & Utilities

| File | Purpose |
|------|---------|
| **`eligibilityEngine.ts`** | Core algorithm for checking user eligibility against policies; contains UserProfile, Policy, and EligibilityResult interfaces |
| **`policyData.ts`** | Static policy data, categories, and sample policies (or data structure definitions) |
| **`utils.ts`** | Utility functions (classname merging, formatting, etc.) |

#### **`/integrations`** - External Service Integration

**`/supabase`** - Supabase Integration
- **`client.ts`** - Supabase client initialization; connects to PostgreSQL database and authentication
- **`types.ts`** - TypeScript interfaces for Supabase data models (User, Policy, Profile, etc.)

#### **`/test`** - Testing

| File | Purpose |
|------|---------|
| **`setup.ts`** | Vitest setup and configuration |
| **`example.test.ts`** | Example unit tests |

### 📂 `/supabase` - Backend & Database

**`/functions`** - Edge Functions (Serverless)
- **`policy-chat/index.ts`** - Edge function for AI chat; handles policy questions using LLM

**`/migrations`** - Database Migrations
- **`20260409140559_a1b1b352-5eaf-4059-8fbf-04c72e45f41a.sql`** - Initial database schema setup

**`config.toml`** - Supabase project configuration

### 📂 `/public` - Static Assets
- **`robots.txt`** - SEO robots configuration

---

## 🔄 Application Workflow & Data Flow

### **1. Authentication Flow**
```
User (Unauthenticated)
    ↓
Index.tsx (Landing Page)
    ↓
Auth.tsx (Login/Signup)
    ↓
Supabase Auth Service (Firebase-like authentication)
    ↓
AuthProvider Context (useAuth hook)
    ↓
User (Authenticated)
```

**How it works:**
1. User visits `/auth` page
2. Enters email and password
3. `useAuth` hook calls Supabase auth methods (`signUp` or `signIn`)
4. Supabase returns authentication token
5. AuthProvider stores user session globally
6. Protected routes check auth state and redirect if needed

---

### **2. Policy Discovery & Recommendation Flow**

```
User Profile Data
    ↓
Profile.tsx (User completes profile: age, income, location, etc.)
    ↓
Stored in: supabase.profiles table
    ↓
Dashboard.tsx (Displays personalized policies)
    ↓
eligibilityEngine.checkEligibility(profile, policy)
    ↓
Ranking Algorithm (rankPolicies function)
    ↓
PolicyCard Component (Renders ranked policies)
    ↓
User Can Click → PolicyDetail.tsx (View full details)
```

**How it works:**
1. User visits `/profile` and fills in personal details
2. Data saved to Supabase `profiles` table
3. Dashboard fetches user profile and all policies
4. For each policy, `eligibilityEngine` calculates eligibility score based on:
   - Age, income, gender, occupation
   - Location (state, district, rural/urban)
   - Category (SC/ST/OBC/General)
   - Land ownership status
5. Policies ranked by relevance
6. Top matches displayed as PolicyCards

---

### **3. Policy Search Flow**

```
Policies.tsx
    ↓
User Enters Search Query
    ↓
Filter/Search Backend Call (Supabase)
    ↓
Returns Matching Policies
    ↓
Display as PolicyCards
    ↓
User Clicks Card → PolicyDetail.tsx
```

**How it works:**
1. User navigates to `/policies`
2. Displays all policies in categories
3. User types search term → filters policies in real-time
4. Category filters available
5. Click on policy → detailed view

---

### **4. Eligibility Check Flow**

```
PolicyDetail.tsx
    ↓
"Check Eligibility" Button
    ↓
eligibilityEngine.checkEligibility(userProfile, policy)
    ↓
Returns: {
  status: 'eligible' | 'partial' | 'ineligible',
  reasons: [],        // Explanation of eligibility
  score: 85,          // Percentage match
  missingFields: []   // What info is needed
}
    ↓
DREModal or Toast (Show Result)
```

---

### **5. AI Chat Flow**

```
Chat.tsx
    ↓
User Asks Question About Policies
    ↓
Send to: /supabase/functions/policy-chat
    ↓
Edge Function (AI/LLM Processing)
    ↓
Returns: Natural Language Answer
    ↓
Display in Chat Interface
```

---

### **6. Data Management Flow**

```
Supabase Database
├── users (Authentication)
├── profiles (User demographic data)
├── policies (Policy database)
└── notifications (User notifications)
    ↓
Supabase Client (src/integrations/supabase/client.ts)
    ↓
React Query (TanStack Query)
    ↓
Component State & UI Updates
```

---

## 🔑 Key Concepts

### **User Profile Structure**
```typescript
{
  full_name: string
  age: number
  gender: string
  income: number
  occupation: string
  state: string
  district: string
  category: string (SC/ST/OBC/General)
  is_rural: boolean
  owns_land: boolean
}
```

### **Policy Structure**
```typescript
{
  id: string
  title: string
  description: string
  category: string
  eligibility_rules: object
  required_documents: string[]
  benefits: string[]
  application_steps: string[]
  apply_link: string
  min_age, max_age: number
  max_income: number
  target_gender: string
  target_occupations: string[]
  target_states: string[]
  target_categories: string[]
  is_rural_only: boolean
  benefit_score: number
}
```

### **Eligibility Result Structure**
```typescript
{
  status: 'eligible' | 'partial' | 'ineligible'
  reasons: string[]           // Why they qualify/don't qualify
  matchedRules: object        // Criteria they meet
  missingFields: string[]     // What info is missing
  score: number               // 0-100 eligibility percentage
}
```

---

## 🚀 Build & Run Commands

```bash
# Install dependencies
npm install
# or
bun install

# Development server (http://localhost:5173)
npm run dev
# or
bun run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Run tests
npm test

# Watch tests
npm run test:watch

# Lint code
npm run lint

# Preview production build
npm run preview
```

---

## 🔐 Protected Routes

Routes that require authentication (in `App.tsx`):
- `/dashboard` - Dashboard with personalized policies
- `/profile` - User profile management
- `/policies` - Browse all policies
- `/policy/:id` - Policy details
- `/chat` - AI assistant
- `/notifications` - Notifications

Public routes:
- `/` - Landing page (redirects to dashboard if logged in)
- `/auth` - Authentication

---

## 📊 Component Hierarchy

```
App
├── Navbar
├── Routes
│   ├── Index (public)
│   ├── Auth (public)
│   ├── Dashboard (protected)
│   │   └── PolicyCard (multiple)
│   ├── Policies (protected)
│   │   └── PolicyCard (multiple)
│   ├── PolicyDetail (protected)
│   │   ├── DREModal
│   │   └── eligibilityEngine (logic)
│   ├── Profile (protected)
│   ├── Chat (protected)
│   └── Notifications (protected)
├── Sonner Toaster (notifications)
├── Toaster (notifications)
└── TooltipProvider (hover tooltips)
```

---

## 🎯 State Management Flow

```
1. Authentication State
   └── AuthProvider (Context)
       └── useAuth Hook
           └── All protected components

2. Query State (Server Data)
   └── QueryClientProvider
       └── useQuery (in components)
           └── Fetch policies, profiles, etc.

3. Local Component State
   └── useState (in individual components)
       └── Form inputs, UI toggles, search queries
```

---

## 📝 Typical User Journey

1. **User visits** → `Index.tsx` (landing page)
2. **Clicks "Get Started"** → redirected to `/auth`
3. **Signs up** → `Auth.tsx` calls `useAuth.signUp()`
4. **Completes profile** → `/profile` page with form
5. **Views dashboard** → `/dashboard` shows personalized policies
6. **Searches policies** → `/policies` with filters
7. **Views policy details** → `/policy/:id` with eligibility check
8. **Asks AI questions** → `/chat` for policy assistance
9. **Receives notifications** → `/notifications`

---

## 🗄️ Database Schema (Supabase)

Based on the code structure, the database likely includes:

```sql
-- Supabase Auth (built-in)
users (id, email, created_at)

-- Custom tables
profiles (
  user_id (FK to users),
  full_name,
  age,
  gender,
  income,
  occupation,
  state,
  district,
  category,
  is_rural,
  owns_land
)

policies (
  id,
  title,
  description,
  category,
  eligibility_rules,
  required_documents,
  benefits,
  application_steps,
  min_age,
  max_age,
  max_income,
  target_gender,
  target_occupations,
  target_states,
  target_categories,
  is_rural_only,
  benefit_score,
  created_at
)

notifications (
  user_id (FK),
  message,
  read,
  created_at
)
```

---

## 🔗 API Integration Points

1. **Authentication** → Supabase Auth API
2. **Database Operations** → Supabase PostgREST API
3. **Real-time Features** → Supabase Realtime (if used)
4. **AI Chat** → Edge Function (`policy-chat`)
5. **External Links** → Policy application links

---

## 🚨 Error Handling

- **Auth Errors** → Redirect to `/auth`
- **API Errors** → Toast notifications
- **Invalid Routes** → `NotFound.tsx`
- **Loading States** → Skeleton loaders, spinners

---

## 📱 Responsive Design

- Mobile detection via `use-mobile.tsx` hook
- Tailwind CSS responsive classes
- shadcn/ui components are mobile-friendly by default
- Drawer component for mobile navigation

---

## 🧪 Testing Strategy

- **Unit Tests** → Vitest (`vitest.config.ts`)
- **Component Tests** → React Testing Library (implied)
- **E2E Tests** → Playwright (`playwright.config.ts`)
- **Test Examples** → `/src/test/example.test.ts`

---

## 📋 Summary Table

| Feature | File | Technology |
|---------|------|-----------|
| Routing | `App.tsx` | React Router |
| Authentication | `useAuth.tsx` | Supabase Auth |
| UI Components | `/components/ui` | shadcn/ui (Radix) |
| Eligibility Logic | `eligibilityEngine.ts` | TypeScript |
| Database | Supabase | PostgreSQL |
| Styling | `tailwind.config.ts` | Tailwind CSS |
| API Client | `supabase/client.ts` | Supabase JS SDK |
| State (Server) | `App.tsx` | TanStack Query |
| Notifications | `use-toast.ts` | shadcn/ui + Sonner |

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Project:** Policy Compass / PolicyLens AI
