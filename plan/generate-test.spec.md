# Generate Test — feature spec

## Context

The app is a single linear quiz over 684 AWS SAA questions. The real SAA-C03 exam is 65
questions drawn from 4 weighted domains. This feature adds a **"Generate Test"** button in the
header that assembles a 65-question mock exam by sampling each domain at its exam weight,
persists it as a Firestore document, and opens a quiz-like page (sidebar + question card) scoped
to those 65 questions.

Confirmed decisions:

- **Domains:** every question in `questions.json` carries a **`domains: Domain[]`** field — an
  **unordered set** of 1–3 SAA-C03 domains (`Domain` enum in `app/types/domain.ts`, values 1–4).
  No domain is "primary"; a question is equally a member of each domain it lists. Most questions
  have one domain; ~15% have two; one has three. Already classified and committed (see Step 1).
- **Each picked question counts toward exactly one domain.** A question can be a member of several
  domains, so test generation picks **distinct** questions: once a question is chosen (counted for
  one domain) it is removed from consideration for every other domain and can never appear twice
  in the same test.
- **Scoring:** answering inside a test updates **both** the test's own results map **and** the
  global `/progress/{uid}` doc (reuse `recordAnswer`).
- **Storage:** per-user subcollection `/users/{uid}/tests/{testId}`.

Exam weighting (largest-remainder rounding to exactly 65):

| Domain | Focus                                | Weight | Count  |
| ------ | ------------------------------------ | ------ | ------ |
| 1      | Design Secure Architectures          | 30%    | **19** |
| 2      | Design Resilient Architectures       | 26%    | **17** |
| 3      | Design High-Performing Architectures | 24%    | **16** |
| 4      | Design Cost-Optimized Architectures  | 20%    | **13** |

---

## Step 1 — Domain classification (DONE — data enrichment)

Status: **complete and committed.** Every entry in `app/data/questions.json` has a
`"domains": Domain[]` field — an unordered set of 1–3 ids from 1–4 (stored sorted ascending to
signal no priority).

- Classification was run once (LLM-assisted, in batches): a first pass to find each question's main
  domain, then a conservative pass that adds further domains only when the scenario genuinely
  exercises them. Result: 578 single-domain, 105 two-domain, 1 three-domain.
- `app/types/domain.ts` defines `enum Domain { DesignSecureArchitectures = 1, … }` plus
  `DOMAIN_LABELS`, `ALL_DOMAINS`, and an `isDomain()` guard.
- `Question` in `app/types/questions.ts` has `domains: Domain[]` (unordered set).
- Re-running the classification is **not** part of building this feature. If it's ever redone,
  preserve the `domains` shape (unordered set, max 3) and re-validate: every question has 1–3
  unique valid ids, and each domain's membership count comfortably exceeds its required test count
  (current membership ≈ 221 / 234 / 191 / 145 for domains 1–4, all ≫ 19 / 17 / 16 / 13).

## Step 2 — Server: questions by domain + selection logic

- `app/lib/questions.server.ts`: add `getQuestionNumsByDomain(): Record<Domain, number[]>`
  (built once at module load, like `ALL_SOURCES`). Each domain's array is every num whose
  `domains` **includes** that domain (`q.domains.includes(targetDomain)`). A multi-domain question
  appears in **each** of its domains' arrays, so the arrays overlap and their lengths sum to > 684.
- New **pure, testable** module `app/lib/testGen.ts`:
  - `DOMAIN_COUNTS: Record<Domain, number> = { 1: 19, 2: 17, 3: 16, 4: 13 }` (sums to 65) —
    derived via a `largestRemainder(weights, total)` helper kept in the file so the rounding is
    documented and unit-tested.
  - `pickTestQuestions(byDomain, rng?): number[]` — selects **65 distinct** nums, each counted
    toward exactly one domain:
    - Maintain a `selected: Set<number>`. For each domain, filter its pool to nums **not already in
      `selected`**, then pick `DOMAIN_COUNTS[domain]` of them at **random** (shuffle the filtered
      pool with the injectable `rng` and take the first N); add each picked num to `selected` so it
      can't be re-selected for any later domain. Process domains least-populous-available-first to
      reduce starvation from overlap.
    - **Top-up guard:** if overlapping/short pools leave the total under 65 after the per-domain
      pass, fill the remainder from all still-unselected nums (shuffled) and `log` the shortfall.
      Given current membership counts this is effectively unreachable, but the guard keeps the
      function total-correct.
    - Returns 1-based nums. `rng` injectable for deterministic tests; defaults to `Math.random`.
  - Co-locate `app/lib/testGen.test.ts`: counts sum to 65; **no duplicate nums** (the key
    invariant now that pools overlap); each picked num's `domains` includes the domain it was
    counted toward; per-domain quotas met when pools allow; selection varies with `rng`; top-up
    fallback triggers on a contrived small/overlapping `byDomain`.

## Step 3 — Server: test persistence layer

New `app/lib/test.server.ts` (mirrors `progress.server.ts` patterns: Admin SDK, transactions,
per-Request `WeakMap` dedup):

- Doc shape at `/users/{uid}/tests/{testId}`:
  ```ts
  {
    questions: number[];                          // ordered 1-based nums, length 65
    results: Record<string, "correct" | "wrong">; // key = question num (string)
    score: { correct: number; wrong: number };
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  ```
- `createTest(uid): Promise<{ testId: string; questions: number[] }>` — calls
  `pickTestQuestions(getQuestionNumsByDomain())`, writes the doc with an auto-id, returns id.
- `getTest(uid, testId, request?): Promise<Test | null>` — deduped per Request (WeakMap keyed by
  Request → `Map<testId, Promise>`), like `getProgress`.
- `getLatestTestId(uid): Promise<string | null>` — `orderBy("createdAt","desc").limit(1)`.
- `recordTestAnswer(uid, testId, num, result)` — transaction over the test doc; idempotent per
  num (score once); **then also** `await recordAnswer(uid, num - 1, result)` so global progress +
  the quiz sidebar reflect it.

## Step 4 — Reuse the sidebar for tests

Generalize `app/components/Sidebar/index.tsx` instead of duplicating:

- Add optional props: `apiPath?: string` (default `"/quiz/api/sidebar"`),
  `hrefFor?: (num: number) => string` (default `(n) => \`/quiz/${n}\``). Replace the two hardcoded
uses (`fetcher.load(...)`and the`<Link to=...>`) with these.
- The test page passes `apiPath="/test/<testId>/api/sidebar"` and
  `hrefFor={(n) => \`/test/${testId}/${n}\``}.
- With only 65 items the server returns the full set (`windowed: false`), so the infinite-scroll
  path is inert and `VirtualizedList` still virtualizes rendering — no Sidebar/VirtualizedList
  internals change.

New `app/lib/testSidebar.server.ts`: `buildTestSidebarData({ questions, results, filter, q })` →
`SidebarData`. Maps each test num to `{ num, preview, result }` using `getAllSidebarSource()` for
preview/`textLower` and the test's `results` map for status; applies `filter`
(all/unanswered/correct/wrong) and search `q`; `total = questions.length`, `windowed: false`.

## Step 5 — Routes

Add to `app/routes.ts` (mirroring the quiz block):

```ts
route("test/generate", "routes/test/generate/index.tsx"),          // action-only
route("test", "routes/test/index/index.tsx"),                       // redirect → latest
route("test/:testId", "routes/test/layout/index.tsx", [
  route(":num", "routes/test/test.$num/index.tsx"),
  route("complete", "routes/test/test.complete/index.tsx"),
]),
route("test/:testId/api/sidebar", "routes/test/api.sidebar/index.tsx"),
```

- **`test/generate`** — `action`: `requireUserId(request, "/login", true)` → `createTest` →
  `redirect(\`/test/${testId}/${questions[0]}\`)`. No component.
- **`test/index`** — `loader`: `getLatestTestId`; redirect to its first question, or to `/quiz`
  with an empty-state if none. (Serves the "latest generated test" entry point.)
- **`test/:testId/layout`** — `loader` mirrors `quiz/layout`: `requireSessionUser`,
  `getTest(uid, testId, request)` (404 if missing), build sidebar via `buildTestSidebarData`,
  return `{ user, score: test.score, total: test.questions.length, sidebar, testId }`. Component
  is a copy of the quiz layout (Shell/Header/LayoutGrid/Sidebar/Outlet, drawer state) passing the
  new Sidebar props (`apiPath`, `hrefFor`).
- **`test/:testId/:num`** — `loader`/`action` mirror `quiz.$num` but test-scoped:
  - Validate `num ∈ test.questions` else throw 404.
  - `answered` ← `test.results[num]`; withhold `correct`/`optionExplanations` until answered.
  - Return test position (`index`/`length`) for prev/next.
  - `action`: compare selection, `recordTestAnswer(uid, testId, num, result)`, reveal answers.
  - Prev/Next use a **test-scoped** nav helper (next/prev within the ordered `questions` array;
    last → `/test/:testId/complete`). Add `app/lib/testNav.ts` analogous to `quizNav.ts`.
- **`test/:testId/complete`** — simple results summary (score / 65), "Generate new test" button
  (posts to `/test/generate`). Mirror `quiz.complete`.
- **`test/:testId/api/sidebar`** — resource `loader`: `requireSessionUser`, `getTest`, read
  `filter`/`q` from query, return `buildTestSidebarData(...)`. Mirrors `quiz/api.sidebar`.

## Step 6 — Header button

`app/components/Header/index.tsx`: add a **"Generate Test"** button (lucide icon, e.g.
`FileText`/`ListChecks`) next to the brand/menu. It is a React Router `<Form method="post"
action="/test/generate">` submit button so it works without JS and shows pending state via
`useNavigation`. Disable + label "Generating…" while submitting. Add matching styles in
`index.styles.tsx` using theme tokens (no hardcoded colors).

---

## Files

**New**

- `app/lib/testGen.ts` + `app/lib/testGen.test.ts`
- `app/lib/test.server.ts`
- `app/lib/testSidebar.server.ts`
- `app/lib/testNav.ts`
- `app/routes/test/generate/index.tsx`
- `app/routes/test/index/index.tsx`
- `app/routes/test/layout/index.tsx` (+ reuse quiz layout styles or a thin copy)
- `app/routes/test/test.$num/index.tsx`
- `app/routes/test/test.complete/index.tsx`
- `app/routes/test/api.sidebar/index.tsx`

**Done (data enrichment — already committed)**

- `app/data/questions.json` (+`domains: Domain[]`)
- `app/types/questions.ts` (+`domains: Domain[]`)
- `app/types/domain.ts` (`Domain` enum, `DOMAIN_LABELS`, `ALL_DOMAINS`, `isDomain`)

**Modified (this feature)**

- `app/lib/questions.server.ts` (+`getQuestionNumsByDomain`)
- `app/components/Sidebar/index.tsx` (+`apiPath`, `hrefFor` props)
- `app/components/Header/index.tsx` (+ Generate Test button)
- `app/routes.ts` (+ test routes)

## Reused (do not rebuild)

- `recordAnswer`, `getProgress`, WeakMap dedup — `app/lib/progress.server.ts`
- `getQuestion`, `getAllSidebarSource` — `app/lib/questions.server.ts`
- `requireUserId` / `requireSessionUser` (`checkRevoked` for mutations) — `app/lib/session.server.ts`
- `adminDb` — `app/lib/firebase.server.ts`
- `VirtualizedList` + `window.ts`, `Sidebar`, quiz layout styled components, `quizNav` shape.

---

## Verification

1. `npm run typecheck` (regenerates route types) and `npm test` (new `testGen` tests pass —
   especially the **no-duplicate-nums** invariant).
2. (Data already classified.) `getQuestionNumsByDomain` membership counts each comfortably exceed
   the required test counts (≈ 221 / 234 / 191 / 145 vs 19 / 17 / 16 / 13).
3. `npm run dev`, sign in. Click **Generate Test** → redirected to `/test/<id>/<firstNum>`.
4. Inspect Firestore (`firestore_get_document` MCP) `/users/{uid}/tests/{testId}`: `questions`
   length 65 with **no duplicate nums**; each num's `domains` includes the domain it was counted
   toward; aggregate split ≈ 19/17/16/13 (best-effort, since a picked question may also belong to
   other domains); empty `results`.
5. Sidebar shows 65 entries, virtualized, search/filter scoped to the test; active highlight and
   click-nav work; prev/next stay within the test and end at `/complete`.
6. Answer a few questions: test doc `results`/`score` update idempotently **and** the global quiz
   sidebar/score reflect the same answers (open `/quiz` to confirm).
7. Visit `/test` → redirects to the latest test.
