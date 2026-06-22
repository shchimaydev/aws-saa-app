# CLAUDE.md

## Project

**aws-saa-app** — a web quiz app for studying the AWS Solutions Architect Associate (SAA) exam. Users sign in with Google, work through a bank of **684 multiple-choice questions** one at a time, submit answers, and immediately see whether they were right along with per-option explanations. Per-user progress (score, which questions were answered, last position) is persisted to Firestore so a user can resume. A scrollable, searchable sidebar lists all questions with their correct/wrong status.

This is a rewrite of a legacy single-file `index.html` app. Data shapes (the Firestore `/progress/{uid}` doc, the theme variables) were ported 1:1, so **existing user data is fully compatible — no migration**. When touching progress storage or the theme, preserve that compatibility.

## Tech stack

- **React Router v8 (framework mode)** — full-stack React with SSR, file-config routes, loaders/actions. This is _not_ plain React; it's the Remix-style framework. See the `react-router-framework-mode` skill for routing/loaders/actions conventions.
- **React 19** + **TypeScript** (strict mode).
- **Vite 8** — bundler/dev server. **Vitest 4** — unit tests.
- **styled-components v6** — all styling (no CSS files, no Tailwind despite a stray `className` in the root error boundary). Theme injected via `ThemeProvider` in `app/root.tsx`.
- **Firebase**
  - **Auth** — Google sign-in popup on the client; server exchanges the ID token for a Firebase **session cookie** (httpOnly, signed). Server verifies via the Admin SDK.
  - **Firestore** (Admin SDK, server-only) — per-user progress at `/progress/{uid}`.
- **lucide-react** — icons.
- **Firebase App Hosting** — deploy target (`apphosting.yaml`, `firebase.json`). Secrets (e.g. `SESSION_SECRET`) come from Secret Manager in prod.

### Commands

| Task       | Command                                                      |
| ---------- | ------------------------------------------------------------ |
| Dev server | `npm run dev`                                                |
| Build      | `npm run build`                                              |
| Typecheck  | `npm run typecheck` (runs `react-router typegen` then `tsc`) |
| Tests      | `npm test` (`vitest run`)                                    |
| Start prod | `npm run start`                                              |

Run `npm run typecheck` after non-trivial changes — it regenerates route types and is the fastest way to catch breakage.

## Directory layout

```
app/
  components/      reusable UI (one folder per component — see pattern below)
  routes/          route modules (mapped explicitly in app/routes.ts)
  lib/             server + client helpers, grouped by domain into sub-folders
                   (firebase/ auth/ questions/ progress/ quiz/ generated-test/).
                   *.server.ts = server-only, *.client.ts = client-only
  data/            questions.json (~1.1 MB static bank, server-only via questions/questions.server.ts)
  styles/          theme.ts, GlobalStyle.ts, styled.d.ts (ThemeProvider type augmentation)
  types/           shared TS types (e.g. questions.ts — canonical Question/SidebarEntry)
  root.tsx         HTML document, ThemeProvider, GlobalStyle, ErrorBoundary
  routes.ts        route table (RouteConfig)
plan/              design/spec docs (*.spec.md)
```

## Patterns

### Component folder

Every component lives in its **own folder** under `app/components/<Name>/`, with files named `index.*` so imports are `~/components/<Name>`:

```
app/components/OptionButton/
  index.tsx           component + props interface, default export
  index.styles.tsx    styled-components (Wrap, OptBtn, ...) + style-only types
  index.test.ts(x)    co-located test (when present)
```

- **`index.tsx`** — the component. Props as a named `interface`, `export default function`. Markup is composed from styled elements imported from `./index.styles`.
- **`index.styles.tsx`** — all `styled` definitions, exported individually (`export const Wrap = styled.div\`...\``). Style-specific unions/types live here too and are re-exported (e.g. `OptionVariant`).
- **Transient props** use the `$`-prefix convention (`$variant`, `$hasExp`) so they're not forwarded to the DOM. Variant-driven styling uses `css\`\``blocks gated on the`$variant` prop.
- **Theme access** is always via `({ theme }) => theme.someToken`. Never hardcode colors — add/use tokens in `app/styles/theme.ts`. (Some translucent overlay rgba values are inlined where they're one-off; prefer tokens.)

Tests are co-located (`*.test.ts`) and pure where possible — heavy logic (e.g. virtualized-list windowing in `VirtualizedList/window.ts`) is extracted into a plain module so it can be unit-tested without rendering. Mirror that: pull tricky logic out of components into testable functions.

### Routes

- Routes are declared explicitly in **`app/routes.ts`** (not file-system convention). Each route points at a folder with an `index.tsx`; nested routes (the `quiz` layout) nest in the config array.
- Route modules export `loader` / `action` / a default component, typed with the generated `Route` namespace:
  ```ts
  import type { Route } from "./+types/index";
  export async function loader({ request, params }: Route.LoaderArgs) { ... }
  export async function action({ request, params }: Route.ActionArgs) { ... }
  export default function X({ loaderData, actionData }: Route.ComponentProps) { ... }
  ```
- **Resource routes** (no UI, e.g. `quiz/api/sidebar`) are loaders that return data for client fetches — kept outside the layout so they carry no chrome.
- Throw `Response`/`redirect` for control flow (404s, auth redirects) rather than returning error shapes.

### Server / data layer

- **`*.server.ts`** modules are server-only — the suffix guarantees they (and large imports like `questions.json`) never reach the client bundle. **`*.client.ts`** is the inverse.
- **Auth** (`lib/auth/session.server.ts`): `getUserId` / `requireUserId` / `getSessionUser` / `requireSessionUser`. Page reads verify the cookie locally (no network). Pass `checkRevoked = true` on **sensitive mutations** to round-trip the Auth backend (see the quiz `action`).
- **Progress** (`lib/progress/progress.server.ts`): all writes go through `recordAnswer` in a Firestore **transaction**; scoring is idempotent (a question is scored once). Reads are **deduped per `Request`** via a `WeakMap` so the layout loader and the page loader share one Firestore fetch — pass `request` to `getProgress` during navigations.
- **Questions** (`lib/questions/questions.server.ts`): static bank, 1-based `num`. Correct answers + explanations are **withheld from the loader payload until a question is answered** — don't leak them client-side. The searchable `textLower` index is server-only.
- **Generated tests** (`lib/generated-test/`): `test.server.ts` persists per-user mock exams at `/users/{uid}/tests/{testId}` (same transaction + per-`Request` `WeakMap` patterns as progress; `recordTestAnswer` also mirrors into global progress). `test-gen.ts` is the pure, unit-tested sampling logic; `test-nav.ts` / `test-sidebar.server.ts` are the test-scoped nav + sidebar builders.

### Conventions

- **Naming:** only **component** files/folders are `CamelCase` — i.e. `app/components/SomeComponent/` and its `index.*`. **Everything else is `kebab-case`**: lib folders (`generated-test/`), lib modules (`test-gen.ts`, `test-nav.ts`), and helpers. Meaningful suffixes are preserved on the kebab name (`*.server.ts`, `*.client.ts`, `*.test.ts`).
- Path alias **`~/*` → `app/*`**.
- Prettier is the formatter (`prettier` devDep) — match existing formatting.
- Comments explain **why**, not what — the existing code is well-commented at decision points (e.g. why a window is sized a certain way, why a read is deduped). Keep that bar; don't add noise.
- Plans/specs go in `plan/*.spec.md`.
