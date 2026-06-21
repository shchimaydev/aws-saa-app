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
