# Mobile-first layout + off-canvas sidebar drawer

## Context

The quiz UI already matches the desktop Figma design (`2-2`): sticky header with score
pills, a 280px question-list sidebar, the question card, and a bottom action bar. The
problem is **mobile**: the sidebar is `display: none` at `≤768px`
(`app/components/Sidebar/index.styles.tsx:14`), so on a phone the entire question list —
search, filters, navigation — is unreachable. There is no hamburger and no drawer.

The mobile Figma design (`2-600`) fixes this: a **hamburger button** in the header (left
of the logo) opens the sidebar as an **off-canvas drawer** (≈280px) that slides over the
content, with a **close (×) button** in the drawer header. Content collapses to a single
column.

This plan covers **Phase A — layout + drawer** only (the user's stated first step).
**Phase B — visual restyling** to fully match Figma is outlined at the end and executed
after Phase A is approved.

Styling is **styled-components** (no Tailwind); theme tokens live in `app/styles/theme.ts`.
Decisions confirmed with the user: **add `lucide-react`** for icons; **do layout/drawer
first, styling later**.

---

## Phase A — Mobile-first layout & drawer

### A0. Dependency
- Add `lucide-react` (`npm install lucide-react`). Used for `Menu` (hamburger) and `X`
  (close) icons now; the broader icon set is Phase B.

### A1. Drawer state lives in the layout route
`app/routes/quiz/layout/index.tsx` is the single parent of both `Header` and `Sidebar`,
so the open/close state belongs here.
- `const [drawerOpen, setDrawerOpen] = useState(false)`.
- Pass `onMenuClick={() => setDrawerOpen(true)}` to `<Header>`.
- Pass `open={drawerOpen}` and `onClose={() => setDrawerOpen(false)}` to `<Sidebar>`.
- Render a `<Backdrop $open={drawerOpen} onClick={() => setDrawerOpen(false)} />`
  (new styled component, mobile-only).
- Auto-close on navigation: `const location = useLocation();` +
  `useEffect(() => setDrawerOpen(false), [location.pathname])`. The layout route persists
  across child navigations, so this reliably closes the drawer after a question is picked.
- Auto-close on Escape: `useEffect` adding a `keydown` listener while `drawerOpen`.

### A2. Mobile-first layout styles — `app/routes/quiz/layout/index.styles.tsx`
Flip the existing desktop-first media queries to mobile-first (base = phone, `min-width`
adds desktop):
- `LayoutGrid`: base `grid-template-columns: 1fr;` → `@media (min-width: 768px) { grid-template-columns: 280px 1fr; }`.
- `Main`: base `padding: 16px;` → `@media (min-width: 768px) { padding: 28px 32px; }`.
- Add `Backdrop`: `position: fixed; inset: 0; z-index: 150; background: rgba(0,0,0,0.55);`
  shown only when `$open` and only on mobile (`@media (min-width: 768px){ display:none }`).
  Reuse the overlay idiom already in `app/routes/login/index.styles.tsx`.

### A3. Sidebar becomes a drawer — `app/components/Sidebar/index.styles.tsx`
Replace the `display: none` mobile rule on `Aside` with off-canvas drawer behavior.
- Add a transient prop `$open`. Mobile (base) styles:
  `position: fixed; top: 0; left: 0; height: 100dvh; width: 280px; max-width: 85vw;
   z-index: 200; transform: translateX(-100%); transition: transform 0.25s ease;`
  and `transform: translateX(0)` when `$open`.
- Desktop override: `@media (min-width: 768px){ position: static; transform: none;
   height: auto; z-index: auto; }` — static cell inside the grid, exactly as today.
- Z-order: drawer `200` > backdrop `150` > header `100` (header is `z-index: 100` in
  `Header/index.styles.tsx:13`), so the drawer covers the header on mobile per the design.
- Add a `CloseButton` styled component (mobile-only; hidden at `min-width: 768px`).

### A4. Sidebar component — `app/components/Sidebar/index.tsx`
- Accept new props `{ open, onClose }` alongside `sidebar`.
- Forward `$open={open}` to `Aside`.
- Add the close button (lucide `X`) inside `SectionHeader`, `aria-label="Close"`,
  `onClick={onClose}`.
- `aria-hidden={!open}` on the drawer for mobile a11y (effectively inert when closed).
- No change to the `VirtualizedList` wiring — it works in any container.

### A5. Header — `app/components/Header/index.tsx` + `index.styles.tsx`
- Add `onMenuClick?: () => void` to `HeaderProps`.
- Render a `MenuButton` (lucide `Menu`) as the first child of `Bar`, before `Logo`,
  `aria-label="Open question list"`, `aria-expanded`, `onClick={onMenuClick}`.
- `MenuButton` styled component: hidden on desktop (`@media (min-width: 768px){ display:none }`),
  shown on mobile. Borrow the `Logo`/`SignOutButton` look (transparent button, themed icon color).

### Critical files (Phase A)
- `app/routes/quiz/layout/index.tsx` — state, wiring, backdrop, auto-close effects
- `app/routes/quiz/layout/index.styles.tsx` — mobile-first grid/padding, `Backdrop`
- `app/components/Sidebar/index.tsx` + `index.styles.tsx` — drawer + close button
- `app/components/Header/index.tsx` + `index.styles.tsx` — hamburger button
- `package.json` — `lucide-react`

### Verification (Phase A)
1. `npm run dev`; open `/quiz/1`.
2. Desktop (≥768px): sidebar is static in the grid, **no** hamburger — unchanged from today.
3. Resize to ≤767px (or device emulation): sidebar hidden, hamburger visible in header.
4. Tap hamburger → drawer slides in from left over content, backdrop dims the rest.
5. Backdrop click, Escape key, and close (×) button each dismiss the drawer.
6. With drawer open, tap a question → navigates to it **and** the drawer auto-closes.
7. Confirm Playwright MCP at 390px and 1280px widths matches `2-600` / `2-2` layout.

---

## Phase B — Visual restyling to match Figma (outline, executed after Phase A)

Not implemented yet; listed so the sequencing is clear. Each item is styled-components +
theme work, plus broader `lucide-react` icon adoption:
- **Header**: icon-logo + "AWS Prep" wordmark + `SAA-C03` badge; reduce the score area to
  the design's compact "✓ / ✗ / X/Y answered" treatment.
- **Sidebar header**: add the "SAA-C03 / Solutions Architect" heading and the
  **Correct / Wrong / Total** stat boxes shown inside the sidebar in the design (the score
  numbers, currently only passed to `Header`, would also be passed to `Sidebar`); search
  input gains a leading search icon.
- **Icons**: replace Unicode `✓ ✗ →` and chevrons with lucide equivalents (search,
  chevron-left/right, lightbulb for "Explain", check).
- **Spacing / radius / colors**: align card, option-button, and action-bar metrics to the
  Figma frames.

## Phase B — implemented (2026-06-20)

Restyled to the Figma frames (`2-2` / `2-600`) with these decisions (confirmed with
the user where the design changed behaviour, not just looks):
- **Theme** (`app/styles/theme.ts`): added `headerBg`, translucent overlay/hairline
  tokens, `textMono`, `optText`, `fontMono`; tuned `green`/`red` to the Figma values.
  Added **JetBrains Mono** to the font `<link>` in `root.tsx`.
- **Header**: icon mark (lucide `Layers`) + "AWS Prep" + `SAA-C03` badge; compact
  `✓ N` / `✗ N` pills + "N/total answered". Progress bar moved out of the header.
  **Sign-out kept** (design omits it) as a compact utility on the right.
- **Sidebar**: "SAA-C03 / Solutions Architect" heading, Correct/Wrong/Total stat
  boxes (score now passed to `Sidebar`), search input with leading icon, redesigned
  rows (status circle + Q-num + 2-line preview + active chevron, `ITEM_HEIGHT` 38→76),
  and a **Progress footer**. **Filters kept** (design omits them) below search.
- **QuestionCard**: "Q04 / 12" badge + neutral tag (shows "Choose Multiple"; the
  question bank has **no category field**, so the design's category chip is not
  data-driven). **Sticky bottom action bar** (full-bleed via negative margins on the
  `Main` padding): `‹ Prev` (disabled on Q1) · result badge · `Submit Answer`
  (unanswered) / `Next ›`·`Finish` (answered). **Submit kept** — selecting then
  submitting, not auto-submit.
- **OptionButton**: tinted square letter badge, `Check`/`X` mark on reveal,
  explanation as an attached box below the option.
- **Explain button not added** — explanations stay auto-shown on reveal.
- Pure nav helpers extracted to `app/lib/quizNav.ts` with **Vitest** coverage
  (`app/lib/quizNav.test.ts`); added `vitest` + `vitest.config.ts` + `npm test`.
- Verified in code: `npm test` (6 pass), `npm run typecheck`, `npm run build`
  (client + SSR) all green.

## Note on plan storage
Per repo convention, after approval copy this spec to `plan/mobile-first-layout.spec.md`
in the repository before starting implementation.
