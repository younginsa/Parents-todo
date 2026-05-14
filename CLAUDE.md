@AGENTS.md

## Design System (Sunsama-leaning, May 2026)

This is the durable system. New components, refactors, and visual changes must conform to these tokens and conventions. **Never introduce inline arbitrary values for color, radius, shadow, or z-index — always use tokens.**

Source of truth: [src/app/globals.css](src/app/globals.css). All tokens live in `:root` and are exposed to Tailwind 4 via `@theme inline`. Type and z-index utilities are defined as `@utility` because Tailwind 4's `@theme inline` inlines values at build time, which prevents the responsive `@media` overrides on CSS vars from working.

Font wiring: [src/app/layout.tsx](src/app/layout.tsx).

---

### Color tokens

| Token | Value | Tailwind utility | Use |
| --- | --- | --- | --- |
| `--background` | `#FAF7F1` | `bg-background` | Page background — warm off-white |
| `--foreground` | `#1F1A14` | `text-foreground` | Default text — warm near-black |
| `--surface` | `#FFFFFF` | `bg-surface` | Cards, dropdowns, popovers — pure white for clean lift on warm bg |
| `--surface-strong` | `#F2EDE2` | `bg-surface-strong` | Inset/grouped panels, neutral callouts, hover state |
| `--line` | `#E7DFD0` | `border-line` | All borders — warm parchment |
| `--muted` | `#6E6253` | `text-muted` | Secondary text — warm taupe (AA on bg ~5.1:1, on surface ~5.6:1) |
| `--brand` | `#A85C2E` | `bg-brand`, `text-brand` | **Single accent** — primary CTA, active state, today marker, focus ring |
| `--brand-soft` | `#F4E9DD` | `bg-brand-soft`, `text-brand-soft` | Hover-on-brand, today-cell tint, soft chips |
| `--danger` | `#9B3D2E` | `text-danger`, `bg-danger` | Genuinely urgent flags — overdue, errors |
| `--danger-soft` | `#F4E2DC` | `bg-danger-soft` | Soft danger fill (timeline most-urgent row) |

`--accent` does NOT exist. Earlier versions had it; it was folded into `--brand` so the app has a single accent.

---

### Type scale

Sizes are CSS vars on `:root` with desktop overrides at `(min-width: 768px)`. Utilities are defined as `@utility` and bind family + size + line-height + weight in one class.

| Utility | Mobile | Desktop | Line-height | Weight | Family | Use |
| --- | --- | --- | --- | --- | --- | --- |
| `text-display` | `28px` | `34px` | `1.15` | `400` | `--font-display` (Instrument Serif) | Page title (h1) only |
| `text-h2` | `18px` | `20px` | `1.3` | `600` | `--font-heading` (Manrope) | Section headings, `CardTitle`, group labels |
| `text-h3` | `15px` | `16px` | `1.4` | `600` | `--font-heading` (Manrope) | Sub-sections |
| `text-body` | `15px` | `15px` | `1.55` | `400` | `--font-body` (Noto Sans KR) | Default body |
| `text-body-sm` | `13px` | `13px` | `1.5` | `400` | `--font-body` (Noto Sans KR) | Subtitle, dates, descriptions |
| `text-caption` | `11px` | `11px` | `1.3` | `600` + `uppercase` + `letter-spacing: 0.16em` | `--font-body` | Tag labels, weekday headers, meta strips |

Notes:
- `text-body` stays 15px both breakpoints — 16px reads heavy in dense card UIs.
- `text-h2` is intentionally only 18→20px so it doesn't compete with the serif h1.
- `text-display` weight is `400`, not bold — Instrument Serif's character comes from letterforms; bold flattens that.
- `text-caption` forces uppercase + 0.16em tracking. Don't use on Korean nav labels (Hangul + wide tracking fragments). Use `text-xs` (12px) for compact non-tag labels.

When a heavier weight is needed on a `text-*` utility, append `font-bold` / `font-medium` after — Tailwind utility ordering should let it override. Verified working for `text-body font-bold` (calendar day numbers).

---

### Radius scale

| Token | Value | Tailwind | Use |
| --- | --- | --- | --- |
| `--radius-sm` | `6px` | `rounded-sm` | Chips, tags, day-cell event pills |
| `--radius` | `10px` | `rounded` | Buttons, segmented control items |
| `--radius-md` | `12px` | `rounded-md` | Inputs, list rows, sub-cards, menu items |
| `--radius-lg` | `14px` | `rounded-lg` | **Main section cards** (the dominant `<Card>` use) |
| `--radius-xl` | `20px` | `rounded-xl` | Bottom sheet, full-screen modal, large dropdowns |
| `--radius-full` | `9999px` | `rounded-full` | Pills, avatars, workspace switcher chip |

The dominant card radius is `rounded-lg` (14px). Earlier versions used 18–22px which read playful/iOS-y; 14px reads document-like.

---

### Shadow scale

| Token | Value | Tailwind | Use |
| --- | --- | --- | --- |
| `--shadow-sm` | `0 1px 2px rgba(60,40,20,.04), 0 2px 6px rgba(60,40,20,.04)` | `shadow-sm` | Hover on flat cards, segmented-control container |
| `--shadow` | `0 4px 12px rgba(60,40,20,.06)` | `shadow` | Card resting (auto-applied via `.soft-card`) |
| `--shadow-md` | `0 8px 20px rgba(60,40,20,.08)` | `shadow-md` | Selected day cell, primary CTA emphasis |
| `--shadow-lg` | `0 16px 40px rgba(60,40,20,.12)` | `shadow-lg` | Dropdowns, modals, bottom sheets |

All shadows use the warm `rgba(60, 40, 20, …)` cast — never the cool slate `rgba(15, 23, 42, …)` from earlier versions.

Inverse-axis shadows (upward, leftward) are not in the scale. The two existing one-offs in [src/app/(tabs)/calendar/page.tsx](src/app/(tabs)/calendar/page.tsx) — bottom-sheet and right-side-panel — are inlined with the matching warm rgba and `shadow-lg` magnitude. If you need one elsewhere, follow the same pattern: `shadow-[0_-16px_40px_rgba(60,40,20,0.12)]` or similar.

---

### Z-index scale

| Token | Value | Tailwind | Use |
| --- | --- | --- | --- |
| `--z-base` | `0` | `z-base` | Default flow |
| `--z-dropdown` | `30` | `z-dropdown` | Dropdown anchor wrapper |
| `--z-sticky` | `60` | `z-sticky` | Sticky headers, fixed bottom nav |
| `--z-overlay` | `180` | `z-overlay` | Detail sheets, side panels, soft scrim backdrops |
| `--z-modal` | `400` | `z-modal` | Modals, full-screen overlays, modal backdrops |
| `--z-popover` | `420` | `z-popover` | Popovers above modals (e.g., profile dropdown above any modal) |

Defined as `@utility` (Tailwind 4 has no `--z-*` namespace). Backdrop and panel pairs at the same z-level rely on DOM order — backdrop renders first, panel second, so the panel paints on top.

---

### Font stack

```
--font-display:  Instrument Serif → Manrope → Noto Sans KR → serif
--font-heading:  Manrope → Noto Sans KR → sans-serif
--font-body:     Noto Sans KR → Manrope → sans-serif
```

Wired in [src/app/layout.tsx](src/app/layout.tsx) via `next/font/google`:

- **Instrument Serif** (`weight: "400"`) → `--font-display` — h1 page titles only
- **Manrope** (`weight: ["500","600","700"]`) → `--font-heading` — h2/h3 section headings, `CardTitle`
- **Noto Sans KR** (`weight: ["400","500","700"]`) → `--font-body` — all body text

Korean h1 falls back to Noto Sans KR (the serif Instrument Serif has no Hangul glyphs). **This is intentional**, not a bug. Korean serif at display size reads heavy/formal and fights the calm Sunsama feel; Noto Sans KR at weight 400 stays clean. The cross-script asymmetry (English h1 in serif, Korean h1 in sans) is the correct choice.

Noto Sans KR is loaded with weights `400, 500, 700`. Requested `font-semibold` (600) falls back upward to 700 per CSS font-matching, so **avoid `font-semibold` for differentiation** — it renders identically to `font-bold`. Use `font-medium` (500) and `font-bold` (700) for visible weight contrast. Inline `style={{ fontWeight: N }}` is the safest override when the cascade is ambiguous.

---

### Conventions

**Visual:**
- **No gradients anywhere** — page headers, callouts, summary cards, today markers all flat
- **No inline arbitrary color/radius/shadow values** — always use the token utilities. If a value seems missing from the scale, propose extending the scale rather than inlining
- **Single brand accent** — `#A85C2E` terracotta is the only accent across the app; no secondary blue, no second tonal hue
- **Tag/category distinction by icon or weight, not color** — earlier versions colored event vs. task vs. packing differently (orange/sage/etc.); current rule is to use one warm tone (`bg-brand-soft`) plus iconography or weight to distinguish
- **Cards on warm bg are pure white** (`#FFFFFF`) — gives clean lift against `#FAF7F1` background; warm-tinted cards disappear into the page
- **Sections separated by spacing, not nested cards** — task groups, calendar timeline articles, etc. use `<section><h2>...<rows>` not `<Card><CardHeader>...<CardContent>`. Reserve `Card` for genuinely card-like containers (form input box, day-focus card, single-purpose detail panel)
- **Today marker** — 28px solid `bg-brand` circle around the date number, NOT a full-cell brand fill (full fill reads as "selected", not "today")

**Layout:**
- **Mobile-first with adaptive expansion** at two breakpoints:
  - Default: full-width, 16px gutters
  - `md` (768px+): `max-w-2xl` (672px) centered for content-dense pages
  - `lg` (1024px+): `max-w-3xl` (768px) centered for content-dense pages
- **Forms use focused-column pattern** — page header and form share the same narrow max-width and centering ([src/app/(tabs)/add/page.tsx](src/app/(tabs)/add/page.tsx) uses `max-w-[600px] mx-auto` on the input card)
- **Single-column hierarchy at all breakpoints** for the tasks page — stat strip and filter chips are header furniture for the list, not sibling columns. Never split into 2 columns
- **Bottom nav structurally has 3 slots** — currently `캘린더` / `추가` / `할 일`. The middle slot (`추가`) is intended to become a `+` action button in a future iteration; the two outer slots stay as real tabs

**Code:**
- `cn()` from [src/lib/utils.ts](src/lib/utils.ts) for class merging — uses `tailwind-merge` so later classes override earlier
- All client components marked `"use client"` at top
- i18n via [src/lib/i18n.ts](src/lib/i18n.ts) `useI18n()` returning `{ locale, t }`; never hardcode user-facing strings
- Date formatting always through [src/lib/date.ts](src/lib/date.ts) helpers; never call `format()` from `date-fns` directly in components — keeps locale handling consistent

**This is Next.js 16.** Read [node_modules/next/dist/docs/](node_modules/next/dist/docs/) before writing code that touches App Router, fonts, metadata, caching, or middleware. APIs and conventions differ from training data. Heed deprecation notices.

---

### Deferred / open decisions

- **Source-based task grouping** — current grouping is time-based (Today / Tomorrow / This Week / Later). Source-based grouping (by originating notice) was considered and not implemented. Reconsider only if user feedback explicitly asks for it.
- **`.section-grid` utility** in [src/app/globals.css](src/app/globals.css) is currently unreferenced (the `.dashboard-grid` utility was already removed in the same sweep). Candidate for future cleanup; left in place for now in case a section pair pattern re-emerges.
- **Inverse-axis shadow tokens** — bottom-sheet and side-panel shadows are inlined with warm rgba. If a third inverse-axis shadow appears, promote to tokens (`--shadow-up-lg`, `--shadow-left-lg`).
- **Real "today" detection** — calendar `MonthGrid` and tasks `getTaskTimeBucket` both read `DEMO_TODAY` from [src/lib/config.ts](src/lib/config.ts). When demo mode goes away, swap that constant to `new Date()` in one place; the cascade is automatic.
