# Migrate AWS SAA Quiz from static HTML → React Router v8 (framework) SSR app

## Context

The app today is a single `index.html` (~1.15 MB) containing everything: 478 lines of inline CSS, a `QUESTIONS` array of 684 AWS SAA‑C03 questions, and ~375 lines of vanilla JS with one global `state` object. It uses Firebase compat SDK v10.7.1 from CDN for Google Auth and Firestore (`/progress/{userId}` doc holding `results`, `score`, `currentIdx`), and is served statically by Firebase Hosting. Navigation is show/hide of DOM sections — no routing, no build step, no types, no tests.

We want a maintainable, mobile‑first, SSR‑capable foundation. Target stack (confirmed):
- **React Router v8 (framework mode), SSR enabled**, TypeScript. (Target v8; if v8 isn't available/stable at scaffold time, **fall back to the latest v7** — framework mode and the config-based routing in this plan are unchanged between them.)
- **Firebase** for DB + Auth, with **session‑cookie auth** so SSR loaders can read user data securely (client popup sign‑in → ID token → server mints httpOnly Firebase session cookie → server loaders verify it via **Admin SDK**).
- **Firebase App Hosting** (Cloud Run, supports SSR via `build`/`start` scripts + `apphosting.yaml`).
- **styled-components** + **styled-css-grid** for a mobile‑first grid layout.

Scope for this migration: **feature parity first** — reproduce current behavior and the dark theme look exactly, just on the new stack. Each question gets its own URL (`/quiz/:num`).

## Decisions (from clarification)
- Auth: **session cookies + Admin SDK** (true SSR‑protected loaders).
- Language: **TypeScript**.
- Scope: **feature parity** (no UX redesign yet); re‑layout with `styled-css-grid`.
- Routing: **URL per question** (`/quiz/:num`), Next/sidebar navigate by URL.

## Prerequisites (from Firebase skills)
- **Blaze plan required.** Firebase App Hosting only runs on the pay‑as‑you‑go Blaze plan. Confirm/upgrade at `console.firebase.google.com/project/aws-saa-app-39b9c/overview?purchaseBillingPlan=metered` before deploy.
- **Confirm Firestore edition before writing the data layer (Step 8).** The Firestore skill mandates detecting Standard vs Enterprise/native, because the Admin SDK access pattern differs (Enterprise uses pipelines). This is an existing project (`/progress/{userId}` already in use) so it's almost certainly **Standard**, but verify once:
  - `npx -y firebase-tools@latest firestore:databases:list --project aws-saa-app-39b9c`
  - `npx -y firebase-tools@latest firestore:databases:get <db-id> --project aws-saa-app-39b9c`
  - If `edition: STANDARD`, the simple `getFirestore().doc('progress/'+uid)` pattern in Step 8 holds. If Enterprise, revisit before coding `progress.server.ts`.
  - **CONFIRMED (2026-06-18):** `(default)` database is `STANDARD` / `FIRESTORE_NATIVE` → simple Admin doc access; no pipelines.
- Project id: **`aws-saa-app-39b9c`** (from `.firebaserc`).

---

## Target structure

```
react-router.config.ts        # ssr: true
vite.config.ts                # reactRouter() plugin (+ styled-components babel, optional)
apphosting.yaml               # Firebase App Hosting Cloud Run + env config (committed)
apphosting.emulator.yaml      # local env/secret overrides for the emulator (gitignored)
tsconfig.json
package.json
app/
  root.tsx                    # <html> shell, ThemeProvider, GlobalStyle, links/meta
  entry.server.tsx            # CUSTOMIZED for styled-components ServerStyleSheet
  entry.client.tsx
  routes.ts                   # route config (config-based routing)
  routes/
    _index.tsx                # loader: redirect → /quiz/{currentIdx+1} (or /login)
    login.tsx                 # Google sign-in (client); action posts ID token
    quiz/
      layout.tsx              # LAYOUT: requireUser, load progress + sidebar index; Header+Sidebar+<Outlet/>
      quiz.$num.tsx           # one question; loader returns question (no `correct` until answered); action grades+saves
      quiz.complete.tsx       # completion/score view; action = restart
    auth.session.tsx          # action: POST {idToken} → set session cookie; logout clears it
  lib/
    firebase.client.ts        # client app + getAuth (browser only)
    firebase.server.ts        # admin app via ADC; getAuth (admin), getFirestore
    session.server.ts         # createUserSession / requireUserId / destroySession (cookie helpers)
    questions.server.ts       # import questions.json; getQuestion(num), getSidebarIndex()
    progress.server.ts        # getProgress / recordAnswer / resetProgress (Admin Firestore)
  components/                 # one folder per component: index.tsx (default export) + index.styles.tsx (styled-components)
    Header/        index.tsx  index.styles.tsx
    Sidebar/       index.tsx  index.styles.tsx
    QuestionCard/  index.tsx  index.styles.tsx
    OptionButton/  index.tsx  index.styles.tsx
    Completion/    index.tsx  index.styles.tsx
    LoginButton/   index.tsx  index.styles.tsx
  styles/
    theme.ts                  # the 12 CSS-var colors as a styled-components theme
    GlobalStyle.ts            # createGlobalStyle (reset + body/scrollbar from current CSS)
  data/
    questions.json            # 684 questions extracted from index.html
scripts/
  extract-questions.mjs       # one-off: parse QUESTIONS array out of legacy index.html
firestore.rules               # keep as-is (still enforces uid match)
firebase.json                 # update: remove static hosting; add `apphosting` + `auth` blocks; keep firestore rules
```

---

## Implementation steps

### 1. Scaffold project
- Create the React Router **v8.0.0** framework app in place (default TypeScript template, stripped of Tailwind).
- **React version (revised):** React Router v8 declares a peer dep of **React ≥ 19.2.7**, so use **React 19** (`react`/`react-dom` `^19.2.7`), not 18.3. The original 18.3 pin existed only for styling-lib compatibility, which is satisfied on React 19 (see below), so no v7 fallback is needed.
- Deps: `react-router@8`, `@react-router/node@8`, `@react-router/serve@8`, `@react-router/dev@8`, `vite`, `typescript`, `styled-components@^6`, `styled-css-grid@^1.3`, `firebase@^10` (client), `firebase-admin@^12` (server), `isbot`, `@types/node`, `@types/react@^19`, `@types/react-dom@^19`.
- **Do NOT install `@types/styled-components`** (revised): that package is for v5 and conflicts with v6, which ships its own types. Theme typing is done via a `declare module "styled-components"` augmentation in `app/styles/styled.d.ts`.
- **styled-css-grid compatibility (revised):** styled-css-grid@1.3.0 already declares a styled-components peer of `^2 || … || ^6`, and styled-components 6.4.2 supports React ≥16.8 — so **no `overrides` are needed** and React 19 is fine. Keep the local CSS-Grid `<Grid>`/`<Cell>` reimplementation only as a contingency if it mis-renders at runtime.
- `package.json` scripts: `build: react-router build`, `start: react-router-serve ./build/server/index.js`, `dev: react-router dev`. App Hosting needs `build` + `start` (start must honor `$PORT` — `react-router-serve` does).

### 2. Extract data
- Write `scripts/extract-questions.mjs`: read legacy `index.html`, slice the `const QUESTIONS = [ ... ];` literal starting at line 594, `JSON.parse` it (keys are already double-quoted JSON), write `app/data/questions.json`. Verify count = 684.
- Define `Question` type in `questions.server.ts`: `{ num, text, options: string[], correct: number[], multi: boolean, optionExplanations: string[] }`.

### 3. Styling foundation
- `styles/theme.ts`: port the `:root` variables (lines 8–23) into a theme object (`bg`, `surface`, `surface2`, `border`, `accent`, `accent2`, `text`, `text2`, `green`, `green-bg`, `red`, `red-bg`, `yellow`, `tag-bg`).
- `styles/GlobalStyle.ts`: `createGlobalStyle` with the reset (`*{box-sizing}`), body, sticky-header base, and custom scrollbar rules from the current CSS.
- Port component-specific CSS (lines ~34–478) into each styled component. Use `styled-css-grid` `<Grid>`/`<Cell>` for: the overall layout (sidebar 280px + main, collapsing under `@media max-width:768px`), the header score bar, the options grid, and the completion stats. Keep the exact dark-theme look.

### 4. SSR plumbing for styled-components — DONE
- `entry.server.tsx` (revealed via `npx react-router reveal`): create a `ServerStyleSheet`, wrap `<ServerRouter/>` in `sheet.collectStyles(...)`, and **force `onAllReady`** (not `onShellReady`) so the whole tree is rendered before we read the sheet — otherwise collected styles are incomplete. Inject `sheet.getStyleTags()` (a string, simpler than `getStyleElement()`) right before `</head>` via a `Transform` stream, then `sheet.seal()`.
- **`vite.config.ts` gotcha (not in original plan):** add `ssr: { noExternal: ["styled-components"] }`. styled-components is CJS; left externalized in the SSR build its default import resolves to the module namespace and you get `TypeError: styled.main is not a function` at runtime. Bundling it for SSR fixes the interop. (Verified: both `npm start` and `npm run dev` render `<style data-styled>` in `<head>` with theme colors.)
- `root.tsx`: wraps the app in `<ThemeProvider theme={theme}>` + `<GlobalStyle/>`. The scaffold's `app.css` was deleted — its reset/body now live in `GlobalStyle`, plus `html { color-scheme: dark }`.
- (Optional, recommended) add `babel-plugin-styled-components` via `vite-plugin-babel` scoped to `app/**` for stable class names / hydration; not needed so far — add only if hydration mismatches appear.

### 5. Firebase — DONE (modules written; runtime auth verified in Step 6)
- **Env strategy:** Vite `envPrefix: ["VITE_", "PUBLIC_"]` so `import.meta.env.PUBLIC_FIREBASE_*` is inlined into both client and SSR bundles. Local values in a gitignored `.env` (committed `.env.example` documents them); production values come from `apphosting.yaml`. Custom keys typed in `app/env.d.ts` (augments `ImportMetaEnv`). `SESSION_SECRET` is read from `process.env` (server-only, never `PUBLIC_`).
- `firebase.client.ts`: lazy singleton `getFirebaseAuth()` → `initializeApp(config from import.meta.env.PUBLIC_*)` + `getAuth()`, **throws if called outside the browser**. (Emulator `connectAuthEmulator` can be added later for emulator runs.)
- `firebase.server.ts`: Admin `initializeApp({ credential: applicationDefault(), projectId })`, singleton-guarded (`getApps()`), `projectId` from `process.env.GOOGLE_CLOUD_PROJECT || GCLOUD_PROJECT || import.meta.env.PUBLIC_FIREBASE_PROJECT_ID`. Exports `adminAuth`, `adminDb`. Build externalizes firebase-admin from the client bundle (verified — `.server` boundary holds).
- `session.server.ts`: `createCookie("__session", {httpOnly, secure(prod), sameSite:lax, 14d, secrets:[SESSION_SECRET]})`; helpers `createUserSession(idToken, redirectTo)`, `getUserId(request)` (returns `uid|null` — for `_index`), `requireUserId(request, redirectTo="/login")` (throws redirect), `destroySession(redirectTo)`.
- **IAM note (deploy):** `createSessionCookie` requires the App Hosting service account to have **Service Account Token Creator** (signBlob) plus Firestore access (`datastore.user`).
- **Local runtime note:** Admin calls need ADC (`gcloud auth application-default login`) or the emulators (`FIREBASE_AUTH_EMULATOR_HOST`/`FIRESTORE_EMULATOR_HOST`) — exercised in Step 6.

### 6. Auth routes
- **Provision the Google provider (per firebase-auth skill).** Google Auth is already enabled on this project (legacy app uses it), but to keep config in‑repo add an `auth` block to `firebase.json` and deploy it:
  ```json
  "auth": {
    "providers": {
      "googleSignIn": {
        "oAuthBrandDisplayName": "AWS SAA Quiz",
        "supportEmail": "shchimaydev@gmail.com",
        "authorizedRedirectUris": ["http://localhost", "https://<backend-id>.web.app"]
      }
    }
  }
  ```
  Then `npx -y firebase-tools@latest deploy --only auth`.
- **Authorized domains (the #1 popup failure).** Ensure `localhost` (dev) and the App Hosting domain are in Authentication → Settings → Authorized domains. **CRITICAL: domain only, no protocol/port** (`localhost`, not `http://localhost:5173`). The `auth/unauthorized-domain` error = missing entry here.
- `login.tsx` — DONE: loader redirects already-authed users to `/quiz/1`; renders the ported auth modal (overlay + card, theme-styled) with `<LoginButton>`. Click → `signInWithGoogle()` → `useFetcher` POST `{idToken}` to `/auth/session`. Errors surfaced via `fetcher.data.error` + cancel handled quietly.
- **Sign-in rewired to GIS (no `__/auth/handler` / `firebaseapp.com` dependency):** `signInWithGoogle()` now uses **Google Identity Services** `initTokenClient` (OAuth happens directly between the page and `accounts.google.com`) → Google access token → `GoogleAuthProvider.credential(null, accessToken)` → `signInWithCredential` → Firebase ID token → `/auth/session` (server side unchanged). Replaced `signInWithPopup`. OAuth Web client ID lives in `PUBLIC_GOOGLE_OAUTH_CLIENT_ID` (.env + apphosting.yaml). **REQUIRED setup:** add the app's origins to the OAuth Web client's **Authorized JavaScript origins** (Cloud Console → Credentials → "Web client (auto created by Google Service)"): `http://localhost:5173` (dev) and `https://be-aws-saa-app--aws-saa-app-39b9c.europe-west4.hosted.app` (prod) + any custom domain. (This is separate from Firebase "authorized domains".) Can't be verified headless — needs a real browser; the downstream token→cookie→quiz flow is unchanged and already emulator-verified.
- `components/LoginButton/` — DONE: presentational white Google button (ported 4-path SVG), `disabled` → "Signing in…".
- `auth.session.tsx` — DONE: `action` reads `idToken` → `createUserSession(idToken, "/quiz/1")` (redirect + Set-Cookie); missing/invalid token → `{error}` JSON. `loader` redirects GET → `/login`.
- `logout.tsx` — DONE: `action` → `destroySession("/login")`; `loader` redirects GET → `/login`. (Client `signOutClient()` will be called by the Header logout button in Step 7.)
- `firebase.json` — DONE (config only, **not deployed**): added the `googleSignIn` auth block. Google is already live on the project, so deploying `--only auth` is optional/at the user's discretion (would reconfigure the OAuth brand). Authorized domains likely already include `localhost` since the legacy app works.
- **Verified headless:** bundle boundaries hold (client `firebase/auth` excluded from server build; `firebase-admin` excluded from client build); `/login` SSRs the button+SVG; `/auth/session` & `/logout` GET → 302 `/login`; action error paths return graceful JSON. **Not testable headless:** real popup → valid ID token → cookie set → redirect to `/quiz/1` (needs a browser sign-in or auth emulator; `/quiz/1` itself 404s until Step 7).

### 7. Quiz layout + question routes (the core) — DONE (e2e-verified via emulators)
- **Verification:** ran auth + Firestore emulators, minted an ID token, exchanged it for a session cookie, and drove the full flow with that cookie: question SSR, answers withheld pre-submit, correct/wrong grading + explanation reveal, score + currentIdx persisted (confirmed by reload showing answered state and `/` resuming at the right question), `/quiz/complete` stats, and restart wiping progress back to `/quiz/1`. Unauthenticated access to `/`, `/quiz/*` all 302 → `/login`. Added an `emulators` block to `firebase.json`.
- **Sidebar filtering is server-side in the layout loader** (not client-side as first sketched): the loader reads `?filter=`/`?q=` from the URL, filters `getSidebarSource()` (which carries lowercased full text for search) against progress `results`, and returns only `{num, preview, result}`. The `Sidebar` component drives the URL (filter buttons + debounced search) and preserves params across question links. This keeps search matching full question text (parity) without shipping it to the client.
- Header user (name/avatar) comes from the **session-cookie claims** via `requireSessionUser` — no extra `getUser()` call.
- `num` (1-based URL) ↔ `idx` (0-based progress key): `idx = num - 1`. `_index` resumes at `/quiz/{currentIdx+1}`.
- `quiz/layout.tsx` (layout route): loader `requireSessionUser` → `getProgress(uid)` + filtered sidebar. Renders `Header` + `Sidebar` + `<Outlet/>` in a CSS-grid (280px + 1fr, collapses ≤768px).
- `quiz.$num.tsx`:
  - loader: `getQuestion(num)`; include `answered` flag + stored result from progress. **Withhold `correct`/`optionExplanations` from the payload until the question is answered** (small security win over the legacy app where answers ship to the client; explanations only show post-submit anyway, so parity holds).
  - component: `QuestionCard` + `OptionButton`s (port states: selected/correct/wrong/neutral, multi-select toggle when `multi || correct.length>1`). Submit is a `<Form method="post">`.
  - action (submit): grade server-side against `correct`, `recordAnswer(uid, idx, result)` in Firestore, return `{result, correct, optionExplanations}`; UI reveals explanations + result badge. "Next" is a link to `/quiz/{num+1}`, or to `/quiz/complete` past the last question.
- `quiz.complete.tsx`: compute final correct/wrong/percentage from progress; "Restart" action calls `resetProgress(uid)` and redirects to `/quiz/1`.
- `_index.tsx` loader: redirect to `/quiz/{progress.currentIdx+1}` (resume where they left off), or `/login` if unauthenticated.

### 8. Firestore service + rules — service DONE (built with Step 7)
- `progress.server.ts` — DONE: `getProgress` / `recordAnswer` / `resetProgress` on `/progress/{uid}`, **same doc shape** (`results` map of `idx→"correct"|"wrong"`, `score`, `currentIdx`, `updatedAt: serverTimestamp`) — fully compatible with existing data, no migration. `recordAnswer` runs in a **transaction** and scores each question only once (parity: re-submitting an answered question doesn't double-count); always advances `currentIdx`.
- `firestore.rules`: unchanged (still scopes by `request.auth.uid`). With Admin SDK on the server, writes bypass rules, but rules still protect any direct client access. (Edition confirmed STANDARD — see Prerequisites.)

### 9. Deployment config — DONE (config written; deploy is the user's call)
- `firebase.json` — DONE: removed the static `hosting` block; added `apphosting` (`backendId: "aws-saa-app"`, `rootDir: "/"`, `ignore` excludes node_modules/.git/dotfiles/debug logs/`index.html`). Kept `auth`, `firestore`, `emulators`. **⚠️ `backendId` must match the actual App Hosting backend** — change it if you name the backend differently.
- `apphosting.yaml` — DONE: `runConfig` (cpu 1 / 512 MiB / min 0 / max 10 / concurrency 80) + the six `PUBLIC_FIREBASE_*` as literal `value:` with `availability: [BUILD, RUNTIME]` + `SESSION_SECRET` as a Secret Manager ref (`secret:`, RUNTIME only). `GOOGLE_CLOUD_PROJECT` is injected by Cloud Run automatically; cookie `Secure` flag keys off `NODE_ENV=production` which `react-router-serve` sets.
- `apphosting.emulator.yaml` — DONE (gitignored): local literal `SESSION_SECRET` so `emulators:start --only apphosting` works.
- Validated: `npm run build` + `typecheck` pass with the new config; `firebase.json` is valid JSON.

**Deploy runbook (not run here — needs interactive auth/billing/region):**
1. Ensure Blaze plan (see Prerequisites).
2. Create the backend (interactive — picks region, optional GitHub): `npx -y firebase-tools@latest apphosting:backends:create --project aws-saa-app-39b9c` → name it `aws-saa-app` (or update `backendId`).
3. Create the cookie secret + grant the backend access: `npx -y firebase-tools@latest apphosting:secrets:set SESSION_SECRET` (long random string).
4. Grant the App Hosting service account **Service Account Token Creator** (for `createSessionCookie`) + **Cloud Datastore User** (Firestore).
5. Add the backend domain to Auth → authorized domains (domain only, no protocol/port).
6. `npx -y firebase-tools@latest deploy` (App Hosting + firestore rules + auth).
- Keep the legacy `index.html` until the deployed app is verified, then remove (it's already excluded from the App Hosting upload via `ignore`).
- **Cleanup DONE (post-verify):** removed `index.html`, `scripts/extract-questions.mjs` (its one-off extractor — `app/data/questions.json` is now the source of truth), and the local `.firebase/` hosting cache.
- **⚠️ Do NOT delete/disable the classic Firebase Hosting site on `*.firebaseapp.com`.** Google sign-in uses `authDomain: aws-saa-app-39b9c.firebaseapp.com`, and the OAuth popup relies on the reserved `…firebaseapp.com/__/auth/handler` path served via that Hosting site. The old static quiz is still served there but is harmless; to stop showing it, deploy a redirect to the App Hosting URL rather than disabling Hosting.

**Post-deploy gotcha — action POSTs fail with "Bad Request" / "Oops!" (FIXED):**
React Router v8 has built-in action CSRF protection (`throwIfPotentialCSRFAttack`) that rejects any action POST where the request `Origin` host ≠ `request.url` host, unless the origin is in `allowedActionOrigins`. On App Hosting the public CDN domain (`*.hosted.app`, the `Origin`) never matches the internal Cloud Run host (`*.run.app`, what the container sees as `request.url`), so **every** action (sign-in, answer submit, restart) returned 400 "Bad Request" → masked as the generic "Oops!" page (GETs were unaffected, which is why only sign-in appeared broken). Symptom in logs: `Error: Bad Request at singleFetchAction`.
Fix: set `allowedActionOrigins` in `react-router.config.ts` to the public domain(s) — `"be-aws-saa-app--aws-saa-app-39b9c.europe-west4.hosted.app"` plus `"**.hosted.app"` (wildcard for rollout/preview subdomains). **Add any custom domain you map here too**, then rebuild/redeploy. Also added a `handleError` export in `entry.server.tsx` so unhandled server errors log the real stack to stderr (prod masks them in the browser).

---

## Verification

1. **Data extraction:** run `scripts/extract-questions.mjs`; assert `questions.json` has 684 entries and spot-check a multi-answer question (e.g. num 18, `correct: [0,1]`).
2. **Local dev (`npm run dev`):** Use Playwright MCP to drive the app:
   - Unauthenticated → redirected to `/login`. (Auth popup can't complete headless — verify the redirect/gate and, if needed, stub a session cookie to exercise authed routes.)
   - `/quiz/1` SSR: view-source shows question text + styled-components `<style>` in `<head>` (confirms SSR styling, no FOUC).
   - Select option(s) → Submit → result badge + per-option explanations appear; score pills + progress bar update; sidebar dot turns green/red.
   - Navigate via sidebar link and "Next" → URL changes to `/quiz/N`; browser back/forward works.
   - Filters/search update the sidebar and reflect in the URL.
   - Reach the last question → `/quiz/complete` shows correct/wrong/percentage; Restart clears progress and returns to `/quiz/1`.
3. **Persistence:** confirm an answer writes to `/progress/{uid}` (Firestore emulator or console) with the same shape; reload resumes at `currentIdx`.
4. **Production build:** `npm run build` succeeds; `npm start` serves on `$PORT` and SSR renders.
5. **styled-css-grid smoke test:** verify the sidebar+main grid and option grid render and collapse correctly at ≤768px; if the stale peer dep breaks rendering, switch to the local CSS-Grid reimplementation.
6. **App Hosting emulator (optional, pre-deploy):** `emulators:start` builds the app and serves on `:5004` with `apphosting.yaml`/`apphosting.emulator.yaml` env injected — confirms env/secret wiring works before a real deploy.
7. **Deploy** to a Firebase App Hosting backend (Blaze plan); verify Google sign-in end-to-end (popup → session cookie set → authed loaders), that `localhost` + the App Hosting domain are in Authorized domains, and that the service account has Token Creator + Firestore roles.

## Out of scope (future)
- UX/visual redesign, additional study modes, tests (Vitest/Playwright suite), and removing `correct` answers from any client bundle beyond the loader withholding described above.