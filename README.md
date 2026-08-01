# HireWise — AI-Powered Hiring & Candidate Assessment Platform

HireWise is an end-to-end AI-powered hiring platform built with **Next.js (App Router)** and **Supabase**. It provides tailored, role-based portals for **Candidates**, **Recruiters**, and **System Administrators**, featuring live proctored coding assessments, automated resume parsing, AI question generation, and real-time recruitment analytics.

**Live Demo:** https://hirewise-zeta.vercel.app

---

## 🚀 Recent Key Features & Enhancements

### 1. Modern Interactive Landing Page & Portals Directory
- **Dynamic Hero Section**: Auth-aware CTAs ("Go to Dashboard" for authenticated users vs "Get Started Free" for guests).
- **Interactive Live Demo Modal**: Experience a 3-step simulated preview of HireWise AI in action:
  1. *AI Resume & Skill Screening*: Candidate match scoring, skill radar, and experience parsing.
  2. *Live Proctored Interview*: Multi-language code editor and anti-cheating webcam preview.
  3. *Recruiter Feedback Report*: Skill distribution, efficiency metrics, and fairness verification.
- **Role Portals Directory (`#portals`)**: Direct shortcut directory linking candidates, recruiters, and admins to their respective tools and dashboards.
- **Live Openings Feed (`#openings`)**: Fetches active positions from Supabase with instant apply shortcuts (`/candidate/jobs/[id]`).
- **Interactive Features, Pricing & FAQ**: Detailed capability cards, tiered pricing plans, and collapsible accordion FAQ.

### 2. Application-Wide Skeleton Loading System
- Replaced circular loading spinners across candidate, recruiter, and admin portals with custom animated **Skeleton UI components** (`Skeleton`, `SkeletonCard`, `SkeletonGrid`, `SkeletonTable`, `SkeletonDashboard`).
- Upgraded `LoadingSpinner.tsx` to automatically render Skeleton pulse blocks for a smooth, modern visual loading experience.

### 3. Performance & Speed Optimizations
- **Middleware Fast-Pathing**: Bypassed redundant Supabase auth network calls for all `/api/` endpoints and static assets, eliminating 300ms–1000ms fetch latency.
- **Next.js Package Compilation Optimization**: Added `experimental.optimizePackageImports` for `recharts`, `@monaco-editor/react`, and `lucide-react` in `next.config.ts`, improving production build compilation time by **37%** (from 23s to 14.4s).
- **In-Memory SWR Query Caching**: Implemented a client-side SWR cache in `useSupabase.ts` for instant page rendering on route transitions.
- **Instant Auth Profile Caching**: Cached user profile and role metadata in `sessionStorage` to prevent UI flickers or loading delays during route changes.

---

## 🎯 Key Capabilities by User Role

### 👤 Candidate Portal (`/candidate/*`)
- **Job Discovery & Application**: Browse open positions, filter by department/type, and submit applications (`/candidate/jobs`).
- **Interactive Interview Room**: Take proctored coding and behavioral assessments with real-time feedback (`/interview/[id]`).
- **Assessment Reports**: View AI-generated evaluation reports, score breakdowns, strengths, and areas for improvement (`/candidate/reports`).
- **Profile Management**: Upload resume (PDF parsing support), add experience, education, skills, and projects (`/candidate/profile`).

### 💼 Recruiter Suite (`/recruiter/*`)
- **Job Management**: Post and configure new positions with target skills and custom test durations (`/recruiter/jobs`).
- **ATS Candidate Pipeline**: Drag-and-drop Kanban board (`/recruiter/ats`) to manage candidate progression across pipeline stages.
- **Live Proctoring & Monitoring**: Monitor candidate video feeds, question progress, tab switches, and integrity alerts in real-time (`/recruiter/monitoring`).
- **AI Question Bank & Generator**: Generate custom technical and behavioral questions by skill and difficulty (`/recruiter/questions`).
- **Hiring Analytics**: Analyze hiring funnel conversion rates, average time per question, and skill performance radars (`/recruiter/analytics`).

### 🛡️ Admin & Compliance Hub (`/admin/*`)
- **System Overview & User Roles**: Manage user roles and system access controls (`/admin/users`).
- **AI Bias & Fairness Auditing**: Real-time bias alert monitoring (`/admin/bias-alerts`) to ensure equal opportunity and objective scoring.
- **Token & Cost Tracking**: Monitor AI API token consumption and model usage metrics (`/admin/ai-usage`).

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router with Turbopack)
- **Language:** TypeScript
- **Auth & Database:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Styling:** Tailwind CSS with Dark/Light Mode support
- **Code Editor:** Monaco Editor (`@monaco-editor/react`)
- **Charts & Visualizations:** Recharts
- **PDF Parsing:** `pdf-parse`
- **Validation:** Zod

---

## 📁 Project Structure

```text
.
├── src/
│   ├── app/                 # Next.js App Router routes (UI + API)
│   │   ├── api/             # Route handlers (AI, ATS, Applications, Jobs, Auth)
│   │   ├── admin/           # Admin pages (Users, Bias Alerts, AI Usage, Metrics)
│   │   ├── recruiter/       # Recruiter pages (Jobs, ATS Board, Monitoring, Questions, Analytics)
│   │   ├── candidate/       # Candidate pages (Jobs, Interviews, Reports, Profile)
│   │   ├── interview/       # Proctored AI Interview Room
│   │   ├── login/           # Auth login UI
│   │   ├── signup/          # Auth signup UI
│   │   ├── layout.tsx       # Root layout & providers
│   │   └── page.tsx         # Modern landing page
│   ├── components/          # Shared components (Header, Footer, Sidebar, UI)
│   │   ├── ui/              # Reusable UI (Skeleton, Modal, Card, FileUpload, etc.)
│   │   └── profile/         # Profile edit sections
│   ├── context/             # Auth & Theme context providers
│   ├── hooks/               # Supabase queries, Realtime monitoring, Proctoring hooks
│   ├── lib/                 # Gemini AI engine, Supabase clients, validation utilities
│   ├── types/               # TypeScript interfaces (ATS, Candidate, Job)
│   └── middleware.ts        # Optimized route protection & auth fast-pathing
├── supabase/                # Supabase assets and migrations
├── next.config.ts           # Compiler & package optimization config
└── package.json
```

---

## ⚙️ Getting Started (Local Development)

### 1) Install dependencies

```bash
npm install
```

### 2) Environment Configuration

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3) Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

- `npm run dev` — Start the local Next.js development server
- `npm run build` — Create an optimized production build
- `npm run start` — Run the compiled production server
- `npm run lint` — Execute ESLint code checks

---

## 📄 License

This repository is maintained for HIREWISE Technologies Inc. All rights reserved.
