// Server-only access to the static question bank.
// The `.server.ts` suffix guarantees this (and the ~1.1 MB JSON it imports) is
// never bundled into the client.

import questionsData from "../data/questions.json";
import type { Question, SidebarEntry } from "../types/questions";

// Re-export the shared types so existing `from "~/lib/questions.server"` imports
// keep working; the canonical definitions live in app/types/questions.ts.
export type { Question, SidebarEntry };

// `as unknown as` avoids tsc inferring the giant literal type of the JSON.
const QUESTIONS = questionsData as unknown as Question[];

/** Total number of questions in the bank (684). */
export const TOTAL_QUESTIONS = QUESTIONS.length;

/**
 * Fetch a single question by its 1-based `num`. Returns `undefined` for
 * out-of-range numbers so callers can 404. (nums are contiguous 1..TOTAL.)
 */
export function getQuestion(num: number): Question | undefined {
  if (!Number.isInteger(num) || num < 1 || num > QUESTIONS.length)
    return undefined;
  return QUESTIONS[num - 1];
}

/**
 * Static index for the sidebar list. Per-user `result` is overlaid from
 * progress in the quiz layout loader (kept out of here so this stays user-agnostic).
 */
export function getSidebarIndex(): SidebarEntry[] {
  return QUESTIONS.map((q) => ({
    num: q.num,
    preview: q.text.replace(/\s+/g, " ").substring(0, 55),
  }));
}

export interface SidebarSource extends SidebarEntry {
  /** Lowercased full text, for server-side search (never sent to the client). */
  textLower: string;
}

/** Built once: the full searchable index, reused by every request. */
const ALL_SOURCES: SidebarSource[] = QUESTIONS.map((q) => ({
  num: q.num,
  preview: q.text.replace(/\s+/g, " ").substring(0, 55),
  textLower: q.text.toLowerCase(),
}));

// The window must be comfortably larger than the visible viewport (plus its
// prefetch buffer) so scrolling within a freshly-centered window doesn't
// immediately ask for the next one.
/** Number of entries returned per sidebar window. */
export const SIDEBAR_WINDOW_SIZE = 61;
/** How many entries to keep before the anchor when a full window fits. */
const SIDEBAR_WINDOW_BEFORE = 30;

export interface SidebarWindow {
  /** The windowed slice of sidebar entries (1-based `num`s, contiguous). */
  items: SidebarSource[];
  /** First `num` in the window. */
  start: number;
  /** Last `num` in the window. */
  end: number;
  /** True when entries exist before `start`. */
  hasBefore: boolean;
  /** True when entries exist after `end`. */
  hasAfter: boolean;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(n, hi));

/**
 * A {@link SIDEBAR_WINDOW_SIZE}-entry window of the sidebar index, anchored on
 * `quizNumber` so the caller can paginate around a question. The window is
 * centered on the anchor ({@link SIDEBAR_WINDOW_BEFORE} before) but clamped to
 * the bank, then extended forward to a full window — e.g. anchor 1 → 1‑61,
 * anchor 100 → 70‑130. Defaults to anchor 1 when no quiz is selected.
 */
export function getSidebarSource(quizNumber?: number): SidebarWindow {
  if (TOTAL_QUESTIONS === 0) {
    return { items: [], start: 0, end: 0, hasBefore: false, hasAfter: false };
  }
  const anchor = clamp(quizNumber ?? 1, 1, TOTAL_QUESTIONS);
  const maxStart = Math.max(1, TOTAL_QUESTIONS - (SIDEBAR_WINDOW_SIZE - 1));
  const start = clamp(anchor - SIDEBAR_WINDOW_BEFORE, 1, maxStart);
  const end = Math.min(TOTAL_QUESTIONS, start + SIDEBAR_WINDOW_SIZE - 1);
  return {
    items: ALL_SOURCES.slice(start - 1, end),
    start,
    end,
    hasBefore: start > 1,
    hasAfter: end < TOTAL_QUESTIONS,
  };
}

/** The complete sidebar index — used for server-side search/filter (no window). */
export function getAllSidebarSource(): SidebarSource[] {
  return ALL_SOURCES;
}
