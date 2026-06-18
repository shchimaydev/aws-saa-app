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
  if (!Number.isInteger(num) || num < 1 || num > QUESTIONS.length) return undefined;
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

/** Sidebar entries plus searchable text — used to filter server-side in the loader. */
export function getSidebarSource(): SidebarSource[] {
  return QUESTIONS.map((q) => ({
    num: q.num,
    preview: q.text.replace(/\s+/g, " ").substring(0, 55),
    textLower: q.text.toLowerCase(),
  }));
}
