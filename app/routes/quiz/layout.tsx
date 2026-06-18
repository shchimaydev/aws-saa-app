import { Outlet } from "react-router";
import styled from "styled-components";

import type { Route } from "./+types/layout";
import { requireSessionUser } from "~/lib/session.server";
import { getProgress } from "~/lib/progress.server";
import { getSidebarSource, TOTAL_QUESTIONS } from "~/lib/questions.server";
import Header from "~/components/Header";
import Sidebar from "~/components/Sidebar";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireSessionUser(request);
  const progress = await getProgress(user.uid);

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const items = getSidebarSource()
    .map((s) => ({
      num: s.num,
      preview: s.preview,
      textLower: s.textLower,
      result: progress.results[String(s.num - 1)] ?? null,
    }))
    .filter((s) => {
      if (filter === "unanswered" && s.result) return false;
      if (filter === "correct" && s.result !== "correct") return false;
      if (filter === "wrong" && s.result !== "wrong") return false;
      if (q && !s.textLower.includes(q)) return false;
      return true;
    })
    .map(({ num, preview, result }) => ({ num, preview, result }));

  return {
    user: { name: user.name, photoURL: user.picture },
    score: progress.score,
    total: TOTAL_QUESTIONS,
    items,
  };
}

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  flex: 1;
  min-height: 0;
  height: calc(100vh - 57px);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Main = styled.div`
  overflow-y: auto;
  padding: 28px 32px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export default function QuizLayout({ loaderData }: Route.ComponentProps) {
  const { user, score, total, items } = loaderData;
  return (
    <>
      <Header
        correct={score.correct}
        wrong={score.wrong}
        total={total}
        user={user}
      />
      <LayoutGrid>
        <Sidebar items={items} />
        <Main>
          <Outlet />
        </Main>
      </LayoutGrid>
    </>
  );
}
