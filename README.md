# Readably

Readably is a mobile-first MVP web app for parents who need to turn long kindergarten or daycare notices into something immediately usable:

- calendar events
- actionable tasks
- packing and preparation checklist items
- reference information that should stay visible but not clutter the task list

This repo is intentionally demo-first. It works without auth, backend env vars, or a real AI integration.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- local shadcn-style UI components
- local mock data with demo-mode persistence via `localStorage`

## What’s included

- `Calendar` tab
  Shows a month grid or list view, summary cards, and a selected-day preview with events, tasks, packing items, and saved notice context.

- `Add` tab
  Lets a parent paste text or upload a screenshot, set a base date for relative phrases, run the mock parser, review editable AI output, and save only after confirmation.

- `Tasks` tab
  Shows only actionable checklist items, grouped by time bucket for fast execution.

- Demo workspace model
  Includes a shared family workspace with `Mom` and `Dad`, plus completion ownership on checklist items.

- Parser placeholder route
  `src/app/api/parse-notice/route.ts` is ready to be replaced with real OCR + LLM parsing later.

## Demo behavior

- The app seeds one realistic long school notice and one earlier saved note.
- If backend or auth env vars are missing, the UI stays in demo mode automatically.
- Parsed results are mocked with rule-based extraction in `src/lib/mock-parser.ts`.
- Saved demo state persists locally in the browser.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000/calendar](http://localhost:3000/calendar).

## Project structure

```text
src/
  app/
    (tabs)/
      calendar/
      add/
      tasks/
    api/parse-notice/
  components/
    app/
    add/
    calendar/
    tasks/
    providers/
    ui/
  lib/
  types/
```

## Future integration notes

- Replace the mock parser inside `src/app/api/parse-notice/route.ts`.
- Move persisted demo state from `localStorage` to a real backend or shared workspace store.
- Add Google login and workspace/member syncing without changing the core UI model.
- Extend screenshot upload from mock mode to OCR-backed parsing.

## Commands

```bash
npm run dev
npm run lint
npm run build
```
