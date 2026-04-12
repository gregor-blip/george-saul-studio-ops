

## George & Saul Studio Operations Dashboard — Application Shell

### Overview
Building the complete application shell for an internal dark-mode dashboard for a New York design studio. This includes authentication, sidebar navigation, and empty page stubs for 8 routes. No data or charts — shell only.

### 1. Install Dependencies & Configure Fonts
- Install `geist` npm package
- Configure `fontFamily.sans` (Geist Sans) and `fontFamily.mono` (Geist Mono) in `tailwind.config.ts`
- Import Geist font CSS in `main.tsx`

### 2. Update Design System for Dark-Only Theme
- Replace `index.css` CSS variables with dark palette (#0A0A0A background, #141414 cards, white/8% borders)
- Force dark mode globally — no toggle

### 3. Login Page (`/login`)
- Centered card on #0A0A0A background with "G&S" wordmark + "Studio Operations" subtitle
- Email + password inputs (dark-styled shadcn Input)
- Blue "Sign in" button (#0070F3)
- Error state in red-400
- Wired to Supabase Auth (email/password), redirects to `/dashboard` on success

### 4. Auth Context & Route Guard
- Auth provider using Supabase `onAuthStateChange` + `getSession`
- Protected route wrapper redirecting unauthenticated users to `/login`
- `/` redirects to `/dashboard` or `/login` based on session

### 5. Sidebar Layout
- 240px fixed sidebar with:
  - "G&S" wordmark at top
  - Nav sections: main routes, "DATA" label group, "COMPARE" label group
  - Lucide icons for each nav item
  - Active state with blue accent bar + white text
  - User email + sign out pinned at bottom
- Main content area: `bg-[#0A0A0A] flex-1 overflow-y-auto px-8 py-8`

### 6. Page Stubs (8 pages)
Each page shows title, subtitle, and one dashed placeholder card:
- `/dashboard` — Studio Overview
- `/clients` — Clients
- `/team` — Team
- `/projects` — Projects
- `/pipeline` — Pipeline
- `/data` — Data Management
- `/settings/legos` — Lego Catalogue
- `/benchmarks` — Benchmarks

### 7. GitHub Repository
- Create `george-saul-dashboard` private repository and connect

### Guardrails
- No database modifications — query only
- No top nav, charts, data, dark/light toggle, notifications, search, or breadcrumbs
- TypeScript strict, no `any` types

