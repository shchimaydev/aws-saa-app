// Pure navigation-target helpers for a generated test. Analogous to quizNav,
// but prev/next walk the test's ordered `questions` array (the nums aren't
// contiguous), and the last question leads to the test's completion screen.

/** Append a query string (already in `key=value&...` form) if non-empty. */
function withQs(path: string, qs: string): string {
  return qs ? `${path}?${qs}` : path;
}

/**
 * Where "Prev" points within a test, or `null` at the first question (disabled).
 * `num` is the current 1-based question num; `questions` is the test's order.
 */
export function testPrevHref(
  testId: string,
  num: number,
  questions: number[],
  qs = "",
): string | null {
  const idx = questions.indexOf(num);
  if (idx <= 0) return null;
  return withQs(`/test/${testId}/${questions[idx - 1]}`, qs);
}

/**
 * Where "Next" points within a test: the following question, or the completion
 * screen once past the last question (also the fallback if `num` isn't found).
 */
export function testNextHref(
  testId: string,
  num: number,
  questions: number[],
  qs = "",
): string {
  const idx = questions.indexOf(num);
  if (idx >= 0 && idx < questions.length - 1) {
    return withQs(`/test/${testId}/${questions[idx + 1]}`, qs);
  }
  return withQs(`/test/${testId}/complete`, qs);
}

/**
 * "Next" within a filtered test: walk the test's order from the current position
 * and return the first question that's in `allowed`, or the completion screen.
 * `num` is always present in `questions` (it's a test question), so the walk is
 * anchored by index — robust even when `num` itself left `allowed` (e.g. it was
 * just answered under the "unanswered" filter).
 */
export function testNextInListHref(
  testId: string,
  num: number,
  questions: number[],
  allowed: Set<number>,
  qs = "",
): string {
  const idx = questions.indexOf(num);
  for (let i = idx + 1; i < questions.length; i++) {
    if (allowed.has(questions[i])) {
      return withQs(`/test/${testId}/${questions[i]}`, qs);
    }
  }
  return withQs(`/test/${testId}/complete`, qs);
}

/**
 * "Prev" within a filtered test: the previous question in the test's order that's
 * in `allowed`, or `null` at the start (where Prev is disabled).
 */
export function testPrevInListHref(
  testId: string,
  num: number,
  questions: number[],
  allowed: Set<number>,
  qs = "",
): string | null {
  const idx = questions.indexOf(num);
  for (let i = idx - 1; i >= 0; i--) {
    if (allowed.has(questions[i])) {
      return withQs(`/test/${testId}/${questions[i]}`, qs);
    }
  }
  return null;
}
