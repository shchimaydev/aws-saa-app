import { redirect, useNavigation } from "react-router";

import type { Route } from "./+types/index";
import { requireUserId } from "~/lib/session.server";
import { getProgress, resetProgress } from "~/lib/progress.server";
import { TOTAL_QUESTIONS } from "~/lib/questions.server";
import Completion from "~/components/Completion";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Complete — AWS SAA Quiz" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const uid = await requireUserId(request);
  const progress = await getProgress(uid);
  return {
    correct: progress.score.correct,
    wrong: progress.score.wrong,
    total: TOTAL_QUESTIONS,
  };
}

export async function action({ request }: Route.ActionArgs) {
  // Sensitive write — verify revocation against the Auth backend.
  const uid = await requireUserId(request, "/login", true);
  await resetProgress(uid);
  return redirect("/quiz/1");
}

export default function QuizComplete({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  return (
    <Completion
      correct={loaderData.correct}
      wrong={loaderData.wrong}
      total={loaderData.total}
      restarting={navigation.state !== "idle"}
    />
  );
}
