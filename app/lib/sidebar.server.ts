// Shared builder for the sidebar question index, used by both the quiz layout
// loader (initial render) and the /quiz/api/sidebar resource route (infinite
// scroll). Pagination only applies to plain browsing — when a search query or a
// status filter is active we return the full matching set (search-all).

import type { Result } from "./progress.server";
import {
  getAllSidebarSource,
  getSidebarSource,
  TOTAL_QUESTIONS,
} from "./questions.server";

export interface SidebarItem {
  num: number;
  preview: string;
  result: Result | null;
}

export interface SidebarData {
  items: SidebarItem[];
  /** Total questions in the bank (the virtual list's full extent). */
  total: number;
  /** 1-based `num` of `items[0]` within the full bank — positions the window. */
  start: number;
  /** True when `items` is a paginated window; false when it's a full filter result. */
  windowed: boolean;
}

export interface BuildSidebarOptions {
  /** Per-user graded results, keyed by 0-based question index. */
  results: Record<string, Result>;
  /** Currently selected question `num`; anchors the pagination window. */
  anchor?: number;
  filter?: string;
  q?: string;
}

export function buildSidebarData({
  results,
  anchor,
  filter = "all",
  q = "",
}: BuildSidebarOptions): SidebarData {
  const query = q.trim().toLowerCase();
  const filtering = query !== "" || filter !== "all";

  const resultOf = (num: number): Result | null => results[String(num - 1)] ?? null;

  if (filtering) {
    const items = getAllSidebarSource()
      .filter((s) => {
        const result = resultOf(s.num);
        if (filter === "unanswered" && result) return false;
        if (filter === "correct" && result !== "correct") return false;
        if (filter === "wrong" && result !== "wrong") return false;
        if (query && !s.textLower.includes(query)) return false;
        return true;
      })
      .map((s) => ({ num: s.num, preview: s.preview, result: resultOf(s.num) }));

    // A filter/search result is rendered as its own self-contained list, so its
    // `start`/`total` are local to the result set (not the full bank).
    return { items, total: items.length, start: 1, windowed: false };
  }

  const win = getSidebarSource(anchor);
  const items = win.items.map((s) => ({
    num: s.num,
    preview: s.preview,
    result: resultOf(s.num),
  }));

  return { items, total: TOTAL_QUESTIONS, start: win.start, windowed: true };
}
