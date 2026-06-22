// Builds sidebar data scoped to a single generated test. Unlike the quiz
// sidebar (which paginates over the full 684-question bank), a test has only 65
// questions, so we always return the full matching set (`windowed: false`) and
// let VirtualizedList handle rendering. Status comes from the test's own
// `results` map rather than global progress.

import type { Result } from "../progress/progress.server";
import { getAllSidebarSource } from "../questions/questions.server";
import type { SidebarData } from "../quiz/sidebar.server";

export interface BuildTestSidebarOptions {
  /** The test's ordered 1-based question nums. */
  questions: number[];
  /** Test-local graded results, keyed by question num (string). */
  results: Record<string, Result>;
  filter?: string;
  q?: string;
}

export function buildTestSidebarData({
  questions,
  results,
  filter = "all",
  q = "",
}: BuildTestSidebarOptions): SidebarData {
  const query = q.trim().toLowerCase();

  // Index the static source by num for O(1) preview/search lookups, and map
  // each test num to its 1-based position so rows read 1–65 regardless of the
  // underlying global question number or any active filter.
  const sourceByNum = new Map(getAllSidebarSource().map((s) => [s.num, s]));
  const positionByNum = new Map(questions.map((num, i) => [num, i + 1]));
  const resultOf = (num: number): Result | null => results[String(num)] ?? null;

  const items = questions
    .map((num) => sourceByNum.get(num))
    .filter((s): s is NonNullable<typeof s> => s != null)
    .filter((s) => {
      const result = resultOf(s.num);
      if (filter === "unanswered" && result) return false;
      if (filter === "correct" && result !== "correct") return false;
      if (filter === "wrong" && result !== "wrong") return false;
      if (query && !s.textLower.includes(query)) return false;
      return true;
    })
    .map((s) => ({
      num: s.num,
      preview: s.preview,
      result: resultOf(s.num),
      displayNum: positionByNum.get(s.num),
    }));

  // `total` is the test size; the list is self-contained (never windowed).
  return { items, total: questions.length, start: 1, windowed: false };
}
