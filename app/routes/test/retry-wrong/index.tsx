// Action-only route: clears just the wrong answers for a generated test, then
// redirects to the first question that was answered wrong (now unanswered) with
// the sidebar filtered to "unanswered". Posted to by the question card's "Try
// failed questions again".

import { redirect } from "react-router";

import type { Route } from "./+types/index";
import { requireUserId } from "~/lib/auth/session.server";
import {
  getTest,
  resetTestWrongAnswers,
} from "~/lib/generated-test/test.server";

export async function action({ request, params }: Route.ActionArgs) {
  // Sensitive write — verify revocation against the Auth backend.
  const uid = await requireUserId(request, "/login", true);
  const { testId } = params;

  const test = await getTest(uid, testId);
  if (!test) throw new Response("Not Found", { status: 404 });

  await resetTestWrongAnswers(uid, testId);

  // `test` was read before the reset, so its results still mark the wrong
  // answers — jump to the first one (now unanswered) in test order.
  const target =
    test.questions.find((num) => test.results[String(num)] === "wrong") ??
    test.questions[0];
  return redirect(`/test/${testId}/${target}?filter=unanswered`);
}
