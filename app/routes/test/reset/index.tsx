// Action-only route: clears the results for a generated test and redirects to
// its first question. Posted to by the question card's "Reset current test".

import { redirect } from "react-router";

import type { Route } from "./+types/index";
import { requireUserId } from "~/lib/auth/session.server";
import { getTest, resetTest } from "~/lib/generated-test/test.server";

export async function action({ request, params }: Route.ActionArgs) {
  // Sensitive write — verify revocation against the Auth backend.
  const uid = await requireUserId(request, "/login", true);
  const { testId } = params;

  const test = await getTest(uid, testId);
  if (!test) throw new Response("Not Found", { status: 404 });

  await resetTest(uid, testId);
  return redirect(`/test/${testId}/${test.questions[0]}`);
}
