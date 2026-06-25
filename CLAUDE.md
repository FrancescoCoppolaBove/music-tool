# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**tonic** — a music theory and composition web app. 27+ features covering chord voicings, scale tools, ear training, AI-assisted composition, pitch detection, and more.

## Commands

```bash
npm run dev          # start frontend (port 3000) + backend (port 3001) together
npm run dev:client   # frontend only
npm run dev:server   # backend only (tsx watch)
npm run build        # tsc + vite build
npm run lint         # ESLint, zero warnings allowed
```

No test suite. Validate changes by running `npm run build` (catches TypeScript errors) then testing in the browser with `npm run dev`.

## Architecture

### Navigation model
There is no React Router. Navigation is pure state: `activeTab: Tab` in `App.tsx`. The `GROUPS` array in `App.tsx` defines the nav structure — add a new feature by adding a `TabDef` to the right group, then adding a render branch in the `<main>` section.

### Feature modules
Every feature lives in `src/features/<name>/` and exports a single `*Feature.tsx` entry component. Features are self-contained — business logic, hooks, types, and subcomponents all live inside the feature folder. Shared code goes in `src/shared/`.

### Shared contexts (in `src/shared/context/`)
- `GlobalKeyContext` — the user's chosen musical key, persisted to `localStorage`, available to all features
- `AuthContext` — Firebase auth state (null user in local mode)
- `StatsContext` — practice streak and ear training statistics

### Firebase / local mode
Firebase is **optional**. `src/firebase.ts` exports `firebaseEnabled` (true only when all `VITE_FIREBASE_*` env vars are present). Cloud-dependent features (Practice Journal, Song Library, Daily Challenge, Profile) are gated behind `firebaseEnabled` and show a `<LocalModeNotice>` in local mode. All offline tools work without any `.env`.

### Backend
- **Dev**: Express at port 3001 (`src/api/server.ts`), proxied by Vite from port 3000.
- **Production (Netlify)**: Netlify Functions in `netlify/functions/` (`buddy.ts`, `score.ts`, `voicings.ts`). The `netlify.toml` redirect maps `/api/*` → `/.netlify/functions/:splat`.
- `AI_API_KEY` or `ANTHROPIC_API_KEY` is required server-side for Score → iReal Pro analysis and the AI chat (Modal Buddy).

### Path aliases (configured in `vite.config.ts`)
- `@` → `src/`
- `@features` → `src/features/`
- `@shared` → `src/shared/`

### Key dependencies
- `tonal` — all music theory computation (note names, intervals, scales, chords)
- `pitchy` — real-time pitch detection (used by Nail the Pitch and Chord Detection)
- `@anthropic-ai/sdk` — Claude API calls via the Express/Netlify backend

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` etc. | Firebase (optional — enables login + cloud sync) |
| `AI_API_KEY` / `ANTHROPIC_API_KEY` | Anthropic key for score analysis + Modal Buddy |

## Adding a new feature

1. Create `src/features/<name>/<Name>Feature.tsx`
2. Add a `TabDef` entry to the appropriate group in `GROUPS` (`App.tsx`)
3. Add a render branch in `<main>` in `App.tsx`
4. If the feature requires a backend endpoint, add it in `src/api/server.ts` (dev) **and** create a matching Netlify function in `netlify/functions/` (production)
