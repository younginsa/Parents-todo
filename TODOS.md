# TODOS

Deferred work from `/plan-ceo-review` 2026-05-15. See `~/.gstack/projects/ParentsToDo/ceo-plans/2026-05-15-backend-integration.md` for full context.

## ~~P1 — Sign-out UI~~ ✅ Done (commit c5e20b0)

## P1 — Husband invite flow

- **What**: Way for the husband to sign in and join Young's workspace as `dad` member without auto-creating a second workspace. Currently `ensureWorkspaceForUser` throws "워크스페이스가 이미 존재합니다" because the workspace already exists.
- **Why**: The whole 2-user model is broken without this. Right now only the first user to sign in can use the app.
- **Two design options**:
  1. **Invite link**: Young generates an invite token from her profile menu; husband clicks the link before sign-in; Clerk afterUserCreated webhook attaches him to the workspace with `role: 'dad'`. Production-grade.
  2. **Email allowlist auto-join**: Set `ALLOWED_EMAILS` env to both emails; on first sign-in for the 2nd email, auto-add to the existing workspace as `dad`. Quick hack for 2-user family scope.
- **Recommended**: Option 2 first (15 min, fits 2-user scale). Add Option 1 later if scope grows.
- **Pros**: Husband can actually use the app. Tests Scenario 2 sync end-to-end.
- **Cons**: Option 2 hardcodes the role assignment (2nd user is always dad). Fine for this household.
- **Effort**: S (human ~1 hr / CC ~15 min) for Option 2.
- **Priority**: P1.
- **Depends on**: nothing.

## P2 — Vercel Blob retention for original screenshots

- **What**: When a user uploads a kidsnote screenshot for parsing, store the original image in Vercel Blob (private, workspace-scoped). Save `blob_url` on the `notices` row.
- **Why**: Re-parse safety net. If GPT-4 misses something or prompt improves later, you can re-run extraction without asking the user to upload again. Also useful for "what did the original look like?" if the parsed JSON gets questioned.
- **Pros**: Audit trail. Re-parsing on prompt upgrades. Recovers from bad parses without burdening user.
- **Cons**: Extra moving part. Storage cost (negligible at 2-user scale). Privacy: storing kindergarten content.
- **Effort**: S (human ~3 hrs / CC ~25 min).
- **Priority**: P2.
- **Depends on**: Phase 1 (LLM parsing) shipping first.

## P3 — Auto-fetch from kidsnote.net

- **What**: Background job polls kidsnote.net for new 알림장 entries (per workspace), parses them, inserts as `notices` rows. User opens app and notices are already there.
- **Why**: This is the cathedral — never copy/paste, never screenshot. Notices just appear.
- **Pros**: 10x experience. Push toward platonic ideal.
- **Cons**: Requires reverse-engineering kidsnote.net session auth or finding an API. Probably brittle. Research-heavy.
- **Effort**: L (human ~1-2 weeks / CC ~1.5 days, plus research).
- **Priority**: P3. Run a separate `/office-hours` first to decide whether to pursue.

## P3 — Vercel BotID on /login

- **What**: Drop-in BotID on the `/login` route to reject bot sign-in attempts.
- **Why**: Public Google SSO endpoints are a low-effort bot target. 5-minute hardening.
- **Pros**: Minor security posture improvement, near-zero cost.
- **Cons**: Adds a vendor lock-in point. Probably overkill at 2 users.
- **Effort**: XS (human ~30 min / CC ~5 min).
- **Priority**: P3.
- **Depends on**: Phase 3 (Clerk login UI) shipping first.

## P2 — Migrate from `drizzle-kit push` to `drizzle-kit generate` + `migrate`

- **What**: Switch Drizzle workflow from direct schema sync (`push`) to file-based migrations (`generate` → commit SQL → `migrate` on deploy).
- **Why**: `push` is fine for v1 (no live users, schema churning). Once both users are on prod, schema changes need traceable, reversible migration files — not "I clicked push and hoped."
- **Trigger to do this**: First schema change after both users have created data on prod.
- **Pros**: Auditable schema history. Safer rollouts. Standard Drizzle prod pattern.
- **Cons**: Slightly more ceremony per change. Have to remember to generate before push.
- **Effort**: XS (human ~30 min / CC ~10 min) — one-time tooling switch.
- **Priority**: P2.
- **Depends on**: Schema stable, both users have prod data.

## P3 — Streaming LLM parse (`streamObject`)

- **What**: Upgrade the parse loading state from skeleton+rotating-text to live token streaming via AI SDK `streamObject()`. Parsed fields appear progressively.
- **Why**: Feels magical instead of "wait then result." Skeleton state was chosen for v1 (less complexity); this is the polished version.
- **Pros**: 10x perceived quality on the core daily action.
- **Cons**: Streaming partial JSON has edge cases (incomplete arrays, mid-string cutoffs). Adds AI SDK streaming dependency surface.
- **Effort**: S (human ~5 hrs / CC ~45 min).
- **Priority**: P3.
- **Depends on**: Phase 1 (basic LLM parse) shipping first with the skeleton state.
