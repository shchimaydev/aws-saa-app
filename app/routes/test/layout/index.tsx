import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router";

import type { Route } from "./+types/index";
import { requireSessionUser } from "~/lib/auth/session.server";
import { getTest } from "~/lib/generated-test/test.server";
import { buildTestSidebarData } from "~/lib/generated-test/test-sidebar.server";
import Header from "~/components/Header";
import Sidebar from "~/components/Sidebar";
// Reuse the quiz layout's styled shell — identical chrome, no need to fork it.
import {
  Shell,
  LayoutGrid,
  Main,
  Backdrop,
} from "~/routes/quiz/layout/index.styles";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireSessionUser(request);
  const testId = params.testId;
  const test = await getTest(user.uid, testId, request);
  if (!test) throw new Response("Not Found", { status: 404 });

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const q = url.searchParams.get("q") ?? "";

  const sidebar = buildTestSidebarData({
    questions: test.questions,
    results: test.results,
    filter,
    q,
  });

  return {
    user: { name: user.name, photoURL: user.picture },
    score: test.score,
    total: test.questions.length,
    sidebar,
    testId,
  };
}

export default function TestLayout({ loaderData }: Route.ComponentProps) {
  const { user, score, total, sidebar, testId } = loaderData;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Stable per-test link builder so the sidebar's renderItem memo holds.
  const hrefFor = useMemo(
    () => (num: number) => `/test/${testId}/${num}`,
    [testId],
  );

  // The layout persists across child navigations; close the drawer on each.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <Shell>
      <Header
        correct={score.correct}
        wrong={score.wrong}
        total={total}
        user={user}
        onMenuClick={() => setDrawerOpen(true)}
      />
      <LayoutGrid>
        <Sidebar
          sidebar={sidebar}
          correct={score.correct}
          wrong={score.wrong}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          apiPath={`/test/${testId}/api/sidebar`}
          hrefFor={hrefFor}
        />
        <Backdrop $open={drawerOpen} onClick={() => setDrawerOpen(false)} />
        <Main>
          <Outlet />
        </Main>
      </LayoutGrid>
    </Shell>
  );
}
