# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**tonic** — a music theory and composition web app. 27+ features covering chord voicings, scale tools, ear training, AI-assisted composition, pitch detection, and more.

## Commands

```bash
npm run dev          # start frontend (port 3000) + backend (port 3001) together
npm run dev:client   # frontend only
npm run dev:server   # backend only (tsx watch)
npm run dev:emulators # full app on Firebase Auth/Firestore emulators, billing on (fake Google sign-in, no real data)
npm run build        # tsc + vite build
npm run lint         # ESLint, zero warnings allowed
npm test             # all unit tests (guard, theory, transcriber, harmony)
npm run test:rules   # Firestore rules tests (emulator, needs Java)
npm run test:account # GDPR export/delete + billing webhook/quotas against the emulators
```

Node 22 (`.nvmrc`; Firebase 12 and firebase-tools require ≥ 20). CI (`.github/workflows/ci.yml`) runs lint, build, `npm test` and the emulator suites on every PR.

No UI test suite. Validate changes by running `npm run build` (catches TypeScript errors) then testing in the browser with `npm run dev`.

**Lint baseline:** pre-existing violations are frozen in `eslint-suppressions.json` (ESLint bulk suppressions) — new ones fail `npm run lint`. After fixing old ones run `npx eslint . --prune-suppressions`. Never add to the baseline to get a change through.

## Architecture

### Navigation model
There is no React Router. Navigation is pure state: `activeTab: Tab` in `App.tsx` (persisted in `sessionStorage` so reloads return to the same tool). The `GROUPS` array in `App.tsx` defines the nav structure.

### Code splitting (mobile performance)
Every tool is lazy-loaded from `src/featureRegistry.ts` (`lazyFeature` + `BY_TAB` map); nav items call `preloadTab` on hover/focus/touch. Only Home and the login screen are eager. Firestore lives in `src/firestore.ts` and must only be imported by lazy code — code in the first load (contexts, App, Home, shared components) uses `import()` instead. First load is ~105 KB gzipped; check with `npm run build` before adding eager imports.

### Feature modules
Every feature lives in `src/features/<name>/` and exports a single `*Feature.tsx` entry component. Features are self-contained — business logic, hooks, types, and subcomponents all live inside the feature folder. Shared code goes in `src/shared/`.

### Shared contexts (in `src/shared/context/`)
- `GlobalKeyContext` — the user's chosen musical key, persisted to `localStorage`, available to all features
- `AuthContext` — Firebase auth state (null user in local mode)
- `StatsContext` — practice streak and ear training statistics

### Firebase / local mode
Firebase is **optional**. `src/firebase.ts` exports `firebaseEnabled` (true only when all `VITE_FIREBASE_*` env vars are present). Cloud-dependent features (Practice Journal, Song Library, Daily Challenge, Profile) are gated behind `firebaseEnabled` and show a `<LocalModeNotice>` in local mode. All offline tools work without any `.env`.

### Backend
- **Production (Netlify)**: Netlify Functions in `netlify/functions/` (`account.ts`, `buddy.ts`, `score.ts`), shared code in `netlify/lib/`. The `netlify.toml` redirect maps `/api/*` → `/.netlify/functions/:splat`.
- **Dev**: `src/api/server.ts` (port 3001) runs the **same** Netlify handlers through a small Express adapter; Vite proxies `/api` and `/.netlify/functions` to it. There is one implementation per endpoint.
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
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Admin SDK service account — verifies ID tokens + counts AI quotas. Without them AI endpoints return 503 |
| `AI_DAILY_LIMIT_{FREE,PRO}_{BUDDY,SCORE}` | Per-user daily AI quotas by plan (defaults free 5/0, pro 100/10) |
| `PADDLE_*` / `VITE_PADDLE_*` | Subscriptions (see `.env.example`). Unset = billing off, everything unlocked |
| `VITE_SENTRY_DSN` | Sentry error monitoring (optional; off when unset) |
| `AI_AUTH_DISABLED` | `true` = skip auth/quota in local dev only (ignored on Netlify production) |

### Security model
- AI endpoints go through `netlify/lib/aiGuard.ts` (CORS allowlist, Firebase ID token, input limits, daily quota in `aiUsage/{uid}`). Client calls must use `aiFetch` (`src/shared/utils/aiFetch.ts`), which attaches the token.
- Account export/delete (GDPR) live in `netlify/lib/account.ts` → `POST /api/account/{export,delete}`; delete needs a sign-in < 5 min old. Any new per-user collection must be added to both `exportUserData` and `deleteUserAccount`.
- Privacy: Firebase Analytics starts only after cookie consent (`src/shared/consent/`). Fonts are self-hosted via `@fontsource/*` — never add Google Fonts `@import`s. Legal docs are on Iubenda (`VITE_*_URL`, `src/config/legal.ts`).
- `firestore.rules` is versioned in the repo: `role` / `plan` on `users/{uid}` are never client-writable. Change them only via Admin SDK / console. Deploy with `npx firebase deploy --only firestore:rules`.
- Netlify builds fail without the `VITE_FIREBASE_*` config (`vite.config.ts`): local mode is dev-only.
- Render errors are caught per tool by `ErrorBoundary` (keyed on `activeTab`) and reported via `src/monitoring.ts`.

## Subscriptions (Paddle)
- Free vs Pro is one list: `PRO_TABS` in `src/config/plans.ts`. Locked tools render `ProGate` (their chunk is never downloaded); this is a product gate — real enforcement is server-side for AI quotas (`consumeQuota` by plan) and Firestore data.
- Plan source of truth: `entitlements/{uid}`, written only by `netlify/functions/paddle-webhook.ts` (signature-verified, order-safe). Clients read it live via `EntitlementProvider` / `useEntitlement()` (`src/shared/context/entitlement.ts`).
- Checkout: server creates a Paddle transaction with `custom_data.firebase_uid` (`/api/billing/checkout`), client opens Paddle.js (lazy-loaded). Portal: `/api/billing/portal`. Account deletion cancels the subscription first.
- Billing is off unless `PADDLE_API_KEY` (server) and `VITE_PADDLE_CLIENT_TOKEN` (client) are set — keep both sides consistent.

## Adding a new feature

1. Create `src/features/<name>/<Name>Feature.tsx` (default export)
2. Add a `TabDef` entry to the appropriate group in `GROUPS` (`App.tsx`)
3. Decide Free or Pro (`PRO_TABS` in `src/config/plans.ts`). Register it in `src/featureRegistry.ts` (`lazyFeature` export + `BY_TAB` entry) and add a render branch in `<main>` in `App.tsx`
4. If the feature requires a backend endpoint, create a Netlify function in `netlify/functions/` and register it in the `FUNCTIONS` map in `src/api/server.ts` (dev)
