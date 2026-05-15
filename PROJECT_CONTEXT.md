# ParentsToDo (Readably) — Project Context

## What this is

ParentsToDo is a parent-focused productivity app that converts 
kindergarten 알림장 (kidsnote notices) into structured todos. 
Users paste text or upload screenshots of notices; an LLM parses 
them into dates, tasks, materials, and warnings.

App identity: "어른이를 위한 todo" — a Sunsama-leaning, calm, 
document-style productivity tool for parents.

## Who uses this

**Real users: 2 people.** 
- Young (사영인 / Yiseoup) — Product Designer at Avikus, mom (박수민)
- Husband — dad

This is NOT a SaaS product or portfolio prop. It is a real 
private-family tool that Young and her husband will use daily to 
manage their child's 알림장. Scale: 2 users, 1 workspace, forever.

This scoping matters: complex permission systems, real-time 
WebSocket sync, scalable infra, etc. are NOT needed. Simple is 
correct.

## Sync model

Scenario 2 sync (NOT real-time WebSocket). When user A modifies 
data on phone, user B sees the change on next page load / app 
open. This is sufficient for a 2-person household where 
simultaneous editing is rare.

Implementation: fetch from DB on page load, write to DB on action. 
No subscriptions, no optimistic UI conflict resolution.

## Tech stack

- **Frontend**: Next.js 16.2.4, React 19, TypeScript, Tailwind 4, 
  shadcn/ui, Radix, lucide-react
- **Fonts**: Instrument Serif (h1 display) + Manrope (h2/h3) + 
  Noto Sans KR (body)
- **Database**: Neon (Postgres serverless)
- **Auth**: Google SSO via NextAuth.js or Auth.js
- **LLM**: OpenAI GPT-4 (with vision for screenshot parsing)
- **Deployment**: Vercel (assumed — confirm with user)

## Current state

**Frontend: complete.** 
- Sunsama-leaning design system locked in CLAUDE.md (warm palette, 
  terracotta accent, document-style hierarchy)
- All major screens working with mock data: calendar (month grid + 
  notice detail modal + date focus card), tasks (line tabs + 
  sections + outlined-card rows), add modal (text/screenshot 
  tabs)
- Line-style tabs, document-style hierarchy, outlined-card task 
  rows, muted section headers (#6E6153)

**Backend: not started.** 
- All data lives in `src/lib/mock-data.ts`
- State in `AppStateProvider` (client-side React context)
- `/api/parse-notice` route exists but LLM call may be broken 
  (screenshot parsing didn't work in last test)

## What's about to happen

Backend integration in 4 phases (see BACKEND_PLAN.md for 
specifics):

1. **LLM fix** — Get GPT-4 vision parsing screenshots correctly. 
   Currently broken.
2. **Neon DB integration** — Replace mock data with real DB reads/writes.
3. **Google SSO** — Two users (Young + husband) sign in with Google.
4. **Production deployment** — Vercel deploy, real .env, live URL.

## Design system rules (do not violate)

- Color tokens are in `src/app/globals.css` under `@theme inline`. 
  All colors must use tokens, not raw hex (with rare documented 
  exceptions).
- Font hierarchy: h1 Instrument Serif, h2/h3 Manrope, body Noto 
  Sans KR. Noto Sans KR only loads 400/500/700 — use font-medium 
  (500) not font-semibold (silently rounds to 700).
- Task row pattern: outlined-card-with-gap (border border-line/60, 
  space-y-2, rounded-md). Checked: bg-brand-soft/40. Unchecked: 
  bg-surface-strong/40.
- Section headers: text-[#6E6153] color (slightly cooler than 
  text-muted), font-medium, with hairline border-b underneath.
- Tabs: line-style (border-b-2 border-brand on active, 
  border-transparent on inactive). No pill tabs anywhere.
- Completion state: muted color, NOT strikethrough. Description 
  stays visible on completed rows.
- Detailed system: see `CLAUDE.md` in repo root.

## Working style

- Young is a designer, non-technical. She directs implementation 
  via prompts. AI writes the code.
- Korean app, English conversation for efficiency (avoids 
  keyboard switching).
- Prefer concrete code examples in prompts over abstract specs.
- Always summarize what changed after a task with before/after 
  for verifiable points.
- Korean tone in user-facing UI; English/Korean mix is OK in 
  internal docs and comments.

## Out of scope (do not propose)

- Real-time sync (WebSocket / Supabase Realtime / Pusher etc.)
- Complex permission system (admin/member/guest roles)
- Multiple workspaces per user
- Public sharing or invite links
- Push notifications (deferred to nice-to-have)
- PWA install (deferred to nice-to-have)
- Mobile app (web-only)