// Resource route (loader only) backing the test sidebar's search/filter.
// A test has only 65 questions, so the response is always the full matching set
// (no windowing); the fetcher still uses it for consistency with the quiz.
//
//   GET /test/:testId/api/sidebar?filter=<all|...>&q=<text>  -> SidebarData

import type { Route } from "./+types/index";
import { requireSessionUser } from "~/lib/auth/session.server";
import { getTest } from "~/lib/generated-test/test.server";
import { buildTestSidebarData } from "~/lib/generated-test/test-sidebar.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireSessionUser(request);
  const test = await getTest(user.uid, params.testId);
  if (!test) throw new Response("Not Found", { status: 404 });

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const q = url.searchParams.get("q") ?? "";

  return buildTestSidebarData({
    questions: test.questions,
    results: test.results,
    filter,
    q,
  });
}
