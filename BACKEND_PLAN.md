# Backend Integration Plan

## Overview

Take the existing frontend (currently mock-data + AppStateProvider) 
and connect to real backend: Neon Postgres for data, Google SSO 
for auth, OpenAI GPT-4 for notice parsing. Target: working 
private-family tool in ~1 week.

## Phase 1: Fix LLM notice parsing (2-3 days)

**Goal**: When user pastes text or uploads a 알림장 screenshot, 
GPT-4 returns a clean structured JSON that populates the notice 
review screen.

**Current state**:
- `/api/parse-notice/route.ts` exists but screenshot upload didn't 
  work in last test. Need to inspect actual code.
- Likely issues: (1) image not sent correctly to GPT-4 vision API, 
  (2) prompt insufficient for Korean kidsnote format, (3) JSON 
  parsing fragile.

**Expected JSON output shape** (matches current Notice type in 
`src/lib/mock-data.ts`):

```json
{
  "title": "Library Day & Apron Reminder",
  "source": "Library Day & Apron Reminder, Apr 21 note",
  "summary": {
    "schedules": ["Library day"],
    "tasks": ["Return reading folder"],
    "materials": ["Pack art apron"]
  },
  "priorities": [
    { "title": "Pack art apron", "description": "Needed for messy painting." },
    { "title": "Return reading folder", "description": "" }
  ],
  "timeline": [
    {
      "date": "2026-04-22",
      "items": [
        { "title": "Return reading folder", "description": "Library day" },
        { "title": "Pack art apron", "description": "Needed for messy painting." }
      ]
    }
  ],
  "materials": [
    { "category": "준비", "items": ["Pack art apron · Needed for messy painting."] }
  ],
  "warnings": [],
  "learned": [
    { "title": "Class update", "description": "The class practiced spring songs and worked on a flower collage." }
  ]
}
```

**Tasks**:

1. Inspect `/api/parse-notice/route.ts` current state.
2. Confirm OpenAI client setup (env var `OPENAI_API_KEY` in 
   `.env.local`).
3. For text input: use `gpt-4o` or `gpt-4-turbo` text model, send 
   notice text + system prompt with JSON schema.
4. For screenshot input: use `gpt-4o` with vision capability, send 
   image (base64 or URL) + system prompt.
5. System prompt should:
   - Be in Korean (model handles Korean well, prompt in Korean for 
     better Korean comprehension)
   - Show 1-2 example inputs and outputs (few-shot)
   - Explicitly specify the JSON schema
   - Tell the model to return ONLY JSON (no markdown fences, no 
     prose)
6. Add JSON parsing with try-catch; on failure, return a clear 
   error message.
7. Test with real kidsnote screenshots (Young will provide).

**Files likely affected**:
- `src/app/api/parse-notice/route.ts` — the API route
- `src/components/add/add-notice-form.tsx` — calls the API and 
  handles loading/error states

## Phase 2: Neon DB integration (2-3 days)

**Goal**: Persist notices, tasks, and check states to Neon Postgres 
instead of mock data.

**Tech choices**:
- Neon serverless Postgres (already chosen)
- Drizzle ORM (recommended for type safety with TS + Next.js)
- `@neondatabase/serverless` driver

**Schema**:

```sql
-- users (managed by NextAuth via Google SSO — see Phase 3)
-- For now, just assume a users table will exist with id, email, name

-- workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- workspace_members (Young's family workspace will have 2 rows)
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (workspace_id, user_id)
);

-- notices
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT,
  raw_text TEXT,                 -- the original pasted text or OCR text
  parsed_json JSONB NOT NULL,    -- the GPT-4 output
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- tasks (one row per item in 가장 먼저 할 일)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  category TEXT,                 -- "제출" / "준비물" / "숙제" / "일반"
  done BOOLEAN DEFAULT FALSE,
  done_by UUID REFERENCES users(id),
  done_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tasks**:

1. Set up Neon project, get connection string into 
   `.env.local` as `DATABASE_URL`.
2. Install Drizzle (`drizzle-orm`, `drizzle-kit`).
3. Define schema in `src/db/schema.ts`.
4. Run migration to create tables.
5. Create `src/db/index.ts` exporting a Drizzle client.
6. Refactor `AppStateProvider`:
   - Replace mock data initialization with `fetch('/api/notices')`
   - Each action (add notice, toggle task) calls a corresponding 
     API route that writes to DB
   - On success, refetch or update local state optimistically
7. Create API routes:
   - `GET /api/notices` — list all notices for current workspace
   - `POST /api/notices` — create new notice (from parsed GPT-4 
     output)
   - `PATCH /api/tasks/:id` — toggle done state
   - `DELETE /api/notices/:id` — delete notice (optional)

**Files likely affected**:
- New: `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`
- New: `src/app/api/notices/route.ts`, 
  `src/app/api/tasks/[id]/route.ts`
- Modified: `src/components/providers/app-state-provider.tsx`
- Modified: `package.json` (new deps)

## Phase 3: Google SSO (2 days)

**Goal**: Young + husband sign in with Google. After sign-in, they 
land in their shared workspace.

**Tech**: NextAuth.js (Auth.js v5) with Google provider.

**Tasks**:

1. Set up Google OAuth credentials in Google Cloud Console.
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` 
     for dev, plus production URL.
2. Install `next-auth` (v5 beta if needed for Next 16).
3. Configure NextAuth with Google provider + Drizzle adapter 
   (handles users + sessions tables automatically).
4. Create `src/app/api/auth/[...nextauth]/route.ts`.
5. Create login UI:
   - Simple `/login` page with "Sign in with Google" button
   - Restrict to specific emails (Young's + husband's) using 
     NextAuth's `signIn` callback
6. Add middleware to protect all routes except `/login`:
   - `src/middleware.ts` — redirect to `/login` if no session
7. On first sign-in:
   - Auto-create workspace if user has none
   - Add user to workspace as member
   - Second user sign-in: needs to be invited (manually add to 
     workspace_members table OR auto-add if email is on a 
     whitelist)
8. Update workspace header UI to show real user name from session 
   (currently shows hardcoded "Yiseoup's kidsnote").

**Files likely affected**:
- New: `src/app/api/auth/[...nextauth]/route.ts`
- New: `src/app/login/page.tsx`
- New: `src/middleware.ts`
- New: `src/lib/auth.ts` (NextAuth config)
- Modified: `src/components/app/workspace-header.tsx`
- Modified: `src/db/schema.ts` (NextAuth tables added via adapter)

## Phase 4: Production deployment + real-use debugging (2-3 days)

**Goal**: Deploy to Vercel with real env vars, install on Young's 
and husband's phones (as PWA or just web bookmark), use it daily, 
debug what breaks.

**Tasks**:

1. Deploy to Vercel:
   - Connect GitHub repo
   - Set environment variables: `DATABASE_URL`, `OPENAI_API_KEY`, 
     `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, 
     `NEXTAUTH_URL`
   - Add production redirect URI to Google OAuth config
2. Test full flow end-to-end:
   - Both users can sign in
   - Add a notice via paste — saves, both users see it
   - Add a notice via screenshot — GPT-4 parses correctly
   - Toggle a task — saves, other user sees it on refresh
3. Mobile-specific testing:
   - Test on actual iPhone/Android (not just desktop resize)
   - Verify modal renders as bottom sheet on mobile
   - Verify drag-and-drop falls back to file picker on mobile
4. Real-world bugs to expect:
   - Long notice text overflowing layouts
   - Korean date format edge cases
   - GPT-4 JSON output occasionally malformed
   - Loading states feeling slow on phone networks
5. Polish based on findings.

**Files likely affected**: lots, depending on what breaks.

## Decision log (update as you go)

- 2026-05-14: Chose Scenario 2 sync (fetch on load, write on 
  action). NOT real-time.
- 2026-05-14: Chose Neon over Supabase.
- 2026-05-14: Chose GPT-4 over Claude / Gemini for LLM (familiar 
  to user).
- (Add more as decisions are made.)

## Open questions

- Will deployment be on Vercel? (Assumed yes — Next.js default. 
  Confirm.)
- For initial workspace + member setup: manual SQL insert via 
  Neon console, or build a UI? (Recommend: manual for now, 2 
  users only.)
- Mobile: PWA install or just browser bookmark? (PWA is small 
  effort, lets the app feel native. Recommend PWA in Phase 4.)