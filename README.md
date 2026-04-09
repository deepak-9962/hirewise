# HireWise

HireWise is an AI-powered hiring platform built with **Next.js (App Router)** and **Supabase**. It supports role-based experiences for **Candidates**, **Recruiters**, and **Admins**, and includes protected areas like dashboards and an interview flow.

**Live Demo:** https://hirewise-zeta.vercel.app

---

## Key Features

- **Role-based authentication & routing** (Candidate / Recruiter / Admin)
- **Protected dashboards and flows** (middleware enforced)
- **AI-assisted hiring experience** (routes grouped under API like `ai`, `ats`, etc.)
- **Interview module** (`/interview`)
- **Analytics-ready UI tooling** (Recharts)
- **Coding/assessment-ready tooling** (Monaco Editor)
- **Resume/PDF parsing support** (`pdf-parse`)

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Auth / DB:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **UI / Styling:** Tailwind CSS
- **Charts:** Recharts
- **Editor:** Monaco Editor (`@monaco-editor/react`)
- **Validation:** Zod
- **PDF Parsing:** pdf-parse

---

## Project Structure (High Level)

```text
.
├── src/
│   ├── app/                 # Next.js App Router routes (UI + API)
│   │   ├── api/             # Route handlers grouped by domain
│   │   ├── admin/           # Admin pages
│   │   ├── recruiter/       # Recruiter pages
│   │   ├── candidate/       # Candidate pages
│   │   ├── interview/       # Interview pages
│   │   ├── login/           # Auth UI
│   │   ├── signup/          # Auth UI
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   ├── components/          # Shared UI components
│   ├── context/             # React context providers
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities (Supabase middleware, etc.)
│   ├── types/               # Shared TS types
│   └── middleware.ts        # Global middleware entry
├── supabase/                # Supabase-related assets/config (if any)
├── migration.sql            # SQL migration(s)
├── next.config.ts
└── package.json
```

---

## Authentication & Route Protection

This project uses a Next.js middleware that integrates with Supabase (SSR client) to:

- Maintain/refresh auth sessions on requests
- Redirect unauthenticated users away from protected routes
- Redirect authenticated users away from `/login` and `/signup` to the correct dashboard based on role

### Protected route prefixes

The middleware protects these paths:

- `/candidate`
- `/recruiter`
- `/admin`
- `/interview`

If a user is not logged in and tries to access one of these routes, they are redirected to:

- `/login?redirect=<original_path>`

### Role-based dashboard redirect

When a logged-in user visits `/login` or `/signup`, they are redirected based on the `profiles.role` field:

- `candidate` → `/candidate/dashboard`
- `recruiter` → `/recruiter/dashboard`
- `admin` → `/admin/dashboard`

> Note: If no role is found, it falls back to `candidate`.

---

## API Routes

This repo contains API route groups under:

```text
src/app/api/
├── ai/
├── applications/
├── ats/
├── auth/
├── candidate/
├── interview/
├── jobs/
└── migrate/
```

Each folder typically contains Next.js Route Handlers (e.g., `route.ts`) to support the platform domains.

---

## Getting Started (Local Development)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env.local` file in the project root and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> The middleware intentionally **skips Supabase session updates** if these variables are missing (useful for some build/edge cases), but authentication and protected routes will not function correctly without them.

### 3) Run the dev server

```bash
npm run dev
```

Open:

- http://localhost:3000

---

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint

---

## Deployment

This app is suitable for deployment on **Vercel** (commonly used for Next.js). Make sure your production environment variables are set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Database & Migrations

The repository includes:

- `migration.sql` — SQL migration file(s)

If you use Supabase migrations, you can apply them using your preferred workflow (Supabase CLI or manual SQL execution in Supabase SQL editor), depending on how you manage environments.

---

## Contributing

Contributions are welcome. Typical workflow:

1. Fork the repo
2. Create a feature branch
3. Commit changes with a clear message
4. Open a pull request

---

## License

No license file is currently included in the repository. If you plan to open-source this project, consider adding a `LICENSE` file (MIT, Apache-
