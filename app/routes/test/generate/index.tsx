// Action-only route: generates a fresh mock exam and redirects to its first
// question. Posted to by the header's "Generate Test" button.

import { redirect } from "react-router";

import type { Route } from "./+types/index";
import { requireUserId } from "~/lib/auth/session.server";
import { createTest } from "~/lib/generated-test/test.server";

export async function action({ request }: Route.ActionArgs) {
  // Sensitive write — verify revocation against the Auth backend.
  const uid = await requireUserId(request, "/login", true);
  const { testId, questions } = await createTest(uid);
  return redirect(`/test/${testId}/${questions[0]}`);
}
