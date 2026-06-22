// Entry point for "the latest generated test": redirect to its first question,
// or to /quiz when the user hasn't generated one yet.

import { redirect } from "react-router";

import type { Route } from "./+types/index";
import { requireUserId } from "~/lib/auth/session.server";
import { getLatestTestId, getTest } from "~/lib/generated-test/test.server";

export async function loader({ request }: Route.LoaderArgs) {
  const uid = await requireUserId(request);
  const testId = await getLatestTestId(uid);
  if (!testId) throw redirect("/quiz");

  const test = await getTest(uid, testId, request);
  // A test always has questions; fall back to /quiz defensively if not.
  if (!test || test.questions.length === 0) throw redirect("/quiz");
  throw redirect(`/test/${testId}/${test.questions[0]}`);
}

export default function TestIndex() {
  return null;
}
