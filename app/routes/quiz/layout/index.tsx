import { Outlet } from "react-router";

import type { Route } from "./+types/index";
import { requireSessionUser } from "~/lib/session.server";
import { getProgress } from "~/lib/progress.server";
import { TOTAL_QUESTIONS } from "~/lib/questions.server";
import { buildSidebarData } from "~/lib/sidebar.server";
import Header from "~/components/Header";
import Sidebar from "~/components/Sidebar";
import { Shell, LayoutGrid, Main } from "./index.styles";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireSessionUser(request);
  const progress = await getProgress(user.uid, request);

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const q = url.searchParams.get("q") ?? "";
  // Anchor pagination on the selected question (/quiz/:num); none → window from 1.
  const match = url.pathname.match(/\/quiz\/(\d+)/);
  const anchor = match ? Number(match[1]) : undefined;

  const sidebar = buildSidebarData({ results: progress.results, anchor, filter, q });

  return {
    user: { name: user.name, photoURL: user.picture },
    score: progress.score,
    total: TOTAL_QUESTIONS,
    sidebar,
  };
}

export default function QuizLayout({ loaderData }: Route.ComponentProps) {
  const { user, score, total, sidebar } = loaderData;
  return (
    <Shell>
      <Header
        correct={score.correct}
        wrong={score.wrong}
        total={total}
        user={user}
      />
      <LayoutGrid>
        <Sidebar sidebar={sidebar} />
        <Main>
          <Outlet />
        </Main>
      </LayoutGrid>
    </Shell>
  );
}
