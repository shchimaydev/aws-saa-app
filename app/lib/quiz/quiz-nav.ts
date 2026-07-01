// Pure navigation-target helpers for the quiz. Kept framework-free so the
// edge cases (first question, last question, query-string preservation) are
// unit-testable without rendering a route.

/** Append a query string (already in `key=value&...` form) if non-empty. */
function withQs(path: string, qs: string): string {
  return qs ? `${path}?${qs}` : path;
}

/**
 * Where the "Prev" control points, or `null` at the first question (where it is
 * disabled). `num` is 1-based.
 */
export function prevHref(num: number, qs = ""): string | null {
  if (num <= 1) return null;
  return withQs(`/quiz/${num - 1}`, qs);
}

/**
 * Where the "Next" control points: the following question, or the completion
 * screen once past the last question. `num` is 1-based.
 */
export function nextHref(num: number, total: number, qs = ""): string {
  if (num < total) return withQs(`/quiz/${num + 1}`, qs);
  return withQs("/quiz/complete", qs);
}

/**
 * "Next" within a filtered list: the first matching question after `num`, or the
 * completion screen when none remain. `nums` is the matching set in ascending
 * order. Uses first-greater (not `indexOf`) so it stays correct when `num` has
 * just dropped out of the set — e.g. answering it under the "unanswered" filter.
 */
export function nextInListHref(num: number, nums: number[], qs = ""): string {
  const next = nums.find((n) => n > num);
  return next !== undefined
    ? withQs(`/quiz/${next}`, qs)
    : withQs("/quiz/complete", qs);
}

/**
 * "Prev" within a filtered list: the last matching question before `num`, or
 * `null` at the start (where Prev is disabled). `nums` is ascending.
 */
export function prevInListHref(
  num: number,
  nums: number[],
  qs = "",
): string | null {
  let prev: number | undefined;
  for (const n of nums) {
    if (n < num) prev = n;
    else break;
  }
  return prev !== undefined ? withQs(`/quiz/${prev}`, qs) : null;
}
