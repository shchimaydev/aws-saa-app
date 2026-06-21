import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";

import type { Route } from "./+types/index";
import { requireSessionUser } from "~/lib/session.server";
import { getProgress } from "~/lib/progress.server";
import { TOTAL_QUESTIONS } from "~/lib/questions.server";
import { buildSidebarData } from "~/lib/sidebar.server";
import Header from "~/components/Header";
import Sidebar from "~/components/Sidebar";
import { Shell, LayoutGrid, Main, Backdrop } from "./index.styles";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireSessionUser(request);
  const progress = await getProgress(user.uid, request);

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const q = url.searchParams.get("q") ?? "";
  // Anchor pagination on the selected question (/quiz/:num); none → window from 1.
  const match = url.pathname.match(/\/quiz\/(\d+)/);
  const anchor = match ? Number(match[1]) : undefined;

  const sidebar = buildSidebarData({
    results: progress.results,
    anchor,
    filter,
    q,
  });

  return {
    user: { name: user.name, photoURL: user.picture },
    score: progress.score,
    total: TOTAL_QUESTIONS,
    sidebar,
  };
}

export default function QuizLayout({ loaderData }: Route.ComponentProps) {
  const { user, score, total, sidebar } = loaderData;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // The layout route persists across child navigations, so closing on a
  // pathname change reliably dismisses the drawer after picking a question.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Escape closes the drawer while it's open.
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
        />
        <Backdrop $open={drawerOpen} onClick={() => setDrawerOpen(false)} />
        <Main>
          <Outlet />
        </Main>
      </LayoutGrid>
    </Shell>
  );
}
